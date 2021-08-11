"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewProxyBuilder = void 0;
const chalk = require("chalk");
const tls_utils_1 = require("./tls/tls-utils");
const ca_config_1 = require("./common/ca-config");
const logger_1 = require("./common/logger");
const new_proxy_1 = require("./new-proxy");
class NewProxyBuilder {
    constructor() {
        this.config = {
            port: 6789,
            log: true,
            errorLog: true,
            statusFn: undefined,
            statusNoMitmFn: undefined,
            sslMitm: undefined,
            requestInterceptor: undefined,
            responseInterceptor: undefined,
            getCertSocketTimeout: 10000,
            externalProxy: undefined,
            externalProxyNoMitm: undefined,
        };
    }
    static new() {
        return new NewProxyBuilder();
    }
    port(port) {
        this.config.port = port;
        return this;
    }
    sslMitm(value) {
        this.config.sslMitm = value;
        return this;
    }
    requestInterceptor(value) {
        this.config.requestInterceptor = value;
        return this;
    }
    responseInterceptor(value) {
        this.config.responseInterceptor = value;
        return this;
    }
    log(value) {
        this.config.log = value;
        return this;
    }
    metrics(value) {
        this.config.statusFn = value;
        return this;
    }
    errorLog(value) {
        this.config.errorLog = value;
        return this;
    }
    ca(caKeyPath, caCertPath) {
        this.config.caKeyPath = caKeyPath;
        this.config.caCertPath = caCertPath;
        return this;
    }
    externalProxy(value) {
        this.config.externalProxy = value;
        return this;
    }
    externalProxyNoMitm(value) {
        this.config.externalProxyNoMitm = value;
        return this;
    }
    build() {
        const logger = new logger_1.Logger(this.config.log, this.config.errorLog);
        // Generate certificate if none
        if (!this.config.caCertPath || !this.config.caKeyPath) {
            const rs = tls_utils_1.TlsUtils.initCA(ca_config_1.caConfig.getDefaultCABasePath());
            this.config.caCertPath = rs.caCertPath;
            this.config.caKeyPath = rs.caKeyPath;
            if (rs.create) {
                logger.log(`CA Cert saved in: ${this.config.caCertPath}`, chalk.cyan);
                logger.log(`CA private key saved in: ${this.config.caKeyPath}`, chalk.cyan);
            }
        }
        return new new_proxy_1.NewProxy(this.config, logger);
    }
}
exports.NewProxyBuilder = NewProxyBuilder;
//# sourceMappingURL=new-proxy-builder.js.map