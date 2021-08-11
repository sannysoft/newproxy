import * as chalk from 'chalk';
import * as Debug from 'debug';
import { LoggingFn } from '../types/functions/log-fn';
import { ErrorLoggingFn } from '../types/functions/error-logging-fn';

const logger = Debug('newproxy');

type ColorFn = (str: string) => string;

export class Logger {
  constructor(
    private loggerConfig: boolean | LoggingFn = false,
    private errorLoggerConfig: boolean | ErrorLoggingFn = false,
  ) {}

  log(message: string, colorFn?: ColorFn): void {
    if (typeof this.loggerConfig === 'function') {
      this.loggerConfig(message);
    } else if (this.loggerConfig) {
      const formattedMessage = colorFn?.(message) ?? message;
      logger(formattedMessage);
    }
  }

  logError(message: Error | any, comment?: string): void {
    let fullComment = comment ?? '';
    if (fullComment !== '') fullComment += '  ';
    if (typeof this.errorLoggerConfig === 'function') {
      this.errorLoggerConfig(message, comment);
    } else if (this.loggerConfig) {
      if (message instanceof Error) {
        this.log(message.message);
      } else {
        this.log(message, chalk.red);
      }
    }
  }
}
