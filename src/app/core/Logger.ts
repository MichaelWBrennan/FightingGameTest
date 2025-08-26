export class Logger {
  private static instance: Logger;

  private constructor() {
    // private constructor for singleton
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  static log(message: string, ...args: any[]): void {
    console.log(`[${new Date().toISOString()}]`, message, ...args);
  }

  static info(message: string, ...args: any[]): void {
    console.info(`[${new Date().toISOString()}] INFO:`, message, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`[${new Date().toISOString()}] WARN:`, message, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`[${new Date().toISOString()}] ERROR:`, message, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    console.debug(message, ...args);
  }
}