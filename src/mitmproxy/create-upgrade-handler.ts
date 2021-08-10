import http from 'http';
import https from 'https';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { CommonUtils } from '../common/common-utils';
import { logError } from '../common/logger';
import { ProxyConfig } from '../types/proxy-config';
import { Context } from '../types/contexts/context';

// create connectHandler function
export function createUpgradeHandler(proxyConfig: ProxyConfig): UpgradeHandlerFn {
  return function upgradeHandler(req, clientSocket, head, ssl): void {
    const context = new Context(req, undefined, false);

    const clientOptions = CommonUtils.getOptionsFromRequest(context, proxyConfig);
    const proxyReq = (ssl ? https : http).request(clientOptions);

    proxyReq.on('error', (error) => {
      logError(error);
    });

    proxyReq.on('response', (res) => {
      // if upgrade event isn't going to happen, close the socket
      // @ts-ignore
      if (!res.upgrade) clientSocket.end();
    });

    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      proxySocket.on('error', (error: Error) => {
        logError(error);
      });

      clientSocket.on('error', () => {
        proxySocket.end();
      });

      proxySocket.setTimeout(0);
      proxySocket.setNoDelay(true);

      proxySocket.setKeepAlive(true, 0);

      if (proxyHead && proxyHead.length > 0) proxySocket.unshift(proxyHead);

      clientSocket.write(
        `${Object.keys(proxyRes.headers)
          // eslint-disable-next-line unicorn/no-reduce
          .reduce(
            (aggregator, key) => {
              const value = proxyRes.headers[key];

              if (!Array.isArray(value)) {
                aggregator.push(`${key}: ${value}`);
                return aggregator;
              }

              for (const element of value) {
                aggregator.push(`${key}: ${element}`);
              }
              return aggregator;
            },
            ['HTTP/1.1 101 Switching Protocols'],
          )
          .join('\r\n')}\r\n\r\n`,
      );

      proxySocket.pipe(clientSocket).pipe(proxySocket);
    });
    proxyReq.end();
  };
}
