"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpsServer = void 0;
const https = require("https");
const tls = require("tls");
const forge = require("node-forge");
const context_1 = require("../types/contexts/context");
const tls_utils_1 = require("./tls-utils");
const pki = forge.pki;
class HttpsServer {
    constructor(certAndKeyContainer, logger, remoteHostname, remotePort, requestHandler, upgradeHandler) {
        this.certAndKeyContainer = certAndKeyContainer;
        this.logger = logger;
        this.remoteHostname = remoteHostname;
        this.remotePort = remotePort;
        this.requestHandler = requestHandler;
        this.upgradeHandler = upgradeHandler;
        this._launching = false;
        this._stopped = false;
        this._running = false;
        this.serverSockets = new Set();
        this._mappingHostNames = [];
        this._mappingHostNames = [this.remoteHostname];
    }
    get isLaunching() {
        return this._launching;
    }
    get isRunning() {
        return this._running;
    }
    get listenPort() {
        return this._listenPort;
    }
    get mappingHostNames() {
        return this._mappingHostNames;
    }
    doesMatchHostname(hostname) {
        for (const DNSName of this.mappingHostNames) {
            if (tls_utils_1.TlsUtils.isMappingHostName(DNSName, hostname)) {
                return true;
            }
        }
        return false;
    }
    async run() {
        if (this._running || this._launching) {
            return this;
        }
        if (this._stopped) {
            throw new Error('Server is stopped already');
        }
        this._launching = true;
        const certObj = await this.certAndKeyContainer.getCertPromise(this.remoteHostname, this.remotePort);
        const cert = certObj.cert;
        const key = certObj.key;
        const certPem = pki.certificateToPem(cert);
        const keyPem = pki.privateKeyToPem(key);
        this.fakeServer = new https.Server({
            key: keyPem,
            cert: certPem,
            SNICallback: (sniHostname, done) => {
                void (async () => {
                    const sniCertObj = await this.certAndKeyContainer.getCertPromise(sniHostname, this.remotePort);
                    done(null, tls.createSecureContext({
                        key: pki.privateKeyToPem(sniCertObj.key),
                        cert: pki.certificateToPem(sniCertObj.cert),
                    }));
                })();
            },
        });
        await new Promise((resolve, reject) => {
            const fakeServer = this.fakeServer;
            fakeServer.once('error', (error) => {
                if (this._launching) {
                    this._launching = false;
                    reject(error);
                }
            });
            fakeServer.listen(0, () => {
                const address = fakeServer.address();
                this._listenPort = address.port;
                this._running = true;
                this._launching = false;
                this.logger.log(`Fake server created at port ${address.port}`);
                this._mappingHostNames = tls_utils_1.TlsUtils.getMappingHostNamesFormCert(certObj.cert);
                resolve();
            });
            fakeServer.on('request', (req, res) => {
                this.logger.log(`New request received by fake-server: ${res.toString()}`);
                const context = new context_1.Context(req, res, true);
                this.requestHandler(context);
            });
            fakeServer.on('error', (e) => {
                this.logger.logError(`Error by fake-server: ${e.toString()}`);
            });
            fakeServer.on('connection', (socket) => {
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
    stop() {
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
                this.fakeServer.close((err) => {
                    if (err)
                        reject(err);
                    resolve();
                });
            });
        }
        return Promise.resolve();
    }
}
exports.HttpsServer = HttpsServer;
//# sourceMappingURL=https-server.js.map