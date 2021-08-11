"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestHandler = void 0;
const http_1 = require("http");
const http = require("http");
const https = require("https");
const Debug = require("debug");
const common_utils_1 = require("../common/common-utils");
const contexts_1 = require("../common/contexts");
const util_fns_1 = require("../common/util-fns");
const request_timeout_error_1 = require("../errors/request-timeout-error");
const types_1 = require("../types/types");
const internalLogger = Debug('newproxy:requestHandler');
class RequestHandler {
    constructor(context, proxyConfig, logger) {
        var _a;
        this.context = context;
        this.proxyConfig = proxyConfig;
        this.logger = logger;
        this.req = context.clientReq;
        this.res = (_a = context.clientRes) !== null && _a !== void 0 ? _a : util_fns_1.makeErr('No clientResponse set in context');
        this.rOptions = common_utils_1.CommonUtils.getOptionsFromRequest(this.context, this.proxyConfig, logger);
    }
    async go() {
        var _a;
        internalLogger(`Request handler called for request (ssl=${this.context.ssl}) ${this.req.toString()}`);
        if (this.res.finished) {
            return;
        }
        this.setKeepAlive();
        try {
            try {
                await this.interceptRequest();
            }
            catch (error) {
                this.logger.logError(error, 'Problem at request interception');
                if (!this.res.finished) {
                    this.context.setStatusCode(502);
                    this.res.writeHead(502);
                    this.res.write(`Proxy Warning:\r\n\r\n${error.toString()}`);
                    this.res.end();
                }
            }
            if (this.res.finished) {
                return;
            }
            try {
                const proxyRequestPromise = this.getProxyRequestPromise();
                this.proxyRes = await proxyRequestPromise;
                this.context.setStatusCode((_a = this.proxyRes) === null || _a === void 0 ? void 0 : _a.statusCode, this.proxyRes.socket.bytesWritten, this.proxyRes.socket.bytesRead);
            }
            catch (error) {
                this.logger.logError(error, 'Problem at request processing');
                if (this.res.finished) {
                    return;
                }
                if (error instanceof request_timeout_error_1.RequestTimeoutError) {
                    this.context.setStatusCode(504);
                    this.res.writeHead(504);
                }
                else {
                    this.context.setStatusCode(502);
                    this.res.writeHead(502);
                }
                this.res.write(`Proxy Error:\r\n\r\n${error.toString()}`);
                this.res.end();
            }
            if (this.res.finished) {
                return;
            }
            try {
                await this.interceptResponse();
            }
            catch (error) {
                this.logger.logError(error, 'Problem with response interception');
                if (!this.res.finished) {
                    this.res.writeHead(500);
                    this.res.write(`Proxy Warning:\r\n\r\n${error.toString()}`);
                    this.res.end();
                }
            }
            if (this.res.finished) {
                return;
            }
            this.sendHeadersAndPipe();
        }
        catch (error) {
            if (!this.res.finished) {
                if (!this.res.headersSent)
                    this.res.writeHead(500);
                this.res.write(`Proxy Warning:\r\n\r\n ${error.toString()}`);
                this.res.end();
            }
            this.logger.logError(error);
        }
    }
    sendHeadersAndPipe() {
        if (!this.proxyRes)
            util_fns_1.makeErr('No proxy res');
        const proxyRes = this.proxyRes;
        if (this.res.headersSent) {
            internalLogger('Headers sent already');
        }
        else {
            // prevent duplicate set headers
            Object.keys(proxyRes.headers).forEach((key) => {
                try {
                    let headerName = key;
                    const headerValue = proxyRes.headers[headerName];
                    if (headerValue) {
                        // https://github.com/nodejitsu/node-http-proxy/issues/362
                        if (/^www-authenticate$/i.test(headerName)) {
                            if (proxyRes.headers[headerName]) {
                                // @ts-ignore
                                proxyRes.headers[headerName] =
                                    headerValue && typeof headerValue === 'string' && headerValue.split(',');
                            }
                            headerName = 'www-authenticate';
                        }
                        this.res.setHeader(headerName, headerValue);
                    }
                }
                catch (error) {
                    internalLogger(`Error sending header: ${error}`);
                }
            });
            if (proxyRes.statusCode) {
                this.res.writeHead(proxyRes.statusCode);
            }
        }
        if (!this.res.finished)
            try {
                internalLogger('Start piping');
                proxyRes.pipe(this.res);
            }
            catch (error) {
                internalLogger(`Piping error: ${error.message}`);
            }
    }
    getProxyRequestPromise() {
        const self = this;
        return new Promise((resolve, reject) => {
            this.rOptions.host = this.rOptions.hostname || this.rOptions.host || 'localhost';
            // use the bind socket for NTLM
            const onFree = () => {
                self.proxyReq = (self.rOptions.protocol === 'https:' ? https : http).request(self.rOptions, (proxyRes) => {
                    resolve(proxyRes);
                });
                const timeout = self.rOptions.timeout || 60000;
                self.proxyReq.on('socket', (socket) => {
                    socket.setTimeout(timeout, () => { });
                });
                self.proxyReq.setSocketKeepAlive(true, 5000);
                self.proxyReq.setTimeout(timeout, () => { });
                self.proxyReq.on('timeout', () => {
                    internalLogger(`ProxyRequest timeout for ${self.req.toString()}`);
                    reject(new request_timeout_error_1.RequestTimeoutError(`${self.rOptions.host}:${self.rOptions.port}`, timeout));
                });
                self.proxyReq.on('error', (e) => {
                    internalLogger(`ProxyRequest error: ${e.message}`);
                    reject(e);
                });
                self.proxyReq.on('aborted', () => {
                    internalLogger(`ProxyRequest aborted for ${self.req.toString()}`);
                    reject(new Error('Proxy server aborted the request'));
                    // TODO: Check if it's ok
                    // @ts-ignore
                    self.req.abort();
                });
                self.req.on('aborted', () => {
                    var _a;
                    internalLogger(`Request aborted ${self.req.toString}`);
                    // eslint-disable-next-line no-unused-expressions
                    (_a = self.proxyReq) === null || _a === void 0 ? void 0 : _a.abort();
                });
                self.req.pipe(self.proxyReq);
            };
            if (this.rOptions.agent &&
                this.rOptions.agent instanceof http_1.Agent &&
                types_1.isPresent(this.rOptions.customSocketId) &&
                this.rOptions.agent.getName) {
                // @ts-ignore
                logger(`Request started with agent ${this.req.toString}`);
                const socketName = this.rOptions.agent.getName(this.rOptions);
                const bindingSocket = this.rOptions.agent.sockets[socketName];
                if (bindingSocket && bindingSocket.length > 0) {
                    bindingSocket[0].once('free', onFree);
                    return;
                }
            }
            onFree();
        });
    }
    interceptRequest() {
        return new Promise((resolve, reject) => {
            var _a;
            const next = () => {
                resolve();
            };
            try {
                if (typeof this.proxyConfig.requestInterceptor === 'function') {
                    const connectKey = `${this.req.socket.remotePort}:${this.req.socket.localPort}`;
                    this.proxyConfig.requestInterceptor.call(null, this.rOptions, this.req, this.res, this.context.ssl, (_a = contexts_1.contexts[connectKey]) === null || _a === void 0 ? void 0 : _a.connectRequest, next);
                }
                else {
                    resolve();
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    interceptResponse() {
        return new Promise((resolve, reject) => {
            var _a, _b;
            const next = () => {
                resolve();
            };
            try {
                if (typeof this.proxyConfig.responseInterceptor === 'function') {
                    this.proxyConfig.responseInterceptor.call(null, this.req, this.res, (_a = this.proxyReq) !== null && _a !== void 0 ? _a : util_fns_1.makeErr('No proxyReq'), (_b = this.proxyRes) !== null && _b !== void 0 ? _b : util_fns_1.makeErr('No proxyRes'), this.context.ssl, next);
                }
                else {
                    resolve();
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    setKeepAlive() {
        var _a;
        if (((_a = this.rOptions.headers) === null || _a === void 0 ? void 0 : _a.connection) === 'close') {
            this.req.socket.setKeepAlive(false);
        }
        else if (this.rOptions.customSocketId != null) {
            // for NTLM
            this.req.socket.setKeepAlive(true, 60 * 60 * 1000);
        }
        else {
            this.req.socket.setKeepAlive(true, 30000);
        }
    }
}
exports.RequestHandler = RequestHandler;
//# sourceMappingURL=request-handler.js.map