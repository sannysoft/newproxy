/// <reference types="node" />
import * as url from 'url';
export declare type ExternalProxyConfig = ExternalProxyConfigObject | string;
export declare type ExternalProxyConfigOrNull = ExternalProxyConfig | null;
interface ExternalProxyConfigObject {
    url: string;
    login?: string;
    password?: string;
}
export declare class ExternalProxyHelper {
    private readonly config;
    constructor(config: ExternalProxyConfig);
    getUrlObject(): url.UrlWithStringQuery;
    getProtocol(): string;
    getLoginAndPassword(): string | undefined;
}
export {};
