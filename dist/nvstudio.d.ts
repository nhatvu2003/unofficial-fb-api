/**
 * Unofficial Facebook Messenger API
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 * @license MIT
 * @description Simple unofficial Facebook Messenger API for Node.js
 *
 * Based on the original concept from facebook-chat-api by Schmavery
 * @see https://github.com/Schmavery/facebook-chat-api
 * This is a TypeScript reimplementation for educational purposes
 */
import { CookieJar } from "tough-cookie";
import type { LoginAppStateTypes, ConfigTypes } from "./types/CreateApiTypes.js";
import { APIManager } from "./module/APIManager.js";
/**
 * Main API interface returned after successful login
 *
 * This interface provides access to all Facebook Messenger API functionality
 * organized into logical groups: messaging, user management, thread operations,
 * and utility functions.
 *
 * @example
 * ```typescript
 * const api = await loginPromise({ appState });
 *
 * // Send a message
 * await api.sendMessage('Hello!', 'USER_ID');
 *
 * // Get user info
 * const userInfo = await api.getUserInfo('USER_ID');
 *
 * // Get thread list
 * const threads = await api.getThreadList(20);
 * ```
 */
export interface API {
    /** Update API configuration options */
    setOptions: (options: ConfigTypes) => void;
    /** Get current app state (cookies) for persistence */
    getAppState: () => LoginAppStateTypes[];
    /** Send text messages, attachments, or rich content */
    sendMessage: APIManager['sendMessage'];
    /** Get list of conversation threads with filtering options */
    getThreadList: APIManager['getThreadList'];
    /** Get the current user's Facebook ID */
    getCurrentUserID: () => string;
    /** Get the cookie jar for advanced cookie management */
    getCookieJar: () => CookieJar;
}
/**
 * Login options
 */
interface LoginOptions extends ConfigTypes {
    appState: LoginAppStateTypes[];
}
/**
 * Login callback type
 */
type LoginCallback = (error: Error | null, api?: API) => void;
/**
 * Manages configuration state with merge/update helpers
 */
export declare class ConfigManager {
    private options;
    constructor(initial?: ConfigTypes);
    update(next: ConfigTypes): void;
    get(): Required<ConfigTypes>;
}
/**
 * Handles login flow and exposes promise-based API creation
 */
export declare class LoginManager {
    private configManager;
    constructor(configManager: ConfigManager);
    login(appState: LoginAppStateTypes[]): Promise<API>;
}
/**
 * Unified high-level class for users wanting class-based & promise style usage.
 * Example:
 *   const studio = await NVStudio.create(appState, { showLogs: true });
 *   await studio.login(appState); // if not using create()
 *   await studio.getAPI().sendMessage(...)
 */
export declare class NVStudio {
    private configManager;
    private loginManager;
    private api?;
    constructor(config?: ConfigTypes);
    static create(appState: LoginAppStateTypes[], config?: ConfigTypes): Promise<NVStudio>;
    login(appState: LoginAppStateTypes[]): Promise<API>;
    getAPI(): API;
    setOptions(options: ConfigTypes): void;
    getOptions(): Required<ConfigTypes>;
}
/**
 * Main login function - similar to ws3-fca
 * @param loginData - Object containing appState
 * @param options - Configuration options (optional)
 * @param callback - Callback function receiving (error, api)
 */
declare function login(loginData: LoginOptions, options?: ConfigTypes | LoginCallback, callback?: LoginCallback): Promise<API>;
export default login;
/**
 * Promise-based convenience wrapper matching new style without using class.
 */
export declare function loginPromise(loginData: LoginOptions, options?: ConfigTypes): Promise<API>;
//# sourceMappingURL=nvstudio.d.ts.map