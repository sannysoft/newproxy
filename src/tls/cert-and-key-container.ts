import * as http from 'http';
import * as https from 'https';
import { PeerCertificate, TLSSocket } from 'tls';
import TlsUtils from './tls-utils';
import { CaPair } from '../types/ca-pair';
import { CertPromise } from '../types/cert-promise';
import { logError } from '../common/logger';

export default class CertAndKeyContainer {
  private queue: CertPromise[] = [];

  private maxLength = 1000;

  private getCertSocketTimeout = 2000;

  private caPair: CaPair;

  public constructor(maxLength = 1000, getCertSocketTimeout = 2 * 1000, caPair: CaPair) {
    this.maxLength = maxLength;
    this.getCertSocketTimeout = getCertSocketTimeout;
    this.caPair = caPair;
  }

  private addCertPromise(certPromiseObj: CertPromise): CertPromise {
    if (this.queue.length >= this.maxLength) {
      this.queue.shift();
    }
    this.queue.push(certPromiseObj);

    return certPromiseObj;
  }

  public getCertPromise(hostname: string, port: number): Promise<CaPair> {
    const havePromise = this.checkIfWeHaveCertPromise(hostname);
    if (havePromise !== undefined) return havePromise;

    // @ts-ignore
    const certPromiseObj: CertPromise = {
      mappingHostNames: [hostname], // temporary hostname
    };

    certPromiseObj.promise = this.createNewCertPromise(hostname, port, certPromiseObj);

    return this.addCertPromise(certPromiseObj).promise;
  }

  private createNewCertPromise(
    hostname: string,
    port: number,
    certPromiseObj: CertPromise,
  ): Promise<CaPair> {
    return new Promise((resolve, reject) => {
      let once = true;

      const newResolve = (caPair: CaPair): void => {
        if (once) {
          once = false;

          // eslint-disable-next-line no-param-reassign
          certPromiseObj.mappingHostNames = TlsUtils.getMappingHostNamesFormCert(caPair.cert);

          resolve(caPair);
        }
      };

      let certObj: CaPair | undefined;

      const preReq = https.request(
        {
          port: port,
          hostname: hostname,
          path: '/',
          method: 'HEAD',
        },
        (preRes: http.IncomingMessage) => {
          try {
            const realCert: PeerCertificate = (preRes.socket as TLSSocket).getPeerCertificate();

            if (realCert && 'subject' in realCert)
              try {
                certObj = TlsUtils.createFakeCertificateByCA(this.caPair, realCert);
              } catch (error) {
                logError(error);
              }

            if (!certObj) certObj = TlsUtils.createFakeCertificateByDomain(this.caPair, hostname);

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            newResolve(certObj!!);
          } catch (error) {
            reject(error);
          }
        },
      );

      preReq.setTimeout(this.getCertSocketTimeout, () => {
        if (!certObj) {
          certObj = TlsUtils.createFakeCertificateByDomain(this.caPair, hostname);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newResolve(certObj!!);
        }
      });

      preReq.on('error', () => {
        if (!certObj) {
          certObj = TlsUtils.createFakeCertificateByDomain(this.caPair, hostname);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newResolve(certObj!!);
        }
      });

      preReq.end();
    });
  }

  private checkIfWeHaveCertPromise(hostname: string): Promise<CaPair> | undefined {
    for (let i = 0; i < this.queue.length; i++) {
      const certPromiseObj = this.queue[i];
      const mappingHostNames = certPromiseObj.mappingHostNames;
      // eslint-disable-next-line no-restricted-syntax
      for (const DNSName of mappingHostNames) {
        if (TlsUtils.isMappingHostName(DNSName, hostname)) {
          this.reRankCert(i);
          return certPromiseObj.promise;
        }
      }
    }

    return undefined;
  }

  protected reRankCert(index: number): void {
    // index ==> queue foot
    this.queue.push(this.queue.splice(index, 1)[0]);
  }
}
