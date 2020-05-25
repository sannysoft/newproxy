import { Agent, ClientRequest, IncomingMessage, ServerResponse } from 'http';
import * as http from 'http';
import * as https from 'https';
import { CommonUtils, makeErr } from '../common/common-utils';
import { ProxyConfig } from '../types/proxy-config';
import { ExtendedRequestOptions } from '../types/request-options';
import { logError } from '../common/logger';
import connections from '../common/connections';

export class RequestHandler {
  private readonly req: IncomingMessage;

  private readonly res: ServerResponse;

  private readonly ssl: boolean;

  private proxyConfig: ProxyConfig;

  private readonly rOptions: ExtendedRequestOptions;

  private proxyReq?: ClientRequest;

  private proxyRes?: IncomingMessage;

  public constructor(
    req: IncomingMessage,
    res: ServerResponse,
    ssl: boolean,
    proxyConfig: ProxyConfig,
  ) {
    this.req = req;
    this.res = res;
    this.ssl = ssl;
    this.proxyConfig = proxyConfig;

    this.rOptions = CommonUtils.getOptionsFromRequest(req, ssl, proxyConfig.externalProxy, res);
  }

  public async go(): Promise<void> {
    if (this.res.finished) {
      return;
    }

    this.setKeepAlive();

    try {
      await this.interceptRequest();

      if (this.res.finished) {
        return;
      }

      const proxyRequestPromise = this.getProxyRequestPromise();

      // Wait for proxy to process the full request
      this.proxyRes = await proxyRequestPromise;

      if (this.res.finished) {
        return;
      }

      await this.interceptResponse();

      if (this.res.finished) {
        return;
      }

      this.sendHeadersAndPipe();
    } catch (error) {
      if (!this.res.finished) {
        this.res.writeHead(500);
        this.res.write(`Proxy Warning:\r\n\r\n ${error.toString()}`);
        this.res.end();
      }

      logError(error);
    }
  }

  private sendHeadersAndPipe(): void {
    if (this.res.headersSent) return;

    if (!this.proxyRes) makeErr('No proxy res');

    const proxyRes = this.proxyRes;

    // prevent duplicate set headers
    Object.keys(proxyRes.headers).forEach(key => {
      let headerName = key;
      const headerValue = proxyRes.headers[headerName];

      if (headerValue) {
        // https://github.com/nodejitsu/node-http-proxy/issues/362
        if (/^www-authenticate$/i.test(key)) {
          if (proxyRes.headers[headerName]) {
            // @ts-ignore
            proxyRes.headers[headerName] =
              headerValue && typeof headerValue === 'string' && headerValue.split(',');
          }
          headerName = 'www-authenticate';
        }

        this.res.setHeader(headerName, headerValue);
      }
    });

    if (proxyRes.statusCode) this.res.writeHead(proxyRes.statusCode);

    proxyRes.pipe(this.res);
  }

  private getProxyRequestPromise(): Promise<IncomingMessage> {
    const self = this;

    return new Promise((resolve, reject) => {
      this.rOptions.host = this.rOptions.hostname || this.rOptions.host || 'localhost';

      // use the bind socket for NTLM

      if (
        this.rOptions.agent &&
        this.rOptions.agent instanceof Agent &&
        this.rOptions.customSocketId != null &&
        // @ts-ignore
        this.rOptions.agent.getName
      ) {
        // @ts-ignore
        const socketName = this.rOptions.agent.getName(this.rOptions);
        const bindingSocket = this.rOptions.agent.sockets[socketName];
        if (bindingSocket && bindingSocket.length > 0) {
          bindingSocket[0].once('free', onFree);
          return;
        }
      }
      onFree();

      function onFree(): void {
        self.proxyReq = (self.rOptions.protocol === 'https:' ? https : http).request(
          self.rOptions,
          (proxyRes: IncomingMessage) => {
            resolve(proxyRes);
          },
        );

        self.proxyReq.on('timeout', () => {
          reject(new Error(`${self.rOptions.host}:${self.rOptions.port}, request timeout`));
        });

        self.proxyReq.on('error', (e: Error) => {
          reject(e);
        });

        self.proxyReq.on('aborted', () => {
          reject(new Error('proxy server aborted the request'));
          // TODO: Check if it's ok
          // @ts-ignore
          self.req.abort();
        });

        self.req.on('aborted', () => {
          // eslint-disable-next-line no-unused-expressions
          self.proxyReq?.abort();
        });

        self.req.pipe(self.proxyReq);
      }
    });
  }

  private async interceptRequest(): Promise<void> {
    return new Promise((resolve, reject) => {
      const next = (): void => {
        resolve();
      };

      try {
        if (typeof this.proxyConfig.requestInterceptor === 'function') {
          const connectKey = `${this.req.socket.remotePort}:${this.req.socket.localPort}`;
          this.proxyConfig.requestInterceptor.call(
            null,
            this.rOptions,
            this.req,
            this.res,
            this.ssl,
            connections[connectKey],
            next,
          );
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private async interceptResponse(): Promise<void> {
    return new Promise((resolve, reject) => {
      const next = (): void => {
        resolve();
      };
      try {
        if (typeof this.proxyConfig.responseInterceptor === 'function') {
          this.proxyConfig.responseInterceptor.call(
            null,
            this.req,
            this.res,
            this.proxyReq ?? makeErr('No proxyReq'),
            this.proxyRes ?? makeErr('No proxyRes'),
            this.ssl,
            next,
          );
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private setKeepAlive(): void {
    if (this.rOptions.headers?.connection === 'close') {
      this.req.socket.setKeepAlive(false);
    } else if (this.rOptions.customSocketId != null) {
      // for NTLM
      this.req.socket.setKeepAlive(true, 60 * 60 * 1000);
    } else {
      this.req.socket.setKeepAlive(true, 30000);
    }
  }
}
