"use strict";
/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        function next() {
            while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                    var result = rec.dispose && rec.dispose.call(rec.value);
                    if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                catch (e) {
                    fail(e);
                }
            }
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('Fixtures', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('dumpio option should work with pipe option', async () => {
        const { defaultBrowserOptions, puppeteerPath, headless } = await (0, mocha_utils_js_1.getTestState)();
        if (headless !== 'shell') {
            // This test only works in the old headless mode.
            return;
        }
        let dumpioData = '';
        const options = Object.assign({}, defaultBrowserOptions, {
            pipe: true,
            dumpio: true,
        });
        const res = (0, child_process_1.spawn)('node', [
            path_1.default.join(__dirname, '../fixtures', 'dumpio.js'),
            puppeteerPath,
            JSON.stringify(options),
        ]);
        res.stderr.on('data', data => {
            dumpioData += data.toString('utf8');
        });
        await new Promise(resolve => {
            return res.on('close', resolve);
        });
        (0, expect_1.default)(dumpioData).toContain('message from dumpio');
    });
    it('should dump browser process stderr', async () => {
        const { defaultBrowserOptions, isFirefox, puppeteerPath } = await (0, mocha_utils_js_1.getTestState)();
        let dumpioData = '';
        const options = Object.assign({}, defaultBrowserOptions, { dumpio: true });
        const res = (0, child_process_1.spawn)('node', [
            path_1.default.join(__dirname, '../fixtures', 'dumpio.js'),
            puppeteerPath,
            JSON.stringify(options),
        ]);
        res.stderr.on('data', data => {
            dumpioData += data.toString('utf8');
        });
        await new Promise(resolve => {
            return res.on('close', resolve);
        });
        if (isFirefox && defaultBrowserOptions.protocol === 'webDriverBiDi') {
            (0, expect_1.default)(dumpioData).toContain('WebDriver BiDi listening on ws://');
        }
        else {
            (0, expect_1.default)(dumpioData).toContain('DevTools listening on ws://');
        }
    });
    it('should close the browser when the node process closes', async () => {
        const { defaultBrowserOptions, puppeteerPath, puppeteer } = await (0, mocha_utils_js_1.getTestState)();
        const options = Object.assign({}, defaultBrowserOptions, {
            // Disable DUMPIO to cleanly read stdout.
            dumpio: false,
        });
        const res = (0, child_process_1.spawn)('node', [
            path_1.default.join(__dirname, '../fixtures', 'closeme.js'),
            puppeteerPath,
            JSON.stringify(options),
        ]);
        let killed = false;
        function killProcess() {
            if (killed) {
                return;
            }
            if (process.platform === 'win32') {
                (0, child_process_1.execSync)(`taskkill /pid ${res.pid} /T /F`);
            }
            else {
                process.kill(res.pid);
            }
            killed = true;
        }
        try {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                let wsEndPointCallback;
                const wsEndPointPromise = new Promise(x => {
                    wsEndPointCallback = x;
                });
                let output = '';
                res.stdout.on('data', data => {
                    output += data;
                    if (output.indexOf('\n')) {
                        wsEndPointCallback(output.substring(0, output.indexOf('\n')));
                    }
                });
                const browser = __addDisposableResource(env_1, await puppeteer.connect({
                    browserWSEndpoint: await wsEndPointPromise,
                }), false);
                const promises = [
                    (0, utils_js_1.waitEvent)(browser, 'disconnected'),
                    new Promise(resolve => {
                        res.on('close', resolve);
                    }),
                ];
                killProcess();
                await Promise.all(promises);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        }
        finally {
            killProcess();
        }
    });
});
//# sourceMappingURL=fixtures.spec.js.map