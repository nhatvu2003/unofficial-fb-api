/**
 * Thread Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from './BaseAPIModule.js';
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
    nicknames?: {
        [userID: string]: string;
    };
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
    participants: {
        [userID: string]: any;
    };
    participantIDs: string[];
    unreadCount: number;
    muteUntil: number | null;
    isSubscribed: boolean;
    isArchived: boolean;
    folder: string;
    cannotReplyReason: string | null;
    emoji: string | null;
    color: string | null;
    nicknames: {
        [userID: string]: string;
    };
    adminIDs: string[];
    approvalMode: boolean;
    threadType: number;
}
/**
 * Thread/Conversation-related API functions
 */
export declare class ThreadModule extends BaseAPIModule {
    /**
     * Get thread information
     */
    getThreadInfo(threadIDs: string | string[], callback?: (err: any, data?: {
        [threadID: string]: ThreadInfo;
    }) => void): Promise<{
        [threadID: string]: ThreadInfo;
    }>;
    private executeGetThreadInfo;
    /**
     * Get thread list
     */
    getThreadList(limit?: number, timestamp?: number, tags?: string[], callback?: (err: any, data?: ThreadListItem[]) => void): Promise<ThreadListItem[]>;
    private executeGetThreadList;
    /**
     * Create new group
     */
    createNewGroup(participantIDs: string[], groupTitle: string, callback?: (err: any, data?: {
        threadID: string;
    }) => void): Promise<{
        threadID: string;
    }>;
    private executeCreateNewGroup;
    /**
     * Change group name
     */
    changeThreadTitle(threadID: string, newTitle: string, callback?: (err: any) => void): Promise<void>;
    private executeChangeThreadTitle;
    /**
     * Add user to group
     */
    addUserToGroup(userIDs: string | string[], threadID: string, callback?: (err: any) => void): Promise<void>;
    private executeAddUserToGroup;
    /**
     * Remove user from group
     */
    removeUserFromGroup(userID: string, threadID: string, callback?: (err: any) => void): Promise<void>;
    private executeRemoveUserFromGroup;
    /**
     * Change group emoji
     */
    changeThreadEmoji(threadID: string, emoji: string, callback?: (err: any) => void): Promise<void>;
    private executeChangeThreadEmoji;
    private formatThreadInfoData;
    private parseThreadData;
    private formatThreadListData;
    private parseThreadListItem;
    private parseNicknames;
    private generateThreadName;
}
//# sourceMappingURL=ThreadModule.d.ts.map