import { IncomingMessage } from 'http';
import stream from 'stream';

export type UpgradeHandlerFn = (
  req: IncomingMessage,
  clientSocket: stream.Duplex,
  head: Buffer,
  ssl: boolean,
) => void;
