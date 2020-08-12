import { ExtendedRequestOptions } from '../types/request-options';
import { Context } from '../types/contexts/context';
import { ProxyConfig } from '../types/proxy-config';
export declare class CommonUtils {
    static getOptionsFromRequest(context: Context, proxyConfig: ProxyConfig): ExtendedRequestOptions;
    private static getExternalProxyHelper;
}
