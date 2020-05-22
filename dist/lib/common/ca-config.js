"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caConfig = void 0;
var path = require("path");
var CaConfig = /** @class */ (function () {
    function CaConfig() {
        this.caCertFileName = 'newproxy.ca.crt';
        this.caKeyFileName = 'newproxy.ca.key.pem';
        this.caName = 'NewProxy CA';
    }
    // eslint-disable-next-line class-methods-use-this
    CaConfig.prototype.getDefaultCABasePath = function () {
        var userHome = process.env.HOME || process.env.USERPROFILE || '';
        return path.resolve(userHome, './newproxy');
    };
    CaConfig.prototype.getDefaultCACertPath = function () {
        return path.resolve(this.getDefaultCABasePath(), this.caCertFileName);
    };
    CaConfig.prototype.getDefaultCaKeyPath = function () {
        return path.resolve(this.getDefaultCABasePath(), this.caKeyFileName);
    };
    return CaConfig;
}());
exports.caConfig = new CaConfig();
//# sourceMappingURL=ca-config.js.map