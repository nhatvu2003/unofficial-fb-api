/**
 * Message Module - Refactored Version
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 *
 * This is a wrapper that combines all message-related functionality
 * Each feature is now in its own file for better maintainability
 */
import { SendMessage } from "./message/SendMessage.js";
import { UnsendMessage } from "./message/UnsendMessage.js";
import { MarkAsRead } from "./message/MarkAsRead.js";
import { TypingIndicator } from "./message/TypingIndicator.js";
export class MessageModule {
    sendMessageModule;
    unsendMessageModule;
    markAsReadModule;
    typingIndicatorModule;
    constructor(ctx, config) {
        this.sendMessageModule = new SendMessage(ctx, config);
        this.unsendMessageModule = new UnsendMessage(ctx, config);
        this.markAsReadModule = new MarkAsRead(ctx, config);
        this.typingIndicatorModule = new TypingIndicator(ctx, config);
    }
    /**
     * Send a message to a user or thread
     */
    async sendMessage(message, threadID, callback, options) {
        return this.sendMessageModule.send(message, threadID, callback, options);
    }
    /**
     * Unsend/delete a message
     */
    async unsendMessage(messageID, callback) {
        return this.unsendMessageModule.unsend(messageID, callback);
    }
    /**
     * Mark message as read
     */
    async markAsRead(threadID, callback) {
        return this.markAsReadModule.mark(threadID, callback);
    }
    /**
     * Send typing indicator
     */
    async sendTypingIndicator(threadID, isTyping = true, callback) {
        return this.typingIndicatorModule.send(threadID, isTyping, callback);
    }
    /**
     * Get access to individual sub-modules for advanced usage
     */
    getModules() {
        return {
            sendMessage: this.sendMessageModule,
            unsendMessage: this.unsendMessageModule,
            markAsRead: this.markAsReadModule,
            typingIndicator: this.typingIndicatorModule
        };
    }
}
//# sourceMappingURL=MessageModule.refactored.js.map