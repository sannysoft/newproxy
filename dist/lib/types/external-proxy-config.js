"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalProxyHelper = exports.isExternalProxyConfigObject = void 0;
const url = require("url");
const util_fns_1 = require("../common/util-fns");
const types_1 = require("./types");
function isExternalProxyConfigObject(obj) {
    return types_1.types(obj) && !!obj.host && !!obj.port;
}
exports.isExternalProxyConfigObject = isExternalProxyConfigObject;
class ExternalProxyHelper {
    constructor(config) {
        this.config = config;
    }
    getUrlObject() {
        let proxy;
        proxy = types_1.isString(this.config) ? this.config : `${this.config.host}:${this.config.port}`;
        if (!proxy.startsWith('http:') && !proxy.startsWith('https:'))
            proxy = `http://${proxy}`;
        return url.parse(proxy);
    }
    getProtocol() {
        return this.getUrlObject().protocol || '';
    }
    getLoginAndPassword() {
        var _a;
        if (typeof this.config === 'string') {
            const auth = (_a = this.getUrlObject()) === null || _a === void 0 ? void 0 : _a.auth;
            return auth || undefined;
        }
        if (util_fns_1.isNullOrUndefined(this.config.username) || util_fns_1.isNullOrUndefined(this.config.password))
            return undefined;
        return `${this.config.username}:${this.config.password}`;
    }
    getBasicAuth() {
        const authString = this.getLoginAndPassword();
        if (!authString)
            return undefined;
        return Buffer.from(authString).toString('base64');
    }
    getConfigObject() {
        var _a, _b, _c, _d;
        if (isExternalProxyConfigObject(this.config)) {
            return this.config;
        }
        const proxyUrl = this.getUrlObject();
        const [login, password] = (_b = (_a = this.getLoginAndPassword()) === null || _a === void 0 ? void 0 : _a.split(':')) !== null && _b !== void 0 ? _b : [undefined, undefined];
        return {
            host: (_c = proxyUrl.host) !== null && _c !== void 0 ? _c : util_fns_1.makeErr('No host set for proxy'),
            port: Number.parseInt((_d = proxyUrl.port) !== null && _d !== void 0 ? _d : util_fns_1.makeErr('No port set for proxy'), 10),
            username: login,
            password: password,
        };
    }
}
exports.ExternalProxyHelper = ExternalProxyHelper;
//# sourceMappingURL=external-proxy-config.js.map