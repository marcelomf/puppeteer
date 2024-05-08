"use strict";
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
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const puppeteer_1 = require("puppeteer");
const CDPSession_js_1 = require("puppeteer-core/internal/api/CDPSession.js");
const Deferred_js_1 = require("puppeteer-core/internal/util/Deferred.js");
const sinon_1 = __importDefault(require("sinon"));
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('Page', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.close', function () {
        it('should reject all promises when page is closed', async () => {
            const { context } = await (0, mocha_utils_js_1.getTestState)();
            const newPage = await context.newPage();
            let error;
            await Promise.all([
                newPage
                    .evaluate(() => {
                    return new Promise(() => { });
                })
                    .catch(error_ => {
                    return (error = error_);
                }),
                newPage.close(),
            ]);
            (0, expect_1.default)(error.message).toContain('Protocol error');
        });
        it('should not be visible in browser.pages', async () => {
            const { browser, context } = await (0, mocha_utils_js_1.getTestState)();
            const newPage = await context.newPage();
            (0, expect_1.default)(await browser.pages()).toContain(newPage);
            await newPage.close();
            (0, expect_1.default)(await browser.pages()).not.toContain(newPage);
        });
        it('should run beforeunload if asked for', async () => {
            const { context, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            const newPage = await context.newPage();
            await newPage.goto(server.PREFIX + '/beforeunload.html');
            // We have to interact with a page so that 'beforeunload' handlers
            // fire.
            await newPage.click('body');
            const pageClosingPromise = newPage.close({ runBeforeUnload: true });
            const dialog = await (0, utils_js_1.waitEvent)(newPage, 'dialog');
            (0, expect_1.default)(dialog.type()).toBe('beforeunload');
            (0, expect_1.default)(dialog.defaultValue()).toBe('');
            if (isChrome) {
                (0, expect_1.default)(dialog.message()).toBe('');
            }
            else {
                (0, expect_1.default)(dialog.message()).toBeTruthy();
            }
            await dialog.accept();
            await pageClosingPromise;
        });
        it('should *not* run beforeunload by default', async () => {
            const { context, server } = await (0, mocha_utils_js_1.getTestState)();
            const newPage = await context.newPage();
            await newPage.goto(server.PREFIX + '/beforeunload.html');
            // We have to interact with a page so that 'beforeunload' handlers
            // fire.
            await newPage.click('body');
            await newPage.close();
        });
        it('should set the page close state', async () => {
            const { context } = await (0, mocha_utils_js_1.getTestState)();
            const newPage = await context.newPage();
            (0, expect_1.default)(newPage.isClosed()).toBe(false);
            await newPage.close();
            (0, expect_1.default)(newPage.isClosed()).toBe(true);
        });
        it('should terminate network waiters', async () => {
            const { context, server } = await (0, mocha_utils_js_1.getTestState)();
            const newPage = await context.newPage();
            const results = await Promise.all([
                newPage.waitForRequest(server.EMPTY_PAGE).catch(error => {
                    return error;
                }),
                newPage.waitForResponse(server.EMPTY_PAGE).catch(error => {
                    return error;
                }),
                newPage.close(),
            ]);
            for (let i = 0; i < 2; i++) {
                const message = results[i].message;
                (0, expect_1.default)(message).atLeastOneToContain([
                    'Target closed',
                    'Page closed!',
                    'Frame detached',
                ]);
                (0, expect_1.default)(message).not.toContain('Timeout');
            }
        });
    });
    describe('Page.Events.Load', function () {
        it('should fire when expected', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await Promise.all([(0, utils_js_1.waitEvent)(page, 'load'), page.goto('about:blank')]);
        });
    });
    describe('removing and adding event handlers', () => {
        it('should correctly fire event handlers as they are added and then removed', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const handler = sinon_1.default.spy();
            const onResponse = (response) => {
                // Ignore default favicon requests.
                if (!(0, utils_js_1.isFavicon)(response)) {
                    handler();
                }
            };
            page.on('response', onResponse);
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(handler.callCount).toBe(1);
            page.off('response', onResponse);
            await page.goto(server.EMPTY_PAGE);
            // Still one because we removed the handler.
            (0, expect_1.default)(handler.callCount).toBe(1);
            page.on('response', onResponse);
            await page.goto(server.EMPTY_PAGE);
            // Two now because we added the handler back.
            (0, expect_1.default)(handler.callCount).toBe(2);
        });
        it('should correctly added and removed request events', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const handler = sinon_1.default.spy();
            const onResponse = (response) => {
                // Ignore default favicon requests.
                if (!(0, utils_js_1.isFavicon)(response)) {
                    handler();
                }
            };
            page.on('request', onResponse);
            page.on('request', onResponse);
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(handler.callCount).toBe(2);
            page.off('request', onResponse);
            await page.goto(server.EMPTY_PAGE);
            // Still one because we removed the handler.
            (0, expect_1.default)(handler.callCount).toBe(3);
            page.off('request', onResponse);
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(handler.callCount).toBe(3);
            page.on('request', onResponse);
            await page.goto(server.EMPTY_PAGE);
            // Two now because we added the handler back.
            (0, expect_1.default)(handler.callCount).toBe(4);
        });
    });
    describe('Page.Events.error', function () {
        it('should throw when page crashes', async () => {
            const { page, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            let navigate;
            if (isChrome) {
                navigate = page.goto('chrome://crash').catch(() => { });
            }
            else {
                navigate = page.goto('about:crashcontent').catch(() => { });
            }
            const [error] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'error'),
                navigate,
            ]);
            (0, expect_1.default)(error.message).toBe('Page crashed!');
        });
    });
    describe('Page.Events.Popup', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const [popup] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'popup'),
                page.evaluate(() => {
                    return window.open('about:blank');
                }),
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
            (0, expect_1.default)(await popup.evaluate(() => {
                return !!window.opener;
            })).toBe(true);
        });
        it('should work with noopener', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const [popup] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'popup'),
                page.evaluate(() => {
                    return window.open('about:blank', undefined, 'noopener');
                }),
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
            (0, expect_1.default)(await popup.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
        });
        it('should work with clicking target=_blank and without rel=opener', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setContent('<a target=_blank href="/one-style.html">yo</a>');
            const [popup] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'popup'),
                page.click('a'),
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
            (0, expect_1.default)(await popup.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
        });
        it('should work with clicking target=_blank and with rel=opener', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setContent('<a target=_blank rel=opener href="/one-style.html">yo</a>');
            const [popup] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'popup'),
                page.click('a'),
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
            (0, expect_1.default)(await popup.evaluate(() => {
                return !!window.opener;
            })).toBe(true);
        });
        it('should work with fake-clicking target=_blank and rel=noopener', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setContent('<a target=_blank rel=noopener href="/one-style.html">yo</a>');
            const [popup] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'popup'),
                page.$eval('a', a => {
                    return a.click();
                }),
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
            (0, expect_1.default)(await popup.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
        });
        it('should work with clicking target=_blank and rel=noopener', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setContent('<a target=_blank rel=noopener href="/one-style.html">yo</a>');
            const [popup] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'popup'),
                page.click('a'),
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
            (0, expect_1.default)(await popup.evaluate(() => {
                return !!window.opener;
            })).toBe(false);
        });
    });
    describe('Page.setGeolocation', function () {
        it('should work', async () => {
            const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
            await context.overridePermissions(server.PREFIX, ['geolocation']);
            await page.goto(server.EMPTY_PAGE);
            await page.setGeolocation({ longitude: 10, latitude: 10 });
            const geolocation = await page.evaluate(() => {
                return new Promise(resolve => {
                    return navigator.geolocation.getCurrentPosition(position => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    });
                });
            });
            (0, expect_1.default)(geolocation).toEqual({
                latitude: 10,
                longitude: 10,
            });
        });
        it('should throw when invalid longitude', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            try {
                await page.setGeolocation({ longitude: 200, latitude: 10 });
            }
            catch (error_) {
                error = error_;
            }
            (0, expect_1.default)(error.message).toContain('Invalid longitude "200"');
        });
    });
    describe('Page.setOfflineMode', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setOfflineMode(true);
            let error;
            await page.goto(server.EMPTY_PAGE).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
            await page.setOfflineMode(false);
            const response = (await page.reload());
            (0, expect_1.default)(response.status()).toBe(200);
        });
        it('should emulate navigator.onLine', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.evaluate(() => {
                return window.navigator.onLine;
            })).toBe(true);
            await page.setOfflineMode(true);
            (0, expect_1.default)(await page.evaluate(() => {
                return window.navigator.onLine;
            })).toBe(false);
            await page.setOfflineMode(false);
            (0, expect_1.default)(await page.evaluate(() => {
                return window.navigator.onLine;
            })).toBe(true);
        });
    });
    describe('Page.Events.Console', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const [message] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'console'),
                page.evaluate(() => {
                    return console.log('hello', 5, { foo: 'bar' });
                }),
            ]);
            (0, expect_1.default)(message.text()).toEqual('hello 5 JSHandle@object');
            (0, expect_1.default)(message.type()).toEqual('log');
            (0, expect_1.default)(message.args()).toHaveLength(3);
            (0, expect_1.default)(message.location()).toEqual({
                url: expect_1.default.any(String),
                lineNumber: expect_1.default.any(Number),
                columnNumber: expect_1.default.any(Number),
            });
            (0, expect_1.default)(await message.args()[0].jsonValue()).toEqual('hello');
            (0, expect_1.default)(await message.args()[1].jsonValue()).toEqual(5);
            (0, expect_1.default)(await message.args()[2].jsonValue()).toEqual({ foo: 'bar' });
        });
        it('should work on script call right after navigation', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const [message] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'console'),
                page.goto(
                // Firefox prints warn if <!DOCTYPE html> is not present
                `data:text/html,<!DOCTYPE html><script>console.log('SOME_LOG_MESSAGE');</script>`),
            ]);
            (0, expect_1.default)(message.text()).toEqual('SOME_LOG_MESSAGE');
        });
        it('should work for different console API calls with logging functions', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const messages = [];
            page.on('console', msg => {
                return messages.push(msg);
            });
            // All console events will be reported before `page.evaluate` is finished.
            await page.evaluate(() => {
                console.trace('calling console.trace');
                console.dir('calling console.dir');
                console.warn('calling console.warn');
                console.error('calling console.error');
                console.log(Promise.resolve('should not wait until resolved!'));
            });
            (0, expect_1.default)(messages.map(msg => {
                return msg.type();
            })).toEqual(['trace', 'dir', 'warn', 'error', 'log']);
            (0, expect_1.default)(messages.map(msg => {
                return msg.text();
            })).toEqual([
                'calling console.trace',
                'calling console.dir',
                'calling console.warn',
                'calling console.error',
                'JSHandle@promise',
            ]);
        });
        it('should work for different console API calls with timing functions', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const messages = [];
            page.on('console', msg => {
                return messages.push(msg);
            });
            // All console events will be reported before `page.evaluate` is finished.
            await page.evaluate(() => {
                // A pair of time/timeEnd generates only one Console API call.
                console.time('calling console.time');
                console.timeEnd('calling console.time');
            });
            (0, expect_1.default)(messages.map(msg => {
                return msg.type();
            })).toEqual(['timeEnd']);
            (0, expect_1.default)(messages[0].text()).toContain('calling console.time');
        });
        it('should not fail for window object', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const [message] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'console'),
                page.evaluate(() => {
                    return console.error(window);
                }),
            ]);
            (0, expect_1.default)(message.text()).atLeastOneToContain([
                'JSHandle@object',
                'JSHandle@window',
            ]);
        });
        it('should return remote objects', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const logPromise = (0, utils_js_1.waitEvent)(page, 'console');
                await page.evaluate(() => {
                    globalThis.test = 1;
                    console.log(1, 2, 3, globalThis);
                });
                const log = await logPromise;
                (0, expect_1.default)(log.text()).atLeastOneToContain([
                    '1 2 3 JSHandle@object',
                    '1 2 3 JSHandle@window',
                ]);
                (0, expect_1.default)(log.args()).toHaveLength(4);
                const property = __addDisposableResource(env_1, await log.args()[3].getProperty('test'), false);
                (0, expect_1.default)(await property.jsonValue()).toBe(1);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should trigger correct Log', async () => {
            const { page, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto('about:blank');
            const [message] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'console'),
                page.evaluate(async (url) => {
                    return await fetch(url).catch(() => { });
                }, server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(message.text()).toContain('Access-Control-Allow-Origin');
            if (isChrome) {
                (0, expect_1.default)(message.type()).toEqual('error');
            }
            else {
                (0, expect_1.default)(message.type()).toEqual('warn');
            }
        });
        it('should have location when fetch fails', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // The point of this test is to make sure that we report console messages from
            // Log domain: https://vanilla.aslushnikov.com/?Log.entryAdded
            await page.goto(server.EMPTY_PAGE);
            const [message] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'console'),
                page.setContent(`<script>fetch('http://wat');</script>`),
            ]);
            (0, expect_1.default)(message.text()).toContain(`ERR_NAME_NOT_RESOLVED`);
            (0, expect_1.default)(message.type()).toEqual('error');
            (0, expect_1.default)(message.location()).toEqual({
                url: 'http://wat/',
                lineNumber: undefined,
            });
        });
        it('should have location and stack trace for console API calls', async () => {
            const { page, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [message] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'console'),
                page.goto(server.PREFIX + '/consolelog.html'),
            ]);
            (0, expect_1.default)(message.text()).toBe('yellow');
            (0, expect_1.default)(message.type()).toBe('log');
            (0, expect_1.default)(message.location()).toEqual({
                url: server.PREFIX + '/consolelog.html',
                lineNumber: 8,
                columnNumber: isChrome ? 16 : 8, // console.|log vs |console.log
            });
            (0, expect_1.default)(message.stackTrace()).toEqual([
                {
                    url: server.PREFIX + '/consolelog.html',
                    lineNumber: 8,
                    columnNumber: isChrome ? 16 : 8, // console.|log vs |console.log
                },
                {
                    url: server.PREFIX + '/consolelog.html',
                    lineNumber: 11,
                    columnNumber: 8,
                },
                {
                    url: server.PREFIX + '/consolelog.html',
                    lineNumber: 13,
                    columnNumber: 6,
                },
            ]);
        });
        // @see https://github.com/puppeteer/puppeteer/issues/3865
        it('should not throw when there are console messages in detached iframes', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.evaluate(async () => {
                // 1. Create a popup that Puppeteer is not connected to.
                const win = window.open(window.location.href, 'Title', 'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top=0,left=0');
                await new Promise(x => {
                    return (win.onload = x);
                });
                // 2. In this popup, create an iframe that console.logs a message.
                win.document.body.innerHTML = `<iframe src='/consolelog.html'></iframe>`;
                const frame = win.document.querySelector('iframe');
                await new Promise(x => {
                    return (frame.onload = x);
                });
                // 3. After that, remove the iframe.
                frame.remove();
            });
            // 4. The target will always be the last one.
            const popupTarget = page.browserContext().targets().at(-1);
            // 5. Connect to the popup and make sure it doesn't throw and is not the same page.
            (0, expect_1.default)(await popupTarget.page()).not.toBe(page);
        });
    });
    describe('Page.Events.DOMContentLoaded', function () {
        it('should fire when expected', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const navigate = page.goto('about:blank');
            await Promise.all([(0, utils_js_1.waitEvent)(page, 'domcontentloaded'), navigate]);
        });
    });
    describe('Page.metrics', function () {
        it('should get metrics from a page', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto('about:blank');
            const metrics = await page.metrics();
            checkMetrics(metrics);
        });
        it('metrics event fired on console.timeStamp', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const metricsPromise = (0, utils_js_1.waitEvent)(page, 'metrics');
            await page.evaluate(() => {
                return console.timeStamp('test42');
            });
            const metrics = await metricsPromise;
            (0, expect_1.default)(metrics.title).toBe('test42');
            checkMetrics(metrics.metrics);
        });
        function checkMetrics(metrics) {
            const metricsToCheck = new Set([
                'Timestamp',
                'Documents',
                'Frames',
                'JSEventListeners',
                'Nodes',
                'LayoutCount',
                'RecalcStyleCount',
                'LayoutDuration',
                'RecalcStyleDuration',
                'ScriptDuration',
                'TaskDuration',
                'JSHeapUsedSize',
                'JSHeapTotalSize',
            ]);
            for (const name in metrics) {
                (0, expect_1.default)(metricsToCheck.has(name)).toBeTruthy();
                (0, expect_1.default)(metrics[name]).toBeGreaterThanOrEqual(0);
                metricsToCheck.delete(name);
            }
            (0, expect_1.default)(metricsToCheck.size).toBe(0);
        }
    });
    describe('Page.waitForRequest', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [request] = await Promise.all([
                page.waitForRequest(server.PREFIX + '/digits/2.png'),
                page.evaluate(() => {
                    void fetch('/digits/1.png');
                    void fetch('/digits/2.png');
                    void fetch('/digits/3.png');
                }),
            ]);
            (0, expect_1.default)(request.url()).toBe(server.PREFIX + '/digits/2.png');
        });
        it('should work with predicate', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [request] = await Promise.all([
                page.waitForRequest(request => {
                    return request.url() === server.PREFIX + '/digits/2.png';
                }),
                page.evaluate(() => {
                    void fetch('/digits/1.png');
                    void fetch('/digits/2.png');
                    void fetch('/digits/3.png');
                }),
            ]);
            (0, expect_1.default)(request.url()).toBe(server.PREFIX + '/digits/2.png');
        });
        it('should work with async predicate', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [request] = await Promise.all([
                page.waitForRequest(async (request) => {
                    return request.url() === server.PREFIX + '/digits/2.png';
                }),
                page.evaluate(() => {
                    void fetch('/digits/1.png');
                    void fetch('/digits/2.png');
                    void fetch('/digits/3.png');
                }),
            ]);
            (0, expect_1.default)(request.url()).toBe(server.PREFIX + '/digits/2.png');
        });
        it('should respect timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .waitForRequest(() => {
                return false;
            }, { timeout: 1 })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should respect default timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            page.setDefaultTimeout(1);
            await page
                .waitForRequest(() => {
                return false;
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should work with no timeout', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [request] = await Promise.all([
                page.waitForRequest(server.PREFIX + '/digits/2.png', { timeout: 0 }),
                page.evaluate(() => {
                    return setTimeout(() => {
                        void fetch('/digits/1.png');
                        void fetch('/digits/2.png');
                        void fetch('/digits/3.png');
                    }, 50);
                }),
            ]);
            (0, expect_1.default)(request.url()).toBe(server.PREFIX + '/digits/2.png');
        });
    });
    describe('Page.waitForResponse', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [response] = await Promise.all([
                page.waitForResponse(server.PREFIX + '/digits/2.png'),
                page.evaluate(() => {
                    void fetch('/digits/1.png');
                    void fetch('/digits/2.png');
                    void fetch('/digits/3.png');
                }),
            ]);
            (0, expect_1.default)(response.url()).toBe(server.PREFIX + '/digits/2.png');
        });
        it('should respect timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .waitForResponse(() => {
                return false;
            }, { timeout: 1 })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should respect default timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            page.setDefaultTimeout(1);
            await page
                .waitForResponse(() => {
                return false;
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should work with predicate', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [response] = await Promise.all([
                page.waitForResponse(response => {
                    return response.url() === server.PREFIX + '/digits/2.png';
                }),
                page.evaluate(() => {
                    void fetch('/digits/1.png');
                    void fetch('/digits/2.png');
                    void fetch('/digits/3.png');
                }),
            ]);
            (0, expect_1.default)(response.url()).toBe(server.PREFIX + '/digits/2.png');
        });
        it('should work with async predicate', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [response] = await Promise.all([
                page.waitForResponse(async (response) => {
                    return response.url() === server.PREFIX + '/digits/2.png';
                }),
                page.evaluate(() => {
                    void fetch('/digits/1.png');
                    void fetch('/digits/2.png');
                    void fetch('/digits/3.png');
                }),
            ]);
            (0, expect_1.default)(response.url()).toBe(server.PREFIX + '/digits/2.png');
        });
        it('should work with no timeout', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [response] = await Promise.all([
                page.waitForResponse(server.PREFIX + '/digits/2.png', { timeout: 0 }),
                page.evaluate(() => {
                    return setTimeout(() => {
                        void fetch('/digits/1.png');
                        void fetch('/digits/2.png');
                        void fetch('/digits/3.png');
                    }, 50);
                }),
            ]);
            (0, expect_1.default)(response.url()).toBe(server.PREFIX + '/digits/2.png');
        });
    });
    describe('Page.waitForNetworkIdle', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            let res;
            const [t1, t2] = await Promise.all([
                page.waitForNetworkIdle().then(r => {
                    res = r;
                    return Date.now();
                }),
                page
                    .evaluate(async () => {
                    await Promise.all([fetch('/digits/1.png'), fetch('/digits/2.png')]);
                    await new Promise(resolve => {
                        return setTimeout(resolve, 200);
                    });
                    await fetch('/digits/3.png');
                    await new Promise(resolve => {
                        return setTimeout(resolve, 200);
                    });
                    await fetch('/digits/4.png');
                })
                    .then(() => {
                    return Date.now();
                }),
            ]);
            (0, expect_1.default)(res).toBe(undefined);
            (0, expect_1.default)(t1).toBeGreaterThan(t2);
            (0, expect_1.default)(t1 - t2).toBeGreaterThanOrEqual(400);
        });
        it('should respect timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.waitForNetworkIdle({ timeout: 1 }).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should respect idleTime', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [t1, t2] = await Promise.all([
                page.waitForNetworkIdle({ idleTime: 10 }).then(() => {
                    return Date.now();
                }),
                page
                    .evaluate(() => {
                    return (async () => {
                        await Promise.all([
                            fetch('/digits/1.png'),
                            fetch('/digits/2.png'),
                        ]);
                        await new Promise(resolve => {
                            return setTimeout(resolve, 250);
                        });
                    })();
                })
                    .then(() => {
                    return Date.now();
                }),
            ]);
            (0, expect_1.default)(t2).toBeGreaterThan(t1);
        });
        it('should work with no timeout', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const [result] = await Promise.all([
                page.waitForNetworkIdle({ timeout: 0 }),
                page.evaluate(() => {
                    return setTimeout(() => {
                        void fetch('/digits/1.png');
                        void fetch('/digits/2.png');
                        void fetch('/digits/3.png');
                    }, 50);
                }),
            ]);
            (0, expect_1.default)(result).toBe(undefined);
        });
        it('should work with aborted requests', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/abort-request.html');
                const element = __addDisposableResource(env_2, await page.$(`#abort`), false);
                await element.click();
                let error = false;
                await page.waitForNetworkIdle().catch(() => {
                    return (error = true);
                });
                (0, expect_1.default)(error).toBe(false);
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should work with delayed response', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            let response;
            server.setRoute('/fetch-request-b.js', (_req, res) => {
                response = res;
            });
            const t0 = Date.now();
            const [t1, t2] = await Promise.all([
                page.waitForNetworkIdle({ idleTime: 100 }).then(() => {
                    return Date.now();
                }),
                new Promise(res => {
                    setTimeout(() => {
                        response.end();
                        res(Date.now());
                    }, 300);
                }),
                page.evaluate(async () => {
                    await fetch('/fetch-request-b.js');
                }),
            ]);
            (0, expect_1.default)(t1).toBeGreaterThan(t2);
            // request finished + idle time.
            (0, expect_1.default)(t1 - t0).toBeGreaterThan(400);
            // request finished + idle time - request finished.
            (0, expect_1.default)(t1 - t2).toBeGreaterThanOrEqual(100);
        });
    });
    describe('Page.exposeFunction', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('compute', function (a, b) {
                return a * b;
            });
            const result = await page.evaluate(async function () {
                return globalThis.compute(9, 4);
            });
            (0, expect_1.default)(result).toBe(36);
        });
        it('should throw exception in page context', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('woof', () => {
                throw new Error('WOOF WOOF');
            });
            const { message, stack } = await page.evaluate(async () => {
                try {
                    return await globalThis.woof();
                }
                catch (error) {
                    return {
                        message: error.message,
                        stack: error.stack,
                    };
                }
            });
            (0, expect_1.default)(message).toBe('WOOF WOOF');
            (0, expect_1.default)(stack).toContain('page.spec.ts');
        });
        it('should support throwing "null"', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('woof', function () {
                throw null;
            });
            const thrown = await page.evaluate(async () => {
                try {
                    await globalThis.woof();
                    return;
                }
                catch (error) {
                    return error;
                }
            });
            (0, expect_1.default)(thrown).toBe(null);
        });
        it('should be callable from-inside evaluateOnNewDocument', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const called = new Deferred_js_1.Deferred();
            await page.exposeFunction('woof', function () {
                called.resolve();
            });
            await page.evaluateOnNewDocument(() => {
                return globalThis.woof();
            });
            await page.reload();
            await called.valueOrThrow();
        });
        it('should survive navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('compute', function (a, b) {
                return a * b;
            });
            await page.goto(server.EMPTY_PAGE);
            const result = await page.evaluate(async function () {
                return globalThis.compute(9, 4);
            });
            (0, expect_1.default)(result).toBe(36);
        });
        it('should await returned promise', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('compute', function (a, b) {
                return Promise.resolve(a * b);
            });
            const result = await page.evaluate(async function () {
                return globalThis.compute(3, 5);
            });
            (0, expect_1.default)(result).toBe(15);
        });
        it('should await returned if called from function', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('compute', function (a, b) {
                return Promise.resolve(a * b);
            });
            const result = await page.evaluate(async function () {
                const result = await globalThis.compute(3, 5);
                return result;
            });
            (0, expect_1.default)(result).toBe(15);
        });
        it('should work on frames', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('compute', function (a, b) {
                return Promise.resolve(a * b);
            });
            await page.goto(server.PREFIX + '/frames/nested-frames.html');
            const frame = page.frames()[1];
            const result = await frame.evaluate(async function () {
                return globalThis.compute(3, 5);
            });
            (0, expect_1.default)(result).toBe(15);
        });
        it('should work with loading frames', async () => {
            // Tries to reproduce the scenario from
            // https://github.com/puppeteer/puppeteer/issues/8106
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            let saveRequest;
            const iframeRequest = new Promise(resolve => {
                saveRequest = resolve;
            });
            page.on('request', async (req) => {
                if (req.url().endsWith('/frames/frame.html')) {
                    saveRequest(req);
                }
                else {
                    await req.continue();
                }
            });
            let error;
            const navPromise = page
                .goto(server.PREFIX + '/frames/one-frame.html', {
                waitUntil: 'networkidle0',
            })
                .catch(err => {
                error = err;
            });
            const req = await iframeRequest;
            // Expose function while the frame is being loaded. Loading process is
            // controlled by interception.
            const exposePromise = page.exposeFunction('compute', function (a, b) {
                return Promise.resolve(a * b);
            });
            await Promise.all([req.continue(), exposePromise]);
            await navPromise;
            (0, expect_1.default)(error).toBeUndefined();
            const frame = page.frames()[1];
            const result = await frame.evaluate(async function () {
                return globalThis.compute(3, 5);
            });
            (0, expect_1.default)(result).toBe(15);
        });
        it('should work on frames before navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/frames/nested-frames.html');
            await page.exposeFunction('compute', function (a, b) {
                return Promise.resolve(a * b);
            });
            const frame = page.frames()[1];
            const result = await frame.evaluate(async function () {
                return globalThis.compute(3, 5);
            });
            (0, expect_1.default)(result).toBe(15);
        });
        it('should not throw when frames detach', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            await page.exposeFunction('compute', function (a, b) {
                return Promise.resolve(a * b);
            });
            await (0, utils_js_1.detachFrame)(page, 'frame1');
            await (0, expect_1.default)(page.evaluate(async function () {
                return globalThis.compute(3, 5);
            })).resolves.toEqual(15);
        });
        it('should work with complex objects', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('complexObject', function (a, b) {
                return { x: a.x + b.x };
            });
            const result = await page.evaluate(async () => {
                return globalThis.complexObject({ x: 5 }, { x: 2 });
            });
            (0, expect_1.default)(result.x).toBe(7);
        });
        it('should fallback to default export when passed a module object', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const moduleObject = {
                default: function (a, b) {
                    return a * b;
                },
            };
            await page.goto(server.EMPTY_PAGE);
            await page.exposeFunction('compute', moduleObject);
            const result = await page.evaluate(async function () {
                return globalThis.compute(9, 4);
            });
            (0, expect_1.default)(result).toBe(36);
        });
    });
    describe('Page.removeExposedFunction', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.exposeFunction('compute', function (a, b) {
                return a * b;
            });
            const result = await page.evaluate(async function () {
                return globalThis.compute(9, 4);
            });
            (0, expect_1.default)(result).toBe(36);
            await page.removeExposedFunction('compute');
            const error = await page
                .evaluate(async function () {
                return globalThis.compute(9, 4);
            })
                .then(() => {
                return null;
            })
                .catch(error => {
                return error;
            });
            (0, expect_1.default)(error).toBeTruthy();
        });
    });
    describe('Page.Events.PageError', function () {
        it('should fire', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const [error] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'pageerror', err => {
                    return err.message.includes('Fancy');
                }),
                page.goto(server.PREFIX + '/error.html'),
            ]);
            (0, expect_1.default)(error.message).toContain('Fancy');
            (0, expect_1.default)(error.stack?.split('\n').at(-1)).toContain('error.html:3:1');
        });
    });
    describe('Page.setUserAgent', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.evaluate(() => {
                return navigator.userAgent;
            })).toContain('Mozilla');
            await page.setUserAgent('foobar');
            const [request] = await Promise.all([
                server.waitForRequest('/empty.html'),
                page.goto(server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(request.headers['user-agent']).toBe('foobar');
        });
        it('should work for subframes', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(await page.evaluate(() => {
                return navigator.userAgent;
            })).toContain('Mozilla');
            await page.setUserAgent('foobar');
            const [request] = await Promise.all([
                server.waitForRequest('/empty.html'),
                (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(request.headers['user-agent']).toBe('foobar');
        });
        it('should emulate device user-agent', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/mobile.html');
            (0, expect_1.default)(await page.evaluate(() => {
                return navigator.userAgent;
            })).not.toContain('iPhone');
            await page.setUserAgent(puppeteer_1.KnownDevices['iPhone 6'].userAgent);
            (0, expect_1.default)(await page.evaluate(() => {
                return navigator.userAgent;
            })).toContain('iPhone');
        });
        it('should work with additional userAgentMetdata', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setUserAgent('MockBrowser', {
                architecture: 'Mock1',
                mobile: false,
                model: 'Mockbook',
                platform: 'MockOS',
                platformVersion: '3.1',
            });
            const [request] = await Promise.all([
                server.waitForRequest('/empty.html'),
                page.goto(server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(await page.evaluate(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error: userAgentData not yet in TypeScript DOM API
                return navigator.userAgentData.mobile;
            })).toBe(false);
            const uaData = await page.evaluate(() => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error: userAgentData not yet in TypeScript DOM API
                return navigator.userAgentData.getHighEntropyValues([
                    'architecture',
                    'model',
                    'platform',
                    'platformVersion',
                ]);
            });
            (0, expect_1.default)(uaData['architecture']).toBe('Mock1');
            (0, expect_1.default)(uaData['model']).toBe('Mockbook');
            (0, expect_1.default)(uaData['platform']).toBe('MockOS');
            (0, expect_1.default)(uaData['platformVersion']).toBe('3.1');
            (0, expect_1.default)(request.headers['user-agent']).toBe('MockBrowser');
        });
        it('should restore original', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const userAgent = await page.evaluate(() => {
                return navigator.userAgent;
            });
            await page.setUserAgent('foobar');
            const [requestWithOverride] = await Promise.all([
                server.waitForRequest('/empty.html'),
                page.goto(server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(requestWithOverride.headers['user-agent']).toBe('foobar');
            await page.setUserAgent('');
            const [request] = await Promise.all([
                server.waitForRequest('/empty.html'),
                page.goto(server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(request.headers['user-agent']).toBe(userAgent);
            const userAgentRestored = await page.evaluate(() => {
                return navigator.userAgent;
            });
            (0, expect_1.default)(userAgentRestored).toBe(userAgent);
        });
    });
    describe('Page.setContent', function () {
        const expectedOutput = '<html><head></head><body><div>hello</div></body></html>';
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>hello</div>');
            const result = await page.content();
            (0, expect_1.default)(result).toBe(expectedOutput);
        });
        it('should work with doctype', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const doctype = '<!DOCTYPE html>';
            await page.setContent(`${doctype}<div>hello</div>`);
            const result = await page.content();
            (0, expect_1.default)(result).toBe(`${doctype}${expectedOutput}`);
        });
        it('should work with HTML 4 doctype', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
                '"http://www.w3.org/TR/html4/strict.dtd">';
            await page.setContent(`${doctype}<div>hello</div>`);
            const result = await page.content();
            (0, expect_1.default)(result).toBe(`${doctype}${expectedOutput}`);
        });
        it('should respect timeout', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const imgPath = '/img.png';
            // stall for image
            server.setRoute(imgPath, () => { });
            let error;
            await page
                .setContent(`<img src="${server.PREFIX + imgPath}"></img>`, {
                timeout: 1,
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should respect default navigation timeout', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            page.setDefaultNavigationTimeout(1);
            const imgPath = '/img.png';
            // stall for image
            server.setRoute(imgPath, () => { });
            let error;
            await page
                .setContent(`<img src="${server.PREFIX + imgPath}"></img>`)
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should await resources to load', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const imgPath = '/img.png';
            let imgResponse;
            server.setRoute(imgPath, (_req, res) => {
                return (imgResponse = res);
            });
            let loaded = false;
            const contentPromise = page
                .setContent(`<img src="${server.PREFIX + imgPath}"></img>`)
                .then(() => {
                return (loaded = true);
            });
            await server.waitForRequest(imgPath);
            (0, expect_1.default)(loaded).toBe(false);
            imgResponse.end();
            await contentPromise;
        });
        it('should work fast enough', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            for (let i = 0; i < 20; ++i) {
                await page.setContent('<div>yo</div>');
            }
        });
        it('should work with tricky content', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>hello world</div>' + '\x7F');
            (0, expect_1.default)(await page.$eval('div', div => {
                return div.textContent;
            })).toBe('hello world');
        });
        it('should work with accents', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>aberración</div>');
            (0, expect_1.default)(await page.$eval('div', div => {
                return div.textContent;
            })).toBe('aberración');
        });
        it('should work with emojis', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>🐥</div>');
            (0, expect_1.default)(await page.$eval('div', div => {
                return div.textContent;
            })).toBe('🐥');
        });
        it('should work with newline', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>\n</div>');
            (0, expect_1.default)(await page.$eval('div', div => {
                return div.textContent;
            })).toBe('\n');
        });
        it('should work with comments outside HTML tag', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const comment = '<!-- Comment -->';
            await page.setContent(`${comment}<div>hello</div>`);
            const result = await page.content();
            (0, expect_1.default)(result).toBe(`${comment}${expectedOutput}`);
        });
    });
    describe('Page.setBypassCSP', function () {
        it('should bypass CSP meta tag', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Make sure CSP prohibits addScriptTag.
            await page.goto(server.PREFIX + '/csp.html');
            await page
                .addScriptTag({ content: 'window.__injected = 42;' })
                .catch(error => {
                return void error;
            });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.__injected;
            })).toBe(undefined);
            // By-pass CSP and try one more time.
            await page.setBypassCSP(true);
            await page.reload();
            await page.addScriptTag({ content: 'window.__injected = 42;' });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.__injected;
            })).toBe(42);
        });
        it('should bypass CSP header', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Make sure CSP prohibits addScriptTag.
            server.setCSP('/empty.html', 'default-src "self"');
            await page.goto(server.EMPTY_PAGE);
            await page
                .addScriptTag({ content: 'window.__injected = 42;' })
                .catch(error => {
                return void error;
            });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.__injected;
            })).toBe(undefined);
            // By-pass CSP and try one more time.
            await page.setBypassCSP(true);
            await page.reload();
            await page.addScriptTag({ content: 'window.__injected = 42;' });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.__injected;
            })).toBe(42);
        });
        it('should bypass after cross-process navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setBypassCSP(true);
            await page.goto(server.PREFIX + '/csp.html');
            await page.addScriptTag({ content: 'window.__injected = 42;' });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.__injected;
            })).toBe(42);
            await page.goto(server.CROSS_PROCESS_PREFIX + '/csp.html');
            await page.addScriptTag({ content: 'window.__injected = 42;' });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.__injected;
            })).toBe(42);
        });
        it('should bypass CSP in iframes as well', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            {
                // Make sure CSP prohibits addScriptTag in an iframe.
                const frame = (await (0, utils_js_1.attachFrame)(page, 'frame1', server.PREFIX + '/csp.html'));
                await frame
                    .addScriptTag({ content: 'window.__injected = 42;' })
                    .catch(error => {
                    return void error;
                });
                (0, expect_1.default)(await frame.evaluate(() => {
                    return globalThis.__injected;
                })).toBe(undefined);
            }
            // By-pass CSP and try one more time.
            await page.setBypassCSP(true);
            await page.reload();
            {
                const frame = (await (0, utils_js_1.attachFrame)(page, 'frame1', server.PREFIX + '/csp.html'));
                await frame
                    .addScriptTag({ content: 'window.__injected = 42;' })
                    .catch(error => {
                    return void error;
                });
                (0, expect_1.default)(await frame.evaluate(() => {
                    return globalThis.__injected;
                })).toBe(42);
            }
        });
    });
    describe('Page.addScriptTag', function () {
        it('should throw an error if no options are provided', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            try {
                // @ts-expect-error purposefully passing bad options
                await page.addScriptTag('/injectedfile.js');
            }
            catch (error_) {
                error = error_;
            }
            (0, expect_1.default)(error.message).toBe('Exactly one of `url`, `path`, or `content` must be specified.');
        });
        it('should work with a url', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const scriptHandle = __addDisposableResource(env_3, await page.addScriptTag({ url: '/injectedfile.js' }), false);
                (0, expect_1.default)(scriptHandle.asElement()).not.toBeNull();
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis.__injected;
                })).toBe(42);
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should work with a url and type=module', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.addScriptTag({ url: '/es6/es6import.js', type: 'module' });
            (0, expect_1.default)(await page.evaluate(() => {
                return window.__es6injected;
            })).toBe(42);
        });
        it('should work with a path and type=module', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.addScriptTag({
                path: path_1.default.join(__dirname, '../assets/es6/es6pathimport.js'),
                type: 'module',
            });
            await page.waitForFunction(() => {
                return window.__es6injected;
            });
            (0, expect_1.default)(await page.evaluate(() => {
                return window.__es6injected;
            })).toBe(42);
        });
        it('should work with a content and type=module', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.addScriptTag({
                content: `import num from '/es6/es6module.js';window.__es6injected = num;`,
                type: 'module',
            });
            await page.waitForFunction(() => {
                return window.__es6injected;
            });
            (0, expect_1.default)(await page.evaluate(() => {
                return window.__es6injected;
            })).toBe(42);
        });
        it('should throw an error if loading from url fail', async () => {
            const { page, server, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            let error;
            try {
                await page.addScriptTag({ url: '/nonexistfile.js' });
            }
            catch (error_) {
                error = error_;
            }
            if (isFirefox) {
                (0, expect_1.default)(error.message).toBeTruthy();
            }
            else {
                (0, expect_1.default)(error.message).toContain('Could not load script');
            }
        });
        it('should work with a path', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const scriptHandle = __addDisposableResource(env_4, await page.addScriptTag({
                    path: path_1.default.join(__dirname, '../assets/injectedfile.js'),
                }), false);
                (0, expect_1.default)(scriptHandle.asElement()).not.toBeNull();
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis.__injected;
                })).toBe(42);
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
        it('should include sourcemap when path is provided', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.addScriptTag({
                path: path_1.default.join(__dirname, '../assets/injectedfile.js'),
            });
            const result = await page.evaluate(() => {
                return globalThis.__injectedError.stack;
            });
            (0, expect_1.default)(result).toContain(path_1.default.join('assets', 'injectedfile.js'));
        });
        it('should work with content', async () => {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const scriptHandle = __addDisposableResource(env_5, await page.addScriptTag({
                    content: 'window.__injected = 35;',
                }), false);
                (0, expect_1.default)(scriptHandle.asElement()).not.toBeNull();
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis.__injected;
                })).toBe(35);
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        });
        it('should add id when provided', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.addScriptTag({ content: 'window.__injected = 1;', id: 'one' });
            await page.addScriptTag({ url: '/injectedfile.js', id: 'two' });
            (0, expect_1.default)(await page.$('#one')).not.toBeNull();
            (0, expect_1.default)(await page.$('#two')).not.toBeNull();
        });
        // @see https://github.com/puppeteer/puppeteer/issues/4840
        it('should throw when added with content to the CSP page', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/csp.html');
            let error;
            await page
                .addScriptTag({ content: 'window.__injected = 35;' })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
        });
        it('should throw when added with URL to the CSP page', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/csp.html');
            let error;
            await page
                .addScriptTag({ url: server.CROSS_PROCESS_PREFIX + '/injectedfile.js' })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
        });
    });
    describe('Page.addStyleTag', function () {
        it('should throw an error if no options are provided', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            try {
                // @ts-expect-error purposefully passing bad input
                await page.addStyleTag('/injectedstyle.css');
            }
            catch (error_) {
                error = error_;
            }
            (0, expect_1.default)(error.message).toBe('Exactly one of `url`, `path`, or `content` must be specified.');
        });
        it('should work with a url', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const styleHandle = __addDisposableResource(env_6, await page.addStyleTag({ url: '/injectedstyle.css' }), false);
                (0, expect_1.default)(styleHandle.asElement()).not.toBeNull();
                (0, expect_1.default)(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        });
        it('should throw an error if loading from url fail', async () => {
            const { page, server, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            let error;
            try {
                await page.addStyleTag({ url: '/nonexistfile.js' });
            }
            catch (error_) {
                error = error_;
            }
            if (isFirefox) {
                (0, expect_1.default)(error.message).toBeTruthy();
            }
            else {
                (0, expect_1.default)(error.message).toContain('Could not load style');
            }
        });
        it('should work with a path', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const styleHandle = __addDisposableResource(env_7, await page.addStyleTag({
                    path: path_1.default.join(__dirname, '../assets/injectedstyle.css'),
                }), false);
                (0, expect_1.default)(styleHandle.asElement()).not.toBeNull();
                (0, expect_1.default)(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
            }
            catch (e_7) {
                env_7.error = e_7;
                env_7.hasError = true;
            }
            finally {
                __disposeResources(env_7);
            }
        });
        it('should include sourcemap when path is provided', async () => {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                await page.addStyleTag({
                    path: path_1.default.join(__dirname, '../assets/injectedstyle.css'),
                });
                const styleHandle = __addDisposableResource(env_8, (await page.$('style')), false);
                const styleContent = await page.evaluate(style => {
                    return style.innerHTML;
                }, styleHandle);
                (0, expect_1.default)(styleContent).toContain(path_1.default.join('assets', 'injectedstyle.css'));
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        });
        it('should work with content', async () => {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const styleHandle = __addDisposableResource(env_9, await page.addStyleTag({
                    content: 'body { background-color: green; }',
                }), false);
                (0, expect_1.default)(styleHandle.asElement()).not.toBeNull();
                (0, expect_1.default)(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(0, 128, 0)');
            }
            catch (e_9) {
                env_9.error = e_9;
                env_9.hasError = true;
            }
            finally {
                __disposeResources(env_9);
            }
        });
        it('should throw when added with content to the CSP page', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/csp.html');
            let error;
            await page
                .addStyleTag({ content: 'body { background-color: green; }' })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
        });
        it('should throw when added with URL to the CSP page', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/csp.html');
            let error;
            await page
                .addStyleTag({
                url: server.CROSS_PROCESS_PREFIX + '/injectedstyle.css',
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
        });
    });
    describe('Page.url', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(page.url()).toBe('about:blank');
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(page.url()).toBe(server.EMPTY_PAGE);
        });
    });
    describe('Page.setJavaScriptEnabled', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setJavaScriptEnabled(false);
            await page.goto('data:text/html, <script>var something = "forbidden"</script>');
            let error;
            await page.evaluate('something').catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toContain('something is not defined');
            await page.setJavaScriptEnabled(true);
            await page.goto('data:text/html, <script>var something = "forbidden"</script>');
            (0, expect_1.default)(await page.evaluate('something')).toBe('forbidden');
        });
    });
    describe('Page.setCacheEnabled', function () {
        it('should enable or disable the cache based on the state passed', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/cached/one-style.html');
            const [cachedRequest] = await Promise.all([
                server.waitForRequest('/cached/one-style.html'),
                page.reload(),
            ]);
            // Rely on "if-modified-since" caching in our test server.
            (0, expect_1.default)(cachedRequest.headers['if-modified-since']).not.toBe(undefined);
            await page.setCacheEnabled(false);
            const [nonCachedRequest] = await Promise.all([
                server.waitForRequest('/cached/one-style.html'),
                page.reload(),
            ]);
            (0, expect_1.default)(nonCachedRequest.headers['if-modified-since']).toBe(undefined);
        });
        it('should stay disabled when toggling request interception on/off', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setCacheEnabled(false);
            await page.setRequestInterception(true);
            await page.setRequestInterception(false);
            await page.goto(server.PREFIX + '/cached/one-style.html');
            const [nonCachedRequest] = await Promise.all([
                server.waitForRequest('/cached/one-style.html'),
                page.reload(),
            ]);
            (0, expect_1.default)(nonCachedRequest.headers['if-modified-since']).toBe(undefined);
        });
    });
    describe('Page.pdf', function () {
        it('can print to PDF and save to file', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const outputFile = __dirname + '/../assets/output.pdf';
            await page.goto(server.PREFIX + '/pdf.html');
            await page.pdf({ path: outputFile });
            try {
                (0, expect_1.default)(fs_1.default.readFileSync(outputFile).byteLength).toBeGreaterThan(0);
            }
            finally {
                fs_1.default.unlinkSync(outputFile);
            }
        });
        it('can print to PDF and stream the result', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const stream = await page.createPDFStream();
            let size = 0;
            const reader = stream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                size += value.length;
            }
            (0, expect_1.default)(size).toBeGreaterThan(0);
        });
        it('should respect timeout', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/pdf.html');
            const error = await page.pdf({ timeout: 1 }).catch(err => {
                return err;
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
    });
    describe('Page.title', function () {
        it('should return the page title', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/title.html');
            (0, expect_1.default)(await page.title()).toBe('Woof-Woof');
        });
    });
    describe('Page.select', function () {
        it('should select single option', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.select('select', 'blue');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onInput;
            })).toEqual(['blue']);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onChange;
            })).toEqual(['blue']);
        });
        it('should select only first option', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.select('select', 'blue', 'green', 'red');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onInput;
            })).toEqual(['blue']);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onChange;
            })).toEqual(['blue']);
        });
        it('should not throw when select causes navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.$eval('select', select => {
                return select.addEventListener('input', () => {
                    return (window.location = '/empty.html');
                });
            });
            await Promise.all([
                page.select('select', 'blue'),
                page.waitForNavigation(),
            ]);
            (0, expect_1.default)(page.url()).toContain('empty.html');
        });
        it('should select multiple options', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.evaluate(() => {
                return globalThis.makeMultiple();
            });
            await page.select('select', 'blue', 'green', 'red');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onInput;
            })).toEqual(['blue', 'green', 'red']);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onChange;
            })).toEqual(['blue', 'green', 'red']);
        });
        it('should respect event bubbling', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.select('select', 'blue');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onBubblingInput;
            })).toEqual(['blue']);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onBubblingChange;
            })).toEqual(['blue']);
        });
        it('should throw when element is not a <select>', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.goto(server.PREFIX + '/input/select.html');
            await page.select('body', '').catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toContain('Element is not a <select> element.');
        });
        it('should return [] on no matched values', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            const result = await page.select('select', '42', 'abc');
            (0, expect_1.default)(result).toEqual([]);
        });
        it('should return an array of matched values', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.evaluate(() => {
                return globalThis.makeMultiple();
            });
            const result = await page.select('select', 'blue', 'black', 'magenta');
            (0, expect_1.default)(result.reduce((accumulator, current) => {
                return ['blue', 'black', 'magenta'].includes(current) && accumulator;
            }, true)).toEqual(true);
        });
        it('should return an array of one element when multiple is not set', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            const result = await page.select('select', '42', 'blue', 'black', 'magenta');
            (0, expect_1.default)(result).toHaveLength(1);
        });
        it('should return [] on no values', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            const result = await page.select('select');
            (0, expect_1.default)(result).toEqual([]);
        });
        it('should deselect all options when passed no values for a multiple select', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.evaluate(() => {
                return globalThis.makeMultiple();
            });
            await page.select('select', 'blue', 'black', 'magenta');
            await page.select('select');
            (0, expect_1.default)(await page.$eval('select', select => {
                return Array.from(select.options).every(option => {
                    return !option.selected;
                });
            })).toEqual(true);
        });
        it('should deselect all options when passed no values for a select without multiple', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.select('select', 'blue', 'black', 'magenta');
            await page.select('select');
            (0, expect_1.default)(await page.$eval('select', select => {
                return Array.from(select.options).filter(option => {
                    return option.selected;
                })[0].value;
            })).toEqual('');
        });
        it('should throw if passed in non-strings', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<select><option value="12"/></select>');
            let error;
            try {
                // @ts-expect-error purposefully passing bad input
                await page.select('select', 12);
            }
            catch (error_) {
                error = error_;
            }
            (0, expect_1.default)(error.message).toContain('Values must be strings');
        });
        // @see https://github.com/puppeteer/puppeteer/issues/3327
        it('should work when re-defining top-level Event class', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/select.html');
            await page.evaluate(() => {
                // @ts-expect-error Expected.
                return (window.Event = undefined);
            });
            await page.select('select', 'blue');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onInput;
            })).toEqual(['blue']);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.result.onChange;
            })).toEqual(['blue']);
        });
    });
    describe('Page.Events.Close', function () {
        it('should work with window.close', async () => {
            const { page, context } = await (0, mocha_utils_js_1.getTestState)();
            const newPagePromise = new Promise(fulfill => {
                return context.once('targetcreated', target => {
                    return fulfill(target.page());
                });
            });
            (0, assert_1.default)(page);
            await page.evaluate(() => {
                return (window['newPage'] = window.open('about:blank'));
            });
            const newPage = await newPagePromise;
            (0, assert_1.default)(newPage);
            const closedPromise = (0, utils_js_1.waitEvent)(newPage, 'close');
            await page.evaluate(() => {
                return window['newPage'].close();
            });
            await closedPromise;
        });
        it('should work with page.close', async () => {
            const { context } = await (0, mocha_utils_js_1.getTestState)();
            const newPage = await context.newPage();
            const closedPromise = (0, utils_js_1.waitEvent)(newPage, 'close');
            await newPage.close();
            await closedPromise;
        });
    });
    describe('Page.browser', function () {
        it('should return the correct browser instance', async () => {
            const { page, browser } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(page.browser()).toBe(browser);
        });
    });
    describe('Page.browserContext', function () {
        it('should return the correct browser context instance', async () => {
            const { page, context } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(page.browserContext()).toBe(context);
        });
    });
    describe('Page.client', function () {
        it('should return the client instance', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            (0, expect_1.default)(page._client()).toBeInstanceOf(CDPSession_js_1.CDPSession);
        });
    });
    describe('Page.bringToFront', function () {
        it('should work', async () => {
            const { context } = await (0, mocha_utils_js_1.getTestState)();
            const page1 = await context.newPage();
            const page2 = await context.newPage();
            await page1.bringToFront();
            (0, expect_1.default)(await page1.evaluate(() => {
                return document.visibilityState;
            })).toBe('visible');
            (0, expect_1.default)(await page2.evaluate(() => {
                return document.visibilityState;
            })).toBe('hidden');
            await page2.bringToFront();
            (0, expect_1.default)(await page1.evaluate(() => {
                return document.visibilityState;
            })).toBe('hidden');
            (0, expect_1.default)(await page2.evaluate(() => {
                return document.visibilityState;
            })).toBe('visible');
            await page1.close();
            await page2.close();
        });
    });
});
//# sourceMappingURL=page.spec.js.map