"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFakeServerCenter = void 0;
const fs = require("fs");
const forge = require("node-forge");
const chalk = require("chalk");
const fake_servers_center_1 = require("../tls/fake-servers-center");
const logger_1 = require("../common/logger");
function createFakeServerCenter(proxyConfig, requestHandler, upgradeHandler) {
    let caCert;
    let caKey;
    try {
        fs.accessSync(proxyConfig.caCertPath, fs.constants.F_OK);
        fs.accessSync(proxyConfig.caKeyPath, fs.constants.F_OK);
        const caCertPem = String(fs.readFileSync(proxyConfig.caCertPath));
        const caKeyPem = String(fs.readFileSync(proxyConfig.caKeyPath));
        caCert = forge.pki.certificateFromPem(caCertPem);
        caKey = forge.pki.privateKeyFromPem(caKeyPem);
    }
    catch (error) {
        logger_1.log(`Can not find \`CA certificate\` or \`CA key\`.`, chalk.red);
        throw error;
    }
    return new fake_servers_center_1.FakeServersCenter(100, requestHandler, upgradeHandler, {
        key: caKey,
        cert: caCert,
    }, proxyConfig.getCertSocketTimeout);
}
exports.createFakeServerCenter = createFakeServerCenter;
//# sourceMappingURL=create-fake-server-center.js.map