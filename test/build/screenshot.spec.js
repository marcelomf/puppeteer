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
const assert_1 = __importDefault(require("assert"));
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('Screenshots', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.screenshot', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot();
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-sanity.png');
        });
        it('should clip rect', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                clip: {
                    x: 50,
                    y: 100,
                    width: 150,
                    height: 100,
                },
            });
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-clip-rect.png');
        });
        it('should get screenshot bigger than the viewport', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 50, height: 50 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                clip: {
                    x: 25,
                    y: 25,
                    width: 100,
                    height: 100,
                },
            });
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-offscreen-clip.png');
        });
        it('should clip clip bigger than the viewport without "captureBeyondViewport"', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 50, height: 50 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                captureBeyondViewport: false,
                clip: {
                    x: 25,
                    y: 25,
                    width: 100,
                    height: 100,
                },
            });
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-offscreen-clip-2.png');
        });
        it('should run in parallel', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const promises = [];
            for (let i = 0; i < 3; ++i) {
                promises.push(page.screenshot({
                    clip: {
                        x: 50 * i,
                        y: 0,
                        width: 50,
                        height: 50,
                    },
                }));
            }
            const screenshots = await Promise.all(promises);
            (0, expect_1.default)(screenshots[1]).toBeGolden('grid-cell-1.png');
        });
        it('should take fullPage screenshots', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                fullPage: true,
            });
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-grid-fullpage.png');
        });
        it('should take fullPage screenshots without captureBeyondViewport', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                fullPage: true,
                captureBeyondViewport: false,
            });
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-grid-fullpage-2.png');
            (0, expect_1.default)(page.viewport()).toMatchObject({ width: 500, height: 500 });
        });
        it('should run in parallel in multiple pages', async () => {
            const { server, context } = await (0, mocha_utils_js_1.getTestState)();
            const N = 2;
            const pages = await Promise.all(Array(N)
                .fill(0)
                .map(async () => {
                const page = await context.newPage();
                await page.goto(server.PREFIX + '/grid.html');
                return page;
            }));
            const promises = [];
            for (let i = 0; i < N; ++i) {
                promises.push(pages[i].screenshot({
                    clip: { x: 50 * i, y: 0, width: 50, height: 50 },
                }));
            }
            const screenshots = await Promise.all(promises);
            for (let i = 0; i < N; ++i) {
                (0, expect_1.default)(screenshots[i]).toBeGolden(`grid-cell-${i}.png`);
            }
            await Promise.all(pages.map(page => {
                return page.close();
            }));
        });
        it('should work with odd clip size on Retina displays', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            // Make sure documentElement height is at least 11px.
            await page.setContent(`<div style="width: 11px; height: 11px;">`);
            const screenshot = await page.screenshot({
                clip: {
                    x: 0,
                    y: 0,
                    width: 11,
                    height: 11,
                },
            });
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-clip-odd-size.png');
        });
        it('should return base64', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                encoding: 'base64',
            });
            (0, expect_1.default)(Buffer.from(screenshot, 'base64')).toBeGolden('screenshot-sanity.png');
        });
    });
    describe('ElementHandle.screenshot', function () {
        it('should work', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.goto(server.PREFIX + '/grid.html');
                await page.evaluate(() => {
                    return window.scrollBy(50, 100);
                });
                const elementHandle = __addDisposableResource(env_1, (await page.$('.box:nth-of-type(3)')), false);
                const screenshot = await elementHandle.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-bounding-box.png');
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should work with a null viewport', async () => {
            const { server } = await (0, mocha_utils_js_1.getTestState)({
                skipLaunch: true,
            });
            const { browser, close } = await (0, mocha_utils_js_1.launch)({
                defaultViewport: null,
            });
            try {
                const env_2 = { stack: [], error: void 0, hasError: false };
                try {
                    const page = await browser.newPage();
                    await page.goto(server.PREFIX + '/grid.html');
                    await page.evaluate(() => {
                        return window.scrollBy(50, 100);
                    });
                    const elementHandle = __addDisposableResource(env_2, await page.$('.box:nth-of-type(3)'), false);
                    (0, assert_1.default)(elementHandle);
                    const screenshot = await elementHandle.screenshot();
                    (0, expect_1.default)(screenshot).toBeTruthy();
                }
                catch (e_2) {
                    env_2.error = e_2;
                    env_2.hasError = true;
                }
                finally {
                    __disposeResources(env_2);
                }
            }
            finally {
                await close();
            }
        });
        it('should take into account padding and border', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        something above
        <style>div {
          border: 2px solid blue;
          background: green;
          width: 50px;
          height: 50px;
        }
        </style>
        <div></div>
      `);
                const elementHandle = __addDisposableResource(env_3, (await page.$('div')), false);
                const screenshot = await elementHandle.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-padding-border.png');
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should capture full element when larger than viewport', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
          something above
          <style>
          :root {
            scrollbar-width: none;
          }
          div.to-screenshot {
            border: 1px solid blue;
            width: 600px;
            height: 600px;
            margin-left: 50px;
          }
          </style>
          <div class="to-screenshot"></div>
        `);
                const elementHandle = __addDisposableResource(env_4, (await page.$('div.to-screenshot')), false);
                const screenshot = await elementHandle.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-larger-than-viewport.png');
                (0, expect_1.default)(await page.evaluate(() => {
                    return {
                        w: window.innerWidth,
                        h: window.innerHeight,
                    };
                })).toEqual({ w: 500, h: 500 });
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
        it('should scroll element into view', async () => {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        something above
        <style>div.above {
          border: 2px solid blue;
          background: red;
          height: 1500px;
        }
        div.to-screenshot {
          border: 2px solid blue;
          background: green;
          width: 50px;
          height: 50px;
        }
        </style>
        <div class="above"></div>
        <div class="to-screenshot"></div>
      `);
                const elementHandle = __addDisposableResource(env_5, (await page.$('div.to-screenshot')), false);
                const screenshot = await elementHandle.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-scrolled-into-view.png');
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        });
        it('should work with a rotated element', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`<div style="position:absolute;
                                        top: 100px;
                                        left: 100px;
                                        width: 100px;
                                        height: 100px;
                                        background: green;
                                        transform: rotateZ(200deg);">&nbsp;</div>`);
                const elementHandle = __addDisposableResource(env_6, (await page.$('div')), false);
                const screenshot = await elementHandle.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-rotate.png');
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        });
        it('should fail to screenshot a detached element', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<h1>remove this</h1>');
                const elementHandle = __addDisposableResource(env_7, (await page.$('h1')), false);
                await page.evaluate(element => {
                    return element.remove();
                }, elementHandle);
                const screenshotError = await elementHandle.screenshot().catch(error => {
                    return error;
                });
                (0, expect_1.default)(screenshotError).toBeInstanceOf(Error);
                (0, expect_1.default)(screenshotError.message).toMatch(/Node is either not visible or not an HTMLElement|Node is detached from document/);
            }
            catch (e_7) {
                env_7.error = e_7;
                env_7.hasError = true;
            }
            finally {
                __disposeResources(env_7);
            }
        });
        it('should not hang with zero width/height element', async () => {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div style="width: 50px; height: 0"></div>');
                const div = __addDisposableResource(env_8, (await page.$('div')), false);
                const error = await div.screenshot().catch(error_ => {
                    return error_;
                });
                (0, expect_1.default)(error.message).toBe('Node has 0 height.');
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        });
        it('should work for an element with fractional dimensions', async () => {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div style="width:48.51px;height:19.8px;border:1px solid black;"></div>');
                const elementHandle = __addDisposableResource(env_9, (await page.$('div')), false);
                const screenshot = await elementHandle.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-fractional.png');
            }
            catch (e_9) {
                env_9.error = e_9;
                env_9.hasError = true;
            }
            finally {
                __disposeResources(env_9);
            }
        });
        it('should work for an element with an offset', async () => {
            const env_10 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div style="position:absolute; top: 10.3px; left: 20.4px;width:50.3px;height:20.2px;border:1px solid black;"></div>');
                const elementHandle = __addDisposableResource(env_10, (await page.$('div')), false);
                const screenshot = await elementHandle.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-fractional-offset.png');
            }
            catch (e_10) {
                env_10.error = e_10;
                env_10.hasError = true;
            }
            finally {
                __disposeResources(env_10);
            }
        });
        it('should work with webp', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 100, height: 100 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                type: 'webp',
            });
            (0, expect_1.default)(screenshot).toBeInstanceOf(Buffer);
        });
        it('should run in parallel in multiple pages', async () => {
            const { browser, server } = await (0, mocha_utils_js_1.getTestState)();
            const context = await browser.createBrowserContext();
            const N = 2;
            const pages = await Promise.all(Array(N)
                .fill(0)
                .map(async () => {
                const page = await context.newPage();
                await page.goto(server.PREFIX + '/grid.html');
                return page;
            }));
            const promises = [];
            for (let i = 0; i < N; ++i) {
                promises.push(pages[i].screenshot({
                    clip: { x: 50 * i, y: 0, width: 50, height: 50 },
                }));
            }
            const screenshots = await Promise.all(promises);
            for (let i = 0; i < N; ++i) {
                (0, expect_1.default)(screenshots[i]).toBeGolden(`grid-cell-${i}.png`);
            }
            await Promise.all(pages.map(page => {
                return page.close();
            }));
            await context.close();
        });
        it('should use element clip', async () => {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        something above
        <style>div {
          border: 2px solid blue;
          background: green;
          width: 50px;
          height: 50px;
        }
        </style>
        <div></div>
      `);
                const elementHandle = __addDisposableResource(env_11, (await page.$('div')), false);
                const screenshot = await elementHandle.screenshot({
                    clip: {
                        x: 10,
                        y: 10,
                        width: 20,
                        height: 20,
                    },
                });
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-element-clip.png');
            }
            catch (e_11) {
                env_11.error = e_11;
                env_11.hasError = true;
            }
            finally {
                __disposeResources(env_11);
            }
        });
    });
    describe('Cdp', () => {
        it('should use scale for clip', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                clip: {
                    x: 50,
                    y: 100,
                    width: 150,
                    height: 100,
                    scale: 2,
                },
            });
            (0, expect_1.default)(screenshot).toBeGolden('screenshot-clip-rect-scale2.png');
        });
        it('should allow transparency', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 100, height: 100 });
            await page.goto(server.EMPTY_PAGE);
            const screenshot = await page.screenshot({ omitBackground: true });
            (0, expect_1.default)(screenshot).toBeGolden('transparent.png');
        });
        it('should render white background on jpeg file', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 100, height: 100 });
            await page.goto(server.EMPTY_PAGE);
            const screenshot = await page.screenshot({
                omitBackground: true,
                type: 'jpeg',
            });
            (0, expect_1.default)(screenshot).toBeGolden('white.jpg');
        });
        it('should work in "fromSurface: false" mode', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            const screenshot = await page.screenshot({
                fromSurface: false,
            });
            (0, expect_1.default)(screenshot).toBeDefined();
        });
    });
});
//# sourceMappingURL=screenshot.spec.js.map