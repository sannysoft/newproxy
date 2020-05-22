/// <reference types="node" />
import { IncomingMessage } from 'http';
import stream from 'stream';
export declare type UpgradeHandlerFn = (req: IncomingMessage, clientSocket: stream.Duplex, head: Buffer, ssl: boolean) => void;
