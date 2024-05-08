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
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("../mocha-utils.js");
describe('page.queryObjects', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should work', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            // Create a custom class
            const classHandle = __addDisposableResource(env_1, await page.evaluateHandle(() => {
                return class CustomClass {
                };
            }), false);
            // Create an instance.
            await page.evaluate(CustomClass => {
                // @ts-expect-error: Different context.
                self.customClass = new CustomClass();
            }, classHandle);
            // Validate only one has been added.
            const prototypeHandle = __addDisposableResource(env_1, await page.evaluateHandle(CustomClass => {
                return CustomClass.prototype;
            }, classHandle), false);
            const objectsHandle = __addDisposableResource(env_1, await page.queryObjects(prototypeHandle), false);
            await (0, expect_1.default)(page.evaluate(objects => {
                return objects.length;
            }, objectsHandle)).resolves.toBe(1);
            // Check that instances.
            await (0, expect_1.default)(page.evaluate(objects => {
                // @ts-expect-error: Different context.
                return objects[0] === self.customClass;
            }, objectsHandle)).resolves.toBeTruthy();
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should work for non-trivial page', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            // Create a custom class
            const classHandle = __addDisposableResource(env_2, await page.evaluateHandle(() => {
                return class CustomClass {
                };
            }), false);
            // Create an instance.
            await page.evaluate(CustomClass => {
                // @ts-expect-error: Different context.
                self.customClass = new CustomClass();
            }, classHandle);
            // Validate only one has been added.
            const prototypeHandle = __addDisposableResource(env_2, await page.evaluateHandle(CustomClass => {
                return CustomClass.prototype;
            }, classHandle), false);
            const objectsHandle = __addDisposableResource(env_2, await page.queryObjects(prototypeHandle), false);
            await (0, expect_1.default)(page.evaluate(objects => {
                return objects.length;
            }, objectsHandle)).resolves.toBe(1);
            // Check that instances.
            await (0, expect_1.default)(page.evaluate(objects => {
                // @ts-expect-error: Different context.
                return objects[0] === self.customClass;
            }, objectsHandle)).resolves.toBeTruthy();
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    it('should fail for disposed handles', async () => {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const prototypeHandle = __addDisposableResource(env_3, await page.evaluateHandle(() => {
                return HTMLBodyElement.prototype;
            }), false);
            // We want to dispose early.
            await prototypeHandle.dispose();
            let error;
            await page.queryObjects(prototypeHandle).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Prototype JSHandle is disposed!');
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            __disposeResources(env_3);
        }
    });
    it('should fail primitive values as prototypes', async () => {
        const env_4 = { stack: [], error: void 0, hasError: false };
        try {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const prototypeHandle = __addDisposableResource(env_4, await page.evaluateHandle(() => {
                return 42;
            }), false);
            let error;
            await page.queryObjects(prototypeHandle).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Prototype JSHandle must not be referencing primitive value');
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
//# sourceMappingURL=queryObjects.spec.js.map