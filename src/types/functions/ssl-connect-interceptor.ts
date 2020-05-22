import * as http from 'http';
import stream from 'stream';

export type SslConnectInterceptorFn = (
  req: http.IncomingMessage,
  clientSocket: stream.Duplex,
  head: Buffer,
) => boolean;
