import * as forge from 'node-forge';
export interface CaPair {
    key: forge.pki.PrivateKey;
    cert: forge.pki.Certificate;
}
