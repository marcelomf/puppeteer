"use strict";
/**
 * @license
 * Copyright 2018 Google Inc.
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
const mocha_utils_js_1 = require("../mocha-utils.js");
describe('DevTools', function () {
    /* These tests fire up an actual browser so let's
     * allow a higher timeout
     */
    this.timeout(20000);
    let launchOptions;
    const browsers = [];
    beforeEach(async () => {
        const { defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({
            skipLaunch: true,
        });
        launchOptions = Object.assign({}, defaultBrowserOptions, {
            devtools: true,
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
    it('target.page() should return a DevTools page if custom isPageTarget is provided', async function () {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { puppeteer } = await (0, mocha_utils_js_1.getTestState)({ skipLaunch: true });
            const originalBrowser = await launchBrowser(launchOptions);
            const browserWSEndpoint = originalBrowser.wsEndpoint();
            const browser = __addDisposableResource(env_1, await puppeteer.connect({
                browserWSEndpoint,
                _isPageTarget(target) {
                    return (target.type() === 'other' && target.url().startsWith('devtools://'));
                },
            }), false);
            const devtoolsPageTarget = await browser.waitForTarget(target => {
                return target.type() === 'other';
            });
            const page = (await devtoolsPageTarget.page());
            (0, expect_1.default)(await page.evaluate(() => {
                return 2 * 3;
            })).toBe(6);
            (0, expect_1.default)(await browser.pages()).toContain(page);
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('target.page() should return Page when calling asPage on DevTools target', async function () {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { puppeteer } = await (0, mocha_utils_js_1.getTestState)({ skipLaunch: true });
            const originalBrowser = await launchBrowser(launchOptions);
            const browserWSEndpoint = originalBrowser.wsEndpoint();
            const browser = __addDisposableResource(env_2, await puppeteer.connect({
                browserWSEndpoint,
            }), false);
            const devtoolsPageTarget = await browser.waitForTarget(target => {
                return target.type() === 'other';
            });
            const page = (await devtoolsPageTarget.asPage());
            (0, expect_1.default)(await page.evaluate(() => {
                return 2 * 3;
            })).toBe(6);
            // The page won't be part of browser.pages() if a custom isPageTarget is not provided
            (0, expect_1.default)(await browser.pages()).not.toContain(page);
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    it('should open devtools when "devtools: true" option is given', async () => {
        const browser = await launchBrowser(Object.assign({ devtools: true }, launchOptions));
        const context = await browser.createBrowserContext();
        await Promise.all([
            context.newPage(),
            browser.waitForTarget((target) => {
                return target.url().includes('devtools://');
            }),
        ]);
        await browser.close();
    });
    it('should expose DevTools as a page', async () => {
        const browser = await launchBrowser(Object.assign({ devtools: true }, launchOptions));
        const context = await browser.createBrowserContext();
        const [target] = await Promise.all([
            browser.waitForTarget((target) => {
                return target.url().includes('devtools://');
            }),
            context.newPage(),
        ]);
        const page = await target.page();
        await page.waitForFunction(() => {
            // @ts-expect-error wrong context.
            return Boolean(DevToolsAPI);
        });
        await browser.close();
    });
});
//# sourceMappingURL=devtools.spec.js.map