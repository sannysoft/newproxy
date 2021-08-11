/// <reference types="node" />
import * as http from 'http';
import { ProxyConfig } from './types/proxy-config';
import { FakeServersCenter } from './tls/fake-servers-center';
import { Logger } from './common/logger';
export declare class NewProxy {
    private readonly proxyConfig;
    private readonly logger;
    readonly httpServer: http.Server;
    private readonly requestHandler;
    private readonly upgradeHandler;
    private readonly connectHandler;
    private serverSockets;
    private clientSockets;
    private _fakeServersCenter?;
    constructor(proxyConfig: ProxyConfig, logger: Logger);
    get fakeServersCenter(): FakeServersCenter;
    run(): Promise<void>;
    stop(): Promise<void>;
    private closeServer;
}
