"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpgradeHandler = void 0;
const http_1 = require("http");
const https_1 = require("https");
const common_utils_1 = require("../common/common-utils");
const logger_1 = require("../common/logger");
const context_1 = require("../types/contexts/context");
// create connectHandler function
function createUpgradeHandler(proxyConfig) {
    return function upgradeHandler(req, clientSocket, head, ssl) {
        const context = new context_1.Context(req, undefined, false);
        const clientOptions = common_utils_1.CommonUtils.getOptionsFromRequest(context, proxyConfig);
        const proxyReq = (ssl ? https_1.default : http_1.default).request(clientOptions);
        proxyReq.on('error', (error) => {
            logger_1.logError(error);
        });
        proxyReq.on('response', (res) => {
            // if upgrade event isn't going to happen, close the socket
            // @ts-ignore
            if (!res.upgrade)
                clientSocket.end();
        });
        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
            proxySocket.on('error', (error) => {
                logger_1.logError(error);
            });
            clientSocket.on('error', () => {
                proxySocket.end();
            });
            proxySocket.setTimeout(0);
            proxySocket.setNoDelay(true);
            proxySocket.setKeepAlive(true, 0);
            if (proxyHead && proxyHead.length > 0)
                proxySocket.unshift(proxyHead);
            clientSocket.write(`${Object.keys(proxyRes.headers)
                // eslint-disable-next-line unicorn/no-reduce
                .reduce((aggregator, key) => {
                const value = proxyRes.headers[key];
                if (!Array.isArray(value)) {
                    aggregator.push(`${key}: ${value}`);
                    return aggregator;
                }
                for (const element of value) {
                    aggregator.push(`${key}: ${element}`);
                }
                return aggregator;
            }, ['HTTP/1.1 101 Switching Protocols'])
                .join('\r\n')}\r\n\r\n`);
            proxySocket.pipe(clientSocket).pipe(proxySocket);
        });
        proxyReq.end();
    };
}
exports.createUpgradeHandler = createUpgradeHandler;
//# sourceMappingURL=create-upgrade-handler.js.map