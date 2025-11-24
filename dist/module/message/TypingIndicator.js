/**
 * Typing Indicator Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
import { FacebookConstants } from "../../src/constants/FacebookConstants.js";
/**
 * Typing Indicator functionality
 * Handles sending typing status
 */
export class TypingIndicator extends BaseAPIModule {
    /**
     * Send typing indicator
     * @param threadID Thread ID where typing indicator should appear
     * @param isTyping Whether user is typing (true) or stopped typing (false)
     * @param callback Optional callback function
     */
    async send(threadID, isTyping = true, callback) {
        const promise = this.executeSend(threadID, isTyping);
        return this.handleCallback(promise, callback);
    }
    async executeSend(threadID, isTyping) {
        this.log('Setting typing indicator:', { threadID, isTyping });
        const form = {
            typ: isTyping ? 1 : 0,
            thread: threadID,
            source: "mercury-chat"
        };
        await this.makeRequest(FacebookConstants.ENDPOINTS.TYPING, form, { parseResponse: false });
        this.log('Typing indicator set successfully');
    }
}
//# sourceMappingURL=TypingIndicator.js.map