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
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("../mocha-utils.js");
const extensionPath = path_1.default.join(__dirname, '..', '..', 'assets', 'simple-extension');
const serviceWorkerExtensionPath = path_1.default.join(__dirname, '..', '..', 'assets', 'serviceworkers', 'extension');
describe('extensions', function () {
    /* These tests fire up an actual browser so let's
     * allow a higher timeout
     */
    this.timeout(20000);
    let extensionOptions;
    const browsers = [];
    beforeEach(async () => {
        const { defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({
            skipLaunch: true,
        });
        extensionOptions = Object.assign({}, defaultBrowserOptions, {
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
            ],
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
    it('background_page target type should be available', async () => {
        const browserWithExtension = await launchBrowser(extensionOptions);
        const page = await browserWithExtension.newPage();
        const backgroundPageTarget = await browserWithExtension.waitForTarget(target => {
            return target.type() === 'background_page';
        });
        await page.close();
        await browserWithExtension.close();
        (0, expect_1.default)(backgroundPageTarget).toBeTruthy();
    });
    it('service_worker target type should be available', async () => {
        const browserWithExtension = await launchBrowser({
            args: [
                `--disable-extensions-except=${serviceWorkerExtensionPath}`,
                `--load-extension=${serviceWorkerExtensionPath}`,
            ],
        });
        const page = await browserWithExtension.newPage();
        const serviceWorkerTarget = await browserWithExtension.waitForTarget(target => {
            return target.type() === 'service_worker';
        });
        await page.close();
        await browserWithExtension.close();
        (0, expect_1.default)(serviceWorkerTarget).toBeTruthy();
    });
    it('target.page() should return a background_page', async function () {
        const browserWithExtension = await launchBrowser(extensionOptions);
        const backgroundPageTarget = await browserWithExtension.waitForTarget(target => {
            return target.type() === 'background_page';
        });
        const page = (await backgroundPageTarget.page());
        (0, expect_1.default)(await page.evaluate(() => {
            return 2 * 3;
        })).toBe(6);
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.MAGIC;
        })).toBe(42);
        await browserWithExtension.close();
    });
});
//# sourceMappingURL=extensions.spec.js.map