"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.log = exports.setErrorLoggerConfig = exports.setLoggerConfig = void 0;
var chalk = require("chalk");
var debug_1 = require("debug");
var logger = debug_1.default('newproxy');
var loggerConfig = false;
var errorLoggerConfig = false;
function setLoggerConfig(value) {
    loggerConfig = value;
}
exports.setLoggerConfig = setLoggerConfig;
function setErrorLoggerConfig(value) {
    errorLoggerConfig = value;
}
exports.setErrorLoggerConfig = setErrorLoggerConfig;
function log(message, colorFn) {
    var _a;
    if (typeof loggerConfig === 'function') {
        loggerConfig(message);
    }
    else if (loggerConfig) {
        var formattedMessage = (_a = colorFn === null || colorFn === void 0 ? void 0 : colorFn(message)) !== null && _a !== void 0 ? _a : message;
        console.log(formattedMessage);
    }
    else {
        logger(message);
    }
}
exports.log = log;
function logError(message, comment) {
    var fullComment = comment !== null && comment !== void 0 ? comment : '';
    if (fullComment !== '')
        fullComment += '  ';
    if (typeof errorLoggerConfig === 'function') {
        errorLoggerConfig(message, comment);
    }
    else if (loggerConfig) {
        if (message instanceof Error) {
            console.error(fullComment, message);
        }
        else {
            log(message, chalk.red);
        }
    }
    else {
        debug_1.default("Error: " + message);
    }
}
exports.logError = logError;
//# sourceMappingURL=logger.js.map