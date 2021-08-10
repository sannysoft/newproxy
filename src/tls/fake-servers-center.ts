import * as https from 'https';
import * as forge from 'node-forge';
import * as tls from 'tls';
import { AddressInfo } from 'net';
import debug from 'debug';
import { promisify } from 'util';
import { TlsUtils } from './tls-utils';
import { CertAndKeyContainer } from './cert-and-key-container';
import { CaPair } from '../types/ca-pair';
import { ServerObject } from '../types/server-object';
import { ServerObjectPromise } from '../types/server-object-promise';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { logError } from '../common/logger';
import { Context } from '../types/contexts/context';

const pki = forge.pki;

const logger = debug('newproxy.fakeServer');

export class FakeServersCenter {
  private queue: ServerObjectPromise[] = [];

  private readonly maxFakeServersCount: number = 100;

  private certAndKeyContainer: CertAndKeyContainer;

  private readonly requestHandler: RequestHandlerFn;

  private readonly upgradeHandler: UpgradeHandlerFn;

  private fakeServers: Set<https.Server> = new Set();

  public constructor(
    maxLength = 100,
    requestHandler: RequestHandlerFn,
    upgradeHandler: UpgradeHandlerFn,
    caPair: CaPair,
    getCertSocketTimeout: number,
  ) {
    this.maxFakeServersCount = maxLength;
    this.requestHandler = requestHandler;
    this.upgradeHandler = upgradeHandler;
    this.certAndKeyContainer = new CertAndKeyContainer(maxLength, getCertSocketTimeout, caPair);
  }

  private addServerPromise(serverPromiseObj: ServerObjectPromise): ServerObjectPromise {
    if (this.queue.length >= this.maxFakeServersCount) {
      const delServerObj = this.queue.shift();
      try {
        // eslint-disable-next-line no-unused-expressions
        delServerObj?.serverObj?.server.close();
      } catch (error) {
        logError(error);
      }
    }
    this.queue.push(serverPromiseObj);

    return serverPromiseObj;
  }

  public getServerPromise(hostname: string, port: number): Promise<ServerObject> {
    for (let i = 0; i < this.queue.length; i++) {
      const serverPromiseObj = this.queue[i];
      const mappingHostNames = serverPromiseObj.mappingHostNames;
      // eslint-disable-next-line no-restricted-syntax
      for (const DNSName of mappingHostNames) {
        if (TlsUtils.isMappingHostName(DNSName, hostname)) {
          this.reRankServer(i);
          return serverPromiseObj.promise;
        }
      }
    }

    // @ts-ignore
    const serverPromiseObj: ServerObjectPromise = {
      mappingHostNames: [hostname], // temporary hostname
    };

    serverPromiseObj.promise = this.createNewServerPromise(hostname, port, serverPromiseObj);

    return this.addServerPromise(serverPromiseObj).promise;
  }

  private async createNewServerPromise(
    hostname: string,
    port: number,
    serverPromiseObj: ServerObjectPromise,
  ): Promise<ServerObject> {
    const certObj = await this.certAndKeyContainer.getCertPromise(hostname, port);

    const cert = certObj.cert;
    const key = certObj.key;
    const certPem = pki.certificateToPem(cert);
    const keyPem = pki.privateKeyToPem(key);

    const fakeServer = new https.Server({
      key: keyPem,
      cert: certPem,
      SNICallback: (sniHostname, done): void => {
        void (async (): Promise<void> => {
          const sniCertObj = await this.certAndKeyContainer.getCertPromise(sniHostname, port);
          done(
            null,
            tls.createSecureContext({
              key: pki.privateKeyToPem(sniCertObj.key),
              cert: pki.certificateToPem(sniCertObj.cert),
            }),
          );
        })();
      },
    });

    this.fakeServers.add(fakeServer);

    const serverObj: ServerObject = {
      cert: cert,
      key: key,
      server: fakeServer,
      port: 0, // if port === 0, should listen server's `listening` event.
    };

    // eslint-disable-next-line no-param-reassign
    serverPromiseObj.serverObj = serverObj;

    return new Promise<ServerObject>((resolve) => {
      fakeServer.listen(0, () => {
        const address = fakeServer.address() as AddressInfo;
        serverObj.port = address.port;
        logger(`Fake server created at port ${address.port}`);
      });

      fakeServer.on('request', (req, res) => {
        logger(`New request received by fake-server: ${res.toString()}`);
        const context = new Context(req, res, true);
        this.requestHandler(context);
      });

      fakeServer.on('error', (e) => {
        logger(`Error by fake-server: ${e.toString()}`);
        logError(e);
      });

      fakeServer.on('listening', () => {
        // eslint-disable-next-line no-param-reassign
        serverPromiseObj.mappingHostNames = TlsUtils.getMappingHostNamesFormCert(certObj.cert);
        resolve(serverObj);
      });

      fakeServer.on('upgrade', (req, socket, head) => {
        const ssl = true;
        this.upgradeHandler(req, socket, head, ssl);
      });
    });
  }

  private reRankServer(index: number): void {
    // index ==> queue foot
    this.queue.push(this.queue.splice(index, 1)[0]);
  }

  public async close(): Promise<void> {
    for (const server of Array.from(this.fakeServers)) {
      await promisify(server.close).call(server);
    }
  }
}
