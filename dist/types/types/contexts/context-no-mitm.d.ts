/// <reference types="node" />
import http from 'http';
import stream from 'stream';
import { AbstractContext } from './abstract-context';
import { StatusDataNoMitm } from '../status-data-no-mitm';
export declare class ContextNoMitm extends AbstractContext {
    connectRequest: http.IncomingMessage;
    clientSocket: stream.Duplex;
    head: Buffer;
    constructor(connectRequest: http.IncomingMessage, clientSocket: stream.Duplex, head: Buffer);
    getStatusData(): StatusDataNoMitm;
}
