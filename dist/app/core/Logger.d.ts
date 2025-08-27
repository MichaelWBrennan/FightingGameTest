export declare class Logger {
    private static instance;
    private constructor();
    static getInstance(): Logger;
    static log(message: string, ...args: any[]): void;
    static info(message: string, ...args: any[]): void;
    static warn(message: string, ...args: any[]): void;
    static error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
