"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = void 0;
const request_handler_1 = require("./request-handler");
// create requestHandler function
function createRequestHandler(proxyConfig) {
    return function requestHandler(context) {
        const reqHandler = new request_handler_1.RequestHandler(context, proxyConfig);
        context.clientReq.socket.on('close', () => {
            if (proxyConfig === null || proxyConfig === void 0 ? void 0 : proxyConfig.statusFn) {
                const statusData = context.getStatusData();
                proxyConfig.statusFn(statusData);
            }
        });
        // Mark time of request processing start
        context.markStart();
        void (async () => {
            await reqHandler.go();
        })();
    };
}
exports.createRequestHandler = createRequestHandler;
//# sourceMappingURL=create-request-handler.js.map