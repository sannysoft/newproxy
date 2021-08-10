"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const status_data_1 = require("../status-data");
const abstract_context_1 = require("./abstract-context");
class Context extends abstract_context_1.AbstractContext {
    constructor(clientReq, clientRes, ssl) {
        super();
        this.status_requestedFromServerBytes = 0;
        this.status_serverRespondedBytes = 0;
        this.clientReq = clientReq;
        this.clientRes = clientRes;
        this.ssl = ssl;
    }
    getStatusData() {
        var _a, _b, _c, _d;
        this.markEnd();
        return new status_data_1.StatusData(this.clientReq, this.ssl, (_a = this.status_code) !== null && _a !== void 0 ? _a : 0, Math.max(0, ((_b = this.status_endTime) !== null && _b !== void 0 ? _b : 0) - ((_c = this.status_startTime) !== null && _c !== void 0 ? _c : 0)), (_d = this.externalProxy) !== null && _d !== void 0 ? _d : undefined, this.clientReq.socket.bytesRead, this.clientReq.socket.bytesWritten, this.status_requestedFromServerBytes, this.status_serverRespondedBytes);
    }
    setStatusCode(statusCode, requestBytes = 0, responseBytes = 0) {
        if (!this.status_code && statusCode)
            this.status_code = statusCode;
        this.status_requestedFromServerBytes = requestBytes;
        this.status_serverRespondedBytes = responseBytes;
    }
}
exports.Context = Context;
//# sourceMappingURL=context.js.map