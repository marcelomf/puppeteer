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
const JSHandle_js_1 = require("puppeteer-core/internal/api/JSHandle.js");
const disposable_js_1 = require("puppeteer-core/internal/util/disposable.js");
const sinon_1 = __importDefault(require("sinon"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('JSHandle', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.evaluateHandle', function () {
        it('should work', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const windowHandle = __addDisposableResource(env_1, await page.evaluateHandle(() => {
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
        it('should return the RemoteObject', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const windowHandle = __addDisposableResource(env_2, await page.evaluateHandle(() => {
                    return window;
                }), false);
                (0, expect_1.default)(windowHandle.remoteObject()).toBeTruthy();
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should accept object handle as an argument', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const navigatorHandle = __addDisposableResource(env_3, await page.evaluateHandle(() => {
                    return navigator;
                }), false);
                const text = await page.evaluate(e => {
                    return e.userAgent;
                }, navigatorHandle);
                (0, expect_1.default)(text).toContain('Mozilla');
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should accept object handle to primitive types', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_4, await page.evaluateHandle(() => {
                    return 5;
                }), false);
                const isFive = await page.evaluate(e => {
                    return Object.is(e, 5);
                }, aHandle);
                (0, expect_1.default)(isFive).toBeTruthy();
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
        it('should warn about recursive objects', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const test = {};
            test.obj = test;
            let error;
            await page
                .evaluateHandle(opts => {
                return opts;
            }, test)
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toContain('Recursive objects are not allowed.');
        });
        it('should accept object handle to unserializable value', async () => {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_5, await page.evaluateHandle(() => {
                    return Infinity;
                }), false);
                (0, expect_1.default)(await page.evaluate(e => {
                    return Object.is(e, Infinity);
                }, aHandle)).toBe(true);
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        });
        it('should use the same JS wrappers', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_6, await page.evaluateHandle(() => {
                    globalThis.FOO = 123;
                    return window;
                }), false);
                (0, expect_1.default)(await page.evaluate(e => {
                    return e.FOO;
                }, aHandle)).toBe(123);
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
    describe('JSHandle.getProperty', function () {
        it('should work', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_7, await page.evaluateHandle(() => {
                    return {
                        one: 1,
                        two: 2,
                        three: 3,
                    };
                }), false);
                const twoHandle = __addDisposableResource(env_7, await aHandle.getProperty('two'), false);
                (0, expect_1.default)(await twoHandle.jsonValue()).toEqual(2);
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
    describe('JSHandle.jsonValue', function () {
        it('should work', async () => {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_8, await page.evaluateHandle(() => {
                    return { foo: 'bar' };
                }), false);
                const json = await aHandle.jsonValue();
                (0, expect_1.default)(json).toEqual({ foo: 'bar' });
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        });
        it('works with jsonValues that are not objects', async () => {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_9, await page.evaluateHandle(() => {
                    return ['a', 'b'];
                }), false);
                const json = await aHandle.jsonValue();
                (0, expect_1.default)(json).toEqual(['a', 'b']);
            }
            catch (e_9) {
                env_9.error = e_9;
                env_9.hasError = true;
            }
            finally {
                __disposeResources(env_9);
            }
        });
        it('works with jsonValues that are primitives', async () => {
            const env_10 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_10, await page.evaluateHandle(() => {
                    return 'foo';
                }), false);
                (0, expect_1.default)(await aHandle.jsonValue()).toEqual('foo');
                const bHandle = __addDisposableResource(env_10, await page.evaluateHandle(() => {
                    return undefined;
                }), false);
                (0, expect_1.default)(await bHandle.jsonValue()).toEqual(undefined);
            }
            catch (e_10) {
                env_10.error = e_10;
                env_10.hasError = true;
            }
            finally {
                __disposeResources(env_10);
            }
        });
        it('should work with dates', async () => {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const dateHandle = __addDisposableResource(env_11, await page.evaluateHandle(() => {
                    return new Date('2017-09-26T00:00:00.000Z');
                }), false);
                const date = await dateHandle.jsonValue();
                (0, expect_1.default)(date).toBeInstanceOf(Date);
                (0, expect_1.default)(date.toISOString()).toEqual('2017-09-26T00:00:00.000Z');
            }
            catch (e_11) {
                env_11.error = e_11;
                env_11.hasError = true;
            }
            finally {
                __disposeResources(env_11);
            }
        });
        it('should not throw for circular objects', async () => {
            const env_12 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_12, await page.evaluateHandle(() => {
                    const t = { g: 1 };
                    t.t = t;
                    return t;
                }), false);
                await handle.jsonValue();
            }
            catch (e_12) {
                env_12.error = e_12;
                env_12.hasError = true;
            }
            finally {
                __disposeResources(env_12);
            }
        });
    });
    describe('JSHandle.getProperties', function () {
        it('should work', async () => {
            const env_13 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_13, await page.evaluateHandle(() => {
                    return {
                        foo: 'bar',
                    };
                }), false);
                const properties = await aHandle.getProperties();
                const foo = __addDisposableResource(env_13, properties.get('foo'), false);
                (0, expect_1.default)(foo).toBeTruthy();
                (0, expect_1.default)(await foo.jsonValue()).toBe('bar');
            }
            catch (e_13) {
                env_13.error = e_13;
                env_13.hasError = true;
            }
            finally {
                __disposeResources(env_13);
            }
        });
        it('should return even non-own properties', async () => {
            const env_14 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_14, await page.evaluateHandle(() => {
                    class A {
                        a;
                        constructor() {
                            this.a = '1';
                        }
                    }
                    class B extends A {
                        b;
                        constructor() {
                            super();
                            this.b = '2';
                        }
                    }
                    return new B();
                }), false);
                const properties = await aHandle.getProperties();
                (0, expect_1.default)(await properties.get('a').jsonValue()).toBe('1');
                (0, expect_1.default)(await properties.get('b').jsonValue()).toBe('2');
            }
            catch (e_14) {
                env_14.error = e_14;
                env_14.hasError = true;
            }
            finally {
                __disposeResources(env_14);
            }
        });
    });
    describe('JSHandle.asElement', function () {
        it('should work', async () => {
            const env_15 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_15, await page.evaluateHandle(() => {
                    return document.body;
                }), false);
                const element = __addDisposableResource(env_15, aHandle.asElement(), false);
                (0, expect_1.default)(element).toBeTruthy();
            }
            catch (e_15) {
                env_15.error = e_15;
                env_15.hasError = true;
            }
            finally {
                __disposeResources(env_15);
            }
        });
        it('should return null for non-elements', async () => {
            const env_16 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_16, await page.evaluateHandle(() => {
                    return 2;
                }), false);
                const element = __addDisposableResource(env_16, aHandle.asElement(), false);
                (0, expect_1.default)(element).toBeFalsy();
            }
            catch (e_16) {
                env_16.error = e_16;
                env_16.hasError = true;
            }
            finally {
                __disposeResources(env_16);
            }
        });
        it('should return ElementHandle for TextNodes', async () => {
            const env_17 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div>ee!</div>');
                const aHandle = __addDisposableResource(env_17, await page.evaluateHandle(() => {
                    return document.querySelector('div').firstChild;
                }), false);
                const element = __addDisposableResource(env_17, aHandle.asElement(), false);
                (0, expect_1.default)(element).toBeTruthy();
                (0, expect_1.default)(await page.evaluate(e => {
                    return e?.nodeType === Node.TEXT_NODE;
                }, element));
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
    describe('JSHandle.toString', function () {
        it('should work for primitives', async () => {
            const env_18 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const numberHandle = __addDisposableResource(env_18, await page.evaluateHandle(() => {
                    return 2;
                }), false);
                (0, expect_1.default)(numberHandle.toString()).toBe('JSHandle:2');
                const stringHandle = __addDisposableResource(env_18, await page.evaluateHandle(() => {
                    return 'a';
                }), false);
                (0, expect_1.default)(stringHandle.toString()).toBe('JSHandle:a');
            }
            catch (e_18) {
                env_18.error = e_18;
                env_18.hasError = true;
            }
            finally {
                __disposeResources(env_18);
            }
        });
        it('should work for complicated objects', async () => {
            const env_19 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const aHandle = __addDisposableResource(env_19, await page.evaluateHandle(() => {
                    return window;
                }), false);
                (0, expect_1.default)(aHandle.toString()).atLeastOneToContain([
                    'JSHandle@object',
                    'JSHandle@window',
                ]);
            }
            catch (e_19) {
                env_19.error = e_19;
                env_19.hasError = true;
            }
            finally {
                __disposeResources(env_19);
            }
        });
        it('should work with different subtypes', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)((await page.evaluateHandle('(function(){})')).toString()).toBe('JSHandle@function');
            (0, expect_1.default)((await page.evaluateHandle('12')).toString()).toBe('JSHandle:12');
            (0, expect_1.default)((await page.evaluateHandle('true')).toString()).toBe('JSHandle:true');
            (0, expect_1.default)((await page.evaluateHandle('undefined')).toString()).toBe('JSHandle:undefined');
            (0, expect_1.default)((await page.evaluateHandle('"foo"')).toString()).toBe('JSHandle:foo');
            (0, expect_1.default)((await page.evaluateHandle('Symbol()')).toString()).toBe('JSHandle@symbol');
            (0, expect_1.default)((await page.evaluateHandle('new Map()')).toString()).toBe('JSHandle@map');
            (0, expect_1.default)((await page.evaluateHandle('new Set()')).toString()).toBe('JSHandle@set');
            (0, expect_1.default)((await page.evaluateHandle('[]')).toString()).toBe('JSHandle@array');
            (0, expect_1.default)((await page.evaluateHandle('null')).toString()).toBe('JSHandle:null');
            (0, expect_1.default)((await page.evaluateHandle('/foo/')).toString()).toBe('JSHandle@regexp');
            (0, expect_1.default)((await page.evaluateHandle('document.body')).toString()).toBe('JSHandle@node');
            (0, expect_1.default)((await page.evaluateHandle('new Date()')).toString()).toBe('JSHandle@date');
            (0, expect_1.default)((await page.evaluateHandle('new WeakMap()')).toString()).toBe('JSHandle@weakmap');
            (0, expect_1.default)((await page.evaluateHandle('new WeakSet()')).toString()).toBe('JSHandle@weakset');
            (0, expect_1.default)((await page.evaluateHandle('new Error()')).toString()).toBe('JSHandle@error');
            (0, expect_1.default)((await page.evaluateHandle('new Int32Array()')).toString()).toBe('JSHandle@typedarray');
            (0, expect_1.default)((await page.evaluateHandle('new Proxy({}, {})')).toString()).toBe('JSHandle@proxy');
        });
        it('should work with window subtypes', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)((await page.evaluateHandle('window')).toString()).toBe('JSHandle@window');
            (0, expect_1.default)((await page.evaluateHandle('globalThis')).toString()).toBe('JSHandle@window');
        });
    });
    describe('JSHandle[Symbol.dispose]', () => {
        it('should work', async () => {
            const env_20 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_20, await page.evaluateHandle('new Set()'), false);
                const spy = sinon_1.default.spy(handle, disposable_js_1.disposeSymbol);
                {
                    const env_21 = { stack: [], error: void 0, hasError: false };
                    try {
                        const _ = __addDisposableResource(env_21, handle, false);
                    }
                    catch (e_20) {
                        env_21.error = e_20;
                        env_21.hasError = true;
                    }
                    finally {
                        __disposeResources(env_21);
                    }
                }
                (0, expect_1.default)(handle).toBeInstanceOf(JSHandle_js_1.JSHandle);
                (0, expect_1.default)(spy.calledOnce).toBeTruthy();
                (0, expect_1.default)(handle.disposed).toBeTruthy();
            }
            catch (e_21) {
                env_20.error = e_21;
                env_20.hasError = true;
            }
            finally {
                __disposeResources(env_20);
            }
        });
    });
    describe('JSHandle[Symbol.asyncDispose]', () => {
        it('should work', async () => {
            const env_22 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_22, await page.evaluateHandle('new Set()'), false);
                const spy = sinon_1.default.spy(handle, disposable_js_1.asyncDisposeSymbol);
                {
                    const env_23 = { stack: [], error: void 0, hasError: false };
                    try {
                        const _ = __addDisposableResource(env_23, handle, true);
                    }
                    catch (e_22) {
                        env_23.error = e_22;
                        env_23.hasError = true;
                    }
                    finally {
                        const result_1 = __disposeResources(env_23);
                        if (result_1)
                            await result_1;
                    }
                }
                (0, expect_1.default)(handle).toBeInstanceOf(JSHandle_js_1.JSHandle);
                (0, expect_1.default)(spy.calledOnce).toBeTruthy();
                (0, expect_1.default)(handle.disposed).toBeTruthy();
            }
            catch (e_23) {
                env_22.error = e_23;
                env_22.hasError = true;
            }
            finally {
                __disposeResources(env_22);
            }
        });
    });
    describe('JSHandle.move', () => {
        it('should work', async () => {
            const env_24 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_24, await page.evaluateHandle('new Set()'), false);
                const spy = sinon_1.default.spy(handle, disposable_js_1.disposeSymbol);
                {
                    const env_25 = { stack: [], error: void 0, hasError: false };
                    try {
                        const _ = __addDisposableResource(env_25, handle, false);
                        handle.move();
                    }
                    catch (e_24) {
                        env_25.error = e_24;
                        env_25.hasError = true;
                    }
                    finally {
                        __disposeResources(env_25);
                    }
                }
                (0, expect_1.default)(handle).toBeInstanceOf(JSHandle_js_1.JSHandle);
                (0, expect_1.default)(spy.calledOnce).toBeTruthy();
                (0, expect_1.default)(handle.disposed).toBeFalsy();
            }
            catch (e_25) {
                env_24.error = e_25;
                env_24.hasError = true;
            }
            finally {
                __disposeResources(env_24);
            }
        });
    });
});
//# sourceMappingURL=jshandle.spec.js.map