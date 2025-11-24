/**
 * MQTT Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { EventEmitter } from "events";
import type { ConfigTypes } from "../../types/CreateApiTypes.js";
/**
 * Configuration interface for MQTT connection to Facebook servers
 */
export interface MqttConfig {
    /** MQTT endpoint URL for Facebook messaging */
    endpoint: string;
    /** Unique sequence identifier for Iris (Facebook's messaging system) */
    irisSeqID: string;
    /** Facebook user ID */
    userID: string;
    /** Facebook server region (e.g., 'ASH', 'PRN') */
    region?: string;
    /** Cookie string for authentication */
    cookie?: string;
}
/**
 * Represents a message received from Facebook's MQTT system
 */
export interface FacebookMqttMessage {
    /** Type of message (e.g., 'message', 'event', 'typing') */
    type: string;
    /** Raw payload data from Facebook */
    payload: any;
    /** Thread/conversation ID where the message belongs */
    threadID?: string;
    /** User ID of the message sender */
    senderID?: string;
    /** Unique identifier for the message */
    messageID?: string;
    /** Unix timestamp when the message was sent */
    timestamp?: number;
}
/**
 * MQTT Client for Facebook real-time messaging
 *
 * This class handles real-time communication with Facebook's messaging system
 * using MQTT protocol over WebSocket connections. It provides:
 * - Real-time message listening
 * - Automatic reconnection with exponential backoff
 * - Message parsing and formatting
 * - Event-driven architecture for handling different message types
 */
export declare class FacebookMqtt extends EventEmitter {
    /** Active MQTT client instance */
    private client;
    /** WebSocket connection for MQTT transport */
    private websocket;
    /** MQTT connection configuration */
    private config;
    /** Application-level configuration */
    private appConfig;
    /** Current connection status */
    private isConnected;
    /** Number of reconnection attempts made */
    private reconnectAttempts;
    /** Maximum number of reconnection attempts before giving up */
    private maxReconnectAttempts;
    /** Base delay between reconnection attempts (milliseconds) */
    private reconnectDelay;
    /**
     * Create a new FacebookMqtt instance
     * @param config - MQTT connection configuration
     * @param appConfig - Application configuration with logging and timeout settings
     */
    constructor(config: MqttConfig, appConfig: Required<ConfigTypes>);
    /**
     * Establish connection to Facebook MQTT server
     *
     * Creates a WebSocket connection to Facebook's MQTT endpoint and sets up
     * the MQTT client with proper authentication and message handling.
     *
     * @throws {Error} When connection fails or configuration is invalid
     */
    connect(): Promise<void>;
    /**
     * Setup MQTT event handlers for connection lifecycle and message processing
     *
     * Configures handlers for:
     * - Incoming messages from Facebook's messaging system
     * - Connection close events with auto-reconnection
     * - Error handling and logging
     * - Offline status detection
     */
    private setupMqttEvents;
    /**
     * Handle incoming MQTT messages from Facebook's messaging system
     *
     * Processes messages received on various Facebook MQTT topics and emits
     * appropriate events based on the message type and content.
     *
     * @param topic - MQTT topic where the message was received
     * @param data - Raw message data from Facebook's servers
     */
    private handleMqttMessage;
    /**
     * Parse Facebook MQTT message format with topic awareness
     */
    private parseMqttMessage;
    /**
     * Get message type from MQTT topic
     */
    private getMessageTypeFromTopic;
    /**
     * Send message through MQTT
     */
    sendMessage(topic: string, payload: any): Promise<void>;
    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect;
    /**
     * Disconnect from MQTT server
     */
    disconnect(): void;
    /**
     * Get connection status
     */
    getConnectionStatus(): {
        connected: boolean;
        attempts: number;
    };
    /**
     * Generate a RFC 4122 compliant GUID for Facebook messaging
     *
     * Creates a version 4 UUID used by Facebook for tracking messages
     * and maintaining session state across MQTT connections.
     *
     * @returns A randomly generated GUID string
     */
    private generateGUID;
    /**
     * Send message through MQTT using Facebook's /ls_req topic
     *
     * This method sends messages directly through Facebook's MQTT infrastructure
     * using the /ls_req topic which is specifically designed for real-time messaging.
     *
     * @param message - Text message to send
     * @param threadID - Target thread/conversation ID
     * @returns Promise with message ID and timestamp when successfully sent
     */
    sendMessageViaMqtt(message: string, threadID: string): Promise<{
        messageID: string;
        timestamp: number;
    }>;
}
//# sourceMappingURL=Mqtt.d.ts.map