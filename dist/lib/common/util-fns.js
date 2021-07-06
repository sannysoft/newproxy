"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNullOrUndefined = exports.makeErr = void 0;
function makeErr(message) {
    throw new Error(message);
}
exports.makeErr = makeErr;
function isNullOrUndefined(obj) {
    return typeof obj === 'undefined' || obj === null;
}
exports.isNullOrUndefined = isNullOrUndefined;
//# sourceMappingURL=util-fns.js.map