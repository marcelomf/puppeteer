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
const CDPSession_js_1 = require("puppeteer-core/internal/api/CDPSession.js");
const assert_js_1 = require("puppeteer-core/internal/util/assert.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('Frame specs', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Frame.evaluateHandle', function () {
        it('should work', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const mainFrame = page.mainFrame();
                const windowHandle = __addDisposableResource(env_1, await mainFrame.evaluateHandle(() => {
                    return window;
                }), false);
                (0, expect_1.default)(windowHandle).toBeTruthy();
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
    });
    describe('Frame.evaluate', function () {
        it('should throw for detached frames', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const frame1 = (await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE));
            await (0, utils_js_1.detachFrame)(page, 'frame1');
            let error;
            try {
                await frame1.evaluate(() => {
                    return 7 * 8;
                });
            }
            catch (err) {
                error = err;
            }
            (0, expect_1.default)(error?.message).toContain('Attempted to use detached Frame');
        });
        it('allows readonly array to be an argument', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const mainFrame = page.mainFrame();
            // This test checks if Frame.evaluate allows a readonly array to be an argument.
            // See https://github.com/puppeteer/puppeteer/issues/6953.
            const readonlyArray = ['a', 'b', 'c'];
            await mainFrame.evaluate(arr => {
                return arr;
            }, readonlyArray);
        });
    });
    describe('Frame.page', function () {
        it('should retrieve the page from a frame', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const mainFrame = page.mainFrame();
            (0, expect_1.default)(mainFrame.page()).toEqual(page);
        });
    });
    describe('Frame Management', function () {
        it('should handle nested frames', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/frames/nested-frames.html');
            (0, expect_1.default)(await (0, utils_js_1.dumpFrames)(page.mainFrame())).toEqual([
                'http://localhost:<PORT>/frames/nested-frames.html',
                '    http://localhost:<PORT>/frames/two-frames.html (2frames)',
                '        http://localhost:<PORT>/frames/frame.html (uno)',
                '        http://localhost:<PORT>/frames/frame.html (dos)',
                '    http://localhost:<PORT>/frames/frame.html (aframe)',
            ]);
        });
        it('should send events when frames are manipulated dynamically', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            // validate frameattached events
            const attachedFrames = [];
            page.on('frameattached', frame => {
                return attachedFrames.push(frame);
            });
            await (0, utils_js_1.attachFrame)(page, 'frame1', './assets/frame.html');
            (0, expect_1.default)(attachedFrames).toHaveLength(1);
            (0, expect_1.default)(attachedFrames[0].url()).toContain('/assets/frame.html');
            // validate framenavigated events
            const navigatedFrames = [];
            page.on('framenavigated', frame => {
                return navigatedFrames.push(frame);
            });
            await (0, utils_js_1.navigateFrame)(page, 'frame1', './empty.html');
            (0, expect_1.default)(navigatedFrames).toHaveLength(1);
            (0, expect_1.default)(navigatedFrames[0].url()).toBe(server.EMPTY_PAGE);
            // validate framedetached events
            const detachedFrames = [];
            page.on('framedetached', frame => {
                return detachedFrames.push(frame);
            });
            await (0, utils_js_1.detachFrame)(page, 'frame1');
            (0, expect_1.default)(detachedFrames).toHaveLength(1);
            (0, expect_1.default)(detachedFrames[0].isDetached()).toBe(true);
        });
        it('should send "framenavigated" when navigating on anchor URLs', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await Promise.all([
                page.goto(server.EMPTY_PAGE + '#foo'),
                (0, utils_js_1.waitEvent)(page, 'framenavigated'),
            ]);
            (0, expect_1.default)(page.url()).toBe(server.EMPTY_PAGE + '#foo');
        });
        it('should persist mainFrame on cross-process navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const mainFrame = page.mainFrame();
            await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
            (0, expect_1.default)(page.mainFrame() === mainFrame).toBeTruthy();
        });
        it('should not send attach/detach events for main frame', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let hasEvents = false;
            page.on('frameattached', () => {
                return (hasEvents = true);
            });
            page.on('framedetached', () => {
                return (hasEvents = true);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(hasEvents).toBe(false);
        });
        it('should detach child frames on navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let attachedFrames = [];
            let detachedFrames = [];
            let navigatedFrames = [];
            page.on('frameattached', frame => {
                return attachedFrames.push(frame);
            });
            page.on('framedetached', frame => {
                return detachedFrames.push(frame);
            });
            page.on('framenavigated', frame => {
                return navigatedFrames.push(frame);
            });
            await page.goto(server.PREFIX + '/frames/nested-frames.html');
            (0, expect_1.default)(attachedFrames).toHaveLength(4);
            (0, expect_1.default)(detachedFrames).toHaveLength(0);
            (0, expect_1.default)(navigatedFrames).toHaveLength(5);
            attachedFrames = [];
            detachedFrames = [];
            navigatedFrames = [];
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(attachedFrames).toHaveLength(0);
            (0, expect_1.default)(detachedFrames).toHaveLength(4);
            (0, expect_1.default)(navigatedFrames).toHaveLength(1);
        });
        it('should support framesets', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let attachedFrames = [];
            let detachedFrames = [];
            let navigatedFrames = [];
            page.on('frameattached', frame => {
                return attachedFrames.push(frame);
            });
            page.on('framedetached', frame => {
                return detachedFrames.push(frame);
            });
            page.on('framenavigated', frame => {
                return navigatedFrames.push(frame);
            });
            await page.goto(server.PREFIX + '/frames/frameset.html');
            (0, expect_1.default)(attachedFrames).toHaveLength(4);
            (0, expect_1.default)(detachedFrames).toHaveLength(0);
            (0, expect_1.default)(navigatedFrames).toHaveLength(5);
            attachedFrames = [];
            detachedFrames = [];
            navigatedFrames = [];
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(attachedFrames).toHaveLength(0);
            (0, expect_1.default)(detachedFrames).toHaveLength(4);
            (0, expect_1.default)(navigatedFrames).toHaveLength(1);
        });
        it('should click elements in a frameset', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/frames/frameset.html');
                const frame = await page.waitForFrame(frame => {
                    return frame.url().endsWith('/frames/frame.html');
                });
                const div = __addDisposableResource(env_2, await frame.waitForSelector('div'), false);
                (0, expect_1.default)(div).toBeTruthy();
                await div?.click();
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should report frame from-inside shadow DOM', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/shadow.html');
            await page.evaluate(async (url) => {
                const frame = document.createElement('iframe');
                frame.src = url;
                document.body.shadowRoot.appendChild(frame);
                await new Promise(x => {
                    return (frame.onload = x);
                });
            }, server.EMPTY_PAGE);
            (0, expect_1.default)(page.frames()).toHaveLength(2);
            (0, expect_1.default)(page.frames()[1].url()).toBe(server.EMPTY_PAGE);
        });
        it('should report frame.parent()', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            await (0, utils_js_1.attachFrame)(page, 'frame2', server.EMPTY_PAGE);
            (0, expect_1.default)(page.frames()[0].parentFrame()).toBe(null);
            (0, expect_1.default)(page.frames()[1].parentFrame()).toBe(page.mainFrame());
            (0, expect_1.default)(page.frames()[2].parentFrame()).toBe(page.mainFrame());
        });
        it('should report different frame instance when frame re-attaches', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const frame1 = await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            await page.evaluate(() => {
                globalThis.frame = document.querySelector('#frame1');
                globalThis.frame.remove();
            });
            (0, expect_1.default)(frame1.isDetached()).toBe(true);
            const [frame2] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'frameattached'),
                page.evaluate(() => {
                    return document.body.appendChild(globalThis.frame);
                }),
            ]);
            (0, expect_1.default)(frame2.isDetached()).toBe(false);
            (0, expect_1.default)(frame1).not.toBe(frame2);
        });
        it('should support url fragment', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/frames/one-frame-url-fragment.html');
            (0, expect_1.default)(page.frames()).toHaveLength(2);
            (0, expect_1.default)(page.frames()[1].url()).toBe(server.PREFIX + '/frames/frame.html?param=value#fragment');
        });
        it('should support lazy frames', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 1000, height: 1000 });
            await page.goto(server.PREFIX + '/frames/lazy-frame.html');
            (0, expect_1.default)(page.frames().map(frame => {
                return frame._hasStartedLoading;
            })).toEqual([true, true, false]);
        });
    });
    describe('Frame.client', function () {
        it('should return the client instance', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(page.mainFrame().client).toBeInstanceOf(CDPSession_js_1.CDPSession);
        });
    });
    describe('Frame.prototype.frameElement', function () {
        it('should work', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await (0, utils_js_1.attachFrame)(page, 'theFrameId', server.EMPTY_PAGE);
                await page.evaluate((url) => {
                    const frame = document.createElement('iframe');
                    frame.name = 'theFrameName';
                    frame.src = url;
                    document.body.appendChild(frame);
                    return new Promise(x => {
                        return (frame.onload = x);
                    });
                }, server.EMPTY_PAGE);
                const frame0 = __addDisposableResource(env_3, await page.frames()[0]?.frameElement(), false);
                (0, assert_js_1.assert)(!frame0);
                const frame1 = __addDisposableResource(env_3, await page.frames()[1]?.frameElement(), false);
                (0, assert_js_1.assert)(frame1);
                const frame2 = __addDisposableResource(env_3, await page.frames()[2]?.frameElement(), false);
                (0, assert_js_1.assert)(frame2);
                const name1 = await frame1.evaluate(frame => {
                    return frame.id;
                });
                (0, expect_1.default)(name1).toBe('theFrameId');
                const name2 = await frame2.evaluate(frame => {
                    return frame.name;
                });
                (0, expect_1.default)(name2).toBe('theFrameName');
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
});
//# sourceMappingURL=frame.spec.js.map