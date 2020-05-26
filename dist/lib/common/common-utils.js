"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonUtils = exports.makeErr = void 0;
var url = require("url");
// @ts-ignore
var tunnelAgent = require("tunnel-agent");
var AgentKeepAlive = require("agentkeepalive");
var logger_1 = require("./logger");
var external_proxy_config_1 = require("../types/external-proxy-config");
var connections_1 = require("./connections");
var httpsAgent = new AgentKeepAlive.HttpsAgent({
    keepAlive: true,
    timeout: 60000,
});
var httpAgent = new AgentKeepAlive({
    keepAlive: true,
    timeout: 60000,
});
var socketId = 0;
var httpsOverHttpAgent;
var httpOverHttpsAgent;
var httpsOverHttpsAgent;
function makeErr(message) {
    throw new Error(message);
}
exports.makeErr = makeErr;
var CommonUtils = /** @class */ (function () {
    function CommonUtils() {
    }
    CommonUtils.getOptionsFromRequest = function (req, ssl, externalProxy, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var urlObject = url.parse((_a = req === null || req === void 0 ? void 0 : req.url) !== null && _a !== void 0 ? _a : makeErr('No URL set for the request'));
        var defaultPort = ssl ? 443 : 80;
        var protocol = ssl ? 'https:' : 'http:';
        var headers = Object.assign({}, req.headers);
        var externalProxyHelper = null;
        try {
            externalProxyHelper = this.getExternalProxyHelper(externalProxy, req, ssl, res);
        }
        catch (error) {
            logger_1.logError(error, 'Wrong external proxy set');
        }
        delete headers['proxy-connection'];
        var agent = false;
        if (!externalProxyHelper) {
            // keepAlive
            if (headers.connection !== 'close') {
                if (protocol === 'https:') {
                    agent = httpsAgent;
                }
                else {
                    agent = httpAgent;
                }
                headers.connection = 'keep-alive';
            }
        }
        else {
            agent = CommonUtils.getTunnelAgent(protocol === 'https:', externalProxyHelper);
        }
        var requestHost = (_c = (_b = req.headers) === null || _b === void 0 ? void 0 : _b.host) !== null && _c !== void 0 ? _c : makeErr('No request hostname set');
        var options = {
            protocol: protocol,
            hostname: requestHost.split(':')[0],
            method: (_d = req.method) !== null && _d !== void 0 ? _d : makeErr('No request method set'),
            port: Number(requestHost.split(':')[1] || defaultPort),
            path: (_e = urlObject.path) !== null && _e !== void 0 ? _e : makeErr('No request path set'),
            headers: req.headers,
            agent: agent,
            url: protocol + "//" + requestHost + ((_f = urlObject.path) !== null && _f !== void 0 ? _f : ''),
        };
        try {
            if (protocol === 'http:' &&
                externalProxyHelper &&
                externalProxyHelper.getProtocol() === 'http:') {
                var externalURL = externalProxyHelper.getUrlObject();
                var host = (_g = externalURL.hostname) !== null && _g !== void 0 ? _g : makeErr("No external proxy hostname set - " + externalProxy);
                var port = Number((_h = externalURL.port) !== null && _h !== void 0 ? _h : makeErr("No external proxy port set - " + externalProxy));
                options.hostname = host;
                options.port = port;
                // support non-transparent proxy
                options.path = "http://" + urlObject.host + urlObject.path;
            }
        }
        catch (error) {
            logger_1.logError(error, 'External proxy parsing problem');
        }
        // TODO: Check if we ever have customSocketId
        // mark a socketId for Agent to bind socket for NTLM
        // @ts-ignore
        if (req.socket.customSocketId) {
            // @ts-ignore
            options.customSocketId = req.socket.customSocketId;
        }
        else if (headers.authorization) {
            // @ts-ignore
            req.socket.customSocketId = socketId++;
            // @ts-ignore
            options.customSocketId = req.socket.customSocketId;
        }
        return options;
    };
    CommonUtils.getExternalProxyHelper = function (externalProxy, req, ssl, res) {
        var externalProxyConfig;
        if (externalProxy) {
            if (typeof externalProxy === 'string') {
                externalProxyConfig = externalProxy;
            }
            else if (typeof externalProxy === 'function') {
                var connectKey = req.socket.remotePort + ":" + req.socket.localPort;
                externalProxyConfig = externalProxy(req, ssl, res, connections_1.default[connectKey]);
            }
        }
        if (externalProxyConfig)
            return new external_proxy_config_1.ExternalProxyHelper(externalProxyConfig);
        return undefined;
    };
    CommonUtils.getTunnelAgent = function (isSsl, externalProxyHelper) {
        var _a;
        var urlObject = externalProxyHelper.getUrlObject();
        var externalProxyProtocol = urlObject.protocol || 'http:';
        var port = Number((_a = urlObject === null || urlObject === void 0 ? void 0 : urlObject.port) !== null && _a !== void 0 ? _a : (externalProxyProtocol === 'http:' ? 80 : 443));
        var hostname = urlObject.hostname || 'localhost';
        var tunnelConfig = {
            proxy: {
                host: hostname,
                port: port,
            },
        };
        var auth = externalProxyHelper.getLoginAndPassword();
        if (auth) {
            // @ts-ignore
            tunnelConfig.proxy.proxyAuth = auth;
        }
        if (isSsl) {
            if (externalProxyProtocol === 'http:') {
                if (!httpsOverHttpAgent) {
                    httpsOverHttpAgent = tunnelAgent.httpsOverHttp(tunnelConfig);
                }
                return httpsOverHttpAgent;
            }
            if (!httpsOverHttpsAgent) {
                httpsOverHttpsAgent = tunnelAgent.httpsOverHttps(tunnelConfig);
            }
            return httpsOverHttpsAgent;
        }
        if (externalProxyProtocol === 'http:') {
            // if (!httpOverHttpAgent) {
            //     httpOverHttpAgent = tunnelAgent.httpOverHttp(tunnelConfig);
            // }
            return false;
        }
        if (!httpOverHttpsAgent) {
            httpOverHttpsAgent = tunnelAgent.httpOverHttps(tunnelConfig);
        }
        return httpOverHttpsAgent;
    };
    return CommonUtils;
}());
exports.CommonUtils = CommonUtils;
//# sourceMappingURL=common-utils.js.map