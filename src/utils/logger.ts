class Logger {
  private getClassName(): string {
    try {
      const stackTrace = new Error().stack;
      if (!stackTrace) return '';

      // Split the stack trace into lines and get the caller
      const lines = stackTrace.split('\n');
      // Skip the first two lines (Error and logger method)
      const callerLine = lines[3];
      
      if (!callerLine) return '';

      // Try to match different patterns in the stack trace
      const patterns = [
        /at (\w+)\s?\.\s?(\w+)/, // For class methods: "at ClassName.methodName"
        /at (\w+)\s?\(/, // For functions: "at functionName ("
        /at\s+([^(\s]+)\s?\(/, // For any named function or method
      ];

      for (const pattern of patterns) {
        const match = callerLine.match(pattern);
        if (match && match[1]) {
          return `[${match[1]}] `;
        }
      }

      // If no class/function name found, try to get the file name
      const fileMatch = callerLine.match(/\/([^/]+?)(:[0-9]+)/);
      if (fileMatch && fileMatch[1]) {
        return `[${fileMatch[1].replace(/\.[^/.]+$/, '')}] `;
      }

      return '';
    } catch (error) {
      return '';
    }
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