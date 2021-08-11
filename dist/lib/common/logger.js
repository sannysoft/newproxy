"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk = require("chalk");
const Debug = require("debug");
const logger = Debug('newproxy');
class Logger {
    constructor(loggerConfig = false, errorLoggerConfig = false) {
        this.loggerConfig = loggerConfig;
        this.errorLoggerConfig = errorLoggerConfig;
    }
    log(message, colorFn) {
        var _a;
        if (typeof this.loggerConfig === 'function') {
            this.loggerConfig(message);
        }
        else if (this.loggerConfig) {
            const formattedMessage = (_a = colorFn === null || colorFn === void 0 ? void 0 : colorFn(message)) !== null && _a !== void 0 ? _a : message;
            logger(formattedMessage);
        }
    }
    logError(message, comment) {
        let fullComment = comment !== null && comment !== void 0 ? comment : '';
        if (fullComment !== '')
            fullComment += '  ';
        if (typeof this.errorLoggerConfig === 'function') {
            this.errorLoggerConfig(message, comment);
        }
        else if (this.loggerConfig) {
            if (message instanceof Error) {
                this.log(message.message);
            }
            else {
                this.log(message, chalk.red);
            }
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map