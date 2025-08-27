export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private static logLevel;
    private static prefix;
    static setLogLevel(level: LogLevel): void;
    static debug(message: string, ...args: any[]): void;
    static info(message: string, ...args: any[]): void;
    static warn(message: string, ...args: any[]): void;
    static error(message: string, ...args: any[]): void;
}
