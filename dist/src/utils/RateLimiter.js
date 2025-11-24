export class RateLimiter {
    requests = [];
    maxRequests;
    windowMs;
    constructor(config) {
        this.maxRequests = config.maxRequests;
        this.windowMs = config.windowMs;
    }
    /**
     * Check if request is allowed and wait if necessary
     */
    async checkRateLimit() {
        const now = Date.now();
        // Remove old requests outside the window
        this.requests = this.requests.filter((time) => now - time < this.windowMs);
        if (this.requests.length >= this.maxRequests) {
            // Calculate how long to wait
            const oldestRequest = Math.min(...this.requests);
            const waitTime = this.windowMs - (now - oldestRequest);
            if (waitTime > 0) {
                await this.sleep(waitTime);
                return this.checkRateLimit(); // Check again after waiting
            }
        }
        // Record this request
        this.requests.push(now);
    }
    /**
     * Get current rate limit status
     */
    getStatus() {
        const now = Date.now();
        this.requests = this.requests.filter((time) => now - time < this.windowMs);
        const remaining = Math.max(0, this.maxRequests - this.requests.length);
        const resetTime = this.requests.length > 0
            ? Math.min(...this.requests) + this.windowMs
            : now;
        return { remaining, resetTime };
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=RateLimiter.js.map