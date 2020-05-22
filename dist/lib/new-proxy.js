"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var chalk_1 = require("chalk");
var tls_utils_1 = require("./tls/tls-utils");
var create_upgrade_handler_1 = require("./mitmproxy/create-upgrade-handler");
var create_fake_server_center_1 = require("./mitmproxy/create-fake-server-center");
var create_connect_handler_1 = require("./mitmproxy/create-connect-handler");
var create_request_handler_1 = require("./mitmproxy/create-request-handler");
var ca_config_1 = require("./common/ca-config");
var logger_1 = require("./common/logger");
var common_utils_1 = require("./common/common-utils");
// eslint-disable-next-line import/no-default-export
var NewProxy = /** @class */ (function () {
    function NewProxy(userProxyConfig) {
        if (userProxyConfig === void 0) { userProxyConfig = {}; }
        this.proxyConfig = NewProxy.setDefaultsForConfig(userProxyConfig);
        this.server = new http.Server();
    }
    NewProxy.prototype.port = function (port) {
        this.proxyConfig.port = port;
        return this;
    };
    NewProxy.prototype.sslConnectInterceptor = function (value) {
        this.proxyConfig.sslConnectInterceptor = value;
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
    NewProxy.setDefaultsForConfig = function (userConfig) {
        var caCertPath = userConfig.caCertPath, caKeyPath = userConfig.caKeyPath;
        if (!userConfig.caCertPath || !userConfig.caKeyPath) {
            var rs = tls_utils_1.default.initCA(ca_config_1.caConfig.getDefaultCABasePath());
            caCertPath = rs.caCertPath;
            caKeyPath = rs.caKeyPath;
            if (rs.create) {
                logger_1.log("CA Cert saved in: " + caCertPath, chalk_1.default.cyan);
                logger_1.log("CA private key saved in: " + caKeyPath, chalk_1.default.cyan);
            }
        }
        return {
            port: userConfig.port || 6789,
            log: userConfig.log || true,
            errorLog: userConfig.errorLog || true,
            sslConnectInterceptor: userConfig.sslConnectInterceptor || undefined,
            requestInterceptor: userConfig.requestInterceptor || undefined,
            responseInterceptor: userConfig.responseInterceptor || undefined,
            getCertSocketTimeout: userConfig.getCertSocketTimeout || 10000,
            externalProxy: userConfig.externalProxy || null,
            caCertPath: caCertPath !== null && caCertPath !== void 0 ? caCertPath : common_utils_1.makeErr('No caCertPath'),
            caKeyPath: caKeyPath !== null && caKeyPath !== void 0 ? caKeyPath : common_utils_1.makeErr('No caKeyPath'),
        };
    };
    NewProxy.prototype.setup = function () {
        this.proxyConfig = NewProxy.setDefaultsForConfig(this.proxyConfig);
        logger_1.setLoggerConfig(this.proxyConfig.log);
        logger_1.setErrorLoggerConfig(this.proxyConfig.errorLog);
        this.requestHandler = create_request_handler_1.createRequestHandler(this.proxyConfig);
        this.upgradeHandler = create_upgrade_handler_1.createUpgradeHandler(this.proxyConfig);
        this.fakeServersCenter = create_fake_server_center_1.createFakeServerCenter(this.proxyConfig, this.requestHandler, this.upgradeHandler);
        this.connectHandler = create_connect_handler_1.createConnectHandler(this.proxyConfig.sslConnectInterceptor, this.fakeServersCenter);
    };
    NewProxy.prototype.run = function () {
        var _this = this;
        // Don't reject unauthorized
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        this.setup();
        this.server.listen(this.proxyConfig.port, function () {
            logger_1.log("NewProxy is listening on port " + _this.proxyConfig.port, chalk_1.default.green);
            _this.server.on('error', function (e) {
                logger_1.logError(e);
            });
            _this.server.on('request', function (req, res) {
                var ssl = false;
                _this.requestHandler(req, res, ssl);
            });
            // tunneling for https
            _this.server.on('connect', function (req, clientSocket, head) {
                clientSocket.on('error', function () { });
                _this.connectHandler(req, clientSocket, head);
            });
            // TODO: handle WebSocket
            _this.server.on('upgrade', function (req, socket, head) {
                var ssl = false;
                _this.upgradeHandler(req, socket, head, ssl);
            });
        });
    };
    NewProxy.prototype.stop = function () {
        this.server.close(function () { });
    };
    return NewProxy;
}());
exports.default = NewProxy;
//# sourceMappingURL=new-proxy.js.map