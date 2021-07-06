/// <reference types="node" />
import * as http from 'http';
import { ExternalProxyConfigObject } from './external-proxy-config';
export declare class StatusData {
    request: http.IncomingMessage;
    /**
     * If HTTPS was used
     */
    ssl: boolean;
    /**
     * HTTP status code
     */
    statusCode: number;
    /**
     * External proxy config if used
     */
    externalProxy: ExternalProxyConfigObject | undefined;
    /**
     * Request processing rime
     */
    time: number;
    /**
     * Size of request received from client
     */
    requestBytes: number;
    /**
     * Size of response sent to client
     */
    responseBytes: number;
    /**
     * Size of request sent to end-server
     */
    serverRequestBytes: number;
    /**
     * Size of response from end-server
     */
    serverResponseBytes: number;
    constructor(request: http.IncomingMessage, ssl: boolean, status: number, time: number, externalProxy: ExternalProxyConfigObject | undefined, requestBytes: number | undefined, responseBytes: number | undefined, serverRequestBytes: number, serverResponseBytes: number);
}
