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
const fs_1 = require("fs");
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("../mocha-utils.js");
const utils_js_1 = require("../utils.js");
describe('Screencasts', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.screencast', function () {
        it('should work', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const file = __addDisposableResource(env_1, (0, utils_js_1.getUniqueVideoFilePlaceholder)(), false);
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const recorder = await page.screencast({
                    path: file.filename,
                    scale: 0.5,
                    crop: { width: 100, height: 100, x: 0, y: 0 },
                    speed: 0.5,
                });
                await page.goto('data:text/html,<input>');
                const input = __addDisposableResource(env_1, await page.locator('input').waitHandle(), false);
                await input.type('ab', { delay: 100 });
                await recorder.stop();
                (0, expect_1.default)((0, fs_1.statSync)(file.filename).size).toBeGreaterThan(0);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should work concurrently', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const file1 = __addDisposableResource(env_2, (0, utils_js_1.getUniqueVideoFilePlaceholder)(), false);
                const file2 = __addDisposableResource(env_2, (0, utils_js_1.getUniqueVideoFilePlaceholder)(), false);
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const recorder = await page.screencast({ path: file1.filename });
                const recorder2 = await page.screencast({ path: file2.filename });
                await page.goto('data:text/html,<input>');
                const input = __addDisposableResource(env_2, await page.locator('input').waitHandle(), false);
                await input.type('ab', { delay: 100 });
                await recorder.stop();
                await input.type('ab', { delay: 100 });
                await recorder2.stop();
                // Since file2 spent about double the time of file1 recording, so file2
                // should be around double the size of file1.
                const ratio = (0, fs_1.statSync)(file2.filename).size / (0, fs_1.statSync)(file1.filename).size;
                // We use a range because we cannot be precise.
                const DELTA = 1.3;
                (0, expect_1.default)(ratio).toBeGreaterThan(2 - DELTA);
                (0, expect_1.default)(ratio).toBeLessThan(2 + DELTA);
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should validate options', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await (0, expect_1.default)(page.screencast({ scale: 0 })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ scale: -1 })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ speed: 0 })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ speed: -1 })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ crop: { x: 0, y: 0, height: 1, width: 0 } })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ crop: { x: 0, y: 0, height: 0, width: 1 } })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ crop: { x: -1, y: 0, height: 1, width: 1 } })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ crop: { x: 0, y: -1, height: 1, width: 1 } })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ crop: { x: 0, y: 0, height: 10000, width: 1 } })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ crop: { x: 0, y: 0, height: 1, width: 10000 } })).rejects.toBeDefined();
            await (0, expect_1.default)(page.screencast({ ffmpegPath: 'non-existent-path' })).rejects.toBeDefined();
        });
    });
});
//# sourceMappingURL=screencast.spec.js.map