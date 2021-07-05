import { Agent, ClientRequest, IncomingMessage, ServerResponse } from 'http';
import * as http from 'http';
import * as https from 'https';
import * as Debug from 'debug';
import * as net from 'net';
import { CommonUtils } from '../common/common-utils';
import { ProxyConfig } from '../types/proxy-config';
import { ExtendedRequestOptions } from '../types/request-options';
import { logError } from '../common/logger';
import { contexts } from '../common/contexts';
import { makeErr } from '../common/util-fns';
import { RequestTimeoutError } from '../errors/request-timeout-error';
import { Context } from '../types/contexts/context';
import { isPresent } from '../types/types';

const logger = Debug('newproxy.requestHandler');

export class RequestHandler {
  private readonly req: IncomingMessage;

  private readonly res: ServerResponse;

  private readonly rOptions: ExtendedRequestOptions;

  private proxyReq?: ClientRequest;

  private proxyRes?: IncomingMessage;

  public constructor(private readonly context: Context, private readonly proxyConfig: ProxyConfig) {
    this.req = context.clientReq;
    this.res = context.clientRes ?? makeErr('No clientResponse set in context');
    this.rOptions = CommonUtils.getOptionsFromRequest(this.context, this.proxyConfig);
  }

  public async go(): Promise<void> {
    logger(`Request handler called for request (ssl=${this.context.ssl}) ${this.req.toString()}`);

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
          this.context.setStatusCode(502);
          this.res.writeHead(502);
          this.res.write(`Proxy Warning:\r\n\r\n${error.toString()}`);
          this.res.end();
        }
      }

      if (this.res.finished) {
        return;
      }

      try {
        const proxyRequestPromise = this.getProxyRequestPromise();
        this.proxyRes = await proxyRequestPromise;
        this.context.setStatusCode(
          this.proxyRes?.statusCode,
          this.proxyRes.socket.bytesWritten,
          this.proxyRes.socket.bytesRead,
        );
      } catch (error) {
        logError(error, 'Problem at request processing');
        if (this.res.finished) {
          return;
        }

        if (error instanceof RequestTimeoutError) {
          this.context.setStatusCode(504);
          this.res.writeHead(504);
        } else {
          this.context.setStatusCode(502);
          this.res.writeHead(502);
        }

        this.res.write(`Proxy Error:\r\n\r\n${error.toString()}`);
        this.res.end();
      }

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
      Object.keys(proxyRes.headers).forEach((key) => {
        try {
          let headerName = key;
          const headerValue = proxyRes.headers[headerName];

          if (headerValue) {
            // https://github.com/nodejitsu/node-http-proxy/issues/362
            if (/^www-authenticate$/i.test(headerName)) {
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
        isPresent(this.rOptions.customSocketId) &&
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

        const timeout = self.rOptions.timeout || 60000;

        self.proxyReq.on('socket', (socket: net.Socket) => {
          socket.setTimeout(timeout, () => {});
        });

        self.proxyReq.setSocketKeepAlive(true, 5000);
        self.proxyReq.setTimeout(timeout, () => {});

        self.proxyReq.on('timeout', () => {
          logger(`ProxyRequest timeout for ${self.req.toString()}`);
          reject(new RequestTimeoutError(`${self.rOptions.host}:${self.rOptions.port}`, timeout));
        });

        self.proxyReq.on('error', (e: Error) => {
          logger(`ProxyRequest error: ${e.message}`);
          reject(e);
        });

        self.proxyReq.on('aborted', () => {
          logger(`ProxyRequest aborted for ${self.req.toString()}`);
          reject(new Error('Proxy server aborted the request'));
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
            this.context.ssl,
            contexts[connectKey]?.connectRequest,
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
            this.context.ssl,
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
