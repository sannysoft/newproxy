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
exports.ContextNoMitm = void 0;
var abstract_context_1 = require("./abstract-context");
var status_data_no_mitm_1 = require("../status-data-no-mitm");
var ContextNoMitm = /** @class */ (function (_super) {
    __extends(ContextNoMitm, _super);
    function ContextNoMitm(connectRequest, clientSocket, head) {
        var _this = _super.call(this) || this;
        _this.connectRequest = connectRequest;
        _this.clientSocket = clientSocket;
        _this.head = head;
        return _this;
    }
    ContextNoMitm.prototype.getStatusData = function () {
        var _a, _b, _c;
        this.markEnd();
        return new status_data_no_mitm_1.StatusDataNoMitm(this.connectRequest, (_a = this.externalProxy) !== null && _a !== void 0 ? _a : undefined, Math.max(0, ((_b = this.status_endTime) !== null && _b !== void 0 ? _b : 0) - ((_c = this.status_startTime) !== null && _c !== void 0 ? _c : 0)));
    };
    return ContextNoMitm;
}(abstract_context_1.AbstractContext));
exports.ContextNoMitm = ContextNoMitm;
//# sourceMappingURL=context-no-mitm.js.map