import { CaPair } from '../types/ca-pair';
import { ServerObject } from '../types/server-object';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
export declare class FakeServersCenter {
    private queue;
    private readonly maxFakeServersCount;
    private certAndKeyContainer;
    private readonly requestHandler;
    private readonly upgradeHandler;
    constructor(maxLength: number | undefined, requestHandler: RequestHandlerFn, upgradeHandler: UpgradeHandlerFn, caPair: CaPair, getCertSocketTimeout: number);
    private addServerPromise;
    getServerPromise(hostname: string, port: number): Promise<ServerObject>;
    private createNewServerPromise;
    private reRankServer;
}
