import * as url from 'url';
import * as net from 'net';
import { FakeServersCenter } from '../tls/fake-servers-center';
import { contexts } from '../common/contexts';
import { ExtendedNetSocket } from '../types/extended-net-socket';
import { ConnectHandlerFn } from '../types/functions/connect-handler-fn';
import { ServerObject } from '../types/server-object';
import { logError } from '../common/logger';
import { ProxyConfig } from '../types/proxy-config';
import { ExternalProxyHelper, ExternalProxyConfigOrNull } from '../types/external-proxy-config';
import { makeErr } from '../common/util-fns';
import { ContextNoMitm } from '../types/contexts/context-no-mitm';

const localIP = '127.0.0.1';

export function createConnectHandler(
  proxyConfig: ProxyConfig,
  fakeServerCenter: FakeServersCenter,
): ConnectHandlerFn {
  // return
  return function connectHandler(context: ContextNoMitm) {
    const srvUrl = url.parse(`https://${context.connectRequest.url}`);

    let interceptSsl = false;
    try {
      interceptSsl =
        (typeof proxyConfig.sslMitm === 'function' &&
          proxyConfig.sslMitm.call(
            null,
            context.connectRequest,
            context.clientSocket,
            context.head,
          )) ||
        proxyConfig.sslMitm === true;
    } catch (error) {
      logError(error, 'Error at sslMitm function');
    }

    if (!context.clientSocket.writable) return;

    const serverHostname = srvUrl.hostname ?? makeErr('No hostname set for https request');
    const serverPort = Number(srvUrl.port || 443);

    if (!interceptSsl) {
      const externalProxy: ExternalProxyConfigOrNull | string =
        proxyConfig.externalProxyNoMitm && typeof proxyConfig.externalProxyNoMitm === 'function'
          ? proxyConfig.externalProxyNoMitm(context.connectRequest, context.clientSocket)
          : proxyConfig.externalProxyNoMitm;

      context.markStart();
      context.clientSocket.on('close', () => {
        if (proxyConfig.statusNoMitmFn) {
          const statusData = context.getStatusData();
          proxyConfig.statusNoMitmFn(statusData);
        }
      });

      if (externalProxy) {
        connectNoMitmExternalProxy(
          new ExternalProxyHelper(externalProxy),
          context,
          serverHostname,
          serverPort,
        );
        return;
      }

      connect(context, serverHostname, serverPort);
      return;
    }

    (async () => {
      try {
        const serverObject: ServerObject = await fakeServerCenter.getServerPromise(
          serverHostname,
          serverPort,
        );

        connect(context, localIP, serverObject.port);
      } catch (error) {
        logError(error);
      }
    })();
  };
}

function connect(context: ContextNoMitm, hostname: string, port: number): ExtendedNetSocket {
  // tunneling https
  const proxySocket: ExtendedNetSocket = net.connect(port, hostname, () => {
    context.clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    proxySocket.write(context.head);
    proxySocket.pipe(context.clientSocket);

    context.clientSocket.pipe(proxySocket);
  });

  proxySocket.on('error', () => {
    // logError(e);
  });

  proxySocket.on('ready', () => {
    proxySocket.connectKey = `${proxySocket.localPort}:${proxySocket.remotePort}`;
    contexts[proxySocket.connectKey] = context;
  });

  proxySocket.on('end', () => {
    if (proxySocket.connectKey) delete contexts[proxySocket.connectKey];
  });

  return proxySocket;
}

function connectNoMitmExternalProxy(
  proxyHelper: ExternalProxyHelper,
  context: ContextNoMitm,
  hostname: string,
  port: number,
): ExtendedNetSocket {
  const proxySocket: ExtendedNetSocket = net.connect(
    Number(proxyHelper.getUrlObject().port!!),
    proxyHelper.getUrlObject().hostname!!,
    () => {
      proxySocket.write(
        `CONNECT ${hostname}:${port} HTTP/${context.connectRequest.httpVersion}\r\n`,
      );
      ['host', 'user-agent', 'proxy-connection'].forEach((name) => {
        if (name in context.connectRequest.headers) {
          proxySocket.write(`${name}: ${context.connectRequest.headers[name]}\r\n`);
        }
      });

      const proxyAuth = proxyHelper.getLoginAndPassword();
      if (proxyAuth) {
        const basicAuth = Buffer.from(proxyAuth).toString('base64');
        proxySocket.write(`Proxy-Authorization: Basic ${basicAuth}\r\n`);
      }

      proxySocket.write('\r\n');

      proxySocket.pipe(context.clientSocket);

      context.clientSocket.pipe(proxySocket);
    },
  );

  proxySocket.on('error', (e: Error) => {
    logError(e);
  });

  return proxySocket;
}
