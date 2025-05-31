import colors from 'picocolors';

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

class Logger {
  private getPrefix(level: LogLevel): string {
    const timestamp = new Date().toISOString();
    switch (level) {
      case 'info':
        return colors.blue(`[${timestamp}] ℹ️ INFO:`);
      case 'warn':
        return colors.yellow(`[${timestamp}] ⚠️ WARN:`);
      case 'error':
        return colors.red(`[${timestamp}] ❌ ERROR:`);
      case 'success':
        return colors.green(`[${timestamp}] ✅ SUCCESS:`);
      case 'debug':
        return colors.magenta(`[${timestamp}] 🔍 DEBUG:`);
      default:
        return `[${timestamp}]`;
    }
  }

  info(message: string, ...args: any[]) {
    console.log(this.getPrefix('info'), message, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.getPrefix('warn'), message, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(this.getPrefix('error'), message, ...args);
  }

  success(message: string, ...args: any[]) {
    console.log(this.getPrefix('success'), message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      console.log(this.getPrefix('debug'), message, ...args);
    }
  }
}

export const logger = new Logger();