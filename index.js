import Initialization from "./src/Initialization.js";

// Initialize the Initialization class
const InitLoader = new Initialization();

/**
 * Apply custom configuration to the default configuration.
 *
 * @param {Object} defaults - The default configuration.
 * @param {Object} customConfig - The custom configuration provided by the user.
 */
function applyConfigDefaults(defaults, customConfig) {
    Object.keys(customConfig).forEach(key => {
        if (key === "online") {
            defaults.online = Boolean(customConfig.online);
        }
        if (key === "userAgent") {
            defaults.userAgent = customConfig.userAgent;
        }
    });
}

/**
 * Login function to handle the login process.
 *
 * @param {Object} data - The login data containing cookies.
 * @param {Object|Function} userConfig - The user configuration or the callback function.
 * @param {Function} userCallback - The callback function.
 */
export default async function login(data, userConfig, userCallback) {
    // If userConfig is a function, it means the user didn't provide a custom configuration
    if (typeof userConfig === "function") {
        userCallback = userConfig;
        userConfig = {};
    }

    // Default configuration
    const defaultConfig = {
        online: true,
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0"
    };

    // Apply custom configuration to the default configuration
    applyConfigDefaults(defaultConfig, userConfig || {});

    // Call the handleLogin method from the Initialization class
    await InitLoader.handleLogin(data.Cookie, defaultConfig, userCallback);
}