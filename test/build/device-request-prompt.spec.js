"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const expect_1 = __importDefault(require("expect"));
const puppeteer_1 = require("puppeteer");
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('device request prompt', function () {
    let state;
    before(async () => {
        state = await (0, mocha_utils_js_1.launch)({
            args: ['--enable-features=WebBluetoothNewPermissionsBackend'],
            ignoreHTTPSErrors: true,
        }, {
            after: 'all',
        });
    });
    after(async () => {
        await state.close();
    });
    beforeEach(async () => {
        state.context = await state.browser.createBrowserContext();
        state.page = await state.context.newPage();
    });
    afterEach(async () => {
        await state.context.close();
    });
    // Bug: #11072
    it('does not crash', async function () {
        this.timeout(1000);
        const { page, httpsServer } = state;
        await page.goto(httpsServer.EMPTY_PAGE);
        await (0, expect_1.default)(page.waitForDevicePrompt({
            timeout: 10,
        })).rejects.toThrow(puppeteer_1.TimeoutError);
    });
});
//# sourceMappingURL=device-request-prompt.spec.js.map