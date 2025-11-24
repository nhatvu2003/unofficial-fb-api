/**
 * Message Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from './BaseAPIModule.js';
import { FacebookConstants } from "../src/constants/FacebookConstants.js";
import { ErrorHandler, ErrorType } from "../src/utils/ErrorHandler.js";
import fs from 'fs';
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
export class MessageModule extends BaseAPIModule {
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
    async sendMessage(message, threadID, callback, options) {
        const promise = this.executeSendMessage(message, threadID, options);
        return this.handleCallback(promise, callback);
    }
    async executeSendMessage(message, threadID, options) {
        this.log('Sending message to thread:', threadID);
        const msg = typeof message === 'string' ? { body: message } : message;
        // Skip pre-check by default since GraphQL docIds change frequently
        // Users can still enable it by setting skipPrecheck: false in options
        const shouldSkipPrecheck = options?.skipPrecheck !== false;
        // Optional pre-check: verify the target thread exists using GraphQL
        // If options.skipPrecheck is true (default), skip this step and attempt send directly.
        if (typeof threadID === 'string' && !shouldSkipPrecheck) {
            try {
                const variables = {
                    id: threadID,
                    message_limit: 0,
                    load_messages: false,
                    load_read_receipts: false,
                    before: null
                };
                const checkResp = await this.makeGraphQLRequest('1849319281789796', variables, 'ThreadInfoCheck');
                // GraphQL returns data when thread exists; if it returns errors or empty data, treat as inaccessible
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
        // First priority: Try MQTT/WebSocket if available
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
        // Fallback to HTTP methods (prefer legacy over GraphQL for better compatibility)
        const messageAndOTID = this.generateOfflineThreadingID();
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
            body: msg.body ? msg.body.toString() : "",
            html_body: false,
            ui_push_phase: "V3",
            status: "0",
            offline_threading_id: messageAndOTID,
            message_id: messageAndOTID,
            threading_id: this.generateThreadingID(),
            "ephemeral_ttl_mode:": "0",
            manual_retry_cnt: "0",
            has_attachment: !!(msg.attachment || msg.url || msg.sticker),
            signatureID: this.getSignatureID()
        };
        // Handle reply to message
        if (msg.replyToMessage) {
            form.replied_to_message_id = msg.replyToMessage;
        }
        // Handle different thread types
        if (Array.isArray(threadID)) {
            // Group chat with multiple users
            threadID.forEach((id, index) => {
                form[`specific_to_list[${index}]`] = "fbid:" + id;
            });
            form[`specific_to_list[${threadID.length}]`] = "fbid:" + this.ctx.UserID;
            form.client_thread_id = "root:" + messageAndOTID;
        }
        else {
            // Check if this is a single user chat or group chat
            const isSingleUser = threadID.length <= 15;
            if (isSingleUser) {
                // Single user chat: use specific_to_list + other_user_fbid
                form["specific_to_list[0]"] = "fbid:" + threadID;
                form["specific_to_list[1]"] = "fbid:" + this.ctx.UserID;
                form["other_user_fbid"] = threadID;
            }
            else {
                // Group chat: use thread_fbid only
                form["thread_fbid"] = threadID;
            }
        }
        // Handle attachments, stickers, etc.
        await this.handleMessageEnhancements(msg, form);
        // Attach a more accurate Referer for message sends (helps mimic browser requests)
        const referer = `https://www.facebook.com/messages/t/${Array.isArray(threadID) ? '' : threadID}`;
        try {
            // Ưu tiên docId truyền vào options, sau đó mới lấy từ context hoặc fallback
            const gqlDocId = (options && options.docId) || (this.ctx && this.ctx.graphqlDocMap && this.ctx.graphqlDocMap['SendMessage']) || FacebookConstants.FALLBACK_SEND_DOC_ID || '1234567890123456';
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
            // Dump the outgoing GraphQL variables + context for debugging
            try {
                const cookieString = (this.ctx && (this.ctx.cookieJar && (this.ctx.cookieJar.getCookieStringSync ? this.ctx.cookieJar.getCookieStringSync('https://www.facebook.com') : (this.ctx.cookieJar.getCookieString ? await this.ctx.cookieJar.getCookieString('https://www.facebook.com') : '')))) || '';
                fs.writeFileSync('./dist/test/last_request_debug.json', JSON.stringify({ type: 'graphql', gqlDocId, variables, ctx: { UserID: this.ctx?.UserID, fb_dtsg: this.ctx?.fb_dtsg, jazoest: this.ctx?.jazoest, cookieString }, messageAndOTID, threadID }, null, 2), 'utf8');
            }
            catch (e) {
                // non-fatal
            }
            // Ensure fb_dtsg is present before GraphQL/mutation call
            try {
                if (!this.ctx?.fb_dtsg && typeof this.ensureFbDtsg === 'function') {
                    await this.ensureFbDtsg();
                }
            }
            catch (e) { /* non-fatal */ }
            const gqlResponse = await this.makeGraphQLRequest(gqlDocId, variables, 'SendMessage');
            if (gqlResponse) {
                try {
                    // Dump GraphQL response for debugging
                    try {
                        fs.writeFileSync('./dist/test/last_response_debug.json', JSON.stringify({ type: 'graphql', response: gqlResponse, threadID, messageAndOTID }, null, 2), 'utf8');
                    }
                    catch (e) { /* non-fatal */ }
                    // Check for GraphQL success - must have data and no errors
                    if (!gqlResponse.error && !gqlResponse.errors && gqlResponse.data) {
                        // GraphQL path succeeded
                        console.log('GraphQL response successful:', gqlResponse);
                        return this.parseMessageResponse(gqlResponse, threadID, messageAndOTID);
                    }
                    else {
                        console.log('GraphQL response has errors, falling back to legacy:', gqlResponse);
                    }
                }
                catch (e) {
                    // continue to fallback
                    console.log('GraphQL parsing failed, falling back to legacy:', e);
                }
            }
        }
        catch (e) {
            // Swallow and fallback to legacy endpoint
            this.log('GraphQL sendMessage path failed, falling back to legacy send', e);
        }
        // Dump the outgoing legacy form + context for debugging before HTTP send
        try {
            const cookieString = (this.ctx && (this.ctx.cookieJar && (this.ctx.cookieJar.getCookieStringSync ? this.ctx.cookieJar.getCookieStringSync('https://www.facebook.com') : (this.ctx.cookieJar.getCookieString ? await this.ctx.cookieJar.getCookieString('https://www.facebook.com') : '')))) || '';
            // legacy full request includes headers (with Cookie) and body/form
            const legacyHeaders = {
                'User-Agent': this.config.userAgents || 'facebookexternalhit/1.1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://www.facebook.com',
                'Referer': referer,
                'Cookie': cookieString
            };
            fs.writeFileSync('./dist/test/last_legacy_full_request.json', JSON.stringify({ url: FacebookConstants.ENDPOINTS.SEND_MESSAGE, headers: legacyHeaders, form, ctx: { UserID: this.ctx?.UserID, fb_dtsg: this.ctx?.fb_dtsg, jazoest: this.ctx?.jazoest }, messageAndOTID, threadID }, null, 2), 'utf8');
            fs.writeFileSync('./dist/test/last_request_debug.json', JSON.stringify({ type: 'legacy', form, ctx: { UserID: this.ctx?.UserID, fb_dtsg: this.ctx?.fb_dtsg, jazoest: this.ctx?.jazoest, cookieString }, messageAndOTID, threadID }, null, 2), 'utf8');
        }
        catch (e) { /* non-fatal */ }
        // Try to refresh fb_dtsg if missing before legacy send
        try {
            if (!this.ctx?.fb_dtsg && typeof this.ensureFbDtsg === 'function') {
                await this.ensureFbDtsg();
            }
        }
        catch (e) { /* non-fatal */ }
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.SEND_MESSAGE, form, { referer });
        // Dump legacy response for debugging
        try {
            fs.writeFileSync('./dist/test/last_response_debug.json', JSON.stringify({ type: 'legacy', response, threadID, messageAndOTID }, null, 2), 'utf8');
            // also write a raw full response dump for deeper inspection
            try {
                fs.writeFileSync('./dist/test/last_legacy_full_response.json', JSON.stringify({ responseRaw: response, threadID, messageAndOTID }, null, 2), 'utf8');
            }
            catch { }
        }
        catch (e) { /* non-fatal */ }
        if (response && response.payload) {
            console.log('Legacy response payload actions:', response.payload.actions || response.payload);
        }
        else {
            console.log('Legacy response:', response && typeof response === 'object' ? Object.keys(response) : response);
        }
        if (response && response.error) {
            const errorCode = Number(response.error);
            let errorMessage = `Send message failed with error code: ${errorCode}`;
            // Map common Facebook error codes (numeric)
            switch (errorCode) {
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
                    errorMessage = `Message send failed with error code: ${errorCode}`;
            }
            throw ErrorHandler.createError(ErrorType.NETWORK, errorMessage, null, { errorCode, threadID, response });
        }
        // Parse response for message info
        const messageInfo = this.parseMessageResponse(response, threadID, messageAndOTID);
        this.log('Message sent successfully:', messageInfo);
        return messageInfo;
    }
    /**
     * Handle message enhancements (attachments, stickers, etc.)
     */
    async handleMessageEnhancements(msg, form) {
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
            msg.mentions.forEach((mention, index) => {
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
        // Handle URL attachment
        if (msg.url) {
            // This would need additional implementation for URL parsing
            this.log('URL attachment detected but not implemented yet:', msg.url);
        }
        // Handle file attachments
        if (msg.attachment) {
            // This would need additional implementation for file uploads
            this.log('File attachment detected but not implemented yet');
        }
    }
    /**
     * Parse send message response
     */
    parseMessageResponse(response, threadID, messageAndOTID) {
        try {
            if (response.payload && response.payload.actions) {
                const action = response.payload.actions.find((a) => a.message_id || a.client_message_id);
                if (action) {
                    return {
                        messageID: action.message_id || messageAndOTID,
                        threadID: action.thread_fbid || threadID,
                        timestamp: Date.now()
                    };
                }
            }
            // Fallback response
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
    /**
     * Unsend/delete a message
     */
    async unsendMessage(messageID, callback) {
        const promise = this.executeUnsendMessage(messageID);
        return this.handleCallback(promise, callback);
    }
    async executeUnsendMessage(messageID) {
        this.log('Unsending message:', messageID);
        const form = {
            message_id: messageID
        };
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.UNSEND_MESSAGE, form);
        if (response.error) {
            throw new Error(`Unsend message failed: ${response.error}`);
        }
        this.log('Message unsent successfully');
    }
    /**
     * Mark message as read
     */
    async markAsRead(threadID, callback) {
        const promise = this.executeMarkAsRead(threadID);
        return this.handleCallback(promise, callback);
    }
    async executeMarkAsRead(threadID) {
        this.log('Marking as read:', threadID);
        const form = {
            watermarkTimestamp: Date.now(),
            shouldSendReadReceipt: true,
            ids: JSON.stringify([threadID])
        };
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.MARK_READ, form);
        if (response.error) {
            throw new Error(`Mark as read failed: ${response.error}`);
        }
        this.log('Marked as read successfully');
    }
    /**
     * Send typing indicator
     */
    async sendTypingIndicator(threadID, isTyping = true, callback) {
        const promise = this.executeSendTypingIndicator(threadID, isTyping);
        return this.handleCallback(promise, callback);
    }
    async executeSendTypingIndicator(threadID, isTyping) {
        this.log('Setting typing indicator:', { threadID, isTyping });
        const form = {
            typ: isTyping ? 1 : 0,
            thread: threadID,
            source: "mercury-chat"
        };
        await this.makeRequest(FacebookConstants.ENDPOINTS.TYPING, form, { parseResponse: false });
        this.log('Typing indicator set successfully');
    }
    /**
     * Get the current API context (UserID, tokens, etc.)
     */
    getContext() {
        return this.ctx;
    }
}
//# sourceMappingURL=MessageModule.js.map