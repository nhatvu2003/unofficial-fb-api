/**
 * API Manager Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import type { ConfigTypes, BuildApiContext } from "../types/CreateApiTypes.js";
import { MessageModule } from "./MessageModule.js";
import { UserModule } from "./UserModule.js";
import { ThreadModule } from "./ThreadModule.js";
/**
 * Central API Manager that coordinates all Facebook Messenger API modules
 *
 * The APIManager serves as the main coordinator for all API functionality,
 * organizing methods into logical modules (Message, User, Thread) while
 * providing a unified interface for external access.
 *
 * This class follows the facade pattern, exposing all module methods
 * as direct properties for easy access while maintaining internal
 * module separation for better code organization.
 *
 * @example
 * ```typescript
 * const manager = new APIManager(ctx, config);
 *
 * // Access message functions
 * await manager.sendMessage('Hello!', 'THREAD_ID');
 *
 * // Access user functions
 * const userInfo = await manager.getUserInfo('USER_ID');
 *
 * // Access thread functions
 * const threads = await manager.getThreadList(20);
 *
 * // Get individual modules for advanced usage
 * const { message, user, thread } = manager.getModules();
 * ```
 */
export declare class APIManager {
    private messageModule;
    private userModule;
    private threadModule;
    sendMessage: MessageModule['sendMessage'];
    unsendMessage: MessageModule['unsendMessage'];
    markAsRead: MessageModule['markAsRead'];
    sendTypingIndicator: MessageModule['sendTypingIndicator'];
    getUserInfo: UserModule['getUserInfo'];
    getFriendsList: UserModule['getFriendsList'];
    getUserID: UserModule['getUserID'];
    getUserAvatar: UserModule['getUserAvatar'];
    addFriend: UserModule['addFriend'];
    unfriend: UserModule['unfriend'];
    getThreadInfo: ThreadModule['getThreadInfo'];
    getThreadList: ThreadModule['getThreadList'];
    createNewGroup: ThreadModule['createNewGroup'];
    changeThreadTitle: ThreadModule['changeThreadTitle'];
    addUserToGroup: ThreadModule['addUserToGroup'];
    removeUserFromGroup: ThreadModule['removeUserFromGroup'];
    changeThreadEmoji: ThreadModule['changeThreadEmoji'];
    constructor(ctx: BuildApiContext, config: Required<ConfigTypes>);
    private bindMethods;
    /**
     * Get access to individual modules for advanced usage
     */
    getModules(): {
        message: MessageModule;
        user: UserModule;
        thread: ThreadModule;
    };
    /**
     * Add custom functions from external modules
     */
    addFunctions(functions: {
        [name: string]: any;
    }): void;
    /**
     * Load functions from a directory (for compatibility)
     */
    loadFunctionsFromDirectory(directory: string): void;
    /**
     * Get the current API context (UserID, tokens, etc.)
     */
    getContext(): BuildApiContext;
}
//# sourceMappingURL=APIManager.d.ts.map