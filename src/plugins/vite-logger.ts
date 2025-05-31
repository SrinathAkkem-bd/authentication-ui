import type { Plugin } from 'vite';
import colors from 'picocolors';

class TerminalLogger {
  private getPrefix(level: string): string {
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

  log(level: string, message: string, ...args: any[]) {
    const prefix = this.getPrefix(level);
    console.log(prefix, message, ...args);
  }
}

const terminalLogger = new TerminalLogger();

export function customLogger(): Plugin {
  return {
    name: 'vite-custom-logger',
    configureServer(server) {
      server.ws.on('custom:log', (data) => {
        const { level, message, args } = data;
        terminalLogger.log(level, message, ...args);
      });
    }
  };
}