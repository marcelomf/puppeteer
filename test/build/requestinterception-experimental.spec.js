"use strict";
/**
 * @license
 * Copyright 2021 Google Inc.
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const HTTPRequest_js_1 = require("puppeteer-core/internal/api/HTTPRequest.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('cooperative request interception', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.setRequestInterception', function () {
        const expectedActions = ['abort', 'continue', 'respond'];
        for (const expectedAction of expectedActions) {
            it(`should cooperatively ${expectedAction} by priority`, async () => {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                const actionResults = [];
                await page.setRequestInterception(true);
                page.on('request', request => {
                    if (request.url().endsWith('.css')) {
                        void request.continue({ headers: { ...request.headers(), xaction: 'continue' } }, expectedAction === 'continue' ? 1 : 0);
                    }
                    else {
                        void request.continue({}, 0);
                    }
                });
                page.on('request', request => {
                    if (request.url().endsWith('.css')) {
                        void request.respond({ headers: { xaction: 'respond' } }, expectedAction === 'respond' ? 1 : 0);
                    }
                    else {
                        void request.continue({}, 0);
                    }
                });
                page.on('request', request => {
                    if (request.url().endsWith('.css')) {
                        void request.abort('aborted', expectedAction === 'abort' ? 1 : 0);
                    }
                    else {
                        void request.continue({}, 0);
                    }
                });
                page.on('response', response => {
                    const { xaction } = response.headers();
                    if (response.url().endsWith('.css') && !!xaction) {
                        actionResults.push(xaction);
                    }
                });
                page.on('requestfailed', request => {
                    if (request.url().endsWith('.css')) {
                        actionResults.push('abort');
                    }
                });
                const response = (await (async () => {
                    if (expectedAction === 'continue') {
                        const [serverRequest, response] = await Promise.all([
                            server.waitForRequest('/one-style.css'),
                            page.goto(server.PREFIX + '/one-style.html'),
                        ]);
                        actionResults.push(serverRequest.headers['xaction']);
                        return response;
                    }
                    else {
                        return await page.goto(server.PREFIX + '/one-style.html');
                    }
                })());
                (0, expect_1.default)(actionResults).toHaveLength(1);
                (0, expect_1.default)(actionResults[0]).toBe(expectedAction);
                (0, expect_1.default)(response.ok()).toBe(true);
            });
        }
        it('should intercept', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            let requestError;
            page.on('request', request => {
                if ((0, utils_js_1.isFavicon)(request)) {
                    void request.continue({}, 0);
                    return;
                }
                try {
                    (0, expect_1.default)(request).toBeTruthy();
                    (0, expect_1.default)(request.url()).toContain('empty.html');
                    (0, expect_1.default)(request.headers()['user-agent']).toBeTruthy();
                    (0, expect_1.default)(request.method()).toBe('GET');
                    (0, expect_1.default)(request.postData()).toBe(undefined);
                    (0, expect_1.default)(request.isNavigationRequest()).toBe(true);
                    (0, expect_1.default)(request.frame().url()).toBe('about:blank');
                    (0, expect_1.default)(request.frame() === page.mainFrame()).toBe(true);
                }
                catch (error) {
                    requestError = error;
                }
                finally {
                    void request.continue({}, 0);
                }
            });
            const response = (await page.goto(server.EMPTY_PAGE));
            if (requestError) {
                throw requestError;
            }
            (0, expect_1.default)(response.ok()).toBe(true);
            (0, expect_1.default)(response.remoteAddress().port).toBe(server.PORT);
        });
        // @see https://github.com/puppeteer/puppeteer/pull/3105
        it('should work when POST is redirected with 302', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setRedirect('/rredirect', '/empty.html');
            await page.goto(server.EMPTY_PAGE);
            await page.setRequestInterception(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            await page.setContent(`
        <form action='/rredirect' method='post'>
          <input type="hidden" id="foo" name="foo" value="FOOBAR">
        </form>
      `);
            await Promise.all([
                page.$eval('form', form => {
                    return form.submit();
                }),
                page.waitForNavigation(),
            ]);
        });
        // @see https://github.com/puppeteer/puppeteer/issues/3973
        it('should work when header manipulation headers with redirect', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setRedirect('/rrredirect', '/empty.html');
            await page.setRequestInterception(true);
            let requestError;
            page.on('request', request => {
                const headers = Object.assign({}, request.headers(), {
                    foo: 'bar',
                });
                void request.continue({ headers }, 0);
                try {
                    (0, expect_1.default)(request.continueRequestOverrides()).toEqual({ headers });
                }
                catch (error) {
                    requestError = error;
                }
            });
            // Make sure that the goto does not time out.
            await page.goto(server.PREFIX + '/rrredirect');
            if (requestError) {
                throw requestError;
            }
        });
        // @see https://github.com/puppeteer/puppeteer/issues/4743
        it('should be able to remove headers', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                const headers = Object.assign({}, request.headers(), {
                    foo: 'bar',
                    origin: undefined, // remove "origin" header
                });
                void request.continue({ headers }, 0);
            });
            const [serverRequest] = await Promise.all([
                server.waitForRequest('/empty.html'),
                page.goto(server.PREFIX + '/empty.html'),
            ]);
            (0, expect_1.default)(serverRequest.headers.origin).toBe(undefined);
        });
        it('should contain referer header', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            const requests = [];
            page.on('request', request => {
                if (!(0, utils_js_1.isFavicon)(request)) {
                    requests.push(request);
                }
                void request.continue({}, 0);
            });
            await page.goto(server.PREFIX + '/one-style.html');
            (0, expect_1.default)(requests[1].url()).toContain('/one-style.css');
            (0, expect_1.default)(requests[1].headers()['referer']).toContain('/one-style.html');
        });
        it('should properly return navigation response when URL has cookies', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Setup cookie.
            await page.goto(server.EMPTY_PAGE);
            await page.setCookie({ name: 'foo', value: 'bar' });
            // Setup request interception.
            await page.setRequestInterception(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            const response = await page.reload();
            (0, expect_1.default)(response.status()).toBe(200);
        });
        it('should stop intercepting', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.once('request', request => {
                return request.continue({}, 0);
            });
            await page.goto(server.EMPTY_PAGE);
            await page.setRequestInterception(false);
            await page.goto(server.EMPTY_PAGE);
        });
        it('should show custom HTTP headers', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setExtraHTTPHeaders({
                foo: 'bar',
            });
            await page.setRequestInterception(true);
            let requestError;
            page.on('request', request => {
                try {
                    (0, expect_1.default)(request.headers()['foo']).toBe('bar');
                }
                catch (error) {
                    requestError = error;
                }
                finally {
                    void request.continue({}, 0);
                }
            });
            const response = await page.goto(server.EMPTY_PAGE);
            if (requestError) {
                throw requestError;
            }
            (0, expect_1.default)(response.ok()).toBe(true);
        });
        // @see https://github.com/puppeteer/puppeteer/issues/4337
        it('should work with redirect inside sync XHR', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            server.setRedirect('/logo.png', '/pptr.png');
            await page.setRequestInterception(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            const status = await page.evaluate(async () => {
                const request = new XMLHttpRequest();
                request.open('GET', '/logo.png', false); // `false` makes the request synchronous
                request.send(null);
                return request.status;
            });
            (0, expect_1.default)(status).toBe(200);
        });
        it('should work with custom referer headers', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setExtraHTTPHeaders({ referer: server.EMPTY_PAGE });
            await page.setRequestInterception(true);
            let requestError;
            page.on('request', request => {
                try {
                    (0, expect_1.default)(request.headers()['referer']).toBe(server.EMPTY_PAGE);
                }
                catch (error) {
                    requestError = error;
                }
                finally {
                    void request.continue({}, 0);
                }
            });
            const response = await page.goto(server.EMPTY_PAGE);
            if (requestError) {
                throw requestError;
            }
            (0, expect_1.default)(response.ok()).toBe(true);
        });
        it('should be abortable', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                if (request.url().endsWith('.css')) {
                    void request.abort('failed', 0);
                }
                else {
                    void request.continue({}, 0);
                }
            });
            let failedRequests = 0;
            page.on('requestfailed', () => {
                return ++failedRequests;
            });
            const response = await page.goto(server.PREFIX + '/one-style.html');
            (0, expect_1.default)(response.ok()).toBe(true);
            (0, expect_1.default)(response.request().failure()).toBe(null);
            (0, expect_1.default)(failedRequests).toBe(1);
        });
        it('should be able to access the error reason', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.abort('failed', 0);
            });
            let abortReason = null;
            page.on('request', request => {
                abortReason = request.abortErrorReason();
                void request.continue({}, 0);
            });
            await page.goto(server.EMPTY_PAGE).catch(() => { });
            (0, expect_1.default)(abortReason).toBe('Failed');
        });
        it('should be abortable with custom error codes', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.abort('internetdisconnected', 0);
            });
            const [failedRequest] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'requestfailed'),
                page.goto(server.EMPTY_PAGE).catch(() => { }),
            ]);
            (0, expect_1.default)(failedRequest).toBeTruthy();
            (0, expect_1.default)(failedRequest.failure().errorText).toBe('net::ERR_INTERNET_DISCONNECTED');
        });
        it('should send referer', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setExtraHTTPHeaders({
                referer: 'http://google.com/',
            });
            await page.setRequestInterception(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            const [request] = await Promise.all([
                server.waitForRequest('/grid.html'),
                page.goto(server.PREFIX + '/grid.html'),
            ]);
            (0, expect_1.default)(request.headers['referer']).toBe('http://google.com/');
        });
        it('should fail navigation when aborting main resource', async () => {
            const { page, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                return request.abort('failed', 0);
            });
            let error;
            await page.goto(server.EMPTY_PAGE).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeTruthy();
            if (isChrome) {
                (0, expect_1.default)(error.message).toContain('net::ERR_FAILED');
            }
            else {
                (0, expect_1.default)(error.message).toContain('NS_ERROR_ABORT');
            }
        });
        it('should work with redirects', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            const requests = [];
            page.on('request', request => {
                void request.continue({}, 0);
                requests.push(request);
            });
            server.setRedirect('/non-existing-page.html', '/non-existing-page-2.html');
            server.setRedirect('/non-existing-page-2.html', '/non-existing-page-3.html');
            server.setRedirect('/non-existing-page-3.html', '/non-existing-page-4.html');
            server.setRedirect('/non-existing-page-4.html', '/empty.html');
            const response = await page.goto(server.PREFIX + '/non-existing-page.html');
            (0, expect_1.default)(response.status()).toBe(200);
            (0, expect_1.default)(response.url()).toContain('empty.html');
            (0, expect_1.default)(requests).toHaveLength(5);
            // Check redirect chain
            const redirectChain = response.request().redirectChain();
            (0, expect_1.default)(redirectChain).toHaveLength(4);
            (0, expect_1.default)(redirectChain[0].url()).toContain('/non-existing-page.html');
            (0, expect_1.default)(redirectChain[2].url()).toContain('/non-existing-page-3.html');
            for (let i = 0; i < redirectChain.length; ++i) {
                const request = redirectChain[i];
                (0, expect_1.default)(request.isNavigationRequest()).toBe(true);
                (0, expect_1.default)(request.redirectChain().indexOf(request)).toBe(i);
            }
        });
        it('should work with redirects for subresources', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            const requests = [];
            page.on('request', request => {
                void request.continue({}, 0);
                if (!(0, utils_js_1.isFavicon)(request)) {
                    requests.push(request);
                }
            });
            server.setRedirect('/one-style.css', '/two-style.css');
            server.setRedirect('/two-style.css', '/three-style.css');
            server.setRedirect('/three-style.css', '/four-style.css');
            server.setRoute('/four-style.css', (_req, res) => {
                return res.end('body {box-sizing: border-box; }');
            });
            const response = await page.goto(server.PREFIX + '/one-style.html');
            (0, expect_1.default)(response.status()).toBe(200);
            (0, expect_1.default)(response.url()).toContain('one-style.html');
            (0, expect_1.default)(requests).toHaveLength(5);
            // Check redirect chain
            const redirectChain = requests[1].redirectChain();
            (0, expect_1.default)(redirectChain).toHaveLength(3);
            (0, expect_1.default)(redirectChain[0].url()).toContain('/one-style.css');
            (0, expect_1.default)(redirectChain[2].url()).toContain('/three-style.css');
        });
        it('should be able to abort redirects', async () => {
            const { page, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            server.setRedirect('/non-existing.json', '/non-existing-2.json');
            server.setRedirect('/non-existing-2.json', '/simple.html');
            page.on('request', request => {
                if (request.url().includes('non-existing-2')) {
                    void request.abort('failed', 0);
                }
                else {
                    void request.continue({}, 0);
                }
            });
            await page.goto(server.EMPTY_PAGE);
            const result = await page.evaluate(async () => {
                try {
                    return await fetch('/non-existing.json');
                }
                catch (error) {
                    return error.message;
                }
            });
            if (isChrome) {
                (0, expect_1.default)(result).toContain('Failed to fetch');
            }
            else {
                (0, expect_1.default)(result).toContain('NetworkError');
            }
        });
        it('should work with equal requests', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            let responseCount = 1;
            server.setRoute('/zzz', (_req, res) => {
                return res.end(responseCount++ * 11 + '');
            });
            await page.setRequestInterception(true);
            let spinner = false;
            // Cancel 2nd request.
            page.on('request', request => {
                if ((0, utils_js_1.isFavicon)(request)) {
                    void request.continue({}, 0);
                    return;
                }
                void (spinner ? request.abort('failed', 0) : request.continue({}, 0));
                spinner = !spinner;
            });
            const results = await page.evaluate(() => {
                return Promise.all([
                    fetch('/zzz')
                        .then(response => {
                        return response.text();
                    })
                        .catch(() => {
                        return 'FAILED';
                    }),
                    fetch('/zzz')
                        .then(response => {
                        return response.text();
                    })
                        .catch(() => {
                        return 'FAILED';
                    }),
                    fetch('/zzz')
                        .then(response => {
                        return response.text();
                    })
                        .catch(() => {
                        return 'FAILED';
                    }),
                ]);
            });
            (0, expect_1.default)(results).toEqual(['11', 'FAILED', '22']);
        });
        it('should navigate to dataURL and fire dataURL requests', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            const requests = [];
            page.on('request', request => {
                requests.push(request);
                void request.continue({}, 0);
            });
            const dataURL = 'data:text/html,<div>yo</div>';
            const response = await page.goto(dataURL);
            (0, expect_1.default)(response.status()).toBe(200);
            (0, expect_1.default)(requests).toHaveLength(1);
            (0, expect_1.default)(requests[0].url()).toBe(dataURL);
        });
        it('should be able to fetch dataURL and fire dataURL requests', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setRequestInterception(true);
            const requests = [];
            page.on('request', request => {
                !(0, utils_js_1.isFavicon)(request) && requests.push(request);
                void request.continue({}, 0);
            });
            const dataURL = 'data:text/html,<div>yo</div>';
            const text = await page.evaluate((url) => {
                return fetch(url).then(r => {
                    return r.text();
                });
            }, dataURL);
            (0, expect_1.default)(text).toBe('<div>yo</div>');
            (0, expect_1.default)(requests).toHaveLength(1);
            (0, expect_1.default)(requests[0].url()).toBe(dataURL);
        });
        it('should navigate to URL with hash and fire requests without hash', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            const requests = [];
            page.on('request', request => {
                requests.push(request);
                void request.continue({}, 0);
            });
            const response = await page.goto(server.EMPTY_PAGE + '#hash');
            (0, expect_1.default)(response.status()).toBe(200);
            (0, expect_1.default)(response.url()).toBe(server.EMPTY_PAGE);
            (0, expect_1.default)(requests).toHaveLength(1);
            (0, expect_1.default)(requests[0].url()).toBe(server.EMPTY_PAGE);
        });
        it('should work with encoded server', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // The requestWillBeSent will report encoded URL, whereas interception will
            // report URL as-is. @see crbug.com/759388
            await page.setRequestInterception(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            const response = await page.goto(server.PREFIX + '/some nonexisting page');
            (0, expect_1.default)(response.status()).toBe(404);
        });
        it('should work with badly encoded server', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            server.setRoute('/malformed?rnd=%911', (_req, res) => {
                return res.end();
            });
            page.on('request', request => {
                return request.continue({}, 0);
            });
            const response = await page.goto(server.PREFIX + '/malformed?rnd=%911');
            (0, expect_1.default)(response.status()).toBe(200);
        });
        it('should work with encoded server - 2', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // The requestWillBeSent will report URL as-is, whereas interception will
            // report encoded URL for stylesheet. @see crbug.com/759388
            await page.setRequestInterception(true);
            const requests = [];
            page.on('request', request => {
                void request.continue({}, 0);
                requests.push(request);
            });
            const response = await page.goto(`data:text/html,<link rel="stylesheet" href="${server.PREFIX}/fonts?helvetica|arial"/>`);
            (0, expect_1.default)(response.status()).toBe(200);
            (0, expect_1.default)(requests).toHaveLength(2);
            (0, expect_1.default)(requests[1].response().status()).toBe(404);
        });
        it('should not throw "Invalid Interception Id" if the request was cancelled', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<iframe></iframe>');
            await page.setRequestInterception(true);
            let request;
            page.on('request', async (r) => {
                return (request = r);
            });
            void (page.$eval('iframe', (frame, url) => {
                return (frame.src = url);
            }, server.EMPTY_PAGE),
                // Wait for request interception.
                await (0, utils_js_1.waitEvent)(page, 'request'));
            // Delete frame to cause request to be canceled.
            await page.$eval('iframe', frame => {
                return frame.remove();
            });
            let error;
            await request.continue({}, 0).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeUndefined();
        });
        it('should throw if interception is not enabled', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            page.on('request', async (request) => {
                try {
                    await request.continue({}, 0);
                }
                catch (error_) {
                    error = error_;
                }
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(error.message).toContain('Request Interception is not enabled');
        });
        it('should work with file URLs', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            const urls = new Set();
            page.on('request', request => {
                urls.add(request.url().split('/').pop());
                void request.continue({}, 0);
            });
            await page.goto(pathToFileURL(path_1.default.join(__dirname, '../assets', 'one-style.html')));
            (0, expect_1.default)(urls.size).toBe(2);
            (0, expect_1.default)(urls.has('one-style.html')).toBe(true);
            (0, expect_1.default)(urls.has('one-style.css')).toBe(true);
        });
        it('should not cache if cache disabled', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Load and re-load to make sure it's cached.
            await page.goto(server.PREFIX + '/cached/one-style.html');
            await page.setRequestInterception(true);
            await page.setCacheEnabled(false);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            const cached = [];
            page.on('requestservedfromcache', r => {
                return cached.push(r);
            });
            await page.reload();
            (0, expect_1.default)(cached).toHaveLength(0);
        });
        it('should cache if cache enabled', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Load and re-load to make sure it's cached.
            await page.goto(server.PREFIX + '/cached/one-style.html');
            await page.setRequestInterception(true);
            await page.setCacheEnabled(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            const cached = [];
            page.on('requestservedfromcache', r => {
                return cached.push(r);
            });
            await page.reload();
            (0, expect_1.default)(cached).toHaveLength(1);
        });
        it('should load fonts if cache enabled', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            await page.setCacheEnabled(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            await page.goto(server.PREFIX + '/cached/one-style-font.html');
            await page.waitForResponse(r => {
                return r.url().endsWith('/one-style.woff');
            });
        });
    });
    describe('Request.continue', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                return request.continue({}, 0);
            });
            await page.goto(server.EMPTY_PAGE);
        });
        it('should amend HTTP headers', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                const headers = Object.assign({}, request.headers());
                headers['FOO'] = 'bar';
                void request.continue({ headers }, 0);
            });
            await page.goto(server.EMPTY_PAGE);
            const [request] = await Promise.all([
                server.waitForRequest('/sleep.zzz'),
                page.evaluate(() => {
                    return fetch('/sleep.zzz');
                }),
            ]);
            (0, expect_1.default)(request.headers['foo']).toBe('bar');
        });
        it('should redirect in a way non-observable to page', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                const redirectURL = request.url().includes('/empty.html')
                    ? server.PREFIX + '/consolelog.html'
                    : undefined;
                void request.continue({ url: redirectURL }, 0);
            });
            const [consoleMessage] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'console'),
                page.goto(server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(page.url()).toBe(server.EMPTY_PAGE);
            (0, expect_1.default)(consoleMessage.text()).toBe('yellow');
        });
        it('should amend method', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.continue({ method: 'POST' }, 0);
            });
            const [request] = await Promise.all([
                server.waitForRequest('/sleep.zzz'),
                page.evaluate(() => {
                    return fetch('/sleep.zzz');
                }),
            ]);
            (0, expect_1.default)(request.method).toBe('POST');
        });
        it('should amend post data', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.continue({ postData: 'doggo' }, 0);
            });
            const [serverRequest] = await Promise.all([
                server.waitForRequest('/sleep.zzz'),
                page.evaluate(() => {
                    return fetch('/sleep.zzz', { method: 'POST', body: 'birdy' });
                }),
            ]);
            (0, expect_1.default)(await serverRequest.postBody).toBe('doggo');
        });
        it('should amend both post data and method on navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.continue({ method: 'POST', postData: 'doggo' }, 0);
            });
            const [serverRequest] = await Promise.all([
                server.waitForRequest('/empty.html'),
                page.goto(server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(serverRequest.method).toBe('POST');
            (0, expect_1.default)(await serverRequest.postBody).toBe('doggo');
        });
    });
    describe('Request.respond', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.respond({
                    status: 201,
                    headers: {
                        foo: 'bar',
                    },
                    body: 'Yo, page!',
                }, 0);
            });
            const response = await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(response.status()).toBe(201);
            (0, expect_1.default)(response.headers()['foo']).toBe('bar');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.textContent;
            })).toBe('Yo, page!');
        });
        it('should be able to access the response', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.respond({
                    status: 200,
                    body: 'Yo, page!',
                }, 0);
            });
            let response = null;
            page.on('request', request => {
                response = request.responseForRequest();
                void request.continue({}, 0);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(response).toEqual({ status: 200, body: 'Yo, page!' });
        });
        it('should work with status code 422', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.respond({
                    status: 422,
                    body: 'Yo, page!',
                }, 0);
            });
            const response = await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(response.status()).toBe(422);
            (0, expect_1.default)(response.statusText()).toBe('Unprocessable Entity');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.textContent;
            })).toBe('Yo, page!');
        });
        it('should redirect', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                if (!request.url().includes('rrredirect')) {
                    void request.continue({}, 0);
                    return;
                }
                void request.respond({
                    status: 302,
                    headers: {
                        location: server.EMPTY_PAGE,
                    },
                }, 0);
            });
            const response = await page.goto(server.PREFIX + '/rrredirect');
            (0, expect_1.default)(response.request().redirectChain()).toHaveLength(1);
            (0, expect_1.default)(response.request().redirectChain()[0].url()).toBe(server.PREFIX + '/rrredirect');
            (0, expect_1.default)(response.url()).toBe(server.EMPTY_PAGE);
        });
        it('should allow mocking binary responses', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.setRequestInterception(true);
                page.on('request', request => {
                    const imageBuffer = fs_1.default.readFileSync(path_1.default.join(__dirname, '../assets', 'pptr.png'));
                    void request.respond({
                        contentType: 'image/png',
                        body: imageBuffer,
                    }, 0);
                });
                await page.evaluate(PREFIX => {
                    const img = document.createElement('img');
                    img.src = PREFIX + '/does-not-exist.png';
                    document.body.appendChild(img);
                    return new Promise(fulfill => {
                        return (img.onload = fulfill);
                    });
                }, server.PREFIX);
                const img = __addDisposableResource(env_1, (await page.$('img')), false);
                (0, expect_1.default)(await img.screenshot()).toBeGolden('mock-binary-response.png');
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should stringify intercepted request response headers', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.respond({
                    status: 200,
                    headers: {
                        foo: true,
                    },
                    body: 'Yo, page!',
                }, 0);
            });
            const response = await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(response.status()).toBe(200);
            const headers = response.headers();
            (0, expect_1.default)(headers['foo']).toBe('true');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.body.textContent;
            })).toBe('Yo, page!');
        });
        it('should indicate already-handled if an intercept has been handled', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.continue();
            });
            let requestError;
            page.on('request', request => {
                try {
                    (0, expect_1.default)(request.isInterceptResolutionHandled()).toBeTruthy();
                }
                catch (error) {
                    requestError = error;
                }
            });
            page.on('request', request => {
                const { action } = request.interceptResolutionState();
                try {
                    (0, expect_1.default)(action).toBe(HTTPRequest_js_1.InterceptResolutionAction.AlreadyHandled);
                }
                catch (error) {
                    requestError = error;
                }
            });
            await page.goto(server.EMPTY_PAGE);
            if (requestError) {
                throw requestError;
            }
        });
    });
    describe('Request.resourceType', () => {
        it('should work for document type', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                void request.continue({}, 0);
            });
            const response = await page.goto(server.EMPTY_PAGE);
            const request = response.request();
            (0, expect_1.default)(request.resourceType()).toBe('document');
        });
        it('should work for stylesheets', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            const cssRequests = [];
            page.on('request', request => {
                if (request.url().endsWith('css')) {
                    cssRequests.push(request);
                }
                void request.continue({}, 0);
            });
            await page.goto(server.PREFIX + '/one-style.html');
            (0, expect_1.default)(cssRequests).toHaveLength(1);
            const request = cssRequests[0];
            (0, expect_1.default)(request.url()).toContain('one-style.css');
            (0, expect_1.default)(request.resourceType()).toBe('stylesheet');
        });
    });
});
function pathToFileURL(path) {
    let pathName = path.replace(/\\/g, '/');
    // Windows drive letter must be prefixed with a slash.
    if (!pathName.startsWith('/')) {
        pathName = '/' + pathName;
    }
    return 'file://' + pathName;
}
//# sourceMappingURL=requestinterception-experimental.spec.js.map