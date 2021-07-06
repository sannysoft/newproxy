"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TunnelingAgent = void 0;
// @ts-ignore
var TunnelAgent = require("@postman/tunnel-agent");
var ts_hashcode_1 = require("ts-hashcode");
var NodeCache = require("node-cache");
var myCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 60, useClones: false });
var TunnelingAgent = /** @class */ (function () {
    function TunnelingAgent() {
    }
    TunnelingAgent.getTunnelAgent = function (isSsl, externalProxyHelper) {
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
        var externalProxyHostCache = (isSsl ? '1' : '0') + externalProxyProtocol + ts_hashcode_1.default(tunnelConfig);
        var cachedTunnel = myCache.get(externalProxyHostCache);
        if (cachedTunnel)
            return cachedTunnel;
        var newTunnel = this.getNewTunnel(isSsl, externalProxyProtocol, tunnelConfig);
        myCache.set(externalProxyHostCache, newTunnel, 15 * 60 * 1000 /* 15 minutes */);
        return newTunnel;
    };
    TunnelingAgent.getNewTunnel = function (isSsl, externalProxyProtocol, tunnelConfig) {
        if (isSsl) {
            if (externalProxyProtocol === 'http:') {
                return TunnelAgent.httpsOverHttp(tunnelConfig);
            }
            return TunnelAgent.httpsOverHttps(tunnelConfig);
        }
        if (externalProxyProtocol === 'http:') {
            // if (!httpOverHttpAgent) {
            //     httpOverHttpAgent = tunnelAgent.httpOverHttp(tunnelConfig);
            // }
            return false;
        }
        return TunnelAgent.httpOverHttps(tunnelConfig);
    };
    return TunnelingAgent;
}());
exports.TunnelingAgent = TunnelingAgent;
//# sourceMappingURL=tunneling-agent.js.map