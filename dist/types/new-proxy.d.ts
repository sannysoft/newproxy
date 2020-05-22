import { ProxyConfig, UserProxyConfig } from './types/proxy-config';
import { SslConnectInterceptorFn } from './types/functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './types/functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './types/functions/response-interceptor-fn';
import { ExternalProxyFn } from './types/functions/external-proxy-fn';
import { LoggingFn } from './types/functions/log-fn';
import { ErrorLoggingFn } from './types/functions/error-logging-fn';
export default class NewProxy {
    protected proxyConfig: ProxyConfig;
    private server;
    private requestHandler?;
    private upgradeHandler?;
    private fakeServersCenter?;
    private connectHandler?;
    constructor(userProxyConfig?: UserProxyConfig);
    port(port: number): NewProxy;
    sslConnectInterceptor(value: SslConnectInterceptorFn | boolean): NewProxy;
    requestInterceptor(value: RequestInterceptorFn): NewProxy;
    responseInterceptor(value: ResponseInterceptorFn): NewProxy;
    log(value: boolean | LoggingFn): NewProxy;
    errorLog(value: boolean | ErrorLoggingFn): NewProxy;
    ca(caKeyPath: string, caCertPath: string): NewProxy;
    externalProxy(value: string | ExternalProxyFn): NewProxy;
    private static setDefaultsForConfig;
    setup(): void;
    run(): void;
    stop(): void;
}
