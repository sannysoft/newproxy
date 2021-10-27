import http from 'http';
import stream from 'stream';

export type SslMitmFn = (
  req: http.IncomingMessage,
  clientSocket: stream.Duplex,
  head: Buffer,
) => boolean;
