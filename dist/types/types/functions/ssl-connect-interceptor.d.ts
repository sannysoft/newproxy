/// <reference types="node" />
import * as http from 'http';
import stream from 'stream';
export declare type SslMitmFn = (req: http.IncomingMessage, clientSocket: stream.Duplex, head: Buffer) => boolean;
