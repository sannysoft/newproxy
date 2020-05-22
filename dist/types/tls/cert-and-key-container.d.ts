import { CaPair } from '../types/ca-pair';
export default class CertAndKeyContainer {
    private queue;
    private maxLength;
    private getCertSocketTimeout;
    private caPair;
    constructor(maxLength: number | undefined, getCertSocketTimeout: number | undefined, caPair: CaPair);
    private addCertPromise;
    getCertPromise(hostname: string, port: number): Promise<CaPair>;
    private createNewCertPromise;
    private checkIfWeHaveCertPromise;
    protected reRankCert(index: number): void;
}
