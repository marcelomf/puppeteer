"use strict";
/**
 * @license
 * Copyright 2021 Google Inc.
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
async function getDragState() {
    const { page } = await (0, mocha_utils_js_1.getTestState)({ skipLaunch: true });
    return parseInt(await page.$eval('#drag-state', element => {
        return element.innerHTML;
    }), 10);
}
describe("Legacy Drag n' Drop", function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should emit a dragIntercepted event when dragged', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(false);
            await page.setDragInterception(true);
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(true);
            const draggable = __addDisposableResource(env_1, (await page.$('#drag')), false);
            const data = await draggable.drag({ x: 1, y: 1 });
            (0, assert_1.default)(data instanceof Object);
            (0, expect_1.default)(data.items).toHaveLength(1);
            (0, expect_1.default)(await getDragState()).toBe(1);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should emit a dragEnter', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(false);
            await page.setDragInterception(true);
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(true);
            const draggable = __addDisposableResource(env_2, (await page.$('#drag')), false);
            const data = await draggable.drag({ x: 1, y: 1 });
            (0, assert_1.default)(data instanceof Object);
            const dropzone = __addDisposableResource(env_2, (await page.$('#drop')), false);
            await dropzone.dragEnter(data);
            (0, expect_1.default)(await getDragState()).toBe(12);
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    it('should emit a dragOver event', async () => {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(false);
            await page.setDragInterception(true);
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(true);
            const draggable = __addDisposableResource(env_3, (await page.$('#drag')), false);
            const data = await draggable.drag({ x: 1, y: 1 });
            (0, assert_1.default)(data instanceof Object);
            const dropzone = __addDisposableResource(env_3, (await page.$('#drop')), false);
            await dropzone.dragEnter(data);
            await dropzone.dragOver(data);
            (0, expect_1.default)(await getDragState()).toBe(123);
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            __disposeResources(env_3);
        }
    });
    it('can be dropped', async () => {
        const env_4 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(false);
            await page.setDragInterception(true);
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(true);
            const draggable = __addDisposableResource(env_4, (await page.$('#drag')), false);
            const dropzone = __addDisposableResource(env_4, (await page.$('#drop')), false);
            const data = await draggable.drag({ x: 1, y: 1 });
            (0, assert_1.default)(data instanceof Object);
            await dropzone.dragEnter(data);
            await dropzone.dragOver(data);
            await dropzone.drop(data);
            (0, expect_1.default)(await getDragState()).toBe(12334);
        }
        catch (e_4) {
            env_4.error = e_4;
            env_4.hasError = true;
        }
        finally {
            __disposeResources(env_4);
        }
    });
    it('can be dragged and dropped with a single function', async () => {
        const env_5 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(false);
            await page.setDragInterception(true);
            (0, expect_1.default)(page.isDragInterceptionEnabled()).toBe(true);
            const draggable = __addDisposableResource(env_5, (await page.$('#drag')), false);
            const dropzone = __addDisposableResource(env_5, (await page.$('#drop')), false);
            await draggable.dragAndDrop(dropzone);
            (0, expect_1.default)(await getDragState()).toBe(12334);
        }
        catch (e_5) {
            env_5.error = e_5;
            env_5.hasError = true;
        }
        finally {
            __disposeResources(env_5);
        }
    });
});
describe("Drag n' Drop", () => {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should drop', async () => {
        const env_6 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            const draggable = __addDisposableResource(env_6, await page.$('#drag'), false);
            (0, assert_1.default)(draggable);
            const dropzone = __addDisposableResource(env_6, await page.$('#drop'), false);
            (0, assert_1.default)(dropzone);
            await dropzone.drop(draggable);
            (0, expect_1.default)(await getDragState()).toBe(1234);
        }
        catch (e_6) {
            env_6.error = e_6;
            env_6.hasError = true;
        }
        finally {
            __disposeResources(env_6);
        }
    });
    it('should drop using mouse', async () => {
        const env_7 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            const draggable = __addDisposableResource(env_7, await page.$('#drag'), false);
            (0, assert_1.default)(draggable);
            const dropzone = __addDisposableResource(env_7, await page.$('#drop'), false);
            (0, assert_1.default)(dropzone);
            await draggable.hover();
            await page.mouse.down();
            await dropzone.hover();
            (0, expect_1.default)(await getDragState()).toBe(123);
            await page.mouse.up();
            (0, expect_1.default)(await getDragState()).toBe(1234);
        }
        catch (e_7) {
            env_7.error = e_7;
            env_7.hasError = true;
        }
        finally {
            __disposeResources(env_7);
        }
    });
    it('should drag and drop', async () => {
        const env_8 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/drag-and-drop.html');
            const draggable = __addDisposableResource(env_8, await page.$('#drag'), false);
            (0, assert_1.default)(draggable);
            const dropzone = __addDisposableResource(env_8, await page.$('#drop'), false);
            (0, assert_1.default)(dropzone);
            await draggable.drag(dropzone);
            await dropzone.drop(draggable);
            (0, expect_1.default)(await getDragState()).toBe(1234);
        }
        catch (e_8) {
            env_8.error = e_8;
            env_8.hasError = true;
        }
        finally {
            __disposeResources(env_8);
        }
    });
});
//# sourceMappingURL=drag-and-drop.spec.js.map