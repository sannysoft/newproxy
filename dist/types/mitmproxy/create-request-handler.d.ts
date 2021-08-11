import { ProxyConfig } from '../types/proxy-config';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { Logger } from '../common/logger';
export declare function createRequestHandler(proxyConfig: ProxyConfig, logger: Logger): RequestHandlerFn;
