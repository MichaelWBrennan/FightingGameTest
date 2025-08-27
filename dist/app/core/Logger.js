export class Logger {
    constructor() {
        // private constructor for singleton
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    static log(message, ...args) {
        console.log(`[${new Date().toISOString()}]`, message, ...args);
    }
    static info(message, ...args) {
        console.info(`[${new Date().toISOString()}] INFO:`, message, ...args);
    }
    static warn(message, ...args) {
        console.warn(`[${new Date().toISOString()}] WARN:`, message, ...args);
    }
    static error(message, ...args) {
        console.error(`[${new Date().toISOString()}] ERROR:`, message, ...args);
    }
    debug(message, ...args) {
        console.debug(message, ...args);
    }
}
//# sourceMappingURL=Logger.js.map