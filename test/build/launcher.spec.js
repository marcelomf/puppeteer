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
const promises_1 = require("fs/promises");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const puppeteer_1 = require("puppeteer");
const fs_js_1 = require("puppeteer-core/internal/node/util/fs.js");
const sinon_1 = __importDefault(require("sinon"));
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
const TMP_FOLDER = path_1.default.join(os_1.default.tmpdir(), 'pptr_tmp_folder-');
const FIREFOX_TIMEOUT = 30000;
describe('Launcher specs', function () {
    this.timeout(FIREFOX_TIMEOUT);
    describe('Puppeteer', function () {
        describe('Browser.disconnect', function () {
            it('should reject navigation when browser closes', async () => {
                const { browser, close, puppeteer, server } = await (0, mocha_utils_js_1.launch)({});
                server.setRoute('/one-style.css', () => { });
                try {
                    const env_1 = { stack: [], error: void 0, hasError: false };
                    try {
                        const remote = __addDisposableResource(env_1, await puppeteer.connect({
                            browserWSEndpoint: browser.wsEndpoint(),
                            protocol: browser.protocol,
                        }), false);
                        const page = await remote.newPage();
                        const navigationPromise = page
                            .goto(server.PREFIX + '/one-style.html', { timeout: 60000 })
                            .catch(error_ => {
                            return error_;
                        });
                        await server.waitForRequest('/one-style.css');
                        await remote.disconnect();
                        const error = await navigationPromise;
                        (0, expect_1.default)([
                            'Navigating frame was detached',
                            'Protocol error (Page.navigate): Target closed.',
                            'Protocol error (browsingContext.navigate): Target closed',
                        ].some(message => {
                            return error.message.startsWith(message);
                        })).toBeTruthy();
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
                    await close();
                }
            });
            it('should reject waitForSelector when browser closes', async () => {
                const { browser, close, server, puppeteer } = await (0, mocha_utils_js_1.launch)({});
                server.setRoute('/empty.html', () => { });
                try {
                    const env_2 = { stack: [], error: void 0, hasError: false };
                    try {
                        const remote = __addDisposableResource(env_2, await puppeteer.connect({
                            browserWSEndpoint: browser.wsEndpoint(),
                            protocol: browser.protocol,
                        }), false);
                        const page = await remote.newPage();
                        const watchdog = page
                            .waitForSelector('div', { timeout: 60000 })
                            .catch(error_ => {
                            return error_;
                        });
                        await remote.disconnect();
                        const error = await watchdog;
                        (0, expect_1.default)(error.message).toContain('Waiting for selector `div` failed: waitForFunction failed: frame got detached.');
                    }
                    catch (e_2) {
                        env_2.error = e_2;
                        env_2.hasError = true;
                    }
                    finally {
                        __disposeResources(env_2);
                    }
                }
                finally {
                    await close();
                }
            });
        });
        describe('Browser.close', function () {
            it('should terminate network waiters', async () => {
                const { browser, close, server, puppeteer } = await (0, mocha_utils_js_1.launch)({});
                try {
                    const env_3 = { stack: [], error: void 0, hasError: false };
                    try {
                        const remote = __addDisposableResource(env_3, await puppeteer.connect({
                            browserWSEndpoint: browser.wsEndpoint(),
                            protocol: browser.protocol,
                        }), false);
                        const newPage = await remote.newPage();
                        const results = await Promise.all([
                            newPage.waitForRequest(server.EMPTY_PAGE).catch(error => {
                                return error;
                            }),
                            newPage.waitForResponse(server.EMPTY_PAGE).catch(error => {
                                return error;
                            }),
                            browser.close(),
                        ]);
                        for (let i = 0; i < 2; i++) {
                            const message = results[i].message;
                            (0, expect_1.default)(message).atLeastOneToContain([
                                'Target closed',
                                'Page closed!',
                                'Browser already closed',
                            ]);
                            (0, expect_1.default)(message).not.toContain('Timeout');
                        }
                    }
                    catch (e_3) {
                        env_3.error = e_3;
                        env_3.hasError = true;
                    }
                    finally {
                        __disposeResources(env_3);
                    }
                }
                finally {
                    await close();
                }
            });
        });
        describe('Puppeteer.launch', function () {
            it('can launch and close the browser', async () => {
                const { close } = await (0, mocha_utils_js_1.launch)({});
                await close();
            });
            it('can launch multiple instances without node warnings', async () => {
                const instances = [];
                let warning;
                const warningHandler = w => {
                    warning = w;
                };
                process.on('warning', warningHandler);
                process.setMaxListeners(1);
                try {
                    for (let i = 0; i < 2; i++) {
                        instances.push((0, mocha_utils_js_1.launch)({}));
                    }
                    await Promise.all((await Promise.all(instances)).map(instance => {
                        return instance.close();
                    }));
                }
                finally {
                    process.setMaxListeners(10);
                }
                process.off('warning', warningHandler);
                (0, expect_1.default)(warning?.stack).toBe(undefined);
            });
            it('should have default url when launching browser', async function () {
                const { browser, close } = await (0, mocha_utils_js_1.launch)({}, { createContext: false });
                try {
                    const pages = (await browser.pages()).map((page) => {
                        return page.url();
                    });
                    (0, expect_1.default)(pages).toEqual(['about:blank']);
                }
                finally {
                    await close();
                }
            });
            it('should close browser with beforeunload page', async () => {
                const { browser, server, close } = await (0, mocha_utils_js_1.launch)({}, { createContext: false });
                try {
                    const page = await browser.newPage();
                    await page.goto(server.PREFIX + '/beforeunload.html');
                    // We have to interact with a page so that 'beforeunload' handlers
                    // fire.
                    await page.click('body');
                }
                finally {
                    await close();
                }
            });
            it('should reject all promises when browser is closed', async () => {
                const { page, close } = await (0, mocha_utils_js_1.launch)({});
                let error;
                const neverResolves = page
                    .evaluate(() => {
                    return new Promise(() => { });
                })
                    .catch(error_ => {
                    return (error = error_);
                });
                await close();
                await neverResolves;
                (0, expect_1.default)(error.message).toContain('Protocol error');
            });
            it('should reject if executable path is invalid', async () => {
                let waitError;
                await (0, mocha_utils_js_1.launch)({
                    executablePath: 'random-invalid-path',
                }).catch(error => {
                    return (waitError = error);
                });
                (0, expect_1.default)(waitError.message).toBe('Browser was not found at the configured executablePath (random-invalid-path)');
            });
            it('userDataDir option', async () => {
                const userDataDir = await (0, promises_1.mkdtemp)(TMP_FOLDER);
                const { context, close } = await (0, mocha_utils_js_1.launch)({ userDataDir });
                // Open a page to make sure its functional.
                try {
                    await context.newPage();
                    (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                }
                finally {
                    await close();
                }
                (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
                try {
                    (0, fs_js_1.rmSync)(userDataDir);
                }
                catch { }
            });
            it('tmp profile should be cleaned up', async () => {
                const { puppeteer } = await (0, mocha_utils_js_1.getTestState)({ skipLaunch: true });
                // Set a custom test tmp dir so that we can validate that
                // the profile dir is created and then cleaned up.
                const testTmpDir = await fs_1.default.promises.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'puppeteer_test_chrome_profile-'));
                const oldTmpDir = puppeteer.configuration.temporaryDirectory;
                puppeteer.configuration.temporaryDirectory = testTmpDir;
                // Path should be empty before starting the browser.
                (0, expect_1.default)(fs_1.default.readdirSync(testTmpDir)).toHaveLength(0);
                const { context, close } = await (0, mocha_utils_js_1.launch)({});
                try {
                    // One profile folder should have been created at this moment.
                    const profiles = fs_1.default.readdirSync(testTmpDir);
                    (0, expect_1.default)(profiles).toHaveLength(1);
                    (0, expect_1.default)(profiles[0]?.startsWith('puppeteer_dev_chrome_profile-')).toBe(true);
                    // Open a page to make sure its functional.
                    await context.newPage();
                }
                finally {
                    await close();
                }
                // Profile should be deleted after closing the browser
                (0, expect_1.default)(fs_1.default.readdirSync(testTmpDir)).toHaveLength(0);
                // Restore env var
                puppeteer.configuration.temporaryDirectory = oldTmpDir;
            });
            it('userDataDir option restores preferences', async () => {
                const userDataDir = await (0, promises_1.mkdtemp)(TMP_FOLDER);
                const prefsJSPath = path_1.default.join(userDataDir, 'prefs.js');
                const prefsJSContent = 'user_pref("browser.warnOnQuit", true)';
                await (0, promises_1.writeFile)(prefsJSPath, prefsJSContent);
                const { context, close } = await (0, mocha_utils_js_1.launch)({ userDataDir });
                try {
                    // Open a page to make sure its functional.
                    await context.newPage();
                    (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                    await close();
                    (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                    (0, expect_1.default)(await (0, promises_1.readFile)(prefsJSPath, 'utf8')).toBe(prefsJSContent);
                }
                finally {
                    await close();
                }
                // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
                try {
                    (0, fs_js_1.rmSync)(userDataDir);
                }
                catch { }
            });
            it('userDataDir argument', async () => {
                const { isChrome, defaultBrowserOptions: options } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                const userDataDir = await (0, promises_1.mkdtemp)(TMP_FOLDER);
                if (isChrome) {
                    options.args = [
                        ...(options.args || []),
                        `--user-data-dir=${userDataDir}`,
                    ];
                }
                else {
                    options.args = [...(options.args || []), '-profile', userDataDir];
                }
                const { close } = await (0, mocha_utils_js_1.launch)(options);
                (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                await close();
                (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
                try {
                    (0, fs_js_1.rmSync)(userDataDir);
                }
                catch { }
            });
            it('userDataDir argument with non-existent dir', async () => {
                const { isChrome, defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                const userDataDir = await (0, promises_1.mkdtemp)(TMP_FOLDER);
                (0, fs_js_1.rmSync)(userDataDir);
                const options = Object.assign({}, defaultBrowserOptions);
                if (isChrome) {
                    options.args = [
                        ...(defaultBrowserOptions.args || []),
                        `--user-data-dir=${userDataDir}`,
                    ];
                }
                else {
                    options.args = [
                        ...(defaultBrowserOptions.args || []),
                        '-profile',
                        userDataDir,
                    ];
                }
                const { close } = await (0, mocha_utils_js_1.launch)(options);
                (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                await close();
                (0, expect_1.default)(fs_1.default.readdirSync(userDataDir).length).toBeGreaterThan(0);
                // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
                try {
                    (0, fs_js_1.rmSync)(userDataDir);
                }
                catch { }
            });
            it('userDataDir option should restore state', async () => {
                const userDataDir = await (0, promises_1.mkdtemp)(TMP_FOLDER);
                const { server, browser, close } = await (0, mocha_utils_js_1.launch)({ userDataDir });
                try {
                    const page = await browser.newPage();
                    await page.goto(server.EMPTY_PAGE);
                    await page.evaluate(() => {
                        return (localStorage['hey'] = 'hello');
                    });
                }
                finally {
                    await close();
                }
                const { browser: browser2, close: close2 } = await (0, mocha_utils_js_1.launch)({ userDataDir });
                try {
                    const page2 = await browser2.newPage();
                    await page2.goto(server.EMPTY_PAGE);
                    (0, expect_1.default)(await page2.evaluate(() => {
                        return localStorage['hey'];
                    })).toBe('hello');
                }
                finally {
                    await close2();
                }
                // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
                try {
                    (0, fs_js_1.rmSync)(userDataDir);
                }
                catch { }
            });
            it('userDataDir option should restore cookies', async () => {
                const userDataDir = await (0, promises_1.mkdtemp)(TMP_FOLDER);
                const { server, browser, close } = await (0, mocha_utils_js_1.launch)({ userDataDir });
                try {
                    const page = await browser.newPage();
                    await page.goto(server.EMPTY_PAGE);
                    await page.evaluate(() => {
                        return (document.cookie =
                            'doSomethingOnlyOnce=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
                    });
                }
                finally {
                    await close();
                }
                const { browser: browser2, close: close2 } = await (0, mocha_utils_js_1.launch)({ userDataDir });
                try {
                    const page2 = await browser2.newPage();
                    await page2.goto(server.EMPTY_PAGE);
                    (0, expect_1.default)(await page2.evaluate(() => {
                        return document.cookie;
                    })).toBe('doSomethingOnlyOnce=true');
                }
                finally {
                    await close2();
                }
                // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
                try {
                    (0, fs_js_1.rmSync)(userDataDir);
                }
                catch { }
            });
            it('should return the default arguments', async () => {
                const { isChrome, isFirefox, puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                if (isChrome) {
                    (0, expect_1.default)(puppeteer.defaultArgs()).toContain('--no-first-run');
                    (0, expect_1.default)(puppeteer.defaultArgs()).toContain('--headless=new');
                    (0, expect_1.default)(puppeteer.defaultArgs({ headless: false })).not.toContain('--headless=new');
                    (0, expect_1.default)(puppeteer.defaultArgs({ userDataDir: 'foo' })).toContain(`--user-data-dir=${path_1.default.resolve('foo')}`);
                }
                else if (isFirefox) {
                    (0, expect_1.default)(puppeteer.defaultArgs()).toContain('--headless');
                    (0, expect_1.default)(puppeteer.defaultArgs()).toContain('--no-remote');
                    if (os_1.default.platform() === 'darwin') {
                        (0, expect_1.default)(puppeteer.defaultArgs()).toContain('--foreground');
                    }
                    else {
                        (0, expect_1.default)(puppeteer.defaultArgs()).not.toContain('--foreground');
                    }
                    (0, expect_1.default)(puppeteer.defaultArgs({ headless: false })).not.toContain('--headless');
                    (0, expect_1.default)(puppeteer.defaultArgs({ userDataDir: 'foo' })).toContain('--profile');
                    (0, expect_1.default)(puppeteer.defaultArgs({ userDataDir: 'foo' })).toContain('foo');
                }
                else {
                    (0, expect_1.default)(puppeteer.defaultArgs()).toContain('-headless');
                    (0, expect_1.default)(puppeteer.defaultArgs({ headless: false })).not.toContain('-headless');
                    (0, expect_1.default)(puppeteer.defaultArgs({ userDataDir: 'foo' })).toContain('-profile');
                    (0, expect_1.default)(puppeteer.defaultArgs({ userDataDir: 'foo' })).toContain(path_1.default.resolve('foo'));
                }
            });
            it('should report the correct product', async () => {
                const { isChrome, isFirefox, puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                if (isChrome) {
                    (0, expect_1.default)(puppeteer.product).toBe('chrome');
                }
                else if (isFirefox) {
                    (0, expect_1.default)(puppeteer.product).toBe('firefox');
                }
            });
            it('should work with no default arguments', async () => {
                const { context, close } = await (0, mocha_utils_js_1.launch)({
                    ignoreDefaultArgs: true,
                });
                try {
                    const page = await context.newPage();
                    (0, expect_1.default)(await page.evaluate('11 * 11')).toBe(121);
                    await page.close();
                }
                finally {
                    await close();
                }
            });
            it('should filter out ignored default arguments in Chrome', async () => {
                const { defaultBrowserOptions, puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                // Make sure we launch with `--enable-automation` by default.
                const defaultArgs = puppeteer.defaultArgs();
                const { browser, close } = await (0, mocha_utils_js_1.launch)(Object.assign({}, defaultBrowserOptions, {
                    // Ignore first and third default argument.
                    ignoreDefaultArgs: [defaultArgs[0], defaultArgs[2]],
                }));
                try {
                    const spawnargs = browser.process().spawnargs;
                    if (!spawnargs) {
                        throw new Error('spawnargs not present');
                    }
                    (0, expect_1.default)(spawnargs.indexOf(defaultArgs[0])).toBe(-1);
                    (0, expect_1.default)(spawnargs.indexOf(defaultArgs[1])).not.toBe(-1);
                    (0, expect_1.default)(spawnargs.indexOf(defaultArgs[2])).toBe(-1);
                }
                finally {
                    await close();
                }
            });
            it('should filter out ignored default argument in Firefox', async () => {
                const { defaultBrowserOptions, puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                const defaultArgs = puppeteer.defaultArgs();
                const { browser, close } = await (0, mocha_utils_js_1.launch)(Object.assign({}, defaultBrowserOptions, {
                    // Only the first argument is fixed, others are optional.
                    ignoreDefaultArgs: [defaultArgs[0]],
                }));
                try {
                    const spawnargs = browser.process().spawnargs;
                    if (!spawnargs) {
                        throw new Error('spawnargs not present');
                    }
                    (0, expect_1.default)(spawnargs.indexOf(defaultArgs[0])).toBe(-1);
                    (0, expect_1.default)(spawnargs.indexOf(defaultArgs[1])).not.toBe(-1);
                }
                finally {
                    await close();
                }
            });
            it('should have default URL when launching browser', async function () {
                const { browser, close } = await (0, mocha_utils_js_1.launch)({}, {
                    createContext: false,
                });
                try {
                    const pages = (await browser.pages()).map(page => {
                        return page.url();
                    });
                    (0, expect_1.default)(pages).toEqual(['about:blank']);
                }
                finally {
                    await close();
                }
            });
            it('should have custom URL when launching browser', async () => {
                const { server, defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                const options = Object.assign({}, defaultBrowserOptions);
                options.args = [server.EMPTY_PAGE].concat(options.args || []);
                const { browser, close } = await (0, mocha_utils_js_1.launch)(options, {
                    createContext: false,
                });
                try {
                    const pages = await browser.pages();
                    (0, expect_1.default)(pages).toHaveLength(1);
                    const page = pages[0];
                    if (page.url() !== server.EMPTY_PAGE) {
                        await page.waitForNavigation();
                    }
                    (0, expect_1.default)(page.url()).toBe(server.EMPTY_PAGE);
                }
                finally {
                    await close();
                }
            });
            it('should pass the timeout parameter to browser.waitForTarget', async () => {
                let error;
                await (0, mocha_utils_js_1.launch)({
                    timeout: 1,
                }).catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
            });
            it('should work with timeout = 0', async () => {
                const { close } = await (0, mocha_utils_js_1.launch)({
                    timeout: 0,
                });
                await close();
            });
            it('should set the default viewport', async () => {
                const { context, close } = await (0, mocha_utils_js_1.launch)({
                    defaultViewport: {
                        width: 456,
                        height: 789,
                    },
                });
                try {
                    const page = await context.newPage();
                    (0, expect_1.default)(await page.evaluate('window.innerWidth')).toBe(456);
                    (0, expect_1.default)(await page.evaluate('window.innerHeight')).toBe(789);
                }
                finally {
                    await close();
                }
            });
            it('should disable the default viewport', async () => {
                const { context, close } = await (0, mocha_utils_js_1.launch)({
                    defaultViewport: null,
                });
                try {
                    const page = await context.newPage();
                    (0, expect_1.default)(page.viewport()).toBe(null);
                }
                finally {
                    await close();
                }
            });
            it('should take fullPage screenshots when defaultViewport is null', async () => {
                const { server, context, close } = await (0, mocha_utils_js_1.launch)({
                    defaultViewport: null,
                });
                try {
                    const page = await context.newPage();
                    await page.goto(server.PREFIX + '/grid.html');
                    const screenshot = await page.screenshot({
                        fullPage: true,
                    });
                    (0, expect_1.default)(screenshot).toBeInstanceOf(Buffer);
                }
                finally {
                    await close();
                }
            });
            it('should set the debugging port', async () => {
                const { browser, close } = await (0, mocha_utils_js_1.launch)({
                    defaultViewport: null,
                    debuggingPort: 9999,
                });
                try {
                    const url = new URL(browser.wsEndpoint());
                    (0, expect_1.default)(url.port).toBe('9999');
                }
                finally {
                    await close();
                }
            });
            it('should not allow setting debuggingPort and pipe', async () => {
                const options = {
                    defaultViewport: null,
                    debuggingPort: 9999,
                    pipe: true,
                };
                let error;
                await (0, mocha_utils_js_1.launch)(options).catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error.message).toContain('either pipe or debugging port');
            });
            it('throws an error if executable path is not valid with pipe=true', async () => {
                const options = {
                    executablePath: '/tmp/does-not-exist',
                    pipe: true,
                };
                let error;
                await (0, mocha_utils_js_1.launch)(options).catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error.message).toContain('Browser was not found at the configured executablePath (/tmp/does-not-exist)');
            });
        });
        describe('Puppeteer.launch', function () {
            it('should be able to launch Chrome', async () => {
                const { browser, close } = await (0, mocha_utils_js_1.launch)({ product: 'chrome' });
                try {
                    const userAgent = await browser.userAgent();
                    (0, expect_1.default)(userAgent).toContain('Chrome');
                }
                finally {
                    await close();
                }
            });
            it('should be able to launch Firefox', async function () {
                this.timeout(FIREFOX_TIMEOUT);
                const { browser, close } = await (0, mocha_utils_js_1.launch)({ product: 'firefox' });
                try {
                    const userAgent = await browser.userAgent();
                    (0, expect_1.default)(userAgent).toContain('Firefox');
                }
                finally {
                    await close();
                }
            });
        });
        describe('Puppeteer.connect', function () {
            it('should be able to connect multiple times to the same browser', async () => {
                const { puppeteer, browser, close } = await (0, mocha_utils_js_1.launch)({});
                try {
                    const env_4 = { stack: [], error: void 0, hasError: false };
                    try {
                        const otherBrowser = __addDisposableResource(env_4, await puppeteer.connect({
                            browserWSEndpoint: browser.wsEndpoint(),
                            protocol: browser.protocol,
                        }), false);
                        const page = await otherBrowser.newPage();
                        (0, expect_1.default)(await page.evaluate(() => {
                            return 7 * 8;
                        })).toBe(56);
                        await otherBrowser.disconnect();
                        const secondPage = await browser.newPage();
                        (0, expect_1.default)(await secondPage.evaluate(() => {
                            return 7 * 6;
                        })).toBe(42);
                    }
                    catch (e_4) {
                        env_4.error = e_4;
                        env_4.hasError = true;
                    }
                    finally {
                        __disposeResources(env_4);
                    }
                }
                finally {
                    await close();
                }
            });
            it('should be able to close remote browser', async () => {
                const { puppeteer, browser, close } = await (0, mocha_utils_js_1.launch)({});
                try {
                    const env_5 = { stack: [], error: void 0, hasError: false };
                    try {
                        const remoteBrowser = __addDisposableResource(env_5, await puppeteer.connect({
                            browserWSEndpoint: browser.wsEndpoint(),
                            protocol: browser.protocol,
                        }), false);
                        await Promise.all([
                            (0, utils_js_1.waitEvent)(browser, 'disconnected'),
                            remoteBrowser.close(),
                        ]);
                    }
                    catch (e_5) {
                        env_5.error = e_5;
                        env_5.hasError = true;
                    }
                    finally {
                        __disposeResources(env_5);
                    }
                }
                finally {
                    await close();
                }
            });
            it('should be able to connect to a browser with no page targets', async () => {
                const { puppeteer, browser, close } = await (0, mocha_utils_js_1.launch)({});
                try {
                    const env_6 = { stack: [], error: void 0, hasError: false };
                    try {
                        const pages = await browser.pages();
                        await Promise.all(pages.map(page => {
                            return page.close();
                        }));
                        const remoteBrowser = __addDisposableResource(env_6, await puppeteer.connect({
                            browserWSEndpoint: browser.wsEndpoint(),
                            protocol: browser.protocol,
                        }), false);
                        await Promise.all([
                            (0, utils_js_1.waitEvent)(browser, 'disconnected'),
                            remoteBrowser.close(),
                        ]);
                    }
                    catch (e_6) {
                        env_6.error = e_6;
                        env_6.hasError = true;
                    }
                    finally {
                        __disposeResources(env_6);
                    }
                }
                finally {
                    await close();
                }
            });
            it('should support ignoreHTTPSErrors option', async () => {
                const { puppeteer, httpsServer, browser, close } = await (0, mocha_utils_js_1.launch)({}, {
                    createContext: false,
                });
                try {
                    const env_7 = { stack: [], error: void 0, hasError: false };
                    try {
                        const browserWSEndpoint = browser.wsEndpoint();
                        const remoteBrowser = __addDisposableResource(env_7, await puppeteer.connect({
                            browserWSEndpoint,
                            ignoreHTTPSErrors: true,
                            protocol: browser.protocol,
                        }), false);
                        const page = await remoteBrowser.newPage();
                        const [serverRequest, response] = await Promise.all([
                            httpsServer.waitForRequest('/empty.html'),
                            page.goto(httpsServer.EMPTY_PAGE),
                        ]);
                        (0, expect_1.default)(response.ok()).toBe(true);
                        (0, expect_1.default)(response.securityDetails()).toBeTruthy();
                        const protocol = serverRequest.socket
                            .getProtocol()
                            .replace('v', ' ');
                        (0, expect_1.default)(response.securityDetails().protocol()).toBe(protocol);
                        await page.close();
                    }
                    catch (e_7) {
                        env_7.error = e_7;
                        env_7.hasError = true;
                    }
                    finally {
                        __disposeResources(env_7);
                    }
                }
                finally {
                    await close();
                }
            });
            it('should support targetFilter option in puppeteer.launch', async () => {
                const { browser, close } = await (0, mocha_utils_js_1.launch)({
                    targetFilter: target => {
                        return target.type() !== 'page';
                    },
                    waitForInitialPage: false,
                }, { createContext: false });
                try {
                    const targets = browser.targets();
                    (0, expect_1.default)(targets).toHaveLength(1);
                    (0, expect_1.default)(targets.find(target => {
                        return target.type() === 'page';
                    })).toBeUndefined();
                }
                finally {
                    await close();
                }
            });
            // @see https://github.com/puppeteer/puppeteer/issues/4197
            it('should support targetFilter option', async () => {
                const { puppeteer, server, browser, close } = await (0, mocha_utils_js_1.launch)({}, {
                    createContext: false,
                });
                try {
                    const env_8 = { stack: [], error: void 0, hasError: false };
                    try {
                        const browserWSEndpoint = browser.wsEndpoint();
                        const page1 = await browser.newPage();
                        await page1.goto(server.EMPTY_PAGE);
                        const page2 = await browser.newPage();
                        await page2.goto(server.EMPTY_PAGE + '?should-be-ignored');
                        const remoteBrowser = __addDisposableResource(env_8, await puppeteer.connect({
                            browserWSEndpoint,
                            targetFilter: target => {
                                return !target.url().includes('should-be-ignored');
                            },
                            protocol: browser.protocol,
                        }), false);
                        const pages = await remoteBrowser.pages();
                        (0, expect_1.default)(pages
                            .map((p) => {
                            return p.url();
                        })
                            .sort()).toEqual(['about:blank', server.EMPTY_PAGE]);
                        await page2.close();
                        await page1.close();
                        await remoteBrowser.disconnect();
                        await browser.close();
                    }
                    catch (e_8) {
                        env_8.error = e_8;
                        env_8.hasError = true;
                    }
                    finally {
                        __disposeResources(env_8);
                    }
                }
                finally {
                    await close();
                }
            });
            it('should be able to reconnect to a disconnected browser', async () => {
                const { puppeteer, server, browser, close } = await (0, mocha_utils_js_1.launch)({});
                // Connection is closed on the original one
                let remoteClose;
                try {
                    const browserWSEndpoint = browser.wsEndpoint();
                    const page = await browser.newPage();
                    await page.goto(server.PREFIX + '/frames/nested-frames.html');
                    await browser.disconnect();
                    const remoteBrowser = await puppeteer.connect({
                        browserWSEndpoint,
                        protocol: browser.protocol,
                    });
                    remoteClose = remoteBrowser.close.bind(remoteBrowser);
                    console.log(remoteClose);
                    const pages = await remoteBrowser.pages();
                    const restoredPage = pages.find(page => {
                        return page.url() === server.PREFIX + '/frames/nested-frames.html';
                    });
                    (0, expect_1.default)(await (0, utils_js_1.dumpFrames)(restoredPage.mainFrame())).toEqual([
                        'http://localhost:<PORT>/frames/nested-frames.html',
                        '    http://localhost:<PORT>/frames/two-frames.html (2frames)',
                        '        http://localhost:<PORT>/frames/frame.html (uno)',
                        '        http://localhost:<PORT>/frames/frame.html (dos)',
                        '    http://localhost:<PORT>/frames/frame.html (aframe)',
                    ]);
                    (0, expect_1.default)(await restoredPage.evaluate(() => {
                        return 7 * 8;
                    })).toBe(56);
                }
                finally {
                    await remoteClose();
                    await close();
                }
            });
            // @see https://github.com/puppeteer/puppeteer/issues/4197#issuecomment-481793410
            it('should be able to connect to the same page simultaneously', async () => {
                const { puppeteer, browser: browserOne, close } = await (0, mocha_utils_js_1.launch)({});
                try {
                    const env_9 = { stack: [], error: void 0, hasError: false };
                    try {
                        const browserTwo = __addDisposableResource(env_9, await puppeteer.connect({
                            browserWSEndpoint: browserOne.wsEndpoint(),
                            protocol: browserOne.protocol,
                        }), false);
                        const [page1, page2] = await Promise.all([
                            new Promise(x => {
                                return browserOne.once('targetcreated', target => {
                                    x(target.page());
                                });
                            }),
                            browserTwo.newPage(),
                        ]);
                        (0, assert_1.default)(page1);
                        (0, expect_1.default)(await page1.evaluate(() => {
                            return 7 * 8;
                        })).toBe(56);
                        (0, expect_1.default)(await page2.evaluate(() => {
                            return 7 * 6;
                        })).toBe(42);
                    }
                    catch (e_9) {
                        env_9.error = e_9;
                        env_9.hasError = true;
                    }
                    finally {
                        __disposeResources(env_9);
                    }
                }
                finally {
                    await close();
                }
            });
            it('should be able to reconnect', async () => {
                const { puppeteer, server, browser: browserOne, close, } = await (0, mocha_utils_js_1.launch)({});
                // Connection is closed on the original one
                let remoteClose;
                try {
                    const env_10 = { stack: [], error: void 0, hasError: false };
                    try {
                        const browserWSEndpoint = browserOne.wsEndpoint();
                        const pageOne = await browserOne.newPage();
                        await pageOne.goto(server.EMPTY_PAGE);
                        await browserOne.disconnect();
                        const browserTwo = await puppeteer.connect({
                            browserWSEndpoint,
                            protocol: browserOne.protocol,
                        });
                        remoteClose = browserTwo.close.bind(browserTwo);
                        const pages = await browserTwo.pages();
                        const pageTwo = pages.find(page => {
                            return page.url() === server.EMPTY_PAGE;
                        });
                        await pageTwo.reload();
                        const _ = __addDisposableResource(env_10, await pageTwo.waitForSelector('body', {
                            timeout: 10000,
                        }), false);
                    }
                    catch (e_10) {
                        env_10.error = e_10;
                        env_10.hasError = true;
                    }
                    finally {
                        __disposeResources(env_10);
                    }
                }
                finally {
                    await remoteClose();
                    await close();
                }
            });
        });
        describe('Puppeteer.executablePath', function () {
            it('should work', async () => {
                const { puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                const executablePath = puppeteer.executablePath();
                (0, expect_1.default)(fs_1.default.existsSync(executablePath)).toBe(true);
                (0, expect_1.default)(fs_1.default.realpathSync(executablePath)).toBe(executablePath);
            });
            it('returns executablePath for channel', async () => {
                const { puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                    skipLaunch: true,
                });
                const executablePath = puppeteer.executablePath('chrome');
                (0, expect_1.default)(executablePath).toBeTruthy();
            });
            describe('when executable path is configured', () => {
                const sandbox = sinon_1.default.createSandbox();
                beforeEach(async () => {
                    const { puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                        skipLaunch: true,
                    });
                    sandbox
                        .stub(puppeteer.configuration, 'executablePath')
                        .value('SOME_CUSTOM_EXECUTABLE');
                });
                afterEach(() => {
                    sandbox.restore();
                });
                it('its value is used', async () => {
                    const { puppeteer } = await (0, mocha_utils_js_1.getTestState)({
                        skipLaunch: true,
                    });
                    try {
                        puppeteer.executablePath();
                    }
                    catch (error) {
                        (0, expect_1.default)(error.message).toContain('SOME_CUSTOM_EXECUTABLE');
                    }
                });
            });
        });
    });
    describe('Browser target events', function () {
        it('should work', async () => {
            const { browser, server, close } = await (0, mocha_utils_js_1.launch)({});
            try {
                const events = [];
                browser.on('targetcreated', () => {
                    events.push('CREATED');
                });
                browser.on('targetchanged', () => {
                    events.push('CHANGED');
                });
                browser.on('targetdestroyed', () => {
                    events.push('DESTROYED');
                });
                const page = await browser.newPage();
                await page.goto(server.EMPTY_PAGE);
                await page.close();
                (0, expect_1.default)(events).toEqual(['CREATED', 'CHANGED', 'DESTROYED']);
            }
            finally {
                await close();
            }
        });
    });
    describe('Browser.Events.disconnected', function () {
        it('should be emitted when: browser gets closed, disconnected or underlying websocket gets closed', async () => {
            const { puppeteer, browser, close } = await (0, mocha_utils_js_1.launch)({});
            try {
                const env_11 = { stack: [], error: void 0, hasError: false };
                try {
                    const browserWSEndpoint = browser.wsEndpoint();
                    const remoteBrowser1 = __addDisposableResource(env_11, await puppeteer.connect({
                        browserWSEndpoint,
                        protocol: browser.protocol,
                    }), false);
                    const remoteBrowser2 = __addDisposableResource(env_11, await puppeteer.connect({
                        browserWSEndpoint,
                        protocol: browser.protocol,
                    }), false);
                    let disconnectedOriginal = 0;
                    let disconnectedRemote1 = 0;
                    let disconnectedRemote2 = 0;
                    browser.on('disconnected', () => {
                        ++disconnectedOriginal;
                    });
                    remoteBrowser1.on('disconnected', () => {
                        ++disconnectedRemote1;
                    });
                    remoteBrowser2.on('disconnected', () => {
                        ++disconnectedRemote2;
                    });
                    await Promise.all([
                        (0, utils_js_1.waitEvent)(remoteBrowser2, 'disconnected'),
                        remoteBrowser2.disconnect(),
                    ]);
                    (0, expect_1.default)(disconnectedOriginal).toBe(0);
                    (0, expect_1.default)(disconnectedRemote1).toBe(0);
                    (0, expect_1.default)(disconnectedRemote2).toBe(1);
                    await Promise.all([
                        (0, utils_js_1.waitEvent)(remoteBrowser1, 'disconnected'),
                        (0, utils_js_1.waitEvent)(browser, 'disconnected'),
                        browser.close(),
                    ]);
                    (0, expect_1.default)(disconnectedOriginal).toBe(1);
                    (0, expect_1.default)(disconnectedRemote1).toBe(1);
                    (0, expect_1.default)(disconnectedRemote2).toBe(1);
                }
                catch (e_11) {
                    env_11.error = e_11;
                    env_11.hasError = true;
                }
                finally {
                    __disposeResources(env_11);
                }
            }
            finally {
                await close();
            }
        });
    });
});
//# sourceMappingURL=launcher.spec.js.map