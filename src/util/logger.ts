export const LogLevel = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  NONE: 6,
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const MARKER = '[aribb24.js]';

export interface Logger {
  trace(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  fatal(...args: unknown[]): void;
}

export class NoopLogger implements Logger {
  trace(..._: unknown[]): void {}
  debug(..._: unknown[]): void {}
  info(..._: unknown[]): void {}
  warn(..._: unknown[]): void {}
  error(..._: unknown[]): void {}
  fatal(..._: unknown[]): void {}
}

export class ConsoleLogger implements Logger {
  private loglevel: LogLevel;
  public constructor(loglevel?: LogLevel) {
    this.loglevel = loglevel ?? LogLevel.INFO;
  }

  trace(...args: unknown[]): void {
    if (this.loglevel > LogLevel.TRACE) { return; }
    console.debug(MARKER, 'TRACE', ...args);
  }

  debug(...args: unknown[]): void {
    if (this.loglevel > LogLevel.DEBUG) { return; }
    console.debug(MARKER, 'DEBUG', ...args);
  }

  info(...args: unknown[]): void {
    if (this.loglevel > LogLevel.INFO) { return; }
    console.info(MARKER, 'INFO', ...args);
  }

  warn(...args: unknown[]): void {
    if (this.loglevel > LogLevel.WARN) { return; }
    console.warn(MARKER, 'WARN', ...args);
  }

  error(...args: unknown[]): void {
    if (this.loglevel > LogLevel.ERROR) { return; }
    console.error(MARKER, 'ERROR', ...args);
  }

  fatal(...args: unknown[]): void {
    if (this.loglevel > LogLevel.FATAL) { return; }
    console.error(MARKER, 'FATAL', ...args);
  }
}
