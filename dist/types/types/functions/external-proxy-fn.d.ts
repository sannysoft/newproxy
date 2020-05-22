/// <reference types="node" />
import { IncomingMessage } from 'http';
import { ExternalProxyConfigOrNull } from '../external-proxy-config';
export declare type ExternalProxyFn = (clientReq: IncomingMessage, ssl: boolean) => ExternalProxyConfigOrNull;
