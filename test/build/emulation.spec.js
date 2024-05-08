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
const puppeteer_1 = require("puppeteer");
const mocha_utils_js_1 = require("./mocha-utils.js");
const iPhone = puppeteer_1.KnownDevices['iPhone 6'];
const iPhoneLandscape = puppeteer_1.KnownDevices['iPhone 6 landscape'];
describe('Emulation', () => {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.viewport', function () {
        it('should get the proper viewport size', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(page.viewport()).toEqual({ width: 800, height: 600 });
            await page.setViewport({ width: 123, height: 456 });
            (0, expect_1.default)(page.viewport()).toEqual({ width: 123, height: 456 });
        });
        it('should support mobile emulation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/mobile.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return window.innerWidth;
            })).toBe(800);
            await page.setViewport(iPhone.viewport);
            (0, expect_1.default)(await page.evaluate(() => {
                return window.innerWidth;
            })).toBe(375);
            await page.setViewport({ width: 400, height: 300 });
            (0, expect_1.default)(await page.evaluate(() => {
                return window.innerWidth;
            })).toBe(400);
        });
        it('should support touch emulation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/mobile.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return 'ontouchstart' in window;
            })).toBe(false);
            await page.setViewport(iPhone.viewport);
            (0, expect_1.default)(await page.evaluate(() => {
                return 'ontouchstart' in window;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(dispatchTouch)).toBe('Received touch');
            await page.setViewport({ width: 100, height: 100 });
            (0, expect_1.default)(await page.evaluate(() => {
                return 'ontouchstart' in window;
            })).toBe(false);
            function dispatchTouch() {
                let fulfill;
                const promise = new Promise(x => {
                    fulfill = x;
                });
                window.ontouchstart = () => {
                    fulfill('Received touch');
                };
                window.dispatchEvent(new Event('touchstart'));
                fulfill('Did not receive touch');
                return promise;
            }
        });
        it('should be detectable by Modernizr', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/detect-touch.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.textContent.trim();
            })).toBe('NO');
            await page.setViewport(iPhone.viewport);
            await page.goto(server.PREFIX + '/detect-touch.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.textContent.trim();
            })).toBe('YES');
        });
        it('should detect touch when applying viewport with touches', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 800, height: 600, hasTouch: true });
            await page.addScriptTag({ url: server.PREFIX + '/modernizr.js' });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.Modernizr.touchevents;
            })).toBe(true);
        });
        it('should support landscape emulation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/mobile.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return screen.orientation.type;
            })).toBe('portrait-primary');
            await page.setViewport(iPhoneLandscape.viewport);
            (0, expect_1.default)(await page.evaluate(() => {
                return screen.orientation.type;
            })).toBe('landscape-primary');
            await page.setViewport({ width: 100, height: 100 });
            (0, expect_1.default)(await page.evaluate(() => {
                return screen.orientation.type;
            })).toBe('portrait-primary');
        });
        it('should update media queries when resoltion changes', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            async function getFontSize() {
                return await page.evaluate(() => {
                    return parseInt(window.getComputedStyle(document.querySelector('p')).fontSize, 10);
                });
            }
            for (const dpr of [1, 2, 3]) {
                await page.setViewport({
                    width: 800,
                    height: 600,
                    deviceScaleFactor: dpr,
                });
                await page.goto(server.PREFIX + '/resolution.html');
                await (0, expect_1.default)(getFontSize()).resolves.toEqual(dpr);
                const screenshot = await page.screenshot({
                    fullPage: false,
                });
                (0, expect_1.default)(screenshot).toBeGolden(`device-pixel-ratio${dpr}.png`);
            }
        });
        it('should load correct pictures when emulation dpr', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            async function getCurrentSrc() {
                return await page.evaluate(() => {
                    return document.querySelector('img').currentSrc;
                });
            }
            for (const dpr of [1, 2, 3]) {
                await page.setViewport({
                    width: 800,
                    height: 600,
                    deviceScaleFactor: dpr,
                });
                await page.goto(server.PREFIX + '/picture.html');
                await (0, expect_1.default)(getCurrentSrc()).resolves.toMatch(new RegExp(`logo-${dpr}x.png`));
            }
        });
    });
    describe('Page.emulate', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/mobile.html');
            await page.emulate(iPhone);
            (0, expect_1.default)(await page.evaluate(() => {
                return window.innerWidth;
            })).toBe(375);
            (0, expect_1.default)(await page.evaluate(() => {
                return navigator.userAgent;
            })).toContain('iPhone');
        });
        it('should support clicking', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.emulate(iPhone);
                await page.goto(server.PREFIX + '/input/button.html');
                const button = __addDisposableResource(env_1, (await page.$('button')), false);
                await page.evaluate(button => {
                    return (button.style.marginTop = '200px');
                }, button);
                await button.click();
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis.result;
                })).toBe('Clicked');
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
    });
    describe('Page.emulateMediaType', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('screen').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('print').matches;
            })).toBe(false);
            await page.emulateMediaType('print');
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('screen').matches;
            })).toBe(false);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('print').matches;
            })).toBe(true);
            await page.emulateMediaType();
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('screen').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('print').matches;
            })).toBe(false);
        });
        it('should throw in case of bad argument', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.emulateMediaType('bad').catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Unsupported media type: bad');
        });
    });
    describe('Page.emulateMediaFeatures', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.emulateMediaFeatures([
                { name: 'prefers-reduced-motion', value: 'reduce' },
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-reduced-motion: reduce)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-reduced-motion: no-preference)').matches;
            })).toBe(false);
            await page.emulateMediaFeatures([
                { name: 'prefers-color-scheme', value: 'light' },
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-color-scheme: light)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-color-scheme: dark)').matches;
            })).toBe(false);
            await page.emulateMediaFeatures([
                { name: 'prefers-color-scheme', value: 'dark' },
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-color-scheme: dark)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-color-scheme: light)').matches;
            })).toBe(false);
            await page.emulateMediaFeatures([
                { name: 'prefers-reduced-motion', value: 'reduce' },
                { name: 'prefers-color-scheme', value: 'light' },
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-reduced-motion: reduce)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-reduced-motion: no-preference)').matches;
            })).toBe(false);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-color-scheme: light)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(prefers-color-scheme: dark)').matches;
            })).toBe(false);
            await page.emulateMediaFeatures([{ name: 'color-gamut', value: 'srgb' }]);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: p3)').matches;
            })).toBe(false);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: srgb)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: rec2020)').matches;
            })).toBe(false);
            await page.emulateMediaFeatures([{ name: 'color-gamut', value: 'p3' }]);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: p3)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: srgb)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: rec2020)').matches;
            })).toBe(false);
            await page.emulateMediaFeatures([
                { name: 'color-gamut', value: 'rec2020' },
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: p3)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: srgb)').matches;
            })).toBe(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return matchMedia('(color-gamut: rec2020)').matches;
            })).toBe(true);
        });
        it('should throw in case of bad argument', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .emulateMediaFeatures([{ name: 'bad', value: '' }])
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Unsupported media feature: bad');
        });
    });
    describe('Page.emulateTimezone', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluate(() => {
                globalThis.date = new Date(1479579154987);
            });
            await page.emulateTimezone('America/Jamaica');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.date.toString();
            })).toBe('Sat Nov 19 2016 13:12:34 GMT-0500 (Eastern Standard Time)');
            await page.emulateTimezone('Pacific/Honolulu');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.date.toString();
            })).toBe('Sat Nov 19 2016 08:12:34 GMT-1000 (Hawaii-Aleutian Standard Time)');
            await page.emulateTimezone('America/Buenos_Aires');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.date.toString();
            })).toBe('Sat Nov 19 2016 15:12:34 GMT-0300 (Argentina Standard Time)');
            await page.emulateTimezone('Europe/Berlin');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.date.toString();
            })).toBe('Sat Nov 19 2016 19:12:34 GMT+0100 (Central European Standard Time)');
        });
        it('should throw for invalid timezone IDs', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.emulateTimezone('Foo/Bar').catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Invalid timezone ID: Foo/Bar');
            await page.emulateTimezone('Baz/Qux').catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Invalid timezone ID: Baz/Qux');
        });
    });
    describe('Page.emulateVisionDeficiency', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setViewport({ width: 500, height: 500 });
            await page.goto(server.PREFIX + '/grid.html');
            {
                await page.emulateVisionDeficiency('none');
                const screenshot = await page.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-sanity.png');
            }
            {
                await page.emulateVisionDeficiency('achromatopsia');
                const screenshot = await page.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('vision-deficiency-achromatopsia.png');
            }
            {
                await page.emulateVisionDeficiency('blurredVision');
                const screenshot = await page.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('vision-deficiency-blurredVision.png');
            }
            {
                await page.emulateVisionDeficiency('deuteranopia');
                const screenshot = await page.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('vision-deficiency-deuteranopia.png');
            }
            {
                await page.emulateVisionDeficiency('protanopia');
                const screenshot = await page.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('vision-deficiency-protanopia.png');
            }
            {
                await page.emulateVisionDeficiency('tritanopia');
                const screenshot = await page.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('vision-deficiency-tritanopia.png');
            }
            {
                await page.emulateVisionDeficiency('none');
                const screenshot = await page.screenshot();
                (0, expect_1.default)(screenshot).toBeGolden('screenshot-sanity.png');
            }
        });
        it('should throw for invalid vision deficiencies', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                // @ts-expect-error deliberately passing invalid deficiency
                .emulateVisionDeficiency('invalid')
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Unsupported vision deficiency: invalid');
        });
    });
    describe('Page.emulateNetworkConditions', function () {
        it('should change navigator.connection.effectiveType', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const slow3G = puppeteer_1.PredefinedNetworkConditions['Slow 3G'];
            const fast3G = puppeteer_1.PredefinedNetworkConditions['Fast 3G'];
            (0, expect_1.default)(await page.evaluate('window.navigator.connection.effectiveType')).toBe('4g');
            await page.emulateNetworkConditions(fast3G);
            (0, expect_1.default)(await page.evaluate('window.navigator.connection.effectiveType')).toBe('3g');
            await page.emulateNetworkConditions(slow3G);
            (0, expect_1.default)(await page.evaluate('window.navigator.connection.effectiveType')).toBe('2g');
            await page.emulateNetworkConditions(null);
        });
    });
    describe('Page.emulateCPUThrottling', function () {
        it('should change the CPU throttling rate successfully', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.emulateCPUThrottling(100);
            await page.emulateCPUThrottling(null);
        });
    });
});
//# sourceMappingURL=emulation.spec.js.map