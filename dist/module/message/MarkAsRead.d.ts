/**
 * Mark As Read Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
/**
 * Mark As Read functionality
 * Handles marking messages/threads as read
 */
export declare class MarkAsRead extends BaseAPIModule {
    /**
     * Mark message/thread as read
     * @param threadID Thread ID to mark as read
     * @param callback Optional callback function
     */
    mark(threadID: string, callback?: (err: any) => void): Promise<void>;
    private executeMark;
}
//# sourceMappingURL=MarkAsRead.d.ts.map