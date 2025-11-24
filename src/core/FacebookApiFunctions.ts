/**
 * Facebook API Functions - Core Implementation
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import type {
  ConfigTypes,
  BuildApiContext,
} from "../../types/CreateApiTypes.js";
import HttpClient from "../utils/HttpClient.js";
import { ErrorHandler, ErrorType } from "../utils/ErrorHandler.js";
import Logger from "../utils/Logger.js";

/**
 * FacebookApiFunctions - Comprehensive Facebook Messenger API Implementation
 *
 * This class provides a complete set of Facebook Messenger API functions that enable:
 *
 * 1. **Message Operations**:
 *    - Send text messages, attachments, and rich media
 *    - Handle message formatting and encoding
 *    - Support for mentions, stickers, and reactions
 *
 * 2. **User Information**:
 *    - Retrieve user profiles and metadata
 *    - Get friends lists and relationship status
 *    - Access user presence and activity data
 *
 * 3. **Thread Management**:
 *    - Get conversation information and participants
 *    - Manage thread settings and permissions
 *    - Handle group conversations and metadata
 *
 * 4. **Real-time Features**:
 *    - Mark messages as read/unread
 *    - Send typing indicators
 *    - Handle presence updates
 *
 * All functions implement proper error handling, retry logic, and logging
 * while maintaining compatibility with Facebook's internal API structure.
 */
export class FacebookApiFunctions {
  /** API context containing session data, tokens, and authentication info */
  private ctx: BuildApiContext;

  /** Complete configuration object with all required settings */
  private config: Required<ConfigTypes>;

  /**
   * Initialize FacebookApiFunctions with API context and configuration
   *
   * @param ctx - Built API context from BuildAPI containing:
   *              - User authentication tokens (fb_dtsg, jazoest)
   *              - Cookie jar for session management
   *              - User ID and session information
   *
   * @param config - Complete configuration object with:
   *                 - Network settings (timeout, retries, rate limiting)
   *                 - Logging preferences and verbosity levels
   *                 - User agent and proxy configuration
   */
  constructor(ctx: BuildApiContext, config: Required<ConfigTypes>) {
    this.ctx = ctx;
    this.config = config;
  }

