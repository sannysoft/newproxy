"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractContext = void 0;
class AbstractContext {
    markStart() {
        this.status_startTime = Date.now();
    }
    markEnd() {
        if (!this.status_endTime)
            this.status_endTime = Date.now();
    }
}
exports.AbstractContext = AbstractContext;
//# sourceMappingURL=abstract-context.js.map