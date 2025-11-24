/**
 * Thread Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import { BaseAPIModule } from './BaseAPIModule.js';
import { FacebookConstants } from "../src/constants/FacebookConstants.js";
import fs from 'fs';

export interface ThreadInfo {
    threadID: string;
    threadName?: string;
    participantIDs: string[];
    messageCount?: number;
    isGroup: boolean;
    isArchived?: boolean;
    isCanReply?: boolean;
    lastMessage?: {
        messageID: string;
        body: string;
        senderID: string;
        timestamp: number;
    };
    admins?: string[];
    emoji?: string;
    color?: string;
    nicknames?: { [userID: string]: string };
}

export interface ThreadListItem {
    threadID: string;
    name: string;
    isGroup: boolean;
    isUnread: boolean;
    messageCount: number;
    timestamp: number;
    snippet: string;
    snippetSender?: string;
    participants: { [userID: string]: any };
    participantIDs: string[];
    unreadCount: number;
    muteUntil: number | null;
    isSubscribed: boolean;
    isArchived: boolean;
    folder: string;
    cannotReplyReason: string | null;
    emoji: string | null;
    color: string | null;
    nicknames: { [userID: string]: string };
    adminIDs: string[];
    approvalMode: boolean;
    threadType: number;
}

/**
 * Thread/Conversation-related API functions
 */
export class ThreadModule extends BaseAPIModule {

    /**
     * Get thread information
     */
    async getThreadInfo(
        threadIDs: string | string[],
        callback?: (err: any, data?: { [threadID: string]: ThreadInfo }) => void
    ): Promise<{ [threadID: string]: ThreadInfo }> {
        const promise = this.executeGetThreadInfo(threadIDs);
        return this.handleCallback(promise, callback);
    }

    private async executeGetThreadInfo(
        threadIDs: string | string[]
    ): Promise<{ [threadID: string]: ThreadInfo }> {
        const ids = Array.isArray(threadIDs) ? threadIDs : [threadIDs];
        this.log('Getting thread info for:', ids);
        // Ensure tokens present before GraphQL call (fb_dtsg etc.)
        try { await this.ensureFbDtsg?.(); } catch (_) { /* non-fatal */ }

        // Primary attempt: current batch GraphQL format (array of queries)
        const buildPrimaryQueries = () => ids.map(threadID => ({
            doc_id: "1849319281789796", // primary GraphQL doc ID (may change over time)
            query_params: {
                id: threadID,
                message_limit: 0,
                load_messages: false,
                load_read_receipts: false,
                before: null
            }
        }));

        const attemptPrimary = async () => {
            const form = {
                queries: JSON.stringify(buildPrimaryQueries()),
                batch_name: "MessengerGraphQLThreadFetcher"
            };
            return this.makeRequest(
                FacebookConstants.ENDPOINTS.GRAPHQL_BATCH,
                form
            );
        };

        // Secondary attempt: object keyed queries (o0, o1...) some FB variants expect this shape
        const attemptObjectQueries = async () => {
            const keyed: any = {};
            ids.forEach((threadID, idx) => {
                keyed[`o${idx}`] = {
                    doc_id: "1849319281789796",
                    query_params: {
                        id: threadID,
                        message_limit: 0,
                        load_messages: false,
                        load_read_receipts: false,
                        before: null
                    }
                };
            });
            const form = {
                queries: JSON.stringify(keyed),
                batch_name: "MessengerGraphQLThreadFetcher"
            };
            return this.makeRequest(
                FacebookConstants.ENDPOINTS.GRAPHQL_BATCH,
                form
            );
        };

        // Tertiary fallback: legacy mercury endpoint (returns different structure) for single thread only
        const attemptLegacyEndpoint = async () => {
            if (ids.length !== 1) throw new Error('Legacy endpoint supports only single thread');
            const legacyForm: any = {
                [`thread_ids[0]`]: ids[0],
                offset: 0,
                limit: 0
            };
            const response = await this.makeRequest(
                FacebookConstants.ENDPOINTS.GET_THREAD_INFO,
                legacyForm
            );
            // Adapt legacy response into expected batch array format for parser reuse
            if (response && (response as any).payload) {
                const payload: any = (response as any).payload;
                let threadData: any = undefined;
                if (payload.threads && ids[0]) {
                    try {
                        threadData = payload.threads[ids[0]];
                    } catch { /* ignore index issues */ }
                }
                if (!threadData) threadData = payload;
                return [{ data: threadData }];
            }
            return response;
        };

        let response: any;
        try {
            response = await attemptPrimary();
        } catch (err: any) {
            // Retry on network / 500 only
            const is500 = err?.originalError?.response?.statusCode === 500 || /500/.test(String(err));
            if (is500) {
                this.log('Primary thread info fetch failed (500). Trying object-keyed queries.');
                try {
                    response = await attemptObjectQueries();
                } catch (err2: any) {
                    const is500b = err2?.originalError?.response?.statusCode === 500 || /500/.test(String(err2));
                    if (is500b) {
                        this.log('Object-keyed queries also failed (500). Attempting legacy mercury endpoint.');
                        try {
                            response = await attemptLegacyEndpoint();
                        } catch (legacyErr) {
                            throw legacyErr; // propagate final failure
                        }
                    } else {
                        throw err2;
                    }
                }
            } else {
                throw err;
            }
        }

        if (response?.error) {
            throw new Error(`Get thread info failed: ${response.error}`);
        }

        const result = this.formatThreadInfoData(response, ids);
        this.log('Thread info retrieved successfully (after potential fallback):', Object.keys(result));
        return result;
    }

