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
const puppeteer_1 = require("puppeteer");
const ElementHandle_js_1 = require("puppeteer-core/internal/api/ElementHandle.js");
const disposable_js_1 = require("puppeteer-core/internal/util/disposable.js");
const sinon_1 = __importDefault(require("sinon"));
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('ElementHandle specs', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('ElementHandle.boundingBox', function () {
        it('should work', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.goto(server.PREFIX + '/grid.html');
                const elementHandle = __addDisposableResource(env_1, (await page.$('.box:nth-of-type(13)')), false);
                const box = await elementHandle.boundingBox();
                (0, expect_1.default)(box).toEqual({ x: 100, y: 50, width: 50, height: 50 });
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should handle nested frames', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.goto(server.PREFIX + '/frames/nested-frames.html');
                const nestedFrame = page.frames()[1].childFrames()[1];
                const elementHandle = __addDisposableResource(env_2, (await nestedFrame.$('div')), false);
                const box = await elementHandle.boundingBox();
                (0, expect_1.default)(box).toEqual({ x: 28, y: 182, width: 300, height: 18 });
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should return null for invisible elements', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div style="display:none">hi</div>');
                const element = __addDisposableResource(env_3, (await page.$('div')), false);
                (0, expect_1.default)(await element.boundingBox()).toBe(null);
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should force a layout', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent('<div style="width: 100px; height: 100px">hello</div>');
                const elementHandle = __addDisposableResource(env_4, (await page.$('div')), false);
                await page.evaluate(element => {
                    return (element.style.height = '200px');
                }, elementHandle);
                const box = await elementHandle.boundingBox();
                (0, expect_1.default)(box).toEqual({ x: 8, y: 8, width: 100, height: 200 });
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
        it('should work with SVG nodes', async () => {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
          <rect id="theRect" x="30" y="50" width="200" height="300"></rect>
        </svg>
      `);
                const element = __addDisposableResource(env_5, (await page.$('#therect')), false);
                const pptrBoundingBox = await element.boundingBox();
                const webBoundingBox = await page.evaluate(e => {
                    const rect = e.getBoundingClientRect();
                    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                }, element);
                (0, expect_1.default)(pptrBoundingBox).toEqual(webBoundingBox);
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        });
    });
    describe('ElementHandle.boxModel', function () {
        it('should work', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/resetcss.html');
                // Step 1: Add Frame and position it absolutely.
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.PREFIX + '/resetcss.html');
                await page.evaluate(() => {
                    const frame = document.querySelector('#frame1');
                    frame.style.position = 'absolute';
                    frame.style.left = '1px';
                    frame.style.top = '2px';
                });
                // Step 2: Add div and position it absolutely inside frame.
                const frame = page.frames()[1];
                const divHandle = __addDisposableResource(env_6, (await frame.evaluateHandle(() => {
                    const div = document.createElement('div');
                    document.body.appendChild(div);
                    div.style.boxSizing = 'border-box';
                    div.style.position = 'absolute';
                    div.style.borderLeft = '1px solid black';
                    div.style.paddingLeft = '2px';
                    div.style.marginLeft = '3px';
                    div.style.left = '4px';
                    div.style.top = '5px';
                    div.style.width = '6px';
                    div.style.height = '7px';
                    return div;
                })).asElement(), false);
                // Step 3: query div's boxModel and assert box values.
                const box = (await divHandle.boxModel());
                (0, expect_1.default)(box.width).toBe(6);
                (0, expect_1.default)(box.height).toBe(7);
                (0, expect_1.default)(box.margin[0]).toEqual({
                    x: 1 + 4, // frame.left + div.left
                    y: 2 + 5,
                });
                (0, expect_1.default)(box.border[0]).toEqual({
                    x: 1 + 4 + 3, // frame.left + div.left + div.margin-left
                    y: 2 + 5,
                });
                (0, expect_1.default)(box.padding[0]).toEqual({
                    x: 1 + 4 + 3 + 1, // frame.left + div.left + div.marginLeft + div.borderLeft
                    y: 2 + 5,
                });
                (0, expect_1.default)(box.content[0]).toEqual({
                    x: 1 + 4 + 3 + 1 + 2, // frame.left + div.left + div.marginLeft + div.borderLeft + div.paddingLeft
                    y: 2 + 5,
                });
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        });
        it('should return null for invisible elements', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div style="display:none">hi</div>');
                const element = __addDisposableResource(env_7, (await page.$('div')), false);
                (0, expect_1.default)(await element.boxModel()).toBe(null);
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
    describe('ElementHandle.contentFrame', function () {
        it('should work', async () => {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                const elementHandle = __addDisposableResource(env_8, (await page.$('#frame1')), false);
                const frame = await elementHandle.contentFrame();
                (0, expect_1.default)(frame).toBe(page.frames()[1]);
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        });
    });
    describe('ElementHandle.isVisible and ElementHandle.isHidden', function () {
        it('should work', async () => {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div style="display: none">text</div>');
                const element = __addDisposableResource(env_9, (await page.waitForSelector('div')), false);
                await (0, expect_1.default)(element.isVisible()).resolves.toBeFalsy();
                await (0, expect_1.default)(element.isHidden()).resolves.toBeTruthy();
                await element.evaluate(e => {
                    e.style.removeProperty('display');
                });
                await (0, expect_1.default)(element.isVisible()).resolves.toBeTruthy();
                await (0, expect_1.default)(element.isHidden()).resolves.toBeFalsy();
            }
            catch (e_9) {
                env_9.error = e_9;
                env_9.hasError = true;
            }
            finally {
                __disposeResources(env_9);
            }
        });
    });
    describe('ElementHandle.click', function () {
        it('should work', async () => {
            const env_10 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/button.html');
                const button = __addDisposableResource(env_10, (await page.$('button')), false);
                await button.click();
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis.result;
                })).toBe('Clicked');
            }
            catch (e_10) {
                env_10.error = e_10;
                env_10.hasError = true;
            }
            finally {
                __disposeResources(env_10);
            }
        });
        it('should return Point data', async () => {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const clicks = [];
                await page.exposeFunction('reportClick', (x, y) => {
                    clicks.push([x, y]);
                });
                await page.evaluate(() => {
                    document.body.style.padding = '0';
                    document.body.style.margin = '0';
                    document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
                    document.body.addEventListener('click', e => {
                        window.reportClick(e.clientX, e.clientY);
                    });
                });
                const divHandle = __addDisposableResource(env_11, (await page.$('div')), false);
                await divHandle.click();
                await divHandle.click({
                    offset: {
                        x: 10,
                        y: 15,
                    },
                });
                await (0, mocha_utils_js_1.shortWaitForArrayToHaveAtLeastNElements)(clicks, 2);
                (0, expect_1.default)(clicks).toEqual([
                    [45 + 60, 45 + 30], // margin + middle point offset
                    [30 + 10, 30 + 15], // margin + offset
                ]);
            }
            catch (e_11) {
                env_11.error = e_11;
                env_11.hasError = true;
            }
            finally {
                __disposeResources(env_11);
            }
        });
        it('should work for Shadow DOM v1', async () => {
            const env_12 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/shadow.html');
                const buttonHandle = __addDisposableResource(env_12, await page.evaluateHandle(() => {
                    // @ts-expect-error button is expected to be in the page's scope.
                    return button;
                }), false);
                await buttonHandle.click();
                (0, expect_1.default)(await page.evaluate(() => {
                    // @ts-expect-error clicked is expected to be in the page's scope.
                    return clicked;
                })).toBe(true);
            }
            catch (e_12) {
                env_12.error = e_12;
                env_12.hasError = true;
            }
            finally {
                __disposeResources(env_12);
            }
        });
        it('should not work for TextNodes', async () => {
            const env_13 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/button.html');
                const buttonTextNode = __addDisposableResource(env_13, await page.evaluateHandle(() => {
                    return document.querySelector('button').firstChild;
                }), false);
                let error;
                await buttonTextNode.click().catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error.message).atLeastOneToContain([
                    'Node is not of type HTMLElement',
                    'no such node',
                ]);
            }
            catch (e_13) {
                env_13.error = e_13;
                env_13.hasError = true;
            }
            finally {
                __disposeResources(env_13);
            }
        });
        it('should throw for detached nodes', async () => {
            const env_14 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/button.html');
                const button = __addDisposableResource(env_14, (await page.$('button')), false);
                await page.evaluate(button => {
                    return button.remove();
                }, button);
                let error;
                await button.click().catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error.message).atLeastOneToContain([
                    'Node is detached from document',
                    'no such node',
                ]);
            }
            catch (e_14) {
                env_14.error = e_14;
                env_14.hasError = true;
            }
            finally {
                __disposeResources(env_14);
            }
        });
        it('should throw for hidden nodes', async () => {
            const env_15 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/button.html');
                const button = __addDisposableResource(env_15, (await page.$('button')), false);
                await page.evaluate(button => {
                    return (button.style.display = 'none');
                }, button);
                const error = await button.click().catch(error_ => {
                    return error_;
                });
                (0, expect_1.default)(error.message).atLeastOneToContain([
                    'Node is either not clickable or not an Element',
                    'no such element',
                ]);
            }
            catch (e_15) {
                env_15.error = e_15;
                env_15.hasError = true;
            }
            finally {
                __disposeResources(env_15);
            }
        });
        it('should throw for recursively hidden nodes', async () => {
            const env_16 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/button.html');
                const button = __addDisposableResource(env_16, (await page.$('button')), false);
                await page.evaluate(button => {
                    return (button.parentElement.style.display = 'none');
                }, button);
                const error = await button.click().catch(error_ => {
                    return error_;
                });
                (0, expect_1.default)(error.message).atLeastOneToContain([
                    'Node is either not clickable or not an Element',
                    'no such element',
                ]);
            }
            catch (e_16) {
                env_16.error = e_16;
                env_16.hasError = true;
            }
            finally {
                __disposeResources(env_16);
            }
        });
        it('should throw for <br> elements', async () => {
            const env_17 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('hello<br>goodbye');
                const br = __addDisposableResource(env_17, (await page.$('br')), false);
                const error = await br.click().catch(error_ => {
                    return error_;
                });
                (0, expect_1.default)(error.message).atLeastOneToContain([
                    'Node is either not clickable or not an Element',
                    'no such node',
                ]);
            }
            catch (e_17) {
                env_17.error = e_17;
                env_17.hasError = true;
            }
            finally {
                __disposeResources(env_17);
            }
        });
    });
    describe('ElementHandle.clickablePoint', function () {
        it('should work', async () => {
            const env_18 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.evaluate(() => {
                    document.body.style.padding = '0';
                    document.body.style.margin = '0';
                    document.body.innerHTML = `
          <div style="cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;"></div>
        `;
                });
                await page.evaluate(async () => {
                    return await new Promise(resolve => {
                        return window.requestAnimationFrame(resolve);
                    });
                });
                const divHandle = __addDisposableResource(env_18, (await page.$('div')), false);
                (0, expect_1.default)(await divHandle.clickablePoint()).toEqual({
                    x: 45 + 60, // margin + middle point offset
                    y: 45 + 30, // margin + middle point offset
                });
                (0, expect_1.default)(await divHandle.clickablePoint({
                    x: 10,
                    y: 15,
                })).toEqual({
                    x: 30 + 10, // margin + offset
                    y: 30 + 15, // margin + offset
                });
            }
            catch (e_18) {
                env_18.error = e_18;
                env_18.hasError = true;
            }
            finally {
                __disposeResources(env_18);
            }
        });
        it('should not work if the click box is not visible', async () => {
            const env_19 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<button style="width: 10px; height: 10px; position: absolute; left: -20px"></button>');
                const handle = __addDisposableResource(env_19, await page.locator('button').waitHandle(), false);
                await (0, expect_1.default)(handle.clickablePoint()).rejects.toBeInstanceOf(Error);
                await page.setContent('<button style="width: 10px; height: 10px; position: absolute; right: -20px"></button>');
                const handle2 = __addDisposableResource(env_19, await page.locator('button').waitHandle(), false);
                await (0, expect_1.default)(handle2.clickablePoint()).rejects.toBeInstanceOf(Error);
                await page.setContent('<button style="width: 10px; height: 10px; position: absolute; top: -20px"></button>');
                const handle3 = __addDisposableResource(env_19, await page.locator('button').waitHandle(), false);
                await (0, expect_1.default)(handle3.clickablePoint()).rejects.toBeInstanceOf(Error);
                await page.setContent('<button style="width: 10px; height: 10px; position: absolute; bottom: -20px"></button>');
                const handle4 = __addDisposableResource(env_19, await page.locator('button').waitHandle(), false);
                await (0, expect_1.default)(handle4.clickablePoint()).rejects.toBeInstanceOf(Error);
            }
            catch (e_19) {
                env_19.error = e_19;
                env_19.hasError = true;
            }
            finally {
                __disposeResources(env_19);
            }
        });
        it('should not work if the click box is not visible due to the iframe', async () => {
            const env_20 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`<iframe name='frame' style='position: absolute; left: -100px' srcdoc="<button style='width: 10px; height: 10px;'></button>"></iframe>`);
                const frame = await page.waitForFrame(async (frame) => {
                    const env_21 = { stack: [], error: void 0, hasError: false };
                    try {
                        const element = __addDisposableResource(env_21, await frame.frameElement(), false);
                        if (!element) {
                            return false;
                        }
                        const name = await element.evaluate(frame => {
                            return frame.name;
                        });
                        return name === 'frame';
                    }
                    catch (e_21) {
                        env_21.error = e_21;
                        env_21.hasError = true;
                    }
                    finally {
                        __disposeResources(env_21);
                    }
                });
                const handle = __addDisposableResource(env_20, await frame.locator('button').waitHandle(), false);
                await (0, expect_1.default)(handle.clickablePoint()).rejects.toBeInstanceOf(Error);
                await page.setContent(`<iframe name='frame2' style='position: absolute; top: -100px' srcdoc="<button style='width: 10px; height: 10px;'></button>"></iframe>`);
                const frame2 = await page.waitForFrame(async (frame) => {
                    const env_22 = { stack: [], error: void 0, hasError: false };
                    try {
                        const element = __addDisposableResource(env_22, await frame.frameElement(), false);
                        if (!element) {
                            return false;
                        }
                        const name = await element.evaluate(frame => {
                            return frame.name;
                        });
                        return name === 'frame2';
                    }
                    catch (e_22) {
                        env_22.error = e_22;
                        env_22.hasError = true;
                    }
                    finally {
                        __disposeResources(env_22);
                    }
                });
                const handle2 = __addDisposableResource(env_20, await frame2.locator('button').waitHandle(), false);
                await (0, expect_1.default)(handle2.clickablePoint()).rejects.toBeInstanceOf(Error);
            }
            catch (e_20) {
                env_20.error = e_20;
                env_20.hasError = true;
            }
            finally {
                __disposeResources(env_20);
            }
        });
        it('should work for iframes', async () => {
            const env_23 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.evaluate(() => {
                    document.body.style.padding = '10px';
                    document.body.style.margin = '10px';
                    document.body.innerHTML = `
          <iframe style="border: none; margin: 0; padding: 0;" seamless sandbox srcdoc="<style>* { margin: 0; padding: 0;}</style><div style='cursor: pointer; width: 120px; height: 60px; margin: 30px; padding: 15px;' />"></iframe>
        `;
                });
                await page.evaluate(async () => {
                    return await new Promise(resolve => {
                        return window.requestAnimationFrame(resolve);
                    });
                });
                const frame = page.frames()[1];
                const divHandle = __addDisposableResource(env_23, (await frame.$('div')), false);
                (0, expect_1.default)(await divHandle.clickablePoint()).toEqual({
                    x: 20 + 45 + 60, // iframe pos + margin + middle point offset
                    y: 20 + 45 + 30, // iframe pos + margin + middle point offset
                });
                (0, expect_1.default)(await divHandle.clickablePoint({
                    x: 10,
                    y: 15,
                })).toEqual({
                    x: 20 + 30 + 10, // iframe pos + margin + offset
                    y: 20 + 30 + 15, // iframe pos + margin + offset
                });
            }
            catch (e_23) {
                env_23.error = e_23;
                env_23.hasError = true;
            }
            finally {
                __disposeResources(env_23);
            }
        });
    });
    describe('Element.waitForSelector', () => {
        it('should wait correctly with waitForSelector on an element', async () => {
            const env_24 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const waitFor = page.waitForSelector('.foo').catch(err => {
                    return err;
                });
                // Set the page content after the waitFor has been started.
                await page.setContent('<div id="not-foo"></div><div class="bar">bar2</div><div class="foo">Foo1</div>');
                const element = __addDisposableResource(env_24, (await waitFor), false);
                if (element instanceof Error) {
                    throw element;
                }
                (0, expect_1.default)(element).toBeDefined();
                const innerWaitFor = element.waitForSelector('.bar').catch(err => {
                    return err;
                });
                await element.evaluate(el => {
                    el.innerHTML = '<div class="bar">bar1</div>';
                });
                const element2 = __addDisposableResource(env_24, (await innerWaitFor), false);
                if (element2 instanceof Error) {
                    throw element2;
                }
                (0, expect_1.default)(element2).toBeDefined();
                (0, expect_1.default)(await element2.evaluate(el => {
                    return el.innerText;
                })).toStrictEqual('bar1');
            }
            catch (e_24) {
                env_24.error = e_24;
                env_24.hasError = true;
            }
            finally {
                __disposeResources(env_24);
            }
        });
        it('should wait correctly with waitForSelector and xpath on an element', async () => {
            const env_25 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                // Set the page content after the waitFor has been started.
                await page.setContent(`<div id=el1>
          el1
          <div id=el2>
            el2
          </div>
        </div>
        <div id=el3>
          el3
        </div>`);
                const elById = __addDisposableResource(env_25, (await page.waitForSelector('#el1')), false);
                const elByXpath = __addDisposableResource(env_25, (await elById.waitForSelector('xpath/.//div')), false);
                (0, expect_1.default)(await elByXpath.evaluate(el => {
                    return el.id;
                })).toStrictEqual('el2');
            }
            catch (e_25) {
                env_25.error = e_25;
                env_25.hasError = true;
            }
            finally {
                __disposeResources(env_25);
            }
        });
    });
    describe('ElementHandle.hover', function () {
        it('should work', async () => {
            const env_26 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/scrollable.html');
                const button = __addDisposableResource(env_26, (await page.$('#button-6')), false);
                await button.hover();
                (0, expect_1.default)(await page.evaluate(() => {
                    return document.querySelector('button:hover').id;
                })).toBe('button-6');
            }
            catch (e_26) {
                env_26.error = e_26;
                env_26.hasError = true;
            }
            finally {
                __disposeResources(env_26);
            }
        });
    });
    describe('ElementHandle.isIntersectingViewport', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            async function getVisibilityForButton(selector) {
                const env_27 = { stack: [], error: void 0, hasError: false };
                try {
                    const button = __addDisposableResource(env_27, (await page.$(selector)), false);
                    return await button.isIntersectingViewport();
                }
                catch (e_27) {
                    env_27.error = e_27;
                    env_27.hasError = true;
                }
                finally {
                    __disposeResources(env_27);
                }
            }
            await page.goto(server.PREFIX + '/offscreenbuttons.html');
            const buttonsPromises = [];
            // Firefox seems slow when using `isIntersectingViewport`
            // so we do all the tasks asynchronously
            for (let i = 0; i < 11; ++i) {
                buttonsPromises.push(getVisibilityForButton('#btn' + i));
            }
            const buttonVisibility = await Promise.all(buttonsPromises);
            for (let i = 0; i < 11; ++i) {
                // All but last button are visible.
                const visible = i < 10;
                (0, expect_1.default)(buttonVisibility[i]).toBe(visible);
            }
        });
        it('should work with threshold', async () => {
            const env_28 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/offscreenbuttons.html');
                // a button almost cannot be seen
                // sometimes we expect to return false by isIntersectingViewport1
                const button = __addDisposableResource(env_28, (await page.$('#btn11')), false);
                (0, expect_1.default)(await button.isIntersectingViewport({
                    threshold: 0.001,
                })).toBe(false);
            }
            catch (e_28) {
                env_28.error = e_28;
                env_28.hasError = true;
            }
            finally {
                __disposeResources(env_28);
            }
        });
        it('should work with threshold of 1', async () => {
            const env_29 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/offscreenbuttons.html');
                // a button almost cannot be seen
                // sometimes we expect to return false by isIntersectingViewport1
                const button = __addDisposableResource(env_29, (await page.$('#btn0')), false);
                (0, expect_1.default)(await button.isIntersectingViewport({
                    threshold: 1,
                })).toBe(true);
            }
            catch (e_29) {
                env_29.error = e_29;
                env_29.hasError = true;
            }
            finally {
                __disposeResources(env_29);
            }
        });
        it('should work with svg elements', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/inline-svg.html');
            const [visibleCircle, visibleSvg] = await Promise.all([
                page.$('circle'),
                page.$('svg'),
            ]);
            // Firefox seems slow when using `isIntersectingViewport`
            // so we do all the tasks asynchronously
            const [circleThresholdOne, circleThresholdZero, svgThresholdOne, svgThresholdZero,] = await Promise.all([
                visibleCircle.isIntersectingViewport({
                    threshold: 1,
                }),
                visibleCircle.isIntersectingViewport({
                    threshold: 0,
                }),
                visibleSvg.isIntersectingViewport({
                    threshold: 1,
                }),
                visibleSvg.isIntersectingViewport({
                    threshold: 0,
                }),
            ]);
            (0, expect_1.default)(circleThresholdOne).toBe(true);
            (0, expect_1.default)(circleThresholdZero).toBe(true);
            (0, expect_1.default)(svgThresholdOne).toBe(true);
            (0, expect_1.default)(svgThresholdZero).toBe(true);
            const [invisibleCircle, invisibleSvg] = await Promise.all([
                page.$('div circle'),
                page.$('div svg'),
            ]);
            // Firefox seems slow when using `isIntersectingViewport`
            // so we do all the tasks asynchronously
            const [invisibleCircleThresholdOne, invisibleCircleThresholdZero, invisibleSvgThresholdOne, invisibleSvgThresholdZero,] = await Promise.all([
                invisibleCircle.isIntersectingViewport({
                    threshold: 1,
                }),
                invisibleCircle.isIntersectingViewport({
                    threshold: 0,
                }),
                invisibleSvg.isIntersectingViewport({
                    threshold: 1,
                }),
                invisibleSvg.isIntersectingViewport({
                    threshold: 0,
                }),
            ]);
            (0, expect_1.default)(invisibleCircleThresholdOne).toBe(false);
            (0, expect_1.default)(invisibleCircleThresholdZero).toBe(false);
            (0, expect_1.default)(invisibleSvgThresholdOne).toBe(false);
            (0, expect_1.default)(invisibleSvgThresholdZero).toBe(false);
        });
    });
    describe('Custom queries', function () {
        afterEach(() => {
            puppeteer_1.Puppeteer.clearCustomQueryHandlers();
        });
        it('should register and unregister', async () => {
            const env_30 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div id="not-foo"></div><div id="foo"></div>');
                // Register.
                puppeteer_1.Puppeteer.registerCustomQueryHandler('getById', {
                    queryOne: (_element, selector) => {
                        return document.querySelector(`[id="${selector}"]`);
                    },
                });
                const element = __addDisposableResource(env_30, (await page.$('getById/foo')), false);
                (0, expect_1.default)(await page.evaluate(element => {
                    return element.id;
                }, element)).toBe('foo');
                const handlerNamesAfterRegistering = puppeteer_1.Puppeteer.customQueryHandlerNames();
                (0, expect_1.default)(handlerNamesAfterRegistering.includes('getById')).toBeTruthy();
                // Unregister.
                puppeteer_1.Puppeteer.unregisterCustomQueryHandler('getById');
                try {
                    await page.$('getById/foo');
                    throw new Error('Custom query handler name not set - throw expected');
                }
                catch (error) {
                    (0, expect_1.default)(error).not.toStrictEqual(new Error('Custom query handler name not set - throw expected'));
                }
                const handlerNamesAfterUnregistering = puppeteer_1.Puppeteer.customQueryHandlerNames();
                (0, expect_1.default)(handlerNamesAfterUnregistering.includes('getById')).toBeFalsy();
            }
            catch (e_30) {
                env_30.error = e_30;
                env_30.hasError = true;
            }
            finally {
                __disposeResources(env_30);
            }
        });
        it('should throw with invalid query names', async () => {
            try {
                puppeteer_1.Puppeteer.registerCustomQueryHandler('1/2/3', {
                    queryOne: () => {
                        return document.querySelector('foo');
                    },
                });
                throw new Error('Custom query handler name was invalid - throw expected');
            }
            catch (error) {
                (0, expect_1.default)(error).toStrictEqual(new Error('Custom query handler names may only contain [a-zA-Z]'));
            }
        });
        it('should work for multiple elements', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div id="not-foo"></div><div class="foo">Foo1</div><div class="foo baz">Foo2</div>');
            puppeteer_1.Puppeteer.registerCustomQueryHandler('getByClass', {
                queryAll: (_element, selector) => {
                    return [...document.querySelectorAll(`.${selector}`)];
                },
            });
            const elements = (await page.$$('getByClass/foo'));
            const classNames = await Promise.all(elements.map(async (element) => {
                return await page.evaluate(element => {
                    return element.className;
                }, element);
            }));
            (0, expect_1.default)(classNames).toStrictEqual(['foo', 'foo baz']);
        });
        it('should eval correctly', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div id="not-foo"></div><div class="foo">Foo1</div><div class="foo baz">Foo2</div>');
            puppeteer_1.Puppeteer.registerCustomQueryHandler('getByClass', {
                queryAll: (_element, selector) => {
                    return [...document.querySelectorAll(`.${selector}`)];
                },
            });
            const elements = await page.$$eval('getByClass/foo', divs => {
                return divs.length;
            });
            (0, expect_1.default)(elements).toBe(2);
        });
        it('should wait correctly with waitForSelector', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            puppeteer_1.Puppeteer.registerCustomQueryHandler('getByClass', {
                queryOne: (element, selector) => {
                    return element.querySelector(`.${selector}`);
                },
            });
            const waitFor = page.waitForSelector('getByClass/foo').catch(err => {
                return err;
            });
            // Set the page content after the waitFor has been started.
            await page.setContent('<div id="not-foo"></div><div class="foo">Foo1</div>');
            const element = await waitFor;
            if (element instanceof Error) {
                throw element;
            }
            (0, expect_1.default)(element).toBeDefined();
        });
        it('should wait correctly with waitForSelector on an element', async () => {
            const env_31 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                puppeteer_1.Puppeteer.registerCustomQueryHandler('getByClass', {
                    queryOne: (element, selector) => {
                        return element.querySelector(`.${selector}`);
                    },
                });
                const waitFor = page.waitForSelector('getByClass/foo').catch(err => {
                    return err;
                });
                // Set the page content after the waitFor has been started.
                await page.setContent('<div id="not-foo"></div><div class="bar">bar2</div><div class="foo">Foo1</div>');
                const element = __addDisposableResource(env_31, (await waitFor), false);
                if (element instanceof Error) {
                    throw element;
                }
                (0, expect_1.default)(element).toBeDefined();
                const innerWaitFor = element
                    .waitForSelector('getByClass/bar')
                    .catch(err => {
                    return err;
                });
                await element.evaluate(el => {
                    el.innerHTML = '<div class="bar">bar1</div>';
                });
                const element2 = __addDisposableResource(env_31, (await innerWaitFor), false);
                if (element2 instanceof Error) {
                    throw element2;
                }
                (0, expect_1.default)(element2).toBeDefined();
                (0, expect_1.default)(await element2.evaluate(el => {
                    return el.innerText;
                })).toStrictEqual('bar1');
            }
            catch (e_31) {
                env_31.error = e_31;
                env_31.hasError = true;
            }
            finally {
                __disposeResources(env_31);
            }
        });
        it('should wait correctly with waitFor', async () => {
            /* page.waitFor is deprecated so we silence the warning to avoid test noise */
            sinon_1.default.stub(console, 'warn').callsFake(() => { });
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            puppeteer_1.Puppeteer.registerCustomQueryHandler('getByClass', {
                queryOne: (element, selector) => {
                    return element.querySelector(`.${selector}`);
                },
            });
            const waitFor = page.waitForSelector('getByClass/foo').catch(err => {
                return err;
            });
            // Set the page content after the waitFor has been started.
            await page.setContent('<div id="not-foo"></div><div class="foo">Foo1</div>');
            const element = await waitFor;
            if (element instanceof Error) {
                throw element;
            }
            (0, expect_1.default)(element).toBeDefined();
        });
        it('should work when both queryOne and queryAll are registered', async () => {
            const env_32 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div id="not-foo"></div><div class="foo"><div id="nested-foo" class="foo"/></div><div class="foo baz">Foo2</div>');
                puppeteer_1.Puppeteer.registerCustomQueryHandler('getByClass', {
                    queryOne: (element, selector) => {
                        return element.querySelector(`.${selector}`);
                    },
                    queryAll: (element, selector) => {
                        return [...element.querySelectorAll(`.${selector}`)];
                    },
                });
                const element = __addDisposableResource(env_32, (await page.$('getByClass/foo')), false);
                (0, expect_1.default)(element).toBeDefined();
                const elements = await page.$$('getByClass/foo');
                (0, expect_1.default)(elements).toHaveLength(3);
            }
            catch (e_32) {
                env_32.error = e_32;
                env_32.hasError = true;
            }
            finally {
                __disposeResources(env_32);
            }
        });
        it('should eval when both queryOne and queryAll are registered', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div id="not-foo"></div><div class="foo">text</div><div class="foo baz">content</div>');
            puppeteer_1.Puppeteer.registerCustomQueryHandler('getByClass', {
                queryOne: (element, selector) => {
                    return element.querySelector(`.${selector}`);
                },
                queryAll: (element, selector) => {
                    return [...element.querySelectorAll(`.${selector}`)];
                },
            });
            const txtContent = await page.$eval('getByClass/foo', div => {
                return div.textContent;
            });
            (0, expect_1.default)(txtContent).toBe('text');
            const txtContents = await page.$$eval('getByClass/foo', divs => {
                return divs
                    .map(d => {
                    return d.textContent;
                })
                    .join('');
            });
            (0, expect_1.default)(txtContents).toBe('textcontent');
        });
        it('should work with function shorthands', async () => {
            const env_33 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div id="not-foo"></div><div id="foo"></div>');
                puppeteer_1.Puppeteer.registerCustomQueryHandler('getById', {
                    // This is a function shorthand
                    queryOne(_element, selector) {
                        return document.querySelector(`[id="${selector}"]`);
                    },
                });
                const element = __addDisposableResource(env_33, (await page.$('getById/foo')), false);
                (0, expect_1.default)(await page.evaluate(element => {
                    return element.id;
                }, element)).toBe('foo');
            }
            catch (e_33) {
                env_33.error = e_33;
                env_33.hasError = true;
            }
            finally {
                __disposeResources(env_33);
            }
        });
    });
    describe('ElementHandle.toElement', () => {
        it('should work', async () => {
            const env_34 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div class="foo">Foo1</div>');
                const element = __addDisposableResource(env_34, await page.$('.foo'), false);
                const div = __addDisposableResource(env_34, await element?.toElement('div'), false);
                (0, expect_1.default)(div).toBeDefined();
            }
            catch (e_34) {
                env_34.error = e_34;
                env_34.hasError = true;
            }
            finally {
                __disposeResources(env_34);
            }
        });
    });
    describe('ElementHandle[Symbol.dispose]', () => {
        it('should work', async () => {
            const env_35 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_35, await page.evaluateHandle('document'), false);
                const spy = sinon_1.default.spy(handle, disposable_js_1.disposeSymbol);
                {
                    const env_36 = { stack: [], error: void 0, hasError: false };
                    try {
                        const _ = __addDisposableResource(env_36, handle, false);
                    }
                    catch (e_35) {
                        env_36.error = e_35;
                        env_36.hasError = true;
                    }
                    finally {
                        __disposeResources(env_36);
                    }
                }
                (0, expect_1.default)(handle).toBeInstanceOf(ElementHandle_js_1.ElementHandle);
                (0, expect_1.default)(spy.calledOnce).toBeTruthy();
                (0, expect_1.default)(handle.disposed).toBeTruthy();
            }
            catch (e_36) {
                env_35.error = e_36;
                env_35.hasError = true;
            }
            finally {
                __disposeResources(env_35);
            }
        });
    });
    describe('ElementHandle[Symbol.asyncDispose]', () => {
        it('should work', async () => {
            const env_37 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_37, await page.evaluateHandle('document'), false);
                const spy = sinon_1.default.spy(handle, disposable_js_1.asyncDisposeSymbol);
                {
                    const env_38 = { stack: [], error: void 0, hasError: false };
                    try {
                        const _ = __addDisposableResource(env_38, handle, true);
                    }
                    catch (e_37) {
                        env_38.error = e_37;
                        env_38.hasError = true;
                    }
                    finally {
                        const result_1 = __disposeResources(env_38);
                        if (result_1)
                            await result_1;
                    }
                }
                (0, expect_1.default)(handle).toBeInstanceOf(ElementHandle_js_1.ElementHandle);
                (0, expect_1.default)(spy.calledOnce).toBeTruthy();
                (0, expect_1.default)(handle.disposed).toBeTruthy();
            }
            catch (e_38) {
                env_37.error = e_38;
                env_37.hasError = true;
            }
            finally {
                __disposeResources(env_37);
            }
        });
    });
    describe('ElementHandle.move', () => {
        it('should work', async () => {
            const env_39 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_39, await page.evaluateHandle('document'), false);
                const spy = sinon_1.default.spy(handle, disposable_js_1.disposeSymbol);
                {
                    const env_40 = { stack: [], error: void 0, hasError: false };
                    try {
                        const _ = __addDisposableResource(env_40, handle, false);
                        handle.move();
                    }
                    catch (e_39) {
                        env_40.error = e_39;
                        env_40.hasError = true;
                    }
                    finally {
                        __disposeResources(env_40);
                    }
                }
                (0, expect_1.default)(handle).toBeInstanceOf(ElementHandle_js_1.ElementHandle);
                (0, expect_1.default)(spy.calledOnce).toBeTruthy();
                (0, expect_1.default)(handle.disposed).toBeFalsy();
            }
            catch (e_40) {
                env_39.error = e_40;
                env_39.hasError = true;
            }
            finally {
                __disposeResources(env_39);
            }
        });
    });
});
//# sourceMappingURL=elementhandle.spec.js.map