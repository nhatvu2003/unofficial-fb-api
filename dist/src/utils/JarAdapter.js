/**
 * Jar Adapter Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { CookieJar } from "tough-cookie";
/**
 * Normalizes various jar shapes into a single adapter object that
 * the rest of the codebase (HttpClient, BuildAPI, etc.) can consume.
 * The adapter always exposes: _tough, getCookiesSync, getCookies, getCookieStringSync,
 * getCookieString, setCookieSync, setCookie (async variant returning Promise).
 */
function isCookieJar(obj) {
    if (!obj)
        return false;
    try {
        // Prefer instanceof check when possible (covers tough-cookie instances)
        if (obj instanceof CookieJar)
            return true;
    }
    catch (e) {
        // ignore - instanceof may fail across package boundaries
    }
    // Fallback: detect common methods across tough-cookie versions and lightweight jars
    const hasGet = typeof obj.getCookies === "function" ||
        typeof obj.getCookiesSync === "function";
    const hasGetString = typeof obj.getCookieString === "function" ||
        typeof obj.getCookieStringSync === "function";
    const hasSet = typeof obj.setCookie === "function" ||
        typeof obj.setCookieSync === "function";
    return !!(hasGet && hasGetString && hasSet);
}
export default class JarAdapter {
    static wrap(inputJar) {
        // If input is already an adapter-like object with _tough and sync methods, return it
        if (inputJar &&
            inputJar._tough &&
            typeof inputJar.getCookiesSync === "function") {
            return inputJar;
        }
        // If input is a tough-cookie CookieJar instance
        if (isCookieJar(inputJar)) {
            const jar = inputJar;
            return {
                _tough: jar,
                getCookiesSync: (url) => jar.getCookiesSync(url),
                getCookies: (url) => Promise.resolve(jar.getCookiesSync(url)),
                getCookieStringSync: (url) => jar.getCookieStringSync(url),
                getCookieString: (url) => Promise.resolve(jar.getCookieStringSync(url)),
                setCookieSync: (cookieStr, url) => jar.setCookieSync ? jar.setCookieSync(cookieStr, url) : undefined,
                setCookie: (cookieStr, url) => {
                    try {
                        if (typeof jar.setCookieSync === "function") {
                            const r = jar.setCookieSync(cookieStr, url);
                            return Promise.resolve(r);
                        }
                        if (typeof jar.setCookie === "function") {
                            // some versions return a promise
                            const res = jar.setCookie(cookieStr, url);
                            return Promise.resolve(res);
                        }
                    }
                    catch (e) {
                        return Promise.reject(e);
                    }
                    return Promise.resolve(undefined);
                },
            };
        }
        // If input is undefined/null -> create new CookieJar
        if (!inputJar) {
            const newJar = new CookieJar();
            return JarAdapter.wrap(newJar);
        }
        // If it's a plain object that already exposes cookie methods, normalize
        const maybeJar = inputJar;
        const tough = maybeJar._tough || (isCookieJar(maybeJar) ? maybeJar : undefined);
        const adapter = {
            _tough: tough,
            getCookiesSync: typeof maybeJar.getCookiesSync === "function"
                ? maybeJar.getCookiesSync.bind(maybeJar)
                : (url) => maybeJar.getCookies ? maybeJar.getCookies(url) : [],
            getCookies: typeof maybeJar.getCookies === "function"
                ? maybeJar.getCookies.bind(maybeJar)
                : (url) => Promise.resolve(adapter.getCookiesSync(url)),
            getCookieStringSync: typeof maybeJar.getCookieStringSync === "function"
                ? maybeJar.getCookieStringSync.bind(maybeJar)
                : (url) => maybeJar.getCookieString ? maybeJar.getCookieString(url) : "",
            getCookieString: typeof maybeJar.getCookieString === "function"
                ? maybeJar.getCookieString.bind(maybeJar)
                : (url) => Promise.resolve(adapter.getCookieStringSync(url)),
            setCookieSync: typeof maybeJar.setCookieSync === "function"
                ? maybeJar.setCookieSync.bind(maybeJar)
                : undefined,
            setCookie: (cookieStr, url) => {
                try {
                    if (typeof maybeJar.setCookie === "function")
                        return Promise.resolve(maybeJar.setCookie(cookieStr, url));
                    if (typeof maybeJar.setCookieSync === "function")
                        return Promise.resolve(maybeJar.setCookieSync(cookieStr, url));
                }
                catch (e) {
                    return Promise.reject(e);
                }
                return Promise.resolve(undefined);
            },
        };
        return adapter;
    }
}
//# sourceMappingURL=JarAdapter.js.map