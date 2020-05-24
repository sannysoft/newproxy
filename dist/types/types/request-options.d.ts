/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
export interface RequestOptions {
    protocol: string;
    hostname: string;
    method: string;
    port: number;
    path: string;
    headers: IncomingHttpHeaders;
    agent: any;
    customSocketId?: number | undefined;
    host?: string | undefined;
    url: string;
}
