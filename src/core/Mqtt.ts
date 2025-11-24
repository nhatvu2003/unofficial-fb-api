/**
 * MQTT Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import mqtt, { MqttClient } from "mqtt";
import WebSocket from "ws";
// @ts-ignore
import websocketStream from "websocket-stream";
import { EventEmitter } from "events";
import Logger from "../utils/Logger.js";
import { ErrorHandler, ErrorType } from "../utils/ErrorHandler.js";
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
export class FacebookMqtt extends EventEmitter {
  /** Active MQTT client instance */
  private client: MqttClient | null = null;

  /** WebSocket connection for MQTT transport */
  private websocket: WebSocket | null = null;

  /** MQTT connection configuration */
  private config: MqttConfig;

  /** Application-level configuration */
  private appConfig: Required<ConfigTypes>;

  /** Current connection status */
  private isConnected = false;

  /** Number of reconnection attempts made */
  private reconnectAttempts = 0;

  /** Maximum number of reconnection attempts before giving up */
  private maxReconnectAttempts = 5;

  /** Base delay between reconnection attempts (milliseconds) */
  private reconnectDelay = 1000;

  /**
   * Create a new FacebookMqtt instance
   * @param config - MQTT connection configuration
   * @param appConfig - Application configuration with logging and timeout settings
   */
  constructor(config: MqttConfig, appConfig: Required<ConfigTypes>) {
    super();
    this.config = config;
    this.appConfig = appConfig;
  }

  /**
   * Establish connection to Facebook MQTT server
   *
   * Creates a WebSocket connection to Facebook's MQTT endpoint and sets up
   * the MQTT client with proper authentication and message handling.
   *
   * @throws {Error} When connection fails or configuration is invalid
   */
  async connect(): Promise<void> {
    try {
      if (this.appConfig.showLogs) {
        Logger.log(`Connecting to MQTT endpoint: ${this.config.endpoint}`);
      }

      // Clean up escaped slashes from Facebook response
      const cleanEndpoint = this.config.endpoint.replace(/\\\//g, "/");
      if (this.appConfig.showLogs) {
        Logger.log(`Cleaned endpoint: ${cleanEndpoint}`);
      }

      // Create MQTT client using websocket-stream for Facebook messaging
      const wsHeaders: any = {
        "User-Agent": this.appConfig.userAgents,
        Origin: "https://www.facebook.com",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.facebook.com/",
      };

      if (this.config.cookie) {
        wsHeaders["Cookie"] = this.config.cookie;
      }

      // Create WebSocket stream for MQTT transport over Facebook's infrastructure
      const stream = websocketStream(cleanEndpoint, [], {
        headers: wsHeaders,
        perMessageDeflate: false,
      });

      // Create MQTT client over WebSocket stream with Facebook-specific parameters
      const sessionID = Math.floor(Math.random() * 9007199254740991) + 1;
      const username = {
        u: this.config.userID,
        s: sessionID,
        chat_on: true,
        fg: false,
        d: this.generateGUID(),
        ct: "websocket",
        aid: "219994525426954", // Facebook app id
        mqtt_sid: "",
        cp: 3,
        ecp: 10,
        st: [
          "/t_ms",
          "/thread_typing",
          "/orca_typing_notifications",
          "/orca_presence",
        ], // subscribe topics
        pm: [],
        dc: "",
        no_auto_fg: true,
        gas: null,
      };

      const options = {
        clientId: "mqttwsclient",
        protocolId: "MQIsdp" as const,
        protocolVersion: 3 as const,
        username: JSON.stringify(username),
        clean: true,
        wsOptions: {
          headers: wsHeaders,
          origin: "https://www.facebook.com",
          protocolVersion: 13,
        },
      };

      // Create MQTT client with Facebook-specific configuration
      this.client = new mqtt.MqttClient(
        () => websocketStream(cleanEndpoint, options.wsOptions),
        options,
      );

      this.setupMqttEvents();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            ErrorHandler.createError(
              ErrorType.NETWORK,
              "MQTT connection timeout",
              null,
              { endpoint: this.config.endpoint },
            ),
          );
        }, this.appConfig.timeout);

        this.client!.once("connect", () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;

          if (this.appConfig.showLogs) {
            Logger.success(`Connected to MQTT server (${this.config.region})`);
          }

          // Subscribe to Facebook messaging topics
          this.client!.subscribe("/t_ms", { qos: 1 });
          this.client!.subscribe("/thread_typing", { qos: 1 });
          this.client!.subscribe("/orca_typing_notifications", { qos: 1 });
          this.client!.subscribe("/orca_presence", { qos: 1 });

          this.emit("connected");
          resolve();
        });

        this.client!.once("error", (error) => {
          clearTimeout(timeout);
          reject(
            ErrorHandler.handleHttpError(error, {
              context: "MQTT connection",
              endpoint: this.config.endpoint,
            }),
          );
        });
      });
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorType.NETWORK,
        "Failed to initialize MQTT connection",
        error,
        { endpoint: this.config.endpoint },
      );
    }
  }

  /**
   * Setup MQTT event handlers for connection lifecycle and message processing
   *
   * Configures handlers for:
   * - Incoming messages from Facebook's messaging system
   * - Connection close events with auto-reconnection
   * - Error handling and logging
   * - Offline status detection
   */
  private setupMqttEvents(): void {
    if (!this.client) return;

    // Handle incoming messages from Facebook's MQTT topics
    this.client.on("message", (topic: string, message: Buffer) => {
      try {
        this.handleMqttMessage(topic, message);
      } catch (error) {
        Logger.error("Error handling MQTT message:", error);
        this.emit("error", ErrorHandler.handleParsingError(error));
      }
    });

    // Handle connection close with automatic reconnection
    this.client.on("close", () => {
      this.isConnected = false;

      if (this.appConfig.showLogs) {
        Logger.warn(`MQTT connection closed`);
      }

      this.emit("disconnected");

      // Auto-reconnect if enabled and within retry limits
      if (
        this.appConfig.autoReconnect &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.scheduleReconnect();
      }
    });

    this.client.on("error", (error: Error) => {
      Logger.error("MQTT client error:", error);
      this.emit(
        "error",
        ErrorHandler.handleHttpError(error, {
          context: "MQTT Client",
        }),
      );
    });

    this.client.on("offline", () => {
      this.isConnected = false;
      if (this.appConfig.showLogs) {
        Logger.warn("MQTT client went offline");
      }
    });
  }

  /**
   * Handle incoming MQTT messages from Facebook's messaging system
   *
   * Processes messages received on various Facebook MQTT topics and emits
   * appropriate events based on the message type and content.
   *
   * @param topic - MQTT topic where the message was received
   * @param data - Raw message data from Facebook's servers
   */
  private handleMqttMessage(topic: string, data: Buffer): void {
    try {
      if (this.appConfig.showLogs) {
        Logger.log(`Received MQTT message on topic: ${topic}`);
      }

      // Parse message based on Facebook's MQTT protocol and topic
      const message = this.parseMqttMessage(topic, data);

      if (message) {
        this.emit("message", message);

        // Emit specific event types based on Facebook topic
        switch (topic) {
          case "/t_ms":
            this.emit("chat_message", message);
            break;
          case "/orca_presence":
            this.emit("presence", message);
            break;
          case "/thread_typing":
          case "/orca_typing_notifications":
            this.emit("typing", message);
            break;
          default:
            this.emit("unknown_message", { topic, message });
        }
      }
    } catch (error) {
      Logger.error("Error parsing MQTT message:", error);
    }
  }

  /**
   * Parse Facebook MQTT message format with topic awareness
   */
  private parseMqttMessage(
    topic: string,
    data: Buffer,
  ): FacebookMqttMessage | null {
    try {
      // This is a simplified parser - actual Facebook MQTT protocol is more complex
      const text = data.toString("utf8");

      // Try to parse as JSON
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Handle binary or other formats
        return null;
      }

      return {
        type: this.getMessageTypeFromTopic(topic),
        payload: parsed.payload || parsed,
        threadID: parsed.threadID || parsed.thread_id,
        senderID: parsed.senderID || parsed.sender_id || parsed.author_id,
        messageID: parsed.messageID || parsed.message_id || parsed.mid,
        timestamp: parsed.timestamp || Date.now(),
      };
    } catch (error) {
      Logger.error("Error parsing message:", error);
      return null;
    }
  }

  /**
   * Get message type from MQTT topic
   */
  private getMessageTypeFromTopic(topic: string): string {
    switch (topic) {
      case "/t_ms":
        return "message";
      case "/orca_presence":
        return "presence";
      case "/thread_typing":
      case "/orca_typing_notifications":
        return "typing";
      default:
        return "unknown";
    }
  }

  /**
   * Send message through MQTT
   */
  async sendMessage(topic: string, payload: any): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw ErrorHandler.createError(
        ErrorType.NETWORK,
        "MQTT client not connected",
        null,
        { connected: this.isConnected },
      );
    }

    try {
      const message = JSON.stringify(payload);

      return new Promise((resolve, reject) => {
        this.client!.publish(
          topic,
          message,
          { qos: 1, retain: false },
          (error) => {
            if (error) {
              reject(
                ErrorHandler.handleHttpError(error, {
                  context: "MQTT send message",
                  topic,
                }),
              );
            } else {
              if (this.appConfig.showLogs && this.appConfig.developmentLog) {
                Logger.debug(`Sent MQTT message to ${topic}:`, payload);
              }
              resolve();
            }
          },
        );
      });
    } catch (error) {
      throw ErrorHandler.handleHttpError(error, {
        context: "MQTT send message",
        topic,
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    if (this.appConfig.showLogs) {
      Logger.log(
        `Scheduling MQTT reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
      );
    }

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        Logger.error("MQTT reconnection failed:", error);

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.emit("max_reconnect_attempts_reached");
        }
      }
    }, delay);
  }

  /**
   * Disconnect from MQTT server
   */
  disconnect(): void {
    this.isConnected = false;

    if (this.client) {
      this.client.end();
      this.client = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.appConfig.showLogs) {
      Logger.log("MQTT client disconnected");
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts,
    };
  }

  /**
   * Generate a RFC 4122 compliant GUID for Facebook messaging
   *
   * Creates a version 4 UUID used by Facebook for tracking messages
   * and maintaining session state across MQTT connections.
   *
   * @returns A randomly generated GUID string
   */
  private generateGUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

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
  async sendMessageViaMqtt(
    message: string,
    threadID: string,
  ): Promise<{ messageID: string; timestamp: number }> {
    if (!this.isConnected || !this.client) {
      throw new Error(
        "MQTT not connected. Cannot send message via MQTT client.",
      );
    }

    try {
      const timestamp = Date.now();
      let variance = 0;
      const epoch_id = () =>
        Math.floor(timestamp * (4194304 + (variance = (variance + 0.1) % 5)));
      const epoch = timestamp << 22;
      const otid = epoch + Math.floor(Math.random() * 4194304);

      const messageID = otid.toString();

      const mqttPayload = {
        app_id: "2220391788200892",
        payload: {
          tasks: [
            {
              label: "46",
              payload: {
                thread_id: threadID.toString(),
                otid: otid.toString(),
                source: 0,
                send_type: 1,
                sync_group: 1,
                text: message,
                initiating_source: 1,
                skip_url_preview_gen: 0,
              },
              queue_name: threadID.toString(),
              task_id: 0,
              failure_count: null,
            },
            {
              label: "21",
              payload: {
                thread_id: threadID.toString(),
                last_read_watermark_ts: timestamp,
                sync_group: 1,
              },
              queue_name: threadID.toString(),
              task_id: 1,
              failure_count: null,
            },
          ],
          epoch_id: epoch_id(),
          version_id: "6120284488008082",
          data_trace_id: null,
        },
        request_id: Date.now(),
        type: 3,
      };

      // Stringify payload properly for Facebook's MQTT protocol
      mqttPayload.payload.tasks.forEach((task: any) => {
        task.payload = JSON.stringify(task.payload);
      });
      (mqttPayload.payload as any) = JSON.stringify(mqttPayload.payload);

      // Send via MQTT using Facebook's /ls_req topic
      return new Promise((resolve, reject) => {
        this.client!.publish(
          "/ls_req",
          JSON.stringify(mqttPayload),
          { qos: 1, retain: false },
          (error) => {
            if (error) {
              if (this.appConfig.showLogs) {
                Logger.error("Failed to publish to /ls_req:", error);
              }
              reject(error);
            } else {
              if (this.appConfig.showLogs) {
                Logger.log("Message sent via MQTT /ls_req topic:", {
                  messageID,
                  threadID,
                  otid,
                });
              }
              resolve({ messageID, timestamp });
            }
          },
        );
      });
    } catch (error) {
      if (this.appConfig.showLogs) {
        Logger.error("Failed to send message via MQTT:", error);
      }
      throw error;
    }
  }
}
