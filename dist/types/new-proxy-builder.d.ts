import { SslMitmFn } from './types/functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './types/functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './types/functions/response-interceptor-fn';
import { LoggingFn } from './types/functions/log-fn';
import { StatusFn } from './types/functions/status-fn';
import { ErrorLoggingFn } from './types/functions/error-logging-fn';
import { ExternalProxyConfig } from './types/external-proxy-config';
import { ExternalProxyFn, ExternalProxyNoMitmFn } from './types/functions/external-proxy-fn';
import { NewProxy } from './new-proxy';
export declare class NewProxyBuilder {
    private config;
    static new(): NewProxyBuilder;
    port(port: number): NewProxyBuilder;
    sslMitm(value: SslMitmFn | boolean): NewProxyBuilder;
    requestInterceptor(value: RequestInterceptorFn): NewProxyBuilder;
    responseInterceptor(value: ResponseInterceptorFn): NewProxyBuilder;
    log(value: boolean | LoggingFn): NewProxyBuilder;
    metrics(value: StatusFn): NewProxyBuilder;
    errorLog(value: boolean | ErrorLoggingFn): NewProxyBuilder;
    ca(caKeyPath: string, caCertPath: string): NewProxyBuilder;
    externalProxy(value: ExternalProxyConfig | ExternalProxyFn | undefined): NewProxyBuilder;
    externalProxyNoMitm(value: ExternalProxyConfig | ExternalProxyNoMitmFn | undefined): NewProxyBuilder;
    build(): NewProxy;
}
