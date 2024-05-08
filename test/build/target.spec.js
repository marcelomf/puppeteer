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
const expect_1 = __importDefault(require("expect"));
const puppeteer_1 = require("puppeteer");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('Target', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('Browser.targets should return all of the targets', async () => {
        const { browser } = await (0, mocha_utils_js_1.getTestState)();
        // The pages will be the testing page and the original newtab page
        const targets = browser.targets();
        (0, expect_1.default)(targets.some(target => {
            return target.type() === 'page' && target.url() === 'about:blank';
        })).toBeTruthy();
        (0, expect_1.default)(targets.some(target => {
            return target.type() === 'browser';
        })).toBeTruthy();
    });
    it('Browser.pages should return all of the pages', async () => {
        const { page, context } = await (0, mocha_utils_js_1.getTestState)();
        // The pages will be the testing page
        const allPages = await context.pages();
        (0, expect_1.default)(allPages).toHaveLength(1);
        (0, expect_1.default)(allPages).toContain(page);
    });
    it('should contain browser target', async () => {
        const { browser } = await (0, mocha_utils_js_1.getTestState)();
        const targets = browser.targets();
        const browserTarget = targets.find(target => {
            return target.type() === 'browser';
        });
        (0, expect_1.default)(browserTarget).toBeTruthy();
    });
    it('should be able to use the default page in the browser', async () => {
        const { page, browser } = await (0, mocha_utils_js_1.getTestState)();
        // The pages will be the testing page and the original newtab page
        const allPages = await browser.pages();
        const originalPage = allPages.find(p => {
            return p !== page;
        });
        (0, expect_1.default)(await originalPage.evaluate(() => {
            return ['Hello', 'world'].join(' ');
        })).toBe('Hello world');
        (0, expect_1.default)(await originalPage.$('body')).toBeTruthy();
    });
    it('should be able to use async waitForTarget', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        const [otherPage] = await Promise.all([
            context
                .waitForTarget(target => {
                return target.page().then(page => {
                    return (page.url() === server.CROSS_PROCESS_PREFIX + '/empty.html');
                });
            }, { timeout: 3000 })
                .then(target => {
                return target.page();
            }),
            page.evaluate((url) => {
                return window.open(url);
            }, server.CROSS_PROCESS_PREFIX + '/empty.html'),
        ]);
        (0, expect_1.default)(otherPage.url()).toEqual(server.CROSS_PROCESS_PREFIX + '/empty.html');
        (0, expect_1.default)(page).not.toBe(otherPage);
    });
    it('should report when a new page is created and closed', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        const [otherPage] = await Promise.all([
            context
                .waitForTarget(target => {
                return target.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
            }, { timeout: 3000 })
                .then(target => {
                return target.page();
            }),
            page.evaluate((url) => {
                return window.open(url);
            }, server.CROSS_PROCESS_PREFIX + '/empty.html'),
        ]);
        (0, expect_1.default)(otherPage.url()).toContain(server.CROSS_PROCESS_PREFIX);
        (0, expect_1.default)(await otherPage.evaluate(() => {
            return ['Hello', 'world'].join(' ');
        })).toBe('Hello world');
        (0, expect_1.default)(await otherPage.$('body')).toBeTruthy();
        let allPages = await context.pages();
        (0, expect_1.default)(allPages).toContain(page);
        (0, expect_1.default)(allPages).toContain(otherPage);
        const [closedTarget] = await Promise.all([
            (0, utils_js_1.waitEvent)(context, 'targetdestroyed'),
            otherPage.close(),
        ]);
        (0, expect_1.default)(await closedTarget.page()).toBe(otherPage);
        allPages = (await Promise.all(context.targets().map(target => {
            return target.page();
        })));
        (0, expect_1.default)(allPages).toContain(page);
        (0, expect_1.default)(allPages).not.toContain(otherPage);
    });
    it('should report when a service worker is created and destroyed', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        const createdTarget = (0, utils_js_1.waitEvent)(context, 'targetcreated');
        await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');
        (0, expect_1.default)((await createdTarget).type()).toBe('service_worker');
        (0, expect_1.default)((await createdTarget).url()).toBe(server.PREFIX + '/serviceworkers/empty/sw.js');
        const destroyedTarget = (0, utils_js_1.waitEvent)(context, 'targetdestroyed');
        await page.evaluate(() => {
            return globalThis.registrationPromise.then((registration) => {
                return registration.unregister();
            });
        });
        (0, expect_1.default)(await destroyedTarget).toBe(await createdTarget);
    });
    it('should create a worker from a service worker', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');
        const target = await context.waitForTarget(target => {
            return target.type() === 'service_worker';
        }, { timeout: 3000 });
        const worker = (await target.worker());
        (0, expect_1.default)(await worker.evaluate(() => {
            return self.toString();
        })).toBe('[object ServiceWorkerGlobalScope]');
    });
    it('should close a service worker', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');
        const target = await context.waitForTarget(target => {
            return target.type() === 'service_worker';
        }, { timeout: 3000 });
        const worker = (await target.worker());
        const onceDestroyed = new Promise(resolve => {
            context.once('targetdestroyed', event => {
                resolve(event);
            });
        });
        await worker.close();
        (0, expect_1.default)(await onceDestroyed).toBe(target);
    });
    it('should create a worker from a shared worker', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate(() => {
            new SharedWorker('data:text/javascript,console.log("hi")');
        });
        const target = await context.waitForTarget(target => {
            return target.type() === 'shared_worker';
        }, { timeout: 3000 });
        const worker = (await target.worker());
        (0, expect_1.default)(await worker.evaluate(() => {
            return self.toString();
        })).toBe('[object SharedWorkerGlobalScope]');
    });
    it('should close a shared worker', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate(() => {
            new SharedWorker('data:text/javascript,console.log("hi2")');
        });
        const target = await context.waitForTarget(target => {
            return target.type() === 'shared_worker';
        }, { timeout: 3000 });
        const worker = (await target.worker());
        const onceDestroyed = new Promise(resolve => {
            context.once('targetdestroyed', event => {
                resolve(event);
            });
        });
        await worker.close();
        (0, expect_1.default)(await onceDestroyed).toBe(target);
    });
    it('should report when a target url changes', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        let changedTarget = (0, utils_js_1.waitEvent)(context, 'targetchanged');
        await page.goto(server.CROSS_PROCESS_PREFIX + '/');
        (0, expect_1.default)((await changedTarget).url()).toBe(server.CROSS_PROCESS_PREFIX + '/');
        changedTarget = (0, utils_js_1.waitEvent)(context, 'targetchanged');
        await page.goto(server.EMPTY_PAGE);
        (0, expect_1.default)((await changedTarget).url()).toBe(server.EMPTY_PAGE);
    });
    it('should not report uninitialized pages', async () => {
        const { context } = await (0, mocha_utils_js_1.getTestState)();
        let targetChanged = false;
        const listener = () => {
            targetChanged = true;
        };
        context.on('targetchanged', listener);
        const targetPromise = (0, utils_js_1.waitEvent)(context, 'targetcreated');
        const newPagePromise = context.newPage();
        const target = await targetPromise;
        (0, expect_1.default)(target.url()).toBe('about:blank');
        const newPage = await newPagePromise;
        const targetPromise2 = (0, utils_js_1.waitEvent)(context, 'targetcreated');
        const evaluatePromise = newPage.evaluate(() => {
            return window.open('about:blank');
        });
        const target2 = await targetPromise2;
        (0, expect_1.default)(target2.url()).toBe('about:blank');
        await evaluatePromise;
        await newPage.close();
        (0, expect_1.default)(targetChanged).toBe(false);
        context.off('targetchanged', listener);
    });
    it('should not crash while redirecting if original request was missed', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        let serverResponse;
        server.setRoute('/one-style.css', (_req, res) => {
            return (serverResponse = res);
        });
        // Open a new page. Use window.open to connect to the page later.
        await Promise.all([
            page.evaluate((url) => {
                return window.open(url);
            }, server.PREFIX + '/one-style.html'),
            server.waitForRequest('/one-style.css'),
        ]);
        // Connect to the opened page.
        const target = await context.waitForTarget(target => {
            return target.url().includes('one-style.html');
        }, { timeout: 3000 });
        const newPage = (await target.page());
        const loadEvent = (0, utils_js_1.waitEvent)(newPage, 'load');
        // Issue a redirect.
        serverResponse.writeHead(302, { location: '/injectedstyle.css' });
        serverResponse.end();
        // Wait for the new page to load.
        await loadEvent;
        // Cleanup.
        await newPage.close();
    });
    it('should have an opener', async () => {
        const { page, server, context } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.EMPTY_PAGE);
        const [createdTarget] = await Promise.all([
            (0, utils_js_1.waitEvent)(context, 'targetcreated'),
            page.goto(server.PREFIX + '/popup/window-open.html'),
        ]);
        (0, expect_1.default)((await createdTarget.page()).url()).toBe(server.PREFIX + '/popup/popup.html');
        (0, expect_1.default)(createdTarget.opener()).toBe(page.target());
        (0, expect_1.default)(page.target().opener()).toBeUndefined();
    });
    describe('Browser.waitForTarget', () => {
        it('should wait for a target', async () => {
            const { browser, server, context } = await (0, mocha_utils_js_1.getTestState)();
            let resolved = false;
            const targetPromise = browser.waitForTarget(target => {
                return target.url() === server.EMPTY_PAGE;
            }, { timeout: 3000 });
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
            await page.close();
        });
        it('should timeout waiting for a non-existent target', async () => {
            const { browser, server } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await browser
                .waitForTarget(target => {
                return target.url() === server.PREFIX + '/does-not-exist.html';
            }, {
                timeout: 1,
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
    });
});
//# sourceMappingURL=target.spec.js.map