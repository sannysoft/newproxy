import { CaPair } from './ca-pair';

export interface CertPromise {
  mappingHostNames: string[];
  promise: Promise<CaPair>;
}
