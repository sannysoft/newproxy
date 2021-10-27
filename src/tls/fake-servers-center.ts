import forge from "node-forge";
import fs from "fs";
import { CertAndKeyContainer } from "./cert-and-key-container";
import { CaPair } from "../types/ca-pair";
import { UpgradeHandlerFn } from "../types/functions/upgrade-handler-fn";
import { RequestHandlerFn } from "../types/functions/request-handler-fn";
import { Logger } from "../common/logger";
import { ProxyConfig } from "../types/proxy-config";
import { HttpsServer } from "./https-server";
import { doNotWaitPromise } from "../utils/promises";

export class FakeServersCenter {
  private queue: HttpsServer[] = [];

  private readonly maxFakeServersCount: number = 100;

  private readonly certAndKeyContainer: CertAndKeyContainer;

  public constructor(
    proxyConfig: ProxyConfig,
    private readonly requestHandler: RequestHandlerFn,
    private readonly upgradeHandler: UpgradeHandlerFn,
    private readonly logger: Logger,
  ) {
    let caPair: CaPair;
    try {
      fs.accessSync(proxyConfig.caCertPath, fs.constants.F_OK);
      fs.accessSync(proxyConfig.caKeyPath, fs.constants.F_OK);
      const caCertPem = String(fs.readFileSync(proxyConfig.caCertPath));
      const caKeyPem = String(fs.readFileSync(proxyConfig.caKeyPath));
      const caCert = forge.pki.certificateFromPem(caCertPem);
      const caKey = forge.pki.privateKeyFromPem(caKeyPem);
      caPair = {
        key: caKey,
        cert: caCert,
      };
    } catch (error) {
      this.logger.logError(`Can not find \`CA certificate\` or \`CA key\`.`);
      throw error;
    }

    this.certAndKeyContainer = new CertAndKeyContainer(
      this.maxFakeServersCount,
      proxyConfig.getCertSocketTimeout,
      caPair,
      this.logger,
    );
  }

  public getFakeServer(hostname: string, port: number): HttpsServer {
    // Look for existing server
    for (let i = 0; i < this.queue.length; i++) {
      const server = this.queue[i];
      if (server.doesMatchHostname(hostname)) {
        this.reRankServer(i);
        return server;
      }
    }

    // Check if we are over limit
    if (this.queue.length >= this.maxFakeServersCount) {
      const serverToDelete = this.queue.shift();
      if (serverToDelete)
        if (serverToDelete.isRunning || serverToDelete.isLaunching) {
          doNotWaitPromise(
            serverToDelete.stop(),
            `Stopping server for ${serverToDelete.mappingHostNames.join(',')}`,
            this.logger,
          );
        }
    }

    // Create new one
    const newServer = new HttpsServer(
      this.certAndKeyContainer,
      this.logger,
      hostname,
      port,
      this.requestHandler,
      this.upgradeHandler,
    );

    this.queue.push(newServer);

    doNotWaitPromise(newServer.run(), `Server launched for ${hostname}`, this.logger);

    return newServer;
  }

  private reRankServer(index: number): void {
    // index ==> queue foot
    this.queue.push(this.queue.splice(index, 1)[0]);
  }

  public async close(): Promise<void> {
    // Destroy all fake servers
    await Promise.all(this.queue.map((server) => server.stop()));
  }
}
