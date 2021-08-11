import * as https from 'https';
import * as tls from 'tls';
import * as forge from 'node-forge';
import { AddressInfo, Socket } from 'net';
import { CertAndKeyContainer } from './cert-and-key-container';
import { Context } from '../types/contexts/context';
import { TlsUtils } from './tls-utils';
import { Logger } from '../common/logger';
import { RequestHandlerFn } from '../types/functions/request-handler-fn';
import { UpgradeHandlerFn } from '../types/functions/upgrade-handler-fn';

const pki = forge.pki;

export class HttpsServer {
  private fakeServer?: https.Server;

  private _launching: boolean = false;

  get isLaunching(): boolean {
    return this._launching;
  }

  private _stopped: boolean = false;

  private _running: boolean = false;

  get isRunning(): boolean {
    return this._running;
  }

  private serverSockets = new Set<Socket>();

  private _listenPort?: number;

  get listenPort(): number | undefined {
    return this._listenPort;
  }

  private _mappingHostNames: string[] = [];

  get mappingHostNames(): string[] {
    return this._mappingHostNames;
  }

  constructor(
    private readonly certAndKeyContainer: CertAndKeyContainer,
    private readonly logger: Logger,
    public readonly remoteHostname: string,
    public readonly remotePort: number,
    private readonly requestHandler: RequestHandlerFn,
    private readonly upgradeHandler: UpgradeHandlerFn,
  ) {
    this._mappingHostNames = [this.remoteHostname];
  }

  public doesMatchHostname(hostname: string): boolean {
    for (const DNSName of this.mappingHostNames) {
      if (TlsUtils.isMappingHostName(DNSName, hostname)) {
        return true;
      }
    }

    return false;
  }

  public async run(): Promise<HttpsServer> {
    if (this._running || this._launching) {
      return this;
    }
    if (this._stopped) {
      throw new Error('Server is stopped already');
    }
    this._launching = true;
    const certObj = await this.certAndKeyContainer.getCertPromise(
      this.remoteHostname,
      this.remotePort,
    );

    const cert = certObj.cert;
    const key = certObj.key;
    const certPem = pki.certificateToPem(cert);
    const keyPem = pki.privateKeyToPem(key);

    this.fakeServer = new https.Server({
      key: keyPem,
      cert: certPem,
      SNICallback: (sniHostname, done): void => {
        void (async (): Promise<void> => {
          const sniCertObj = await this.certAndKeyContainer.getCertPromise(
            sniHostname,
            this.remotePort,
          );
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

    await new Promise<void>((resolve, reject) => {
      const fakeServer = this.fakeServer!;

      fakeServer.once('error', (error: Error) => {
        if (this._launching) {
          this._launching = false;
          reject(error);
        }
      });

      fakeServer.listen(0, () => {
        const address = fakeServer.address() as AddressInfo;
        this._listenPort = address.port;
        this._running = true;
        this._launching = false;
        this.logger.log(`Fake server created at port ${address.port}`);
        this._mappingHostNames = TlsUtils.getMappingHostNamesFormCert(certObj.cert);
        resolve();
      });

      fakeServer.on('request', (req, res) => {
        this.logger.log(`New request received by fake-server: ${res.toString()}`);
        const context = new Context(req, res, true);
        this.requestHandler(context);
      });

      fakeServer.on('error', (e) => {
        this.logger.logError(`Error by fake-server: ${e.toString()}`);
      });

      fakeServer.on('connection', (socket: Socket) => {
        this.serverSockets.add(socket);
        socket.on('close', () => {
          this.serverSockets.delete(socket);
        });
      });

      fakeServer.on('upgrade', (req, socket, head) => {
        const ssl = true;
        this.upgradeHandler(req, socket, head, ssl);
      });
    });

    return this;
  }

  public stop(): Promise<void> {
    if (this._stopped || (!this._running && !this._launching)) {
      return Promise.resolve();
    }
    this._stopped = true;
    this._running = false;

    this.serverSockets.forEach((socket) => {
      socket.destroy();
    });
    this.serverSockets = new Set();

    if (this.fakeServer) {
      return new Promise((resolve, reject) => {
        this.fakeServer!.close((err) => {
          if (err) reject(err);

          resolve();
        });
      });
    }

    return Promise.resolve();
  }
}
