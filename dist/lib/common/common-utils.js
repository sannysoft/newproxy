"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonUtils = void 0;
var url = require("url");
var AgentKeepAlive = require("agentkeepalive");
var logger_1 = require("./logger");
var external_proxy_config_1 = require("../types/external-proxy-config");
var contexts_1 = require("./contexts");
var tunneling_agent_1 = require("./tunneling-agent");
var util_fns_1 = require("./util-fns");
var httpsAgent = new AgentKeepAlive.HttpsAgent({
    keepAlive: true,
    timeout: 60000,
});
var httpAgent = new AgentKeepAlive({
    keepAlive: true,
    timeout: 60000,
});
var socketId = 0;
var CommonUtils = /** @class */ (function () {
    function CommonUtils() {
    }
    CommonUtils.getOptionsFromRequest = function (context, proxyConfig) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var urlObject = url.parse((_b = (_a = context.clientReq) === null || _a === void 0 ? void 0 : _a.url) !== null && _b !== void 0 ? _b : util_fns_1.makeErr('No URL set for the request'));
        var defaultPort = context.ssl ? 443 : 80;
        var protocol = context.ssl ? 'https:' : 'http:';
        var headers = __assign({}, context.clientReq.headers);
        var externalProxyHelper;
        try {
            externalProxyHelper = this.getExternalProxyHelper(context, proxyConfig);
            // eslint-disable-next-line no-param-reassign
            context.externalProxy = externalProxyHelper === null || externalProxyHelper === void 0 ? void 0 : externalProxyHelper.getConfigObject();
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
        var requestHost = (_c = headers === null || headers === void 0 ? void 0 : headers.host) !== null && _c !== void 0 ? _c : util_fns_1.makeErr('No request hostname set');
        var options = {
            protocol: protocol,
            hostname: requestHost.split(':')[0],
            method: (_d = context.clientReq.method) !== null && _d !== void 0 ? _d : util_fns_1.makeErr('No request method set'),
            port: Number(requestHost.split(':')[1] || defaultPort),
            path: (_e = urlObject.path) !== null && _e !== void 0 ? _e : util_fns_1.makeErr('No request path set'),
            headers: headers,
            agent: agent,
            timeout: 60000,
            url: protocol + "//" + requestHost + ((_f = urlObject.path) !== null && _f !== void 0 ? _f : ''),
        };
        try {
            if (protocol === 'http:' &&
                externalProxyHelper &&
                externalProxyHelper.getProtocol() === 'http:') {
                var externalURL = externalProxyHelper.getUrlObject();
                var host = (_g = externalURL.hostname) !== null && _g !== void 0 ? _g : util_fns_1.makeErr("No external proxy hostname set - " + context.externalProxy);
                var port = Number((_h = externalURL.port) !== null && _h !== void 0 ? _h : util_fns_1.makeErr("No external proxy port set - " + context.externalProxy));
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
        if (context.clientReq.socket.customSocketId) {
            // @ts-ignore
            options.customSocketId = context.clientReq.socket.customSocketId;
        }
        else if (headers.authorization) {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            context.clientReq.socket.customSocketId = socketId++;
            // @ts-ignore
            options.customSocketId = context.clientReq.socket.customSocketId;
        }
        return options;
    };
    CommonUtils.getExternalProxyHelper = function (context, proxyConfig) {
        var _a;
        var externalProxyConfig;
        var externalProxy = proxyConfig.externalProxy;
        var req = context.clientReq;
        if (externalProxy) {
            if (typeof externalProxy === 'string' || external_proxy_config_1.isExternalProxyConfigObject(externalProxy)) {
                externalProxyConfig = externalProxy;
            }
            else if (typeof externalProxy === 'function') {
                var connectKey = req.socket.remotePort + ":" + req.socket.localPort;
                externalProxyConfig = externalProxy(req, context.ssl, context.clientRes, (_a = contexts_1.default[connectKey]) === null || _a === void 0 ? void 0 : _a.connectRequest);
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