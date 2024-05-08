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
const ErrorLike_js_1 = require("puppeteer-core/internal/util/ErrorLike.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('waittask specs', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Frame.waitForFunction', function () {
        it('should accept a string', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const watchdog = page.waitForFunction('self.__FOO === 1');
            await page.evaluate(() => {
                return (self.__FOO = 1);
            });
            await watchdog;
        });
        it('should work when resolved right before execution context disposal', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluateOnNewDocument(() => {
                return (globalThis.__RELOADED = true);
            });
            await page.waitForFunction(() => {
                if (!globalThis.__RELOADED) {
                    window.location.reload();
                    return false;
                }
                return true;
            });
        });
        it('should poll on interval', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const startTime = Date.now();
            const polling = 100;
            const watchdog = page.waitForFunction(() => {
                return globalThis.__FOO === 'hit';
            }, { polling });
            await page.evaluate(() => {
                setTimeout(() => {
                    globalThis.__FOO = 'hit';
                }, 50);
            });
            await watchdog;
            (0, expect_1.default)(Date.now() - startTime).not.toBeLessThan(polling / 2);
        });
        it('should poll on mutation', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let success = false;
            const watchdog = page
                .waitForFunction(() => {
                return globalThis.__FOO === 'hit';
            }, {
                polling: 'mutation',
            })
                .then(() => {
                return (success = true);
            });
            await page.evaluate(() => {
                return (globalThis.__FOO = 'hit');
            });
            (0, expect_1.default)(success).toBe(false);
            await page.evaluate(() => {
                return document.body.appendChild(document.createElement('div'));
            });
            await watchdog;
        });
        it('should poll on mutation async', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let success = false;
            const watchdog = page
                .waitForFunction(async () => {
                return globalThis.__FOO === 'hit';
            }, {
                polling: 'mutation',
            })
                .then(() => {
                return (success = true);
            });
            await page.evaluate(async () => {
                return (globalThis.__FOO = 'hit');
            });
            (0, expect_1.default)(success).toBe(false);
            await page.evaluate(async () => {
                return document.body.appendChild(document.createElement('div'));
            });
            await watchdog;
        });
        it('should poll on raf', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const watchdog = page.waitForFunction(() => {
                return globalThis.__FOO === 'hit';
            }, {
                polling: 'raf',
            });
            await page.evaluate(() => {
                return (globalThis.__FOO = 'hit');
            });
            await watchdog;
        });
        it('should poll on raf async', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const watchdog = page.waitForFunction(async () => {
                return globalThis.__FOO === 'hit';
            }, {
                polling: 'raf',
            });
            await page.evaluate(async () => {
                return (globalThis.__FOO = 'hit');
            });
            await watchdog;
        });
        it('should work with strict CSP policy', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setCSP('/empty.html', 'script-src ' + server.PREFIX);
            await page.goto(server.EMPTY_PAGE);
            let error;
            await Promise.all([
                page
                    .waitForFunction(() => {
                    return globalThis.__FOO === 'hit';
                }, {
                    polling: 'raf',
                })
                    .catch(error_ => {
                    return (error = error_);
                }),
                page.evaluate(() => {
                    return (globalThis.__FOO = 'hit');
                }),
            ]);
            (0, expect_1.default)(error).toBeUndefined();
        });
        it('should throw negative polling interval', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            try {
                await page.waitForFunction(() => {
                    return !!document.body;
                }, { polling: -10 });
            }
            catch (error_) {
                if ((0, ErrorLike_js_1.isErrorLike)(error_)) {
                    error = error_;
                }
            }
            (0, expect_1.default)(error?.message).toContain('Cannot poll with non-positive interval');
        });
        it('should return the success value as a JSHandle', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await (await page.waitForFunction(() => {
                return 5;
            })).jsonValue()).toBe(5);
        });
        it('should return the window as a success value', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.waitForFunction(() => {
                return window;
            })).toBeTruthy();
        });
        it('should accept ElementHandle arguments', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div></div>');
                const div = __addDisposableResource(env_1, (await page.$('div')), false);
                let resolved = false;
                const waitForFunction = page
                    .waitForFunction(element => {
                    return element.localName === 'div' && !element.parentElement;
                }, {}, div)
                    .then(() => {
                    return (resolved = true);
                });
                (0, expect_1.default)(resolved).toBe(false);
                await page.evaluate(element => {
                    return element.remove();
                }, div);
                await waitForFunction;
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should respect timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .waitForFunction(() => {
                return false;
            }, { timeout: 10 })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
            (0, expect_1.default)(error?.message).toContain('Waiting failed: 10ms exceeded');
        });
        it('should respect default timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            page.setDefaultTimeout(1);
            let error;
            await page
                .waitForFunction(() => {
                return false;
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
            (0, expect_1.default)(error?.message).toContain('Waiting failed: 1ms exceeded');
        });
        it('should disable timeout when its set to 0', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const watchdog = page.waitForFunction(() => {
                globalThis.__counter =
                    (globalThis.__counter || 0) + 1;
                return globalThis.__injected;
            }, { timeout: 0, polling: 10 });
            await page.waitForFunction(() => {
                return globalThis.__counter > 10;
            });
            await page.evaluate(() => {
                return (globalThis.__injected = true);
            });
            await watchdog;
        });
        it('should survive cross-process navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let fooFound = false;
            const waitForFunction = page
                .waitForFunction(() => {
                return globalThis.__FOO === 1;
            })
                .then(() => {
                return (fooFound = true);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(fooFound).toBe(false);
            await page.reload();
            (0, expect_1.default)(fooFound).toBe(false);
            await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
            (0, expect_1.default)(fooFound).toBe(false);
            await page.evaluate(() => {
                return (globalThis.__FOO = 1);
            });
            await waitForFunction;
            (0, expect_1.default)(fooFound).toBe(true);
        });
        it('should survive navigations', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const watchdog = page.waitForFunction(() => {
                return globalThis.__done;
            });
            await page.goto(server.EMPTY_PAGE);
            await page.goto(server.PREFIX + '/consolelog.html');
            await page.evaluate(() => {
                return (globalThis.__done = true);
            });
            await watchdog;
        });
        it('should be cancellable', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const abortController = new AbortController();
            const task = page.waitForFunction(() => {
                return globalThis.__done;
            }, {
                signal: abortController.signal,
            });
            abortController.abort();
            await (0, expect_1.default)(task).rejects.toThrow(/aborted/);
        });
    });
    describe('Frame.waitForSelector', function () {
        const addElement = (tag) => {
            return document.body.appendChild(document.createElement(tag));
        };
        it('should immediately resolve promise if node exists', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const frame = page.mainFrame();
            await frame.waitForSelector('*');
            await frame.evaluate(addElement, 'div');
            await frame.waitForSelector('div');
        });
        it('should be cancellable', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const abortController = new AbortController();
            const task = page.waitForSelector('wrong', {
                signal: abortController.signal,
            });
            abortController.abort();
            await (0, expect_1.default)(task).rejects.toThrow(/aborted/);
        });
        it('should work with removed MutationObserver', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluate(() => {
                // @ts-expect-error We want to remove it for the test.
                return delete window.MutationObserver;
            });
            const [handle] = await Promise.all([
                page.waitForSelector('.zombo'),
                page.setContent(`<div class='zombo'>anything</div>`),
            ]);
            (0, expect_1.default)(await page.evaluate(x => {
                return x?.textContent;
            }, handle)).toBe('anything');
        });
        it('should resolve promise when node is added', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const frame = page.mainFrame();
                const watchdog = frame.waitForSelector('div');
                await frame.evaluate(addElement, 'br');
                await frame.evaluate(addElement, 'div');
                const eHandle = __addDisposableResource(env_2, (await watchdog), false);
                const tagName = await (await eHandle.getProperty('tagName')).jsonValue();
                (0, expect_1.default)(tagName).toBe('DIV');
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should work when node is added through innerHTML', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const watchdog = page.waitForSelector('h3 div');
            await page.evaluate(addElement, 'span');
            await page.evaluate(() => {
                return (document.querySelector('span').innerHTML =
                    '<h3><div></div></h3>');
            });
            await watchdog;
        });
        it('Page.waitForSelector is shortcut for main frame', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                const otherFrame = page.frames()[1];
                const watchdog = page.waitForSelector('div');
                await otherFrame.evaluate(addElement, 'div');
                await page.evaluate(addElement, 'div');
                const eHandle = __addDisposableResource(env_3, await watchdog, false);
                (0, expect_1.default)(eHandle?.frame).toBe(page.mainFrame());
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should run in specified frame', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                await (0, utils_js_1.attachFrame)(page, 'frame2', server.EMPTY_PAGE);
                const frame1 = page.frames()[1];
                const frame2 = page.frames()[2];
                const waitForSelectorPromise = frame2.waitForSelector('div');
                await frame1.evaluate(addElement, 'div');
                await frame2.evaluate(addElement, 'div');
                const eHandle = __addDisposableResource(env_4, await waitForSelectorPromise, false);
                (0, expect_1.default)(eHandle?.frame).toBe(frame2);
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
        it('should throw when frame is detached', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            const frame = page.frames()[1];
            let waitError;
            const waitPromise = frame.waitForSelector('.box').catch(error => {
                return (waitError = error);
            });
            await (0, utils_js_1.detachFrame)(page, 'frame1');
            await waitPromise;
            (0, expect_1.default)(waitError).toBeTruthy();
            (0, expect_1.default)(waitError?.message).atLeastOneToContain([
                'waitForFunction failed: frame got detached.',
                'Browsing context already closed.',
            ]);
        });
        it('should survive cross-process navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let boxFound = false;
            const waitForSelector = page.waitForSelector('.box').then(() => {
                return (boxFound = true);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(boxFound).toBe(false);
            await page.reload();
            (0, expect_1.default)(boxFound).toBe(false);
            await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
            await waitForSelector;
            (0, expect_1.default)(boxFound).toBe(true);
        });
        it('should wait for element to be visible (display)', async () => {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div', { visible: true });
                await page.setContent('<div style="display: none">text</div>');
                const element = __addDisposableResource(env_5, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    e.style.removeProperty('display');
                });
                await (0, expect_1.default)(promise).resolves.toBeTruthy();
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        });
        it('should wait for element to be visible (visibility)', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div', { visible: true });
                await page.setContent('<div style="visibility: hidden">text</div>');
                const element = __addDisposableResource(env_6, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    e.style.setProperty('visibility', 'collapse');
                });
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    e.style.removeProperty('visibility');
                });
                await (0, expect_1.default)(promise).resolves.toBeTruthy();
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        });
        it('should wait for element to be visible (bounding box)', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div', { visible: true });
                await page.setContent('<div style="width: 0">text</div>');
                const element = __addDisposableResource(env_7, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    e.style.setProperty('height', '0');
                    e.style.removeProperty('width');
                });
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    e.style.removeProperty('height');
                });
                await (0, expect_1.default)(promise).resolves.toBeTruthy();
            }
            catch (e_7) {
                env_7.error = e_7;
                env_7.hasError = true;
            }
            finally {
                __disposeResources(env_7);
            }
        });
        it('should wait for element to be visible recursively', async () => {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div#inner', {
                    visible: true,
                });
                await page.setContent(`<div style='display: none; visibility: hidden;'><div id="inner">hi</div></div>`);
                const element = __addDisposableResource(env_8, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    return e.style.removeProperty('display');
                });
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    return e.style.removeProperty('visibility');
                });
                await (0, expect_1.default)(promise).resolves.toBeTruthy();
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        });
        it('should wait for element to be hidden (visibility)', async () => {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div', { hidden: true });
                await page.setContent(`<div style='display: block;'>text</div>`);
                const element = __addDisposableResource(env_9, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    return e.style.setProperty('visibility', 'hidden');
                });
                await (0, expect_1.default)(promise).resolves.toBeTruthy();
            }
            catch (e_9) {
                env_9.error = e_9;
                env_9.hasError = true;
            }
            finally {
                __disposeResources(env_9);
            }
        });
        it('should wait for element to be hidden (display)', async () => {
            const env_10 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div', { hidden: true });
                await page.setContent(`<div style='display: block;'>text</div>`);
                const element = __addDisposableResource(env_10, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    return e.style.setProperty('display', 'none');
                });
                await (0, expect_1.default)(promise).resolves.toBeTruthy();
            }
            catch (e_10) {
                env_10.error = e_10;
                env_10.hasError = true;
            }
            finally {
                __disposeResources(env_10);
            }
        });
        it('should wait for element to be hidden (bounding box)', async () => {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div', { hidden: true });
                await page.setContent('<div>text</div>');
                const element = __addDisposableResource(env_11, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40)])).resolves.toBeFalsy();
                await element.evaluate(e => {
                    e.style.setProperty('height', '0');
                });
                await (0, expect_1.default)(promise).resolves.toBeTruthy();
            }
            catch (e_11) {
                env_11.error = e_11;
                env_11.hasError = true;
            }
            finally {
                __disposeResources(env_11);
            }
        });
        it('should wait for element to be hidden (removal)', async () => {
            const env_12 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const promise = page.waitForSelector('div', { hidden: true });
                await page.setContent(`<div>text</div>`);
                const element = __addDisposableResource(env_12, await page.evaluateHandle(() => {
                    return document.getElementsByTagName('div')[0];
                }), false);
                await (0, expect_1.default)(Promise.race([promise, (0, mocha_utils_js_1.createTimeout)(40, true)])).resolves.toBeTruthy();
                await element.evaluate(e => {
                    e.remove();
                });
                await (0, expect_1.default)(promise).resolves.toBeFalsy();
            }
            catch (e_12) {
                env_12.error = e_12;
                env_12.hasError = true;
            }
            finally {
                __disposeResources(env_12);
            }
        });
        it('should return null if waiting to hide non-existing element', async () => {
            const env_13 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_13, await page.waitForSelector('non-existing', {
                    hidden: true,
                }), false);
                (0, expect_1.default)(handle).toBe(null);
            }
            catch (e_13) {
                env_13.error = e_13;
                env_13.hasError = true;
            }
            finally {
                __disposeResources(env_13);
            }
        });
        it('should respect timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.waitForSelector('div', { timeout: 10 }).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
            (0, expect_1.default)(error?.message).toContain('Waiting for selector `div` failed: Waiting failed: 10ms exceeded');
        });
        it('should have an error message specifically for awaiting an element to be hidden', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<div>text</div>`);
            let error;
            await page
                .waitForSelector('div', { hidden: true, timeout: 10 })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
            (0, expect_1.default)(error?.message).toContain('Waiting for selector `div` failed: Waiting failed: 10ms exceeded');
        });
        it('should respond to node attribute mutation', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let divFound = false;
            const waitForSelector = page.waitForSelector('.zombo').then(() => {
                return (divFound = true);
            });
            await page.setContent(`<div class='notZombo'></div>`);
            (0, expect_1.default)(divFound).toBe(false);
            await page.evaluate(() => {
                return (document.querySelector('div').className = 'zombo');
            });
            (0, expect_1.default)(await waitForSelector).toBe(true);
        });
        it('should return the element handle', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const waitForSelector = page.waitForSelector('.zombo');
            await page.setContent(`<div class='zombo'>anything</div>`);
            (0, expect_1.default)(await page.evaluate(x => {
                return x?.textContent;
            }, await waitForSelector)).toBe('anything');
        });
        it('should have correct stack trace for timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.waitForSelector('.zombo', { timeout: 10 }).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error?.stack).toContain('Waiting for selector `.zombo` failed: Waiting failed: 10ms exceeded');
            // The extension is ts here as Mocha maps back via sourcemaps.
            (0, expect_1.default)(error?.stack).toContain('WaitTask.ts');
        });
        describe('xpath', function () {
            const addElement = (tag) => {
                return document.body.appendChild(document.createElement(tag));
            };
            it('should support some fancy xpath', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`<p>red herring</p><p>hello  world  </p>`);
                const waitForSelector = page.waitForSelector('xpath/.//p[normalize-space(.)="hello world"]');
                (0, expect_1.default)(await page.evaluate(x => {
                    return x?.textContent;
                }, await waitForSelector)).toBe('hello  world  ');
            });
            it('should respect timeout', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                let error;
                await page
                    .waitForSelector('xpath/.//div', { timeout: 10 })
                    .catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
                (0, expect_1.default)(error?.message).toContain('Waiting failed: 10ms exceeded');
            });
            it('should run in specified frame', async () => {
                const env_14 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                    await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                    await (0, utils_js_1.attachFrame)(page, 'frame2', server.EMPTY_PAGE);
                    const frame1 = page.frames()[1];
                    const frame2 = page.frames()[2];
                    const waitForSelector = frame2.waitForSelector('xpath/.//div');
                    await frame1.evaluate(addElement, 'div');
                    await frame2.evaluate(addElement, 'div');
                    const eHandle = __addDisposableResource(env_14, await waitForSelector, false);
                    (0, expect_1.default)(eHandle?.frame).toBe(frame2);
                }
                catch (e_14) {
                    env_14.error = e_14;
                    env_14.hasError = true;
                }
                finally {
                    __disposeResources(env_14);
                }
            });
            it('should throw when frame is detached', async () => {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                const frame = page.frames()[1];
                let waitError;
                const waitPromise = frame
                    .waitForSelector('xpath/.//*[@class="box"]')
                    .catch(error => {
                    return (waitError = error);
                });
                await (0, utils_js_1.detachFrame)(page, 'frame1');
                await waitPromise;
                (0, expect_1.default)(waitError).toBeTruthy();
                (0, expect_1.default)(waitError?.message).atLeastOneToContain([
                    'waitForFunction failed: frame got detached.',
                    'Browsing context already closed.',
                ]);
            });
            it('hidden should wait for display: none', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                let divHidden = false;
                await page.setContent(`<div style='display: block;'>text</div>`);
                const waitForSelector = page
                    .waitForSelector('xpath/.//div', { hidden: true })
                    .then(() => {
                    return (divHidden = true);
                });
                await page.waitForSelector('xpath/.//div'); // do a round trip
                (0, expect_1.default)(divHidden).toBe(false);
                await page.evaluate(() => {
                    return document
                        .querySelector('div')
                        ?.style.setProperty('display', 'none');
                });
                (0, expect_1.default)(await waitForSelector).toBe(true);
                (0, expect_1.default)(divHidden).toBe(true);
            });
            it('hidden should return null if the element is not found', async () => {
                const env_15 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    const waitForSelector = __addDisposableResource(env_15, await page.waitForSelector('xpath/.//div', {
                        hidden: true,
                    }), false);
                    (0, expect_1.default)(waitForSelector).toBe(null);
                }
                catch (e_15) {
                    env_15.error = e_15;
                    env_15.hasError = true;
                }
                finally {
                    __disposeResources(env_15);
                }
            });
            it('hidden should return an empty element handle if the element is found', async () => {
                const env_16 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent(`<div style='display: none;'>text</div>`);
                    const waitForSelector = __addDisposableResource(env_16, await page.waitForSelector('xpath/.//div', {
                        hidden: true,
                    }), false);
                    (0, expect_1.default)(waitForSelector).toBeInstanceOf(puppeteer_1.ElementHandle);
                }
                catch (e_16) {
                    env_16.error = e_16;
                    env_16.hasError = true;
                }
                finally {
                    __disposeResources(env_16);
                }
            });
            it('should return the element handle', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const waitForSelector = page.waitForSelector('xpath/.//*[@class="zombo"]');
                await page.setContent(`<div class='zombo'>anything</div>`);
                (0, expect_1.default)(await page.evaluate(x => {
                    return x?.textContent;
                }, await waitForSelector)).toBe('anything');
            });
            it('should allow you to select a text node', async () => {
                const env_17 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent(`<div>some text</div>`);
                    const text = __addDisposableResource(env_17, await page.waitForSelector('xpath/.//div/text()'), false);
                    (0, expect_1.default)(await (await text.getProperty('nodeType')).jsonValue()).toBe(3 /* Node.TEXT_NODE */);
                }
                catch (e_17) {
                    env_17.error = e_17;
                    env_17.hasError = true;
                }
                finally {
                    __disposeResources(env_17);
                }
            });
            it('should allow you to select an element with single slash', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`<div>some text</div>`);
                const waitForSelector = page.waitForSelector('xpath/html/body/div');
                (0, expect_1.default)(await page.evaluate(x => {
                    return x?.textContent;
                }, await waitForSelector)).toBe('some text');
            });
        });
    });
});
//# sourceMappingURL=waittask.spec.js.map