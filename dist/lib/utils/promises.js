"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.doNotWaitPromise = void 0;
function doNotWaitPromise(promise, description, logger) {
    promise
        .then(() => { })
        .catch((err) => {
        logger.logError(err, `Error at ${description}`);
    });
}
exports.doNotWaitPromise = doNotWaitPromise;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
//# sourceMappingURL=promises.js.map