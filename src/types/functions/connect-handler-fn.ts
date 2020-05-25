import { IncomingMessage } from 'http';
import stream from 'stream';

export type ConnectHandlerFn = (
  connectRequest: IncomingMessage,
  clientSocket: stream.Duplex,
  head: Buffer,
) => void;
