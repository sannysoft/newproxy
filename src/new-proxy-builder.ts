import * as chalk from 'chalk';
import { ProxyConfig } from './types/proxy-config';
import { TlsUtils } from './tls/tls-utils';
import { caConfig } from './common/ca-config';
import { SslMitmFn } from './types/functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './types/functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './types/functions/response-interceptor-fn';
import { LoggingFn } from './types/functions/log-fn';
import { StatusFn } from './types/functions/status-fn';
import { ErrorLoggingFn } from './types/functions/error-logging-fn';
import { ExternalProxyConfig } from './types/external-proxy-config';
import { ExternalProxyFn, ExternalProxyNoMitmFn } from './types/functions/external-proxy-fn';
import { Logger } from './common/logger';
import { NewProxy } from './new-proxy';

export class NewProxyBuilder {
  private config: Partial<ProxyConfig> = {
    port: 6789,

    log: true,
    errorLog: true,

    statusFn: undefined,
    statusNoMitmFn: undefined,

    sslMitm: undefined,
    requestInterceptor: undefined,
    responseInterceptor: undefined,

    getCertSocketTimeout: 10_000,

    externalProxy: undefined,
    externalProxyNoMitm: undefined,
  };

  static new(): NewProxyBuilder {
    return new NewProxyBuilder();
  }

  public port(port: number): NewProxyBuilder {
    this.config.port = port;
    return this;
  }

  public sslMitm(value: SslMitmFn | boolean): NewProxyBuilder {
    this.config.sslMitm = value;
    return this;
  }

  public requestInterceptor(value: RequestInterceptorFn): NewProxyBuilder {
    this.config.requestInterceptor = value;
    return this;
  }

  public responseInterceptor(value: ResponseInterceptorFn): NewProxyBuilder {
    this.config.responseInterceptor = value;
    return this;
  }

  public log(value: boolean | LoggingFn): NewProxyBuilder {
    this.config.log = value;
    return this;
  }

  public metrics(value: StatusFn): NewProxyBuilder {
    this.config.statusFn = value;
    return this;
  }

  public errorLog(value: boolean | ErrorLoggingFn): NewProxyBuilder {
    this.config.errorLog = value;
    return this;
  }

  public ca(caKeyPath: string, caCertPath: string): NewProxyBuilder {
    this.config.caKeyPath = caKeyPath;
    this.config.caCertPath = caCertPath;
    return this;
  }

  public externalProxy(value: ExternalProxyConfig | ExternalProxyFn | undefined): NewProxyBuilder {
    this.config.externalProxy = value;
    return this;
  }

  public externalProxyNoMitm(
    value: ExternalProxyConfig | ExternalProxyNoMitmFn | undefined,
  ): NewProxyBuilder {
    this.config.externalProxyNoMitm = value;
    return this;
  }

  public build(): NewProxy {
    const logger = new Logger(this.config.log, this.config.errorLog);

    // Generate certificate if none
    if (!this.config.caCertPath || !this.config.caKeyPath) {
      const rs = TlsUtils.initCA(caConfig.getDefaultCABasePath());
      this.config.caCertPath = rs.caCertPath;
      this.config.caKeyPath = rs.caKeyPath;

      if (rs.create) {
        logger.log(`CA Cert saved in: ${this.config.caCertPath}`, chalk.cyan);
        logger.log(`CA private key saved in: ${this.config.caKeyPath}`, chalk.cyan);
      }
    }

    return new NewProxy(this.config as ProxyConfig, logger);
  }
}
