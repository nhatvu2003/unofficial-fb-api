/**
 * Logger Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
/**
 * Logger class for consistent logging across the application
 */
declare class Logger {
    static isConsoleEnabled(): boolean;
    static log(...args: any[]): void;
    static error(...args: any[]): void;
    static warn(...args: any[]): void;
    static success(...args: any[]): void;
    static debug(...args: any[]): void;
    static httpFile(...args: any[]): void;
}
export default Logger;
//# sourceMappingURL=Logger.d.ts.map