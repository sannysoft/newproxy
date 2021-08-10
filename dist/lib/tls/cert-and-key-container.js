"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertAndKeyContainer = void 0;
const https = require("https");
const tls_utils_1 = require("./tls-utils");
const logger_1 = require("../common/logger");
class CertAndKeyContainer {
    constructor(maxLength = 1000, getCertSocketTimeout = 2 * 1000, caPair) {
        this.queue = [];
        this.maxLength = maxLength;
        this.getCertSocketTimeout = getCertSocketTimeout;
        this.caPair = caPair;
    }
    addCertPromise(certPromiseObj) {
        if (this.queue.length >= this.maxLength) {
            this.queue.shift();
        }
        this.queue.push(certPromiseObj);
        return certPromiseObj;
    }
    getCertPromise(hostname, port) {
        const havePromise = this.checkIfWeHaveCertPromise(hostname);
        if (havePromise !== undefined)
            return havePromise;
        // @ts-ignore
        const certPromiseObj = {
            mappingHostNames: [hostname], // temporary hostname
        };
        certPromiseObj.promise = this.createNewCertPromise(hostname, port, certPromiseObj);
        return this.addCertPromise(certPromiseObj).promise;
    }
    createNewCertPromise(hostname, port, certPromiseObj) {
        return new Promise((resolve, reject) => {
            let once = true;
            const newResolve = (caPair) => {
                if (once) {
                    once = false;
                    // eslint-disable-next-line no-param-reassign
                    certPromiseObj.mappingHostNames = tls_utils_1.TlsUtils.getMappingHostNamesFormCert(caPair.cert);
                    resolve(caPair);
                }
            };
            let certObj;
            const preReq = https.request({
                port: port,
                hostname: hostname,
                path: '/',
                method: 'HEAD',
            }, (preRes) => {
                try {
                    const realCert = preRes.socket.getPeerCertificate();
                    if (realCert && 'subject' in realCert)
                        try {
                            certObj = tls_utils_1.TlsUtils.createFakeCertificateByCA(this.caPair, realCert);
                        }
                        catch (error) {
                            logger_1.logError(error);
                        }
                    if (!certObj)
                        certObj = tls_utils_1.TlsUtils.createFakeCertificateByDomain(this.caPair, hostname);
                    newResolve(certObj);
                }
                catch (error) {
                    reject(error);
                }
            });
            preReq.setTimeout(this.getCertSocketTimeout, () => {
                if (!certObj) {
                    certObj = tls_utils_1.TlsUtils.createFakeCertificateByDomain(this.caPair, hostname);
                    newResolve(certObj);
                }
            });
            preReq.on('error', () => {
                if (!certObj) {
                    certObj = tls_utils_1.TlsUtils.createFakeCertificateByDomain(this.caPair, hostname);
                    newResolve(certObj);
                }
            });
            preReq.end();
        });
    }
    checkIfWeHaveCertPromise(hostname) {
        for (let i = 0; i < this.queue.length; i++) {
            const certPromiseObj = this.queue[i];
            const mappingHostNames = certPromiseObj.mappingHostNames;
            // eslint-disable-next-line no-restricted-syntax
            for (const DNSName of mappingHostNames) {
                if (tls_utils_1.TlsUtils.isMappingHostName(DNSName, hostname)) {
                    this.reRankCert(i);
                    return certPromiseObj.promise;
                }
            }
        }
        return undefined;
    }
    reRankCert(index) {
        // index ==> queue foot
        this.queue.push(this.queue.splice(index, 1)[0]);
    }
}
exports.CertAndKeyContainer = CertAndKeyContainer;
//# sourceMappingURL=cert-and-key-container.js.map