import { FakeServersCenter } from '../tls/fake-servers-center';
import { ProxyConfig } from '../types/proxy-config';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
export declare function createFakeServerCenter(proxyConfig: ProxyConfig, requestHandler: RequestHandlerFn, upgradeHandler: UpgradeHandlerFn): FakeServersCenter;
