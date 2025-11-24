/**
 * Base API Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import type { ConfigTypes, BuildApiContext } from "../types/CreateApiTypes.js";

/**
 * Base class for all API modules in the Facebook Messenger API
 * 
 * Provides common functionality and structure for all API modules including:
 * - Shared context access (authentication, tokens, user info)
 * - Configuration management
 * - Common error handling patterns
 * - Consistent logging interface
 * 
 * All specific API modules (Message, User, Thread) inherit from this base
 * to ensure consistent behavior and shared utilities.
 * 
 * @abstract
 * @example
 * ```typescript
 * export class MessageModule extends BaseAPIModule {
 *   async sendMessage(message: string, threadID: string) {
 *     // Access shared context
 *     const { userID, fb_dtsg } = this.ctx;
 *     const { timeout, showLogs } = this.config;
 *     
 *     // Use inherited methods
 *     this.validateRequired({ message, threadID });
 *     return this.makeRequest('/messages/send', data);
 *   }
 * }
 * ```
 */
import HttpClient from "../src/utils/HttpClient.js";
import { Cookie as ToughCookie } from 'tough-cookie';
import fs from 'fs';
import { ErrorHandler, ErrorType } from "../src/utils/ErrorHandler.js";
import Logger from "../src/utils/Logger.js";
import { FacebookConstants } from "../src/constants/FacebookConstants.js";

/**
 * Abstract base class for all Facebook Messenger API modules
 * 
 * Provides shared functionality and utilities that all API modules need:
 * - HTTP request handling with proper Facebook headers
 * - Cookie management for session persistence  
 * - Error handling and logging
 * - Common validation and formatting utilities
 * - Context and configuration access
 * 
 * @abstract
 * @example
 * ```typescript
 * class CustomModule extends BaseAPIModule {
 *   async customAction(param: string) {
 *     // Access shared context
 *     const { userID, fb_dtsg } = this.ctx;
 *     
 *     // Make authenticated request
 *     return this.makeRequest('/endpoint', { param });
 *   }
 * }
 * ```
 */
export abstract class BaseAPIModule {
    protected ctx: BuildApiContext;
    protected config: Required<ConfigTypes>;

    constructor(ctx: BuildApiContext, config: Required<ConfigTypes>) {
        this.ctx = ctx;
        this.config = config;
    }


    protected saveCookies(res: any): any {
        const cookies = res.headers?.["set-cookie"] || [];
        cookies.forEach((c: string) => {
            try {
                // Try setting cookie for facebook host if it looks like a facebook cookie
                if (/facebook\.com/i.test(c)) {
                    const maybePromise = this.setCookieSafe(c, "https://www.facebook.com");
                    if (maybePromise && typeof (maybePromise as any).then === 'function') {
                        (maybePromise as any).catch(() => { });
                    }
                }

                // Build a messenger-safe variant by parsing the cookie and reconstructing
                // with a messenger domain/path. This avoids handing a cookie string that
                // declares Domain=.facebook.com to the messenger host (which tough-cookie rejects).
                try {
                    const parsed = ToughCookie.parse(c);
                    const messengerUrl = "https://www.messenger.com";
                    if (parsed) {
                        const key = parsed.key;
                        const value = parsed.value || '';
                        const path = parsed.path || '/';
                        const attrs: string[] = [];
                        // Keep Secure/HttpOnly flags if present
                        if (parsed.secure) attrs.push('Secure');
                        if ((parsed as any).httpOnly) attrs.push('HttpOnly');
                        // Prefer an explicit messenger domain
                        const messengerCookieStr = `${key}=${value}; Path=${path}; Domain=.messenger.com${attrs.length ? ('; ' + attrs.join('; ')) : ''}`;
                        const attempt = this.setCookieSafe(messengerCookieStr, messengerUrl);
                        if (attempt && typeof (attempt as any).then === 'function') {
                            (attempt as any).catch(() => {
                                // Fallback: strip domain attribute and retry as host-only
                                try { this.setCookieSafe(`${key}=${value}; Path=${path}`, messengerUrl); } catch (e) { /* ignore */ }
                            });
                        }
                    } else {
                        // If parsing failed, fallback to previous safe heuristic: strip domain and try
                        const stripped = c.replace(/;?\s*domain=[^;]+/i, '');
                        try { this.setCookieSafe(stripped, "https://www.messenger.com"); } catch (e) { /* ignore */ }
                    }
                } catch (ee) {
                    // Non-fatal: continue
                }
            } catch (e) {
                // Non-fatal: continue
            }
        });
        // After handling Set-Cookie headers, attempt to ensure messenger host has essential cookies
        try {
            this.syncKeyCookiesToMessenger();
        } catch (e) {
            try {
                if (this.config && this.config.developmentLog) fs.appendFileSync('./dist/test/cookie_set_errors.log', `syncKeyCookiesToMessenger error: ${String(e)}\n`);
            } catch {}
        }
        return res;
    }

