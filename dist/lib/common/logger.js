"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.log = exports.setErrorLoggerConfig = exports.setLoggerConfig = void 0;
var util = require("util");
var chalk = require("chalk");
var debug = util.debuglog('newproxy');
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
        debug(message);
    }
}
exports.log = log;
function logError(message) {
    if (typeof errorLoggerConfig === 'function') {
        errorLoggerConfig(message);
    }
    else if (loggerConfig) {
        if (message instanceof Error) {
            console.error(message);
        }
        else {
            log(message, chalk.red);
        }
    }
    else {
        debug("Error: " + message);
    }
}
exports.logError = logError;
//# sourceMappingURL=logger.js.map