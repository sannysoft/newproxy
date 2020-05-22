/// <reference types="node" />
import forge from 'node-forge';
import * as https from 'https';
export interface ServerObject {
    cert: forge.pki.Certificate;
    key: forge.pki.PrivateKey;
    server: https.Server;
    port: number;
}
