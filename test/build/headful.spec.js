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
const promises_1 = require("fs/promises");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const fs_js_1 = require("puppeteer-core/internal/node/util/fs.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
const TMP_FOLDER = path_1.default.join(os_1.default.tmpdir(), 'pptr_tmp_folder-');
describe('headful tests', function () {
    /* These tests fire up an actual browser so let's
     * allow a higher timeout
     */
    this.timeout(20000);
    let headfulOptions;
    let headlessOptions;
    const browsers = [];
    beforeEach(async () => {
        const { defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({
            skipLaunch: true,
        });
        headfulOptions = Object.assign({}, defaultBrowserOptions, {
            headless: false,
        });
        headlessOptions = Object.assign({}, defaultBrowserOptions, {
            headless: true,
        });
    });
    async function launchBrowser(options) {
        const { browser, close } = await (0, mocha_utils_js_1.launch)(options, { createContext: false });
        browsers.push(close);
        return browser;
    }
    afterEach(async () => {
        await Promise.all(browsers.map((close, index) => {
            delete browsers[index];
            return close();
        }));
    });
    describe('HEADFUL', function () {
        it('headless should be able to read cookies written by headful', async () => {
            /* Needs investigation into why but this fails consistently on Windows CI. */
            const { server } = await (0, mocha_utils_js_1.getTestState)({ skipLaunch: true });
            const userDataDir = await (0, promises_1.mkdtemp)(TMP_FOLDER);
            // Write a cookie in headful chrome
            const headfulBrowser = await launchBrowser(Object.assign({ userDataDir }, headfulOptions));
            try {
                const headfulPage = await headfulBrowser.newPage();
                await headfulPage.goto(server.EMPTY_PAGE);
                await headfulPage.evaluate(() => {
                    return (document.cookie =
                        'foo=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
                });
            }
            finally {
                await headfulBrowser.close();
            }
            // Read the cookie from headless chrome
            const headlessBrowser = await launchBrowser(Object.assign({ userDataDir }, headlessOptions));
            let cookie = '';
            try {
                const headlessPage = await headlessBrowser.newPage();
                await headlessPage.goto(server.EMPTY_PAGE);
                cookie = await headlessPage.evaluate(() => {
                    return document.cookie;
                });
            }
            finally {
                await headlessBrowser.close();
            }
            // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
            try {
                (0, fs_js_1.rmSync)(userDataDir);
            }
            catch { }
            (0, expect_1.default)(cookie).toBe('foo=true');
        });
    });
});
//# sourceMappingURL=headful.spec.js.map