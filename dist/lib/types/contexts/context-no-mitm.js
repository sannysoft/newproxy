"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextNoMitm = void 0;
const abstract_context_1 = require("./abstract-context");
const status_data_no_mitm_1 = require("../status-data-no-mitm");
class ContextNoMitm extends abstract_context_1.AbstractContext {
    constructor(connectRequest, clientSocket, head) {
        super();
        this.connectRequest = connectRequest;
        this.clientSocket = clientSocket;
        this.head = head;
    }
    getStatusData() {
        var _a, _b, _c;
        this.markEnd();
        return new status_data_no_mitm_1.StatusDataNoMitm(this.connectRequest, (_a = this.externalProxy) !== null && _a !== void 0 ? _a : undefined, Math.max(0, ((_b = this.status_endTime) !== null && _b !== void 0 ? _b : 0) - ((_c = this.status_startTime) !== null && _c !== void 0 ? _c : 0)));
    }
}
exports.ContextNoMitm = ContextNoMitm;
//# sourceMappingURL=context-no-mitm.js.map