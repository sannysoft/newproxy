import { Agent, ClientRequest, IncomingMessage, ServerResponse } from 'http';
import * as http from 'http';
import * as https from 'https';
import debug from 'debug';
import { CommonUtils, makeErr } from '../common/common-utils';
import { ProxyConfig } from '../types/proxy-config';
import { ExtendedRequestOptions } from '../types/request-options';
import { logError } from '../common/logger';
import connections from '../common/connections';

const logger = debug('newproxy.requestHandler');

export class RequestHandler {
  private readonly req: IncomingMessage;

  private readonly res: ServerResponse;

  private readonly ssl: boolean;

  private proxyConfig: ProxyConfig;

  private rOptions: ExtendedRequestOptions;

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
    this.rOptions = CommonUtils.getOptionsFromRequest(
      this.req,
      this.ssl,
      this.proxyConfig.externalProxy,
      this.res,
    );
  }

  public async go(): Promise<void> {
    logger(`Request handler called for request (ssl=${this.ssl}) ${this.req.toString()}`);

    if (this.res.finished) {
      return;
    }

    this.setKeepAlive();

    try {
      try {
        await this.interceptRequest();
      } catch (error) {
        logError(error, 'Problem at request interception');
        if (!this.res.finished) {
          this.res.writeHead(500);
          this.res.write(`Proxy Warning:\r\n\r\n${error.toString()}`);
          this.res.end();
        }
      }

      if (this.res.finished) {
        return;
      }

      const proxyRequestPromise = this.getProxyRequestPromise();

      // Wait for proxy to process the full request
      this.proxyRes = await proxyRequestPromise;

      if (this.res.finished) {
        return;
      }

      try {
        await this.interceptResponse();
      } catch (error) {
        logError(error, 'Problem with response interception');
        if (!this.res.finished) {
          this.res.writeHead(500);
          this.res.write(`Proxy Warning:\r\n\r\n${error.toString()}`);
          this.res.end();
        }
      }

      if (this.res.finished) {
        return;
      }

      this.sendHeadersAndPipe();
    } catch (error) {
      if (!this.res.finished) {
        if (!this.res.headersSent) this.res.writeHead(500);
        this.res.write(`Proxy Warning:\r\n\r\n ${error.toString()}`);
        this.res.end();
      }

      logError(error);
    }
  }

  private sendHeadersAndPipe(): void {
    if (!this.proxyRes) makeErr('No proxy res');
    const proxyRes = this.proxyRes;

    if (this.res.headersSent) {
      logger('Headers sent already');
    } else {
      // prevent duplicate set headers
      Object.keys(proxyRes.headers).forEach(key => {
        try {
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
        } catch (error) {
          logger(`Error sending header${error}`);
        }
      });

      if (proxyRes.statusCode) {
        this.res.writeHead(proxyRes.statusCode);
      }
    }

    if (!this.res.finished)
      try {
        logger('Start piping');
        proxyRes.pipe(this.res);
      } catch (error) {
        logger(`Piping error: ${error.message}`);
      }
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
        logger(`Request started with agent ${this.req.toString}`);
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
          logger(`ProxyRequest timeout ${self.req.toString}`);
          reject(new Error(`${self.rOptions.host}:${self.rOptions.port}, request timeout`));
        });

        self.proxyReq.on('error', (e: Error) => {
          logger(`error timeout ${self.req.toString}`);
          reject(e);
        });

        self.proxyReq.on('aborted', () => {
          logger(`ProxyRequest aborted ${self.req.toString}`);
          reject(new Error('proxy server aborted the request'));
          // TODO: Check if it's ok
          // @ts-ignore
          self.req.abort();
        });

        self.req.on('aborted', () => {
          logger(`Request aborted ${self.req.toString}`);
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
