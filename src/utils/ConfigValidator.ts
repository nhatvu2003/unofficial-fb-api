/**
 * Configuration Validator Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import type { ConfigTypes } from "../../types/CreateApiTypes.js";
import { ErrorHandler, ErrorType } from "./ErrorHandler.js";

/**
 * Configuration validator and defaults provider
 */
export class ConfigValidator {
  private static readonly DEFAULT_CONFIG: Required<ConfigTypes> = {
    showLogs: false,
    developmentLog: false,
    userAgents: "facebookexternalhit/1.1",
    autoReconnect: true,
    online: true,
    proxy: "",
    timeout: 60000,
    retryAttempts: 3,
    rateLimit: {
      maxRequests: 50,
      windowMs: 60000,
    },
    selfListen: false,
    listenEvents: false,
    updatePresence: false,
    autoMarkRead: false,
    autoMarkDelivery: true,
    forceLogin: false,
    logLevel: "info",
  };

  /**
   * Validate and merge configuration with defaults
   */
  static validate(config: ConfigTypes): Required<ConfigTypes> {
    if (!config || typeof config !== "object") {
      throw ErrorHandler.handleValidationError(
        "Configuration must be a valid object",
        { providedConfig: config },
      );
    }

    // Merge with defaults
    const mergedConfig: Required<ConfigTypes> = {
      ...this.DEFAULT_CONFIG,
      ...config,
    };

    // Validate specific fields
    if (typeof mergedConfig.showLogs !== "boolean") {
      throw ErrorHandler.handleValidationError("showLogs must be a boolean", {
        value: mergedConfig.showLogs,
      });
    }

    if (typeof mergedConfig.timeout !== "number" || mergedConfig.timeout <= 0) {
      throw ErrorHandler.handleValidationError(
        "timeout must be a positive number",
        { value: mergedConfig.timeout },
      );
    }

    if (
      typeof mergedConfig.retryAttempts !== "number" ||
      mergedConfig.retryAttempts < 0
    ) {
      throw ErrorHandler.handleValidationError(
        "retryAttempts must be a non-negative number",
        { value: mergedConfig.retryAttempts },
      );
    }

    if (mergedConfig.proxy && typeof mergedConfig.proxy !== "string") {
      throw ErrorHandler.handleValidationError("proxy must be a string", {
        value: mergedConfig.proxy,
      });
    }

    return mergedConfig;
  }

  /**
   * Get default configuration
   */
  static getDefaults(): Required<ConfigTypes> {
    return { ...this.DEFAULT_CONFIG };
  }
}
