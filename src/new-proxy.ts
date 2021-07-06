import * as http from 'http';
import * as stream from 'stream';
import * as chalk from 'chalk';
import { promisify } from 'util';
import { ProxyConfig, UserProxyConfig } from './types/proxy-config';
import { TlsUtils } from './tls/tls-utils';
import { createUpgradeHandler } from './mitmproxy/create-upgrade-handler';
import { createFakeServerCenter } from './mitmproxy/create-fake-server-center';
import { createConnectHandler } from './mitmproxy/create-connect-handler';
import { createRequestHandler } from './mitmproxy/create-request-handler';
import { caConfig } from './common/ca-config';
import { log, logError, setErrorLoggerConfig, setLoggerConfig } from './common/logger';
import { SslMitmFn } from './types/functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './types/functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './types/functions/response-interceptor-fn';
import { ExternalProxyFn, ExternalProxyNoMitmFn } from './types/functions/external-proxy-fn';
import { LoggingFn } from './types/functions/log-fn';
import { RequestHandlerFn } from './types/functions/request-handler-fn';
import { UpgradeHandlerFn } from './types/functions/upgrade-handler-fn';
import { ConnectHandlerFn } from './types/functions/connect-handler-fn';
import { FakeServersCenter } from './tls/fake-servers-center';
import { ErrorLoggingFn } from './types/functions/error-logging-fn';
import { ExternalProxyConfig } from './types/external-proxy-config';
import { makeErr } from './common/util-fns';
import { StatusFn } from './types/functions/status-fn';
import { Context } from './types/contexts/context';
import { ContextNoMitm } from './types/contexts/context-no-mitm';
import { Socket } from 'net';

// eslint-disable-next-line import/no-default-export
export default class NewProxy {
  protected proxyConfig: ProxyConfig;

  public httpServer: http.Server;

  private requestHandler?: RequestHandlerFn;

  private upgradeHandler?: UpgradeHandlerFn;

  private fakeServersCenter?: FakeServersCenter;

  private connectHandler?: ConnectHandlerFn;

  private serverSockets = new Set<Socket>();

  public constructor(userProxyConfig: UserProxyConfig = {}) {
    this.proxyConfig = NewProxy.setDefaultsForConfig(userProxyConfig);
    this.httpServer = new http.Server();
  }

  public port(port: number): NewProxy {
    this.proxyConfig.port = port;
    return this;
  }

  public sslMitm(value: SslMitmFn | boolean): NewProxy {
    this.proxyConfig.sslMitm = value;
    return this;
  }

  public requestInterceptor(value: RequestInterceptorFn): NewProxy {
    this.proxyConfig.requestInterceptor = value;
    return this;
  }

  public responseInterceptor(value: ResponseInterceptorFn): NewProxy {
    this.proxyConfig.responseInterceptor = value;
    return this;
  }

  public log(value: boolean | LoggingFn): NewProxy {
    this.proxyConfig.log = value;
    return this;
  }

  public metrics(value: StatusFn): NewProxy {
    this.proxyConfig.statusFn = value;
    return this;
  }

  public errorLog(value: boolean | ErrorLoggingFn): NewProxy {
    this.proxyConfig.errorLog = value;
    return this;
  }

  public ca(caKeyPath: string, caCertPath: string): NewProxy {
    this.proxyConfig.caKeyPath = caKeyPath;
    this.proxyConfig.caCertPath = caCertPath;
    return this;
  }

  public externalProxy(value: ExternalProxyConfig | ExternalProxyFn | undefined): NewProxy {
    this.proxyConfig.externalProxy = value;
    return this;
  }

  public externalProxyNoMitm(
    value: ExternalProxyConfig | ExternalProxyNoMitmFn | undefined,
  ): NewProxy {
    this.proxyConfig.externalProxyNoMitm = value;
    return this;
  }

  private static setDefaultsForConfig(userConfig: UserProxyConfig): ProxyConfig {
    let { caCertPath, caKeyPath } = userConfig;

    if (!userConfig.caCertPath || !userConfig.caKeyPath) {
      const rs = TlsUtils.initCA(caConfig.getDefaultCABasePath());
      caCertPath = rs.caCertPath;
      caKeyPath = rs.caKeyPath;

      if (rs.create) {
        log(`CA Cert saved in: ${caCertPath}`, chalk.cyan);
        log(`CA private key saved in: ${caKeyPath}`, chalk.cyan);
      }
    }

    return {
      port: userConfig.port || 6789,

      log: userConfig.log || true,
      errorLog: userConfig.errorLog || true,

      statusFn: userConfig.statusFn || undefined,
      statusNoMitmFn: userConfig.statusNoMitmFn || undefined,

      sslMitm: userConfig.sslMitm || undefined,
      requestInterceptor: userConfig.requestInterceptor || undefined,
      responseInterceptor: userConfig.responseInterceptor || undefined,

      getCertSocketTimeout: userConfig.getCertSocketTimeout || 10000,

      externalProxy: userConfig.externalProxy || undefined,
      externalProxyNoMitm: userConfig.externalProxyNoMitm || undefined,

      caCertPath: caCertPath ?? makeErr('No caCertPath'),
      caKeyPath: caKeyPath ?? makeErr('No caKeyPath'),
    };
  }

  public setup(): void {
    this.proxyConfig = NewProxy.setDefaultsForConfig(this.proxyConfig);

    setLoggerConfig(this.proxyConfig.log);
    setErrorLoggerConfig(this.proxyConfig.errorLog);

    this.requestHandler = createRequestHandler(this.proxyConfig);
    this.upgradeHandler = createUpgradeHandler(this.proxyConfig);

    this.fakeServersCenter = createFakeServerCenter(
      this.proxyConfig,
      this.requestHandler,
      this.upgradeHandler,
    );

    this.connectHandler = createConnectHandler(this.proxyConfig, this.fakeServersCenter);
  }

  public run(): Promise<void> {
    // Don't reject unauthorized
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    this.setup();

    return new Promise((resolve, reject) => {
      this.httpServer.once('error', (error: Error) => {
        reject(error);
      });
      this.httpServer.listen(this.proxyConfig.port, () => {
        log(`NewProxy is listening on port ${this.proxyConfig.port}`, chalk.green);
        this.httpServer.on('error', (e: Error) => {
          logError(e);
        });

        this.httpServer.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
          // Plain HTTP request
          const context = new Context(req, res, false);
          this.requestHandler!(context);
        });

        // tunneling for https
        this.httpServer.on(
          'connect',
          (connectRequest: http.IncomingMessage, clientSocket: stream.Duplex, head: Buffer) => {
            clientSocket.on('error', () => {});
            const context = new ContextNoMitm(connectRequest, clientSocket, head);
            this.connectHandler!(context);
          },
        );

        this.httpServer.on('connection', (socket: Socket) => {
          this.serverSockets.add(socket);
          socket.on('close', () => {
            this.serverSockets.delete(socket);
          });
        });

        // TODO: handle WebSocket
        this.httpServer.on(
          'upgrade',
          (req: http.IncomingMessage, socket: stream.Duplex, head: Buffer) => {
            const ssl = false;
            this.upgradeHandler!(req, socket, head, ssl);
          },
        );
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    // Destroy all open sockets first
    this.serverSockets.forEach((socket) => {
      socket.destroy();
    });
    this.serverSockets = new Set();
    return promisify(this.httpServer.close).call(this.httpServer);
  }
}
