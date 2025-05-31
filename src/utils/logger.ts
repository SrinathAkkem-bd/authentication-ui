class Logger {
  private sendToServer(level: string, message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      // Send log to the Vite dev server through WebSocket
      const ws = (window as any).__vite_plugin_custom_logger_ws;
      if (ws) {
        ws.send('custom:log', { level, message, args });
      }
    }
    // Also log to browser console
    console.log(`[${level.toUpperCase()}]`, message, ...args);
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