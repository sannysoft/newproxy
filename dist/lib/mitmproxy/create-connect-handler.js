"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectHandler = void 0;
var url = require("url");
var net = require("net");
var contexts_1 = require("../common/contexts");
var logger_1 = require("../common/logger");
var external_proxy_config_1 = require("../types/external-proxy-config");
var util_fns_1 = require("../common/util-fns");
var localIP = '127.0.0.1';
function createConnectHandler(proxyConfig, fakeServerCenter) {
    // return
    return function connectHandler(context) {
        var _this = this;
        var _a;
        var srvUrl = url.parse("https://" + context.connectRequest.url);
        var interceptSsl = false;
        try {
            interceptSsl =
                (typeof proxyConfig.sslMitm === 'function' &&
                    proxyConfig.sslMitm.call(null, context.connectRequest, context.clientSocket, context.head)) ||
                    proxyConfig.sslMitm === true;
        }
        catch (error) {
            logger_1.logError(error, 'Error at sslMitm function');
        }
        if (!context.clientSocket.writable)
            return;
        var serverHostname = (_a = srvUrl.hostname) !== null && _a !== void 0 ? _a : util_fns_1.makeErr('No hostname set for https request');
        var serverPort = Number(srvUrl.port || 443);
        if (!interceptSsl) {
            var externalProxy = proxyConfig.externalProxyNoMitm && typeof proxyConfig.externalProxyNoMitm === 'function'
                ? proxyConfig.externalProxyNoMitm(context.connectRequest, context.clientSocket)
                : proxyConfig.externalProxyNoMitm;
            context.markStart();
            context.clientSocket.on('close', function () {
                if (proxyConfig.statusNoMitmFn) {
                    var statusData = context.getStatusData();
                    proxyConfig.statusNoMitmFn(statusData);
                }
            });
            if (externalProxy) {
                connectNoMitmExternalProxy(new external_proxy_config_1.ExternalProxyHelper(externalProxy), context, serverHostname, serverPort);
                return;
            }
            connect(context, serverHostname, serverPort);
            return;
        }
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var serverObject, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fakeServerCenter.getServerPromise(serverHostname, serverPort)];
                    case 1:
                        serverObject = _a.sent();
                        connect(context, localIP, serverObject.port);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logError(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); })();
    };
}
exports.createConnectHandler = createConnectHandler;
function connect(context, hostname, port) {
    // tunneling https
    var proxySocket = net.connect(port, hostname, function () {
        context.clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        proxySocket.write(context.head);
        proxySocket.pipe(context.clientSocket);
        context.clientSocket.pipe(proxySocket);
    });
    proxySocket.on('error', function () {
        // logError(e);
    });
    proxySocket.on('ready', function () {
        proxySocket.connectKey = proxySocket.localPort + ":" + proxySocket.remotePort;
        contexts_1.contexts[proxySocket.connectKey] = context;
    });
    proxySocket.on('end', function () {
        if (proxySocket.connectKey)
            delete contexts_1.contexts[proxySocket.connectKey];
    });
    return proxySocket;
}
function connectNoMitmExternalProxy(proxyHelper, context, hostname, port) {
    var proxySocket = net.connect(Number(proxyHelper.getUrlObject().port), proxyHelper.getUrlObject().hostname, function () {
        proxySocket.write("CONNECT " + hostname + ":" + port + " HTTP/" + context.connectRequest.httpVersion + "\r\n");
        ['host', 'user-agent', 'proxy-connection'].forEach(function (name) {
            if (name in context.connectRequest.headers) {
                proxySocket.write(name + ": " + context.connectRequest.headers[name] + "\r\n");
            }
        });
        var proxyAuth = proxyHelper.getLoginAndPassword();
        if (proxyAuth) {
            var basicAuth = Buffer.from(proxyAuth).toString('base64');
            proxySocket.write("Proxy-Authorization: Basic " + basicAuth + "\r\n");
        }
        proxySocket.write('\r\n');
        proxySocket.pipe(context.clientSocket);
        context.clientSocket.pipe(proxySocket);
    });
    proxySocket.on('error', function (e) {
        logger_1.logError(e);
    });
    return proxySocket;
}
//# sourceMappingURL=create-connect-handler.js.map