    /**
     * Get thread list
     */
    async getThreadList(
        limit: number = 20,
        timestamp?: number,
        tags?: string[],
        callback?: (err: any, data?: ThreadListItem[]) => void
    ): Promise<ThreadListItem[]> {
        const promise = this.executeGetThreadList(limit, timestamp, tags);
        return this.handleCallback(promise, callback);
    }

    private async executeGetThreadList(
        limit: number,
        timestamp?: number,
        tags?: string[]
    ): Promise<ThreadListItem[]> {
        this.log('Getting thread list with limit:', limit);

        const queryParams: any = {
            limit: limit,
            tags: tags || ["INBOX"],
            includeDeliveryReceipts: true,
            includeSeqID: false
        };

        // Only add 'before' if timestamp is provided
        if (timestamp) {
            queryParams.before = timestamp;
        }

        const form = {
            queries: JSON.stringify({
                o0: {
                    doc_id: "3426149104143726",
                    query_params: queryParams
                }
            }),
            batch_name: "MessengerGraphQLThreadlistFetcher"
        };

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.GRAPHQL_BATCH,
            form,
            { debugToFile: './dist/test/thread_list_request_debug.json' }
        );

        // Save full response for debugging
        try {
            fs.writeFileSync('./dist/test/thread_list_full_response.json', JSON.stringify(response, null, 2), 'utf8');
        } catch (e) { /* ignore */ }

        if (response.error) {
            // Save error response for debugging
            try {
                fs.writeFileSync('./dist/test/thread_list_error_response.json', JSON.stringify(response, null, 2), 'utf8');
            } catch (e) { /* ignore */ }
            throw new Error(`Get thread list failed: ${response.error}`);
        }

