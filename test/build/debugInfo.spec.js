"use strict";
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('DebugInfo', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Browser.debugInfo', function () {
        it('should work', async () => {
            const { page, browser } = await (0, mocha_utils_js_1.getTestState)();
            for (let i = 0; i < 5; i++) {
                if (!browser.debugInfo.pendingProtocolErrors.length) {
                    break;
                }
                await new Promise(resolve => {
                    return setTimeout(resolve, 200);
                });
            }
            // Insure that the previous test are flushed
            (0, expect_1.default)(browser.debugInfo.pendingProtocolErrors).toHaveLength(0);
            const promise = page.evaluate(() => {
                return new Promise(resolve => {
                    // @ts-expect-error another context
                    window.resolve = resolve;
                });
            });
            try {
                (0, expect_1.default)(browser.debugInfo.pendingProtocolErrors).toHaveLength(1);
            }
            finally {
                await page.evaluate(() => {
                    // @ts-expect-error another context
                    window.resolve();
                });
            }
            await promise;
            (0, expect_1.default)(browser.debugInfo.pendingProtocolErrors).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=debugInfo.spec.js.map