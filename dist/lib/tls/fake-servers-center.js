"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeServersCenter = void 0;
var https = require("https");
var forge = require("node-forge");
var tls = require("tls");
var debug_1 = require("debug");
var util_1 = require("util");
var tls_utils_1 = require("./tls-utils");
var cert_and_key_container_1 = require("./cert-and-key-container");
var logger_1 = require("../common/logger");
var context_1 = require("../types/contexts/context");
var pki = forge.pki;
var logger = debug_1.default('newproxy.fakeServer');
var FakeServersCenter = /** @class */ (function () {
    function FakeServersCenter(maxLength, requestHandler, upgradeHandler, caPair, getCertSocketTimeout) {
        if (maxLength === void 0) { maxLength = 100; }
        this.queue = [];
        this.maxFakeServersCount = 100;
        this.fakeServers = new Set();
        this.maxFakeServersCount = maxLength;
        this.requestHandler = requestHandler;
        this.upgradeHandler = upgradeHandler;
        this.certAndKeyContainer = new cert_and_key_container_1.CertAndKeyContainer(maxLength, getCertSocketTimeout, caPair);
    }
    FakeServersCenter.prototype.addServerPromise = function (serverPromiseObj) {
        var _a;
        if (this.queue.length >= this.maxFakeServersCount) {
            var delServerObj = this.queue.shift();
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
    };
    FakeServersCenter.prototype.getServerPromise = function (hostname, port) {
        for (var i = 0; i < this.queue.length; i++) {
            var serverPromiseObj_1 = this.queue[i];
            var mappingHostNames = serverPromiseObj_1.mappingHostNames;
            // eslint-disable-next-line no-restricted-syntax
            for (var _i = 0, mappingHostNames_1 = mappingHostNames; _i < mappingHostNames_1.length; _i++) {
                var DNSName = mappingHostNames_1[_i];
                if (tls_utils_1.TlsUtils.isMappingHostName(DNSName, hostname)) {
                    this.reRankServer(i);
                    return serverPromiseObj_1.promise;
                }
            }
        }
        // @ts-ignore
        var serverPromiseObj = {
            mappingHostNames: [hostname], // temporary hostname
        };
        serverPromiseObj.promise = this.createNewServerPromise(hostname, port, serverPromiseObj);
        return this.addServerPromise(serverPromiseObj).promise;
    };
    FakeServersCenter.prototype.createNewServerPromise = function (hostname, port, serverPromiseObj) {
        return __awaiter(this, void 0, void 0, function () {
            var certObj, cert, key, certPem, keyPem, fakeServer, serverObj;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.certAndKeyContainer.getCertPromise(hostname, port)];
                    case 1:
                        certObj = _a.sent();
                        cert = certObj.cert;
                        key = certObj.key;
                        certPem = pki.certificateToPem(cert);
                        keyPem = pki.privateKeyToPem(key);
                        fakeServer = new https.Server({
                            key: keyPem,
                            cert: certPem,
                            SNICallback: function (sniHostname, done) {
                                void (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var sniCertObj;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.certAndKeyContainer.getCertPromise(sniHostname, port)];
                                            case 1:
                                                sniCertObj = _a.sent();
                                                done(null, tls.createSecureContext({
                                                    key: pki.privateKeyToPem(sniCertObj.key),
                                                    cert: pki.certificateToPem(sniCertObj.cert),
                                                }));
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })();
                            },
                        });
                        this.fakeServers.add(fakeServer);
                        serverObj = {
                            cert: cert,
                            key: key,
                            server: fakeServer,
                            port: 0, // if port === 0, should listen server's `listening` event.
                        };
                        // eslint-disable-next-line no-param-reassign
                        serverPromiseObj.serverObj = serverObj;
                        return [2 /*return*/, new Promise(function (resolve) {
                                fakeServer.listen(0, function () {
                                    var address = fakeServer.address();
                                    serverObj.port = address.port;
                                    logger("Fake server created at port " + address.port);
                                });
                                fakeServer.on('request', function (req, res) {
                                    logger("New request received by fake-server: " + res.toString());
                                    var context = new context_1.Context(req, res, true);
                                    _this.requestHandler(context);
                                });
                                fakeServer.on('error', function (e) {
                                    logger("Error by fake-server: " + e.toString());
                                    logger_1.logError(e);
                                });
                                fakeServer.on('listening', function () {
                                    // eslint-disable-next-line no-param-reassign
                                    serverPromiseObj.mappingHostNames = tls_utils_1.TlsUtils.getMappingHostNamesFormCert(certObj.cert);
                                    resolve(serverObj);
                                });
                                fakeServer.on('upgrade', function (req, socket, head) {
                                    var ssl = true;
                                    _this.upgradeHandler(req, socket, head, ssl);
                                });
                            })];
                }
            });
        });
    };
    FakeServersCenter.prototype.reRankServer = function (index) {
        // index ==> queue foot
        this.queue.push(this.queue.splice(index, 1)[0]);
    };
    FakeServersCenter.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, server;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = Array.from(this.fakeServers);
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        server = _a[_i];
                        return [4 /*yield*/, util_1.promisify(server.close).call(server)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return FakeServersCenter;
}());
exports.FakeServersCenter = FakeServersCenter;
//# sourceMappingURL=fake-servers-center.js.map