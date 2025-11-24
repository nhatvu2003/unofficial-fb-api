/**
 * Typing Indicator Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from "../BaseAPIModule.js";
/**
 * Typing Indicator functionality
 * Handles sending typing status
 */
export declare class TypingIndicator extends BaseAPIModule {
    /**
     * Send typing indicator
     * @param threadID Thread ID where typing indicator should appear
     * @param isTyping Whether user is typing (true) or stopped typing (false)
     * @param callback Optional callback function
     */
    send(threadID: string, isTyping?: boolean, callback?: (err: any) => void): Promise<void>;
    private executeSend;
}
//# sourceMappingURL=TypingIndicator.d.ts.map