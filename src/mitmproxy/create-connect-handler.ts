import * as url from 'url';
import * as net from 'net';
import { IncomingMessage } from 'http';
import stream from 'stream';
import { SslConnectInterceptorFn } from '../types/functions/ssl-connect-interceptor';
import { FakeServersCenter } from '../tls/fake-servers-center';
import connections from '../common/connections';
import { ExtendedNetSocket } from '../types/extended-net-socket';
import { makeErr } from '../common/common-utils';
import { ConnectHandlerFn } from '../types/functions/connect-handler-fn';
import { ServerObject } from '../types/server-object';
import { logError } from '../common/logger';

const localIP = '127.0.0.1';

export function createConnectHandler(
  sslConnectInterceptor: SslConnectInterceptorFn | boolean | undefined,
  fakeServerCenter: FakeServersCenter,
): ConnectHandlerFn {
  // return
  return function connectHandler(req: IncomingMessage, clientSocket: stream.Duplex, head: Buffer) {
    const srvUrl = url.parse(`https://${req.url}`);

    const interceptSsl =
      (typeof sslConnectInterceptor === 'function' &&
        sslConnectInterceptor.call(null, req, clientSocket, head)) ||
      sslConnectInterceptor === true;

    if (!clientSocket.writable) return;

    const serverHostname = srvUrl.hostname ?? makeErr('No hostname set for https request');
    const serverPort = Number(srvUrl.port || 443);

    if (!interceptSsl) {
      connect(req, clientSocket, head, serverHostname, serverPort);
      return;
    }

    (async () => {
      try {
        const serverObject: ServerObject = await fakeServerCenter.getServerPromise(
          serverHostname,
          serverPort,
        );

        connect(req, clientSocket, head, localIP, serverObject.port);
      } catch (error) {
        logError(error);
      }
    })();
  };
}

function connect(
  req: IncomingMessage,
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

  proxySocket.on('error', (e: Error) => {
    logError(e);
  });

  proxySocket.on('ready', () => {
    proxySocket.connectKey = `${proxySocket.localPort}:${proxySocket.remotePort}`;
    connections[proxySocket.connectKey] = req;
  });

  proxySocket.on('end', () => {
    if (proxySocket.connectKey) delete connections[proxySocket.connectKey];
  });

  return proxySocket;
}
