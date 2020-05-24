import { IncomingMessage, ServerResponse } from 'http';
import { ExternalProxyConfigOrNull } from '../external-proxy-config';

export type ExternalProxyFn = (
  clientReq: IncomingMessage,
  ssl: boolean,
  clientRes?: ServerResponse | undefined,
) => ExternalProxyConfigOrNull;
