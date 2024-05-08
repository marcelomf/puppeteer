"use strict";
/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('ignoreHTTPSErrors', function () {
    /* Note that this test creates its own browser rather than use
     * the one provided by the test set-up as we need one
     * with ignoreHTTPSErrors set to true
     */
    let state;
    before(async () => {
        state = await (0, mocha_utils_js_1.launch)({ ignoreHTTPSErrors: true }, {
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
    describe('Response.securityDetails', function () {
        it('should work', async () => {
            const { httpsServer, page } = state;
            const [serverRequest, response] = await Promise.all([
                httpsServer.waitForRequest('/empty.html'),
                page.goto(httpsServer.EMPTY_PAGE),
            ]);
            const securityDetails = response.securityDetails();
            (0, expect_1.default)(securityDetails.issuer()).toBe('puppeteer-tests');
            const protocol = serverRequest.socket
                .getProtocol()
                .replace('v', ' ');
            (0, expect_1.default)(securityDetails.protocol()).toBe(protocol);
            (0, expect_1.default)(securityDetails.subjectName()).toBe('puppeteer-tests');
            (0, expect_1.default)(securityDetails.validFrom()).toBe(1589357069);
            (0, expect_1.default)(securityDetails.validTo()).toBe(1904717069);
            (0, expect_1.default)(securityDetails.subjectAlternativeNames()).toEqual([
                'www.puppeteer-tests.test',
                'www.puppeteer-tests-1.test',
            ]);
        });
        it('should be |null| for non-secure requests', async () => {
            const { server, page } = state;
            const response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.securityDetails()).toBe(null);
        });
        it('Network redirects should report SecurityDetails', async () => {
            const { httpsServer, page } = state;
            httpsServer.setRedirect('/plzredirect', '/empty.html');
            const responses = [];
            page.on('response', response => {
                return responses.push(response);
            });
            const [serverRequest] = await Promise.all([
                httpsServer.waitForRequest('/plzredirect'),
                page.goto(httpsServer.PREFIX + '/plzredirect'),
            ]);
            (0, expect_1.default)(responses).toHaveLength(2);
            (0, expect_1.default)(responses[0].status()).toBe(302);
            const securityDetails = responses[0].securityDetails();
            const protocol = serverRequest.socket
                .getProtocol()
                .replace('v', ' ');
            (0, expect_1.default)(securityDetails.protocol()).toBe(protocol);
        });
    });
    it('should work', async () => {
        const { httpsServer, page } = state;
        let error;
        const response = await page.goto(httpsServer.EMPTY_PAGE).catch(error_ => {
            return (error = error_);
        });
        (0, expect_1.default)(error).toBeUndefined();
        (0, expect_1.default)(response.ok()).toBe(true);
    });
    it('should work with request interception', async () => {
        const { httpsServer, page } = state;
        await page.setRequestInterception(true);
        page.on('request', request => {
            return request.continue();
        });
        const response = (await page.goto(httpsServer.EMPTY_PAGE));
        (0, expect_1.default)(response.status()).toBe(200);
    });
    it('should work with mixed content', async () => {
        const { server, httpsServer, page } = state;
        httpsServer.setRoute('/mixedcontent.html', (_req, res) => {
            res.end(`<iframe src=${server.EMPTY_PAGE}></iframe>`);
        });
        await page.goto(httpsServer.PREFIX + '/mixedcontent.html', {
            waitUntil: 'load',
        });
        (0, expect_1.default)(page.frames()).toHaveLength(2);
        // Make sure blocked iframe has functional execution context
        // @see https://github.com/puppeteer/puppeteer/issues/2709
        (0, expect_1.default)(await page.frames()[0].evaluate('1 + 2')).toBe(3);
        (0, expect_1.default)(await page.frames()[1].evaluate('2 + 3')).toBe(5);
    });
});
//# sourceMappingURL=ignorehttpserrors.spec.js.map