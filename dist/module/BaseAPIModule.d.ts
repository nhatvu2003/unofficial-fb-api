/**
 * Base API Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import type { ConfigTypes, BuildApiContext } from "../types/CreateApiTypes.js";
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
export declare abstract class BaseAPIModule {
    protected ctx: BuildApiContext;
    protected config: Required<ConfigTypes>;
    constructor(ctx: BuildApiContext, config: Required<ConfigTypes>);
    protected saveCookies(res: any): any;
    /**
     * Copy essential cookies from facebook jar into messenger host as host-only cookies.
     * This is a best-effort helper to improve messenger-side session availability.
     */
    protected syncKeyCookiesToMessenger(): void;
    protected parseAndCheckLogin(data: any, retryCount?: number): any;
    /**
     * Safely set a cookie on the configured jar. If the jar exposes a
     * synchronous API use it, otherwise fall back to the async setCookie.
     */
    protected setCookieSafe(cookieStr: string, url: string): Promise<void> | void;
    /**
     * Make a POST request with default Facebook parameters
     */
    protected makeRequest(url: string, form: Record<string, any>, options?: {
        parseResponse?: boolean;
        referer?: string;
        debugToFile?: string;
    }): Promise<any>;
    /**
     * Make a GraphQL request
     */
    protected makeGraphQLRequest(docId: string, variables: Record<string, any>, friendlyName?: string): Promise<any>;
    /**
     * Parse Facebook response (remove "for (;;);" prefix)
     */
    protected parseResponse(body: any): any;
    /**
     * Extract the first balanced JSON value (object or array) from a string.
     * Returns the substring containing the JSON or null if not found.
     */
    protected extractFirstJSON(text: string): string | null;
    /**
     * Generate request ID
     */
    protected generateRequestID(): string;
    /**
     * Generate offline threading ID
     */
    protected generateOfflineThreadingID(): string;
    /**
     * Generate threading ID
     */
    protected generateThreadingID(): string;
    /**
     * Generate timestamp relative
     */
    protected generateTimestampRelative(): string;
    /**
     * Ensure fb_dtsg token is available on context. If missing, attempt to fetch
     * it via the standard AJAX endpoint. This method is conservative and will not
     * throw on failure (caller will handle missing token errors).
     */
    protected ensureFbDtsg(): Promise<void>;
    /**
     * Generate signature ID
     */
    protected getSignatureID(): string;
    /**
     * Format user ID
     */
    protected formatID(id: string | number): string;
    /**
     * Check if thread is group chat
     */
    protected isGroupChat(threadID: string): boolean;
    /**
     * Log debug information
     */
    protected log(message: string, data?: any): void;
    /**
     * Handle callback pattern
     */
    protected handleCallback<T>(promise: Promise<T>, callback?: (err: any, data?: T) => void): Promise<T>;
}
//# sourceMappingURL=BaseAPIModule.d.ts.map