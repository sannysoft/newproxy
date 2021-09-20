import * as http from 'http';

export type ResponseInterceptorFn = (
  clientReq: http.IncomingMessage,
  clientRes: http.ServerResponse,
  proxyReq: http.ClientRequest,
  proxyRes: http.IncomingMessage,
  ssl: boolean,
) => Promise<void>;
