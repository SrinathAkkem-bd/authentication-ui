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

export function customLogger(): Plugin {
  const logger = new TerminalLogger();

  return {
    name: 'vite-custom-logger',
    configureServer(server) {
      server.middlewares.use((req, _, next) => {
        logger.log('info', `${req.method} ${req.url}`);
        next();
      });

      const originalPrint = server.printUrls;
      server.printUrls = () => {
        const interfaces = server.httpServer?.address();
        if (!interfaces) return;

        logger.log('success', '🚀 Development server started!');
        logger.log('info', `Local: ${colors.blue(`http://localhost:${server.config.server?.port}`)}`);
        
        if (server.config.server?.host === true) {
          logger.log('info', `Network: ${colors.blue(`http://${server.resolvedUrls?.network[0]}`)}`);
        }
      };
    },
    buildStart() {
      logger.log('info', '📦 Build process starting...');
    },
    buildEnd() {
      logger.log('success', '✨ Build completed successfully!');
    },
    handleHotUpdate({ file }) {
      logger.log('info', `🔄 Hot Update: ${colors.dim(file)}`);
      return;
    },
    transform(code, id) {
      if (id.includes('src')) {
        logger.log('debug', `Transforming: ${colors.dim(id)}`);
      }
      return null;
    }
  };
}