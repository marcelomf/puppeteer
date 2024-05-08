"use strict";
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
/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const os_1 = __importDefault(require("os"));
const expect_1 = __importDefault(require("expect"));
const Input_js_1 = require("puppeteer-core/internal/api/Input.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
function dimensions() {
    const rect = document.querySelector('textarea').getBoundingClientRect();
    return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
    };
}
describe('Mouse', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should click the document', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.evaluate(() => {
            globalThis.clickPromise = new Promise(resolve => {
                document.addEventListener('click', event => {
                    resolve({
                        type: event.type,
                        detail: event.detail,
                        clientX: event.clientX,
                        clientY: event.clientY,
                        isTrusted: event.isTrusted,
                        button: event.button,
                    });
                });
            });
        });
        await page.mouse.click(50, 60);
        const event = await page.evaluate(() => {
            return globalThis.clickPromise;
        });
        (0, expect_1.default)(event.type).toBe('click');
        (0, expect_1.default)(event.detail).toBe(1);
        (0, expect_1.default)(event.clientX).toBe(50);
        (0, expect_1.default)(event.clientY).toBe(60);
        (0, expect_1.default)(event.isTrusted).toBe(true);
        (0, expect_1.default)(event.button).toBe(0);
    });
    it('should resize the textarea', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        const { x, y, width, height } = await page.evaluate(dimensions);
        const mouse = page.mouse;
        await mouse.move(x + width - 4, y + height - 4);
        await mouse.down();
        await mouse.move(x + width + 100, y + height + 100);
        await mouse.up();
        const newDimensions = await page.evaluate(dimensions);
        (0, expect_1.default)(newDimensions.width).toBe(Math.round(width + 104));
        (0, expect_1.default)(newDimensions.height).toBe(Math.round(height + 104));
    });
    it('should select the text with mouse', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const text = "This is the text that we are going to try to select. Let's see how it goes.";
            await page.goto(`${server.PREFIX}/input/textarea.html`);
            await page.focus('textarea');
            await page.keyboard.type(text);
            const handle = __addDisposableResource(env_1, await page
                .locator('textarea')
                .filterHandle(async (element) => {
                return await element.evaluate((element, text) => {
                    return element.value === text;
                }, text);
            })
                .waitHandle(), false);
            const { x, y } = await page.evaluate(dimensions);
            await page.mouse.move(x + 2, y + 2);
            await page.mouse.down();
            await page.mouse.move(100, 100);
            await page.mouse.up();
            (0, expect_1.default)(await handle.evaluate(element => {
                return element.value.substring(element.selectionStart, element.selectionEnd);
            })).toBe(text);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should trigger hover state', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.hover('#button-6');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('button:hover').id;
        })).toBe('button-6');
        await page.hover('#button-2');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('button:hover').id;
        })).toBe('button-2');
        await page.hover('#button-91');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('button:hover').id;
        })).toBe('button-91');
    });
    it('should trigger hover state with removed window.Node', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.evaluate(() => {
            // @ts-expect-error Expected.
            return delete window.Node;
        });
        await page.hover('#button-6');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('button:hover').id;
        })).toBe('button-6');
    });
    it('should set modifier keys on click', async () => {
        const { page, server, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/scrollable.html');
        await page.evaluate(() => {
            return document.querySelector('#button-3').addEventListener('mousedown', e => {
                return (globalThis.lastEvent = e);
            }, true);
        });
        const modifiers = new Map([
            ['Shift', 'shiftKey'],
            ['Control', 'ctrlKey'],
            ['Alt', 'altKey'],
            ['Meta', 'metaKey'],
        ]);
        // In Firefox, the Meta modifier only exists on Mac
        if (isFirefox && os_1.default.platform() !== 'darwin') {
            modifiers.delete('Meta');
        }
        for (const [modifier, key] of modifiers) {
            await page.keyboard.down(modifier);
            await page.click('#button-3');
            if (!(await page.evaluate((mod) => {
                return globalThis.lastEvent[mod];
            }, key))) {
                throw new Error(key + ' should be true');
            }
            await page.keyboard.up(modifier);
        }
        await page.click('#button-3');
        for (const [modifier, key] of modifiers) {
            if (await page.evaluate((mod) => {
                return globalThis.lastEvent[mod];
            }, key)) {
                throw new Error(modifiers.get(modifier) + ' should be false');
            }
        }
    });
    it('should send mouse wheel events', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/wheel.html');
            const elem = __addDisposableResource(env_2, (await page.$('div')), false);
            const boundingBoxBefore = (await elem.boundingBox());
            (0, expect_1.default)(boundingBoxBefore).toMatchObject({
                width: 115,
                height: 115,
            });
            await page.mouse.move(boundingBoxBefore.x + boundingBoxBefore.width / 2, boundingBoxBefore.y + boundingBoxBefore.height / 2);
            await page.mouse.wheel({ deltaY: -100 });
            const boundingBoxAfter = await elem.boundingBox();
            (0, expect_1.default)(boundingBoxAfter).toMatchObject({
                width: 230,
                height: 230,
            });
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    it('should tween mouse movement', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.mouse.move(100, 100);
        await page.evaluate(() => {
            globalThis.result = [];
            document.addEventListener('mousemove', event => {
                globalThis.result.push([event.clientX, event.clientY]);
            });
        });
        await page.mouse.move(200, 300, { steps: 5 });
        (0, expect_1.default)(await page.evaluate('result')).toEqual([
            [120, 140],
            [140, 180],
            [160, 220],
            [180, 260],
            [200, 300],
        ]);
    });
    // @see https://crbug.com/929806
    it('should work with mobile viewports and cross process navigations', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.setViewport({ width: 360, height: 640, isMobile: true });
        await page.goto(server.CROSS_PROCESS_PREFIX + '/mobile.html');
        await page.evaluate(() => {
            document.addEventListener('click', event => {
                globalThis.result = { x: event.clientX, y: event.clientY };
            });
        });
        await page.mouse.click(30, 40);
        (0, expect_1.default)(await page.evaluate('result')).toEqual({ x: 30, y: 40 });
    });
    it('should not throw if buttons are pressed twice', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.mouse.down();
        await page.mouse.down();
    });
    const addMouseDataListeners = (page, options = {}) => {
        return page.evaluate(({ includeMove }) => {
            const clicks = [];
            const mouseEventListener = (event) => {
                clicks.push({
                    type: event.type,
                    detail: event.detail,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    isTrusted: event.isTrusted,
                    button: event.button,
                    buttons: event.buttons,
                });
            };
            document.addEventListener('mousedown', mouseEventListener);
            if (includeMove) {
                document.addEventListener('mousemove', mouseEventListener);
            }
            document.addEventListener('mouseup', mouseEventListener);
            document.addEventListener('click', mouseEventListener);
            document.addEventListener('auxclick', mouseEventListener);
            window.clicks = clicks;
        }, options);
    };
    it('should not throw if clicking in parallel', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await addMouseDataListeners(page);
        await Promise.all([page.mouse.click(0, 5), page.mouse.click(6, 10)]);
        const data = await page.evaluate(() => {
            return window.clicks;
        });
        const commonAttrs = {
            isTrusted: true,
            detail: 1,
            clientY: 5,
            clientX: 0,
            button: 0,
        };
        (0, expect_1.default)(data.splice(0, 3)).toMatchObject({
            0: {
                type: 'mousedown',
                buttons: 1,
                ...commonAttrs,
            },
            1: {
                type: 'mouseup',
                buttons: 0,
                ...commonAttrs,
            },
            2: {
                type: 'click',
                buttons: 0,
                ...commonAttrs,
            },
        });
        Object.assign(commonAttrs, {
            clientX: 6,
            clientY: 10,
        });
        (0, expect_1.default)(data).toMatchObject({
            0: {
                type: 'mousedown',
                buttons: 1,
                ...commonAttrs,
            },
            1: {
                type: 'mouseup',
                buttons: 0,
                ...commonAttrs,
            },
            2: {
                type: 'click',
                buttons: 0,
                ...commonAttrs,
            },
        });
    });
    it('should reset properly', async () => {
        const { page, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.mouse.move(5, 5);
        await Promise.all([
            page.mouse.down({ button: Input_js_1.MouseButton.Left }),
            page.mouse.down({ button: Input_js_1.MouseButton.Middle }),
            page.mouse.down({ button: Input_js_1.MouseButton.Right }),
        ]);
        await addMouseDataListeners(page, { includeMove: true });
        await page.mouse.reset();
        const data = await page.evaluate(() => {
            return window.clicks;
        });
        const commonAttrs = {
            isTrusted: true,
            clientY: 5,
            clientX: 5,
        };
        (0, expect_1.default)(data.slice(0, 2)).toMatchObject([
            {
                ...commonAttrs,
                button: 2,
                buttons: 5,
                detail: 1,
                type: 'mouseup',
            },
            {
                ...commonAttrs,
                button: 2,
                buttons: 5,
                detail: 1,
                type: 'auxclick',
            },
        ]);
        // TODO(crbug/1485040): This should align with the firefox implementation.
        if (isChrome) {
            (0, expect_1.default)(data.slice(2)).toMatchObject([
                {
                    ...commonAttrs,
                    button: 1,
                    buttons: 1,
                    detail: 0,
                    type: 'mouseup',
                },
                {
                    ...commonAttrs,
                    button: 0,
                    buttons: 0,
                    detail: 0,
                    type: 'mouseup',
                },
            ]);
            return;
        }
        (0, expect_1.default)(data.slice(2)).toMatchObject([
            {
                ...commonAttrs,
                button: 1,
                buttons: 1,
                detail: 1,
                type: 'mouseup',
            },
            {
                ...commonAttrs,
                button: 1,
                buttons: 1,
                detail: 1,
                type: 'auxclick',
            },
            {
                ...commonAttrs,
                button: 0,
                buttons: 0,
                detail: 1,
                type: 'mouseup',
            },
            {
                ...commonAttrs,
                button: 0,
                buttons: 0,
                detail: 1,
                type: 'click',
            },
        ]);
    });
    it('should evaluate before mouse event', async () => {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.goto(server.CROSS_PROCESS_PREFIX + '/input/button.html');
            const button = __addDisposableResource(env_3, await page.waitForSelector('button'), false);
            const point = await button.clickablePoint();
            const result = page.evaluate(() => {
                return new Promise(resolve => {
                    document
                        .querySelector('button')
                        ?.addEventListener('click', resolve, { once: true });
                });
            });
            await page.mouse.click(point?.x, point?.y);
            await result;
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            __disposeResources(env_3);
        }
    });
});
//# sourceMappingURL=mouse.spec.js.map