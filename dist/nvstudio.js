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
import JarAdapter from "./src/utils/JarAdapter.js";
import Logger from "./src/utils/Logger.js";
import { APIManager } from "./module/APIManager.js";
/**
 * Default configuration options extracted for reuse by ConfigManager & NVStudio
 */
const DEFAULT_OPTIONS = {
    selfListen: false,
    listenEvents: false,
    updatePresence: false,
    autoMarkRead: false,
    autoMarkDelivery: true,
    forceLogin: false,
    online: true,
    logLevel: "info",
    showLogs: false,
    developmentLog: false,
    autoReconnect: true,
    userAgents: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    timeout: 30000,
    retryAttempts: 3,
    rateLimit: { maxRequests: 10, windowMs: 1000 },
    proxy: undefined,
};
/**
 * Manages configuration state with merge/update helpers
 */
export class ConfigManager {
    options;
    constructor(initial) {
        this.options = { ...DEFAULT_OPTIONS };
        if (initial)
            setOptions(this.options, initial);
    }
    update(next) {
        setOptions(this.options, next);
    }
    get() {
        return this.options;
    }
}
/**
 * Handles login flow and exposes promise-based API creation
 */
export class LoginManager {
    configManager;
    constructor(configManager) {
        this.configManager = configManager;
    }
    async login(appState) {
        return new Promise((resolve, reject) => {
            loginHelper(appState, this.configManager.get(), (err, api) => {
                if (err || !api)
                    return reject(err);
                resolve(api);
            });
        });
    }
}
/**
 * Unified high-level class for users wanting class-based & promise style usage.
 * Example:
 *   const studio = await NVStudio.create(appState, { showLogs: true });
 *   await studio.login(appState); // if not using create()
 *   await studio.getAPI().sendMessage(...)
 */
export class NVStudio {
    configManager;
    loginManager;
    api;
    constructor(config) {
        this.configManager = new ConfigManager(config);
        this.loginManager = new LoginManager(this.configManager);
    }
    static async create(appState, config) {
        const instance = new NVStudio(config);
        await instance.login(appState);
        return instance;
    }
    async login(appState) {
        this.api = await this.loginManager.login(appState);
        return this.api;
    }
    getAPI() {
        if (!this.api)
            throw new Error("Not logged in yet");
        return this.api;
    }
    setOptions(options) {
        this.configManager.update(options);
        if (this.api) {
            // propagate to underlying api instance if it exposes setOptions
            this.api.setOptions(options);
        }
    }
    getOptions() {
        return this.configManager.get();
    }
}
/**
 * Set options helper
 */
function setOptions(globalOptions, options) {
    for (const key in options) {
        const value = options[key];
        if (value !== undefined) {
            globalOptions[key] = value;
        }
    }
}
/**
 * Build API object from context
 */
function buildAPI(ctx, globalOptions, jar, appState) {
    // Initialize API Manager
    const apiManager = new APIManager(ctx, globalOptions);
    // Create API object
    const api = {
        // Configuration methods
        setOptions: (options) => setOptions(globalOptions, options),
        getAppState: () => [...appState],
        // Message-related functions
        sendMessage: apiManager.sendMessage.bind(apiManager),
        getThreadList: apiManager.getThreadList.bind(apiManager),
        // Utility functions
        getCurrentUserID: () => ctx.userID || ctx.UserID || "",
        getCookieJar: () => jar,
    };
    return api;
}
/**
 * Login helper function
 */
