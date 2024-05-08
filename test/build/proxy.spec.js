"use strict";
/**
 * @license
 * Copyright 2021 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const os_1 = __importDefault(require("os"));
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
let HOSTNAME = os_1.default.hostname();
// Hostname might not be always accessible in environments other than GitHub
// Actions. Therefore, we try to find an external IPv4 address to be used as a
// hostname in these tests.
const networkInterfaces = os_1.default.networkInterfaces();
for (const key of Object.keys(networkInterfaces)) {
    const interfaces = networkInterfaces[key];
    for (const net of interfaces || []) {
        if (net.family === 'IPv4' && !net.internal) {
            HOSTNAME = net.address;
            break;
        }
    }
}
/**
 * Requests to localhost do not get proxied by default. Create a URL using the hostname
 * instead.
 */
function getEmptyPageUrl(server) {
    const emptyPagePath = new URL(server.EMPTY_PAGE).pathname;
    return `http://${HOSTNAME}:${server.PORT}${emptyPagePath}`;
}
describe('request proxy', () => {
    let proxiedRequestUrls;
    let proxyServer;
    let proxyServerUrl;
    const defaultArgs = [
        // We disable this in tests so that proxy-related tests
        // don't intercept queries from this service in headful.
        '--disable-features=NetworkTimeServiceQuerying',
    ];
    beforeEach(() => {
        proxiedRequestUrls = [];
        proxyServer = http_1.default
            .createServer((originalRequest, originalResponse) => {
            proxiedRequestUrls.push(originalRequest.url);
            const proxyRequest = http_1.default.request(originalRequest.url, {
                method: originalRequest.method,
                headers: originalRequest.headers,
            }, proxyResponse => {
                originalResponse.writeHead(proxyResponse.statusCode, proxyResponse.headers);
                proxyResponse.pipe(originalResponse, { end: true });
            });
            originalRequest.pipe(proxyRequest, { end: true });
        })
            .listen();
        proxyServerUrl = `http://${HOSTNAME}:${proxyServer.address().port}`;
    });
    afterEach(async () => {
        await new Promise((resolve, reject) => {
            proxyServer.close(error => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(undefined);
                }
            });
        });
    });
    it('should proxy requests when configured', async () => {
        const { server } = await (0, mocha_utils_js_1.getTestState)({
            skipLaunch: true,
        });
        const emptyPageUrl = getEmptyPageUrl(server);
        const { browser, close } = await (0, mocha_utils_js_1.launch)({
            args: [...defaultArgs, `--proxy-server=${proxyServerUrl}`],
        });
        try {
            const page = await browser.newPage();
            const response = (await page.goto(emptyPageUrl));
            (0, expect_1.default)(response.ok()).toBe(true);
            (0, expect_1.default)(proxiedRequestUrls).toEqual([emptyPageUrl]);
        }
        finally {
            await close();
        }
    });
    it('should respect proxy bypass list', async () => {
        const { server } = await (0, mocha_utils_js_1.getTestState)({
            skipLaunch: true,
        });
        const emptyPageUrl = getEmptyPageUrl(server);
        const { browser, close } = await (0, mocha_utils_js_1.launch)({
            args: [
                ...defaultArgs,
                `--proxy-server=${proxyServerUrl}`,
                `--proxy-bypass-list=${new URL(emptyPageUrl).host}`,
            ],
        });
        try {
            const page = await browser.newPage();
            const response = (await page.goto(emptyPageUrl));
            (0, expect_1.default)(response.ok()).toBe(true);
            (0, expect_1.default)(proxiedRequestUrls).toEqual([]);
        }
        finally {
            await close();
        }
    });
    describe('in incognito browser context', () => {
        it('should proxy requests when configured at browser level', async () => {
            const { server } = await (0, mocha_utils_js_1.getTestState)({
                skipLaunch: true,
            });
            const emptyPageUrl = getEmptyPageUrl(server);
            const { browser, close } = await (0, mocha_utils_js_1.launch)({
                args: [...defaultArgs, `--proxy-server=${proxyServerUrl}`],
            });
            try {
                const context = await browser.createBrowserContext();
                const page = await context.newPage();
                const response = (await page.goto(emptyPageUrl));
                (0, expect_1.default)(response.ok()).toBe(true);
                (0, expect_1.default)(proxiedRequestUrls).toEqual([emptyPageUrl]);
            }
            finally {
                await close();
            }
        });
        it('should respect proxy bypass list when configured at browser level', async () => {
            const { server } = await (0, mocha_utils_js_1.getTestState)({
                skipLaunch: true,
            });
            const emptyPageUrl = getEmptyPageUrl(server);
            const { browser, close } = await (0, mocha_utils_js_1.launch)({
                args: [
                    ...defaultArgs,
                    `--proxy-server=${proxyServerUrl}`,
                    `--proxy-bypass-list=${new URL(emptyPageUrl).host}`,
                ],
            });
            try {
                const context = await browser.createBrowserContext();
                const page = await context.newPage();
                const response = (await page.goto(emptyPageUrl));
                (0, expect_1.default)(response.ok()).toBe(true);
                (0, expect_1.default)(proxiedRequestUrls).toEqual([]);
            }
            finally {
                await close();
            }
        });
        /**
         * See issues #7873, #7719, and #7698.
         */
        it('should proxy requests when configured at context level', async () => {
            const { server } = await (0, mocha_utils_js_1.getTestState)({
                skipLaunch: true,
            });
            const emptyPageUrl = getEmptyPageUrl(server);
            const { browser, close } = await (0, mocha_utils_js_1.launch)({
                args: defaultArgs,
            });
            try {
                const context = await browser.createBrowserContext({
                    proxyServer: proxyServerUrl,
                });
                const page = await context.newPage();
                const response = (await page.goto(emptyPageUrl));
                (0, expect_1.default)(response.ok()).toBe(true);
                (0, expect_1.default)(proxiedRequestUrls).toEqual([emptyPageUrl]);
            }
            finally {
                await close();
            }
        });
        it('should respect proxy bypass list when configured at context level', async () => {
            const { server } = await (0, mocha_utils_js_1.getTestState)({
                skipLaunch: true,
            });
            const emptyPageUrl = getEmptyPageUrl(server);
            const { browser, close } = await (0, mocha_utils_js_1.launch)({
                args: defaultArgs,
            });
            try {
                const context = await browser.createBrowserContext({
                    proxyServer: proxyServerUrl,
                    proxyBypassList: [new URL(emptyPageUrl).host],
                });
                const page = await context.newPage();
                const response = (await page.goto(emptyPageUrl));
                (0, expect_1.default)(response.ok()).toBe(true);
                (0, expect_1.default)(proxiedRequestUrls).toEqual([]);
            }
            finally {
                await close();
            }
        });
    });
});
//# sourceMappingURL=proxy.spec.js.map