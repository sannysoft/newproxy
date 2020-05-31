"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalProxyHelper = exports.isExternalProxyConfigObject = void 0;
var url = require("url");
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
        return this.config.login + ":" + this.config.password;
    };
    return ExternalProxyHelper;
}());
exports.ExternalProxyHelper = ExternalProxyHelper;
//# sourceMappingURL=external-proxy-config.js.map