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

import request from "request-promise-native";
import { CookieJar, Cookie } from "tough-cookie";
import logger from "npmlog";
import handleRequest from "./helpers/handleRequest.js";
import buildAPI from "./helpers/buildAPI.js";

class Initialization {
    constructor() {
        this.jar = new CookieJar();
        this.requestHandle = new handleRequest();
    }

    /**
     * Save cookies to the cookie jar.
     *
     * @param {CookieJar} jar - The cookie jar to save cookies to.
     * @param {Array} cookieStrings - An array of cookie strings.
     */
    saveCookies(jar, cookieStrings) {
        cookieStrings.forEach(cookieString => {
            if (cookieString.includes(`.facebook.com`)) {
                jar.setCookieSync(cookieString, `https://www.facebook.com`);
            }
            const cookieString2 = cookieString.replace(
                /domain=\.facebook\.com/,
                "domain=.messenger.com"
            );
            jar.setCookieSync(cookieString2, `https://messenger.com`);
        });
    }

    /**
     * Handle the login process.
     *
     * @param {Array} cookie - An array of cookies.
     * @param {Object} defaultConfig - The default configuration.
     * @param {Function} userCallback - The callback function.
     */
    async handleLogin(cookie, defaultConfig, userCallback) {
        try {
            // Set cookies to the cookie jar
            cookie.forEach(c => {
                const cookieString = new Cookie({
                    key: c.key,
                    value: c.value,
                    path: c.path,
                    domain: c.domain
                });
                this.jar.setCookieSync(cookieString, `http://${c.domain}`);
            });

            // Send GET request to Facebook
            let res = await this.requestHandle.sendGetRequest(
                `https://www.facebook.com/`,
                this.jar,
                null,
                defaultConfig,
                {
                    noRef: true
                }
            );

            // Save cookies
            this.saveCookies(this.jar, res.headers["set-cookie"] || []);

            // Check and handle redirect
            const redirectMeta =
                /<meta http-equiv="refresh" content="0;url=([^"]+)[^>]+>/;
            const redirect = redirectMeta.exec(res.body);
            if (redirect && redirect[1]) {
                res = await this.requestHandle.sendGetRequest(
                    redirect[1],
                    this.jar,
                    null,
                    defaultConfig
                );
                this.saveCookies(this.jar, res.headers["set-cookie"] || []);
            }

            // Build API
            const html = res.body;
            const [context, api] = await buildAPI(
                defaultConfig,
                this.jar,
                html
            );

            // Log and callback
            logger.info(`login`, `Login success account`);
            userCallback(null, api);
        } catch (e) {
            // Log error and callback
            logger.error("error", e.error || e);
            userCallback(e);
        }
    }
}

export default Initialization;
