"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFakeServerCenter = void 0;
var fs = require("fs");
var forge = require("node-forge");
var chalk_1 = require("chalk");
var fake_servers_center_1 = require("../tls/fake-servers-center");
var logger_1 = require("../common/logger");
function createFakeServerCenter(proxyConfig, requestHandler, upgradeHandler) {
    var caCert;
    var caKey;
    try {
        fs.accessSync(proxyConfig.caCertPath, fs.constants.F_OK);
        fs.accessSync(proxyConfig.caKeyPath, fs.constants.F_OK);
        var caCertPem = String(fs.readFileSync(proxyConfig.caCertPath));
        var caKeyPem = String(fs.readFileSync(proxyConfig.caKeyPath));
        caCert = forge.pki.certificateFromPem(caCertPem);
        caKey = forge.pki.privateKeyFromPem(caKeyPem);
    }
    catch (error) {
        logger_1.log("Can not find `CA certificate` or `CA key`.", chalk_1.default.red);
        throw error;
    }
    return new fake_servers_center_1.FakeServersCenter(100, requestHandler, upgradeHandler, {
        key: caKey,
        cert: caCert,
    }, proxyConfig.getCertSocketTimeout);
}
exports.createFakeServerCenter = createFakeServerCenter;
//# sourceMappingURL=create-fake-server-center.js.map