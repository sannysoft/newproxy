import * as url from 'url';
import * as net from 'net';
import { IncomingMessage } from 'http';
import stream from 'stream';
import { FakeServersCenter } from '../tls/fake-servers-center';
import connections from '../common/connections';
import { ExtendedNetSocket } from '../types/extended-net-socket';
import { ConnectHandlerFn } from '../types/functions/connect-handler-fn';
import { ServerObject } from '../types/server-object';
import { logError } from '../common/logger';
import { ProxyConfig } from '../types/proxy-config';
import { ExternalProxyHelper, ExternalProxyConfigOrNull } from '../types/external-proxy-config';
import { makeErr } from '../common/util-fns';

const localIP = '127.0.0.1';

export function createConnectHandler(
  proxyConfig: ProxyConfig,
  fakeServerCenter: FakeServersCenter,
): ConnectHandlerFn {
  // return
  return function connectHandler(
    connectRequest: IncomingMessage,
    clientSocket: stream.Duplex,
    head: Buffer,
  ) {
    const srvUrl = url.parse(`https://${connectRequest.url}`);

    let interceptSsl = false;
    try {
      interceptSsl =
        (typeof proxyConfig.sslMitm === 'function' &&
          proxyConfig.sslMitm.call(null, connectRequest, clientSocket, head)) ||
        proxyConfig.sslMitm === true;
    } catch (error) {
      logError(error, 'Error at sslMitm function');
    }

    if (!clientSocket.writable) return;

    const serverHostname = srvUrl.hostname ?? makeErr('No hostname set for https request');
    const serverPort = Number(srvUrl.port || 443);

    if (!interceptSsl) {
      let externalProxy: ExternalProxyConfigOrNull | string;
      if (
        proxyConfig.externalProxyNoMitm &&
        typeof proxyConfig.externalProxyNoMitm === 'function'
      ) {
        externalProxy = proxyConfig.externalProxyNoMitm(connectRequest, clientSocket);
      } else externalProxy = proxyConfig.externalProxyNoMitm;

      if (externalProxy) {
        connectNoMitmExternalProxy(
          new ExternalProxyHelper(externalProxy),
          connectRequest,
          clientSocket,
          head,
          serverHostname,
          serverPort,
        );
        return;
      }

      connect(connectRequest, clientSocket, head, serverHostname, serverPort);
      return;
    }

    (async () => {
      try {
        const serverObject: ServerObject = await fakeServerCenter.getServerPromise(
          serverHostname,
          serverPort,
        );

        connect(connectRequest, clientSocket, head, localIP, serverObject.port);
      } catch (error) {
        logError(error);
      }
    })();
  };
}

function connect(
  connectRequest: IncomingMessage,
  clientSocket: stream.Duplex,
  head: Buffer,
  hostname: string,
  port: number,
): ExtendedNetSocket {
  // tunneling https
  const proxySocket: ExtendedNetSocket = net.connect(port, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    proxySocket.write(head);
    proxySocket.pipe(clientSocket);

    clientSocket.pipe(proxySocket);
  });

  proxySocket.on('error', () => {
    // logError(e);
  });

  proxySocket.on('ready', () => {
    proxySocket.connectKey = `${proxySocket.localPort}:${proxySocket.remotePort}`;
    connections[proxySocket.connectKey] = connectRequest;
  });

  proxySocket.on('end', () => {
    if (proxySocket.connectKey) delete connections[proxySocket.connectKey];
  });

  return proxySocket;
}

function connectNoMitmExternalProxy(
  proxyHelper: ExternalProxyHelper,
  connectRequest: IncomingMessage,
  clientSocket: stream.Duplex,
  head: Buffer,
  hostname: string,
  port: number,
): ExtendedNetSocket {
  const proxySocket: ExtendedNetSocket = net.connect(
    Number(proxyHelper.getUrlObject().port!!),
    proxyHelper.getUrlObject().hostname!!,
    () => {
      proxySocket.write(`CONNECT ${hostname}:${port} HTTP/${connectRequest.httpVersion}\r\n`);
      ['host', 'user-agent', 'proxy-connection'].forEach(name => {
        if (name in connectRequest.headers) {
          proxySocket.write(`${name}: ${connectRequest.headers[name]}\r\n`);
        }
      });

      const proxyAuth = proxyHelper.getLoginAndPassword();
      if (proxyAuth) {
        const basicAuth = Buffer.from(proxyAuth).toString('base64');
        proxySocket.write(`Proxy-Authorization: Basic ${basicAuth}\r\n`);
      }

      proxySocket.write('\r\n');

      proxySocket.pipe(clientSocket);

      clientSocket.pipe(proxySocket);
    },
  );

  proxySocket.on('error', (e: Error) => {
    logError(e);
  });

  return proxySocket;
}
