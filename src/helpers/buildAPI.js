/**
 * @project		Unofficial Facebook API
 * @descriptions	The unofficial API performs the task of sending messages and some other tasks for Facebook
 * @repositories		https://github.com/nhatvu2003/unofficial-fb-api
 * @author		Nhat Vu
 * @link			https://nhatvu.io.vn
 * @link			https://github.com/nhatvu2003
 *
 * Please do not delete this line
 *
 */

import logger from "npmlog";

/**
 * Extract text between two tokens from a given string.
 *
 * @param {string} inputString - The input string to search within.
 * @param {string} startToken - The starting token.
 * @param {string} endToken - The ending token.
 * @returns {string} - The extracted text between the tokens.
 * @throws {Error} - If the tokens are not found in the string.
 */
function extractTextBetweenTokens(inputString, startToken, endToken) {
    const startPosition = inputString.indexOf(startToken);
    const endPosition = inputString.indexOf(
        endToken,
        startPosition + startToken.length
    );

    if (startPosition === -1 || endPosition === -1) {
        throw new Error(
            "Could not find the specified tokens in the given string."
        );
    }

    return inputString.substring(
        startPosition + startToken.length,
        endPosition
    );
}

/**
 * Retrieve cookies from specified domains.
 *
 * @param {CookieJar} jarCookie - The cookie jar to retrieve cookies from.
 * @returns {Array} - An array of cookies.
 */
async function getAppstate(jarCookie) {
    const domains = [
        "https://www.facebook.com",
        "https://facebook.com",
        "https://messenger.com"
    ];
    return domains.flatMap(domain => jarCookie.getCookiesSync(domain));
}

/**
 * Build the API based on the default configuration, cookie jar, and HTML content.
 *
 * @param {Object} defaultConfig - The default configuration.
 * @param {CookieJar} jarCookie - The cookie jar containing the user's cookies.
 * @param {string} htmlContent - The HTML content of the page.
 * @returns {Array} - An array containing the context and API.
 * @throws {Object} - If there's an error retrieving the userID or if a checkpoint is detected.
 */
export default async function buildAPI(defaultConfig, jarCookie, htmlContent) {
    // Retrieve the user's cookie with the 'c_user' key
    const userCookie = jarCookie
        .getCookiesSync(`https://www.facebook.com`)
        .find(cookie => cookie.cookieString().split("=")[0] === "c_user");

    // Throw an error if the user cookie is not found
    if (!userCookie) {
        throw {
            type: "error",
            message:
                "Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify."
        };
    }

    // Check for a checkpoint and throw an error if one is detected
    if (htmlContent.includes("/checkpoint/block/?next")) {
        throw {
            type: "error",
            message:
                "Checkpoint detected. Please log in with a browser to verify."
        };
    }

    // Retrieve the userID from the user cookie
    const userID = userCookie.cookieString().split("=")[1].toString();
    logger.info("login", `logged in ${userID}`);

    // Construct the context object
    const context = {
        userID: userID,
        jar: jarCookie,
        clientID: ((Math.random() * 2147483648) | 0).toString(16),
        logged: true,
        defaultConfig
    };

    // List of modules to import and their respective APIs to build
    const moduleAPI = ["getCurrentUserID"];

    // Initialize an empty API object
    const api = {};

    // Dynamically import and build each module's API
    for (const module of moduleAPI) {
        const importedModule = await import(`../module/${module}.js`);
        api[module] = await importedModule.default(api, context);
    }

    // Add the getAppstate function to the API
    api.getAppstate = async () => getAppstate(jarCookie);

    return [context, api];
}
