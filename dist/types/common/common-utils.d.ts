/// <reference types="node" />
import * as http from 'http';
import { ExternalProxyFn } from '../types/functions/external-proxy-fn';
import { ExtendedRequestOptions } from '../types/request-options';
import { ExternalProxyConfig } from '../types/external-proxy-config';
export declare function makeErr(message: string): never;
export declare class CommonUtils {
    static getOptionsFromRequest(req: http.IncomingMessage, ssl: boolean, externalProxy: ExternalProxyConfig | ExternalProxyFn | undefined, res?: http.ServerResponse | undefined): ExtendedRequestOptions;
    private static getExternalProxyHelper;
    private static getTunnelAgent;
}
