/// <reference types="node" />
import * as http from 'http';
import { ProxyConfig, UserProxyConfig } from './types/proxy-config';
import { SslMitmFn } from './types/functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './types/functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './types/functions/response-interceptor-fn';
import { ExternalProxyFn, ExternalProxyNoMitmFn } from './types/functions/external-proxy-fn';
import { LoggingFn } from './types/functions/log-fn';
import { ErrorLoggingFn } from './types/functions/error-logging-fn';
import { ExternalProxyConfig } from './types/external-proxy-config';
import { StatusFn } from './types/functions/status-fn';
export default class NewProxy {
    protected proxyConfig: ProxyConfig;
    httpServer: http.Server;
    private requestHandler?;
    private upgradeHandler?;
    private fakeServersCenter?;
    private connectHandler?;
    private serverSockets;
    constructor(userProxyConfig?: UserProxyConfig);
    port(port: number): NewProxy;
    sslMitm(value: SslMitmFn | boolean): NewProxy;
    requestInterceptor(value: RequestInterceptorFn): NewProxy;
    responseInterceptor(value: ResponseInterceptorFn): NewProxy;
    log(value: boolean | LoggingFn): NewProxy;
    metrics(value: StatusFn): NewProxy;
    errorLog(value: boolean | ErrorLoggingFn): NewProxy;
    ca(caKeyPath: string, caCertPath: string): NewProxy;
    externalProxy(value: ExternalProxyConfig | ExternalProxyFn | undefined): NewProxy;
    externalProxyNoMitm(value: ExternalProxyConfig | ExternalProxyNoMitmFn | undefined): NewProxy;
    private static setDefaultsForConfig;
    setup(): void;
    run(): Promise<void>;
    stop(): Promise<void>;
}
