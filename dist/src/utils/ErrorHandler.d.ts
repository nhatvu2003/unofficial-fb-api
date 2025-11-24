/**
 * Enhanced Error Handling System for Facebook API
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 *
 * This module provides a comprehensive error handling framework designed specifically
 * for Facebook API interactions. It includes:
 *
 * 1. **Categorized Error Types**: Specific error categories for different failure modes
 * 2. **Detailed Error Context**: Rich error information for debugging and monitoring
 * 3. **Consistent Error Format**: Standardized error structure across the entire API
 * 4. **Error Recovery**: Guidelines and utilities for handling different error scenarios
 *
 * The error system is designed to help developers:
 * - Quickly identify the root cause of failures
 * - Implement appropriate retry/recovery strategies
 * - Monitor API health and reliability
 * - Debug authentication and network issues
 */
/**
 * Enumeration of all possible error types that can occur in Facebook API operations
 *
 * Each error type represents a different category of failure with specific
 * handling strategies and recovery approaches.
 */
export declare enum ErrorType {
    /** Authentication failures - invalid cookies, expired tokens, account restrictions */
    AUTHENTICATION = "AUTHENTICATION",
    /** Network-related errors - timeouts, connection failures, DNS issues */
    NETWORK = "NETWORK",
    /** Data parsing errors - malformed responses, unexpected data structures */
    PARSING = "PARSING",
    /** Configuration/input validation errors - invalid parameters, missing required fields */
    VALIDATION = "VALIDATION",
    /** Rate limiting errors - too many requests, API quota exceeded */
    RATE_LIMIT = "RATE_LIMIT",
    /** Unclassified errors - unexpected failures that don't fit other categories */
    UNKNOWN = "UNKNOWN"
}
/**
 * Standardized error information structure
 *
 * This interface defines the complete error context that gets captured
 * when any API operation fails, providing comprehensive debugging information.
 */
export interface FacebookAPIError {
    /** Categorized error type for programmatic handling */
    type: ErrorType;
    /** Human-readable error description */
    message: string;
    /** Original error object from the underlying system (HTTP, parsing, etc.) */
    originalError?: any;
    /** Timestamp when the error occurred for debugging and logging */
    timestamp: Date;
    /** Additional context information (request details, user ID, endpoint, etc.) */
    context?: Record<string, any> | undefined;
}
/**
 * Custom exception class for Facebook API errors
 *
 * Extends the standard Error class with additional Facebook-specific
 * error information and context. This allows for more sophisticated
 * error handling and recovery strategies.
 */
export declare class FacebookAPIException extends Error {
    /** Error category for programmatic error handling */
    readonly type: ErrorType;
    /** When the error occurred */
    readonly timestamp: Date;
    /** Additional debugging and context information */
    readonly context?: Record<string, any> | undefined;
    /** Original underlying error that caused this exception */
    readonly originalError?: any;
    /**
     * Create a new FacebookAPIException
     *
     * @param error - Complete error information including type, message, and context
     */
    constructor(error: FacebookAPIError);
}
/**
 * Centralized Error Handling Utilities
 *
 * This class provides static methods for creating, formatting, and handling
 * various types of errors that can occur during Facebook API operations.
 *
 * Key features:
 * - Consistent error creation and formatting
 * - Automatic error categorization
 * - Context preservation for debugging
 * - Integration with logging systems
 */
export declare class ErrorHandler {
    /**
     * Create a new FacebookAPIException with comprehensive error information
     *
     * This is the primary method for creating standardized errors throughout
     * the Facebook API codebase. It ensures consistent error structure and
     * automatic timestamping.
     *
     * @param type - Category of error that occurred
     * @param message - Human-readable description of the error
     * @param originalError - Underlying error object from the system
     * @param context - Additional debugging information (user ID, endpoint, request data, etc.)
     * @returns Formatted FacebookAPIException ready to be thrown or logged
     */
    static createError(type: ErrorType, message: string, originalError?: any, context?: Record<string, any>): FacebookAPIException;
    static handleHttpError(error: any, context?: Record<string, any>): FacebookAPIException;
    static handleParsingError(error: any, context?: Record<string, any>): FacebookAPIException;
    static handleValidationError(message: string, context?: Record<string, any>): FacebookAPIException;
}
//# sourceMappingURL=ErrorHandler.d.ts.map