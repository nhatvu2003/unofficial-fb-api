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

/**
 * @class VirtualData
 * @description Provides methods to generate various types of data like threading ID, timestamp, session ID, accessibility cookie, GUID, and presence data.
 * @author Nhat Vu
 * @version 1.0.0
 */
class VirtualData {
    /**
     * Generate threading ID based on client ID, current timestamp, and a random value.
     *
     * @param {string} clientID - The client ID.
     * @returns {string} The generated threading ID.
     */
    generateThreadingID(clientID) {
        const timestamp = Date.now();
        const randomValue = Math.floor(Math.random() * 4294967295);
        return `<${timestamp}:${randomValue}-${clientID}@nhatvu.io.vn>`;
    }

    /**
     * Generate a relative timestamp in HH:mm format.
     *
     * @returns {string} The formatted relative timestamp.
     */
    generateRelativeTimestamp() {
        const date = new Date();
        const formattedHours = String(date.getHours()).padStart(2, "0");
        const formattedMinutes = String(date.getMinutes()).padStart(2, "0");
        return `${formattedHours}:${formattedMinutes}`;
    }

    /**
     * Generate a session ID based on the current timestamp.
     *
     * @returns {string} The generated session ID.
     */
    generateSessionID() {
        const currentTimestamp = Date.now();
        const sessionIDPattern = "******-****-4***-n***-************";

        const generateRandomHexDigit = () => {
            const randomValue = Math.floor(
                (currentTimestamp + Math.random() * 16) % 16
            );
            return randomValue.toString(16);
        };

        const sessionID = sessionIDPattern.replace(/[n*]/g, placeholder => {
            return placeholder === "*"
                ? generateRandomHexDigit()
                : (
                      (parseInt(generateRandomHexDigit(), 16) & 0x3) |
                      0x8
                  ).toString(16);
        });

        return sessionID;
    }

    /**
     * Generate an accessibility cookie based on the current timestamp.
     *
     * @returns {string} The encoded accessibility cookie.
     */
    generateAccessibilityCookie() {
        const currentTime = Date.now();
        const accessibilityData = {
            sr: 0,
            "sr-ts": currentTime,
            jk: 0,
            "jk-ts": currentTime,
            kb: 0,
            "kb-ts": currentTime,
            hcm: 0,
            "hcm-ts": currentTime
        };
        return encodeURIComponent(JSON.stringify(accessibilityData));
    }

    /**
     * Generate a GUID (Globally Unique Identifier).
     *
     * @returns {string} The generated GUID.
     */
    generateGUID() {
        let sectionLength = Date.now();
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            character => {
                const randomValue = Math.floor(
                    (sectionLength + Math.random() * 16) % 16
                );
                sectionLength = Math.floor(sectionLength / 16);
                const guidPart =
                    character === "x" ? randomValue : (randomValue & 0x3) | 0x8;
                return guidPart.toString(16);
            }
        );
    }

    /**
     * Generate presence data for a given user ID.
     *
     * @param {string} userID - The user ID.
     * @returns {string} The generated presence data.
     */
    generatePresenceData(userID) {
        const currentTime = Date.now();
        const presenceData = {
            v: 3,
            time: Math.floor(currentTime / 1000),
            user: userID,
            state: {
                ut: 0,
                t2: [],
                lm2: null,
                uct2: currentTime,
                tr: null,
                tw: Math.floor(Math.random() * 4294967295) + 1,
                at: currentTime
            },
            ch: {
                [`p_${userID}`]: 0
            }
        };
        return `E${presenceEncode(JSON.stringify(presenceData))}`;
    }
}
export default VirtualData