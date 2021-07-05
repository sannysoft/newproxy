"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var chalk = require("chalk");
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
var util_1 = require("util");
// eslint-disable-next-line import/no-default-export
var NewProxy = /** @class */ (function () {
    function NewProxy(userProxyConfig) {
        if (userProxyConfig === void 0) { userProxyConfig = {}; }
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
            var rs = tls_utils_1.default.initCA(ca_config_1.caConfig.getDefaultCABasePath());
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
        this.proxyConfig = NewProxy.setDefaultsForConfig(this.proxyConfig);
        logger_1.setLoggerConfig(this.proxyConfig.log);
        logger_1.setErrorLoggerConfig(this.proxyConfig.errorLog);
        this.requestHandler = create_request_handler_1.createRequestHandler(this.proxyConfig);
        this.upgradeHandler = create_upgrade_handler_1.createUpgradeHandler(this.proxyConfig);
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
                    clientSocket.on('error', function () {
                    });
                    var context = new context_no_mitm_1.ContextNoMitm(connectRequest, clientSocket, head);
                    _this.connectHandler(context);
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
        return util_1.promisify(this.httpServer.close).call(this.httpServer);
    };
    return NewProxy;
}());
exports.default = NewProxy;
//# sourceMappingURL=new-proxy.js.map