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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('network', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.Events.Request', function () {
        it('should fire for navigation requests', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = [];
            page.on('request', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(requests).toHaveLength(1);
        });
        it('should fire for iframes', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = [];
            page.on('request', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await page.goto(server.EMPTY_PAGE);
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            (0, expect_1.default)(requests).toHaveLength(2);
        });
        it('should fire for fetches', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = [];
            page.on('request', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await page.goto(server.EMPTY_PAGE);
            await page.evaluate(() => {
                return fetch('/empty.html');
            });
            (0, expect_1.default)(requests).toHaveLength(2);
        });
    });
    describe('Request.frame', function () {
        it('should work for main frame navigation request', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = [];
            page.on('request', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(requests).toHaveLength(1);
            (0, expect_1.default)(requests[0].frame()).toBe(page.mainFrame());
        });
        it('should work for subframe navigation request', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const requests = [];
            page.on('request', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            (0, expect_1.default)(requests).toHaveLength(1);
            (0, expect_1.default)(requests[0].frame()).toBe(page.frames()[1]);
        });
        it('should work for fetch requests', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            let requests = [];
            page.on('request', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await page.evaluate(() => {
                return fetch('/digits/1.png');
            });
            requests = requests.filter(request => {
                return !request.url().includes('favicon');
            });
            (0, expect_1.default)(requests).toHaveLength(1);
            (0, expect_1.default)(requests[0].frame()).toBe(page.mainFrame());
        });
    });
    describe('Request.headers', function () {
        it('should define Browser in user agent header', async () => {
            const { page, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.EMPTY_PAGE));
            const userAgent = response.request().headers()['user-agent'];
            if (isChrome) {
                (0, expect_1.default)(userAgent).toContain('Chrome');
            }
            else {
                (0, expect_1.default)(userAgent).toContain('Firefox');
            }
        });
    });
    describe('Response.headers', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setRoute('/empty.html', (_req, res) => {
                res.setHeader('foo', 'bar');
                res.end();
            });
            const response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.headers()['foo']).toBe('bar');
        });
    });
    describe('Request.initiator', () => {
        it('should return the initiator', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const initiators = new Map();
            page.on('request', request => {
                return initiators.set(request.url().split('/').pop(), request.initiator());
            });
            await page.goto(server.PREFIX + '/initiator.html');
            (0, expect_1.default)(initiators.get('initiator.html').type).toBe('other');
            (0, expect_1.default)(initiators.get('initiator.js').type).toBe('parser');
            (0, expect_1.default)(initiators.get('initiator.js').url).toBe(server.PREFIX + '/initiator.html');
            (0, expect_1.default)(initiators.get('frame.html').type).toBe('parser');
            (0, expect_1.default)(initiators.get('frame.html').url).toBe(server.PREFIX + '/initiator.html');
            (0, expect_1.default)(initiators.get('script.js').type).toBe('parser');
            (0, expect_1.default)(initiators.get('script.js').url).toBe(server.PREFIX + '/frames/frame.html');
            (0, expect_1.default)(initiators.get('style.css').type).toBe('parser');
            (0, expect_1.default)(initiators.get('style.css').url).toBe(server.PREFIX + '/frames/frame.html');
            (0, expect_1.default)(initiators.get('initiator.js').type).toBe('parser');
            (0, expect_1.default)(initiators.get('injectedfile.js').type).toBe('script');
            (0, expect_1.default)(initiators.get('injectedfile.js').stack.callFrames[0].url).toBe(server.PREFIX + '/initiator.js');
            (0, expect_1.default)(initiators.get('injectedstyle.css').type).toBe('script');
            (0, expect_1.default)(initiators.get('injectedstyle.css').stack.callFrames[0].url).toBe(server.PREFIX + '/initiator.js');
            (0, expect_1.default)(initiators.get('initiator.js').url).toBe(server.PREFIX + '/initiator.html');
        });
    });
    describe('Response.fromCache', function () {
        it('should return |false| for non-cached content', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.fromCache()).toBe(false);
        });
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const responses = new Map();
            page.on('response', r => {
                return (!(0, utils_js_1.isFavicon)(r.request()) && responses.set(r.url().split('/').pop(), r));
            });
            // Load and re-load to make sure it's cached.
            await page.goto(server.PREFIX + '/cached/one-style.html');
            await page.reload();
            (0, expect_1.default)(responses.size).toBe(2);
            (0, expect_1.default)(responses.get('one-style.css').status()).toBe(200);
            (0, expect_1.default)(responses.get('one-style.css').fromCache()).toBe(true);
            (0, expect_1.default)(responses.get('one-style.html').status()).toBe(304);
            (0, expect_1.default)(responses.get('one-style.html').fromCache()).toBe(false);
        });
    });
    describe('Response.fromServiceWorker', function () {
        it('should return |false| for non-service-worker content', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.fromServiceWorker()).toBe(false);
        });
        it('Response.fromServiceWorker', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const responses = new Map();
            page.on('response', r => {
                return !(0, utils_js_1.isFavicon)(r) && responses.set(r.url().split('/').pop(), r);
            });
            // Load and re-load to make sure serviceworker is installed and running.
            await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html', {
                waitUntil: 'networkidle2',
            });
            await page.evaluate(async () => {
                return globalThis.activationPromise;
            });
            await page.reload();
            (0, expect_1.default)(responses.size).toBe(2);
            (0, expect_1.default)(responses.get('sw.html').status()).toBe(200);
            (0, expect_1.default)(responses.get('sw.html').fromServiceWorker()).toBe(true);
            (0, expect_1.default)(responses.get('style.css').status()).toBe(200);
            (0, expect_1.default)(responses.get('style.css').fromServiceWorker()).toBe(true);
        });
    });
    describe('Request.postData', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            server.setRoute('/post', (_req, res) => {
                return res.end();
            });
            const [request] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'request', r => {
                    return !(0, utils_js_1.isFavicon)(r);
                }),
                page.evaluate(() => {
                    return fetch('./post', {
                        method: 'POST',
                        body: JSON.stringify({ foo: 'bar' }),
                    });
                }),
            ]);
            (0, expect_1.default)(request).toBeTruthy();
            (0, expect_1.default)(request.postData()).toBe('{"foo":"bar"}');
        });
        it('should be |undefined| when there is no post data', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.request().postData()).toBe(undefined);
        });
        it('should work with blobs', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            server.setRoute('/post', (_req, res) => {
                return res.end();
            });
            const [request] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'request', r => {
                    return !(0, utils_js_1.isFavicon)(r);
                }),
                page.evaluate(() => {
                    return fetch('./post', {
                        method: 'POST',
                        body: new Blob([JSON.stringify({ foo: 'bar' })], {
                            type: 'application/json',
                        }),
                    });
                }),
            ]);
            (0, expect_1.default)(request).toBeTruthy();
            (0, expect_1.default)(request.postData()).toBe(undefined);
            (0, expect_1.default)(request.hasPostData()).toBe(true);
            (0, expect_1.default)(await request.fetchPostData()).toBe('{"foo":"bar"}');
        });
    });
    describe('Response.text', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.PREFIX + '/simple.json'));
            const responseText = (await response.text()).trimEnd();
            (0, expect_1.default)(responseText).toBe('{"foo": "bar"}');
        });
        it('should return uncompressed text', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.enableGzip('/simple.json');
            const response = (await page.goto(server.PREFIX + '/simple.json'));
            (0, expect_1.default)(response.headers()['content-encoding']).toBe('gzip');
            const responseText = (await response.text()).trimEnd();
            (0, expect_1.default)(responseText).toBe('{"foo": "bar"}');
        });
        it('should throw when requesting body of redirected response', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setRedirect('/foo.html', '/empty.html');
            const response = (await page.goto(server.PREFIX + '/foo.html'));
            const redirectChain = response.request().redirectChain();
            (0, expect_1.default)(redirectChain).toHaveLength(1);
            const redirected = redirectChain[0].response();
            (0, expect_1.default)(redirected.status()).toBe(302);
            let error;
            await redirected.text().catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toContain('Response body is unavailable for redirect responses');
        });
        it('should wait until response completes', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            // Setup server to trap request.
            let serverResponse;
            server.setRoute('/get', (_req, res) => {
                serverResponse = res;
                // In Firefox, |fetch| will be hanging until it receives |Content-Type| header
                // from server.
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.write('hello ');
            });
            // Setup page to trap response.
            let requestFinished = false;
            page.on('requestfinished', r => {
                return (requestFinished = requestFinished || r.url().includes('/get'));
            });
            // send request and wait for server response
            const [pageResponse] = await Promise.all([
                page.waitForResponse(r => {
                    return !(0, utils_js_1.isFavicon)(r.request());
                }),
                page.evaluate(() => {
                    return fetch('./get', { method: 'GET' });
                }),
                server.waitForRequest('/get'),
            ]);
            (0, expect_1.default)(serverResponse).toBeTruthy();
            (0, expect_1.default)(pageResponse).toBeTruthy();
            (0, expect_1.default)(pageResponse.status()).toBe(200);
            (0, expect_1.default)(requestFinished).toBe(false);
            const responseText = pageResponse.text();
            // Write part of the response and wait for it to be flushed.
            await new Promise(x => {
                return serverResponse.write('wor', x);
            });
            // Finish response.
            await new Promise(x => {
                serverResponse.end('ld!', () => {
                    return x();
                });
            });
            (0, expect_1.default)(await responseText).toBe('hello world!');
        });
    });
    describe('Response.json', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.PREFIX + '/simple.json'));
            (0, expect_1.default)(await response.json()).toEqual({ foo: 'bar' });
        });
    });
    describe('Response.buffer', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.PREFIX + '/pptr.png'));
            const imageBuffer = fs_1.default.readFileSync(path_1.default.join(__dirname, '../assets', 'pptr.png'));
            const responseBuffer = await response.buffer();
            (0, expect_1.default)(responseBuffer.equals(imageBuffer)).toBe(true);
        });
        it('should work with compression', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.enableGzip('/pptr.png');
            const response = (await page.goto(server.PREFIX + '/pptr.png'));
            const imageBuffer = fs_1.default.readFileSync(path_1.default.join(__dirname, '../assets', 'pptr.png'));
            const responseBuffer = await response.buffer();
            (0, expect_1.default)(responseBuffer.equals(imageBuffer)).toBe(true);
        });
        it('should throw if the response does not have a body', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/empty.html');
            server.setRoute('/test.html', (_req, res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Headers', 'x-ping');
                res.end('Hello World');
            });
            const url = server.CROSS_PROCESS_PREFIX + '/test.html';
            const responsePromise = (0, utils_js_1.waitEvent)(page, 'response', response => {
                // Get the preflight response.
                return (response.request().method() === 'OPTIONS' && response.url() === url);
            });
            // Trigger a request with a preflight.
            await page.evaluate(async (src) => {
                const response = await fetch(src, {
                    method: 'POST',
                    headers: { 'x-ping': 'pong' },
                });
                return response;
            }, url);
            const response = await responsePromise;
            await (0, expect_1.default)(response.buffer()).rejects.toThrowError('Could not load body for this request. This might happen if the request is a preflight request.');
        });
    });
    describe('Response.statusText', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setRoute('/cool', (_req, res) => {
                res.writeHead(200, 'cool!');
                res.end();
            });
            const response = (await page.goto(server.PREFIX + '/cool'));
            (0, expect_1.default)(response.statusText()).toBe('cool!');
        });
        it('handles missing status text', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setRoute('/nostatus', (_req, res) => {
                res.writeHead(200, '');
                res.end();
            });
            const response = (await page.goto(server.PREFIX + '/nostatus'));
            (0, expect_1.default)(response.statusText()).toBe('');
        });
    });
    describe('Response.timing', function () {
        it('returns timing information', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const responses = [];
            page.on('response', response => {
                return responses.push(response);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(responses).toHaveLength(1);
            (0, expect_1.default)(responses[0].timing().receiveHeadersEnd).toBeGreaterThan(0);
        });
    });
    describe('Network Events', function () {
        it('Page.Events.Request', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = [];
            page.on('request', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(requests).toHaveLength(1);
            const request = requests[0];
            (0, expect_1.default)(request.url()).toBe(server.EMPTY_PAGE);
            (0, expect_1.default)(request.method()).toBe('GET');
            (0, expect_1.default)(request.response()).toBeTruthy();
            (0, expect_1.default)(request.frame() === page.mainFrame()).toBe(true);
            (0, expect_1.default)(request.frame().url()).toBe(server.EMPTY_PAGE);
        });
        it('Page.Events.RequestServedFromCache', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const cached = [];
            page.on('requestservedfromcache', r => {
                return cached.push(r.url().split('/').pop());
            });
            await page.goto(server.PREFIX + '/cached/one-style.html');
            (0, expect_1.default)(cached).toEqual([]);
            await new Promise(res => {
                setTimeout(res, 1000);
            });
            await page.reload();
            (0, expect_1.default)(cached).toEqual(['one-style.css']);
        });
        it('Page.Events.Response', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const responses = [];
            page.on('response', response => {
                return !(0, utils_js_1.isFavicon)(response) && responses.push(response);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(responses).toHaveLength(1);
            const response = responses[0];
            (0, expect_1.default)(response.url()).toBe(server.EMPTY_PAGE);
            (0, expect_1.default)(response.status()).toBe(200);
            (0, expect_1.default)(response.ok()).toBe(true);
            (0, expect_1.default)(response.request()).toBeTruthy();
        });
        it('Page.Events.RequestFailed', async () => {
            const { page, server, isChrome } = await (0, mocha_utils_js_1.getTestState)();
            await page.setRequestInterception(true);
            page.on('request', request => {
                if (request.url().endsWith('css')) {
                    void request.abort();
                }
                else {
                    void request.continue();
                }
            });
            const failedRequests = [];
            page.on('requestfailed', request => {
                return failedRequests.push(request);
            });
            await page.goto(server.PREFIX + '/one-style.html');
            (0, expect_1.default)(failedRequests).toHaveLength(1);
            const failedRequest = failedRequests[0];
            (0, expect_1.default)(failedRequest.url()).toContain('one-style.css');
            (0, expect_1.default)(failedRequest.response()).toBe(null);
            (0, expect_1.default)(failedRequest.frame()).toBeTruthy();
            if (isChrome) {
                (0, expect_1.default)(failedRequest.failure().errorText).toBe('net::ERR_FAILED');
            }
            else {
                (0, expect_1.default)(failedRequest.failure().errorText).toBe('NS_ERROR_FAILURE');
            }
        });
        it('Page.Events.RequestFinished', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = [];
            page.on('requestfinished', request => {
                return !(0, utils_js_1.isFavicon)(request) && requests.push(request);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(requests).toHaveLength(1);
            const request = requests[0];
            (0, expect_1.default)(request.url()).toBe(server.EMPTY_PAGE);
            (0, expect_1.default)(request.response()).toBeTruthy();
            (0, expect_1.default)(request.frame() === page.mainFrame()).toBe(true);
            (0, expect_1.default)(request.frame().url()).toBe(server.EMPTY_PAGE);
        });
        it('should fire events in proper order', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const events = [];
            page.on('request', () => {
                return events.push('request');
            });
            page.on('response', () => {
                return events.push('response');
            });
            page.on('requestfinished', () => {
                return events.push('requestfinished');
            });
            await page.goto(server.EMPTY_PAGE);
            // Events can sneak in after the page has navigate
            (0, expect_1.default)(events.slice(0, 3)).toEqual([
                'request',
                'response',
                'requestfinished',
            ]);
        });
        it('should support redirects', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const events = [];
            page.on('request', request => {
                return events.push(`${request.method()} ${request.url()}`);
            });
            page.on('response', response => {
                return events.push(`${response.status()} ${response.url()}`);
            });
            page.on('requestfinished', request => {
                return events.push(`DONE ${request.url()}`);
            });
            page.on('requestfailed', request => {
                return events.push(`FAIL ${request.url()}`);
            });
            server.setRedirect('/foo.html', '/empty.html');
            const FOO_URL = server.PREFIX + '/foo.html';
            const response = (await page.goto(FOO_URL));
            (0, expect_1.default)(events).toEqual([
                `GET ${FOO_URL}`,
                `302 ${FOO_URL}`,
                `DONE ${FOO_URL}`,
                `GET ${server.EMPTY_PAGE}`,
                `200 ${server.EMPTY_PAGE}`,
                `DONE ${server.EMPTY_PAGE}`,
            ]);
            // Check redirect chain
            const redirectChain = response.request().redirectChain();
            (0, expect_1.default)(redirectChain).toHaveLength(1);
            (0, expect_1.default)(redirectChain[0].url()).toContain('/foo.html');
        });
    });
    describe('Request.isNavigationRequest', () => {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = new Map();
            page.on('request', request => {
                return requests.set(request.url().split('/').pop(), request);
            });
            server.setRedirect('/rrredirect', '/frames/one-frame.html');
            await page.goto(server.PREFIX + '/rrredirect');
            (0, expect_1.default)(requests.get('rrredirect').isNavigationRequest()).toBe(true);
            (0, expect_1.default)(requests.get('one-frame.html').isNavigationRequest()).toBe(true);
            (0, expect_1.default)(requests.get('frame.html').isNavigationRequest()).toBe(true);
            (0, expect_1.default)(requests.get('script.js').isNavigationRequest()).toBe(false);
            (0, expect_1.default)(requests.get('style.css').isNavigationRequest()).toBe(false);
        });
        it('should work with request interception', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const requests = new Map();
            page.on('request', request => {
                requests.set(request.url().split('/').pop(), request);
                void request.continue();
            });
            await page.setRequestInterception(true);
            server.setRedirect('/rrredirect', '/frames/one-frame.html');
            await page.goto(server.PREFIX + '/rrredirect');
            (0, expect_1.default)(requests.get('rrredirect').isNavigationRequest()).toBe(true);
            (0, expect_1.default)(requests.get('one-frame.html').isNavigationRequest()).toBe(true);
            (0, expect_1.default)(requests.get('frame.html').isNavigationRequest()).toBe(true);
            (0, expect_1.default)(requests.get('script.js').isNavigationRequest()).toBe(false);
            (0, expect_1.default)(requests.get('style.css').isNavigationRequest()).toBe(false);
        });
        it('should work when navigating to image', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const [request] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'request'),
                page.goto(server.PREFIX + '/pptr.png'),
            ]);
            (0, expect_1.default)(request.isNavigationRequest()).toBe(true);
        });
    });
    describe('Page.setExtraHTTPHeaders', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.setExtraHTTPHeaders({
                foo: 'bar',
            });
            const [request] = await Promise.all([
                server.waitForRequest('/empty.html'),
                page.goto(server.EMPTY_PAGE),
            ]);
            (0, expect_1.default)(request.headers['foo']).toBe('bar');
        });
        it('should throw for non-string header values', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            try {
                // @ts-expect-error purposeful bad input
                await page.setExtraHTTPHeaders({ foo: 1 });
            }
            catch (error_) {
                error = error_;
            }
            (0, expect_1.default)(error.message).toBe('Expected value of header "foo" to be String, but "number" is found.');
        });
    });
    describe('Page.authenticate', function () {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setAuth('/empty.html', 'user', 'pass');
            let response;
            try {
                response = (await page.goto(server.EMPTY_PAGE));
                (0, expect_1.default)(response.status()).toBe(401);
            }
            catch (error) {
                // In headful, an error is thrown instead of 401.
                if (!error.message?.includes('net::ERR_INVALID_AUTH_CREDENTIALS')) {
                    throw error;
                }
            }
            await page.authenticate({
                username: 'user',
                password: 'pass',
            });
            response = (await page.reload());
            (0, expect_1.default)(response.status()).toBe(200);
        });
        it('should fail if wrong credentials', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Use unique user/password since Chrome caches credentials per origin.
            server.setAuth('/empty.html', 'user2', 'pass2');
            await page.authenticate({
                username: 'foo',
                password: 'bar',
            });
            const response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.status()).toBe(401);
        });
        it('should allow disable authentication', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Use unique user/password since Chrome caches credentials per origin.
            server.setAuth('/empty.html', 'user3', 'pass3');
            await page.authenticate({
                username: 'user3',
                password: 'pass3',
            });
            let response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.status()).toBe(200);
            await page.authenticate({
                username: '',
                password: '',
            });
            // Navigate to a different origin to bust Chrome's credential caching.
            try {
                response = (await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html'));
                (0, expect_1.default)(response.status()).toBe(401);
            }
            catch (error) {
                // In headful, an error is thrown instead of 401.
                if (!error.message?.includes('net::ERR_INVALID_AUTH_CREDENTIALS')) {
                    throw error;
                }
            }
        });
        it('should not disable caching', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Use unique user/password since Chrome caches credentials per origin.
            server.setAuth('/cached/one-style.css', 'user4', 'pass4');
            server.setAuth('/cached/one-style.html', 'user4', 'pass4');
            await page.authenticate({
                username: 'user4',
                password: 'pass4',
            });
            const responses = new Map();
            page.on('response', r => {
                return responses.set(r.url().split('/').pop(), r);
            });
            // Load and re-load to make sure it's cached.
            await page.goto(server.PREFIX + '/cached/one-style.html');
            await page.reload();
            (0, expect_1.default)(responses.get('one-style.css').status()).toBe(200);
            (0, expect_1.default)(responses.get('one-style.css').fromCache()).toBe(true);
            (0, expect_1.default)(responses.get('one-style.html').status()).toBe(304);
            (0, expect_1.default)(responses.get('one-style.html').fromCache()).toBe(false);
        });
    });
    describe('raw network headers', () => {
        it('Same-origin set-cookie navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const setCookieString = 'foo=bar';
            server.setRoute('/empty.html', (_req, res) => {
                res.setHeader('set-cookie', setCookieString);
                res.end('hello world');
            });
            const response = (await page.goto(server.EMPTY_PAGE));
            (0, expect_1.default)(response.headers()['set-cookie']).toBe(setCookieString);
        });
        it('Same-origin set-cookie subresource', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const setCookieString = 'foo=bar';
            server.setRoute('/foo', (_req, res) => {
                res.setHeader('set-cookie', setCookieString);
                res.end('hello world');
            });
            const [response] = await Promise.all([
                (0, utils_js_1.waitEvent)(page, 'response', res => {
                    return !(0, utils_js_1.isFavicon)(res);
                }),
                page.evaluate(() => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', '/foo');
                    xhr.send();
                }),
            ]);
            (0, expect_1.default)(response.headers()['set-cookie']).toBe(setCookieString);
        });
        it('Cross-origin set-cookie', async () => {
            const { page, httpsServer, close } = await (0, mocha_utils_js_1.launch)({
                ignoreHTTPSErrors: true,
            });
            try {
                await page.goto(httpsServer.PREFIX + '/empty.html');
                const setCookieString = 'hello=world';
                httpsServer.setRoute('/setcookie.html', (_req, res) => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('set-cookie', setCookieString);
                    res.end();
                });
                await page.goto(httpsServer.PREFIX + '/setcookie.html');
                const url = httpsServer.CROSS_PROCESS_PREFIX + '/setcookie.html';
                const [response] = await Promise.all([
                    (0, utils_js_1.waitEvent)(page, 'response', response => {
                        return response.url() === url;
                    }),
                    page.evaluate(src => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', src);
                        xhr.send();
                    }, url),
                ]);
                (0, expect_1.default)(response.headers()['set-cookie']).toBe(setCookieString);
            }
            finally {
                await close();
            }
        });
    });
    describe('Page.setBypassServiceWorker', () => {
        it('bypass for network', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const responses = new Map();
            page.on('response', r => {
                return !(0, utils_js_1.isFavicon)(r) && responses.set(r.url().split('/').pop(), r);
            });
            // Load and re-load to make sure serviceworker is installed and running.
            await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html', {
                waitUntil: 'networkidle2',
            });
            await page.evaluate(async () => {
                return globalThis.activationPromise;
            });
            await page.reload({
                waitUntil: 'networkidle2',
            });
            (0, expect_1.default)(page.isServiceWorkerBypassed()).toBe(false);
            (0, expect_1.default)(responses.size).toBe(2);
            (0, expect_1.default)(responses.get('sw.html').status()).toBe(200);
            (0, expect_1.default)(responses.get('sw.html').fromServiceWorker()).toBe(true);
            (0, expect_1.default)(responses.get('style.css').status()).toBe(200);
            (0, expect_1.default)(responses.get('style.css').fromServiceWorker()).toBe(true);
            await page.setBypassServiceWorker(true);
            await page.reload({
                waitUntil: 'networkidle2',
            });
            (0, expect_1.default)(page.isServiceWorkerBypassed()).toBe(true);
            (0, expect_1.default)(responses.get('sw.html').status()).toBe(200);
            (0, expect_1.default)(responses.get('sw.html').fromServiceWorker()).toBe(false);
            (0, expect_1.default)(responses.get('style.css').status()).toBe(200);
            (0, expect_1.default)(responses.get('style.css').fromServiceWorker()).toBe(false);
        });
    });
    describe('Request.resourceType', () => {
        it('should work for document type', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = await page.goto(server.EMPTY_PAGE);
            const request = response.request();
            (0, expect_1.default)(request.resourceType()).toBe('document');
        });
        it('should work for stylesheets', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const cssRequests = [];
            page.on('request', request => {
                if (request.url().endsWith('css')) {
                    cssRequests.push(request);
                }
            });
            await page.goto(server.PREFIX + '/one-style.html');
            (0, expect_1.default)(cssRequests).toHaveLength(1);
            const request = cssRequests[0];
            (0, expect_1.default)(request.url()).toContain('one-style.css');
            (0, expect_1.default)(request.resourceType()).toBe('stylesheet');
        });
    });
    describe('Response.remoteAddress', () => {
        it('should work', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            const response = (await page.goto(server.EMPTY_PAGE));
            const remoteAddress = response.remoteAddress();
            // Either IPv6 or IPv4, depending on environment.
            (0, expect_1.default)(remoteAddress.ip.includes('::1') || remoteAddress.ip === '127.0.0.1').toBe(true);
            (0, expect_1.default)(remoteAddress.port).toBe(server.PORT);
        });
        it('should support redirects', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            server.setRedirect('/foo.html', '/empty.html');
            const FOO_URL = server.PREFIX + '/foo.html';
            const response = (await page.goto(FOO_URL));
            // Check redirect chain
            const redirectChain = response.request().redirectChain();
            (0, expect_1.default)(redirectChain).toHaveLength(1);
            (0, expect_1.default)(redirectChain[0].url()).toContain('/foo.html');
            (0, expect_1.default)(redirectChain[0].response().remoteAddress().port).toBe(server.PORT);
        });
    });
});
//# sourceMappingURL=network.spec.js.map