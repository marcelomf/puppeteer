"use strict";
/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launch = exports.createTimeout = exports.shortWaitForArrayToHaveAtLeastNElements = exports.expectCookieEquals = exports.mochaHooks = exports.getTestState = exports.setupTestBrowserHooks = exports.isHeadless = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const testserver_1 = require("@pptr/testserver");
const expect_1 = __importDefault(require("expect"));
const puppeteer_js_1 = __importDefault(require("puppeteer/lib/cjs/puppeteer/puppeteer.js"));
const fs_js_1 = require("puppeteer-core/internal/node/util/fs.js");
const Deferred_js_1 = require("puppeteer-core/internal/util/Deferred.js");
const ErrorLike_js_1 = require("puppeteer-core/internal/util/ErrorLike.js");
const sinon_1 = __importDefault(require("sinon"));
const utils_js_1 = require("./utils.js");
const product = process.env['PRODUCT'] || process.env['PUPPETEER_PRODUCT'] || 'chrome';
const headless = (process.env['HEADLESS'] || 'true').trim().toLowerCase();
exports.isHeadless = headless === 'true' || headless === 'shell';
const isFirefox = product === 'firefox';
const isChrome = product === 'chrome';
const protocol = (process.env['PUPPETEER_PROTOCOL'] || 'cdp');
let extraLaunchOptions = {};
try {
    extraLaunchOptions = JSON.parse(process.env['EXTRA_LAUNCH_OPTIONS'] || '{}');
}
catch (error) {
    if ((0, ErrorLike_js_1.isErrorLike)(error)) {
        console.warn(`Error parsing EXTRA_LAUNCH_OPTIONS: ${error.message}. Skipping.`);
    }
    else {
        throw error;
    }
}
const defaultBrowserOptions = Object.assign({
    handleSIGINT: true,
    executablePath: process.env['BINARY'],
    headless: headless === 'shell' ? 'shell' : exports.isHeadless,
    dumpio: !!process.env['DUMPIO'],
    protocol,
}, extraLaunchOptions);
if (defaultBrowserOptions.executablePath) {
    console.warn(`WARN: running ${product} tests with ${defaultBrowserOptions.executablePath}`);
}
else {
    const executablePath = puppeteer_js_1.default.executablePath();
    if (!fs_1.default.existsSync(executablePath)) {
        throw new Error(`Browser is not downloaded at ${executablePath}. Run 'npm install' and try to re-run tests`);
    }
}
const processVariables = {
    product,
    headless,
    isHeadless: exports.isHeadless,
    isFirefox,
    isChrome,
    protocol,
    defaultBrowserOptions,
};
const setupServer = async () => {
    const assetsPath = path_1.default.join(__dirname, '../assets');
    const cachedPath = path_1.default.join(__dirname, '../assets', 'cached');
    const server = await testserver_1.TestServer.create(assetsPath);
    const port = server.port;
    server.enableHTTPCache(cachedPath);
    server.PORT = port;
    server.PREFIX = `http://localhost:${port}`;
    server.CROSS_PROCESS_PREFIX = `http://127.0.0.1:${port}`;
    server.EMPTY_PAGE = `http://localhost:${port}/empty.html`;
    const httpsServer = await testserver_1.TestServer.createHTTPS(assetsPath);
    const httpsPort = httpsServer.port;
    httpsServer.enableHTTPCache(cachedPath);
    httpsServer.PORT = httpsPort;
    httpsServer.PREFIX = `https://localhost:${httpsPort}`;
    httpsServer.CROSS_PROCESS_PREFIX = `https://127.0.0.1:${httpsPort}`;
    httpsServer.EMPTY_PAGE = `https://localhost:${httpsPort}/empty.html`;
    return { server, httpsServer };
};
const setupTestBrowserHooks = () => {
    before(async function () {
        try {
            if (!state.browser) {
                state.browser = await puppeteer_js_1.default.launch({
                    ...processVariables.defaultBrowserOptions,
                    timeout: this.timeout() - 1000,
                    protocolTimeout: this.timeout() * 2,
                });
            }
        }
        catch (error) {
            console.error(error);
            // Intentionally empty as `getTestState` will throw
            // if browser is not found
        }
    });
    after(async () => {
        if (typeof gc !== 'undefined') {
            gc();
            const memory = process.memoryUsage();
            console.log('Memory stats:');
            for (const key of Object.keys(memory)) {
                console.log(key, 
                // @ts-expect-error TS cannot the key type.
                `${Math.round(((memory[key] / 1024 / 1024) * 100) / 100)} MB`);
            }
        }
    });
    afterEach(async () => {
        if (state.context) {
            await state.context.close();
            state.context = undefined;
            state.page = undefined;
        }
    });
};
exports.setupTestBrowserHooks = setupTestBrowserHooks;
const getTestState = async (options = {}) => {
    const { skipLaunch = false, skipContextCreation = false } = options;
    state.defaultBrowserOptions = JSON.parse(JSON.stringify(processVariables.defaultBrowserOptions));
    state.server?.reset();
    state.httpsServer?.reset();
    if (skipLaunch) {
        return state;
    }
    if (!state.browser) {
        throw new Error('Browser was not set-up in time!');
    }
    else if (!state.browser.connected) {
        throw new Error('Browser has disconnected!');
    }
    if (state.context) {
        throw new Error('Previous state was not cleared');
    }
    if (!skipContextCreation) {
        state.context = await state.browser.createBrowserContext();
        state.page = await state.context.newPage();
    }
    return state;
};
exports.getTestState = getTestState;
const setupGoldenAssertions = () => {
    const suffix = processVariables.product.toLowerCase();
    const GOLDEN_DIR = path_1.default.join(__dirname, `../golden-${suffix}`);
    const OUTPUT_DIR = path_1.default.join(__dirname, `../output-${suffix}`);
    if (fs_1.default.existsSync(OUTPUT_DIR)) {
        (0, fs_js_1.rmSync)(OUTPUT_DIR);
    }
    (0, utils_js_1.extendExpectWithToBeGolden)(GOLDEN_DIR, OUTPUT_DIR);
};
setupGoldenAssertions();
const state = {};
if (process.env['MOCHA_WORKER_ID'] === undefined ||
    process.env['MOCHA_WORKER_ID'] === '0') {
    console.log(`Running unit tests with:
  -> product: ${processVariables.product}
  -> binary: ${processVariables.defaultBrowserOptions.executablePath ||
        path_1.default.relative(process.cwd(), puppeteer_js_1.default.executablePath())}
  -> mode: ${processVariables.isHeadless
        ? processVariables.headless === 'true'
            ? '--headless=new'
            : '--headless'
        : 'headful'}`);
}
const browserNotClosedError = new Error('A manually launched browser was not closed!');
exports.mochaHooks = {
    async beforeAll() {
        async function setUpDefaultState() {
            const { server, httpsServer } = await setupServer();
            state.puppeteer = puppeteer_js_1.default;
            state.server = server;
            state.httpsServer = httpsServer;
            state.isFirefox = processVariables.isFirefox;
            state.isChrome = processVariables.isChrome;
            state.isHeadless = processVariables.isHeadless;
            state.headless = processVariables.headless;
            state.puppeteerPath = path_1.default.resolve(path_1.default.join(__dirname, '..', '..', 'packages', 'puppeteer'));
        }
        try {
            await Deferred_js_1.Deferred.race([
                setUpDefaultState(),
                Deferred_js_1.Deferred.create({
                    message: `Failed in after Hook`,
                    timeout: this.timeout() - 1000,
                }),
            ]);
        }
        catch { }
    },
    async afterAll() {
        this.timeout(0);
        const lastTestFile = this?.test?.parent?.suites?.[0]?.file
            ?.split('/')
            ?.at(-1);
        try {
            await Promise.all([
                state.server?.stop(),
                state.httpsServer?.stop(),
                state.browser?.close(),
            ]);
        }
        catch (error) {
            throw new Error(`Closing defaults (HTTP TestServer, HTTPS TestServer, Browser ) failed in ${lastTestFile}}`);
        }
        if (browserCleanupsAfterAll.length > 0) {
            await closeLaunched(browserCleanupsAfterAll)();
            throw new Error(`Browser was not closed in ${lastTestFile}`);
        }
    },
    async afterEach() {
        if (browserCleanups.length > 0) {
            this.test.error(browserNotClosedError);
            await Deferred_js_1.Deferred.race([
                closeLaunched(browserCleanups)(),
                Deferred_js_1.Deferred.create({
                    message: `Failed in after Hook`,
                    timeout: this.timeout() - 1000,
                }),
            ]);
        }
        sinon_1.default.restore();
    },
};
expect_1.default.extend({
    atLeastOneToContain: (actual, expected) => {
        for (const test of expected) {
            try {
                (0, expect_1.default)(actual).toContain(test);
                return {
                    pass: true,
                    message: () => {
                        return '';
                    },
                };
            }
            catch (err) { }
        }
        return {
            pass: false,
            message: () => {
                return `"${actual}" didn't contain any of the strings ${JSON.stringify(expected)}`;
            },
        };
    },
});
const expectCookieEquals = async (cookies, expectedCookies) => {
    if (!processVariables.isChrome) {
        // Only keep standard properties when testing on a browser other than Chrome.
        expectedCookies = expectedCookies.map(cookie => {
            return Object.fromEntries(Object.entries(cookie).filter(([key]) => {
                return [
                    'domain',
                    'expires',
                    'httpOnly',
                    'name',
                    'path',
                    'secure',
                    'session',
                    'size',
                    'value',
                ].includes(key);
            }));
        });
    }
    (0, expect_1.default)(cookies).toHaveLength(expectedCookies.length);
    for (let i = 0; i < cookies.length; i++) {
        (0, expect_1.default)(cookies[i]).toMatchObject(expectedCookies[i]);
    }
};
exports.expectCookieEquals = expectCookieEquals;
const shortWaitForArrayToHaveAtLeastNElements = async (data, minLength, attempts = 3, timeout = 50) => {
    for (let i = 0; i < attempts; i++) {
        if (data.length >= minLength) {
            break;
        }
        await new Promise(resolve => {
            return setTimeout(resolve, timeout);
        });
    }
};
exports.shortWaitForArrayToHaveAtLeastNElements = shortWaitForArrayToHaveAtLeastNElements;
const createTimeout = (n, value) => {
    return new Promise(resolve => {
        setTimeout(() => {
            return resolve(value);
        }, n);
    });
};
exports.createTimeout = createTimeout;
const browserCleanupsAfterAll = [];
const browserCleanups = [];
const closeLaunched = (storage) => {
    return async () => {
        let cleanup = storage.pop();
        try {
            while (cleanup) {
                await cleanup();
                cleanup = storage.pop();
            }
        }
        catch (error) {
            // If the browser was closed by other means, swallow the error
            // and mark the browser as closed.
            if (error?.message.includes('Connection closed')) {
                storage.splice(0, storage.length);
                return;
            }
            throw error;
        }
    };
};
const launch = async (launchOptions, options = {}) => {
    const { after = 'each', createContext = true, createPage = true } = options;
    const initState = await (0, exports.getTestState)({
        skipLaunch: true,
    });
    const cleanupStorage = after === 'each' ? browserCleanups : browserCleanupsAfterAll;
    try {
        const browser = await puppeteer_js_1.default.launch({
            ...initState.defaultBrowserOptions,
            ...launchOptions,
        });
        cleanupStorage.push(() => {
            return browser.close();
        });
        let context;
        let page;
        if (createContext) {
            context = await browser.createBrowserContext();
            cleanupStorage.push(() => {
                return context.close();
            });
            if (createPage) {
                page = await context.newPage();
                cleanupStorage.push(() => {
                    return page.close();
                });
            }
        }
        return {
            ...initState,
            browser,
            context: context,
            page: page,
            close: closeLaunched(cleanupStorage),
        };
    }
    catch (error) {
        await closeLaunched(cleanupStorage)();
        throw error;
    }
};
exports.launch = launch;
//# sourceMappingURL=mocha-utils.js.map