import { CaPair } from '../types/ca-pair';
import { Logger } from '../common/logger';
export declare class CertAndKeyContainer {
    private logger;
    private queue;
    private readonly maxLength;
    private readonly getCertSocketTimeout;
    private readonly caPair;
    constructor(maxLength: number | undefined, getCertSocketTimeout: number | undefined, caPair: CaPair, logger: Logger);
    private addCertPromise;
    getCertPromise(hostname: string, port: number): Promise<CaPair>;
    private createNewCertPromise;
    private checkIfWeHaveCertPromise;
    protected reRankCert(index: number): void;
}
