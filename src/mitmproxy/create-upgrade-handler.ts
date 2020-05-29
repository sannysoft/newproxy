import http from 'http';
import https from 'https';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { CommonUtils } from '../common/common-utils';
import { logError } from '../common/logger';
import { ProxyConfig } from '../types/proxy-config';

// create connectHandler function
export function createUpgradeHandler(proxyConfig: ProxyConfig): UpgradeHandlerFn {
  return async function upgradeHandler(req, clientSocket, head, ssl) {
    const clientOptions = await CommonUtils.getOptionsFromRequest(
      req,
      ssl,
      proxyConfig.externalProxy,
      undefined,
    );
    const proxyReq = (ssl ? https : http).request(clientOptions);

    proxyReq.on('error', error => {
      logError(error);
    });

    proxyReq.on('response', res => {
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
          .reduce(
            (aggregator, key) => {
              const value = proxyRes.headers[key];

              if (!Array.isArray(value)) {
                aggregator.push(`${key}: ${value}`);
                return aggregator;
              }

              for (let i = 0; i < value.length; i++) {
                aggregator.push(`${key}: ${value[i]}`);
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