async function loginHelper(appState, globalOptions, callback) {
    const toughJar = new CookieJar();
    const jar = JarAdapter.wrap(toughJar);
    const log = (level, ...args) => {
        const enableDebug = globalOptions.developmentLog;
        const enableNormal = globalOptions.showLogs;
        if (!enableNormal && level !== "error" && !(enableDebug && level === "debug"))
            return;
        switch (level) {
            case "info":
                Logger.log(...args);
                break;
            case "warn":
                Logger.warn(...args);
                break;
            case "error":
                Logger.error(...args);
                break;
            case "debug":
                Logger.debug(...args);
                break;
            case "success":
                Logger.success(...args);
                break;
        }
    };
    try {
        log("info", "Logging in...");
        // Validate AppState
        if (!appState || !Array.isArray(appState)) {
            throw new Error("Invalid AppState");
        }
        if (appState.length === 0) {
            throw new Error("AppState array is empty");
        }
        // Set cookies
        appState.forEach((appStateItem) => {
            if (!appStateItem || typeof appStateItem !== "object") {
                throw new Error("Invalid appState item");
            }
            if (!appStateItem.key || !appStateItem.value || !appStateItem.domain) {
                throw new Error("Missing appState properties");
            }
            const { key, value, domain, path, hostOnly, creation, lastAccessed } = appStateItem;
            const cookieString = `${key}=${value}; Domain=${domain};Path=${path};${hostOnly ? "HostOnly;" : ""}Creation=${creation};LastAccessed=${lastAccessed}`;
            jar.setCookie(cookieString, `https://${domain}`);
        });
        // Extract user credentials from cookies
        const userCookie = appState.find((c) => c.key === "c_user");
        if (!userCookie) {
            throw new Error("Missing c_user cookie in AppState");
        }
        const userID = userCookie.value;
        const clientID = ((Math.random() * 2147483648) | 0).toString();
        // Fetch homepage to get fb_dtsg, lsd, jazoest
        log("debug", "Fetching tokens from Facebook homepage...");
        const got = (await import('got')).default;
        const homepageResponse = await got.get("https://www.facebook.com/", {
            cookieJar: jar._tough,
            headers: {
                "User-Agent": globalOptions.userAgents,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Cache-Control": "max-age=0",
            },
            followRedirect: true,
            throwHttpErrors: false,
        });
        if (homepageResponse.statusCode !== 200) {
            log("warn", `Homepage returned status ${homepageResponse.statusCode}, trying alternative method...`);
            // Try home.php instead
            const homeResponse = await got.get("https://www.facebook.com/home.php", {
                cookieJar: jar._tough,
                headers: {
                    "User-Agent": globalOptions.userAgents,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
                    "Referer": "https://www.facebook.com/",
                },
                followRedirect: true,
                throwHttpErrors: false,
            });
            if (homeResponse.statusCode !== 200) {
                throw new Error(`Failed to fetch Facebook homepage: ${homeResponse.statusCode}`);
            }
        }
        const html = homepageResponse.statusCode === 200 ? homepageResponse.body : "";
        // Extract tokens
        let fb_dtsg = "";
        let lsd = "";
        let jazoest = "";
        const dtsgMatch = html.match(/DTSGInitialData.*?token":"(.*?)"/);
        if (dtsgMatch && dtsgMatch[1]) {
            fb_dtsg = dtsgMatch[1];
        }
        const lsdMatch = html.match(/\["LSD"\,\[\],\{"token":"(.*?)"\}/);
        if (lsdMatch && lsdMatch[1]) {
            lsd = lsdMatch[1];
        }
        const jazoestMatch = html.match(/jazoest=(\d+)/);
        if (jazoestMatch && jazoestMatch[1]) {
            jazoest = jazoestMatch[1];
        }
        log("success", `Logged in as ${userID}`);
        log("debug", `Tokens extracted: fb_dtsg=${fb_dtsg.substring(0, 20)}..., lsd=${lsd}, jazoest=${jazoest}`);
        // Create BuildApiContext
        const ctx = {
            jar,
            cookieJar: jar,
            userID,
            UserID: userID,
            clientID,
            loggedIn: true,
            fb_dtsg,
            lsd,
            jazoest,
            AppState: appState,
        };
        // Build API
        const api = buildAPI(ctx, globalOptions, toughJar, appState);
        log("info", "Done logging in.");
        callback(null, api);
        return api;
    }
    catch (error) {
        log("error", error);
        callback(error);
        throw error;
    }
}
/**
 * Main login function - similar to ws3-fca
 * @param loginData - Object containing appState
 * @param options - Configuration options (optional)
 * @param callback - Callback function receiving (error, api)
 */
async function login(loginData, options, callback) {
    // Handle overloaded parameters
    let actualOptions = {};
    let actualCallback;
    if (typeof options === "function") {
        actualCallback = options;
        actualOptions = {};
    }
    else {
        actualOptions = options || {};
        actualCallback = callback || (() => { });
    }
    // Default global options cloned from constant
    const globalOptions = { ...DEFAULT_OPTIONS };
    // Merge user options
    setOptions(globalOptions, actualOptions);
    // Perform login and return API
    const api = await loginHelper(loginData.appState, globalOptions, actualCallback);
    return api;
}
export default login;
/**
 * Promise-based convenience wrapper matching new style without using class.
 */
export function loginPromise(loginData, options) {
    return login(loginData, options || {});
}
//# sourceMappingURL=nvstudio.js.map