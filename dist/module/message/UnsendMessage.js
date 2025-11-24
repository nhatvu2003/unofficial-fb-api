/**
 * Unsend Message Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
import { FacebookConstants } from "../../src/constants/FacebookConstants.js";
/**
 * Unsend Message functionality
 * Handles deleting/unsending messages
 */
export class UnsendMessage extends BaseAPIModule {
    /**
     * Unsend/delete a message
     * @param messageID ID of the message to unsend
     * @param callback Optional callback function
     */
    async unsend(messageID, callback) {
        const promise = this.executeUnsend(messageID);
        return this.handleCallback(promise, callback);
    }
    async executeUnsend(messageID) {
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
}
//# sourceMappingURL=UnsendMessage.js.map