/**
 * Mark As Read Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
import { FacebookConstants } from "../../src/constants/FacebookConstants.js";
/**
 * Mark As Read functionality
 * Handles marking messages/threads as read
 */
export class MarkAsRead extends BaseAPIModule {
    /**
     * Mark message/thread as read
     * @param threadID Thread ID to mark as read
     * @param callback Optional callback function
     */
    async mark(threadID, callback) {
        const promise = this.executeMark(threadID);
        return this.handleCallback(promise, callback);
    }
    async executeMark(threadID) {
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
}
//# sourceMappingURL=MarkAsRead.js.map