import colors from 'picocolors';

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

class Logger {
  private getPrefix(level: LogLevel): string {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] `;
    
    switch (level) {
      case 'info':
        return message + 'ℹ️ INFO:';
      case 'warn':
        return message + '⚠️ WARN:';
      case 'error':
        return message + '❌ ERROR:';
      case 'success':
        return message + '✅ SUCCESS:';
      case 'debug':
        return message + '🔍 DEBUG:';
      default:
        return message;
    }
  }

  private sendToServer(level: LogLevel, message: string, ...args: any[]) {
    // Send log to the dev server
    if (import.meta.env.DEV) {
      const event = new CustomEvent('vite:log', {
        detail: { level, message, args, timestamp: new Date().toISOString() }
      });
      window.dispatchEvent(event);
    }
  }

  info(message: string, ...args: any[]) {
    const prefix = this.getPrefix('info');
    console.log(prefix, message, ...args);
    this.sendToServer('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    const prefix = this.getPrefix('warn');
    console.warn(prefix, message, ...args);
    this.sendToServer('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    const prefix = this.getPrefix('error');
    console.error(prefix, message, ...args);
    this.sendToServer('error', message, ...args);
  }

  success(message: string, ...args: any[]) {
    const prefix = this.getPrefix('success');
    console.log(prefix, message, ...args);
    this.sendToServer('success', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      const prefix = this.getPrefix('debug');
      console.log(prefix, message, ...args);
      this.sendToServer('debug', message, ...args);
    }
  }
}

export const logger = new Logger();