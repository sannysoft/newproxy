"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalProxyHelper = exports.isExternalProxyConfigObject = void 0;
var url = require("url");
var util_fns_1 = require("../common/util-fns");
function isExternalProxyConfigObject(obj) {
    return typeof obj === 'object' && obj.url;
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
            proxy = this.config.url;
        }
        if (!proxy.startsWith('http:') && !proxy.startsWith('https:'))
            proxy = "http://" + proxy;
        return url.parse(proxy);
    };
    ExternalProxyHelper.prototype.getProtocol = function () {
        return this.getUrlObject().protocol || '';
    };
    ExternalProxyHelper.prototype.getLoginAndPassword = function () {
        if (typeof this.config === 'string')
            return this.getUrlObject().auth;
        if (util_fns_1.isNullOrUndefined(this.config.login) || util_fns_1.isNullOrUndefined(this.config.password))
            return undefined;
        return this.config.login + ":" + this.config.password;
    };
    ExternalProxyHelper.prototype.getBasicAuth = function () {
        var authString = this.getLoginAndPassword();
        if (!authString)
            return undefined;
        return Buffer.from(authString).toString('base64');
    };
    return ExternalProxyHelper;
}());
exports.ExternalProxyHelper = ExternalProxyHelper;
//# sourceMappingURL=external-proxy-config.js.map