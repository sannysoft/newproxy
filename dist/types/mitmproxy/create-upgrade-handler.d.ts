import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { ProxyConfig } from '../types/proxy-config';
import { Logger } from '../common/logger';
export declare function createUpgradeHandler(proxyConfig: ProxyConfig, logger: Logger): UpgradeHandlerFn;
