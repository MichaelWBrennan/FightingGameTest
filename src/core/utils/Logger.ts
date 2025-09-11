
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export type LogEvent = {
  level: LogLevel;
  message: string;
  args: any[];
  timestamp: number;
};

export interface LogSink {
  log(event: LogEvent): void;
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  private static prefix = '[SF3]';
  private static sinks: Set<LogSink> = new Set();

  public static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public static setPrefix(prefix: string): void {
    this.prefix = prefix || '';
  }

  public static registerSink(sink: LogSink): void {
    if (!sink || typeof sink.log !== 'function') return;
    this.sinks.add(sink);
  }

  public static unregisterSink(sink: LogSink): void {
    this.sinks.delete(sink);
  }

  public static clearSinks(): void {
    this.sinks.clear();
  }

  private static emit(level: LogLevel, message: string, args: any[]): void {
    const event: LogEvent = { level, message, args, timestamp: Date.now() };
    // Console output for developers
    switch (level) {
      case LogLevel.DEBUG:
        if (this.logLevel <= LogLevel.DEBUG) console.debug(`${this.prefix}[DEBUG]`, message, ...args);
        break;
      case LogLevel.INFO:
        if (this.logLevel <= LogLevel.INFO) console.info(`${this.prefix}[INFO]`, message, ...args);
        break;
      case LogLevel.WARN:
        if (this.logLevel <= LogLevel.WARN) console.warn(`${this.prefix}[WARN]`, message, ...args);
        break;
      case LogLevel.ERROR:
        if (this.logLevel <= LogLevel.ERROR) console.error(`${this.prefix}[ERROR]`, message, ...args);
        break;
    }
    // Broadcast to sinks
    if (this.sinks.size > 0) {
      try {
        this.sinks.forEach(s => {
          try { s.log(event); } catch {}
        });
      } catch {}
    }
  }

  public static debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.emit(LogLevel.DEBUG, message, args);
    }
  }

  public static info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.emit(LogLevel.INFO, message, args);
    }
  }

  public static warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.emit(LogLevel.WARN, message, args);
    }
  }

  public static error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.emit(LogLevel.ERROR, message, args);
    }
  }
}
