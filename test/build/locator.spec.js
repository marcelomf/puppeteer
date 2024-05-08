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
const expect_1 = __importDefault(require("expect"));
const puppeteer_core_1 = require("puppeteer-core");
const locators_js_1 = require("puppeteer-core/internal/api/locators/locators.js");
const sinon_1 = __importDefault(require("sinon"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('Locator', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should work with a frame', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.setContent(`
      <button onclick="this.innerText = 'clicked';">test</button>
    `);
            let willClick = false;
            await page
                .mainFrame()
                .locator('button')
                .on(locators_js_1.LocatorEvent.Action, () => {
                willClick = true;
            })
                .click();
            const button = __addDisposableResource(env_1, await page.$('button'), false);
            const text = await button?.evaluate(el => {
                return el.innerText;
            });
            (0, expect_1.default)(text).toBe('clicked');
            (0, expect_1.default)(willClick).toBe(true);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should work without preconditions', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.setContent(`
      <button onclick="this.innerText = 'clicked';">test</button>
    `);
            let willClick = false;
            await page
                .locator('button')
                .setEnsureElementIsInTheViewport(false)
                .setTimeout(0)
                .setVisibility(null)
                .setWaitForEnabled(false)
                .setWaitForStableBoundingBox(false)
                .on(locators_js_1.LocatorEvent.Action, () => {
                willClick = true;
            })
                .click();
            const button = __addDisposableResource(env_2, await page.$('button'), false);
            const text = await button?.evaluate(el => {
                return el.innerText;
            });
            (0, expect_1.default)(text).toBe('clicked');
            (0, expect_1.default)(willClick).toBe(true);
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    describe('Locator.click', function () {
        it('should work', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <button onclick="this.innerText = 'clicked';">test</button>
      `);
                let willClick = false;
                await page
                    .locator('button')
                    .on(locators_js_1.LocatorEvent.Action, () => {
                    willClick = true;
                })
                    .click();
                const button = __addDisposableResource(env_3, await page.$('button'), false);
                const text = await button?.evaluate(el => {
                    return el.innerText;
                });
                (0, expect_1.default)(text).toBe('clicked');
                (0, expect_1.default)(willClick).toBe(true);
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should work for multiple selectors', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <button onclick="this.innerText = 'clicked';">test</button>
      `);
                let clicked = false;
                await page
                    .locator('::-p-text(test), ::-p-xpath(/button)')
                    .on(locators_js_1.LocatorEvent.Action, () => {
                    clicked = true;
                })
                    .click();
                const button = __addDisposableResource(env_4, await page.$('button'), false);
                const text = await button?.evaluate(el => {
                    return el.innerText;
                });
                (0, expect_1.default)(text).toBe('clicked');
                (0, expect_1.default)(clicked).toBe(true);
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
        it('should work if the element is out of viewport', async () => {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <button style="margin-top: 600px;" onclick="this.innerText = 'clicked';">test</button>
      `);
                await page.locator('button').click();
                const button = __addDisposableResource(env_5, await page.$('button'), false);
                const text = await button?.evaluate(el => {
                    return el.innerText;
                });
                (0, expect_1.default)(text).toBe('clicked');
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        });
        it('should work if the element becomes visible later', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
      `);
                const button = __addDisposableResource(env_6, await page.$('button'), false);
                const result = page
                    .locator('button')
                    .click()
                    .catch(err => {
                    return err;
                });
                (0, expect_1.default)(await button?.evaluate(el => {
                    return el.innerText;
                })).toBe('test');
                await button?.evaluate(el => {
                    el.style.display = 'block';
                });
                const maybeError = await result;
                if (maybeError instanceof Error) {
                    throw maybeError;
                }
                (0, expect_1.default)(await button?.evaluate(el => {
                    return el.innerText;
                })).toBe('clicked');
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        });
        it('should work if the element becomes enabled later', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <button disabled onclick="this.innerText = 'clicked';">test</button>
      `);
                const button = __addDisposableResource(env_7, await page.$('button'), false);
                const result = page.locator('button').click();
                (0, expect_1.default)(await button?.evaluate(el => {
                    return el.innerText;
                })).toBe('test');
                await button?.evaluate(el => {
                    el.disabled = false;
                });
                await result;
                (0, expect_1.default)(await button?.evaluate(el => {
                    return el.innerText;
                })).toBe('clicked');
            }
            catch (e_7) {
                env_7.error = e_7;
                env_7.hasError = true;
            }
            finally {
                __disposeResources(env_7);
            }
        });
        it('should work if multiple conditions are satisfied later', async () => {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <button style="margin-top: 600px;" style="display: none;" disabled onclick="this.innerText = 'clicked';">test</button>
      `);
                const button = __addDisposableResource(env_8, await page.$('button'), false);
                const result = page.locator('button').click();
                (0, expect_1.default)(await button?.evaluate(el => {
                    return el.innerText;
                })).toBe('test');
                await button?.evaluate(el => {
                    el.disabled = false;
                    el.style.display = 'block';
                });
                await result;
                (0, expect_1.default)(await button?.evaluate(el => {
                    return el.innerText;
                })).toBe('clicked');
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        });
        it('should time out', async () => {
            const clock = sinon_1.default.useFakeTimers({
                shouldClearNativeTimers: true,
                shouldAdvanceTime: true,
            });
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                page.setDefaultTimeout(5000);
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
                const result = page.locator('button').click();
                clock.tick(5100);
                await (0, expect_1.default)(result).rejects.toEqual(new puppeteer_core_1.TimeoutError('Timed out after waiting 5000ms'));
            }
            finally {
                clock.restore();
            }
        });
        it('should retry clicks on errors', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const clock = sinon_1.default.useFakeTimers({
                shouldClearNativeTimers: true,
                shouldAdvanceTime: true,
            });
            try {
                page.setDefaultTimeout(5000);
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
                const result = page.locator('button').click();
                clock.tick(5100);
                await (0, expect_1.default)(result).rejects.toEqual(new puppeteer_core_1.TimeoutError('Timed out after waiting 5000ms'));
            }
            finally {
                clock.restore();
            }
        });
        it('can be aborted', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const clock = sinon_1.default.useFakeTimers({
                shouldClearNativeTimers: true,
                shouldAdvanceTime: true,
            });
            try {
                page.setDefaultTimeout(5000);
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
                const abortController = new AbortController();
                const result = page.locator('button').click({
                    signal: abortController.signal,
                });
                clock.tick(2000);
                abortController.abort();
                await (0, expect_1.default)(result).rejects.toThrow(/aborted/);
            }
            finally {
                clock.restore();
            }
        });
        it('should work with a OOPIF', async () => {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <iframe src="data:text/html,<button onclick=&quot;this.innerText = 'clicked';&quot;>test</button>"></iframe>
      `);
                const frame = await page.waitForFrame(frame => {
                    return frame.url().startsWith('data');
                });
                let willClick = false;
                await frame
                    .locator('button')
                    .on(locators_js_1.LocatorEvent.Action, () => {
                    willClick = true;
                })
                    .click();
                const button = __addDisposableResource(env_9, await frame.$('button'), false);
                const text = await button?.evaluate(el => {
                    return el.innerText;
                });
                (0, expect_1.default)(text).toBe('clicked');
                (0, expect_1.default)(willClick).toBe(true);
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
    describe('Locator.hover', function () {
        it('should work', async () => {
            const env_10 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <button onmouseenter="this.innerText = 'hovered';">test</button>
      `);
                let hovered = false;
                await page
                    .locator('button')
                    .on(locators_js_1.LocatorEvent.Action, () => {
                    hovered = true;
                })
                    .hover();
                const button = __addDisposableResource(env_10, await page.$('button'), false);
                const text = await button?.evaluate(el => {
                    return el.innerText;
                });
                (0, expect_1.default)(text).toBe('hovered');
                (0, expect_1.default)(hovered).toBe(true);
            }
            catch (e_10) {
                env_10.error = e_10;
                env_10.hasError = true;
            }
            finally {
                __disposeResources(env_10);
            }
        });
    });
    describe('Locator.scroll', function () {
        it('should work', async () => {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
        <div style="height: 500px; width: 500px; overflow: scroll;">
          <div style="height: 1000px; width: 1000px;">test</div>
        </div>
      `);
                let scrolled = false;
                await page
                    .locator('div')
                    .on(locators_js_1.LocatorEvent.Action, () => {
                    scrolled = true;
                })
                    .scroll({
                    scrollTop: 500,
                    scrollLeft: 500,
                });
                const scrollable = __addDisposableResource(env_11, await page.$('div'), false);
                const scroll = await scrollable?.evaluate(el => {
                    return el.scrollTop + ' ' + el.scrollLeft;
                });
                (0, expect_1.default)(scroll).toBe('500 500');
                (0, expect_1.default)(scrolled).toBe(true);
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
    describe('Locator.fill', function () {
        it('should work for textarea', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <textarea></textarea>
      `);
            let filled = false;
            await page
                .locator('textarea')
                .on(locators_js_1.LocatorEvent.Action, () => {
                filled = true;
            })
                .fill('test');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('textarea')?.value === 'test';
            })).toBe(true);
            (0, expect_1.default)(filled).toBe(true);
        });
        it('should work for selects', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <select>
          <option value="value1">Option 1</option>
          <option value="value2">Option 2</option>
        <select>
      `);
            let filled = false;
            await page
                .locator('select')
                .on(locators_js_1.LocatorEvent.Action, () => {
                filled = true;
            })
                .fill('value2');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('select')?.value === 'value2';
            })).toBe(true);
            (0, expect_1.default)(filled).toBe(true);
        });
        it('should work for inputs', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <input>
      `);
            await page.locator('input').fill('test');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('input')?.value === 'test';
            })).toBe(true);
        });
        it('should work if the input becomes enabled later', async () => {
            const env_12 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`
        <input disabled>
      `);
                const input = __addDisposableResource(env_12, await page.$('input'), false);
                const result = page.locator('input').fill('test');
                (0, expect_1.default)(await input?.evaluate(el => {
                    return el.value;
                })).toBe('');
                await input?.evaluate(el => {
                    el.disabled = false;
                });
                await result;
                (0, expect_1.default)(await input?.evaluate(el => {
                    return el.value;
                })).toBe('test');
            }
            catch (e_12) {
                env_12.error = e_12;
                env_12.hasError = true;
            }
            finally {
                __disposeResources(env_12);
            }
        });
        it('should work for contenteditable', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div contenteditable="true">
      `);
            await page.locator('div').fill('test');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('div')?.innerText === 'test';
            })).toBe(true);
        });
        it('should work for pre-filled inputs', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <input value="te">
      `);
            await page.locator('input').fill('test');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('input')?.value === 'test';
            })).toBe(true);
        });
        it('should override pre-filled inputs', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <input value="wrong prefix">
      `);
            await page.locator('input').fill('test');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('input')?.value === 'test';
            })).toBe(true);
        });
        it('should work for non-text inputs', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <input type="color">
      `);
            await page.locator('input').fill('#333333');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('input')?.value === '#333333';
            })).toBe(true);
        });
    });
    describe('Locator.race', () => {
        it('races multiple locators', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.setContent(`
        <button onclick="window.count++;">test</button>
      `);
            await page.evaluate(() => {
                // @ts-expect-error different context.
                window.count = 0;
            });
            await locators_js_1.Locator.race([
                page.locator('button'),
                page.locator('button'),
            ]).click();
            const count = await page.evaluate(() => {
                // @ts-expect-error different context.
                return globalThis.count;
            });
            (0, expect_1.default)(count).toBe(1);
        });
        it('can be aborted', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const clock = sinon_1.default.useFakeTimers({
                shouldClearNativeTimers: true,
                shouldAdvanceTime: true,
            });
            try {
                await page.setViewport({ width: 500, height: 500 });
                await page.setContent(`
          <button style="display: none;" onclick="this.innerText = 'clicked';">test</button>
        `);
                const abortController = new AbortController();
                const result = locators_js_1.Locator.race([
                    page.locator('button'),
                    page.locator('button'),
                ])
                    .setTimeout(5000)
                    .click({
                    signal: abortController.signal,
                });
                clock.tick(2000);
                abortController.abort();
                await (0, expect_1.default)(result).rejects.toThrow(/aborted/);
            }
            finally {
                clock.restore();
            }
        });
        it('should time out when all locators do not match', async () => {
            const clock = sinon_1.default.useFakeTimers({
                shouldClearNativeTimers: true,
                shouldAdvanceTime: true,
            });
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`<button>test</button>`);
                const result = locators_js_1.Locator.race([
                    page.locator('not-found'),
                    page.locator('not-found'),
                ])
                    .setTimeout(5000)
                    .click();
                clock.tick(5100);
                await (0, expect_1.default)(result).rejects.toEqual(new puppeteer_core_1.TimeoutError('Timed out after waiting 5000ms'));
            }
            finally {
                clock.restore();
            }
        });
        it('should not time out when one of the locators matches', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<button>test</button>`);
            const result = locators_js_1.Locator.race([
                page.locator('not-found'),
                page.locator('button'),
            ]).click();
            await (0, expect_1.default)(result).resolves.toEqual(undefined);
        });
    });
    describe('Locator.prototype.map', () => {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<div>test</div>`);
            await (0, expect_1.default)(page
                .locator('::-p-text(test)')
                .map(element => {
                return element.getAttribute('clickable');
            })
                .wait()).resolves.toEqual(null);
            await page.evaluate(() => {
                document.querySelector('div')?.setAttribute('clickable', 'true');
            });
            await (0, expect_1.default)(page
                .locator('::-p-text(test)')
                .map(element => {
                return element.getAttribute('clickable');
            })
                .wait()).resolves.toEqual('true');
        });
        it('should work with throws', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<div>test</div>`);
            const result = page
                .locator('::-p-text(test)')
                .map(element => {
                const clickable = element.getAttribute('clickable');
                if (!clickable) {
                    throw new Error('Missing `clickable` as an attribute');
                }
                return clickable;
            })
                .wait();
            await page.evaluate(() => {
                document.querySelector('div')?.setAttribute('clickable', 'true');
            });
            await (0, expect_1.default)(result).resolves.toEqual('true');
        });
        it('should work with expect', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<div>test</div>`);
            const result = page
                .locator('::-p-text(test)')
                .filter(element => {
                return element.getAttribute('clickable') !== null;
            })
                .map(element => {
                return element.getAttribute('clickable');
            })
                .wait();
            await page.evaluate(() => {
                document.querySelector('div')?.setAttribute('clickable', 'true');
            });
            await (0, expect_1.default)(result).resolves.toEqual('true');
        });
    });
    describe('Locator.prototype.filter', () => {
        it('should resolve as soon as the predicate matches', async () => {
            const clock = sinon_1.default.useFakeTimers({
                shouldClearNativeTimers: true,
                shouldAdvanceTime: true,
            });
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`<div>test</div>`);
                const result = page
                    .locator('::-p-text(test)')
                    .setTimeout(5000)
                    .filter(async (element) => {
                    return element.getAttribute('clickable') === 'true';
                })
                    .filter(element => {
                    return element.getAttribute('clickable') === 'true';
                })
                    .hover();
                clock.tick(2000);
                await page.evaluate(() => {
                    document.querySelector('div')?.setAttribute('clickable', 'true');
                });
                clock.restore();
                await (0, expect_1.default)(result).resolves.toEqual(undefined);
            }
            finally {
                clock.restore();
            }
        });
    });
    describe('Locator.prototype.wait', () => {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            void page.setContent(`
        <script>
          setTimeout(() => {
            const element = document.createElement("div");
            element.innerText = "test2"
            document.body.append(element);
          }, 50);
        </script>
      `);
            // This shouldn't throw.
            await page.locator('div').wait();
        });
    });
    describe('Locator.prototype.waitHandle', () => {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            void page.setContent(`
        <script>
          setTimeout(() => {
            const element = document.createElement("div");
            element.innerText = "test2"
            document.body.append(element);
          }, 50);
        </script>
      `);
            await (0, expect_1.default)(page.locator('div').waitHandle()).resolves.toBeDefined();
        });
    });
    describe('Locator.prototype.clone', () => {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const locator = page.locator('div');
            const clone = locator.clone();
            (0, expect_1.default)(locator).not.toStrictEqual(clone);
        });
        it('should work internally with delegated locators', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const locator = page.locator('div');
            const delegatedLocators = [
                locator.map(div => {
                    return div.textContent;
                }),
                locator.filter(div => {
                    return div.textContent?.length === 0;
                }),
            ];
            for (let delegatedLocator of delegatedLocators) {
                delegatedLocator = delegatedLocator.setTimeout(500);
                (0, expect_1.default)(delegatedLocator.timeout).not.toStrictEqual(locator.timeout);
            }
        });
    });
    describe('FunctionLocator', () => {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = page
                .locator(() => {
                return new Promise(resolve => {
                    return setTimeout(() => {
                        return resolve(true);
                    }, 100);
                });
            })
                .wait();
            await (0, expect_1.default)(result).resolves.toEqual(true);
        });
        it('should work with actions', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<div onclick="window.clicked = true">test</div>`);
            await page
                .locator(() => {
                return document.getElementsByTagName('div')[0];
            })
                .click();
            await (0, expect_1.default)(page.evaluate(() => {
                return window.clicked;
            })).resolves.toEqual(true);
        });
    });
});
//# sourceMappingURL=locator.spec.js.map