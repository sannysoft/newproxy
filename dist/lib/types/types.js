"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPresent = exports.isString = exports.types = void 0;
function types(value) {
    return value !== null && typeof value === 'object';
}
exports.types = types;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
function isPresent(value) {
    return value !== undefined && value !== null;
}
exports.isPresent = isPresent;
//# sourceMappingURL=types.js.map