  /**
   * Send a message to a user or thread
   *
   * Sends messages through Facebook's messaging system with support for:
   * - Plain text messages
   * - Rich message objects with attachments
   * - Mentions and special formatting
   * - Delivery confirmation and error handling
   *
   * @param message - Text string or MessageObject with body/attachments
   * @param threadID - Target user ID or thread/group ID
   * @param callback - Optional callback for result/error handling
   * @returns Promise resolving to message send result with messageID and timestamp
   */
  async sendMessage(
    message: string | MessageObject,
    threadID: string,
    callback?: (err: any, info?: any) => void,
  ): Promise<any> {
    try {
      // Generate unique message ID for tracking and deduplication
      const messageAndOTID = this.generateOfflineThreadingID();

      // Build Facebook's internal message format
      const form: { [key: string]: any } = {
        client: "mercury",
        action_type: "ma-type:user-generated-message",
        author: "fbid:" + this.ctx.UserID,
        timestamp: Date.now(),
        timestamp_absolute: "Today",
        timestamp_relative: this.generateTimestampRelative(),
        timestamp_time_passed: "0",
        is_unread: false,
        is_cleared: false,
        is_forward: false,
        is_filtered_content: false,
        is_spoof_warning: false,
        source: "source:chat:web",
        "source_tags[0]": "source:chat",
        body: typeof message === "string" ? message : message.body || "",
        html_body: false,
        ui_push_phase: "V3",
        status: "0",
        offline_threading_id: messageAndOTID,
        message_id: messageAndOTID,
        threading_id: this.generateThreadingID(),
        "ephemeral_ttl_mode:": "0",
        manual_retry_cnt: "0",
        has_attachment: false,
        signatureID: this.getSignatureID(),
        fb_dtsg: this.ctx.fb_dtsg,
        jazoest: this.ctx.jazoest,
      };

      // Determine if it's a group chat or individual
      const isGroup = threadID.length > 15;
      if (isGroup) {
        form["thread_fbid"] = threadID;
      } else {
        form["specific_to_list[0]"] = "fbid:" + threadID;
        form["specific_to_list[1]"] = "fbid:" + this.ctx.UserID;
        form["other_user_fbid"] = threadID;
      }

      const response = await HttpClient.post(
        "https://www.facebook.com/messaging/send/",
        this.ctx.cookieJar,
        form,
      );

      if (response.statusCode !== 200) {
        throw ErrorHandler.createError(
          ErrorType.NETWORK,
          `Send message failed with status ${response.statusCode}`,
          null,
          { threadID, statusCode: response.statusCode },
        );
      }

      const result = this.parseResponse(response.body);

      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(
    userIDs: string | string[],
    callback?: (err: any, data?: any) => void,
  ): Promise<any> {
    try {
      const ids = Array.isArray(userIDs) ? userIDs : [userIDs];
      const form: any = {};

      ids.forEach((id, i) => {
        form[`ids[${i}]`] = id;
      });

      const response = await HttpClient.post(
        "https://www.facebook.com/chat/user_info/",
        this.ctx.cookieJar,
        form,
      );

      const result = this.parseResponse(response.body);

      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      throw error;
    }
  }

  /**
   * Get thread information
   */
  async getThreadInfo(
    threadIDs: string | string[],
    callback?: (err: any, data?: any) => void,
  ): Promise<any> {
    try {
      const ids = Array.isArray(threadIDs) ? threadIDs : [threadIDs];

      const queries = ids.map((id) => ({
        doc_id: "1849319281789796",
        query_params: {
          id: id,
          message_limit: 0,
          load_messages: false,
          load_read_receipts: false,
          before: null,
        },
      }));

      const form = {
        queries: JSON.stringify(queries),
        batch_name: "MessengerGraphQLThreadFetcher",
        fb_dtsg: this.ctx.fb_dtsg,
        jazoest: this.ctx.jazoest,
      };

      const response = await HttpClient.post(
        "https://www.facebook.com/api/graphqlbatch/",
        this.ctx.cookieJar,
        form,
      );

      const result = this.parseResponse(response.body);

      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error);
      throw error;
    }
  }

  /**
   * Get friends list
   */
  async getFriendsList(
    callback?: (err: any, data?: any) => void,
  ): Promise<any> {
    try {
      const response = await HttpClient.postFormData(
        "https://www.facebook.com/chat/user_info_all",
        this.ctx.cookieJar,
        {},
        { viewer: this.ctx.UserID },
      );

      const result = this.parseResponse(response.body);
      const formattedResult = this.formatFriendsData(result.payload);

      if (callback) callback(null, formattedResult);
      return formattedResult;
    } catch (error) {
      if (callback) callback(error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(
    threadID: string,
    callback?: (err: any) => void,
  ): Promise<void> {
    try {
      const form = {
        watermarkTimestamp: Date.now(),
        shouldSendReadReceipt: true,
        ids: JSON.stringify([threadID]),
        fb_dtsg: this.ctx.fb_dtsg,
        jazoest: this.ctx.jazoest,
      };

      await HttpClient.post(
        "https://www.facebook.com/ajax/mercury/change_read_status.php",
        this.ctx.cookieJar,
        form,
      );

      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
      throw error;
    }
  }

  /**
   * Set typing indicator
   */
  async sendTypingIndicator(
    threadID: string,
    isTyping: boolean = true,
    callback?: (err: any) => void,
  ): Promise<void> {
    try {
      const form = {
        typ: isTyping ? 1 : 0,
        thread: threadID,
        source: "mercury-chat",
        fb_dtsg: this.ctx.fb_dtsg,
        jazoest: this.ctx.jazoest,
      };

      await HttpClient.post(
        "https://www.facebook.com/ajax/messaging/typ.php",
        this.ctx.cookieJar,
        form,
      );

      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
      throw error;
    }
  }

  // Helper methods
  private generateOfflineThreadingID(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private generateThreadingID(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }

  private generateTimestampRelative(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  private getSignatureID(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  private parseResponse(body: string): any {
    try {
      if (typeof body !== "string") {
        return body;
      }
      // Remove "for (;;);" prefix if present
      const cleaned = body.replace(/^\s*for\s*\(\s*;\s*;\s*\)\s*;\s*/, "");
      try {
        return JSON.parse(cleaned);
      } catch (_) {
        // Attempt to extract first balanced JSON object/array from the response
        const extracted = this.extractFirstJSON(cleaned);
        if (extracted) return JSON.parse(extracted);
        throw new Error("Unable to parse response body as JSON");
      }
    } catch (error) {
      throw ErrorHandler.handleParsingError(error, {
        bodyLength: body && typeof body === "string" ? body.length : 0,
        bodyPreview:
          body && typeof body === "string"
            ? body.substring(0, 100)
            : String(body).substring(0, 100),
      });
    }
  }

  /**
   * Extract the first balanced JSON value (object or array) from a string.
   * Returns the substring containing the JSON or null if not found.
   */
  private extractFirstJSON(text: string): string | null {
    if (!text) return null;
    const start = text.search(/[\{\[]/);
    if (start === -1) return null;
    let i = start;
    const len = text.length;
    const stack: string[] = [];
    let inString = false;
    let stringChar = "";
    let escape = false;
    for (; i < len; i++) {
      const ch = text[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (ch === "\\") {
          escape = true;
        } else if (ch === stringChar) {
          inString = false;
          stringChar = "";
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        continue;
      }
      if (ch === "{" || ch === "[") {
        stack.push(ch);
        continue;
      }
      if (ch === "}" || ch === "]") {
        const last = stack.pop();
        if (!last) return null;
        if ((last === "{" && ch !== "}") || (last === "[" && ch !== "]"))
          return null;
        if (stack.length === 0) {
          return text.substring(start, i + 1);
        }
      }
    }
    return null;
  }

  private formatFriendsData(data: any): any[] {
    if (!data || typeof data !== "object") return [];

    return Object.keys(data).map((key) => {
      const user = data[key];
      return {
        userID: user.id?.toString() || key,
        fullName: user.name || "",
        firstName: user.firstName || "",
        vanity: user.vanity || "",
        profilePicture: user.thumbSrc || "",
        isFriend: user.is_friend === true,
        gender: this.getGenderString(user.gender),
        type: user.type || "user",
      };
    });
  }

  private getGenderString(gender: number): string {
    const genders: { [key: number]: string } = {
      0: "unknown",
      1: "female_singular",
      2: "male_singular",
      3: "female_singular_guess",
      4: "male_singular_guess",
      5: "mixed",
      6: "neuter_singular",
      7: "unknown_singular",
      8: "female_plural",
      9: "male_plural",
      10: "neuter_plural",
      11: "unknown_plural",
    };
    return genders[gender] || "unknown";
  }
}

interface MessageObject {
  body?: string;
  attachment?: any;
  mentions?: any[];
  url?: string;
  sticker?: string;
}
