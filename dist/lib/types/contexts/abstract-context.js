"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractContext = void 0;
var AbstractContext = /** @class */ (function () {
    function AbstractContext() {
    }
    AbstractContext.prototype.markStart = function () {
        this.status_startTime = Date.now();
    };
    AbstractContext.prototype.markEnd = function () {
        if (!this.status_endTime)
            this.status_endTime = Date.now();
    };
    return AbstractContext;
}());
exports.AbstractContext = AbstractContext;
//# sourceMappingURL=abstract-context.js.map