    /**
     * Copy essential cookies from facebook jar into messenger host as host-only cookies.
     * This is a best-effort helper to improve messenger-side session availability.
     */
    protected syncKeyCookiesToMessenger(): void {
        try {
            const jar: any = this.ctx && this.ctx.cookieJar;
            if (!jar) return;
            // Prefer sync retrieval
            let cookieStrFB = '';
            try {
                if (typeof jar.getCookieStringSync === 'function') cookieStrFB = jar.getCookieStringSync('https://www.facebook.com') || '';
                else if (jar._tough && typeof jar._tough.getCookieString === 'function') jar._tough.getCookieString('https://www.facebook.com', (e: any, v: any) => { cookieStrFB = v || ''; });
            } catch (e) { cookieStrFB = ''; }

            if (!cookieStrFB) return;

            // pick core cookies to copy
            const keys = ['c_user','xs','presence','sb','datr'];
            for (const key of keys) {
                const m = cookieStrFB.match(new RegExp(`${key}=([^;]+)`));
                if (m && m[1]) {
                    const val = m[1];
                    const cookieLine = `${key}=${val}; Path=/`;
                    try {
                        const res = this.setCookieSafe(cookieLine, 'https://www.messenger.com');
                        // Log success for diagnostics
                        try { if (this.config && this.config.developmentLog) fs.appendFileSync('./dist/test/cookie_set_success.log', `set ${key} ok\n`); } catch {}
                        // also write out the messenger cookie string snapshot for session inspection
                        try {
                            let cookieStr = '';
                            if (typeof jar.getCookieStringSync === 'function') cookieStr = jar.getCookieStringSync('https://www.messenger.com') || '';
                            else if (jar._tough && typeof jar._tough.getCookieString === 'function') jar._tough.getCookieString('https://www.messenger.com', (e: any, v: any) => { cookieStr = v || ''; });
                            const sessPath = './dist/test/session_info.json';
                            try {
                                if (this.config && this.config.developmentLog) {
                                    const existing = fs.existsSync(sessPath) ? JSON.parse(fs.readFileSync(sessPath, 'utf8')) : {};
                                    existing.cookie_messenger = cookieStr || existing.cookie_messenger || '';
                                    fs.writeFileSync(sessPath, JSON.stringify(existing, null, 2), 'utf8');
                                }
                            } catch (e) { /* ignore */ }
                        } catch (e) {}
                    } catch (err) {
                        try { fs.appendFileSync('./dist/test/cookie_set_errors.log', `setCookieSafe error for ${key}: ${String(err)}\n`); } catch {}
                    }
                }
            }
        } catch (e) {
            try { fs.appendFileSync('./dist/test/cookie_set_errors.log', `syncKeyCookiesToMessenger outer error: ${String(e)}\n`); } catch {}
        }
    }


