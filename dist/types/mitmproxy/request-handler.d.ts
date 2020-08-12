import { ProxyConfig } from '../types/proxy-config';
import { Context } from '../types/contexts/context';
export declare class RequestHandler {
    private readonly req;
    private readonly res;
    private proxyConfig;
    private rOptions;
    private proxyReq?;
    private proxyRes?;
    private context;
    constructor(context: Context, proxyConfig: ProxyConfig);
    go(): Promise<void>;
    private sendHeadersAndPipe;
    private getProxyRequestPromise;
    private interceptRequest;
    private interceptResponse;
    private setKeepAlive;
}
