"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpgradeHandler = void 0;
var http_1 = require("http");
var https_1 = require("https");
var common_utils_1 = require("../common/common-utils");
var logger_1 = require("../common/logger");
// create connectHandler function
function createUpgradeHandler(proxyConfig) {
    return function upgradeHandler(req, clientSocket, head, ssl) {
        var clientOptions = common_utils_1.CommonUtils.getOptionsFromRequest(req, ssl, proxyConfig.externalProxy, undefined);
        var proxyReq = (ssl ? https_1.default : http_1.default).request(clientOptions);
        proxyReq.on('error', function (error) {
            logger_1.logError(error);
        });
        proxyReq.on('response', function (res) {
            // if upgrade event isn't going to happen, close the socket
            // @ts-ignore
            if (!res.upgrade)
                clientSocket.end();
        });
        proxyReq.on('upgrade', function (proxyRes, proxySocket, proxyHead) {
            proxySocket.on('error', function (error) {
                logger_1.logError(error);
            });
            clientSocket.on('error', function () {
                proxySocket.end();
            });
            proxySocket.setTimeout(0);
            proxySocket.setNoDelay(true);
            proxySocket.setKeepAlive(true, 0);
            if (proxyHead && proxyHead.length > 0)
                proxySocket.unshift(proxyHead);
            clientSocket.write(Object.keys(proxyRes.headers)
                .reduce(function (aggregator, key) {
                var value = proxyRes.headers[key];
                if (!Array.isArray(value)) {
                    aggregator.push(key + ": " + value);
                    return aggregator;
                }
                for (var i = 0; i < value.length; i++) {
                    aggregator.push(key + ": " + value[i]);
                }
                return aggregator;
            }, ['HTTP/1.1 101 Switching Protocols'])
                .join('\r\n') + "\r\n\r\n");
            proxySocket.pipe(clientSocket).pipe(proxySocket);
        });
        proxyReq.end();
    };
}
exports.createUpgradeHandler = createUpgradeHandler;
//# sourceMappingURL=create-upgrade-handler.js.map