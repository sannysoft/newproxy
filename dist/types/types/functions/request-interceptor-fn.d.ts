/// <reference types="node" />
import * as http from 'http';
import { ExtendedRequestOptions } from '../request-options';
export declare type RequestInterceptorFn = (requestOptions: ExtendedRequestOptions, clientReq: http.IncomingMessage, clientRes: http.ServerResponse, ssl: boolean, connectRequest: http.IncomingMessage | undefined, next: () => void) => void;
