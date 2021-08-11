import { ExtendedRequestOptions } from '../types/request-options';
import { Context } from '../types/contexts/context';
import { ProxyConfig } from '../types/proxy-config';
import { Logger } from './logger';
export declare class CommonUtils {
    static getOptionsFromRequest(context: Context, proxyConfig: ProxyConfig, logger: Logger): ExtendedRequestOptions;
    private static getExternalProxyHelper;
}
