import http, { Agent, ClientRequest, IncomingMessage, ServerResponse } from "http";
import https from "https";
import Debug from "debug";
import net from "net";
import { CommonUtils } from "../common/common-utils";
import { ProxyConfig } from "../types/proxy-config";
import { ExtendedRequestOptions } from "../types/request-options";
import { contexts } from "../common/contexts";
import { makeErr } from "../common/util-fns";
import { RequestTimeoutError } from "../errors/request-timeout-error";
import { Context } from "../types/contexts/context";
import { isPresent } from "../types/types";
import { Logger } from "../common/logger";

const internalLogger = Debug('newproxy:requestHandler');

export class RequestHandler {
  private readonly req: IncomingMessage;

  private readonly res: ServerResponse;

  private readonly rOptions: ExtendedRequestOptions;

  private proxyReq?: ClientRequest;

  private proxyRes?: IncomingMessage;

  public constructor(
    private readonly context: Context,
    private readonly proxyConfig: ProxyConfig,
    private readonly logger: Logger,
  ) {
    this.req = context.clientReq;
    this.res = context.clientRes ?? makeErr('No clientResponse set in context');
    this.rOptions = CommonUtils.getOptionsFromRequest(this.context, this.proxyConfig, logger);
  }

  public async go(): Promise<void> {
    internalLogger(
      `Request handler called for request (ssl=${this.context.ssl}) ${this.req.toString()}`,
    );

    if (this.res.writableEnded) {
      return;
    }

    this.setKeepAlive();

    try {
      try {
        await this.interceptRequest();
      } catch (error) {
        this.logger.logError(error, 'Problem at request interception');
        if (!this.res.writableEnded) {
          this.context.setStatusCode(502);
          this.res.writeHead(502);
          this.res.write(`Proxy Warning:\r\n\r\n${error}`);
          this.res.end();
        }
      }

      if (this.res.writableEnded) {
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
        this.logger.logError(error, 'Problem at request processing');
        if (this.res.writableEnded) {
          return;
        }

        if (error instanceof RequestTimeoutError) {
          this.context.setStatusCode(504);
          this.res.writeHead(504);
        } else {
          this.context.setStatusCode(502);
          this.res.writeHead(502);
        }

        this.res.write(`Proxy Error:\r\n\r\n${error}`);
        this.res.end();
      }

      if (this.res.writableEnded) {
        return;
      }

      try {
        await this.interceptResponse();
      } catch (error) {
        this.logger.logError(error, 'Problem with response interception');
        if (!this.res.writableEnded) {
          this.res.writeHead(500);
          this.res.write(`Proxy Warning:\r\n\r\n${error}`);
          this.res.end();
        }
      }

      if (this.res.writableEnded) {
        return;
      }

      this.sendHeadersAndPipe();
    } catch (error) {
      if (!this.res.writableEnded) {
        if (!this.res.headersSent) this.res.writeHead(500);
        this.res.write(`Proxy Warning:\r\n\r\n ${error}`);
        this.res.end();
      }

      this.logger.logError(error);
    }
  }

  private sendHeadersAndPipe(): void {
    if (!this.proxyRes) makeErr('No proxy res');
    const proxyRes = this.proxyRes;

    if (this.res.headersSent) {
      internalLogger('Headers sent already');
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
          internalLogger(`Error sending header: ${error}`);
        }
      });

      if (proxyRes.statusCode) {
        this.res.writeHead(proxyRes.statusCode);
      }
    }

    if (!this.res.finished)
      try {
        internalLogger('Start piping');
        proxyRes.pipe(this.res);
      } catch (error) {
        internalLogger(`Piping error: ${error}`);
      }
  }

  private getProxyRequestPromise(): Promise<IncomingMessage> {
    const self = this;

    return new Promise((resolve, reject) => {
      this.rOptions.host = this.rOptions.hostname || this.rOptions.host || 'localhost';

      // use the bind socket for NTLM

      const onFree = (): void => {
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
          internalLogger(`ProxyRequest timeout for ${self.req.toString()}`);
          reject(new RequestTimeoutError(`${self.rOptions.host}:${self.rOptions.port}`, timeout));
        });

        self.proxyReq.on('error', (e: Error) => {
          internalLogger(`ProxyRequest error: ${e.message}`);
          reject(e);
        });

        self.proxyReq.on('aborted', () => {
          internalLogger(`ProxyRequest aborted for ${self.req.toString()}`);
          reject(new Error('Proxy server aborted the request'));
          // TODO: Check if it's ok
          // @ts-ignore
          self.req.abort();
        });

        self.req.on('aborted', () => {
          internalLogger(`Request aborted ${self.req.toString}`);
          // eslint-disable-next-line no-unused-expressions
          self.proxyReq?.abort();
        });

        self.req.pipe(self.proxyReq);
      };

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
    });
  }

  private async interceptRequest(): Promise<void> {
    if (typeof this.proxyConfig.requestInterceptor === 'function') {
      const connectKey = `${this.req.socket.remotePort}:${this.req.socket.localPort}`;
      await this.proxyConfig.requestInterceptor.call(
        null,
        this.rOptions,
        this.req,
        this.res,
        this.context.ssl,
        contexts[connectKey]?.connectRequest,
      );
    }
  }

  private async interceptResponse(): Promise<void> {
    if (typeof this.proxyConfig.responseInterceptor === 'function') {
      await this.proxyConfig.responseInterceptor.call(
        null,
        this.req,
        this.res,
        this.proxyReq ?? makeErr('No proxyReq'),
        this.proxyRes ?? makeErr('No proxyRes'),
        this.context.ssl,
      );
    }
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
