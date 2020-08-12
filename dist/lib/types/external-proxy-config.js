"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalProxyHelper = exports.isExternalProxyConfigObject = void 0;
var url = require("url");
var util_fns_1 = require("../common/util-fns");
function isExternalProxyConfigObject(obj) {
    return typeof obj === 'object' && obj.host;
}
exports.isExternalProxyConfigObject = isExternalProxyConfigObject;
var ExternalProxyHelper = /** @class */ (function () {
    function ExternalProxyHelper(config) {
        this.config = config;
    }
    ExternalProxyHelper.prototype.getUrlObject = function () {
        var proxy;
        if (typeof this.config === 'string') {
            proxy = this.config;
        }
        else {
            proxy = this.config.host;
        }
        if (!proxy.startsWith('http:') && !proxy.startsWith('https:'))
            proxy = "http://" + proxy;
        return url.parse(proxy);
    };
    ExternalProxyHelper.prototype.getProtocol = function () {
        return this.getUrlObject().protocol || '';
    };
    ExternalProxyHelper.prototype.getLoginAndPassword = function () {
        if (typeof this.config === 'string') {
            var auth = this.getUrlObject().auth;
            return auth || undefined;
        }
        if (util_fns_1.isNullOrUndefined(this.config.username) || util_fns_1.isNullOrUndefined(this.config.password))
            return undefined;
        return this.config.username + ":" + this.config.password;
    };
    ExternalProxyHelper.prototype.getBasicAuth = function () {
        var authString = this.getLoginAndPassword();
        if (!authString)
            return undefined;
        return Buffer.from(authString).toString('base64');
    };
    ExternalProxyHelper.prototype.getConfigObject = function () {
        var _a, _b, _c;
        if (typeof this.config === 'object' && 'host' in this.config)
            return this.config;
        var proxyUrl = this.getUrlObject();
        var _d = (_b = (_a = this.getLoginAndPassword()) === null || _a === void 0 ? void 0 : _a.split(':')) !== null && _b !== void 0 ? _b : [undefined, undefined], login = _d[0], password = _d[1];
        return {
            host: (_c = proxyUrl.host) !== null && _c !== void 0 ? _c : util_fns_1.makeErr('No host set for proxy'),
            username: login,
            password: password,
        };
    };
    return ExternalProxyHelper;
}());
exports.ExternalProxyHelper = ExternalProxyHelper;
//# sourceMappingURL=external-proxy-config.js.map