"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("../mocha-utils.js");
const utils_js_1 = require("../utils.js");
describe('BFCache', function () {
    it('can navigate to a BFCached page', async () => {
        const { httpsServer, page, close } = await (0, mocha_utils_js_1.launch)({
            ignoreHTTPSErrors: true,
        });
        try {
            page.setDefaultTimeout(3000);
            await page.goto(httpsServer.PREFIX + '/cached/bfcache/index.html');
            await Promise.all([page.waitForNavigation(), page.locator('a').click()]);
            (0, expect_1.default)(page.url()).toContain('target.html');
            await Promise.all([page.waitForNavigation(), page.goBack()]);
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.innerText;
            })).toBe('BFCachednext');
        }
        finally {
            await close();
        }
    });
    it('can navigate to a BFCached page containing an OOPIF and a worker', async () => {
        const { httpsServer, page, close } = await (0, mocha_utils_js_1.launch)({
            ignoreHTTPSErrors: true,
        });
        try {
            page.setDefaultTimeout(3000);
            const [worker1] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, "workercreated" /* PageEvent.WorkerCreated */),
                page.goto(httpsServer.PREFIX + '/cached/bfcache/worker-iframe-container.html'),
            ]);
            (0, expect_1.default)(await worker1.evaluate('1 + 1')).toBe(2);
            await Promise.all([page.waitForNavigation(), page.locator('a').click()]);
            const [worker2] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, "workercreated" /* PageEvent.WorkerCreated */),
                page.waitForNavigation(),
                page.goBack(),
            ]);
            (0, expect_1.default)(await worker2.evaluate('1 + 1')).toBe(2);
        }
        finally {
            await close();
        }
    });
});
//# sourceMappingURL=bfcache.spec.js.map