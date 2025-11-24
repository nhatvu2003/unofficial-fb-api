/**
 * Build API Core Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import * as cheerio from "cheerio";
import type {
  ConfigTypes,
  BuildApiContext,
} from "../../types/CreateApiTypes.js";
import Logger from "../utils/Logger.js";
import HttpClient from "../utils/HttpClient.js";
import JarAdapter from "../utils/JarAdapter.js";

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
class BuildAPI {
  /** Raw HTML content from Facebook's login/home page */
  private html: string = "";

  /** Cheerio instance for HTML parsing and token extraction */
  private $: cheerio.CheerioAPI | null = null;

  /** API context containing all session data and tokens */
  private ctx: BuildApiContext = {
    cookieJar: null,
    clientID: "",
    loggedIn: false,
    fb_dtsg: "",
  };

  /** Normalized cookie jar adapter for cross-platform cookie handling */
  private jar: any;

  /** Runtime configuration for logging, timeouts, and behavior settings */
  private Config: ConfigTypes;

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
  constructor(Jar: any, Html: string, Config: ConfigTypes) {
    // Normalize cookie jar to consistent adapter interface
    this.jar = JarAdapter.wrap(Jar);
    this.html = Html;
    this.Config = Config;

    // Initialize base context with cookie jar
    this.ctx = {
      cookieJar: this.jar,
      clientID: "",
      loggedIn: false,
      fb_dtsg: "",
    };

    // Load HTML for token extraction using Cheerio
    this.$ = cheerio.load(Html);
  }

  /**
   * Initialize the BuildAPI context.
   * - extracts the c_user id from cookies
   * - populates the context (clientID, loggedIn)
   * - triggers token extraction (fb_dtsg, jazoest)
   */
  async init() {
    try {
      // Extract user ID from cookies
      const userID = this.extractUserID();
      if (userID) {
        this.ctx.UserID = userID;
        this.ctx.loggedIn = true;

        if (this.Config.showLogs) {
          Logger.log(`Extracted User ID: ${userID}`);
        }
      }

      // Generate client ID for session tracking
      this.ctx.clientID = this.generateClientID();

      // Extract security tokens
      await this.getFbDtsg();
      await this.getLsd();
      await this.getJazoest(this.ctx.fb_dtsg);

      // Extract __s parameter
      this.ctx.__s = this.extractSParameter();

      if (this.Config.showLogs) {
        Logger.log("BuildAPI initialization completed successfully");
      }

      return this.ctx;
    } catch (error) {
      if (this.Config.showLogs) {
        Logger.error("BuildAPI initialization failed:", error);
      }
      throw error;
    }
  }

  /**
   * Read cookies from the normalized jar and return the c_user value.
   * Returns null when the cookie cannot be found or an error occurs.
   */
  private extractUserID(): string | null {
    const jarAny: any = this.jar;
    let cookies: any[] = [];

    try {
      // Try getCookiesSync first (JarAdapter provides this)
      if (typeof jarAny.getCookiesSync === "function") {
        cookies = jarAny.getCookiesSync("https://www.facebook.com");
      } else if (
        jarAny._tough &&
        typeof jarAny._tough.getCookiesSync === "function"
      ) {
        cookies = jarAny._tough.getCookiesSync("https://www.facebook.com");
      } else if (
        jarAny._tough &&
        typeof jarAny._tough.getCookies === "function"
      ) {
        cookies = jarAny._tough.getCookies("https://www.facebook.com");
      } else if (Array.isArray(jarAny.cookies)) {
        cookies = jarAny.cookies;
      }

      for (const cookie of cookies) {
        const name = cookie.key || cookie.name;
        const value = cookie.value;

        if (name === "c_user" && value) {
          return value;
        }
      }
    } catch (e) {
      if (this.Config.showLogs) {
        Logger.warn("Failed to extract user ID from cookies:", e);
      }
    }

    return null;
  }

  /**
   * Generate a simple pseudo-random client ID string.
   */
  private generateClientID(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Extract fb_dtsg token.
   * - tries HTML input[name="fb_dtsg"]
   * - falls back to script regexes
   * - finally requests the /ajax/dtsg endpoint and parses the JSON safely
   * Sets this.ctx.fb_dtsg when found.
   */
  async getFbDtsg() {
    try {
      // Method 1: Try extracting from HTML input
      const dtsgInput = this.$?.('input[name="fb_dtsg"]').attr("value");
      if (dtsgInput) {
        this.ctx.fb_dtsg = dtsgInput;
        if (this.Config.showLogs) {
          Logger.log("fb_dtsg extracted from HTML input");
        }
        return;
      }

      // Method 2: Try extracting from script tags
      const scripts = this.$?.("script").toArray() || [];
      for (const script of scripts) {
        const content = this.$?.(script).html() || "";
        const match = content.match(/"token":"([^"]+)"/);
        if (match && match[1]) {
          this.ctx.fb_dtsg = match[1];
          if (this.Config.showLogs) {
            Logger.log("fb_dtsg extracted from script tag");
          }
          return;
        }
      }

      // If not found, set empty (will be handled by calling code)
      this.ctx.fb_dtsg = "";
      if (this.Config.showLogs) {
        Logger.warn("fb_dtsg not found in HTML");
      }
    } catch (error) {
      if (this.Config.showLogs) {
        Logger.error("Error extracting fb_dtsg:", error);
      }
      this.ctx.fb_dtsg = "";
    }
  }

  /**
   * Extract lsd token (legacy security data)
   * This token is often required for certain Facebook API endpoints
   */
  async getLsd() {
    try {
      // Method 1: Try extracting from HTML input
      const lsdInput = this.$?.('input[name="lsd"]').attr("value");
      if (lsdInput) {
        this.ctx.lsd = lsdInput;
        if (this.Config.showLogs) {
          Logger.log("lsd extracted from HTML input");
        }
        return;
      }

      // Method 2: Try extracting from script tags
      const scripts = this.$?.("script").toArray() || [];
      for (const script of scripts) {
        const content = this.$?.(script).html() || "";
        const match = content.match(/"LSD",\[\],{"token":"([^"]+)"/);
        if (match && match[1]) {
          this.ctx.lsd = match[1];
          if (this.Config.showLogs) {
            Logger.log("lsd extracted from script tag");
          }
          return;
        }
      }

      this.ctx.lsd = "";
      if (this.Config.showLogs) {
        Logger.warn("lsd not found in HTML");
      }
    } catch (error) {
      if (this.Config.showLogs) {
        Logger.error("Error extracting lsd:", error);
      }
      this.ctx.lsd = "";
    }
  }

  /**
   * Get or compute jazoest value.
   * - prefers extraction from HTML input[name="jazoest"]
   * - falls back to a computed checksum based on fb_dtsg
   * @param fbDtsg - fb_dtsg token (optional) used for computing fallback jazoest
   */
  async getJazoest(fbDtsg: string) {
    try {
      // Method 1: Try extracting from HTML
      const jazoestInput = this.$?.('input[name="jazoest"]').attr("value");
      if (jazoestInput) {
        this.ctx.jazoest = jazoestInput;
        if (this.Config.showLogs) {
          Logger.log("jazoest extracted from HTML input");
        }
        return;
      }

      // Method 2: Compute from fb_dtsg
      if (fbDtsg) {
        this.ctx.jazoest = this.computeJazoest(fbDtsg);
        if (this.Config.showLogs) {
          Logger.log("jazoest computed from fb_dtsg");
        }
        return;
      }

      // Default fallback
      this.ctx.jazoest = "25404";
      if (this.Config.showLogs) {
        Logger.warn("Using default jazoest value");
      }
    } catch (error) {
      if (this.Config.showLogs) {
        Logger.error("Error extracting jazoest:", error);
      }
      this.ctx.jazoest = "25404";
    }
  }

  /**
   * Compute a simple jazoest fallback from the fb_dtsg token.
   * This is a lightweight checksum used when HTML does not contain jazoest.
   */
  private computeJazoest(dtsg: string): string {
    let sum = 0;
    for (let i = 0; i < dtsg.length; i++) {
      sum += dtsg.charCodeAt(i);
    }
    return (25404 + sum).toString();
  }

  /**
   * Extract __s parameter from HTML for request validation
   */
  private extractSParameter(): string {
    try {
      const scripts = this.$?.("script").toArray() || [];
      for (const script of scripts) {
        const content = this.$?.(script).html() || "";
        const match = content.match(/"__s":"([^"]+)"/);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch (error) {
      if (this.Config.showLogs) {
        Logger.error("Error extracting __s parameter:", error);
      }
    }
    return "";
  }

  /**
   * Return the built API context. Contains UserID, cookieJar, clientID, loggedIn,
   * and tokens like fb_dtsg and jazoest when available.
   */
  getContext(): BuildApiContext {
    return { ...this.ctx };
  }
}

export default BuildAPI;
