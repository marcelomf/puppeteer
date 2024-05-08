"use strict";
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
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('DefaultBrowserContext', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('page.cookies() should work', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate(() => {
            document.cookie = 'username=John Doe';
        });
        await (0, mocha_utils_js_1.expectCookieEquals)(await page.cookies(), [
            {
                name: 'username',
                value: 'John Doe',
                domain: 'localhost',
                path: '/',
                sameParty: false,
                expires: -1,
                size: 16,
                httpOnly: false,
                secure: false,
                session: true,
                sourceScheme: 'NonSecure',
            },
        ]);
    });
    it('page.setCookie() should work', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.setCookie({
            name: 'username',
            value: 'John Doe',
        });
        (0, expect_1.default)(await page.evaluate(() => {
            return document.cookie;
        })).toBe('username=John Doe');
        await (0, mocha_utils_js_1.expectCookieEquals)(await page.cookies(), [
            {
                name: 'username',
                value: 'John Doe',
                domain: 'localhost',
                path: '/',
                sameParty: false,
                expires: -1,
                size: 16,
                httpOnly: false,
                secure: false,
                session: true,
                sourceScheme: 'NonSecure',
            },
        ]);
    });
    it('page.deleteCookie() should work', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.setCookie({
            name: 'cookie1',
            value: '1',
        }, {
            name: 'cookie2',
            value: '2',
        });
        (0, expect_1.default)(await page.evaluate('document.cookie')).toBe('cookie1=1; cookie2=2');
        await page.deleteCookie({ name: 'cookie2' });
        (0, expect_1.default)(await page.evaluate('document.cookie')).toBe('cookie1=1');
        await (0, mocha_utils_js_1.expectCookieEquals)(await page.cookies(), [
            {
                name: 'cookie1',
                value: '1',
                domain: 'localhost',
                path: '/',
                sameParty: false,
                expires: -1,
                size: 8,
                httpOnly: false,
                secure: false,
                session: true,
                sourceScheme: 'NonSecure',
            },
        ]);
    });
});
//# sourceMappingURL=defaultbrowsercontext.spec.js.map