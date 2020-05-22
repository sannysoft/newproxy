/// <reference types="node" />
import * as net from 'net';
export declare type ExtendedNetSocket = net.Socket & {
    connectKey?: string | undefined;
};
