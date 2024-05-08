"use strict";
/**
 * @license
 * Copyright 2018 Google Inc.
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
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('Browser specs', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Browser.version', function () {
        it('should return version', async () => {
            const { browser } = await (0, mocha_utils_js_1.getTestState)();
            const version = await browser.version();
            (0, expect_1.default)(version.length).toBeGreaterThan(0);
            (0, expect_1.default)(version.toLowerCase()).atLeastOneToContain(['firefox', 'chrome']);
        });
    });
    describe('Browser.userAgent', function () {
        it('should include Browser engine', async () => {
            const { browser, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            const userAgent = await browser.userAgent();
            (0, expect_1.default)(userAgent.length).toBeGreaterThan(0);
            if (isChrome) {
                (0, expect_1.default)(userAgent).toContain('WebKit');
            }
            else {
                (0, expect_1.default)(userAgent).toContain('Gecko');
            }
        });
    });
    describe('Browser.target', function () {
        it('should return browser target', async () => {
            const { browser } = await (0, mocha_utils_js_1.getTestState)();
            const target = browser.target();
            (0, expect_1.default)(target.type()).toBe('browser');
        });
    });
    describe('Browser.process', function () {
        it('should return child_process instance', async () => {
            const { browser } = await (0, mocha_utils_js_1.getTestState)();
            const process = await browser.process();
            (0, expect_1.default)(process.pid).toBeGreaterThan(0);
        });
        it('should not return child_process for remote browser', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { browser, puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipContextCreation: true,
                });
                const browserWSEndpoint = browser.wsEndpoint();
                const remoteBrowser = __addDisposableResource(env_1, await puppeteer.connect({
                    browserWSEndpoint,
                    protocol: browser.protocol,
                }), false);
                (0, expect_1.default)(remoteBrowser.process()).toBe(null);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should keep connected after the last page is closed', async () => {
            const { browser, close } = await (0, mocha_utils_js_1.launch)({}, { createContext: false });
            try {
                const pages = await browser.pages();
                await Promise.all(pages.map(page => {
                    return page.close();
                }));
                // Verify the browser is still connected.
                (0, expect_1.default)(browser.connected).toBe(true);
                // Verify the browser can open a new page.
                await browser.newPage();
            }
            finally {
                await close();
            }
        });
    });
    describe('Browser.isConnected', () => {
        it('should set the browser connected state', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { browser, puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipContextCreation: true,
                });
                const browserWSEndpoint = browser.wsEndpoint();
                const newBrowser = __addDisposableResource(env_2, await puppeteer.connect({
                    browserWSEndpoint,
                    protocol: browser.protocol,
                }), false);
                (0, expect_1.default)(newBrowser.isConnected()).toBe(true);
                await newBrowser.disconnect();
                (0, expect_1.default)(newBrowser.isConnected()).toBe(false);
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
    });
});
//# sourceMappingURL=browser.spec.js.map