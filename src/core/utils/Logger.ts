
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  private static prefix = '[SF3]';

  public static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public static debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`${this.prefix}[DEBUG]`, message, ...args);
    }
  }

  public static info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`${this.prefix}[INFO]`, message, ...args);
    }
  }

  public static warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`${this.prefix}[WARN]`, message, ...args);
    }
  }

  public static error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`${this.prefix}[ERROR]`, message, ...args);
    }
  }
}
