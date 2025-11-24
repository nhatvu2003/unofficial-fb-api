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
export declare class MessageModule {
    private sendMessageModule;
    private unsendMessageModule;
    private markAsReadModule;
    private typingIndicatorModule;
    constructor(ctx: BuildApiContext, config: Required<ConfigTypes>);
    /**
     * Send a message to a user or thread
     */
    sendMessage(message: string | MessageOptions, threadID: string, callback?: (err: any, info?: SendMessageResult) => void, options?: {
        docId?: string;
        skipPrecheck?: boolean;
    }): Promise<SendMessageResult>;
    /**
     * Unsend/delete a message
     */
    unsendMessage(messageID: string, callback?: (err: any) => void): Promise<void>;
    /**
     * Mark message as read
     */
    markAsRead(threadID: string, callback?: (err: any) => void): Promise<void>;
    /**
     * Send typing indicator
     */
    sendTypingIndicator(threadID: string, isTyping?: boolean, callback?: (err: any) => void): Promise<void>;
    /**
     * Get access to individual sub-modules for advanced usage
     */
    getModules(): {
        sendMessage: SendMessage;
        unsendMessage: UnsendMessage;
        markAsRead: MarkAsRead;
        typingIndicator: TypingIndicator;
    };
}
export type { MessageOptions, SendMessageResult };
//# sourceMappingURL=MessageModule.refactored.d.ts.map