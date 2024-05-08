"use strict";
/**
 * @license
 * Copyright 2020 Google Inc.
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
describe('Workers', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('Page.workers', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await Promise.all([
            (0, utils_js_1.waitEvent)(page, 'workercreated'),
            page.goto(server.PREFIX + '/worker/worker.html'),
        ]);
        const worker = page.workers()[0];
        (0, expect_1.default)(worker?.url()).toContain('worker.js');
        (0, expect_1.default)(await worker?.evaluate(() => {
            return globalThis.workerFunction();
        })).toBe('worker function result');
        await page.goto(server.EMPTY_PAGE);
        (0, expect_1.default)(page.workers()).toHaveLength(0);
    });
    it('should emit created and destroyed events', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const workerCreatedPromise = (0, utils_js_1.waitEvent)(page, 'workercreated');
            const workerObj = __addDisposableResource(env_1, await page.evaluateHandle(() => {
                return new Worker('data:text/javascript,1');
            }), false);
            const worker = await workerCreatedPromise;
            const workerThisObj = __addDisposableResource(env_1, await worker.evaluateHandle(() => {
                return this;
            }), false);
            const workerDestroyedPromise = (0, utils_js_1.waitEvent)(page, 'workerdestroyed');
            await page.evaluate((workerObj) => {
                return workerObj.terminate();
            }, workerObj);
            (0, expect_1.default)(await workerDestroyedPromise).toBe(worker);
            const error = await workerThisObj.getProperty('self').catch(error => {
                return error;
            });
            (0, expect_1.default)(error.message).atLeastOneToContain([
                'Realm already destroyed.',
                'Execution context is not available in detached frame',
            ]);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should report console logs', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const [message] = await Promise.all([
            (0, utils_js_1.waitEvent)(page, 'console'),
            page.evaluate(() => {
                return new Worker(`data:text/javascript,console.log(1)`);
            }),
        ]);
        (0, expect_1.default)(message.text()).toBe('1');
        (0, expect_1.default)(message.location()).toEqual({
            url: '',
            lineNumber: 0,
            columnNumber: 8,
        });
    });
    it('should work with console logs', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const logPromise = (0, utils_js_1.waitEvent)(page, 'console');
        await page.evaluate(() => {
            return new Worker(`data:text/javascript,console.log(1,2,3,this)`);
        });
        const log = await logPromise;
        (0, expect_1.default)(log.text()).toBe('1 2 3 JSHandle@object');
        (0, expect_1.default)(log.args()).toHaveLength(4);
    });
    it('should have an execution context', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const workerCreatedPromise = (0, utils_js_1.waitEvent)(page, 'workercreated');
        await page.evaluate(() => {
            return new Worker(`data:text/javascript,console.log(1)`);
        });
        const worker = await workerCreatedPromise;
        (0, expect_1.default)(await worker.evaluate('1+1')).toBe(2);
    });
    it('should report errors', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const errorPromise = (0, utils_js_1.waitEvent)(page, 'pageerror');
        await page.evaluate(() => {
            return new Worker(`data:text/javascript, throw new Error('this is my error');`);
        });
        const errorLog = await errorPromise;
        (0, expect_1.default)(errorLog.message).toContain('this is my error');
    });
    it('can be closed', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await Promise.all([
            (0, utils_js_1.waitEvent)(page, 'workercreated'),
            page.goto(server.PREFIX + '/worker/worker.html'),
        ]);
        const worker = page.workers()[0];
        (0, expect_1.default)(worker?.url()).toContain('worker.js');
        await Promise.all([(0, utils_js_1.waitEvent)(page, 'workerdestroyed'), worker?.close()]);
    });
});
//# sourceMappingURL=worker.spec.js.map