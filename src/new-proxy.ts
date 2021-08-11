import * as http from 'http';
import * as stream from 'stream';
import * as chalk from 'chalk';
import { Socket } from 'net';
import { ProxyConfig } from './types/proxy-config';
import { createUpgradeHandler } from './mitmproxy/create-upgrade-handler';
import { createConnectHandler } from './mitmproxy/create-connect-handler';
import { createRequestHandler } from './mitmproxy/create-request-handler';
import { RequestHandlerFn } from './types/functions/request-handler-fn';
import { UpgradeHandlerFn } from './types/functions/upgrade-handler-fn';
import { ConnectHandlerFn } from './types/functions/connect-handler-fn';
import { FakeServersCenter } from './tls/fake-servers-center';
import { Context } from './types/contexts/context';
import { ContextNoMitm } from './types/contexts/context-no-mitm';
import { Logger } from './common/logger';
import { ExtendedNetSocket } from './types/extended-net-socket';

export class NewProxy {
  public readonly httpServer: http.Server = new http.Server();

  // handlers

  private readonly requestHandler: RequestHandlerFn;

  private readonly upgradeHandler: UpgradeHandlerFn;

  private readonly connectHandler: ConnectHandlerFn;

  private serverSockets = new Set<Socket>();

  private clientSockets = new Set<ExtendedNetSocket>();

  private _fakeServersCenter?: FakeServersCenter;

  public constructor(private readonly proxyConfig: ProxyConfig, private readonly logger: Logger) {
    this.requestHandler = createRequestHandler(this.proxyConfig, logger);
    this.upgradeHandler = createUpgradeHandler(this.proxyConfig, logger);

    this.connectHandler = createConnectHandler(
      this.proxyConfig,
      this.fakeServersCenter,
      this.logger,
      this.clientSockets,
    );
  }

  get fakeServersCenter(): FakeServersCenter {
    if (!this._fakeServersCenter) {
      this._fakeServersCenter = new FakeServersCenter(
        this.proxyConfig,
        this.requestHandler,
        this.upgradeHandler,
        this.logger,
      );
    }

    return this._fakeServersCenter;
  }

  public run(): Promise<void> {
    // Don't reject unauthorized
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    return new Promise((resolve, reject) => {
      this.httpServer.once('error', (error: Error) => {
        reject(error);
      });
      this.httpServer.listen(this.proxyConfig.port, () => {
        this.logger.log(`NewProxy is listening on port ${this.proxyConfig.port}`, chalk.green);

        this.httpServer.on('error', (e: Error) => {
          this.logger.logError(e);
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

  public async stop(): Promise<void> {
    // Destroy all open sockets first
    this.serverSockets.forEach((socket) => {
      socket.destroy();
    });
    this.clientSockets.forEach((socket) => {
      socket.destroy();
    });
    this.serverSockets = new Set();
    this.clientSockets = new Set();

    const promise: Promise<any> = this.fakeServersCenter?.close() ?? Promise.resolve();
    await Promise.all([this.closeServer(), promise]);
  }

  private closeServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer.close((err) => {
        if (err) reject(err);

        resolve();
      });
    });
  }
}
