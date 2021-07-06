/// <reference types="node" />
import * as http from 'http';
import { ExternalProxyConfigObject } from './external-proxy-config';
export declare class StatusDataNoMitm {
    connectRequest: http.IncomingMessage;
    externalProxy: ExternalProxyConfigObject | undefined;
    time: number;
    constructor(connectRequest: http.IncomingMessage, externalProxy: ExternalProxyConfigObject | undefined, time: number);
}
