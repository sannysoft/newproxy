import * as chalk from 'chalk';
import debug from 'debug';
import { LoggingFn } from '../types/functions/log-fn';
import { ErrorLoggingFn } from '../types/functions/error-logging-fn';

const logger = debug('newproxy');

let loggerConfig: boolean | LoggingFn = false;
let errorLoggerConfig: boolean | ErrorLoggingFn = false;

type colorFn = (str: string) => string;

export function setLoggerConfig(value: boolean | LoggingFn): void {
  loggerConfig = value;
}

export function setErrorLoggerConfig(value: boolean | ErrorLoggingFn): void {
  errorLoggerConfig = value;
}

export function log(message: string, colorFn?: colorFn): void {
  if (typeof loggerConfig === 'function') {
    loggerConfig(message);
  } else if (loggerConfig) {
    const formattedMessage = colorFn?.(message) ?? message;
    console.log(formattedMessage);
  } else {
    logger(message);
  }
}

export function logError(message: Error | any, comment?: string): void {
  let fullComment = comment ?? '';
  if (fullComment !== '') fullComment += '  ';
  if (typeof errorLoggerConfig === 'function') {
    errorLoggerConfig(message, comment);
  } else if (loggerConfig) {
    if (message instanceof Error) {
      console.error(fullComment, message);
    } else {
      log(message, chalk.red);
    }
  } else {
    debug(`Error: ${message}`);
  }
}
