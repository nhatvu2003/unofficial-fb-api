/**
 * Facebook API Constants and Generators
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 *
 * Contains utility functions for generating Facebook-specific parameters
 */
export class FacebookConstants {
    /**
     * Generate request ID for Facebook API
     */
    static generateRequestID() {
        return Math.random().toString(36).substring(2, 15);
    }
    /**
     * Convert binary string to decimal (helper for generateOfflineThreadingID)
     */
    static binaryToDecimal(data) {
        let ret = "";
        while (data !== "0") {
            let end = 0;
            let fullName = "";
            for (let i = 0; i < data.length; i++) {
                end = 2 * end + parseInt(data.charAt(i), 10);
                if (end >= 10) {
                    fullName += "1";
                    end -= 10;
                }
                else {
                    fullName += "0";
                }
            }
            ret = end.toString() + ret;
            data = fullName.slice(fullName.indexOf("1"));
        }
        return ret;
    }
    /**
     * Generate offline threading ID (matches ws3-fca implementation)
     */
    static generateOfflineThreadingID() {
        const ret = Date.now();
        const value = Math.floor(Math.random() * 4294967295);
        const str = ("0000000000000000000000" + value.toString(2)).slice(-22);
        const msgs = ret.toString(2) + str;
        return this.binaryToDecimal(msgs);
    }
    /**
     * Generate threading ID (matches ws3-fca format)
     * @param clientID Optional client ID, if not provided will generate new one
     */
    static generateThreadingID(clientID) {
        const k = Date.now();
        const l = Math.floor(Math.random() * 4294967295);
        const m = clientID || this.generateClientID();
        return "<" + k + ":" + l + "-" + m + "@mail.projektitan.com>";
    }
    /**
     * Generate timestamp relative (returns hour:minute format)
     */
    static generateTimestampRelative() {
        const d = new Date();
        const minutes = d.getMinutes().toString().padStart(2, "0");
        return d.getHours() + ":" + minutes;
    }
    /**
     * Generate signature ID (matches ws3-fca implementation)
     */
    static getSignatureID() {
        return Math.floor(Math.random() * 2147483648).toString(16);
    }
    /**
     * Generate client ID for MQTT
     */
    static generateClientID() {
        return Math.random().toString(36).substring(2, 15);
    }
    /**
     * Generate message and OTID
     */
    static generateMessageAndOTID() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }
    /**
     * Generate random hex string of specified length
     */
    static generateRandomHex(length = 8) {
        return Math.random()
            .toString(16)
            .substring(2, 2 + length);
    }
    /**
     * Generate Facebook-style unique ID
     */
    static generateUniqueID() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${timestamp}_${random}`;
    }
    /**
     * Format user ID to ensure it's a string
     */
    static formatID(id) {
        return String(id);
    }
    /**
     * Check if thread is group chat
     * Based on ws3-fca logic: isSingleUser = threadID.length <= 15
     * So group chat is when length > 15
     */
    static isGroupChat(threadID) {
        // ws3-fca: isSingleUser when threadID.length <= 15
        // Therefore: group chat when threadID.length > 15
        return threadID.length > 15;
    }
    /**
     * Generate revision number for Facebook requests
     */
    static generateRevision() {
        return Math.floor(Math.random() * 10000000).toString();
    }
    /**
     * Generate spin parameter for Facebook requests
     */
    static generateSpin() {
        return `r.${Math.floor(Math.random() * 10000)}`;
    }
    /**
     * Facebook API endpoints
     */
    static ENDPOINTS = {
        LOGIN: "https://www.facebook.com/login.php",
        SEND_MESSAGE: "https://www.facebook.com/messaging/send/",
        UNSEND_MESSAGE: "https://www.facebook.com/messaging/unsend_message/",
        GET_USER_INFO: "https://www.facebook.com/chat/user_info/",
        GET_USER_INFO_ALL: "https://www.facebook.com/chat/user_info_all",
        GET_THREAD_INFO: "https://www.facebook.com/ajax/mercury/thread_info.php",
        MARK_READ: "https://www.facebook.com/ajax/mercury/change_read_status.php",
        TYPING: "https://www.facebook.com/ajax/messaging/typ.php",
        FRIENDS_LIST: "https://www.facebook.com/chat/user_info_all/",
        SEARCH_USERS: "https://www.facebook.com/ajax/typeahead/search.php",
        ADD_FRIEND: "https://www.facebook.com/ajax/add_friend/action.php",
        REMOVE_FRIEND: "https://www.facebook.com/ajax/profile/removefriendconfirm.php",
        SET_THREAD_NAME: "https://www.facebook.com/messaging/set_thread_name/",
        REMOVE_PARTICIPANTS: "https://www.facebook.com/chat/remove_participants",
        SAVE_THREAD_EMOJI: "https://www.facebook.com/messaging/save_thread_emoji/",
        MQTT_ENDPOINT: "wss://edge-chat.facebook.com/chat",
        GRAPHQL: "https://www.facebook.com/api/graphql/",
        GRAPHQL_BATCH: "https://www.facebook.com/api/graphqlbatch/",
    };
    // Placeholder doc_id used as fallback for GraphQL send mutation (can be replaced with real ID)
    static FALLBACK_SEND_DOC_ID = "1348606561501227";
    /**
     * Facebook form parameters that are commonly used
     */
    static FORM_PARAMS = {
        FB_API_CALLER_CLASS: "RelayModern",
        FB_API_REQ_FRIENDLY_NAME: "MessengerGraphQLThreadFetcher",
        VARIABLES: "variables",
        DOC_ID: "doc_id",
        FB_DTSG: "fb_dtsg",
        JAZOEST: "jazoest",
        LSD: "lsd",
        SPIN: "__spin_r",
        REV: "__rev",
        REQ_ID: "__req",
        A: "__a",
        CCG: "__ccg",
    };
    /**
     * Common user agents for Facebook requests
     */
    static USER_AGENTS = {
        DESKTOP: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        MOBILE: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        FACEBOOK_APP: "facebookexternalhit/1.1",
        MESSENGER: "MessengerForiOS/401.0.0.23.89",
    };
    /**
     * MQTT configuration constants
     */
    static MQTT = {
        KEEP_ALIVE: 60,
        PROTOCOL_VERSION: 4,
        CLEAN_SESSION: true,
        RECONNECT_PERIOD: 1000,
        CONNECT_TIMEOUT: 30000,
    };
    /**
     * Rate limiting constants
     */
    static RATE_LIMITS = {
        DEFAULT_MAX_REQUESTS: 50,
        DEFAULT_WINDOW_MS: 60000,
        MESSAGE_RATE_LIMIT: 30,
        MESSAGE_WINDOW_MS: 60000,
    };
    /**
     * Timeout constants
     */
    static TIMEOUTS = {
        REQUEST: 30000,
        LOGIN: 60000,
        MQTT_CONNECT: 10000,
    };
}
//# sourceMappingURL=FacebookConstants.js.map