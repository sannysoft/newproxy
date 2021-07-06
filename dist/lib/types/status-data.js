"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusData = void 0;
var StatusData = /** @class */ (function () {
    function StatusData(request, ssl, status, time, externalProxy, requestBytes, responseBytes, serverRequestBytes, serverResponseBytes) {
        /**
         * External proxy config if used
         */
        this.externalProxy = undefined;
        /**
         * Request processing rime
         */
        this.time = 0;
        /**
         * Size of request received from client
         */
        this.requestBytes = 0;
        /**
         * Size of response sent to client
         */
        this.responseBytes = 0;
        /**
         * Size of request sent to end-server
         */
        this.serverRequestBytes = 0;
        /**
         * Size of response from end-server
         */
        this.serverResponseBytes = 0;
        this.request = request;
        this.ssl = ssl;
        this.statusCode = status;
        this.time = time;
        if (externalProxy)
            this.externalProxy = externalProxy;
        if (requestBytes)
            this.requestBytes = requestBytes;
        if (responseBytes)
            this.responseBytes = responseBytes;
        this.serverRequestBytes = serverRequestBytes;
        this.serverResponseBytes = serverResponseBytes;
    }
    return StatusData;
}());
exports.StatusData = StatusData;
//# sourceMappingURL=status-data.js.map