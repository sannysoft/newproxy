/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
export declare type RequestHandlerFn = (req: IncomingMessage, res: ServerResponse, ssl: boolean) => void;
