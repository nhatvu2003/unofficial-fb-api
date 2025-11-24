/**
 * Message Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from './BaseAPIModule.js';
/**
 * Options for sending messages with various content types
 *
 * Supports text messages, attachments, mentions, stickers, emojis,
 * location sharing, and reply functionality.
 *
 * @interface MessageOptions
 * @example
 * ```typescript
 * // Text message
 * const textMessage: MessageOptions = {
 *   body: 'Hello World!'
 * };
 *
 * // Message with attachment
 * const attachmentMessage: MessageOptions = {
 *   body: 'Check this out!',
 *   attachment: fs.createReadStream('image.jpg')
 * };
 *
 * // Message with mentions
 * const mentionMessage: MessageOptions = {
 *   body: 'Hello @John Doe!',
 *   mentions: [{
 *     tag: '@John Doe',
 *     id: '100000000000000'
 *   }]
 * };
 * ```
 */
export interface MessageOptions {
    /** Text content of the message */
    body?: string;
    /** File attachment (stream, buffer, or file path) */
    attachment?: any;
    /** Array of user mentions with tag and ID */
    mentions?: any[];
    /** URL to share (for link previews) */
    url?: string;
    /** Sticker ID to send */
    sticker?: string;
    /** Emoji reaction */
    emoji?: string;
    /** Location coordinates for sharing location */
    location?: {
        latitude: number;
        longitude: number;
    };
    /** Message ID to reply to */
    replyToMessage?: string;
}
/**
 * Result returned after successfully sending a message
 *
 * Contains identifiers and metadata about the sent message,
 * useful for tracking, replies, or message management.
 *
 * @interface SendMessageResult
 * @example
 * ```typescript
 * const result = await api.sendMessage('Hello!', 'THREAD_ID');
 * console.log(`Message ${result.messageID} sent to ${result.threadID}`);
 * console.log(`Sent at: ${new Date(result.timestamp)}`);
 * ```
 */
export interface SendMessageResult {
    /** Unique identifier for the sent message */
    messageID: string;
    /** ID of the thread/conversation where message was sent */
    threadID: string;
    /** Unix timestamp when the message was sent */
    timestamp: number;
}
/**
 * Message Module for Facebook Messenger API
 *
 * Handles all message-related operations including:
 * - Sending text messages, attachments, and rich media
 * - Message reactions and replies
 * - Typing indicators
 * - Message retraction/unsending
 * - Message read status management
 *
 * All methods support both callback and promise-based usage patterns
 * for maximum compatibility with existing codebases.
 *
 * @extends BaseAPIModule
 * @example
 * ```typescript
 * const messageModule = new MessageModule(ctx, config);
 *
 * // Send simple text message
 * await messageModule.sendMessage('Hello!', 'THREAD_ID');
 *
 * // Send with attachment
 * await messageModule.sendMessage({
 *   body: 'Check this image!',
 *   attachment: fs.createReadStream('photo.jpg')
 * }, 'THREAD_ID');
 *
 * // Mark as read
 * await messageModule.markAsRead('THREAD_ID');
 * ```
 */
export declare class MessageModule extends BaseAPIModule {
    /**
     * Send a message to a user or thread
     *
     * Supports sending text messages, attachments, stickers, mentions,
     * and other rich content types. This is the primary method for
     * sending messages through the Facebook Messenger API.
     *
     * @param message - Message content (string) or MessageOptions object
     * @param threadID - Target thread ID (user ID for private messages)
     * @param callback - Optional callback function for compatibility
     * @param options - Additional options including custom docId
     * @returns Promise resolving to message send result
     *
     * @example
     * ```typescript
     * // Simple text message
     * await sendMessage('Hello World!', 'USER_ID');
     *
     * // Rich message with attachment and mentions
     * await sendMessage({
     *   body: 'Hello @John, check this out!',
     *   attachment: fs.createReadStream('document.pdf'),
     *   mentions: [{ tag: '@John', id: '100000000000000' }]
     * }, 'THREAD_ID');
     *
     * // With callback (fca-unofficial compatibility)
     * sendMessage('Hello!', 'USER_ID', (err, info) => {
     *   if (err) console.error('Error:', err);
     *   else console.log('Sent:', info.messageID);
     * });
     * ```
     */
    sendMessage(message: string | MessageOptions, threadID: string, callback?: (err: any, info?: SendMessageResult) => void, options?: {
        docId?: string;
        skipPrecheck?: boolean;
    }): Promise<SendMessageResult>;
    private executeSendMessage;
    /**
     * Handle message enhancements (attachments, stickers, etc.)
     */
    private handleMessageEnhancements;
    /**
     * Parse send message response
     */
    private parseMessageResponse;
    /**
     * Unsend/delete a message
     */
    unsendMessage(messageID: string, callback?: (err: any) => void): Promise<void>;
    private executeUnsendMessage;
    /**
     * Mark message as read
     */
    markAsRead(threadID: string, callback?: (err: any) => void): Promise<void>;
    private executeMarkAsRead;
    /**
     * Send typing indicator
     */
    sendTypingIndicator(threadID: string, isTyping?: boolean, callback?: (err: any) => void): Promise<void>;
    private executeSendTypingIndicator;
    /**
     * Get the current API context (UserID, tokens, etc.)
     */
    getContext(): import("../types/CreateApiTypes.js").BuildApiContext;
}
//# sourceMappingURL=MessageModule.d.ts.map