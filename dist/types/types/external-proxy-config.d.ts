/// <reference types="node" />
import * as url from 'url';
export interface ExternalProxyConfigObject {
    host: string;
    port: number;
    username?: string;
    password?: string;
}
export declare type ExternalProxyConfig = ExternalProxyConfigObject | string;
export declare type ExternalProxyConfigOrNull = ExternalProxyConfig | undefined;
export declare function isExternalProxyConfigObject(obj: unknown): obj is ExternalProxyConfigObject;
export declare class ExternalProxyHelper {
    private readonly config;
    constructor(config: ExternalProxyConfig);
    getUrlObject(): url.UrlWithStringQuery;
    getProtocol(): string;
    getLoginAndPassword(): string | undefined;
    getBasicAuth(): string | undefined;
    getConfigObject(): ExternalProxyConfigObject;
}
