/**
 * Unsend Message Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
/**
 * Unsend Message functionality
 * Handles deleting/unsending messages
 */
export declare class UnsendMessage extends BaseAPIModule {
    /**
     * Unsend/delete a message
     * @param messageID ID of the message to unsend
     * @param callback Optional callback function
     */
    unsend(messageID: string, callback?: (err: any) => void): Promise<void>;
    private executeUnsend;
}
//# sourceMappingURL=UnsendMessage.d.ts.map