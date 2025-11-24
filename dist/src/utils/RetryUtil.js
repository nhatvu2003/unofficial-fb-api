/**
 * Retry Utility Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import Logger from "./Logger.js";
import { ErrorHandler, ErrorType, FacebookAPIException, } from "./ErrorHandler.js";
/**
 * Utility for implementing retry logic with exponential backoff
 */
export class RetryUtil {
    static DEFAULT_OPTIONS = {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        retryCondition: (error) => {
            // Retry on network errors, rate limits, or temporary server errors
            if (error instanceof FacebookAPIException) {
                return (error.type === ErrorType.NETWORK ||
                    error.type === ErrorType.RATE_LIMIT);
            }
            const statusCode = error?.response?.statusCode;
            return (statusCode === 429 || // Rate limit
                statusCode === 503 || // Service unavailable
                statusCode === 502 || // Bad gateway
                error?.code === "ENOTFOUND" ||
                error?.code === "ECONNREFUSED");
        },
    };
    /**
     * Execute a function with retry logic
     */
    static async executeWithRetry(fn, options = {}, context) {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        let lastError;
        for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                // Don't retry if condition fails or it's the last attempt
                if (!opts.retryCondition(error) || attempt === opts.maxAttempts) {
                    break;
                }
                const delay = Math.min(opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1), opts.maxDelay);
                Logger.warn(`Attempt ${attempt}/${opts.maxAttempts} failed${context ? ` for ${context}` : ""}. Retrying in ${delay}ms...`, error instanceof Error ? error.message : String(error));
                await this.sleep(delay);
            }
        }
        // If we get here, all attempts failed
        if (lastError instanceof FacebookAPIException) {
            throw lastError;
        }
        throw ErrorHandler.createError(ErrorType.UNKNOWN, `All retry attempts failed${context ? ` for ${context}` : ""}`, lastError, { maxAttempts: opts.maxAttempts, context });
    }
    static sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=RetryUtil.js.map