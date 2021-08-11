import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { Logger } from '../common/logger';
import { ProxyConfig } from '../types/proxy-config';
import { HttpsServer } from './https-server';
export declare class FakeServersCenter {
    private readonly requestHandler;
    private readonly upgradeHandler;
    private readonly logger;
    private queue;
    private readonly maxFakeServersCount;
    private readonly certAndKeyContainer;
    constructor(proxyConfig: ProxyConfig, requestHandler: RequestHandlerFn, upgradeHandler: UpgradeHandlerFn, logger: Logger);
    getFakeServer(hostname: string, port: number): HttpsServer;
    private reRankServer;
    close(): Promise<void>;
}