    protected parseAndCheckLogin(data: any, retryCount: number = 0): any {
        // Handle HTTP status errors
        if (data.statusCode >= 500 && data.statusCode < 600) {
            if (retryCount >= 5) {
                const err = new Error("Request retry failed");
                (err as any).statusCode = data.statusCode;
                (err as any).res = data.body;
                throw err;
            }
            retryCount++;
            Logger.warn(`parseAndCheckLogin: Got status code ${data.statusCode} - attempt ${retryCount}`);
            throw new Error(`Retry needed`);
        }

        if (data.statusCode === 404) return data;
        if (data.statusCode !== 200) {
            throw new Error("parseAndCheckLogin got status code: " + data.statusCode);
        }

        let res = null;
        try {
            // Make response parsable (remove for(;;); prefix)
            let body = data.body;
            if (typeof body === 'string' && body.startsWith('for (;;);')) {
                body = body.substring(9);
            }

            // First try a plain parse. If that fails, attempt to extract the first
            // balanced JSON object/array from the response body (some GraphQL batch
            // responses include trailing data).
            try {
                res = JSON.parse(body);
            } catch (_) {
                if (typeof body === 'string') {
                    const extracted = this.extractFirstJSON(body);
                    if (extracted) {
                        res = JSON.parse(extracted);
                    } else {
                        throw new Error('Could not extract JSON');
                    }
                } else {
                    throw new Error('Body not a string and JSON.parse failed');
                }
            }
        } catch (e) {
            const err = new Error("JSON.parse error");
            (err as any).detail = e;
            (err as any).res = data.body;
            throw err;
        }

        // Update cookies from response
            if (res.jsmods && res.jsmods.require && Array.isArray(res.jsmods.require[0]) && res.jsmods.require[0][0] === "Cookie") {
            res.jsmods.require[0][3][0] = res.jsmods.require[0][3][0].replace("_js_", "");
            const requireCookie = res.jsmods.require[0][3];
            const cookieStr = requireCookie[0] + "=" + requireCookie[1] + "; Path=" + requireCookie[3] + "; Domain=.facebook.com";
            try {
                this.setCookieSafe(cookieStr, "https://www.facebook.com");
            } catch (e) {
                // ignore
            }
        }

        // Update DTSG token if present
        if (res.jsmods && Array.isArray(res.jsmods.require)) {
            const arr = res.jsmods.require;
            for (const i in arr) {
                if (arr[i][0] === "DTSG" && arr[i][1] === "setToken") {
                    this.ctx.fb_dtsg = arr[i][3][0];
                    // Update ttstamp
                    let ttstamp = "2";
                    for (let j = 0; j < this.ctx.fb_dtsg.length; j++) {
                        ttstamp += this.ctx.fb_dtsg.charCodeAt(j);
                    }
                    (this.ctx as any).ttstamp = ttstamp;
                }
            }
        }

        // Check for login errors
        if (res.error === 1357001) {
            const err = new Error('Facebook blocked the login');
            (err as any).error = "Not logged in.";
            throw err;
        }

        return res;
    }

    /**
     * Safely set a cookie on the configured jar. If the jar exposes a
     * synchronous API use it, otherwise fall back to the async setCookie.
     */
    protected setCookieSafe(cookieStr: string, url: string): Promise<void> | void {
        const jar: any = this.ctx && this.ctx.cookieJar;
        if (!jar) return;
        const errors: any[] = [];

        // Prefer sync API where available so we can handle failures immediately.
        if (typeof jar.setCookieSync === 'function') {
            try {
                jar.setCookieSync(cookieStr, url);
                return;
            } catch (e) {
                errors.push(e);
            }
        }

        // Try async setCookie if provided by the adapter
        if (typeof jar.setCookie === 'function') {
            try {
                const res = jar.setCookie(cookieStr, url);
                if (res && typeof res.then === 'function') {
                    // attach a noop catcher so unhandled rejections don't blow up
                    return (res as Promise<any>).catch((err) => { throw err; });
                }
                return;
            } catch (e) {
                errors.push(e);
            }
        }

        // Try tough-cookie internal APIs
        if (jar._tough) {
            try {
                if (typeof jar._tough.setCookieSync === 'function') {
                    jar._tough.setCookieSync(cookieStr, url);
                    return;
                }
                if (typeof jar._tough.setCookie === 'function') {
                    return jar._tough.setCookie(cookieStr, url, () => {});
                }
            } catch (e) {
                errors.push(e);
            }
        }

        // If we reached here all attempts failed; throw the last error for callers
        if (errors.length) throw errors[errors.length - 1];
    }

