/// <reference types="node" />
import http from 'http';
import { StatusData } from '../status-data';
import { AbstractContext } from './abstract-context';
export declare class Context extends AbstractContext {
    clientReq: http.IncomingMessage;
    clientRes: http.ServerResponse | undefined;
    ssl: boolean;
    protected status_code: number | undefined;
    protected status_requestedFromServerBytes: number;
    protected status_serverRespondedBytes: number;
    constructor(clientReq: http.IncomingMessage, clientRes: http.ServerResponse | undefined, ssl: boolean);
    getStatusData(): StatusData;
    setStatusCode(statusCode: number | null | undefined, requestBytes?: number, responseBytes?: number): void;
}
