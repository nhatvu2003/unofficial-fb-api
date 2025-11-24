/**
 * Send Message Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
export interface MessageOptions {
    body?: string;
    attachment?: any;
    mentions?: any[];
    url?: string;
    sticker?: string;
    emoji?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    replyToMessage?: string;
}
export interface SendMessageResult {
    messageID: string;
    threadID: string;
    timestamp: number;
}
/**
 * Send Message functionality
 * Handles sending messages via MQTT and HTTP/GraphQL
 */
export declare class SendMessage extends BaseAPIModule {
    /**
     * Send a message to a user or thread
     * @param message Message content or options object
     * @param threadID Target thread or user ID
     * @param callback Optional callback function
     * @param options Additional options (docId, skipPrecheck)
     */
    send(message: string | MessageOptions, threadID: string, callback?: (err: any, info?: SendMessageResult) => void, options?: {
        docId?: string;
        skipPrecheck?: boolean;
    }): Promise<SendMessageResult>;
    private executeSend;
    private precheckThread;
    private tryMqttSend;
    private sendViaHttp;
    private buildMessageForm;
    private generateTtstamp;
    private setThreadInfo;
    private addMessageEnhancements;
    private tryGraphQLSend;
    private sendViaLegacy;
    private handleSendError;
    private parseMessageResponse;
    private debugRequest;
    private debugResponse;
    private getCookieString;
}
//# sourceMappingURL=SendMessage.d.ts.map