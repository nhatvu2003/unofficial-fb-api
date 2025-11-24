/**
 * Logger Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import fs from "fs";
import path from "path";
const COLORS = {
    reset: "\x1b[0m",
    blue: "\x1b[34m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    gray: "\x1b[90m",
};
const LEVELS = ["error", "warn", "success", "info", "debug"];
function getLogLevel() {
    const env = process?.env ?? {};
    const lvl = (env.NVFCA_LOG_LEVEL ?? "info").toLowerCase();
    const idx = LEVELS.indexOf(lvl);
    return idx === -1 ? 3 : idx; // default to 'info'
}
const LOG_LEVEL_IDX = getLogLevel();
function colorize(level, msg) {
    switch (level) {
        case "info":
            return COLORS.blue + msg + COLORS.reset;
        case "error":
            return COLORS.red + msg + COLORS.reset;
        case "warn":
            return COLORS.yellow + msg + COLORS.reset;
        case "success":
            return COLORS.green + msg + COLORS.reset;
        case "debug":
            return COLORS.gray + msg + COLORS.reset;
        default:
            return msg;
    }
}
/**
 * Logger class for consistent logging across the application
 */
class Logger {
    static isConsoleEnabled() {
        try {
            const env = process?.env ?? {};
            const disabled = env.NVFCA_SILENT_LOG === "1" ||
                env.NVFCA_SILENT_LOG === "true" ||
                env.NVFCA_NO_CONSOLE === "1" ||
                env.NVFCA_NO_CONSOLE === "true";
            return !disabled;
        }
        catch {
            return true;
        }
    }
    static log(...args) {
        if (!Logger.isConsoleEnabled() || LOG_LEVEL_IDX < 3)
            return;
        console.log(colorize("info", "[INFO]"), ...args);
    }
    static error(...args) {
        if (!Logger.isConsoleEnabled() || LOG_LEVEL_IDX < 0)
            return;
        console.error(colorize("error", "[ERROR]"), ...args);
    }
    static warn(...args) {
        if (!Logger.isConsoleEnabled() || LOG_LEVEL_IDX < 1)
            return;
        console.warn(colorize("warn", "[WARNING]"), ...args);
    }
    static success(...args) {
        if (!Logger.isConsoleEnabled() || LOG_LEVEL_IDX < 2)
            return;
        console.log(colorize("success", "[SUCCESS]"), ...args);
    }
    static debug(...args) {
        if (!Logger.isConsoleEnabled() || LOG_LEVEL_IDX < 4)
            return;
        if (process.env.NODE_ENV === "development" ||
            process.env.NVFCA_LOG_LEVEL === "debug") {
            console.log(colorize("debug", "[DEBUG]"), ...args);
        }
    }
    static httpFile(...args) {
        try {
            const enabled = process?.env?.NVFCA_HTTP_VERBOSE === "1" ||
                process?.env?.NVFCA_HTTP_VERBOSE === "true";
            if (!enabled)
                return;
            const logPath = path.resolve(process.cwd(), "nhatvu-fca-http.log");
            const line = args
                .map((a) => {
                if (typeof a === "string")
                    return a;
                try {
                    return JSON.stringify(a);
                }
                catch {
                    return String(a);
                }
            })
                .join(" ");
            fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
        }
        catch {
            // ignore file write errors
        }
    }
}
export default Logger;
//# sourceMappingURL=Logger.js.map