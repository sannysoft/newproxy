/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { ProxyConfig } from '../types/proxy-config';
export declare class RequestHandler {
    private readonly req;
    private readonly res;
    private readonly ssl;
    private proxyConfig;
    private readonly rOptions;
    private proxyReq?;
    private proxyRes?;
    constructor(req: IncomingMessage, res: ServerResponse, ssl: boolean, proxyConfig: ProxyConfig);
    go(): Promise<void>;
    private sendHeadersAndPipe;
    private getProxyRequestPromise;
    private interceptRequest;
    private interceptResponse;
    private setKeepAlive;
}
