"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalProxyHelper = void 0;
var url = require("url");
var ExternalProxyHelper = /** @class */ (function () {
    function ExternalProxyHelper(config) {
        this.config = config;
    }
    ExternalProxyHelper.prototype.getUrlObject = function () {
        if (typeof this.config === 'string')
            return url.parse(this.config);
        return url.parse(this.config.url);
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