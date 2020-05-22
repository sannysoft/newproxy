/// <reference types="node" />
import { IncomingMessage } from 'http';
declare const connections: {
    [key: string]: IncomingMessage;
};
export default connections;
