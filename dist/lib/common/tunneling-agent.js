"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TunnelingAgent = void 0;
// @ts-ignore
const TunnelAgent = require("@postman/tunnel-agent");
const ts_hashcode_1 = require("ts-hashcode");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 60, useClones: false });
class TunnelingAgent {
    static getTunnelAgent(isSsl, externalProxyHelper) {
        var _a;
        const urlObject = externalProxyHelper.getUrlObject();
        const externalProxyProtocol = urlObject.protocol || 'http:';
        const port = Number((_a = urlObject === null || urlObject === void 0 ? void 0 : urlObject.port) !== null && _a !== void 0 ? _a : (externalProxyProtocol === 'http:' ? 80 : 443));
        const hostname = urlObject.hostname || 'localhost';
        const tunnelConfig = {
            proxy: {
                host: hostname,
                port: port,
            },
        };
        const auth = externalProxyHelper.getLoginAndPassword();
        if (auth) {
            // @ts-ignore
            tunnelConfig.proxy.proxyAuth = auth;
        }
        const externalProxyHostCache = (isSsl ? '1' : '0') + externalProxyProtocol + ts_hashcode_1.default(tunnelConfig);
        const cachedTunnel = myCache.get(externalProxyHostCache);
        if (cachedTunnel)
            return cachedTunnel;
        const newTunnel = this.getNewTunnel(isSsl, externalProxyProtocol, tunnelConfig);
        myCache.set(externalProxyHostCache, newTunnel, 15 * 60 * 1000 /* 15 minutes */);
        return newTunnel;
    }
    static getNewTunnel(isSsl, externalProxyProtocol, tunnelConfig) {
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
    }
}
exports.TunnelingAgent = TunnelingAgent;
//# sourceMappingURL=tunneling-agent.js.map