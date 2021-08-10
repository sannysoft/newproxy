"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const chalk = require("chalk");
const util_1 = require("util");
const tls_utils_1 = require("./tls/tls-utils");
const create_upgrade_handler_1 = require("./mitmproxy/create-upgrade-handler");
const create_fake_server_center_1 = require("./mitmproxy/create-fake-server-center");
const create_connect_handler_1 = require("./mitmproxy/create-connect-handler");
const create_request_handler_1 = require("./mitmproxy/create-request-handler");
const ca_config_1 = require("./common/ca-config");
const logger_1 = require("./common/logger");
const util_fns_1 = require("./common/util-fns");
const context_1 = require("./types/contexts/context");
const context_no_mitm_1 = require("./types/contexts/context-no-mitm");
// eslint-disable-next-line import/no-default-export
class NewProxy {
    constructor(userProxyConfig = {}) {
        this.serverSockets = new Set();
        this.proxyConfig = NewProxy.setDefaultsForConfig(userProxyConfig);
        this.httpServer = new http.Server();
    }
    port(port) {
        this.proxyConfig.port = port;
        return this;
    }
    sslMitm(value) {
        this.proxyConfig.sslMitm = value;
        return this;
    }
    requestInterceptor(value) {
        this.proxyConfig.requestInterceptor = value;
        return this;
    }
    responseInterceptor(value) {
        this.proxyConfig.responseInterceptor = value;
        return this;
    }
    log(value) {
        this.proxyConfig.log = value;
        return this;
    }
    metrics(value) {
        this.proxyConfig.statusFn = value;
        return this;
    }
    errorLog(value) {
        this.proxyConfig.errorLog = value;
        return this;
    }
    ca(caKeyPath, caCertPath) {
        this.proxyConfig.caKeyPath = caKeyPath;
        this.proxyConfig.caCertPath = caCertPath;
        return this;
    }
    externalProxy(value) {
        this.proxyConfig.externalProxy = value;
        return this;
    }
    externalProxyNoMitm(value) {
        this.proxyConfig.externalProxyNoMitm = value;
        return this;
    }
    static setDefaultsForConfig(userConfig) {
        let { caCertPath, caKeyPath } = userConfig;
        if (!userConfig.caCertPath || !userConfig.caKeyPath) {
            const rs = tls_utils_1.TlsUtils.initCA(ca_config_1.caConfig.getDefaultCABasePath());
            caCertPath = rs.caCertPath;
            caKeyPath = rs.caKeyPath;
            if (rs.create) {
                logger_1.log(`CA Cert saved in: ${caCertPath}`, chalk.cyan);
                logger_1.log(`CA private key saved in: ${caKeyPath}`, chalk.cyan);
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
    }
    setup() {
        var _a;
        this.proxyConfig = NewProxy.setDefaultsForConfig(this.proxyConfig);
        logger_1.setLoggerConfig(this.proxyConfig.log);
        logger_1.setErrorLoggerConfig(this.proxyConfig.errorLog);
        this.requestHandler = create_request_handler_1.createRequestHandler(this.proxyConfig);
        this.upgradeHandler = create_upgrade_handler_1.createUpgradeHandler(this.proxyConfig);
        (_a = this.fakeServersCenter) === null || _a === void 0 ? void 0 : _a.close().then(() => { }).catch(() => { });
        this.fakeServersCenter = create_fake_server_center_1.createFakeServerCenter(this.proxyConfig, this.requestHandler, this.upgradeHandler);
        this.connectHandler = create_connect_handler_1.createConnectHandler(this.proxyConfig, this.fakeServersCenter);
    }
    run() {
        // Don't reject unauthorized
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        this.setup();
        return new Promise((resolve, reject) => {
            this.httpServer.once('error', (error) => {
                reject(error);
            });
            this.httpServer.listen(this.proxyConfig.port, () => {
                logger_1.log(`NewProxy is listening on port ${this.proxyConfig.port}`, chalk.green);
                this.httpServer.on('error', (e) => {
                    logger_1.logError(e);
                });
                this.httpServer.on('request', (req, res) => {
                    // Plain HTTP request
                    const context = new context_1.Context(req, res, false);
                    this.requestHandler(context);
                });
                // tunneling for https
                this.httpServer.on('connect', (connectRequest, clientSocket, head) => {
                    clientSocket.on('error', () => { });
                    const context = new context_no_mitm_1.ContextNoMitm(connectRequest, clientSocket, head);
                    this.connectHandler(context);
                });
                this.httpServer.on('connection', (socket) => {
                    this.serverSockets.add(socket);
                    socket.on('close', () => {
                        this.serverSockets.delete(socket);
                    });
                });
                // TODO: handle WebSocket
                this.httpServer.on('upgrade', (req, socket, head) => {
                    const ssl = false;
                    this.upgradeHandler(req, socket, head, ssl);
                });
                resolve();
            });
        });
    }
    async stop() {
        var _a;
        // Destroy all open sockets first
        this.serverSockets.forEach((socket) => {
            socket.destroy();
        });
        this.serverSockets = new Set();
        await Promise.all([
            util_1.promisify(this.httpServer.close).call(this.httpServer),
            (_a = this.fakeServersCenter) === null || _a === void 0 ? void 0 : _a.close(),
        ]);
    }
}
exports.default = NewProxy;
//# sourceMappingURL=new-proxy.js.map