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
const assert_1 = __importDefault(require("assert"));
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
const FILENAME = __filename.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
const parseStackTrace = (stack) => {
    stack = stack.replace(new RegExp(FILENAME, 'g'), '<filename>');
    stack = stack.replace(/<filename>:(\d+):(\d+)/g, '<filename>:<line>:<col>');
    stack = stack.replace(/<anonymous>:(\d+):(\d+)/g, '<anonymous>:<line>:<col>');
    return stack;
};
describe('Stack trace', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should work', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const error = (await page
            .evaluate(() => {
            throw new Error('Test');
        })
            .catch((error) => {
            return error;
        }));
        (0, expect_1.default)(error.name).toEqual('Error');
        (0, expect_1.default)(error.message).toEqual('Test');
        (0, assert_1.default)(error.stack);
        error.stack = error.stack.replace(new RegExp(FILENAME, 'g'), '<filename>');
        (0, expect_1.default)(parseStackTrace(error.stack).split('\n    at ').slice(0, 2)).toMatchObject({
            ...[
                'Error: Test',
                'evaluate (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
            ],
        });
    });
    it('should work with handles', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const error = (await page
            .evaluateHandle(() => {
            throw new Error('Test');
        })
            .catch((error) => {
            return error;
        }));
        (0, expect_1.default)(error.name).toEqual('Error');
        (0, expect_1.default)(error.message).toEqual('Test');
        (0, assert_1.default)(error.stack);
        (0, expect_1.default)(parseStackTrace(error.stack).split('\n    at ').slice(0, 2)).toMatchObject({
            ...[
                'Error: Test',
                'evaluateHandle (evaluateHandle at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
            ],
        });
    });
    it('should work with contiguous evaluation', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const thrower = __addDisposableResource(env_1, await page.evaluateHandle(() => {
                return () => {
                    throw new Error('Test');
                };
            }), false);
            const error = (await thrower
                .evaluate(thrower => {
                thrower();
            })
                .catch((error) => {
                return error;
            }));
            (0, expect_1.default)(error.name).toEqual('Error');
            (0, expect_1.default)(error.message).toEqual('Test');
            (0, assert_1.default)(error.stack);
            (0, expect_1.default)(parseStackTrace(error.stack).split('\n    at ').slice(0, 3)).toMatchObject({
                ...[
                    'Error: Test',
                    'evaluateHandle (evaluateHandle at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
                    'evaluate (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
                ],
            });
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should work with nested function calls', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const error = (await page
            .evaluate(() => {
            function a() {
                throw new Error('Test');
            }
            function b() {
                a();
            }
            function c() {
                b();
            }
            function d() {
                c();
            }
            d();
        })
            .catch((error) => {
            return error;
        }));
        (0, expect_1.default)(error.name).toEqual('Error');
        (0, expect_1.default)(error.message).toEqual('Test');
        (0, assert_1.default)(error.stack);
        (0, expect_1.default)(parseStackTrace(error.stack).split('\n    at ').slice(0, 6)).toMatchObject({
            ...[
                'Error: Test',
                'a (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
                'b (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
                'c (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
                'd (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
                'evaluate (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
            ],
        });
    });
    it('should work for none error objects', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const [error] = await Promise.all([
            (0, utils_js_1.waitEvent)(page, 'pageerror'),
            page.evaluate(() => {
                // This can happen when a 404 with HTML is returned
                void Promise.reject(new Response());
            }),
        ]);
        (0, expect_1.default)(error).toBeTruthy();
    });
});
//# sourceMappingURL=stacktrace.spec.js.map