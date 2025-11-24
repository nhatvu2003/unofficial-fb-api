/**
 * API Manager Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
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
export class APIManager {
    messageModule;
    userModule;
    threadModule;
    // Message-related functions
    sendMessage;
    unsendMessage;
    markAsRead;
    sendTypingIndicator;
    // User-related functions
    getUserInfo;
    getFriendsList;
    getUserID;
    getUserAvatar;
    addFriend;
    unfriend;
    // Thread-related functions
    getThreadInfo;
    getThreadList;
    createNewGroup;
    changeThreadTitle;
    addUserToGroup;
    removeUserFromGroup;
    changeThreadEmoji;
    constructor(ctx, config) {
        this.messageModule = new MessageModule(ctx, config);
        this.userModule = new UserModule(ctx, config);
        this.threadModule = new ThreadModule(ctx, config);
        // Bind methods after initialization
        this.bindMethods();
    }
    bindMethods() {
        // Message-related functions
        this.sendMessage = this.messageModule.sendMessage.bind(this.messageModule);
        this.unsendMessage = this.messageModule.unsendMessage.bind(this.messageModule);
        this.markAsRead = this.messageModule.markAsRead.bind(this.messageModule);
        this.sendTypingIndicator = this.messageModule.sendTypingIndicator.bind(this.messageModule);
        // User-related functions
        this.getUserInfo = this.userModule.getUserInfo.bind(this.userModule);
        this.getFriendsList = this.userModule.getFriendsList.bind(this.userModule);
        this.getUserID = this.userModule.getUserID.bind(this.userModule);
        this.getUserAvatar = this.userModule.getUserAvatar.bind(this.userModule);
        this.addFriend = this.userModule.addFriend.bind(this.userModule);
        this.unfriend = this.userModule.unfriend.bind(this.userModule);
        // Thread-related functions
        this.getThreadInfo = this.threadModule.getThreadInfo.bind(this.threadModule);
        this.getThreadList = this.threadModule.getThreadList.bind(this.threadModule);
        this.createNewGroup = this.threadModule.createNewGroup.bind(this.threadModule);
        this.changeThreadTitle = this.threadModule.changeThreadTitle.bind(this.threadModule);
        this.addUserToGroup = this.threadModule.addUserToGroup.bind(this.threadModule);
        this.removeUserFromGroup = this.threadModule.removeUserFromGroup.bind(this.threadModule);
        this.changeThreadEmoji = this.threadModule.changeThreadEmoji.bind(this.threadModule);
    }
    /**
     * Get access to individual modules for advanced usage
     */
    getModules() {
        return {
            message: this.messageModule,
            user: this.userModule,
            thread: this.threadModule
        };
    }
    /**
     * Add custom functions from external modules
     */
    addFunctions(functions) {
        Object.keys(functions).forEach(name => {
            if (typeof functions[name] === 'function') {
                this[name] = functions[name];
            }
        });
    }
    /**
     * Load functions from a directory (for compatibility)
     */
    loadFunctionsFromDirectory(directory) {
        // This would be implemented to load additional functions
        // from a directory structure similar to ws3-fca
        console.warn('loadFunctionsFromDirectory not implemented yet');
    }
    /**
     * Get the current API context (UserID, tokens, etc.)
     */
    getContext() {
        return this.messageModule.getContext();
    }
}
//# sourceMappingURL=APIManager.js.map