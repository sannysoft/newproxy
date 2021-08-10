"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeServersCenter = void 0;
const https = require("https");
const forge = require("node-forge");
const tls = require("tls");
const debug_1 = require("debug");
const util_1 = require("util");
const tls_utils_1 = require("./tls-utils");
const cert_and_key_container_1 = require("./cert-and-key-container");
const logger_1 = require("../common/logger");
const context_1 = require("../types/contexts/context");
const pki = forge.pki;
const logger = debug_1.default('newproxy.fakeServer');
class FakeServersCenter {
    constructor(maxLength = 100, requestHandler, upgradeHandler, caPair, getCertSocketTimeout) {
        this.queue = [];
        this.maxFakeServersCount = 100;
        this.fakeServers = new Set();
        this.maxFakeServersCount = maxLength;
        this.requestHandler = requestHandler;
        this.upgradeHandler = upgradeHandler;
        this.certAndKeyContainer = new cert_and_key_container_1.CertAndKeyContainer(maxLength, getCertSocketTimeout, caPair);
    }
    addServerPromise(serverPromiseObj) {
        var _a;
        if (this.queue.length >= this.maxFakeServersCount) {
            const delServerObj = this.queue.shift();
            try {
                // eslint-disable-next-line no-unused-expressions
                (_a = delServerObj === null || delServerObj === void 0 ? void 0 : delServerObj.serverObj) === null || _a === void 0 ? void 0 : _a.server.close();
            }
            catch (error) {
                logger_1.logError(error);
            }
        }
        this.queue.push(serverPromiseObj);
        return serverPromiseObj;
    }
    getServerPromise(hostname, port) {
        for (let i = 0; i < this.queue.length; i++) {
            const serverPromiseObj = this.queue[i];
            const mappingHostNames = serverPromiseObj.mappingHostNames;
            // eslint-disable-next-line no-restricted-syntax
            for (const DNSName of mappingHostNames) {
                if (tls_utils_1.TlsUtils.isMappingHostName(DNSName, hostname)) {
                    this.reRankServer(i);
                    return serverPromiseObj.promise;
                }
            }
        }
        // @ts-ignore
        const serverPromiseObj = {
            mappingHostNames: [hostname], // temporary hostname
        };
        serverPromiseObj.promise = this.createNewServerPromise(hostname, port, serverPromiseObj);
        return this.addServerPromise(serverPromiseObj).promise;
    }
    async createNewServerPromise(hostname, port, serverPromiseObj) {
        const certObj = await this.certAndKeyContainer.getCertPromise(hostname, port);
        const cert = certObj.cert;
        const key = certObj.key;
        const certPem = pki.certificateToPem(cert);
        const keyPem = pki.privateKeyToPem(key);
        const fakeServer = new https.Server({
            key: keyPem,
            cert: certPem,
            SNICallback: (sniHostname, done) => {
                void (async () => {
                    const sniCertObj = await this.certAndKeyContainer.getCertPromise(sniHostname, port);
                    done(null, tls.createSecureContext({
                        key: pki.privateKeyToPem(sniCertObj.key),
                        cert: pki.certificateToPem(sniCertObj.cert),
                    }));
                })();
            },
        });
        this.fakeServers.add(fakeServer);
        const serverObj = {
            cert: cert,
            key: key,
            server: fakeServer,
            port: 0, // if port === 0, should listen server's `listening` event.
        };
        // eslint-disable-next-line no-param-reassign
        serverPromiseObj.serverObj = serverObj;
        return new Promise((resolve) => {
            fakeServer.listen(0, () => {
                const address = fakeServer.address();
                serverObj.port = address.port;
                logger(`Fake server created at port ${address.port}`);
            });
            fakeServer.on('request', (req, res) => {
                logger(`New request received by fake-server: ${res.toString()}`);
                const context = new context_1.Context(req, res, true);
                this.requestHandler(context);
            });
            fakeServer.on('error', (e) => {
                logger(`Error by fake-server: ${e.toString()}`);
                logger_1.logError(e);
            });
            fakeServer.on('listening', () => {
                // eslint-disable-next-line no-param-reassign
                serverPromiseObj.mappingHostNames = tls_utils_1.TlsUtils.getMappingHostNamesFormCert(certObj.cert);
                resolve(serverObj);
            });
            fakeServer.on('upgrade', (req, socket, head) => {
                const ssl = true;
                this.upgradeHandler(req, socket, head, ssl);
            });
        });
    }
    reRankServer(index) {
        // index ==> queue foot
        this.queue.push(this.queue.splice(index, 1)[0]);
    }
    async close() {
        for (const server of Array.from(this.fakeServers)) {
            await util_1.promisify(server.close).call(server);
        }
    }
}
exports.FakeServersCenter = FakeServersCenter;
//# sourceMappingURL=fake-servers-center.js.map