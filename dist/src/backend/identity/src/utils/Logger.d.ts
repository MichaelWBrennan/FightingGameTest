export declare class Logger {
    private static instance;
    private constructor();
    static getInstance(): Logger;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
//# sourceMappingURL=Logger.d.ts.map