// Centralized logging utility with better error handling

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createLogEntry(level: LogLevel, message: string, context?: any, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    let message = `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    
    if (entry.context) {
      message += `\nContext: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\nError: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  debug(message: string, context?: any) {
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage(entry));
    }
  }

  info(message: string, context?: any) {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.info(this.formatMessage(entry));
    }
  }

  warn(message: string, context?: any, error?: Error) {
    const entry = this.createLogEntry('warn', message, context, error);
    this.addLog(entry);
    
    console.warn(this.formatMessage(entry));
  }

  error(message: string, context?: any, error?: Error) {
    const entry = this.createLogEntry('error', message, context, error);
    this.addLog(entry);
    
    console.error(this.formatMessage(entry));
    
    // In production, you might want to send this to an error tracking service
    if (!this.isDevelopment && error) {
      // Example: Send to error tracking service
      // errorTrackingService.reportError(error, { message, context });
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return this.logs.map(entry => this.formatMessage(entry)).join('\n\n');
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions for common patterns
export const logError = (message: string, error: Error, context?: any) => {
  logger.error(message, context, error);
};

export const logApiError = (endpoint: string, error: Error, context?: any) => {
  logger.error(`API Error: ${endpoint}`, { endpoint, ...context }, error);
};

export const logAuthError = (action: string, error: Error, context?: any) => {
  logger.error(`Auth Error: ${action}`, { action, ...context }, error);
};

export const logScannerError = (action: string, error: Error, context?: any) => {
  logger.error(`Scanner Error: ${action}`, { action, ...context }, error);
};
