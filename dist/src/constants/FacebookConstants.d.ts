/**
 * Facebook API Constants and Generators
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 *
 * Contains utility functions for generating Facebook-specific parameters
 */
export declare class FacebookConstants {
    /**
     * Generate request ID for Facebook API
     */
    static generateRequestID(): string;
    /**
     * Convert binary string to decimal (helper for generateOfflineThreadingID)
     */
    private static binaryToDecimal;
    /**
     * Generate offline threading ID (matches ws3-fca implementation)
     */
    static generateOfflineThreadingID(): string;
    /**
     * Generate threading ID (matches ws3-fca format)
     * @param clientID Optional client ID, if not provided will generate new one
     */
    static generateThreadingID(clientID?: string): string;
    /**
     * Generate timestamp relative (returns hour:minute format)
     */
    static generateTimestampRelative(): string;
    /**
     * Generate signature ID (matches ws3-fca implementation)
     */
    static getSignatureID(): string;
    /**
     * Generate client ID for MQTT
     */
    static generateClientID(): string;
    /**
     * Generate message and OTID
     */
    static generateMessageAndOTID(): string;
    /**
     * Generate random hex string of specified length
     */
    static generateRandomHex(length?: number): string;
    /**
     * Generate Facebook-style unique ID
     */
    static generateUniqueID(): string;
    /**
     * Format user ID to ensure it's a string
     */
    static formatID(id: string | number): string;
    /**
     * Check if thread is group chat
     * Based on ws3-fca logic: isSingleUser = threadID.length <= 15
     * So group chat is when length > 15
     */
    static isGroupChat(threadID: string): boolean;
    /**
     * Generate revision number for Facebook requests
     */
    static generateRevision(): string;
    /**
     * Generate spin parameter for Facebook requests
     */
    static generateSpin(): string;
    /**
     * Facebook API endpoints
     */
    static readonly ENDPOINTS: {
        readonly LOGIN: "https://www.facebook.com/login.php";
        readonly SEND_MESSAGE: "https://www.facebook.com/messaging/send/";
        readonly UNSEND_MESSAGE: "https://www.facebook.com/messaging/unsend_message/";
        readonly GET_USER_INFO: "https://www.facebook.com/chat/user_info/";
        readonly GET_USER_INFO_ALL: "https://www.facebook.com/chat/user_info_all";
        readonly GET_THREAD_INFO: "https://www.facebook.com/ajax/mercury/thread_info.php";
        readonly MARK_READ: "https://www.facebook.com/ajax/mercury/change_read_status.php";
        readonly TYPING: "https://www.facebook.com/ajax/messaging/typ.php";
        readonly FRIENDS_LIST: "https://www.facebook.com/chat/user_info_all/";
        readonly SEARCH_USERS: "https://www.facebook.com/ajax/typeahead/search.php";
        readonly ADD_FRIEND: "https://www.facebook.com/ajax/add_friend/action.php";
        readonly REMOVE_FRIEND: "https://www.facebook.com/ajax/profile/removefriendconfirm.php";
        readonly SET_THREAD_NAME: "https://www.facebook.com/messaging/set_thread_name/";
        readonly REMOVE_PARTICIPANTS: "https://www.facebook.com/chat/remove_participants";
        readonly SAVE_THREAD_EMOJI: "https://www.facebook.com/messaging/save_thread_emoji/";
        readonly MQTT_ENDPOINT: "wss://edge-chat.facebook.com/chat";
        readonly GRAPHQL: "https://www.facebook.com/api/graphql/";
        readonly GRAPHQL_BATCH: "https://www.facebook.com/api/graphqlbatch/";
    };
    static readonly FALLBACK_SEND_DOC_ID = "1348606561501227";
    /**
     * Facebook form parameters that are commonly used
     */
    static readonly FORM_PARAMS: {
        readonly FB_API_CALLER_CLASS: "RelayModern";
        readonly FB_API_REQ_FRIENDLY_NAME: "MessengerGraphQLThreadFetcher";
        readonly VARIABLES: "variables";
        readonly DOC_ID: "doc_id";
        readonly FB_DTSG: "fb_dtsg";
        readonly JAZOEST: "jazoest";
        readonly LSD: "lsd";
        readonly SPIN: "__spin_r";
        readonly REV: "__rev";
        readonly REQ_ID: "__req";
        readonly A: "__a";
        readonly CCG: "__ccg";
    };
    /**
     * Common user agents for Facebook requests
     */
    static readonly USER_AGENTS: {
        readonly DESKTOP: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        readonly MOBILE: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
        readonly FACEBOOK_APP: "facebookexternalhit/1.1";
        readonly MESSENGER: "MessengerForiOS/401.0.0.23.89";
    };
    /**
     * MQTT configuration constants
     */
    static readonly MQTT: {
        readonly KEEP_ALIVE: 60;
        readonly PROTOCOL_VERSION: 4;
        readonly CLEAN_SESSION: true;
        readonly RECONNECT_PERIOD: 1000;
        readonly CONNECT_TIMEOUT: 30000;
    };
    /**
     * Rate limiting constants
     */
    static readonly RATE_LIMITS: {
        readonly DEFAULT_MAX_REQUESTS: 50;
        readonly DEFAULT_WINDOW_MS: 60000;
        readonly MESSAGE_RATE_LIMIT: 30;
        readonly MESSAGE_WINDOW_MS: 60000;
    };
    /**
     * Timeout constants
     */
    static readonly TIMEOUTS: {
        readonly REQUEST: 30000;
        readonly LOGIN: 60000;
        readonly MQTT_CONNECT: 10000;
    };
}
//# sourceMappingURL=FacebookConstants.d.ts.map