/**
 * API Type Definitions
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

/**
 * Represents a single cookie stored in the application's AppState.
 */
interface LoginAppStateTypes {
  /** Cookie name (e.g. "c_user") */
  key: string;
  /** Cookie value */
  value: string;
  /** Domain the cookie applies to (e.g. ".facebook.com") */
  domain: string;
  /** Path the cookie is valid for (e.g. "/") */
  path: string;
  /** True if the cookie is host-only (not valid for subdomains) */
  hostOnly: boolean;
  /** ISO string of when the cookie was created */
  creation: string;
  /** ISO string of the last time the cookie was accessed */
  lastAccessed: string;
}

interface ConfigTypes {
  showLogs?: boolean;
  developmentLog?: boolean;
  userAgents?: string;
  autoReconnect?: boolean;
  online?: boolean;
  proxy?: string | undefined;
  timeout?: number;
  retryAttempts?: number;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  selfListen?: boolean;
  listenEvents?: boolean;
  updatePresence?: boolean;
  autoMarkRead?: boolean;
  autoMarkDelivery?: boolean;
  forceLogin?: boolean;
  logLevel?: "info" | "warn" | "error" | "debug";
}

/**
 * Context returned by BuildAPI after login/build step.
 */
interface BuildApiContext {
  UserID?: string | null;
  userID?: string;
  cookieJar?: any;
  jar?: any;
  clientID: string;
  loggedIn?: boolean;
  fb_dtsg: string;
  lsd?: string;
  jazoest?: string;
  lastSeqId?: string;
  mqttEndpoint?: string;
  irisSeqID?: string;
  region?: string;
  __s?: string;
  mqttClient?: any; // FacebookMqtt instance
  AppState?: LoginAppStateTypes[];
  [key: string]: any;
}

export type { LoginAppStateTypes, ConfigTypes, BuildApiContext };
