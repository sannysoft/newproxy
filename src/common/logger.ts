import * as util from 'util';
import chalk from 'chalk';
import { LoggingFn } from '../types/functions/log-fn';
import { ErrorLoggingFn } from '../types/functions/error-logging-fn';

const debug = util.debuglog('newproxy');

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
    debug(message);
  }
}

export function logError(message: Error): void {
  if (typeof errorLoggerConfig === 'function') {
    errorLoggerConfig(message);
  } else if (loggerConfig) {
    if (message instanceof Error) {
      console.error(message);
    } else {
      log(message, chalk.red);
    }
  } else {
    debug(`Error: ${message}`);
  }
}
