/**
 * Send Message Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
import { FacebookConstants } from "../../src/constants/FacebookConstants.js";
import { ErrorHandler, ErrorType } from "../../src/utils/ErrorHandler.js";
import fs from 'fs';
/**
 * Send Message functionality
 * Handles sending messages via MQTT and HTTP/GraphQL
 */
export class SendMessage extends BaseAPIModule {
    /**
     * Send a message to a user or thread
     * @param message Message content or options object
     * @param threadID Target thread or user ID
     * @param callback Optional callback function
     * @param options Additional options (docId, skipPrecheck)
     */
    async send(message, threadID, callback, options) {
        const promise = this.executeSend(message, threadID, options);
        return this.handleCallback(promise, callback);
    }
    async executeSend(message, threadID, options) {
        this.log('Sending message to thread:', threadID);
        const msg = typeof message === 'string' ? { body: message } : message;
        // Pre-check: verify the target thread exists using GraphQL
        if (typeof threadID === 'string' && !(options && options.skipPrecheck)) {
            await this.precheckThread(threadID);
        }
        // Try MQTT first if available
        const mqttResult = await this.tryMqttSend(msg, threadID);
        if (mqttResult)
            return mqttResult;
        // Fallback to HTTP methods (GraphQL + REST)
        return await this.sendViaHttp(msg, threadID, options);
    }
    async precheckThread(threadID) {
        try {
            const variables = {
                id: threadID,
                message_limit: 0,
                load_messages: false,
                load_read_receipts: false,
                before: null
            };
            const checkResp = await this.makeGraphQLRequest('1849319281789796', variables, 'ThreadInfoCheck');
            if (!checkResp || checkResp.errors || !checkResp.data) {
                throw ErrorHandler.createError(ErrorType.VALIDATION, `Thread ${threadID} unavailable or inaccessible (GraphQL)`, null, { threadID, response: checkResp });
            }
        }
        catch (err) {
            if (err?.type === ErrorType.NETWORK)
                throw err;
            throw ErrorHandler.createError(ErrorType.VALIDATION, `Cannot access thread ${threadID}: ${err}`, err, { threadID });
        }
    }
    async tryMqttSend(msg, threadID) {
        if (this.config.autoReconnect && this.ctx.mqttClient) {
            try {
                this.log('Attempting to send via MQTT...');
                const mqttResult = await this.ctx.mqttClient.sendMessageViaMqtt(msg.body || '', threadID);
                if (mqttResult) {
                    this.log('Message sent successfully via MQTT');
                    return {
                        messageID: mqttResult.messageID,
                        threadID: threadID,
                        timestamp: mqttResult.timestamp
                    };
                }
            }
            catch (mqttError) {
                this.log('MQTT send failed, falling back to HTTP:', mqttError);
            }
        }
        return null;
    }
    async sendViaHttp(msg, threadID, options) {
        const messageAndOTID = this.generateOfflineThreadingID();
        const form = this.buildMessageForm(msg, threadID, messageAndOTID);
        // Try GraphQL first
        const graphqlResult = await this.tryGraphQLSend(msg, threadID, messageAndOTID, form, options);
        if (graphqlResult)
            return graphqlResult;
        // Fallback to legacy endpoint
        return await this.sendViaLegacy(form, threadID, messageAndOTID);
    }
    buildMessageForm(msg, threadID, messageAndOTID) {
        const form = {
            client: "mercury",
            action_type: "ma-type:user-generated-message",
            author: "fbid:" + this.ctx.UserID,
            timestamp: Date.now(),
            timestamp_absolute: "Today",
            timestamp_relative: this.generateTimestampRelative(),
            timestamp_time_passed: "0",
            is_unread: false,
            is_cleared: false,
            is_forward: false,
            is_filtered_content: false,
            is_filtered_content_bh: false,
            is_filtered_content_account: false,
            is_filtered_content_quasar: false,
            is_filtered_content_invalid_app: false,
            is_spoof_warning: false,
            source: "source:chat:web",
            "source_tags[0]": "source:chat",
            body: msg.body || "",
            html_body: false,
            ui_push_phase: "V3",
            status: "0",
            offline_threading_id: messageAndOTID,
            message_id: messageAndOTID,
            threading_id: this.generateThreadingID(),
            "ephemeral_ttl_mode": "0",
            manual_retry_cnt: "0",
            has_attachment: !!(msg.attachment || msg.url || msg.sticker),
            signatureID: this.getSignatureID(),
            ttstamp: this.generateTtstamp()
        };
        // Handle reply
        if (msg.replyToMessage) {
            form.replied_to_message_id = msg.replyToMessage;
        }
        // Handle thread types
        this.setThreadInfo(form, threadID);
        // Handle message enhancements
        this.addMessageEnhancements(msg, form);
        return form;
    }
    generateTtstamp() {
        return "265" +
            Math.floor(Math.random() * 9) + "1" +
            Math.floor(Math.random() * 9) + "8" +
            Math.floor(Math.random() * 9) + "2" +
            Math.floor(Math.random() * 9) + "6" +
            Math.floor(Math.random() * 9) + "5" +
            Math.floor(Math.random() * 9);
    }
    setThreadInfo(form, threadID) {
        if (Array.isArray(threadID)) {
            // Group chat with multiple users
            threadID.forEach((id, index) => {
                form[`specific_to_list[${index}]`] = "fbid:" + id;
            });
            form[`specific_to_list[${threadID.length}]`] = "fbid:" + this.ctx.UserID;
            form.client_thread_id = "root:" + form.offline_threading_id;
        }
        else {
            // Single thread - check if it's single user or group
            const isSingleUser = !this.isGroupChat(threadID);
            if (isSingleUser) {
                form["specific_to_list[0]"] = "fbid:" + threadID;
                form["specific_to_list[1]"] = "fbid:" + this.ctx.UserID;
                form["other_user_fbid"] = threadID;
            }
            else {
                form["thread_fbid"] = threadID;
            }
        }
    }
    addMessageEnhancements(msg, form) {
        // Handle sticker
        if (msg.sticker) {
            form.sticker_id = msg.sticker;
        }
        // Handle emoji
        if (msg.emoji) {
            form.tags = JSON.stringify([msg.emoji]);
        }
        // Handle location
        if (msg.location) {
            form.location_attachment = JSON.stringify({
                coordinates: {
                    latitude: msg.location.latitude,
                    longitude: msg.location.longitude
                }
            });
        }
        // Handle mentions
        if (msg.mentions && msg.mentions.length > 0) {
            const ranges = [];
            msg.mentions.forEach((mention) => {
                if (mention.id && mention.tag) {
                    const offset = (msg.body || '').indexOf(mention.tag);
                    if (offset !== -1) {
                        ranges.push({
                            offset,
                            length: mention.tag.length,
                            id: mention.id,
                            type: "p"
                        });
                    }
                }
            });
            if (ranges.length > 0) {
                form.ranges = JSON.stringify(ranges);
            }
        }
        // Handle URL attachment (placeholder)
        if (msg.url) {
            this.log('URL attachment detected but not implemented yet:', msg.url);
        }
        // Handle file attachments (placeholder)
        if (msg.attachment) {
            this.log('File attachment detected but not implemented yet');
        }
    }
    async tryGraphQLSend(msg, threadID, messageAndOTID, form, options) {
        try {
            const gqlDocId = (options && options.docId) ||
                (this.ctx?.graphqlDocMap?.['SendMessage']) ||
                FacebookConstants.FALLBACK_SEND_DOC_ID ||
                '1234567890123456';
            const variables = {
                input: {
                    message: {
                        body: form.body,
                        client_generated_id: form.offline_threading_id,
                        author_id: this.ctx.UserID,
                        source: form.source || 'source:chat:web'
                    },
                    thread_id: threadID,
                    thread_fbid: threadID,
                    actor_id: this.ctx.UserID
                }
            };
            this.debugRequest('graphql', gqlDocId, variables, threadID, messageAndOTID);
            // Ensure fb_dtsg is present
            if (!this.ctx?.fb_dtsg && typeof this.ensureFbDtsg === 'function') {
                await this.ensureFbDtsg();
            }
            const gqlResponse = await this.makeGraphQLRequest(gqlDocId, variables, 'SendMessage');
            if (gqlResponse) {
                this.debugResponse('graphql', gqlResponse, threadID, messageAndOTID);
                if (!gqlResponse.error && !gqlResponse.errors && gqlResponse.data) {
                    this.log('GraphQL response successful:', gqlResponse);
                    return this.parseMessageResponse(gqlResponse, threadID, messageAndOTID);
                }
            }
        }
        catch (e) {
            this.log('GraphQL sendMessage path failed, falling back to legacy send', e);
        }
        return null;
    }
    async sendViaLegacy(form, threadID, messageAndOTID) {
        const referer = `https://www.facebook.com/messages/t/${Array.isArray(threadID) ? '' : threadID}`;
        this.debugRequest('legacy', form, null, threadID, messageAndOTID);
        // Try to refresh fb_dtsg if missing
        if (!this.ctx?.fb_dtsg && typeof this.ensureFbDtsg === 'function') {
            await this.ensureFbDtsg();
        }
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.SEND_MESSAGE, form, { referer });
        this.debugResponse('legacy', response, threadID, messageAndOTID);
        if (response?.payload) {
            this.log('Legacy response payload actions:', response.payload.actions || response.payload);
        }
        if (response?.error) {
            throw this.handleSendError(response.error, threadID, response);
        }
        const messageInfo = this.parseMessageResponse(response, threadID, messageAndOTID);
        this.log('Message sent successfully:', messageInfo);
        return messageInfo;
    }
    handleSendError(errorCode, threadID, response) {
        const code = Number(errorCode);
        let errorMessage;
        switch (code) {
            case 1357031:
                errorMessage = 'Message send failed: Invalid session or content removed';
                break;
            case 1545010:
                errorMessage = 'Message send failed: Invalid recipient';
                break;
            case 1545003:
                errorMessage = 'Message send failed: Thread not found';
                break;
            default:
                errorMessage = `Message send failed with error code: ${code}`;
        }
        return ErrorHandler.createError(ErrorType.NETWORK, errorMessage, null, { errorCode: code, threadID, response });
    }
    parseMessageResponse(response, threadID, messageAndOTID) {
        try {
            if (response.payload?.actions) {
                const action = response.payload.actions.find((a) => a.message_id || a.client_message_id);
                if (action) {
                    return {
                        messageID: action.message_id || messageAndOTID,
                        threadID: action.thread_fbid || threadID,
                        timestamp: Date.now()
                    };
                }
            }
            return {
                messageID: messageAndOTID,
                threadID: threadID,
                timestamp: Date.now()
            };
        }
        catch (error) {
            this.log('Error parsing message response:', error);
            return {
                messageID: messageAndOTID,
                threadID: threadID,
                timestamp: Date.now()
            };
        }
    }
    debugRequest(type, data, variables, threadID, messageAndOTID) {
        try {
            const cookieString = this.getCookieString();
            const debugData = {
                type,
                ...(type === 'graphql' ? { gqlDocId: data, variables } : { form: data }),
                ctx: {
                    UserID: this.ctx?.UserID,
                    fb_dtsg: this.ctx?.fb_dtsg,
                    jazoest: this.ctx?.jazoest,
                    cookieString
                },
                messageAndOTID,
                threadID
            };
            fs.writeFileSync('./dist/test/last_request_debug.json', JSON.stringify(debugData, null, 2), 'utf8');
        }
        catch (e) {
            // non-fatal
        }
    }
    debugResponse(type, response, threadID, messageAndOTID) {
        try {
            fs.writeFileSync('./dist/test/last_response_debug.json', JSON.stringify({ type, response, threadID, messageAndOTID }, null, 2), 'utf8');
        }
        catch (e) {
            // non-fatal
        }
    }
    getCookieString() {
        try {
            const jar = this.ctx?.cookieJar;
            if (!jar)
                return '';
            if (jar.getCookieStringSync) {
                return jar.getCookieStringSync('https://www.facebook.com');
            }
            if (jar.getCookieString) {
                return jar.getCookieString('https://www.facebook.com');
            }
            return '';
        }
        catch {
            return '';
        }
    }
}
//# sourceMappingURL=SendMessage.js.map