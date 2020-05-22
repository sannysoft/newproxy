"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var forge = require("node-forge");
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var ca_config_1 = require("../common/ca-config");
var TlsUtils = /** @class */ (function () {
    function TlsUtils() {
    }
    TlsUtils.createCA = function (commonName) {
        var keys = forge.pki.rsa.generateKeyPair(2046);
        var cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = "" + new Date().getTime();
        cert.validity.notBefore = new Date();
        cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);
        var attrs = [
            {
                name: 'commonName',
                value: commonName,
            },
            {
                name: 'countryName',
                value: 'RU',
            },
            {
                shortName: 'ST',
                value: 'Moscow',
            },
            {
                name: 'localityName',
                value: 'Moscow',
            },
            {
                name: 'organizationName',
                value: 'NewProxy',
            },
            {
                shortName: 'OU',
                value: 'https://github.com/sannysoft/newproxy',
            },
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.setExtensions([
            {
                name: 'basicConstraints',
                critical: true,
                cA: true,
            },
            {
                name: 'keyUsage',
                critical: true,
                keyCertSign: true,
            },
            {
                name: 'subjectKeyIdentifier',
            },
        ]);
        // self-sign certificate
        cert.sign(keys.privateKey, forge.md.sha256.create());
        return {
            key: keys.privateKey,
            cert: cert,
        };
    };
    TlsUtils.covertNodeCertToForgeCert = function (originCertificate) {
        var obj = forge.asn1.fromDer(originCertificate.raw.toString('binary'));
        return forge.pki.certificateFromAsn1(obj);
    };
    TlsUtils.createFakeCertificateByDomain = function (caPair, domain) {
        var keys = forge.pki.rsa.generateKeyPair(2046);
        var cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = "" + new Date().getTime();
        cert.validity.notBefore = new Date();
        cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
        var attrs = [
            {
                name: 'commonName',
                value: domain,
            },
            {
                name: 'countryName',
                value: 'RU',
            },
            {
                shortName: 'ST',
                value: 'Moscow',
            },
            {
                name: 'localityName',
                value: 'Moscow',
            },
            {
                name: 'organizationName',
                value: 'NewProxy',
            },
            {
                shortName: 'OU',
                value: 'https://github.com/sannysoft/newproxy',
            },
        ];
        cert.setIssuer(caPair.cert.subject.attributes);
        cert.setSubject(attrs);
        cert.setExtensions([
            {
                name: 'basicConstraints',
                critical: true,
                cA: false,
            },
            {
                name: 'keyUsage',
                critical: true,
                digitalSignature: true,
                contentCommitment: true,
                keyEncipherment: true,
                dataEncipherment: true,
                keyAgreement: true,
                keyCertSign: true,
                cRLSign: true,
                encipherOnly: true,
                decipherOnly: true,
            },
            {
                name: 'subjectAltName',
                altNames: [
                    {
                        type: 2,
                        value: domain,
                    },
                ],
            },
            {
                name: 'subjectKeyIdentifier',
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
                clientAuth: true,
                codeSigning: true,
                emailProtection: true,
                timeStamping: true,
            },
            {
                name: 'authorityKeyIdentifier',
            },
        ]);
        cert.sign(caPair.key, forge.md.sha256.create());
        return {
            key: keys.privateKey,
            cert: cert,
        };
    };
    TlsUtils.createFakeCertificateByCA = function (caPair, originCertificate) {
        // const certificate = TlsUtils.covertNodeCertToForgeCert(originCertificate);
        var keys = forge.pki.rsa.generateKeyPair(2046);
        var cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = originCertificate.serialNumber;
        cert.validity.notBefore = new Date();
        cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
        var attrs = [];
        Object.entries(originCertificate.subject).forEach(function (_a) {
            var name = _a[0], value = _a[1];
            attrs.push({
                shortName: name,
                value: value,
            });
        });
        cert.setSubject(attrs);
        cert.setIssuer(caPair.cert.subject.attributes);
        var subjectAltNames = originCertificate.subjectaltname.split(', ').map(function (name) {
            return {
                // 2 is DNS type
                type: 2,
                value: name.replace('DNS:', '').trim(),
            };
        });
        cert.setExtensions([
            {
                name: 'basicConstraints',
                critical: true,
                cA: false,
            },
            {
                name: 'keyUsage',
                critical: true,
                digitalSignature: true,
                contentCommitment: true,
                keyEncipherment: true,
                dataEncipherment: true,
                keyAgreement: true,
                keyCertSign: true,
                cRLSign: true,
                encipherOnly: true,
                decipherOnly: true,
            },
            {
                name: 'subjectAltName',
                altNames: subjectAltNames,
            },
            {
                name: 'subjectKeyIdentifier',
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
                clientAuth: true,
                codeSigning: true,
                emailProtection: true,
                timeStamping: true,
            },
            {
                name: 'authorityKeyIdentifier',
            },
        ]);
        cert.sign(caPair.key, forge.md.sha256.create());
        return {
            key: keys.privateKey,
            cert: cert,
        };
    };
    TlsUtils.isBrowserRequest = function (userAgent) {
        return /Mozilla/i.test(userAgent);
    };
    TlsUtils.isMappingHostName = function (DNSName, hostname) {
        var reg = DNSName.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
        reg = "^" + reg + "$";
        return new RegExp(reg).test(hostname);
    };
    TlsUtils.getMappingHostNamesFormCert = function (cert) {
        var _a, _b, _c, _d;
        var mappingHostNames = [(_b = (_a = cert.subject.getField('CN')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : []];
        // @ts-ignore
        var altNames = (_d = (_c = cert.getExtension('subjectAltName')) === null || _c === void 0 ? void 0 : _c.altNames) !== null && _d !== void 0 ? _d : [];
        mappingHostNames = mappingHostNames.concat(altNames.map(function (item) { return item.value; }));
        return mappingHostNames;
    };
    TlsUtils.initCA = function (basePath) {
        var caCertPath = path.resolve(basePath, ca_config_1.caConfig.caCertFileName);
        var caKeyPath = path.resolve(basePath, ca_config_1.caConfig.caKeyFileName);
        try {
            fs.accessSync(caCertPath, fs.constants.F_OK);
            fs.accessSync(caKeyPath, fs.constants.F_OK);
            // has exist
            return {
                caCertPath: caCertPath,
                caKeyPath: caKeyPath,
                create: false,
            };
        }
        catch (error) {
            var caObj = TlsUtils.createCA(ca_config_1.caConfig.caName);
            var caCert = caObj.cert;
            var cakey = caObj.key;
            var certPem = forge.pki.certificateToPem(caCert);
            var keyPem = forge.pki.privateKeyToPem(cakey);
            mkdirp.sync(path.dirname(caCertPath));
            fs.writeFileSync(caCertPath, certPem);
            fs.writeFileSync(caKeyPath, keyPem);
        }
        return {
            caCertPath: caCertPath,
            caKeyPath: caKeyPath,
            create: true,
        };
    };
    return TlsUtils;
}());
exports.default = TlsUtils;
//# sourceMappingURL=tls-utils.js.map