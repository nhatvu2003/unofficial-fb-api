/**
 * User Agents Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import type {
  PlatformConfig,
  BrowserName,
} from "../../types/HttpClientTypes.ts";

class UserAgent {
  static defaultUserAgent: string = "facebookexternalhit/1.1";
  static windowsUserAgent: string =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  static platform: PlatformConfig = {
    platform: [
      "Windows NT 10.0; Win64; x64",
      "Macintosh; Intel Mac OS X 14.7; rv:132.0",
    ],
    browsers: {
      chrome: ["122.0.0.0", "121.0.0.0"],
      firefox: ["123.0", "122.0"],
      edge: ["122.0.2365.92"],
    },
  };

  static userAgentArray: string[] = [
    UserAgent.defaultUserAgent,
    UserAgent.windowsUserAgent,
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:45.0) Gecko/20100101 Firefox/45.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.8",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.3",
  ];

  /**
   * Get a random element from array
   */
  static getRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generate a random user agent string
   */
  static randomUserAgent(): string {
    const browserNames = Object.keys(
      UserAgent.platform.browsers,
    ) as BrowserName[];
    const browserName = UserAgent.getRandom(browserNames);

    if (!browserName || !UserAgent.platform.browsers[browserName]) {
      return UserAgent.defaultUserAgent;
    }

    const version = UserAgent.getRandom(
      UserAgent.platform.browsers[browserName],
    );
    const plat = UserAgent.getRandom(UserAgent.platform.platform);

    const ua = UserAgent.getRandom([
      browserName === "firefox"
        ? `Mozilla/5.0 (${plat}) Gecko/20100101 Firefox/${version}`
        : `Mozilla/5.0 (${plat}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`,
      UserAgent.getRandom(UserAgent.userAgentArray),
    ]);

    return ua || UserAgent.defaultUserAgent;
  }

  /**
   * Get default user agent
   */
  static getDefault(): string {
    return UserAgent.defaultUserAgent;
  }

  /**
   * Get Windows user agent
   */
  static getWindows(): string {
    return UserAgent.windowsUserAgent;
  }
}

export default UserAgent;
