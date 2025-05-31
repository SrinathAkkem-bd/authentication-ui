class Logger {
  private sendToServer(className: string, level: string, message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      const prefix = className ? `[${className}] ` : '';
      if (import.meta.hot) {
        import.meta.hot.send('custom:log', { 
          level, 
          message: `${prefix}${message}`, 
          args 
        });
      }
      // Also log to console for immediate feedback
      console.log(`[${level.toUpperCase()}] ${prefix}${message}`, ...args);
    }
  }

  info(className: string, message: string, ...args: any[]) {
    this.sendToServer(className, 'info', message, ...args);
  }

  warn(className: string, message: string, ...args: any[]) {
    this.sendToServer(className, 'warn', message, ...args);
  }

  error(className: string, message: string, ...args: any[]) {
    this.sendToServer(className, 'error', message, ...args);
  }

  success(className: string, message: string, ...args: any[]) {
    this.sendToServer(className, 'success', message, ...args);
  }

  debug(className: string, message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      this.sendToServer(className, 'debug', message, ...args);
    }
  }
}

export const logger = new Logger();

export class BaseComponent {
  protected className: string;

  constructor(className: string) {
    this.className = className;
  }

  protected log = {
    info: (message: string, ...args: any[]) => logger.info(this.className, message, ...args),
    warn: (message: string, ...args: any[]) => logger.warn(this.className, message, ...args),
    error: (message: string, ...args: any[]) => logger.error(this.className, message, ...args),
    success: (message: string, ...args: any[]) => logger.success(this.className, message, ...args),
    debug: (message: string, ...args: any[]) => logger.debug(this.className, message, ...args),
  };
}