/// <reference types="node" />
import * as http from 'http';
import { RequestOptions } from '../request-options';
export declare type RequestInterceptorFn = (requestOptions: RequestOptions, clientReq: http.IncomingMessage, clientRes: http.ServerResponse, ssl: boolean, connectRequest: http.IncomingMessage | undefined, next: () => void) => void;
