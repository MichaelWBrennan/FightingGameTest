export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static setLogLevel(level) {
        this.logLevel = level;
    }
    static debug(message, ...args) {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.debug(`${this.prefix}[DEBUG]`, message, ...args);
        }
    }
    static info(message, ...args) {
        if (this.logLevel <= LogLevel.INFO) {
            console.info(`${this.prefix}[INFO]`, message, ...args);
        }
    }
    static warn(message, ...args) {
        if (this.logLevel <= LogLevel.WARN) {
            console.warn(`${this.prefix}[WARN]`, message, ...args);
        }
    }
    static error(message, ...args) {
        if (this.logLevel <= LogLevel.ERROR) {
            console.error(`${this.prefix}[ERROR]`, message, ...args);
        }
    }
}
Logger.logLevel = LogLevel.INFO;
Logger.prefix = '[SF3]';
//# sourceMappingURL=Logger.js.map