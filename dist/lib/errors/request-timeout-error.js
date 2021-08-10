"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestTimeoutError = void 0;
class RequestTimeoutError extends Error {
    constructor(hostPort, timeout) {
        super(`Timeout of ${timeout}ms while requesting ${hostPort}`); // 'Error' breaks prototype chain here
        this.name = 'RequestTimeoutError';
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
}
exports.RequestTimeoutError = RequestTimeoutError;
//# sourceMappingURL=request-timeout-error.js.map