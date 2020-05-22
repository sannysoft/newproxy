import { IncomingMessage, ServerResponse } from 'http';

export type RequestHandlerFn = (
  req: IncomingMessage,
  res: ServerResponse,
  ssl: boolean,
) => void;
