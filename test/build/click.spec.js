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
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('Page.click', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should click the button', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/button.html');
        await page.click('button');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result;
        })).toBe('Clicked');
    });
    it('should click svg', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent(`
        <svg height="100" width="100">
          <circle onclick="javascript:window.__CLICKED=42" cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
        </svg>
      `);
        await page.click('circle');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.__CLICKED;
        })).toBe(42);
    });
    it('should click the button if window.Node is removed', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/button.html');
        await page.evaluate(() => {
            // @ts-expect-error Expected.
            return delete window.Node;
        });
        await page.click('button');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result;
        })).toBe('Clicked');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4281
    it('should click on a span with an inline element inside', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent(`
        <style>
        span::before {
          content: 'q';
        }
        </style>
        <span onclick='javascript:window.CLICKED=42'></span>
      `);
        await page.click('span');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.CLICKED;
        })).toBe(42);
    });
    it('should not throw UnhandledPromiseRejection when page closes', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const newPage = await page.browser().newPage();
        await Promise.all([newPage.close(), newPage.mouse.click(1, 2)]).catch(() => { });
    });
    it('should click the button after navigation', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/button.html');
        await page.click('button');
        await page.goto(server.PREFIX + '/input/button.html');
        await page.click('button');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result;
        })).toBe('Clicked');
    });
    it('should click with disabled javascript', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.setJavaScriptEnabled(false);
        await page.goto(server.PREFIX + '/wrappedlink.html');
        await Promise.all([page.click('a'), page.waitForNavigation()]);
        (0, expect_1.default)(page.url()).toBe(server.PREFIX + '/wrappedlink.html#clicked');
    });
    it('should scroll and click with disabled javascript', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setJavaScriptEnabled(false);
            await page.goto(server.PREFIX + '/wrappedlink.html');
            const body = __addDisposableResource(env_1, await page.waitForSelector('body'), false);
            await body.evaluate(el => {
                el.style.paddingTop = '3000px';
            });
            await Promise.all([page.click('a'), page.waitForNavigation()]);
            (0, expect_1.default)(page.url()).toBe(server.PREFIX + '/wrappedlink.html#clicked');
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should click when one of inline box children is outside of viewport', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent(`
        <style>
        i {
          position: absolute;
          top: -1000px;
        }
        </style>
        <span onclick='javascript:window.CLICKED = 42;'><i>woof</i><b>doggo</b></span>
      `);
        await page.click('span');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.CLICKED;
        })).toBe(42);
    });
    it('should select the text by triple clicking', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.focus('textarea');
        const text = "This is the text that we are going to try to select. Let's see how it goes.";
        await page.keyboard.type(text);
        await page.evaluate(() => {
            window.clicks = [];
            window.addEventListener('click', event => {
                return window.clicks.push(event.detail);
            });
        });
        await page.click('textarea', { count: 3 });
        (0, expect_1.default)(await page.evaluate(() => {
            return window.clicks;
        })).toMatchObject({ 0: 1, 1: 2, 2: 3 });
        (0, expect_1.default)(await page.evaluate(() => {
            const textarea = document.querySelector('textarea');
            return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        })).toBe(text);
    });
    it('should click offscreen buttons', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/offscreenbuttons.html');
        const messages = [];
        page.on('console', msg => {
            if (msg.type() === 'log') {
                return messages.push(msg.text());
            }
            return;
        });
        for (let i = 0; i < 11; ++i) {
            // We might've scrolled to click a button - reset to (0, 0).
            await page.evaluate(() => {
                return window.scrollTo(0, 0);
            });
            await page.click(`#btn${i}`);
        }
        (0, expect_1.default)(messages).toEqual([
            'button #0 clicked',
            'button #1 clicked',
            'button #2 clicked',
            'button #3 clicked',
            'button #4 clicked',
            'button #5 clicked',
            'button #6 clicked',
            'button #7 clicked',
            'button #8 clicked',
            'button #9 clicked',
            'button #10 clicked',
        ]);
    });
    it('should click wrapped links', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/wrappedlink.html');
        await page.click('a');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.__clicked;
        })).toBe(true);
    });
    it('should click on checkbox input and toggle', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/checkbox.html');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.check;
        })).toBe(null);
        await page.click('input#agree');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.check;
        })).toBe(true);
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.events;
        })).toEqual([
            'mouseover',
            'mouseenter',
            'mousemove',
            'mousedown',
            'mouseup',
            'click',
            'input',
            'change',
        ]);
        await page.click('input#agree');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.check;
        })).toBe(false);
    });
    it('should click on checkbox label and toggle', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/checkbox.html');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.check;
        })).toBe(null);
        await page.click('label[for="agree"]');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.check;
        })).toBe(true);
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.events;
        })).toEqual(['click', 'input', 'change']);
        await page.click('label[for="agree"]');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result.check;
        })).toBe(false);
    });
    it('should fail to click a missing button', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/button.html');
        let error;
        await page.click('button.does-not-exist').catch(error_ => {
            return (error = error_);
        });
        (0, expect_1.default)(error.message).toBe('No element found for selector: button.does-not-exist');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/161
    it('should not hang with touch-enabled viewports', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setViewport(puppeteer_1.KnownDevices['iPhone 6'].viewport);
        await page.mouse.down();
        await page.mouse.move(100, 10);
        await page.mouse.up();
    });
    it('should scroll and click the button', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.click('#button-5');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('#button-5').textContent;
        })).toBe('clicked');
        await page.click('#button-80');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('#button-80').textContent;
        })).toBe('clicked');
    });
    it('should double click the button', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/button.html');
            await page.evaluate(() => {
                globalThis.double = false;
                const button = document.querySelector('button');
                button.addEventListener('dblclick', () => {
                    globalThis.double = true;
                });
            });
            const button = __addDisposableResource(env_2, (await page.$('button')), false);
            await button.click({ count: 2 });
            (0, expect_1.default)(await page.evaluate('double')).toBe(true);
            (0, expect_1.default)(await page.evaluate('result')).toBe('Clicked');
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    it('should click a partially obscured button', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/button.html');
        await page.evaluate(() => {
            const button = document.querySelector('button');
            button.textContent = 'Some really long text that will go offscreen';
            button.style.position = 'absolute';
            button.style.left = '368px';
        });
        await page.click('button');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result;
        })).toBe('Clicked');
    });
    it('should click a rotated button', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/rotatedButton.html');
        await page.click('button');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.result;
        })).toBe('Clicked');
    });
    it('should fire contextmenu event on right click', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.click('#button-8', { button: 'right' });
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('#button-8').textContent;
        })).toBe('context menu');
    });
    it('should fire aux event on middle click', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.click('#button-8', { button: 'middle' });
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('#button-8').textContent;
        })).toBe('aux click');
    });
    it('should fire back click', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.click('#button-8', { button: 'back' });
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('#button-8').textContent;
        })).toBe('back click');
    });
    it('should fire forward click', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.click('#button-8', { button: 'forward' });
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('#button-8').textContent;
        })).toBe('forward click');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/206
    it('should click links which cause navigation', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent(`<a href="${server.EMPTY_PAGE}">empty.html</a>`);
        // This await should not hang.
        await page.click('a');
    });
    it('should click the button inside an iframe', async () => {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setContent('<div style="width:100px;height:100px">spacer</div>');
            await (0, utils_js_1.attachFrame)(page, 'button-test', server.PREFIX + '/input/button.html');
            const frame = page.frames()[1];
            const button = __addDisposableResource(env_3, await frame.$('button'), false);
            await button.click();
            (0, expect_1.default)(await frame.evaluate(() => {
                return globalThis.result;
            })).toBe('Clicked');
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            __disposeResources(env_3);
        }
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4110
    it('should click the button with fixed position inside an iframe', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.setViewport({ width: 500, height: 500 });
        await page.setContent('<div style="width:100px;height:2000px">spacer</div>');
        await (0, utils_js_1.attachFrame)(page, 'button-test', server.CROSS_PROCESS_PREFIX + '/input/button.html');
        const frame = page.frames()[1];
        await frame.$eval('button', button => {
            return button.style.setProperty('position', 'fixed');
        });
        await frame.click('button');
        (0, expect_1.default)(await frame.evaluate(() => {
            return globalThis.result;
        })).toBe('Clicked');
    });
    it('should click the button with deviceScaleFactor set', async () => {
        const env_4 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 400, height: 400, deviceScaleFactor: 5 });
            (0, expect_1.default)(await page.evaluate(() => {
                return window.devicePixelRatio;
            })).toBe(5);
            await page.setContent('<div style="width:100px;height:100px">spacer</div>');
            await (0, utils_js_1.attachFrame)(page, 'button-test', server.PREFIX + '/input/button.html');
            const frame = page.frames()[1];
            const button = __addDisposableResource(env_4, await frame.$('button'), false);
            await button.click();
            (0, expect_1.default)(await frame.evaluate(() => {
                return globalThis.result;
            })).toBe('Clicked');
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
//# sourceMappingURL=click.spec.js.map