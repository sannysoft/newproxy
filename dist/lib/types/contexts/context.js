"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
var status_data_1 = require("../status-data");
var abstract_context_1 = require("./abstract-context");
var Context = /** @class */ (function (_super) {
    __extends(Context, _super);
    function Context(clientReq, clientRes, ssl) {
        var _this = _super.call(this) || this;
        _this.status_requestedFromServerBytes = 0;
        _this.status_serverRespondedBytes = 0;
        _this.clientReq = clientReq;
        _this.clientRes = clientRes;
        _this.ssl = ssl;
        return _this;
    }
    Context.prototype.getStatusData = function () {
        var _a, _b, _c, _d;
        this.markEnd();
        return new status_data_1.StatusData(this.clientReq, this.ssl, (_a = this.status_code) !== null && _a !== void 0 ? _a : 0, Math.max(0, ((_b = this.status_endTime) !== null && _b !== void 0 ? _b : 0) - ((_c = this.status_startTime) !== null && _c !== void 0 ? _c : 0)), (_d = this.externalProxy) !== null && _d !== void 0 ? _d : undefined, this.clientReq.socket.bytesRead, this.clientReq.socket.bytesWritten, this.status_requestedFromServerBytes, this.status_serverRespondedBytes);
    };
    Context.prototype.setStatusCode = function (statusCode, requestBytes, responseBytes) {
        if (requestBytes === void 0) { requestBytes = 0; }
        if (responseBytes === void 0) { responseBytes = 0; }
        if (!this.status_code && statusCode)
            this.status_code = statusCode;
        this.status_requestedFromServerBytes = requestBytes;
        this.status_serverRespondedBytes = responseBytes;
    };
    return Context;
}(abstract_context_1.AbstractContext));
exports.Context = Context;
//# sourceMappingURL=context.js.map