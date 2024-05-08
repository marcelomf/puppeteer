"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
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
const fs_1 = require("fs");
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("../mocha-utils.js");
const utils_js_1 = require("../utils.js");
describe('Prerender', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('can navigate to a prerendered page via input', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/prerender/index.html');
            const button = __addDisposableResource(env_1, await page.waitForSelector('button'), false);
            await button?.click();
            const link = __addDisposableResource(env_1, await page.waitForSelector('a'), false);
            await Promise.all([page.waitForNavigation(), link?.click()]);
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.innerText;
            })).toBe('target');
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('can navigate to a prerendered page via Puppeteer', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/prerender/index.html');
            const button = __addDisposableResource(env_2, await page.waitForSelector('button'), false);
            await button?.click();
            await page.goto(server.PREFIX + '/prerender/target.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.innerText;
            })).toBe('target');
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    describe('via frame', () => {
        it('can navigate to a prerendered page via input', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/prerender/index.html');
                const button = __addDisposableResource(env_3, await page.waitForSelector('button'), false);
                await button?.click();
                const mainFrame = page.mainFrame();
                const link = __addDisposableResource(env_3, await mainFrame.waitForSelector('a'), false);
                await Promise.all([mainFrame.waitForNavigation(), link?.click()]);
                (0, expect_1.default)(mainFrame).toBe(page.mainFrame());
                (0, expect_1.default)(await mainFrame.evaluate(() => {
                    return document.body.innerText;
                })).toBe('target');
                (0, expect_1.default)(mainFrame).toBe(page.mainFrame());
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('can navigate to a prerendered page via Puppeteer', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/prerender/index.html');
                const button = __addDisposableResource(env_4, await page.waitForSelector('button'), false);
                await button?.click();
                const mainFrame = page.mainFrame();
                await mainFrame.goto(server.PREFIX + '/prerender/target.html');
                (0, expect_1.default)(await mainFrame.evaluate(() => {
                    return document.body.innerText;
                })).toBe('target');
                (0, expect_1.default)(mainFrame).toBe(page.mainFrame());
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
    });
    it('can screencast', async () => {
        const env_5 = { stack: [], error: void 0, hasError: false };
        try {
            const file = __addDisposableResource(env_5, (0, utils_js_1.getUniqueVideoFilePlaceholder)(), false);
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const recorder = await page.screencast({
                path: file.filename,
                scale: 0.5,
                crop: { width: 100, height: 100, x: 0, y: 0 },
                speed: 0.5,
            });
            await page.goto(server.PREFIX + '/prerender/index.html');
            const button = __addDisposableResource(env_5, await page.waitForSelector('button'), false);
            await button?.click();
            const link = __addDisposableResource(env_5, await page.locator('a').waitHandle(), false);
            await Promise.all([page.waitForNavigation(), link.click()]);
            const input = __addDisposableResource(env_5, await page.locator('input').waitHandle(), false);
            await input.type('ab', { delay: 100 });
            await recorder.stop();
            (0, expect_1.default)((0, fs_1.statSync)(file.filename).size).toBeGreaterThan(0);
        }
        catch (e_5) {
            env_5.error = e_5;
            env_5.hasError = true;
        }
        finally {
            __disposeResources(env_5);
        }
    });
    describe('with network requests', () => {
        it('can receive requests from the prerendered page', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                const urls = [];
                page.on('request', request => {
                    urls.push(request.url());
                });
                await page.goto(server.PREFIX + '/prerender/index.html');
                const button = __addDisposableResource(env_6, await page.waitForSelector('button'), false);
                await button?.click();
                const mainFrame = page.mainFrame();
                const link = __addDisposableResource(env_6, await mainFrame.waitForSelector('a'), false);
                await Promise.all([mainFrame.waitForNavigation(), link?.click()]);
                (0, expect_1.default)(mainFrame).toBe(page.mainFrame());
                (0, expect_1.default)(await mainFrame.evaluate(() => {
                    return document.body.innerText;
                })).toBe('target');
                (0, expect_1.default)(mainFrame).toBe(page.mainFrame());
                (0, expect_1.default)(urls.find(url => {
                    return url.endsWith('prerender/target.html');
                })).toBeTruthy();
                (0, expect_1.default)(urls.find(url => {
                    return url.includes('prerender/index.html');
                })).toBeTruthy();
                (0, expect_1.default)(urls.find(url => {
                    return url.includes('prerender/target.html?fromPrerendered');
                })).toBeTruthy();
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        });
    });
    describe('with emulation', () => {
        it('can configure viewport for prerendered pages', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({
                    width: 300,
                    height: 400,
                });
                await page.goto(server.PREFIX + '/prerender/index.html');
                const button = __addDisposableResource(env_7, await page.waitForSelector('button'), false);
                await button?.click();
                const link = __addDisposableResource(env_7, await page.waitForSelector('a'), false);
                await Promise.all([page.waitForNavigation(), link?.click()]);
                const result = await page.evaluate(() => {
                    return {
                        width: document.documentElement.clientWidth,
                        height: document.documentElement.clientHeight,
                        dpr: window.devicePixelRatio,
                    };
                });
                (0, expect_1.default)({
                    width: result.width,
                    height: result.height,
                }).toStrictEqual({
                    width: 300 * result.dpr,
                    height: 400 * result.dpr,
                });
            }
            catch (e_7) {
                env_7.error = e_7;
                env_7.hasError = true;
            }
            finally {
                __disposeResources(env_7);
            }
        });
    });
});
//# sourceMappingURL=prerender.spec.js.map