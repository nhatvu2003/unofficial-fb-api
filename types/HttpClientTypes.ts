/**
 * HTTP Client Type Definitions
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

type BrowserName = "chrome" | "firefox" | "edge";

interface PlatformConfig {
  platform: string[];
  browsers: Record<BrowserName, string[]>;
}

/**
 * Cookie entry in the simplified in-memory jar used by the client.
 */
interface Cookie {
  name: string;
  value: string;
  cookieString: () => string;
}

/**
 * Simplified cookie jar interface used across the client code.
 */
interface Jar {
  setCookie(cookieStr: string, url: string): void;
  getCookies(url: string): Cookie[];
  getCookieString(url: string): string;
  _tough: import("tough-cookie").CookieJar;
}

interface HttpRequestContext {
  region?: string;
  [key: string]: any;
}

interface HttpOptions {
  userAgent?: string;
  [key: string]: any;
}

interface CustomHeader {
  customUserAgent?: string;
  noRef?: boolean;
  [key: string]: any;
}

interface HttpResponse {
  statusCode: number;
  body: string;
  headers: Record<string, string | string[]>;
  request: {
    uri: URL;
    headers?: Record<string, any>;
    method?: string;
    formData?: Record<string, any>;
  };
}

export type {
  PlatformConfig,
  BrowserName,
  Cookie,
  Jar,
  HttpRequestContext,
  HttpOptions,
  CustomHeader,
  HttpResponse,
};
