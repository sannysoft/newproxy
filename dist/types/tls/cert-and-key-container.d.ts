import { CaPair } from '../types/ca-pair';
export declare class CertAndKeyContainer {
    private queue;
    private readonly maxLength;
    private readonly getCertSocketTimeout;
    private readonly caPair;
    constructor(maxLength: number | undefined, getCertSocketTimeout: number | undefined, caPair: CaPair);
    private addCertPromise;
    getCertPromise(hostname: string, port: number): Promise<CaPair>;
    private createNewCertPromise;
    private checkIfWeHaveCertPromise;
    protected reRankCert(index: number): void;
}
