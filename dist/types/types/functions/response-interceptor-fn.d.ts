/// <reference types="node" />
import * as http from 'http';
export declare type ResponseInterceptorFn = (clientReq: http.IncomingMessage, clientRes: http.ServerResponse, proxyReq: http.ClientRequest, proxyRes: http.IncomingMessage, ssl: boolean, next: () => void) => void;
