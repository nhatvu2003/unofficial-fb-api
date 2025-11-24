/**
 * Message Module - Refactored Version
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 * 
 * This is a wrapper that combines all message-related functionality
 * Each feature is now in its own file for better maintainability
 */

import type { ConfigTypes, BuildApiContext } from "../types/CreateApiTypes.js";
import { SendMessage } from "./message/SendMessage.js";
import type { MessageOptions, SendMessageResult } from "./message/SendMessage.js";
import { UnsendMessage } from "./message/UnsendMessage.js";
import { MarkAsRead } from "./message/MarkAsRead.js";
import { TypingIndicator } from "./message/TypingIndicator.js";
export class MessageModule {
    private sendMessageModule: SendMessage;
    private unsendMessageModule: UnsendMessage;
    private markAsReadModule: MarkAsRead;
    private typingIndicatorModule: TypingIndicator;

    constructor(ctx: BuildApiContext, config: Required<ConfigTypes>) {
        this.sendMessageModule = new SendMessage(ctx, config);
        this.unsendMessageModule = new UnsendMessage(ctx, config);
        this.markAsReadModule = new MarkAsRead(ctx, config);
        this.typingIndicatorModule = new TypingIndicator(ctx, config);
    }

    /**
     * Send a message to a user or thread
     */
    async sendMessage(
        message: string | MessageOptions,
        threadID: string,
        callback?: (err: any, info?: SendMessageResult) => void,
        options?: { docId?: string; skipPrecheck?: boolean }
    ): Promise<SendMessageResult> {
        return this.sendMessageModule.send(message, threadID, callback, options);
    }

    /**
     * Unsend/delete a message
     */
    async unsendMessage(
        messageID: string,
        callback?: (err: any) => void
    ): Promise<void> {
        return this.unsendMessageModule.unsend(messageID, callback);
    }

    /**
     * Mark message as read
     */
    async markAsRead(
        threadID: string,
        callback?: (err: any) => void
    ): Promise<void> {
        return this.markAsReadModule.mark(threadID, callback);
    }

    /**
     * Send typing indicator
     */
    async sendTypingIndicator(
        threadID: string,
        isTyping: boolean = true,
        callback?: (err: any) => void
    ): Promise<void> {
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

// Re-export types for convenience
export type { MessageOptions, SendMessageResult };
