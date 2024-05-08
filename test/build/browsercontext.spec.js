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
const utils_js_1 = require("./utils.js");
describe('BrowserContext', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should have default context', async () => {
        const { browser } = await (0, mocha_utils_js_1.getTestState)({
            skipContextCreation: true,
        });
        (0, expect_1.default)(browser.browserContexts().length).toBeGreaterThanOrEqual(1);
        const defaultContext = browser.browserContexts().find(context => {
            return !context.isIncognito();
        });
        (0, expect_1.default)(defaultContext).toBeDefined();
        let error;
        await defaultContext.close().catch(error_ => {
            return (error = error_);
        });
        (0, expect_1.default)(browser.defaultBrowserContext()).toBe(defaultContext);
        (0, expect_1.default)(error.message).toContain('cannot be closed');
    });
    it('should create new incognito context', async () => {
        const { browser } = await (0, mocha_utils_js_1.getTestState)({
            skipContextCreation: true,
        });
        const contextCount = browser.browserContexts().length;
        (0, expect_1.default)(contextCount).toBeGreaterThanOrEqual(1);
        const context = await browser.createBrowserContext();
        (0, expect_1.default)(context.isIncognito()).toBe(true);
        (0, expect_1.default)(browser.browserContexts()).toHaveLength(contextCount + 1);
        (0, expect_1.default)(browser.browserContexts().indexOf(context) !== -1).toBe(true);
        await context.close();
        (0, expect_1.default)(browser.browserContexts()).toHaveLength(contextCount);
    });
    it('should close all belonging targets once closing context', async () => {
        const { browser } = await (0, mocha_utils_js_1.getTestState)({
            skipContextCreation: true,
        });
        (0, expect_1.default)(await browser.pages()).toHaveLength(1);
        const context = await browser.createBrowserContext();
        await context.newPage();
        (0, expect_1.default)(await browser.pages()).toHaveLength(2);
        (0, expect_1.default)(await context.pages()).toHaveLength(1);
        await context.close();
        (0, expect_1.default)(await browser.pages()).toHaveLength(1);
    });
    it('window.open should use parent tab context', async () => {
        const { browser, server, page, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        const [popupTarget] = await Promise.all([
            (0, utils_js_1.waitEvent)(browser, 'targetcreated'),
            page.evaluate(url => {
                return window.open(url);
            }, server.EMPTY_PAGE),
        ]);
        (0, expect_1.default)(popupTarget.browserContext()).toBe(context);
    });
    it('should fire target events', async () => {
        const { server, context } = await (0, mocha_utils_js_1.getTestState)();
        const events = [];
        context.on('targetcreated', target => {
            events.push('CREATED: ' + target.url());
        });
        context.on('targetchanged', target => {
            events.push('CHANGED: ' + target.url());
        });
        context.on('targetdestroyed', target => {
            events.push('DESTROYED: ' + target.url());
        });
        const page = await context.newPage();
        await page.goto(server.EMPTY_PAGE);
        await page.close();
        (0, expect_1.default)(events).toEqual([
            'CREATED: about:blank',
            `CHANGED: ${server.EMPTY_PAGE}`,
            `DESTROYED: ${server.EMPTY_PAGE}`,
        ]);
    });
    it('should wait for a target', async () => {
        const { server, context } = await (0, mocha_utils_js_1.getTestState)();
        let resolved = false;
        const targetPromise = context.waitForTarget(target => {
            return target.url() === server.EMPTY_PAGE;
        });
        targetPromise
            .then(() => {
            return (resolved = true);
        })
            .catch(error => {
            resolved = true;
            if (error instanceof puppeteer_1.TimeoutError) {
                console.error(error);
            }
            else {
                throw error;
            }
        });
        const page = await context.newPage();
        (0, expect_1.default)(resolved).toBe(false);
        await page.goto(server.EMPTY_PAGE);
        try {
            const target = await targetPromise;
            (0, expect_1.default)(await target.page()).toBe(page);
        }
        catch (error) {
            if (error instanceof puppeteer_1.TimeoutError) {
                console.error(error);
            }
            else {
                throw error;
            }
        }
    });
    it('should timeout waiting for a non-existent target', async () => {
        const { browser, server } = await (0, mocha_utils_js_1.getTestState)();
        const context = await browser.createBrowserContext();
        const error = await context
            .waitForTarget(target => {
            return target.url() === server.EMPTY_PAGE;
        }, {
            timeout: 1,
        })
            .catch(error_ => {
            return error_;
        });
        (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        await context.close();
    });
    it('should isolate localStorage and cookies', async () => {
        const { browser, server } = await (0, mocha_utils_js_1.getTestState)({
            skipContextCreation: true,
        });
        const contextCount = browser.browserContexts().length;
        // Create two incognito contexts.
        const context1 = await browser.createBrowserContext();
        const context2 = await browser.createBrowserContext();
        (0, expect_1.default)(context1.targets()).toHaveLength(0);
        (0, expect_1.default)(context2.targets()).toHaveLength(0);
        // Create a page in first incognito context.
        const page1 = await context1.newPage();
        await page1.goto(server.EMPTY_PAGE);
        await page1.evaluate(() => {
            localStorage.setItem('name', 'page1');
            document.cookie = 'name=page1';
        });
        (0, expect_1.default)(context1.targets()).toHaveLength(1);
        (0, expect_1.default)(context2.targets()).toHaveLength(0);
        // Create a page in second incognito context.
        const page2 = await context2.newPage();
        await page2.goto(server.EMPTY_PAGE);
        await page2.evaluate(() => {
            localStorage.setItem('name', 'page2');
            document.cookie = 'name=page2';
        });
        (0, expect_1.default)(context1.targets()).toHaveLength(1);
        (0, expect_1.default)(await context1.targets()[0]?.page()).toBe(page1);
        (0, expect_1.default)(context2.targets()).toHaveLength(1);
        (0, expect_1.default)(await context2.targets()[0]?.page()).toBe(page2);
        // Make sure pages don't share localstorage or cookies.
        (0, expect_1.default)(await page1.evaluate(() => {
            return localStorage.getItem('name');
        })).toBe('page1');
        (0, expect_1.default)(await page1.evaluate(() => {
            return document.cookie;
        })).toBe('name=page1');
        (0, expect_1.default)(await page2.evaluate(() => {
            return localStorage.getItem('name');
        })).toBe('page2');
        (0, expect_1.default)(await page2.evaluate(() => {
            return document.cookie;
        })).toBe('name=page2');
        // Cleanup contexts.
        await Promise.all([context1.close(), context2.close()]);
        (0, expect_1.default)(browser.browserContexts()).toHaveLength(contextCount);
    });
    it('should work across sessions', async () => {
        const { browser, puppeteer } = await (0, mocha_utils_js_1.getTestState)({
            skipContextCreation: true,
        });
        (0, expect_1.default)(browser.browserContexts()).toHaveLength(1);
        const context = await browser.createBrowserContext();
        try {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                (0, expect_1.default)(browser.browserContexts()).toHaveLength(2);
                const remoteBrowser = __addDisposableResource(env_1, await puppeteer.connect({
                    browserWSEndpoint: browser.wsEndpoint(),
                    protocol: browser.protocol,
                }), false);
                const contexts = remoteBrowser.browserContexts();
                (0, expect_1.default)(contexts).toHaveLength(2);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        }
        finally {
            await context.close();
        }
    });
    it('should provide a context id', async () => {
        const { browser } = await (0, mocha_utils_js_1.getTestState)({
            skipContextCreation: true,
        });
        const contextCount = browser.browserContexts().length;
        (0, expect_1.default)(contextCount).toBeGreaterThanOrEqual(1);
        const context = await browser.createBrowserContext();
        (0, expect_1.default)(browser.browserContexts()).toHaveLength(contextCount + 1);
        (0, expect_1.default)(context.id).toBeDefined();
        await context.close();
    });
    describe('BrowserContext.overridePermissions', function () {
        function getPermission(page, name) {
            return page.evaluate(name => {
                return navigator.permissions.query({ name }).then(result => {
                    return result.state;
                });
            }, name);
        }
        it('should be prompt by default', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('prompt');
        });
        it('should deny permission when not listed', async () => {
            const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await context.overridePermissions(server.EMPTY_PAGE, []);
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('denied');
        });
        it('should fail when bad permission is given', async () => {
            const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            let error;
            await context
                // @ts-expect-error purposeful bad input for test
                .overridePermissions(server.EMPTY_PAGE, ['foo'])
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Unknown permission: foo');
        });
        it('should grant permission when listed', async () => {
            const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('granted');
        });
        it('should reset permissions', async () => {
            const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('granted');
            await context.clearPermissionOverrides();
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('prompt');
        });
        it('should trigger permission onchange', async () => {
            const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.evaluate(() => {
                globalThis.events = [];
                return navigator.permissions
                    .query({ name: 'geolocation' })
                    .then(function (result) {
                    globalThis.events.push(result.state);
                    result.onchange = function () {
                        globalThis.events.push(result.state);
                    };
                });
            });
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.events;
            })).toEqual(['prompt']);
            await context.overridePermissions(server.EMPTY_PAGE, []);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.events;
            })).toEqual(['prompt', 'denied']);
            await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.events;
            })).toEqual(['prompt', 'denied', 'granted']);
            await context.clearPermissionOverrides();
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.events;
            })).toEqual(['prompt', 'denied', 'granted', 'prompt']);
        });
        it('should isolate permissions between browser contexts', async () => {
            const { page, server, context, browser } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const otherContext = await browser.createBrowserContext();
            const otherPage = await otherContext.newPage();
            await otherPage.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('prompt');
            (0, expect_1.default)(await getPermission(otherPage, 'geolocation')).toBe('prompt');
            await context.overridePermissions(server.EMPTY_PAGE, []);
            await otherContext.overridePermissions(server.EMPTY_PAGE, [
                'geolocation',
            ]);
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('denied');
            (0, expect_1.default)(await getPermission(otherPage, 'geolocation')).toBe('granted');
            await context.clearPermissionOverrides();
            (0, expect_1.default)(await getPermission(page, 'geolocation')).toBe('prompt');
            (0, expect_1.default)(await getPermission(otherPage, 'geolocation')).toBe('granted');
            await otherContext.close();
        });
        it('should grant persistent-storage', async () => {
            const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(await getPermission(page, 'persistent-storage')).not.toBe('granted');
            await context.overridePermissions(server.EMPTY_PAGE, [
                'persistent-storage',
            ]);
            (0, expect_1.default)(await getPermission(page, 'persistent-storage')).toBe('granted');
        });
    });
});
//# sourceMappingURL=browsercontext.spec.js.map