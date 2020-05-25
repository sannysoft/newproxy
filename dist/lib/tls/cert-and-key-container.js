"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var https = require("https");
var tls_utils_1 = require("./tls-utils");
var logger_1 = require("../common/logger");
var CertAndKeyContainer = /** @class */ (function () {
    function CertAndKeyContainer(maxLength, getCertSocketTimeout, caPair) {
        if (maxLength === void 0) { maxLength = 1000; }
        if (getCertSocketTimeout === void 0) { getCertSocketTimeout = 2 * 1000; }
        this.queue = [];
        this.maxLength = maxLength;
        this.getCertSocketTimeout = getCertSocketTimeout;
        this.caPair = caPair;
    }
    CertAndKeyContainer.prototype.addCertPromise = function (certPromiseObj) {
        if (this.queue.length >= this.maxLength) {
            this.queue.shift();
        }
        this.queue.push(certPromiseObj);
        return certPromiseObj;
    };
    CertAndKeyContainer.prototype.getCertPromise = function (hostname, port) {
        var havePromise = this.checkIfWeHaveCertPromise(hostname);
        if (havePromise !== undefined)
            return havePromise;
        // @ts-ignore
        var certPromiseObj = {
            mappingHostNames: [hostname],
        };
        certPromiseObj.promise = this.createNewCertPromise(hostname, port, certPromiseObj);
        return this.addCertPromise(certPromiseObj).promise;
    };
    CertAndKeyContainer.prototype.createNewCertPromise = function (hostname, port, certPromiseObj) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var once = true;
            var newResolve = function (caPair) {
                if (once) {
                    once = false;
                    // eslint-disable-next-line no-param-reassign
                    certPromiseObj.mappingHostNames = tls_utils_1.default.getMappingHostNamesFormCert(caPair.cert);
                    resolve(caPair);
                }
            };
            var certObj;
            var preReq = https.request({
                port: port,
                hostname: hostname,
                path: '/',
                method: 'HEAD',
            }, function (preRes) {
                try {
                    var realCert = preRes.socket.getPeerCertificate();
                    if (realCert && 'subject' in realCert)
                        try {
                            certObj = tls_utils_1.default.createFakeCertificateByCA(_this.caPair, realCert);
                        }
                        catch (error) {
                            logger_1.logError(error);
                        }
                    if (!certObj)
                        certObj = tls_utils_1.default.createFakeCertificateByDomain(_this.caPair, hostname);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    newResolve(certObj);
                }
                catch (error) {
                    reject(error);
                }
            });
            preReq.setTimeout(_this.getCertSocketTimeout, function () {
                if (!certObj) {
                    certObj = tls_utils_1.default.createFakeCertificateByDomain(_this.caPair, hostname);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    newResolve(certObj);
                }
            });
            preReq.on('error', function () {
                if (!certObj) {
                    certObj = tls_utils_1.default.createFakeCertificateByDomain(_this.caPair, hostname);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    newResolve(certObj);
                }
            });
            preReq.end();
        });
    };
    CertAndKeyContainer.prototype.checkIfWeHaveCertPromise = function (hostname) {
        for (var i = 0; i < this.queue.length; i++) {
            var certPromiseObj = this.queue[i];
            var mappingHostNames = certPromiseObj.mappingHostNames;
            // eslint-disable-next-line no-restricted-syntax
            for (var _i = 0, mappingHostNames_1 = mappingHostNames; _i < mappingHostNames_1.length; _i++) {
                var DNSName = mappingHostNames_1[_i];
                if (tls_utils_1.default.isMappingHostName(DNSName, hostname)) {
                    this.reRankCert(i);
                    return certPromiseObj.promise;
                }
            }
        }
        return undefined;
    };
    CertAndKeyContainer.prototype.reRankCert = function (index) {
        // index ==> queue foot
        this.queue.push(this.queue.splice(index, 1)[0]);
    };
    return CertAndKeyContainer;
}());
exports.default = CertAndKeyContainer;
//# sourceMappingURL=cert-and-key-container.js.map