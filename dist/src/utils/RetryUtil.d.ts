/**
 * Retry Utility Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
export interface RetryOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
    retryCondition?: (error: any) => boolean;
}
/**
 * Utility for implementing retry logic with exponential backoff
 */
export declare class RetryUtil {
    private static readonly DEFAULT_OPTIONS;
    /**
     * Execute a function with retry logic
     */
    static executeWithRetry<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>, context?: string): Promise<T>;
    private static sleep;
}
//# sourceMappingURL=RetryUtil.d.ts.map