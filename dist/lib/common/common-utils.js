"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonUtils = exports.makeErr = void 0;
var url = require("url");
var AgentKeepAlive = require("agentkeepalive");
var logger_1 = require("./logger");
var external_proxy_config_1 = require("../types/external-proxy-config");
var connections_1 = require("./connections");
var tunneling_agent_1 = require("./tunneling-agent");
var httpsAgent = new AgentKeepAlive.HttpsAgent({
    keepAlive: true,
    timeout: 60000,
});
var httpAgent = new AgentKeepAlive({
    keepAlive: true,
    timeout: 60000,
});
var socketId = 0;
function makeErr(message) {
    throw new Error(message);
}
exports.makeErr = makeErr;
var CommonUtils = /** @class */ (function () {
    function CommonUtils() {
    }
    CommonUtils.getOptionsFromRequest = function (req, ssl, externalProxy, res) {
        var _a, _b, _c, _d, _e, _f, _g;
        var urlObject = url.parse((_a = req === null || req === void 0 ? void 0 : req.url) !== null && _a !== void 0 ? _a : makeErr('No URL set for the request'));
        var defaultPort = ssl ? 443 : 80;
        var protocol = ssl ? 'https:' : 'http:';
        var headers = Object.assign({}, req.headers);
        var externalProxyHelper;
        try {
            externalProxyHelper = this.getExternalProxyHelper(externalProxy, req, ssl, res);
        }
        catch (error) {
            logger_1.logError(error, 'Wrong external proxy set');
        }
        delete headers['proxy-connection'];
        delete headers['proxy-authorization'];
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
            agent = tunneling_agent_1.TunnelingAgent.getTunnelAgent(protocol === 'https:', externalProxyHelper);
        }
        var requestHost = (_b = headers === null || headers === void 0 ? void 0 : headers.host) !== null && _b !== void 0 ? _b : makeErr('No request hostname set');
        var options = {
            protocol: protocol,
            hostname: requestHost.split(':')[0],
            method: (_c = req.method) !== null && _c !== void 0 ? _c : makeErr('No request method set'),
            port: Number(requestHost.split(':')[1] || defaultPort),
            path: (_d = urlObject.path) !== null && _d !== void 0 ? _d : makeErr('No request path set'),
            headers: headers,
            agent: agent,
            url: protocol + "//" + requestHost + ((_e = urlObject.path) !== null && _e !== void 0 ? _e : ''),
        };
        try {
            if (protocol === 'http:' &&
                externalProxyHelper &&
                externalProxyHelper.getProtocol() === 'http:') {
                var externalURL = externalProxyHelper.getUrlObject();
                var host = (_f = externalURL.hostname) !== null && _f !== void 0 ? _f : makeErr("No external proxy hostname set - " + externalProxy);
                var port = Number((_g = externalURL.port) !== null && _g !== void 0 ? _g : makeErr("No external proxy port set - " + externalProxy));
                options.hostname = host;
                options.port = port;
                // Check if we have authorization here
                var basicAuthString = externalProxyHelper.getBasicAuth();
                if (basicAuthString) {
                    if (!options.headers)
                        options.headers = {};
                    options.headers['Proxy-Authorization'] = "Basic " + basicAuthString;
                }
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
            if (typeof externalProxy === 'string' || external_proxy_config_1.isExternalProxyConfigObject(externalProxy)) {
                externalProxyConfig = externalProxy;
            }
            else if (typeof externalProxy === 'function') {
                var connectKey = req.socket.remotePort + ":" + req.socket.localPort;
                externalProxyConfig = externalProxy(req, ssl, res, connections_1.default[connectKey]);
                // Check return type is proper config
                if (externalProxyConfig &&
                    typeof externalProxyConfig !== 'string' &&
                    !external_proxy_config_1.isExternalProxyConfigObject(externalProxyConfig)) {
                    throw new TypeError('Invalid externalProxy config generated by external function');
                }
            }
            else {
                throw new TypeError('Invalid externalProxy config provided');
            }
        }
        if (externalProxyConfig)
            return new external_proxy_config_1.ExternalProxyHelper(externalProxyConfig);
        return undefined;
    };
    return CommonUtils;
}());
exports.CommonUtils = CommonUtils;
//# sourceMappingURL=common-utils.js.map