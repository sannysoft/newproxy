"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeServersCenter = void 0;
const forge = require("node-forge");
const fs = require("fs");
const cert_and_key_container_1 = require("./cert-and-key-container");
const https_server_1 = require("./https-server");
const promises_1 = require("../utils/promises");
class FakeServersCenter {
    constructor(proxyConfig, requestHandler, upgradeHandler, logger) {
        this.requestHandler = requestHandler;
        this.upgradeHandler = upgradeHandler;
        this.logger = logger;
        this.queue = [];
        this.maxFakeServersCount = 100;
        let caPair;
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
        }
        catch (error) {
            this.logger.logError(`Can not find \`CA certificate\` or \`CA key\`.`);
            throw error;
        }
        this.certAndKeyContainer = new cert_and_key_container_1.CertAndKeyContainer(this.maxFakeServersCount, proxyConfig.getCertSocketTimeout, caPair, this.logger);
    }
    getFakeServer(hostname, port) {
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
                    promises_1.doNotWaitPromise(serverToDelete.stop(), `Stopping server for ${serverToDelete.mappingHostNames.join(',')}`, this.logger);
                }
        }
        // Create new one
        const newServer = new https_server_1.HttpsServer(this.certAndKeyContainer, this.logger, hostname, port, this.requestHandler, this.upgradeHandler);
        this.queue.push(newServer);
        promises_1.doNotWaitPromise(newServer.run(), `Server launched for ${hostname}`, this.logger);
        return newServer;
    }
    reRankServer(index) {
        // index ==> queue foot
        this.queue.push(this.queue.splice(index, 1)[0]);
    }
    async close() {
        // Destroy all fake servers
        await Promise.all(this.queue.map((server) => server.stop()));
    }
}
exports.FakeServersCenter = FakeServersCenter;
//# sourceMappingURL=fake-servers-center.js.map