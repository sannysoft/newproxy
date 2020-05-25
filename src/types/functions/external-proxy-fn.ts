import { IncomingMessage, ServerResponse } from 'http';
import stream from 'stream';
import { ExternalProxyConfigOrNull } from '../external-proxy-config';

export type ExternalProxyFn = (
  clientReq: IncomingMessage,
  ssl: boolean,
  clientRes: ServerResponse | undefined,
  connectRequest: IncomingMessage | undefined,
) => ExternalProxyConfigOrNull;

export type ExternalProxyNoMitmFn = (
  connectRequest: IncomingMessage,
  clientSocket: stream.Duplex,
) => ExternalProxyConfigOrNull;
