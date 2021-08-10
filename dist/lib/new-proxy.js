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
var http = require("http");
var chalk = require("chalk");
var util_1 = require("util");
var tls_utils_1 = require("./tls/tls-utils");
var create_upgrade_handler_1 = require("./mitmproxy/create-upgrade-handler");
var create_fake_server_center_1 = require("./mitmproxy/create-fake-server-center");
var create_connect_handler_1 = require("./mitmproxy/create-connect-handler");
var create_request_handler_1 = require("./mitmproxy/create-request-handler");
var ca_config_1 = require("./common/ca-config");
var logger_1 = require("./common/logger");
var util_fns_1 = require("./common/util-fns");
var context_1 = require("./types/contexts/context");
var context_no_mitm_1 = require("./types/contexts/context-no-mitm");
// eslint-disable-next-line import/no-default-export
var NewProxy = /** @class */ (function () {
    function NewProxy(userProxyConfig) {
        if (userProxyConfig === void 0) { userProxyConfig = {}; }
        this.serverSockets = new Set();
        this.proxyConfig = NewProxy.setDefaultsForConfig(userProxyConfig);
        this.httpServer = new http.Server();
    }
    NewProxy.prototype.port = function (port) {
        this.proxyConfig.port = port;
        return this;
    };
    NewProxy.prototype.sslMitm = function (value) {
        this.proxyConfig.sslMitm = value;
        return this;
    };
    NewProxy.prototype.requestInterceptor = function (value) {
        this.proxyConfig.requestInterceptor = value;
        return this;
    };
    NewProxy.prototype.responseInterceptor = function (value) {
        this.proxyConfig.responseInterceptor = value;
        return this;
    };
    NewProxy.prototype.log = function (value) {
        this.proxyConfig.log = value;
        return this;
    };
    NewProxy.prototype.metrics = function (value) {
        this.proxyConfig.statusFn = value;
        return this;
    };
    NewProxy.prototype.errorLog = function (value) {
        this.proxyConfig.errorLog = value;
        return this;
    };
    NewProxy.prototype.ca = function (caKeyPath, caCertPath) {
        this.proxyConfig.caKeyPath = caKeyPath;
        this.proxyConfig.caCertPath = caCertPath;
        return this;
    };
    NewProxy.prototype.externalProxy = function (value) {
        this.proxyConfig.externalProxy = value;
        return this;
    };
    NewProxy.prototype.externalProxyNoMitm = function (value) {
        this.proxyConfig.externalProxyNoMitm = value;
        return this;
    };
    NewProxy.setDefaultsForConfig = function (userConfig) {
        var caCertPath = userConfig.caCertPath, caKeyPath = userConfig.caKeyPath;
        if (!userConfig.caCertPath || !userConfig.caKeyPath) {
            var rs = tls_utils_1.TlsUtils.initCA(ca_config_1.caConfig.getDefaultCABasePath());
            caCertPath = rs.caCertPath;
            caKeyPath = rs.caKeyPath;
            if (rs.create) {
                logger_1.log("CA Cert saved in: " + caCertPath, chalk.cyan);
                logger_1.log("CA private key saved in: " + caKeyPath, chalk.cyan);
            }
        }
        return {
            port: userConfig.port || 6789,
            log: userConfig.log || true,
            errorLog: userConfig.errorLog || true,
            statusFn: userConfig.statusFn || undefined,
            statusNoMitmFn: userConfig.statusNoMitmFn || undefined,
            sslMitm: userConfig.sslMitm || undefined,
            requestInterceptor: userConfig.requestInterceptor || undefined,
            responseInterceptor: userConfig.responseInterceptor || undefined,
            getCertSocketTimeout: userConfig.getCertSocketTimeout || 10000,
            externalProxy: userConfig.externalProxy || undefined,
            externalProxyNoMitm: userConfig.externalProxyNoMitm || undefined,
            caCertPath: caCertPath !== null && caCertPath !== void 0 ? caCertPath : util_fns_1.makeErr('No caCertPath'),
            caKeyPath: caKeyPath !== null && caKeyPath !== void 0 ? caKeyPath : util_fns_1.makeErr('No caKeyPath'),
        };
    };
    NewProxy.prototype.setup = function () {
        var _a;
        this.proxyConfig = NewProxy.setDefaultsForConfig(this.proxyConfig);
        logger_1.setLoggerConfig(this.proxyConfig.log);
        logger_1.setErrorLoggerConfig(this.proxyConfig.errorLog);
        this.requestHandler = create_request_handler_1.createRequestHandler(this.proxyConfig);
        this.upgradeHandler = create_upgrade_handler_1.createUpgradeHandler(this.proxyConfig);
        (_a = this.fakeServersCenter) === null || _a === void 0 ? void 0 : _a.close().then(function () { }).catch(function () { });
        this.fakeServersCenter = create_fake_server_center_1.createFakeServerCenter(this.proxyConfig, this.requestHandler, this.upgradeHandler);
        this.connectHandler = create_connect_handler_1.createConnectHandler(this.proxyConfig, this.fakeServersCenter);
    };
    NewProxy.prototype.run = function () {
        var _this = this;
        // Don't reject unauthorized
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        this.setup();
        return new Promise(function (resolve, reject) {
            _this.httpServer.once('error', function (error) {
                reject(error);
            });
            _this.httpServer.listen(_this.proxyConfig.port, function () {
                logger_1.log("NewProxy is listening on port " + _this.proxyConfig.port, chalk.green);
                _this.httpServer.on('error', function (e) {
                    logger_1.logError(e);
                });
                _this.httpServer.on('request', function (req, res) {
                    // Plain HTTP request
                    var context = new context_1.Context(req, res, false);
                    _this.requestHandler(context);
                });
                // tunneling for https
                _this.httpServer.on('connect', function (connectRequest, clientSocket, head) {
                    clientSocket.on('error', function () { });
                    var context = new context_no_mitm_1.ContextNoMitm(connectRequest, clientSocket, head);
                    _this.connectHandler(context);
                });
                _this.httpServer.on('connection', function (socket) {
                    _this.serverSockets.add(socket);
                    socket.on('close', function () {
                        _this.serverSockets.delete(socket);
                    });
                });
                // TODO: handle WebSocket
                _this.httpServer.on('upgrade', function (req, socket, head) {
                    var ssl = false;
                    _this.upgradeHandler(req, socket, head, ssl);
                });
                resolve();
            });
        });
    };
    NewProxy.prototype.stop = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Destroy all open sockets first
                        this.serverSockets.forEach(function (socket) {
                            socket.destroy();
                        });
                        this.serverSockets = new Set();
                        return [4 /*yield*/, Promise.all([
                                util_1.promisify(this.httpServer.close).call(this.httpServer),
                                (_a = this.fakeServersCenter) === null || _a === void 0 ? void 0 : _a.close(),
                            ])];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return NewProxy;
}());
exports.default = NewProxy;
//# sourceMappingURL=new-proxy.js.map