    /**
     * Make a POST request with default Facebook parameters
     */
    protected async makeRequest(
        url: string, 
        form: Record<string, any>, 
        options: { parseResponse?: boolean; referer?: string; debugToFile?: string } = {}
    ): Promise<any> {
    // Ensure fb_dtsg is present for most Facebook requests
    await this.ensureFbDtsg();
    const { parseResponse = true, referer, debugToFile } = options;
    const debugFile = debugToFile || (this.ctx && (this.ctx.__debugToFile || this.ctx.__debug_to_file));

        // Add default Facebook parameters
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const enhancedForm = {
            ...form,
            fb_dtsg: this.ctx.fb_dtsg,
            jazoest: this.ctx.jazoest,
            lsd: this.ctx.lsd || undefined,
            __user: this.ctx.UserID,
            __a: "1",
            __req: this.generateRequestID(),
            __hs: timestamp,
            dpr: "1",
            __ccg: "EXCELLENT",
            __rev: FacebookConstants.generateRevision(),
            __s: this.ctx.__s || "",
            __hsi: timestamp,
            __comet_req: "1",
            fb_api_caller_class: "RelayModern",
            server_timestamps: "true",
            __spin_r: FacebookConstants.generateSpin(),
            __spin_b: "trunk",
            __spin_t: timestamp
        };

        try {
            const customHeaders = {
                'User-Agent': this.config.userAgents || FacebookConstants.USER_AGENTS.DESKTOP,
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://www.facebook.com',
                'Referer': referer || 'https://www.facebook.com/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            };

            // Optional debug: dump the outgoing request (url, headers, form) to a file for inspection
        if (debugFile) {
                try {
                    const dump = {
                        url,
                        headers: customHeaders,
                        form: enhancedForm
                    };
            fs.writeFileSync(debugFile, JSON.stringify(dump, null, 2), 'utf8');
                } catch (e) {
                    // Non-fatal: continue even if debug write fails
                }
            }

            const response = await HttpClient.post(url, this.ctx.cookieJar, enhancedForm, undefined, undefined, customHeaders);

            const savedResponse = this.saveCookies(response);
            const checkedResponse = this.parseAndCheckLogin(savedResponse);

            // Get the actual body data
            const responseBody = checkedResponse.body || checkedResponse;
            
            return parseResponse ? this.parseResponse(responseBody) : responseBody;

        } catch (error) {
            throw ErrorHandler.handleHttpError(error, {
                context: this.constructor.name,
                url,
                method: 'POST'
            });
        }
    }

    /**
     * Make a GraphQL request
     */
    protected async makeGraphQLRequest(
        docId: string,
        variables: Record<string, any>,
        friendlyName?: string
    ): Promise<any> {
        const form = {
            av: this.ctx.UserID,
            doc_id: docId,
            variables: JSON.stringify(variables),
            fb_api_req_friendly_name: friendlyName || 'GraphQLRequest',
            fb_api_caller_class: 'RelayModern',
            server_timestamps: true
        };

        return this.makeRequest(FacebookConstants.ENDPOINTS.GRAPHQL, form);
    }

    /**
     * Parse Facebook response (remove "for (;;);" prefix)
     */
    protected parseResponse(body: any): any {
        try {
            // Early graceful fallback: null/undefined or empty string -> empty object
            if (body == null) return {};
            if (typeof body === 'string' && body.trim() === '') return {};

            // If body is already parsed object, return it
            if (typeof body === 'object' && body !== null) {
                return body;
            }
            
            // If body is string, clean and parse it
            if (typeof body === 'string') {
                const cleaned = body.replace(/^\s*for\s*\(\s*;\s*;\s*\)\s*;\s*/, "");
                try {
                    return JSON.parse(cleaned);
                } catch (_) {
                    const extracted = this.extractFirstJSON(cleaned);
                    if (extracted) return JSON.parse(extracted);
                    // If looks like HTML page (login redirect or error), return empty object instead of throwing
                    const looksHtml = /<html[\s>]/i.test(cleaned) || /<!doctype html>/i.test(cleaned);
                    if (looksHtml) return {};
                    // Soft fallback: return empty object silently
                    return {};
                }
            }
            
            // If body is neither object nor string, try to stringify then parse
            const stringBody = String(body);
            const cleanBody = stringBody.replace(/^\s*for\s*\(\s*;\s*;\s*\)\s*;\s*/, "");
            return JSON.parse(cleanBody);
        } catch (error) {
            // Suppress parsing error if body empty or HTML
            const isEmpty = (typeof body === 'string' && body.trim() === '') || body == null;
            const isHtml = typeof body === 'string' && /<html[\s>]/i.test(body);
            if (isEmpty || isHtml) return {};
            throw ErrorHandler.handleParsingError(error, {
                bodyType: typeof body,
                bodyLength: body?.length || 0,
                bodyPreview: typeof body === 'string' ? body.substring(0, 100) : String(body).substring(0, 100)
            });
        }
    }

    /**
     * Extract the first balanced JSON value (object or array) from a string.
     * Returns the substring containing the JSON or null if not found.
     */
    protected extractFirstJSON(text: string): string | null {
        if (!text) return null;
        const start = text.search(/[\{\[]/);
        if (start === -1) return null;
        let i = start;
        const len = text.length;
        const stack: string[] = [];
        let inString = false;
        let stringChar = '';
        let escape = false;
        for (; i < len; i++) {
            const ch = text[i];
            if (inString) {
                if (escape) {
                    escape = false;
                } else if (ch === '\\') {
                    escape = true;
                } else if (ch === stringChar) {
                    inString = false;
                    stringChar = '';
                }
                continue;
            }
            if (ch === '"' || ch === "'") {
                inString = true;
                stringChar = ch;
                continue;
            }
            if (ch === '{' || ch === '[') {
                stack.push(ch);
                continue;
            }
            if (ch === '}' || ch === ']') {
                const last = stack.pop();
                if (!last) return null;
                if ((last === '{' && ch !== '}') || (last === '[' && ch !== ']')) return null;
                if (stack.length === 0) {
                    // return substring from start to current index inclusive
                    return text.substring(start, i + 1);
                }
            }
        }
        return null;
    }

    /**
     * Generate request ID
     */
    protected generateRequestID(): string {
        return FacebookConstants.generateRequestID();
    }

    /**
     * Generate offline threading ID
     */
    protected generateOfflineThreadingID(): string {
        return FacebookConstants.generateOfflineThreadingID();
    }

    /**
     * Generate threading ID
     */
    protected generateThreadingID(): string {
        return FacebookConstants.generateThreadingID(this.ctx.clientID);
    }

    /**
     * Generate timestamp relative
     */
    protected generateTimestampRelative(): string {
        return FacebookConstants.generateTimestampRelative();
    }

    /**
     * Ensure fb_dtsg token is available on context. If missing, attempt to fetch
     * it via the standard AJAX endpoint. This method is conservative and will not
     * throw on failure (caller will handle missing token errors).
     */
    protected async ensureFbDtsg(): Promise<void> {
        try {
            if (this.ctx && this.ctx.fb_dtsg) return;
            const resp = await HttpClient.get('https://www.facebook.com/ajax/dtsg/?__a=true', this.ctx.cookieJar as any);
            if (!resp || !resp.body) return;
            const body = typeof resp.body === 'string' ? resp.body.replace(/^\s*for\s*\(\s*;\s*;\s*\)\s*;\s*/, '') : JSON.stringify(resp.body);
            let parsed: any = {};
            try { parsed = JSON.parse(body); } catch { return; }
            const dtsg = parsed?.payload?.fb_dtsg || '';
            if (dtsg && this.ctx) this.ctx.fb_dtsg = dtsg;
        } catch (e) {
            // Non-fatal: leave fb_dtsg undefined and let caller handle it
            return;
        }
    }

    /**
     * Generate signature ID
     */
    protected getSignatureID(): string {
        return FacebookConstants.getSignatureID();
    }

    /**
     * Format user ID
     */
    protected formatID(id: string | number): string {
        return FacebookConstants.formatID(id);
    }

    /**
     * Check if thread is group chat
     */
    protected isGroupChat(threadID: string): boolean {
        return FacebookConstants.isGroupChat(threadID);
    }

    /**
     * Log debug information
     */
    protected log(message: string, data?: any): void {
        if (this.config.showLogs && this.config.developmentLog) {
            Logger.debug(`[${this.constructor.name}] ${message}`, data);
        }
    }

    /**
     * Handle callback pattern
     */
    protected handleCallback<T>(
        promise: Promise<T>,
        callback?: (err: any, data?: T) => void
    ): Promise<T> {
        if (callback) {
            promise
                .then(data => callback(null, data))
                .catch(err => callback(err));
        }
        return promise;
    }
}
