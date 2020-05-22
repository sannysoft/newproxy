import { IncomingMessage } from 'http';
import { ExternalProxyConfigOrNull } from '../external-proxy-config';

export type ExternalProxyFn = (
  clientReq: IncomingMessage,
  ssl: boolean,
) => ExternalProxyConfigOrNull;
