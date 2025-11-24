/**
 * HTTP Client Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import got from "got";
import { CookieJar } from "tough-cookie";
import FormData from "form-data";
import HttpsProxyAgent from "https-proxy-agent";
import querystring from "querystring";
import stream from "stream";
import UserAgent from "./UserAgents.js";
import Logger from "./Logger.js";
/**
 * HttpClient
 *
 * Lightweight HTTP utility wrapping `got` with a simple in-memory cookie jar
 * and convenient helpers for JSON/string form posts, multipart form uploads,
 * and optional proxy support. Methods return a consistent `HttpResponse` shape.
 */
class HttpClient {
    /** internal proxy agent instance (kept untyped to support different agent shapes) */
    static proxyAgent = null;
    /** Default headers applied to most requests */
    static headers = {
        "content-type": "application/x-www-form-urlencoded",
        referer: "https://www.facebook.com/",
        origin: "https://www.facebook.com",
        connection: "keep-alive",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
    };
    /** Default request timeout (ms) */
    static DEFAULT_TIMEOUT_MS = 60_000;
    /**
     * Build an `agent` object suitable for passing to `got`.
     * Returns `undefined` if no proxy is configured.
     */
    static getAgent() {
        return HttpClient.proxyAgent
            ? { http: HttpClient.proxyAgent, https: HttpClient.proxyAgent }
            : undefined;
    }
    /**
     * Normalize plain-object values by JSON-stringifying them in-place.
     * This is useful for query-string or x-www-form-urlencoded POST bodies.
     */
    static normalizeObjectValues(obj) {
        if (!obj)
            return;
        for (const k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k) &&
                HttpClient.getType(obj[k]) === "Object") {
                try {
                    obj[k] = JSON.stringify(obj[k]);
                }
                catch {
                    // leave value as-is on stringify failure
                }
            }
        }
    }
    /**
     * Configure an HTTP(S) proxy for outbound requests.
     * Accepts a proxy URL (e.g. `http://127.0.0.1:8080`) or `null` to disable.
     */
    static setProxy(proxy) {
        // https-proxy-agent may export different shapes across versions; construct defensively
        HttpClient.proxyAgent = proxy ? new HttpsProxyAgent(proxy) : null;
    }
    static makeJar() {
        const toughJar = new CookieJar();
        const store = {};
        function normalizeDomain(url) {
            try {
                return new URL(url).hostname;
            }
            catch {
                return String(url || "");
            }
        }
        /**
         * Returned jar implements a tiny in-memory cookie store that stays in sync
         * with a real `tough-cookie` jar (best-effort). Useful for libraries that
         * expect a synchronous cookie-string API.
         */
        return {
            /**
             * Add a cookie string to the in-memory store and try to sync with `tough-cookie`.
             */
            setCookie(cookieStr, url) {
                try {
                    const first = String(cookieStr || "").split(";")[0] || "";
                    const idx = first.indexOf("=");
                    const name = idx === -1 ? "" : first.slice(0, idx);
                    const value = idx === -1 ? "" : first.slice(idx + 1);
                    const domain = normalizeDomain(url);
                    if (!store[domain])
                        store[domain] = [];
                    store[domain] = store[domain].filter((c) => c.name !== name);
                    store[domain].push({
                        name,
                        value,
                        cookieString: () => `${name}=${value}`,
                    });
                }
                catch {
                    // ignore errors
                }
                try {
                    // best-effort keep tough-cookie jar in sync
                    toughJar.setCookie &&
                        toughJar.setCookie(cookieStr, url, () => { });
                }
                catch {
                    try {
                        toughJar.setCookieSync &&
                            toughJar.setCookieSync(cookieStr, url);
                    }
                    catch { }
                }
            },
            /**
             * Get structured cookie objects for a given URL/domain.
             */
            getCookies(url) {
                const domain = normalizeDomain(url);
                return (store[domain] || []).map((c) => ({
                    name: c.name,
                    value: c.value,
                    cookieString: () => `${c.name}=${c.value}`,
                }));
            },
            /**
             * Return a synchronous cookie header string for the given URL/domain.
             */
            getCookieString(url) {
                const domain = normalizeDomain(url);
                return (store[domain] || [])
                    .map((c) => `${c.name}=${c.value}`)
                    .join("; ");
            },
            _tough: toughJar,
        };
    }
    static getHeaders(url, options, ctx, customHeader) {
        const headers = {
            host: new URL(url).hostname,
            ...HttpClient.headers,
            "User-Agent": customHeader?.customUserAgent ??
                options?.userAgent ??
                UserAgent.getDefault(),
        };
        if (ctx?.region)
            headers["X-MSGR-Region"] = ctx.region;
        if (customHeader) {
            Object.assign(headers, customHeader);
            if (customHeader.noRef)
                delete headers.referer;
        }
        return headers;
    }
    static isReadableStream(obj) {
        return (obj instanceof stream.Stream &&
            typeof obj._read === "function" &&
            HttpClient.getType(obj._readableState) === "Object");
    }
    static getType(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    }
    /**
     * Perform a simple GET request without cookies and return the raw response.
     * Primarily useful for health checks or fetching static resources.
     */
    static async cleanGet(url) {
        const res = await got(url, {
            timeout: { request: 60000 },
            agent: (HttpClient.proxyAgent
                ? { http: HttpClient.proxyAgent, https: HttpClient.proxyAgent }
                : undefined),
        });
        return {
            statusCode: res.statusCode,
            body: res.body,
            headers: res.headers,
            request: { uri: new URL(url) },
        };
    }
    /**
     * Perform a GET request using an optional cookie jar and search parameters.
     * Normalizes object values in `qs` and returns a consistent `HttpResponse`.
     */
    static async get(url, jar, qs, options, ctx, customHeader) {
        HttpClient.normalizeObjectValues(qs);
        const headers = HttpClient.getHeaders(url, options, ctx, customHeader);
        const cookieJar = jar || HttpClient.makeJar();
        try {
            const res = await got(url, {
                method: "GET",
                searchParams: qs,
                headers,
                cookieJar: cookieJar._tough,
                timeout: { request: HttpClient.DEFAULT_TIMEOUT_MS },
                responseType: "text",
                agent: HttpClient.getAgent(),
            });
            return {
                statusCode: res.statusCode,
                body: res.body,
                headers: res.headers,
                request: { uri: new URL(url), headers, method: "GET" },
            };
        }
        catch (err) {
            Logger.error("GET request failed", err?.message ?? err, { url });
            throw err;
        }
    }
    /**
     * Perform a POST request with `application/x-www-form-urlencoded` body.
     * `form` may contain nested plain objects which will be JSON-stringified.
     */
    static async post(url, jar, form, options, ctx, customHeader) {
        HttpClient.normalizeObjectValues(form);
        const headers = HttpClient.getHeaders(url, options, ctx, customHeader);
        headers["content-type"] =
            headers["content-type"] || "application/x-www-form-urlencoded";
        const body = querystring.stringify(form || {});
        const cookieJar = jar || HttpClient.makeJar();
        try {
            const res = await got.post(url, {
                headers,
                body,
                cookieJar: cookieJar._tough,
                timeout: { request: HttpClient.DEFAULT_TIMEOUT_MS },
                responseType: "text",
                agent: HttpClient.getAgent(),
            });
            return {
                statusCode: res.statusCode,
                body: res.body,
                headers: res.headers,
                request: {
                    uri: new URL(url),
                    headers,
                    method: "POST",
                    ...(form ? { formData: form } : {}),
                },
            };
        }
        catch (err) {
            Logger.error("POST request failed", err?.message ?? err, {
                url,
                formSize: body?.length ?? 0,
            });
            throw err;
        }
    }
    /**
     * Perform a multipart/form-data POST. `form` values may be strings, buffers
     * or streams; file-like values should be supplied by the caller.
     */
    static async postFormData(url, jar, form, qs, options, ctx) {
        HttpClient.normalizeObjectValues(qs);
        const headers = HttpClient.getHeaders(url, options, ctx, {
            "content-type": "multipart/form-data",
        });
        const fd = new FormData();
        if (form) {
            for (const k in form) {
                if (Object.prototype.hasOwnProperty.call(form, k))
                    fd.append(k, form[k]);
            }
        }
        const cookieJar = jar || HttpClient.makeJar();
        try {
            const res = await got.post(url, {
                headers: Object.assign({}, headers, fd.getHeaders()),
                body: fd,
                searchParams: qs,
                cookieJar: cookieJar._tough,
                timeout: { request: HttpClient.DEFAULT_TIMEOUT_MS },
                responseType: "text",
                agent: HttpClient.getAgent(),
            });
            return {
                statusCode: res.statusCode,
                body: res.body,
                headers: res.headers,
                request: {
                    uri: new URL(url),
                    headers,
                    method: "POST",
                    ...(form ? { formData: form } : {}),
                },
            };
        }
        catch (err) {
            Logger.error("POST FormData request failed", err?.message ?? err, {
                url,
            });
            throw err;
        }
    }
}
export default HttpClient;
//# sourceMappingURL=HttpClient.js.map