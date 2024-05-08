"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expect_1 = __importDefault(require("expect"));
const LazyArg_js_1 = require("puppeteer-core/internal/common/LazyArg.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('PuppeteerUtil tests', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should work', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const world = page.mainFrame().isolatedRealm();
        const value = await world.evaluate(PuppeteerUtil => {
            return typeof PuppeteerUtil === 'object';
        }, LazyArg_js_1.LazyArg.create(context => {
            return context.puppeteerUtil;
        }));
        (0, expect_1.default)(value).toBeTruthy();
    });
    describe('createFunction tests', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const world = page.mainFrame().isolatedRealm();
            const value = await world.evaluate(({ createFunction }, fnString) => {
                return createFunction(fnString)(4);
            }, LazyArg_js_1.LazyArg.create(context => {
                return context.puppeteerUtil;
            }), (() => {
                return 4;
            }).toString());
            (0, expect_1.default)(value).toBe(4);
        });
    });
});
//# sourceMappingURL=injected.spec.js.map