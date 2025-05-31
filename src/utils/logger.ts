class Logger {
  private getClassName(): string {
    const stack = new Error().stack;
    if (!stack) return '';
    
    const stackLines = stack.split('\n');
    // Find the first line that's not from logger.ts
    const callerLine = stackLines.find(line => !line.includes('logger.ts'));
    if (!callerLine) return '';

    // Extract class/file name from the stack trace
    const match = callerLine.match(/at (?:(\w+)\.)?(\w+) \((.*?)\)/);
    if (match) {
      const [, className = '', methodName = ''] = match;
      return className ? `[${className}] ` : '';
    }
    return '';
  }

  private sendToServer(level: string, message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      const className = this.getClassName();
      if (import.meta.hot) {
        import.meta.hot.send('custom:log', { 
          level, 
          message: `${className}${message}`, 
          args 
        });
      }
      // Also log to console for immediate feedback
      console.log(`[${level.toUpperCase()}] ${className}${message}`, ...args);
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