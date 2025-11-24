/**
 * Build API Core Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import type { ConfigTypes, BuildApiContext } from "../../types/CreateApiTypes.js";
/**
 * BuildAPI class - Core Facebook API Context Builder
 * @author Nhat Vu
 *
 * @description
 * This class is responsible for constructing and initializing the Facebook API client context.
 * It performs the following critical operations:
 *
 * 1. **Authentication Setup**: Validates and processes Facebook cookies for authentication
 * 2. **Token Extraction**: Extracts necessary security tokens (fb_dtsg, jazoest) from Facebook's HTML
 * 3. **Context Building**: Creates a complete API context with user information and session data
 * 4. **Security Validation**: Ensures all required security parameters are present and valid
 *
 * The BuildAPI class acts as a bridge between the raw Facebook login response and a fully
 * functional API client, handling all the complex token extraction and context initialization
 * required for subsequent API operations.
 */
declare class BuildAPI {
    /** Raw HTML content from Facebook's login/home page */
    private html;
    /** Cheerio instance for HTML parsing and token extraction */
    private $;
    /** API context containing all session data and tokens */
    private ctx;
    /** Normalized cookie jar adapter for cross-platform cookie handling */
    private jar;
    /** Runtime configuration for logging, timeouts, and behavior settings */
    private Config;
    /**
     * Initialize BuildAPI instance
     *
     * @param Jar - Cookie jar containing Facebook authentication cookies.
     *               Can be any supported cookie jar format (tough-cookie, puppeteer, etc.)
     *               which will be normalized via JarAdapter for consistent handling.
     *
     * @param Html - Raw HTML content from Facebook's login response or home page.
     *               This HTML contains embedded security tokens and configuration data
     *               that are essential for API operations.
     *
     * @param Config - Runtime configuration object containing:
     *                 - Logging preferences (showLogs, developmentLog)
     *                 - Network settings (timeout, userAgents, proxy)
     *                 - Retry and rate limiting configuration
     */
    constructor(Jar: any, Html: string, Config: ConfigTypes);
    /**
     * Initialize the BuildAPI context.
     * - extracts the c_user id from cookies
     * - populates the context (clientID, loggedIn)
     * - triggers token extraction (fb_dtsg, jazoest)
     */
    init(): Promise<BuildApiContext>;
    /**
     * Read cookies from the normalized jar and return the c_user value.
     * Returns null when the cookie cannot be found or an error occurs.
     */
    private extractUserID;
    /**
     * Generate a simple pseudo-random client ID string.
     */
    private generateClientID;
    /**
     * Extract fb_dtsg token.
     * - tries HTML input[name="fb_dtsg"]
     * - falls back to script regexes
     * - finally requests the /ajax/dtsg endpoint and parses the JSON safely
     * Sets this.ctx.fb_dtsg when found.
     */
    getFbDtsg(): Promise<void>;
    /**
     * Extract lsd token (legacy security data)
     * This token is often required for certain Facebook API endpoints
     */
    getLsd(): Promise<void>;
    /**
     * Get or compute jazoest value.
     * - prefers extraction from HTML input[name="jazoest"]
     * - falls back to a computed checksum based on fb_dtsg
     * @param fbDtsg - fb_dtsg token (optional) used for computing fallback jazoest
     */
    getJazoest(fbDtsg: string): Promise<void>;
    /**
     * Compute a simple jazoest fallback from the fb_dtsg token.
     * This is a lightweight checksum used when HTML does not contain jazoest.
     */
    private computeJazoest;
    /**
     * Extract __s parameter from HTML for request validation
     */
    private extractSParameter;
    /**
     * Return the built API context. Contains UserID, cookieJar, clientID, loggedIn,
     * and tokens like fb_dtsg and jazoest when available.
     */
    getContext(): BuildApiContext;
}
export default BuildAPI;
//# sourceMappingURL=BuildAPI.d.ts.map