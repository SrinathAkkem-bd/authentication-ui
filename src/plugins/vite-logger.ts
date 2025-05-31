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

export const terminalLogger = new TerminalLogger();

export function customLogger(): Plugin {
  let wsInstance: any;

  return {
    name: 'vite-custom-logger',
    configureServer(server) {
      wsInstance = server.ws;
      server.ws.on('custom:log', (data) => {
        const { level, message, args } = data;
        terminalLogger.log(level, message, ...args);
      });
    },
    transform(code, id) {
      if (id.includes('src/utils/logger.ts')) {
        return {
          code: code.replace('window._ws', 'import.meta.hot.send'),
          map: null
        };
      }
      return null;
    }
  };
}