"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TlsUtils = void 0;
const forge = require("node-forge");
const mkdirp = require("mkdirp");
const path = require("path");
const fs = require("fs");
const ca_config_1 = require("../common/ca-config");
class TlsUtils {
    static createCA(commonName) {
        const keys = forge.pki.rsa.generateKeyPair(2046);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = `${new Date().getTime()}`;
        cert.validity.notBefore = new Date();
        cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);
        const attrs = [
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
    }
    static covertNodeCertToForgeCert(originCertificate) {
        const obj = forge.asn1.fromDer(originCertificate.raw.toString('binary'));
        return forge.pki.certificateFromAsn1(obj);
    }
    static createFakeCertificateByDomain(caPair, domain) {
        const keys = forge.pki.rsa.generateKeyPair(2046);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = `${new Date().getTime()}`;
        cert.validity.notBefore = new Date();
        cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
        const attrs = [
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
    }
    static createFakeCertificateByCA(caPair, originCertificate) {
        // const certificate = TlsUtils.covertNodeCertToForgeCert(originCertificate);
        const keys = forge.pki.rsa.generateKeyPair(2046);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = originCertificate.serialNumber;
        cert.validity.notBefore = new Date();
        cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
        const attrs = [];
        Object.entries(originCertificate.subject).forEach(([name, value]) => {
            attrs.push({
                shortName: name,
                value: value,
            });
        });
        cert.setSubject(attrs);
        cert.setIssuer(caPair.cert.subject.attributes);
        const subjectAltNames = originCertificate.subjectaltname.split(', ').map((name) => ({
            // 2 is DNS type
            type: 2,
            value: name.replace('DNS:', '').trim(),
        }));
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
    }
    static isBrowserRequest(userAgent) {
        return /mozilla/i.test(userAgent);
    }
    static isMappingHostName(DNSName, hostname) {
        let reg = DNSName.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
        reg = `^${reg}$`;
        return new RegExp(reg).test(hostname);
    }
    static getMappingHostNamesFormCert(cert) {
        var _a, _b, _c, _d;
        let mappingHostNames = [(_b = (_a = cert.subject.getField('CN')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : []];
        // @ts-ignore
        const altNames = (_d = (_c = cert.getExtension('subjectAltName')) === null || _c === void 0 ? void 0 : _c.altNames) !== null && _d !== void 0 ? _d : [];
        mappingHostNames = mappingHostNames.concat(altNames.map((item) => item.value));
        return mappingHostNames;
    }
    static initCA(basePath) {
        const caCertPath = path.resolve(basePath, ca_config_1.caConfig.caCertFileName);
        const caKeyPath = path.resolve(basePath, ca_config_1.caConfig.caKeyFileName);
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
        catch {
            const caObj = TlsUtils.createCA(ca_config_1.caConfig.caName);
            const caCert = caObj.cert;
            const cakey = caObj.key;
            const certPem = forge.pki.certificateToPem(caCert);
            const keyPem = forge.pki.privateKeyToPem(cakey);
            mkdirp.sync(path.dirname(caCertPath));
            fs.writeFileSync(caCertPath, certPem);
            fs.writeFileSync(caKeyPath, keyPem);
        }
        return {
            caCertPath: caCertPath,
            caKeyPath: caKeyPath,
            create: true,
        };
    }
}
exports.TlsUtils = TlsUtils;
//# sourceMappingURL=tls-utils.js.map