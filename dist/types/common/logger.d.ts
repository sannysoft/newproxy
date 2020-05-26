import { LoggingFn } from '../types/functions/log-fn';
import { ErrorLoggingFn } from '../types/functions/error-logging-fn';
declare type colorFn = (str: string) => string;
export declare function setLoggerConfig(value: boolean | LoggingFn): void;
export declare function setErrorLoggerConfig(value: boolean | ErrorLoggingFn): void;
export declare function log(message: string, colorFn?: colorFn): void;
export declare function logError(message: Error | any, comment?: string): void;
export {};
