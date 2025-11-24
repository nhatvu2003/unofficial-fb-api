/**
 * Rate Limiter Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 *
 * Simple rate limiter implementation
 */
export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}
export declare class RateLimiter {
    private requests;
    private readonly maxRequests;
    private readonly windowMs;
    constructor(config: RateLimitConfig);
    /**
     * Check if request is allowed and wait if necessary
     */
    checkRateLimit(): Promise<void>;
    /**
     * Get current rate limit status
     */
    getStatus(): {
        remaining: number;
        resetTime: number;
    };
    private sleep;
}
//# sourceMappingURL=RateLimiter.d.ts.map