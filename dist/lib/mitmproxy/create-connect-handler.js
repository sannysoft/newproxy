"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectHandler = void 0;
const url = require("url");
const net = require("net");
const contexts_1 = require("../common/contexts");
const external_proxy_config_1 = require("../types/external-proxy-config");
const util_fns_1 = require("../common/util-fns");
const promises_1 = require("../utils/promises");
const localIP = '127.0.0.1';
function connect(context, hostname, port) {
    // tunneling https
    const proxySocket = net.connect(port, hostname, () => {
        context.clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        proxySocket.write(context.head);
        proxySocket.pipe(context.clientSocket);
        context.clientSocket.pipe(proxySocket);
    });
    proxySocket.on('error', () => {
        // logError(e);
    });
    proxySocket.on('ready', () => {
        proxySocket.connectKey = `${proxySocket.localPort}:${proxySocket.remotePort}`;
        contexts_1.contexts[proxySocket.connectKey] = context;
    });
    proxySocket.on('end', () => {
        if (proxySocket.connectKey)
            delete contexts_1.contexts[proxySocket.connectKey];
    });
    return proxySocket;
}
function connectNoMitmExternalProxy(proxyHelper, context, hostname, port, logger) {
    const proxySocket = net.connect(Number(proxyHelper.getUrlObject().port), proxyHelper.getUrlObject().hostname, () => {
        proxySocket.write(`CONNECT ${hostname}:${port} HTTP/${context.connectRequest.httpVersion}\r\n`);
        ['host', 'user-agent', 'proxy-connection'].forEach((name) => {
            if (name in context.connectRequest.headers) {
                proxySocket.write(`${name}: ${context.connectRequest.headers[name]}\r\n`);
            }
        });
        const proxyAuth = proxyHelper.getLoginAndPassword();
        if (proxyAuth) {
            const basicAuth = Buffer.from(proxyAuth).toString('base64');
            proxySocket.write(`Proxy-Authorization: Basic ${basicAuth}\r\n`);
        }
        proxySocket.write('\r\n');
        proxySocket.pipe(context.clientSocket);
        context.clientSocket.pipe(proxySocket);
    });
    proxySocket.on('error', (e) => {
        logger.logError(e);
    });
    return proxySocket;
}
function createConnectHandler(proxyConfig, fakeServerCenter, logger) {
    // return
    return function connectHandler(context) {
        var _a;
        const srvUrl = url.parse(`https://${context.connectRequest.url}`);
        let interceptSsl = false;
        try {
            interceptSsl =
                (typeof proxyConfig.sslMitm === 'function' &&
                    proxyConfig.sslMitm.call(null, context.connectRequest, context.clientSocket, context.head)) ||
                    proxyConfig.sslMitm === true;
        }
        catch (error) {
            logger.logError(error, 'Error at sslMitm function');
        }
        if (!context.clientSocket.writable)
            return;
        const serverHostname = (_a = srvUrl.hostname) !== null && _a !== void 0 ? _a : util_fns_1.makeErr('No hostname set for https request');
        const serverPort = Number(srvUrl.port || 443);
        if (!interceptSsl) {
            const externalProxy = proxyConfig.externalProxyNoMitm && typeof proxyConfig.externalProxyNoMitm === 'function'
                ? proxyConfig.externalProxyNoMitm(context.connectRequest, context.clientSocket)
                : proxyConfig.externalProxyNoMitm;
            context.markStart();
            context.clientSocket.on('close', () => {
                if (proxyConfig.statusNoMitmFn) {
                    const statusData = context.getStatusData();
                    proxyConfig.statusNoMitmFn(statusData);
                }
            });
            if (externalProxy) {
                connectNoMitmExternalProxy(new external_proxy_config_1.ExternalProxyHelper(externalProxy), context, serverHostname, serverPort, logger);
                return;
            }
            connect(context, serverHostname, serverPort);
            return;
        }
        promises_1.doNotWaitPromise((async () => {
            const server = fakeServerCenter.getFakeServer(serverHostname, serverPort);
            await server.run();
            connect(context, localIP, server.listenPort);
        })(), `Connect to fake server failed for ${serverHostname}`, logger);
    };
}
exports.createConnectHandler = createConnectHandler;
//# sourceMappingURL=create-connect-handler.js.map