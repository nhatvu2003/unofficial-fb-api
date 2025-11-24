/**
 * User Agents Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import type { PlatformConfig } from "../../types/HttpClientTypes.ts";
declare class UserAgent {
    static defaultUserAgent: string;
    static windowsUserAgent: string;
    static platform: PlatformConfig;
    static userAgentArray: string[];
    /**
     * Get a random element from array
     */
    static getRandom<T>(arr: T[]): T | undefined;
    /**
     * Generate a random user agent string
     */
    static randomUserAgent(): string;
    /**
     * Get default user agent
     */
    static getDefault(): string;
    /**
     * Get Windows user agent
     */
    static getWindows(): string;
}
export default UserAgent;
//# sourceMappingURL=UserAgents.d.ts.map