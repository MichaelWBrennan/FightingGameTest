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
    info(message, ...args) {
        console.log(message, ...args);
    }
    warn(message, ...args) {
        console.warn(message, ...args);
    }
    error(message, ...args) {
        console.error(message, ...args);
    }
    debug(message, ...args) {
        console.debug(message, ...args);
    }
}
//# sourceMappingURL=Logger.js.map