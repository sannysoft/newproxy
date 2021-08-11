import { LoggingFn } from '../types/functions/log-fn';
import { ErrorLoggingFn } from '../types/functions/error-logging-fn';
declare type ColorFn = (str: string) => string;
export declare class Logger {
    private loggerConfig;
    private errorLoggerConfig;
    constructor(loggerConfig?: boolean | LoggingFn, errorLoggerConfig?: boolean | ErrorLoggingFn);
    log(message: string, colorFn?: ColorFn): void;
    logError(message: Error | any, comment?: string): void;
}
export {};
