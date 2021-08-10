"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonUtils = void 0;
const url = require("url");
const AgentKeepAlive = require("agentkeepalive");
const logger_1 = require("./logger");
const external_proxy_config_1 = require("../types/external-proxy-config");
const contexts_1 = require("./contexts");
const tunneling_agent_1 = require("./tunneling-agent");
const util_fns_1 = require("./util-fns");
const httpsAgent = new AgentKeepAlive.HttpsAgent({
    keepAlive: true,
    timeout: 60000,
});
const httpAgent = new AgentKeepAlive({
    keepAlive: true,
    timeout: 60000,
});
let socketId = 0;
class CommonUtils {
    static getOptionsFromRequest(context, proxyConfig) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const urlObject = url.parse((_b = (_a = context.clientReq) === null || _a === void 0 ? void 0 : _a.url) !== null && _b !== void 0 ? _b : util_fns_1.makeErr('No URL set for the request'));
        const defaultPort = context.ssl ? 443 : 80;
        const protocol = context.ssl ? 'https:' : 'http:';
        const headers = { ...context.clientReq.headers };
        let externalProxyHelper;
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
        let agent = false;
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
        const requestHost = (_c = headers === null || headers === void 0 ? void 0 : headers.host) !== null && _c !== void 0 ? _c : util_fns_1.makeErr('No request hostname set');
        const options = {
            protocol: protocol,
            hostname: requestHost.split(':')[0],
            method: (_d = context.clientReq.method) !== null && _d !== void 0 ? _d : util_fns_1.makeErr('No request method set'),
            port: Number(requestHost.split(':')[1] || defaultPort),
            path: (_e = urlObject.path) !== null && _e !== void 0 ? _e : util_fns_1.makeErr('No request path set'),
            headers: headers,
            agent: agent,
            timeout: 60000,
            url: `${protocol}//${requestHost}${(_f = urlObject.path) !== null && _f !== void 0 ? _f : ''}`,
        };
        try {
            if (protocol === 'http:' &&
                externalProxyHelper &&
                externalProxyHelper.getProtocol() === 'http:') {
                const externalURL = externalProxyHelper.getUrlObject();
                const host = (_g = externalURL.hostname) !== null && _g !== void 0 ? _g : util_fns_1.makeErr(`No external proxy hostname set - ${context.externalProxy}`);
                const port = Number((_h = externalURL.port) !== null && _h !== void 0 ? _h : util_fns_1.makeErr(`No external proxy port set - ${context.externalProxy}`));
                options.hostname = host;
                options.port = port;
                // Check if we have authorization here
                const basicAuthString = externalProxyHelper.getBasicAuth();
                if (basicAuthString) {
                    if (!options.headers)
                        options.headers = {};
                    options.headers['Proxy-Authorization'] = `Basic ${basicAuthString}`;
                }
                // support non-transparent proxy
                options.path = `http://${urlObject.host}${urlObject.path}`;
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
    }
    static getExternalProxyHelper(context, proxyConfig) {
        var _a;
        let externalProxyConfig;
        const externalProxy = proxyConfig.externalProxy;
        const req = context.clientReq;
        if (externalProxy) {
            if (typeof externalProxy === 'string' || external_proxy_config_1.isExternalProxyConfigObject(externalProxy)) {
                externalProxyConfig = externalProxy;
            }
            else if (typeof externalProxy === 'function') {
                const connectKey = `${req.socket.remotePort}:${req.socket.localPort}`;
                externalProxyConfig = externalProxy(req, context.ssl, context.clientRes, (_a = contexts_1.contexts[connectKey]) === null || _a === void 0 ? void 0 : _a.connectRequest);
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
    }
}
exports.CommonUtils = CommonUtils;
//# sourceMappingURL=common-utils.js.map