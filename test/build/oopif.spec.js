"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
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
const CDPSession_js_1 = require("puppeteer-core/internal/api/CDPSession.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('OOPIF', function () {
    /* We use a special browser for this test as we need the --site-per-process flag */
    let state;
    before(async () => {
        const { defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({ skipLaunch: true });
        state = await (0, mocha_utils_js_1.launch)(Object.assign({}, defaultBrowserOptions, {
            args: (defaultBrowserOptions.args || []).concat([
                '--site-per-process',
                '--remote-debugging-port=21222',
                '--host-rules=MAP * 127.0.0.1',
            ]),
        }), { after: 'all' });
    });
    beforeEach(async () => {
        state.context = await state.browser.createBrowserContext();
        state.page = await state.context.newPage();
    });
    afterEach(async () => {
        await state.context.close();
    });
    after(async () => {
        await state.close();
    });
    it('should treat OOP iframes and normal iframes the same', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return frame.url().endsWith('/empty.html');
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
        await (0, utils_js_1.attachFrame)(page, 'frame2', server.CROSS_PROCESS_PREFIX + '/empty.html');
        await framePromise;
        (0, expect_1.default)(page.mainFrame().childFrames()).toHaveLength(2);
    });
    it('should track navigations within OOP iframes', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        const frame = await framePromise;
        (0, expect_1.default)(frame.url()).toContain('/empty.html');
        await (0, utils_js_1.navigateFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/assets/frame.html');
        (0, expect_1.default)(frame.url()).toContain('/assets/frame.html');
    });
    it('should support OOP iframes becoming normal iframes again', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
        const frame = await framePromise;
        (0, expect_1.default)(frame.isOOPFrame()).toBe(false);
        await (0, utils_js_1.navigateFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        (0, expect_1.default)(frame.isOOPFrame()).toBe(true);
        await (0, utils_js_1.navigateFrame)(page, 'frame1', server.EMPTY_PAGE);
        (0, expect_1.default)(frame.isOOPFrame()).toBe(false);
        (0, expect_1.default)(page.frames()).toHaveLength(2);
    });
    it('should support frames within OOP frames', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const frame1Promise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        const frame2Promise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 2;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/frames/one-frame.html');
        const [frame1, frame2] = await Promise.all([frame1Promise, frame2Promise]);
        (0, expect_1.default)(await frame1.evaluate(() => {
            return document.location.href;
        })).toMatch(/one-frame\.html$/);
        (0, expect_1.default)(await frame2.evaluate(() => {
            return document.location.href;
        })).toMatch(/frames\/frame\.html$/);
    });
    it('should support OOP iframes getting detached', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
        const frame = await framePromise;
        (0, expect_1.default)(frame.isOOPFrame()).toBe(false);
        await (0, utils_js_1.navigateFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        (0, expect_1.default)(frame.isOOPFrame()).toBe(true);
        await (0, utils_js_1.detachFrame)(page, 'frame1');
        (0, expect_1.default)(page.frames()).toHaveLength(1);
    });
    it('should support wait for navigation for transitions from local to OOPIF', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
        const frame = await framePromise;
        (0, expect_1.default)(frame.isOOPFrame()).toBe(false);
        const nav = frame.waitForNavigation();
        await (0, utils_js_1.navigateFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        await nav;
        (0, expect_1.default)(frame.isOOPFrame()).toBe(true);
        await (0, utils_js_1.detachFrame)(page, 'frame1');
        (0, expect_1.default)(page.frames()).toHaveLength(1);
    });
    it('should keep track of a frames OOP state', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        const frame = await framePromise;
        (0, expect_1.default)(frame.url()).toContain('/empty.html');
        await (0, utils_js_1.navigateFrame)(page, 'frame1', server.EMPTY_PAGE);
        (0, expect_1.default)(frame.url()).toBe(server.EMPTY_PAGE);
    });
    it('should support evaluating in oop iframes', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        const frame = await framePromise;
        await frame.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            _test = 'Test 123!';
        });
        const result = await frame.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            return window._test;
        });
        (0, expect_1.default)(result).toBe('Test 123!');
    });
    it('should provide access to elements', async () => {
        const { server, isHeadless, headless, page } = state;
        if (!isHeadless || headless === 'true') {
            // TODO: this test is partially blocked on crbug.com/1334119. Enable test once
            // the upstream is fixed.
            // TLDR: when we dispatch events to the frame the compositor might
            // not be up-to-date yet resulting in a misclick (the iframe element
            // becomes the event target instead of the content inside the iframe).
            // The solution is to use InsertVisualCallback on the backend but that causes
            // another issue that events cannot be dispatched to inactive tabs as the
            // visual callback is never invoked.
            // The old headless mode does not have this issue since it operates with
            // special scheduling settings that keep even inactive tabs updating.
            return;
        }
        await page.goto(server.EMPTY_PAGE);
        const framePromise = page.waitForFrame(frame => {
            return page.frames().indexOf(frame) === 1;
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        const frame = await framePromise;
        await frame.evaluate(() => {
            const button = document.createElement('button');
            button.id = 'test-button';
            button.innerText = 'click';
            button.onclick = () => {
                button.id = 'clicked';
            };
            document.body.appendChild(button);
        });
        await page.evaluate(() => {
            document.body.style.border = '150px solid black';
            document.body.style.margin = '250px';
            document.body.style.padding = '50px';
        });
        await frame.waitForSelector('#test-button', { visible: true });
        await frame.click('#test-button');
        await frame.waitForSelector('#clicked');
    });
    it('should report oopif frames', async () => {
        const { server, page } = state;
        const frame = page.waitForFrame(frame => {
            return frame.url().endsWith('/oopif.html');
        });
        await page.goto(server.PREFIX + '/dynamic-oopif.html');
        await frame;
        (0, expect_1.default)(await iframes(page)).toHaveLength(1);
        (0, expect_1.default)(page.frames()).toHaveLength(2);
    });
    it('should wait for inner OOPIFs', async () => {
        const { server, page } = state;
        await page.goto(`http://mainframe:${server.PORT}/main-frame.html`);
        const frame2 = await page.waitForFrame(frame => {
            return frame.url().endsWith('inner-frame2.html');
        });
        (0, expect_1.default)(await iframes(page)).toHaveLength(2);
        (0, expect_1.default)(page.frames().filter(frame => {
            return frame.isOOPFrame();
        })).toHaveLength(2);
        (0, expect_1.default)(await frame2.evaluate(() => {
            return document.querySelectorAll('button').length;
        })).toStrictEqual(1);
    });
    it('should load oopif iframes with subresources and request interception', async () => {
        const { server, page } = state;
        const framePromise = page.waitForFrame(frame => {
            return frame.url().endsWith('/oopif.html');
        });
        page.on('request', request => {
            void request.continue();
        });
        await page.setRequestInterception(true);
        const requestPromise = page.waitForRequest(request => {
            return request.url().includes('requestFromOOPIF');
        });
        await page.goto(server.PREFIX + '/dynamic-oopif.html');
        const frame = await framePromise;
        const request = await requestPromise;
        (0, expect_1.default)(await iframes(page)).toHaveLength(1);
        (0, expect_1.default)(request.frame()).toBe(frame);
    });
    it('should support frames within OOP iframes', async () => {
        const { server, page } = state;
        const oopIframePromise = page.waitForFrame(frame => {
            return frame.url().endsWith('/oopif.html');
        });
        await page.goto(server.PREFIX + '/dynamic-oopif.html');
        const oopIframe = await oopIframePromise;
        await (0, utils_js_1.attachFrame)(oopIframe, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
        const frame1 = oopIframe.childFrames()[0];
        (0, expect_1.default)(frame1.url()).toMatch(/empty.html$/);
        await (0, utils_js_1.navigateFrame)(oopIframe, 'frame1', server.CROSS_PROCESS_PREFIX + '/oopif.html');
        (0, expect_1.default)(frame1.url()).toMatch(/oopif.html$/);
        await frame1.goto(server.CROSS_PROCESS_PREFIX + '/oopif.html#navigate-within-document', { waitUntil: 'load' });
        (0, expect_1.default)(frame1.url()).toMatch(/oopif.html#navigate-within-document$/);
        await (0, utils_js_1.detachFrame)(oopIframe, 'frame1');
        (0, expect_1.default)(oopIframe.childFrames()).toHaveLength(0);
    });
    it('clickablePoint, boundingBox, boxModel should work for elements inside OOPIFs', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { server, page } = state;
            await page.goto(server.EMPTY_PAGE);
            const framePromise = page.waitForFrame(frame => {
                return page.frames().indexOf(frame) === 1;
            });
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.CROSS_PROCESS_PREFIX + '/empty.html');
            const frame = await framePromise;
            await page.evaluate(() => {
                document.body.style.border = '50px solid black';
                document.body.style.margin = '50px';
                document.body.style.padding = '50px';
            });
            await frame.evaluate(() => {
                const button = document.createElement('button');
                button.id = 'test-button';
                button.innerText = 'click';
                document.body.appendChild(button);
            });
            const button = __addDisposableResource(env_1, (await frame.waitForSelector('#test-button', {
                visible: true,
            })), false);
            const result = await button.clickablePoint();
            (0, expect_1.default)(result.x).toBeGreaterThan(150); // padding + margin + border left
            (0, expect_1.default)(result.y).toBeGreaterThan(150); // padding + margin + border top
            const resultBoxModel = (await button.boxModel());
            for (const quad of [
                resultBoxModel.content,
                resultBoxModel.border,
                resultBoxModel.margin,
                resultBoxModel.padding,
            ]) {
                for (const part of quad) {
                    (0, expect_1.default)(part.x).toBeGreaterThan(150); // padding + margin + border left
                    (0, expect_1.default)(part.y).toBeGreaterThan(150); // padding + margin + border top
                }
            }
            const resultBoundingBox = (await button.boundingBox());
            (0, expect_1.default)(resultBoundingBox.x).toBeGreaterThan(150); // padding + margin + border left
            (0, expect_1.default)(resultBoundingBox.y).toBeGreaterThan(150); // padding + margin + border top
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('should detect existing OOPIFs when Puppeteer connects to an existing page', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { server, puppeteer, page } = state;
            const frame = page.waitForFrame(frame => {
                return frame.url().endsWith('/oopif.html');
            });
            await page.goto(server.PREFIX + '/dynamic-oopif.html');
            await frame;
            (0, expect_1.default)(await iframes(page)).toHaveLength(1);
            (0, expect_1.default)(page.frames()).toHaveLength(2);
            const browserURL = 'http://127.0.0.1:21222';
            const browser1 = __addDisposableResource(env_2, await puppeteer.connect({ browserURL }), false);
            const target = await browser1.waitForTarget(target => {
                return target.url().endsWith('dynamic-oopif.html');
            });
            await target.page();
            await browser1.disconnect();
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    it('should support lazy OOP frames', async () => {
        const { server, page } = state;
        await page.goto(server.PREFIX + '/lazy-oopif-frame.html');
        await page.setViewport({ width: 1000, height: 1000 });
        (0, expect_1.default)(page.frames().map(frame => {
            return frame._hasStartedLoading;
        })).toEqual([true, true, false]);
    });
    it('should exposeFunction on a page with a PDF viewer', async () => {
        const { page, server } = state;
        await page.goto(server.PREFIX + '/pdf-viewer.html', {
            waitUntil: 'networkidle2',
        });
        await page.exposeFunction('test', () => {
            console.log('test');
        });
    });
    it('should evaluate on a page with a PDF viewer', async () => {
        const { page, server } = state;
        await page.goto(server.PREFIX + '/pdf-viewer.html', {
            waitUntil: 'networkidle2',
        });
        (0, expect_1.default)(await Promise.all(page.frames().map(async (frame) => {
            return await frame.evaluate(() => {
                return window.location.pathname;
            });
        }))).toEqual([
            '/pdf-viewer.html',
            '/sample.pdf',
            '/index.html',
            '/sample.pdf',
        ]);
    });
    describe('waitForFrame', () => {
        it('should resolve immediately if the frame already exists', async () => {
            const { server, page } = state;
            await page.goto(server.EMPTY_PAGE);
            await (0, utils_js_1.attachFrame)(page, 'frame2', server.CROSS_PROCESS_PREFIX + '/empty.html');
            await page.waitForFrame(frame => {
                return frame.url().endsWith('/empty.html');
            });
        });
    });
    it('should report google.com frame', async () => {
        const { server, page } = state;
        await page.goto(server.EMPTY_PAGE);
        await page.setRequestInterception(true);
        page.on('request', r => {
            return r.respond({ body: 'YO, GOOGLE.COM' });
        });
        await page.evaluate(() => {
            const frame = document.createElement('iframe');
            frame.setAttribute('src', 'https://google.com/');
            document.body.appendChild(frame);
            return new Promise(x => {
                return (frame.onload = x);
            });
        });
        await page.waitForSelector('iframe[src="https://google.com/"]');
        const urls = page
            .frames()
            .map(frame => {
            return frame.url();
        })
            .sort();
        (0, expect_1.default)(urls).toEqual([server.EMPTY_PAGE, 'https://google.com/']);
    });
    it('should expose events within OOPIFs', async () => {
        const { server, page } = state;
        // Setup our session listeners to observe OOPIF activity.
        const session = await page.createCDPSession();
        const networkEvents = [];
        const otherSessions = [];
        await session.send('Target.setAutoAttach', {
            autoAttach: true,
            flatten: true,
            waitForDebuggerOnStart: true,
        });
        session.on(CDPSession_js_1.CDPSessionEvent.SessionAttached, async (session) => {
            otherSessions.push(session);
            session.on('Network.requestWillBeSent', params => {
                return networkEvents.push(params.request.url);
            });
            await session.send('Network.enable');
            await session.send('Runtime.runIfWaitingForDebugger');
        });
        // Navigate to the empty page and add an OOPIF iframe with at least one request.
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate((frameUrl) => {
            const frame = document.createElement('iframe');
            frame.setAttribute('src', frameUrl);
            document.body.appendChild(frame);
            return new Promise((x, y) => {
                frame.onload = x;
                frame.onerror = y;
            });
        }, server.PREFIX.replace('localhost', 'oopifdomain') + '/one-style.html');
        await page.waitForSelector('iframe');
        // Ensure we found the iframe session.
        (0, expect_1.default)(otherSessions).toHaveLength(1);
        // Resume the iframe and trigger another request.
        const iframeSession = otherSessions[0];
        await iframeSession.send('Runtime.evaluate', {
            expression: `fetch('/fetch')`,
            awaitPromise: true,
        });
        (0, expect_1.default)(networkEvents).toContain(`http://oopifdomain:${server.PORT}/fetch`);
    });
});
async function iframes(page) {
    const iframes = await Promise.all(page.frames().map(async (frame) => {
        return await frame.frameElement();
    }));
    return iframes.filter(frame => {
        return frame !== null;
    });
}
//# sourceMappingURL=oopif.spec.js.map