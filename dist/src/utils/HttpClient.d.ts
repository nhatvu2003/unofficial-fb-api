/**
 * HTTP Client Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import type { Jar, HttpRequestContext, HttpOptions, CustomHeader, HttpResponse } from "../../types/HttpClientTypes.js";
/**
 * HttpClient
 *
 * Lightweight HTTP utility wrapping `got` with a simple in-memory cookie jar
 * and convenient helpers for JSON/string form posts, multipart form uploads,
 * and optional proxy support. Methods return a consistent `HttpResponse` shape.
 */
declare class HttpClient {
    /** internal proxy agent instance (kept untyped to support different agent shapes) */
    static proxyAgent: unknown | null;
    /** Default headers applied to most requests */
    static headers: Record<string, string>;
    /** Default request timeout (ms) */
    private static readonly DEFAULT_TIMEOUT_MS;
    /**
     * Build an `agent` object suitable for passing to `got`.
     * Returns `undefined` if no proxy is configured.
     */
    private static getAgent;
    /**
     * Normalize plain-object values by JSON-stringifying them in-place.
     * This is useful for query-string or x-www-form-urlencoded POST bodies.
     */
    private static normalizeObjectValues;
    /**
     * Configure an HTTP(S) proxy for outbound requests.
     * Accepts a proxy URL (e.g. `http://127.0.0.1:8080`) or `null` to disable.
     */
    static setProxy(proxy: string | null): void;
    static makeJar(): Jar;
    static getHeaders(url: string, options?: HttpOptions, ctx?: HttpRequestContext, customHeader?: CustomHeader): Record<string, string>;
    static isReadableStream(obj: unknown): boolean;
    static getType(obj: unknown): string;
    /**
     * Perform a simple GET request without cookies and return the raw response.
     * Primarily useful for health checks or fetching static resources.
     */
    static cleanGet(url: string): Promise<HttpResponse>;
    /**
     * Perform a GET request using an optional cookie jar and search parameters.
     * Normalizes object values in `qs` and returns a consistent `HttpResponse`.
     */
    static get(url: string, jar?: Jar, qs?: Record<string, any>, options?: HttpOptions, ctx?: HttpRequestContext, customHeader?: CustomHeader): Promise<HttpResponse>;
    /**
     * Perform a POST request with `application/x-www-form-urlencoded` body.
     * `form` may contain nested plain objects which will be JSON-stringified.
     */
    static post(url: string, jar?: Jar, form?: Record<string, any>, options?: HttpOptions, ctx?: HttpRequestContext, customHeader?: CustomHeader): Promise<HttpResponse>;
    /**
     * Perform a multipart/form-data POST. `form` values may be strings, buffers
     * or streams; file-like values should be supplied by the caller.
     */
    static postFormData(url: string, jar?: Jar, form?: Record<string, any>, qs?: Record<string, any>, options?: HttpOptions, ctx?: HttpRequestContext): Promise<HttpResponse>;
}
export default HttpClient;
//# sourceMappingURL=HttpClient.d.ts.map