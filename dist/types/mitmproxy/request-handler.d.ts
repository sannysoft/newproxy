import { ProxyConfig } from '../types/proxy-config';
import { Context } from '../types/contexts/context';
import { Logger } from '../common/logger';
export declare class RequestHandler {
    private readonly context;
    private readonly proxyConfig;
    private readonly logger;
    private readonly req;
    private readonly res;
    private readonly rOptions;
    private proxyReq?;
    private proxyRes?;
    constructor(context: Context, proxyConfig: ProxyConfig, logger: Logger);
    go(): Promise<void>;
    private sendHeadersAndPipe;
    private getProxyRequestPromise;
    private interceptRequest;
    private interceptResponse;
    private setKeepAlive;
}
