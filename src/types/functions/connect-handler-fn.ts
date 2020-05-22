import { IncomingMessage } from 'http';
import stream from 'stream';

export type ConnectHandlerFn = (
  req: IncomingMessage,
  clientSocket: stream.Duplex,
  head: Buffer,
) => void;
