import { SslMitmFn } from './functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './functions/response-interceptor-fn';
import { ExternalProxyFn, ExternalProxyNoMitmFn } from './functions/external-proxy-fn';
import { ExternalProxyConfig } from './external-proxy-config';
import { LoggingFn } from './functions/log-fn';
import { ErrorLoggingFn } from './functions/error-logging-fn';

export interface ProxyConfig {
  port: number;

  log: boolean | LoggingFn;
  errorLog: boolean | ErrorLoggingFn;

  sslMitm: SslMitmFn | boolean | undefined;
  requestInterceptor: RequestInterceptorFn | undefined;
  responseInterceptor: ResponseInterceptorFn | undefined;

  getCertSocketTimeout: number;

  externalProxy: ExternalProxyConfig | ExternalProxyFn | undefined;
  externalProxyNoMitm: ExternalProxyConfig | ExternalProxyNoMitmFn | undefined;

  caCertPath: string;
  caKeyPath: string;
}

export type UserProxyConfig = Partial<ProxyConfig>;
