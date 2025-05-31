class Logger {
  private sendToServer(level: string, message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      // @ts-ignore
      if (typeof window !== 'undefined' && window._ws) {
        // @ts-ignore
        window._ws.send('custom:log', { level, message, args });
      }
    }
  }

  info(message: string, ...args: any[]) {
    this.sendToServer('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.sendToServer('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.sendToServer('error', message, ...args);
  }

  success(message: string, ...args: any[]) {
    this.sendToServer('success', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      this.sendToServer('debug', message, ...args);
    }
  }
}

export const logger = new Logger();