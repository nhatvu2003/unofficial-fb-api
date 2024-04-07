/**
 * @project		Unofficial Facebook API
 * @descriptions	The unofficial API performs the task of sending messages and some other tasks for Facebook
 * @repositories		https://github.com/nhatvu2003/unofficial-fb-api
 * @author		Nhat Vu
 * @link			https://nhatvu.io.vn
 * @link			https://github.com/nhatvu2003
 *
 * Please do not delete this line
 */

import request from "request-promise-native";

/**
 * HandleRequest class provides methods to send HTTP GET and POST requests
 * to the Facebook API.
 */
class HandleRequest {
    
    /**
     * Get headers for the request
     * 
     * @param {string} uri - The request URI
     * @param {Object} config - The request configuration
     * @param {Object} customHeaders - Custom headers to be added
     * @returns {Object} - Headers for the request
     */
    getHeaders(uri, config, customHeaders) {
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: "https://www.facebook.com/",
            Host: uri.replace("https://", "").split("/")[0],
            Origin: "https://www.facebook.com",
            "User-Agent": config.userAgent,
            Connection: "keep-alive"
        };
        if (customHeaders) {
            Object.assign(headers, customHeaders);
        }
        if (config && config.region) {
            headers["X-MSGR-Region"] = config.region;
        }
        return headers;
    }

    /**
     * Send a GET request
     * 
     * @param {string} uri - The request URI
     * @param {Object} cookieJar - Cookie jar for the request
     * @param {Object} queryString - Query parameters
     * @param {Object} config - The request configuration
     * @param {Object} context - Additional context
     * @returns {Promise<Object>} - Response from the request
     */
    async sendGetRequest(uri, cookieJar, queryString, config, context) {
        if (typeof queryString === "object") {
            for (let prop in queryString) {
                if (
                    queryString.hasOwnProperty(prop) &&
                    typeof queryString[prop] === "object"
                ) {
                    queryString[prop] = JSON.stringify(queryString[prop]);
                }
            }
        }
        const requestOptions = {
            headers: this.getHeaders(uri, config),
            timeout: 60000,
            uri: uri,
            jar: cookieJar,
            method: "GET",
            gzip: true,
            qs: queryString,
            resolveWithFullResponse: true
        };
        try {
            const response = await request(requestOptions);
            return response;
        } catch (error) {
            throw new Error(`Error while making GET request: ${error.message}`);
        }
    }

    /**
     * Send a POST request with form data
     * 
     * @param {string} uri - The request URI
     * @param {Object} cookieJar - Cookie jar for the request
     * @param {Object} formData - Form data for the POST request
     * @param {Object} config - The request configuration
     * @param {Object} context - Additional context
     * @returns {Promise<Object>} - Response from the request
     */
    async sendPostRequest(uri, cookieJar, formData, config, context) {
        if (typeof formData === "object") {
            for (let prop in formData) {
                if (
                    formData.hasOwnProperty(prop) &&
                    typeof formData[prop] === "object"
                ) {
                    formData[prop] = JSON.stringify(formData[prop]);
                }
            }
        }
        const requestOptions = {
            headers: this.getHeaders(uri, config),
            timeout: 60000,
            uri: uri,
            jar: cookieJar,
            method: "POST",
            gzip: true,
            form: formData,
            resolveWithFullResponse: true
        };
        try {
            const response = await request(requestOptions);
            return response;
        } catch (error) {
            throw new Error(`Error while making POST request: ${error.message}`);
        }
    }

    /**
     * Send a POST request with form data and query string
     * 
     * @param {string} uri - The request URI
     * @param {Object} cookieJar - Cookie jar for the request
     * @param {Object} formData - Form data for the POST request
     * @param {Object} queryString - Query parameters
     * @param {Object} config - The request configuration
     * @param {Object} context - Additional context
     * @returns {Promise<Object>} - Response from the request
     */
    async sendPostDataRequest(uri, cookieJar, formData, queryString, config, context) {
        const requestOptions = {
            headers: this.getHeaders(uri, config),
            timeout: 60000,
            uri: uri,
            jar: cookieJar,
            method: "POST",
            gzip: true,
            formData: formData,
            qs: queryString,
            resolveWithFullResponse: true
        };
        try {
            const response = await request(requestOptions);
            return response;
        } catch (error) {
            throw new Error(`Error while making POST data request: ${error.message}`);
        }
    }
}

export default HandleRequest;