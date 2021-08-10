"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caConfig = void 0;
const path = require("path");
class CaConfig {
    constructor() {
        this.caCertFileName = 'newproxy.ca.crt';
        this.caKeyFileName = 'newproxy.ca.key.pem';
        this.caName = 'NewProxy CA';
    }
    // eslint-disable-next-line class-methods-use-this
    getDefaultCABasePath() {
        const userHome = process.env.HOME || process.env.USERPROFILE || '';
        return path.resolve(userHome, './newproxy');
    }
    getDefaultCACertPath() {
        return path.resolve(this.getDefaultCABasePath(), this.caCertFileName);
    }
    getDefaultCaKeyPath() {
        return path.resolve(this.getDefaultCABasePath(), this.caKeyFileName);
    }
}
exports.caConfig = new CaConfig();
//# sourceMappingURL=ca-config.js.map