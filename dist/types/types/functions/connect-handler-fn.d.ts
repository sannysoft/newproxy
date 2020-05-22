/// <reference types="node" />
import { IncomingMessage } from 'http';
import stream from 'stream';
export declare type ConnectHandlerFn = (req: IncomingMessage, clientSocket: stream.Duplex, head: Buffer) => void;
