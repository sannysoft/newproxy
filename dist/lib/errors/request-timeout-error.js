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
exports.RequestTimeoutError = void 0;
var RequestTimeoutError = /** @class */ (function (_super) {
    __extends(RequestTimeoutError, _super);
    function RequestTimeoutError(hostPort, timeout) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, "Timeout of " + timeout + "ms while requesting " + hostPort) || this;
        _this.name = 'RequestTimeoutError';
        Object.setPrototypeOf(_this, _newTarget.prototype); // restore prototype chain
        return _this;
    }
    return RequestTimeoutError;
}(Error));
exports.RequestTimeoutError = RequestTimeoutError;
//# sourceMappingURL=request-timeout-error.js.map