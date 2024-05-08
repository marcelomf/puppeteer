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
describe('Emulate idle state', () => {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    async function getIdleState(page) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const stateElement = __addDisposableResource(env_1, (await page.$('#state')), false);
            return await page.evaluate(element => {
                return element.innerText;
            }, stateElement);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    }
    async function verifyState(page, expectedState) {
        const actualState = await getIdleState(page);
        (0, expect_1.default)(actualState).toEqual(expectedState);
    }
    it('changing idle state emulation causes change of the IdleDetector state', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await context.overridePermissions(server.PREFIX + '/idle-detector.html', [
            'idle-detection',
        ]);
        await page.goto(server.PREFIX + '/idle-detector.html');
        // Store initial state, as soon as it is not guaranteed to be `active, unlocked`.
        const initialState = await getIdleState(page);
        // Emulate Idle states and verify IdleDetector updates state accordingly.
        await page.emulateIdleState({
            isUserActive: false,
            isScreenUnlocked: false,
        });
        await verifyState(page, 'Idle state: idle, locked.');
        await page.emulateIdleState({
            isUserActive: true,
            isScreenUnlocked: false,
        });
        await verifyState(page, 'Idle state: active, locked.');
        await page.emulateIdleState({
            isUserActive: true,
            isScreenUnlocked: true,
        });
        await verifyState(page, 'Idle state: active, unlocked.');
        await page.emulateIdleState({
            isUserActive: false,
            isScreenUnlocked: true,
        });
        await verifyState(page, 'Idle state: idle, unlocked.');
        // Remove Idle emulation and verify IdleDetector is in initial state.
        await page.emulateIdleState();
        await verifyState(page, initialState);
        // Emulate idle state again after removing emulation.
        await page.emulateIdleState({
            isUserActive: false,
            isScreenUnlocked: false,
        });
        await verifyState(page, 'Idle state: idle, locked.');
        // Remove emulation second time.
        await page.emulateIdleState();
        await verifyState(page, initialState);
    });
});
//# sourceMappingURL=idle_override.spec.js.map