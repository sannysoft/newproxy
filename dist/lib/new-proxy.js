"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewProxy = void 0;
const http = require("http");
const chalk = require("chalk");
const create_upgrade_handler_1 = require("./mitmproxy/create-upgrade-handler");
const create_connect_handler_1 = require("./mitmproxy/create-connect-handler");
const create_request_handler_1 = require("./mitmproxy/create-request-handler");
const fake_servers_center_1 = require("./tls/fake-servers-center");
const context_1 = require("./types/contexts/context");
const context_no_mitm_1 = require("./types/contexts/context-no-mitm");
class NewProxy {
    constructor(proxyConfig, logger) {
        this.proxyConfig = proxyConfig;
        this.logger = logger;
        this.httpServer = new http.Server();
        this.serverSockets = new Set();
        this.requestHandler = create_request_handler_1.createRequestHandler(this.proxyConfig, logger);
        this.upgradeHandler = create_upgrade_handler_1.createUpgradeHandler(this.proxyConfig, logger);
        this.connectHandler = create_connect_handler_1.createConnectHandler(this.proxyConfig, this.fakeServersCenter, this.logger);
    }
    get fakeServersCenter() {
        if (!this._fakeServersCenter) {
            this._fakeServersCenter = new fake_servers_center_1.FakeServersCenter(this.proxyConfig, this.requestHandler, this.upgradeHandler, this.logger);
        }
        return this._fakeServersCenter;
    }
    run() {
        // Don't reject unauthorized
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        return new Promise((resolve, reject) => {
            this.httpServer.once('error', (error) => {
                reject(error);
            });
            this.httpServer.listen(this.proxyConfig.port, () => {
                this.logger.log(`NewProxy is listening on port ${this.proxyConfig.port}`, chalk.green);
                this.httpServer.on('error', (e) => {
                    this.logger.logError(e);
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
        var _a, _b;
        // Destroy all open sockets first
        this.serverSockets.forEach((socket) => {
            socket.destroy();
        });
        this.serverSockets = new Set();
        const promise = (_b = (_a = this.fakeServersCenter) === null || _a === void 0 ? void 0 : _a.close()) !== null && _b !== void 0 ? _b : Promise.resolve();
        await Promise.all([this.closeServer(), promise]);
    }
    closeServer() {
        return new Promise((resolve, reject) => {
            this.httpServer.close((err) => {
                if (err)
                    reject(err);
                resolve();
            });
        });
    }
}
exports.NewProxy = NewProxy;
//# sourceMappingURL=new-proxy.js.map