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
const utils_js_1 = require("./utils.js");
describe('Evaluation specs', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.evaluate', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return 7 * 3;
            });
            (0, expect_1.default)(result).toBe(21);
        });
        it('should transfer BigInt', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate((a) => {
                return a;
            }, BigInt(42));
            (0, expect_1.default)(result).toBe(BigInt(42));
        });
        it('should transfer NaN', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(a => {
                return a;
            }, NaN);
            (0, expect_1.default)(Object.is(result, NaN)).toBe(true);
        });
        it('should transfer -0', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(a => {
                return a;
            }, -0);
            (0, expect_1.default)(Object.is(result, -0)).toBe(true);
        });
        it('should transfer Infinity', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(a => {
                return a;
            }, Infinity);
            (0, expect_1.default)(Object.is(result, Infinity)).toBe(true);
        });
        it('should transfer -Infinity', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(a => {
                return a;
            }, -Infinity);
            (0, expect_1.default)(Object.is(result, -Infinity)).toBe(true);
        });
        it('should transfer arrays', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(a => {
                return a;
            }, [1, 2, 3]);
            (0, expect_1.default)(result).toEqual([1, 2, 3]);
        });
        it('should transfer arrays as arrays, not objects', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(a => {
                return Array.isArray(a);
            }, [1, 2, 3]);
            (0, expect_1.default)(result).toBe(true);
        });
        it('should modify global environment', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluate(() => {
                return (globalThis.globalVar = 123);
            });
            (0, expect_1.default)(await page.evaluate('globalVar')).toBe(123);
        });
        it('should evaluate in the page context', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/global-var.html');
            (0, expect_1.default)(await page.evaluate('globalVar')).toBe(123);
        });
        it('should replace symbols with undefined', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.evaluate(() => {
                return [Symbol('foo4'), 'foo'];
            })).toEqual([undefined, 'foo']);
        });
        it('should work with function shorthands', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const a = {
                sum(a, b) {
                    return a + b;
                },
                async mult(a, b) {
                    return a * b;
                },
            };
            (0, expect_1.default)(await page.evaluate(a.sum, 1, 2)).toBe(3);
            (0, expect_1.default)(await page.evaluate(a.mult, 2, 4)).toBe(8);
        });
        it('should work with unicode chars', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(a => {
                return a['中文字符'];
            }, {
                中文字符: 42,
            });
            (0, expect_1.default)(result).toBe(42);
        });
        it('should throw when evaluation triggers reload', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .evaluate(() => {
                location.reload();
                return new Promise(() => { });
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toContain('Protocol error');
        });
        it('should await promise', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return Promise.resolve(8 * 7);
            });
            (0, expect_1.default)(result).toBe(56);
        });
        it('should work right after framenavigated', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let frameEvaluation = null;
            page.on('framenavigated', async (frame) => {
                frameEvaluation = frame.evaluate(() => {
                    return 6 * 7;
                });
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(await frameEvaluation).toBe(42);
        });
        it('should work from-inside an exposed function', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            // Setup inpage callback, which calls Page.evaluate
            await page.exposeFunction('callController', async function (a, b) {
                return await page.evaluate((a, b) => {
                    return a * b;
                }, a, b);
            });
            const result = await page.evaluate(async function () {
                return globalThis.callController(9, 3);
            });
            (0, expect_1.default)(result).toBe(27);
        });
        it('should reject promise with exception', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .evaluate(() => {
                // @ts-expect-error we know the object doesn't exist
                return notExistingObject.property;
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
            (0, expect_1.default)(error.message).toContain('notExistingObject');
        });
        it('should support thrown strings as error messages', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .evaluate(() => {
                throw 'qwerty';
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toEqual('qwerty');
        });
        it('should support thrown numbers as error messages', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .evaluate(() => {
                throw 100500;
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toEqual(100500);
        });
        it('should return complex objects', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const object = { foo: 'bar!' };
            const result = await page.evaluate(a => {
                return a;
            }, object);
            (0, expect_1.default)(result).not.toBe(object);
            (0, expect_1.default)(result).toEqual(object);
        });
        it('should return BigInt', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return BigInt(42);
            });
            (0, expect_1.default)(result).toBe(BigInt(42));
        });
        it('should return NaN', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return NaN;
            });
            (0, expect_1.default)(Object.is(result, NaN)).toBe(true);
        });
        it('should return -0', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return -0;
            });
            (0, expect_1.default)(Object.is(result, -0)).toBe(true);
        });
        it('should return Infinity', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return Infinity;
            });
            (0, expect_1.default)(Object.is(result, Infinity)).toBe(true);
        });
        it('should return -Infinity', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return -Infinity;
            });
            (0, expect_1.default)(Object.is(result, -Infinity)).toBe(true);
        });
        it('should accept "null" as one of multiple parameters', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate((a, b) => {
                return Object.is(a, null) && Object.is(b, 'foo');
            }, null, 'foo');
            (0, expect_1.default)(result).toBe(true);
        });
        it('should properly serialize null fields', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.evaluate(() => {
                return { a: undefined };
            })).toEqual({});
        });
        it('should return undefined for non-serializable objects', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.evaluate(() => {
                return window;
            })).toBe(undefined);
        });
        it('should return promise as empty object', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                return {
                    promise: new Promise(resolve => {
                        setTimeout(resolve, 1000);
                    }),
                };
            });
            (0, expect_1.default)(result).toEqual({
                promise: {},
            });
        });
        it('should work for circular object', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                const a = {
                    c: 5,
                    d: {
                        foo: 'bar',
                    },
                };
                const b = { a };
                a['b'] = b;
                return a;
            });
            (0, expect_1.default)(result).toMatchObject({
                c: 5,
                d: {
                    foo: 'bar',
                },
                b: {
                    a: undefined,
                },
            });
        });
        it('should accept a string', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate('1 + 2');
            (0, expect_1.default)(result).toBe(3);
        });
        it('should accept a string with semi colons', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate('1 + 5;');
            (0, expect_1.default)(result).toBe(6);
        });
        it('should accept a string with comments', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate('2 + 5;\n// do some math!');
            (0, expect_1.default)(result).toBe(7);
        });
        it('should accept element handle as an argument', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>42</section>');
                const element = __addDisposableResource(env_1, (await page.$('section')), false);
                const text = await page.evaluate(e => {
                    return e.textContent;
                }, element);
                (0, expect_1.default)(text).toBe('42');
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should throw if underlying element was disposed', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>39</section>');
                const element = __addDisposableResource(env_2, (await page.$('section')), false);
                (0, expect_1.default)(element).toBeTruthy();
                // We want to dispose early.
                await element.dispose();
                let error;
                await page
                    .evaluate(e => {
                    return e.textContent;
                }, element)
                    .catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error.message).toContain('JSHandle is disposed');
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should throw if elementHandles are from other frames', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                const bodyHandle = __addDisposableResource(env_3, await page.frames()[1].$('body'), false);
                let error;
                await page
                    .evaluate(body => {
                    return body?.innerHTML;
                }, bodyHandle)
                    .catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error).toBeTruthy();
                (0, expect_1.default)(error.message).atLeastOneToContain([
                    'JSHandles can be evaluated only in the context they were created',
                    "Trying to evaluate JSHandle from different frames. Usually this means you're using a handle from a page on a different page.",
                ]);
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should simulate a user gesture', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const result = await page.evaluate(() => {
                document.body.appendChild(document.createTextNode('test'));
                document.execCommand('selectAll');
                return document.execCommand('copy');
            });
            (0, expect_1.default)(result).toBe(true);
        });
        it('should not throw an error when evaluation does a navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/one-style.html');
            const onRequest = server.waitForRequest('/empty.html');
            const result = await page.evaluate(() => {
                window.location = '/empty.html';
                return [42];
            });
            (0, expect_1.default)(result).toEqual([42]);
            await onRequest;
        });
        it('should transfer 100Mb of data from page to node.js', async function () {
            this.timeout(25000);
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const a = await page.evaluate(() => {
                return Array(100 * 1024 * 1024 + 1).join('a');
            });
            (0, expect_1.default)(a.length).toBe(100 * 1024 * 1024);
        });
        it('should throw error with detailed information on exception inside promise', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .evaluate(() => {
                return new Promise(() => {
                    throw new Error('Error in promise');
                });
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toContain('Error in promise');
        });
        it('should return properly serialize objects with unknown type fields', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent("<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='>");
            const result = await page.evaluate(async () => {
                const image = document.querySelector('img');
                const imageBitmap = await createImageBitmap(image);
                return {
                    a: 'foo',
                    b: imageBitmap,
                };
            });
            (0, expect_1.default)(result).toEqual({
                a: 'foo',
                b: undefined,
            });
        });
    });
    describe('Page.evaluateOnNewDocument', function () {
        it('should evaluate before anything else on the page', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluateOnNewDocument(function () {
                globalThis.injected = 123;
            });
            await page.goto(server.PREFIX + '/tamperable.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result;
            })).toBe(123);
        });
        it('should work with CSP', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setCSP('/empty.html', 'script-src ' + server.PREFIX);
            await page.evaluateOnNewDocument(function () {
                globalThis.injected = 123;
            });
            await page.goto(server.PREFIX + '/empty.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.injected;
            })).toBe(123);
            // Make sure CSP works.
            await page.addScriptTag({ content: 'window.e = 10;' }).catch(error => {
                return void error;
            });
            (0, expect_1.default)(await page.evaluate(() => {
                return window.e;
            })).toBe(undefined);
        });
    });
    describe('Page.removeScriptToEvaluateOnNewDocument', function () {
        it('should remove new document script', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const { identifier } = await page.evaluateOnNewDocument(function () {
                globalThis.injected = 123;
            });
            await page.goto(server.PREFIX + '/tamperable.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result;
            })).toBe(123);
            await page.removeScriptToEvaluateOnNewDocument(identifier);
            await page.reload();
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result || null;
            })).toBe(null);
        });
    });
    describe('Frame.evaluate', function () {
        it('should have different execution contexts', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            (0, expect_1.default)(page.frames()).toHaveLength(2);
            await page.frames()[0].evaluate(() => {
                return (globalThis.FOO = 'foo');
            });
            await page.frames()[1].evaluate(() => {
                return (globalThis.FOO = 'bar');
            });
            (0, expect_1.default)(await page.frames()[0].evaluate(() => {
                return globalThis.FOO;
            })).toBe('foo');
            (0, expect_1.default)(await page.frames()[1].evaluate(() => {
                return globalThis.FOO;
            })).toBe('bar');
        });
        it('should have correct execution contexts', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/frames/one-frame.html');
            (0, expect_1.default)(page.frames()).toHaveLength(2);
            (0, expect_1.default)(await page.frames()[0].evaluate(() => {
                return document.body.textContent.trim();
            })).toBe('');
            (0, expect_1.default)(await page.frames()[1].evaluate(() => {
                return document.body.textContent.trim();
            })).toBe(`Hi, I'm frame`);
        });
        it('should execute after cross-site navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const mainFrame = page.mainFrame();
            (0, expect_1.default)(await mainFrame.evaluate(() => {
                return window.location.href;
            })).toContain('localhost');
            await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
            (0, expect_1.default)(await mainFrame.evaluate(() => {
                return window.location.href;
            })).toContain('127');
        });
    });
});
//# sourceMappingURL=evaluation.spec.js.map