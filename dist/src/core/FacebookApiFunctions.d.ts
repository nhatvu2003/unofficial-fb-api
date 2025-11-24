/**
 * Facebook API Functions - Core Implementation
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import type { ConfigTypes, BuildApiContext } from "../../types/CreateApiTypes.js";
/**
 * FacebookApiFunctions - Comprehensive Facebook Messenger API Implementation
 *
 * This class provides a complete set of Facebook Messenger API functions that enable:
 *
 * 1. **Message Operations**:
 *    - Send text messages, attachments, and rich media
 *    - Handle message formatting and encoding
 *    - Support for mentions, stickers, and reactions
 *
 * 2. **User Information**:
 *    - Retrieve user profiles and metadata
 *    - Get friends lists and relationship status
 *    - Access user presence and activity data
 *
 * 3. **Thread Management**:
 *    - Get conversation information and participants
 *    - Manage thread settings and permissions
 *    - Handle group conversations and metadata
 *
 * 4. **Real-time Features**:
 *    - Mark messages as read/unread
 *    - Send typing indicators
 *    - Handle presence updates
 *
 * All functions implement proper error handling, retry logic, and logging
 * while maintaining compatibility with Facebook's internal API structure.
 */
export declare class FacebookApiFunctions {
    /** API context containing session data, tokens, and authentication info */
    private ctx;
    /** Complete configuration object with all required settings */
    private config;
    /**
     * Initialize FacebookApiFunctions with API context and configuration
     *
     * @param ctx - Built API context from BuildAPI containing:
     *              - User authentication tokens (fb_dtsg, jazoest)
     *              - Cookie jar for session management
     *              - User ID and session information
     *
     * @param config - Complete configuration object with:
     *                 - Network settings (timeout, retries, rate limiting)
     *                 - Logging preferences and verbosity levels
     *                 - User agent and proxy configuration
     */
    constructor(ctx: BuildApiContext, config: Required<ConfigTypes>);
    /**
     * Send a message to a user or thread
     *
     * Sends messages through Facebook's messaging system with support for:
     * - Plain text messages
     * - Rich message objects with attachments
     * - Mentions and special formatting
     * - Delivery confirmation and error handling
     *
     * @param message - Text string or MessageObject with body/attachments
     * @param threadID - Target user ID or thread/group ID
     * @param callback - Optional callback for result/error handling
     * @returns Promise resolving to message send result with messageID and timestamp
     */
    sendMessage(message: string | MessageObject, threadID: string, callback?: (err: any, info?: any) => void): Promise<any>;
    /**
     * Get user information
     */
    getUserInfo(userIDs: string | string[], callback?: (err: any, data?: any) => void): Promise<any>;
    /**
     * Get thread information
     */
    getThreadInfo(threadIDs: string | string[], callback?: (err: any, data?: any) => void): Promise<any>;
    /**
     * Get friends list
     */
    getFriendsList(callback?: (err: any, data?: any) => void): Promise<any>;
    /**
     * Mark message as read
     */
    markAsRead(threadID: string, callback?: (err: any) => void): Promise<void>;
    /**
     * Set typing indicator
     */
    sendTypingIndicator(threadID: string, isTyping?: boolean, callback?: (err: any) => void): Promise<void>;
    private generateOfflineThreadingID;
    private generateThreadingID;
    private generateTimestampRelative;
    private getSignatureID;
    private parseResponse;
    /**
     * Extract the first balanced JSON value (object or array) from a string.
     * Returns the substring containing the JSON or null if not found.
     */
    private extractFirstJSON;
    private formatFriendsData;
    private getGenderString;
}
interface MessageObject {
    body?: string;
    attachment?: any;
    mentions?: any[];
    url?: string;
    sticker?: string;
}
export {};
//# sourceMappingURL=FacebookApiFunctions.d.ts.map