        const result = this.formatThreadListData(response);
        this.log(`Thread list retrieved: ${result.length} threads`);
        return result;
    }

    /**
     * Create new group
     */
    async createNewGroup(
        participantIDs: string[],
        groupTitle: string,
        callback?: (err: any, data?: { threadID: string }) => void
    ): Promise<{ threadID: string }> {
        const promise = this.executeCreateNewGroup(participantIDs, groupTitle);
        return this.handleCallback(promise, callback);
    }

    private async executeCreateNewGroup(
        participantIDs: string[],
        groupTitle: string
    ): Promise<{ threadID: string }> {
        this.log('Creating new group:', { title: groupTitle, participants: participantIDs });

        const participants = participantIDs.map(id => ({ fbid: this.formatID(id) }));
        if (this.ctx.UserID) {
            participants.push({ fbid: this.ctx.UserID });
        }

        const variables = {
            input: {
                entry_point: "jewel_new_group",
                actor_id: this.ctx.UserID,
                participants,
                client_mutation_id: Math.round(Math.random() * 1024).toString(),
                thread_settings: {
                    name: groupTitle,
                    joinable_mode: "PRIVATE",
                    thread_image_fbid: null
                }
            }
        };

        const response = await this.makeGraphQLRequest(
            "577041672419534", // doc_id for creating group
            variables,
            "MessengerGroupCreateMutation"
        );

        if (response.errors) {
            throw new Error(`Create group failed: ${JSON.stringify(response.errors)}`);
        }

        const threadID = response.data?.messenger_group_create?.thread?.thread_key?.thread_fbid;
        if (!threadID) {
            throw new Error('Failed to get thread ID from response');
        }

        this.log('Group created successfully:', threadID);
        return { threadID };
    }

    /**
     * Change group name
     */
    async changeThreadTitle(
        threadID: string,
        newTitle: string,
        callback?: (err: any) => void
    ): Promise<void> {
        const promise = this.executeChangeThreadTitle(threadID, newTitle);
        return this.handleCallback(promise, callback);
    }

    private async executeChangeThreadTitle(
        threadID: string,
        newTitle: string
    ): Promise<void> {
        this.log('Changing thread title:', { threadID, newTitle });

        const messageAndOTID = this.generateOfflineThreadingID();

        const form = {
            client: "mercury",
            action_type: "ma-type:log-message",
            author: "fbid:" + this.ctx.UserID,
            thread_id: "",
            timestamp: Date.now(),
            timestamp_absolute: "Today",
            timestamp_relative: this.generateTimestampRelative(),
            is_unread: false,
            is_cleared: false,
            is_forward: false,
            source: "source:chat:web",
            "source_tags[0]": "source:chat",
            log_message_type: "log:thread-name",
            log_message_data: JSON.stringify({
                name: newTitle
            }),
            status: "0",
            offline_threading_id: messageAndOTID,
            message_id: messageAndOTID,
            threading_id: this.generateThreadingID(),
            manual_retry_cnt: "0",
            thread_fbid: threadID
        };

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.SET_THREAD_NAME,
            form
        );

        if (response.error) {
            throw new Error(`Change thread title failed: ${response.error}`);
        }

        this.log('Thread title changed successfully');
    }

    /**
     * Add user to group
     */
    async addUserToGroup(
        userIDs: string | string[],
        threadID: string,
        callback?: (err: any) => void
    ): Promise<void> {
        const promise = this.executeAddUserToGroup(userIDs, threadID);
        return this.handleCallback(promise, callback);
    }

    private async executeAddUserToGroup(
        userIDs: string | string[],
        threadID: string
    ): Promise<void> {
        const ids = Array.isArray(userIDs) ? userIDs : [userIDs];
        this.log('Adding users to group:', { userIDs: ids, threadID });

        const messageAndOTID = this.generateOfflineThreadingID();

        const form: { [key: string]: any } = {
            client: "mercury",
            action_type: "ma-type:log-message",
            author: "fbid:" + this.ctx.UserID,
            thread_id: "",
            timestamp: Date.now(),
            timestamp_absolute: "Today",
            timestamp_relative: this.generateTimestampRelative(),
            is_unread: false,
            is_cleared: false,
            source: "source:chat:web",
            "source_tags[0]": "source:chat",
            log_message_type: "log:subscribe",
            status: "0",
            offline_threading_id: messageAndOTID,
            message_id: messageAndOTID,
            threading_id: this.generateThreadingID(),
            manual_retry_cnt: "0",
            thread_fbid: threadID
        };

        ids.forEach((userID, index) => {
            form[`log_message_data[added_participants][${index}]`] = "fbid:" + this.formatID(userID);
        });

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.SEND_MESSAGE,
            form
        );

        if (response.error) {
            throw new Error(`Add user to group failed: ${response.error}`);
        }

        this.log('Users added to group successfully');
    }

    /**
     * Remove user from group
     */
    async removeUserFromGroup(
        userID: string,
        threadID: string,
        callback?: (err: any) => void
    ): Promise<void> {
        const promise = this.executeRemoveUserFromGroup(userID, threadID);
        return this.handleCallback(promise, callback);
    }

    private async executeRemoveUserFromGroup(
        userID: string,
        threadID: string
    ): Promise<void> {
        this.log('Removing user from group:', { userID, threadID });

        const form = {
            uid: this.formatID(userID),
            tid: threadID
        };

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.REMOVE_PARTICIPANTS,
            form
        );

        if (response.error) {
            throw new Error(`Remove user from group failed: ${response.error}`);
        }

        this.log('User removed from group successfully');
    }

    /**
     * Change group emoji
     */
    async changeThreadEmoji(
        threadID: string,
        emoji: string,
        callback?: (err: any) => void
    ): Promise<void> {
        const promise = this.executeChangeThreadEmoji(threadID, emoji);
        return this.handleCallback(promise, callback);
    }

    private async executeChangeThreadEmoji(
        threadID: string,
        emoji: string
    ): Promise<void> {
        this.log('Changing thread emoji:', { threadID, emoji });

        const form = {
            thread_or_other_fbid: threadID,
            emoji_choice: emoji
        };

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.SAVE_THREAD_EMOJI,
            form
        );

        if (response.error) {
            throw new Error(`Change thread emoji failed: ${response.error}`);
        }

        this.log('Thread emoji changed successfully');
    }

    // Helper methods

    private formatThreadInfoData(
        response: any,
        requestedThreadIDs: string[]
    ): { [threadID: string]: ThreadInfo } {
        const result: { [threadID: string]: ThreadInfo } = {};

        try {
            if (response && Array.isArray(response)) {
                response.forEach((threadData, index) => {
                    const threadID = requestedThreadIDs[index];
                    if (threadData && threadData.data && threadID) {
                        const data = threadData.data.message_thread || threadData.data;
                        result[threadID] = this.parseThreadData(data, threadID);
                    }
                });
            }
        } catch (error) {
            this.log('Error formatting thread info data:', error);
        }

        return result;
    }

    private parseThreadData(data: any, threadID: string): ThreadInfo {
        return {
            threadID,
            threadName: data.name || data.thread_name || '',
            participantIDs: (data.all_participants?.nodes || []).map((p: any) => 
                this.formatID(p.messaging_actor?.id || p.id)
            ),
            messageCount: data.messages_count || 0,
            isGroup: !!(data.thread_type === 'GROUP' || (data.all_participants?.nodes?.length || 0) > 2),
            isArchived: data.is_archived || false,
            isCanReply: data.can_reply !== false,
            admins: (data.thread_admins || []).map((admin: any) => this.formatID(admin.id)),
            emoji: data.customization_info?.emoji || '',
            color: data.customization_info?.outgoing_bubble_color || '',
            nicknames: this.parseNicknames(data.customization_info?.participant_customizations || [])
        };
    }

    private formatThreadListData(response: any): ThreadListItem[] {
        try {
            // Response structure: { o0: { data: { viewer: { message_threads: { nodes: [...] } } } } }
            if (response && response.o0 && response.o0.data) {
                const threads = response.o0.data.viewer?.message_threads?.nodes || [];
                return threads.map((thread: any) => this.parseThreadListItem(thread));
            }
        } catch (error) {
            this.log('Error formatting thread list data:', error);
        }

        return [];
    }

    private parseThreadListItem(thread: any): ThreadListItem {
        const participants: { [userID: string]: any } = {};
        const participantIDs: string[] = [];
        
        // Parse participants from edges structure (ws3-fca format)
        if (thread.all_participants && thread.all_participants.edges) {
            thread.all_participants.edges.forEach((edge: any) => {
                const actor = edge.node?.messaging_actor;
                if (actor) {
                    const userID = this.formatID(actor.id);
                    participantIDs.push(userID);
                    participants[userID] = {
                        name: actor.name || '',
                        shortName: actor.short_name || '',
                        firstName: actor.short_name || '',
                        vanity: actor.username || '',
                        url: actor.url || '',
                        thumbSrc: actor.big_image_src?.uri || '',
                        profileUrl: actor.big_image_src?.uri || '',
                        gender: actor.gender || '',
                        type: actor.__typename || '',
                        isFriend: actor.is_viewer_friend || false,
                        isBirthday: !!actor.is_birthday
                    };
                }
            });
        }
        // Fallback to nodes structure if edges not available
        else if (thread.all_participants && thread.all_participants.nodes) {
            thread.all_participants.nodes.forEach((participant: any) => {
                const actor = participant.messaging_actor;
                if (actor) {
                    const userID = this.formatID(actor.id);
                    participantIDs.push(userID);
                    participants[userID] = {
                        name: actor.name || '',
                        shortName: actor.short_name || ''
                    };
                }
            });
        }

        return {
            threadID: thread.thread_key?.thread_fbid || thread.thread_key?.other_user_id || '',
            name: thread.name || this.generateThreadName(participants),
            isGroup: thread.thread_type === 'GROUP',
            isUnread: thread.unread_count > 0,
            messageCount: thread.messages_count || 0,
            timestamp: parseInt(thread.updated_time_precise) || Date.now(),
            snippet: thread.last_message?.nodes?.[0]?.snippet || '',
            snippetSender: thread.last_message?.nodes?.[0]?.message_sender?.messaging_actor?.id || '',
            participants,
            participantIDs,
            unreadCount: thread.unread_count || 0,
            muteUntil: thread.mute_until || null,
            isSubscribed: thread.is_viewer_subscribed || false,
            isArchived: thread.has_viewer_archived || false,
            folder: thread.folder || 'INBOX',
            cannotReplyReason: thread.cannot_reply_reason || null,
            emoji: thread.customization_info?.emoji || null,
            color: thread.customization_info?.outgoing_bubble_color?.slice(2) || null,
            nicknames: this.parseNicknames(thread.customization_info?.participant_customizations || []),
            adminIDs: (thread.thread_admins || []).map((admin: any) => this.formatID(admin.id || admin)),
            approvalMode: !!thread.approval_mode,
            threadType: thread.thread_type === 'GROUP' ? 2 : 1
        };
    }

    private parseNicknames(customizations: any[]): { [userID: string]: string } {
        const nicknames: { [userID: string]: string } = {};
        
        customizations.forEach((customization: any) => {
            if (customization.participant_id && customization.nickname) {
                nicknames[this.formatID(customization.participant_id)] = customization.nickname;
            }
        });

        return nicknames;
    }

    private generateThreadName(participants: { [userID: string]: any }): string {
        const names = Object.values(participants)
            .map((p: any) => p.shortName || p.name)
            .filter(Boolean);
        
        if (names.length <= 3) {
            return names.join(', ');
        }
        
        return names.slice(0, 2).join(', ') + ` and ${names.length - 2} others`;
    }
}
