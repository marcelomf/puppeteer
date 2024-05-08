"use strict";
/**
 * @license
 * Copyright 2020 Google Inc.
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
const assert_1 = __importDefault(require("assert"));
const expect_1 = __importDefault(require("expect"));
const puppeteer_1 = require("puppeteer");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('AriaQueryHandler', () => {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('parseAriaSelector', () => {
        it('should find button', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<button id="btn" role="button"> Submit  button   and some spaces  </button>');
                const expectFound = async (button) => {
                    (0, assert_1.default)(button);
                    const id = await button.evaluate((button) => {
                        return button.id;
                    });
                    (0, expect_1.default)(id).toBe('btn');
                };
                {
                    const env_2 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_2, await page.$('aria/Submit button and some spaces[role="button"]'), false);
                        await expectFound(button);
                    }
                    catch (e_1) {
                        env_2.error = e_1;
                        env_2.hasError = true;
                    }
                    finally {
                        __disposeResources(env_2);
                    }
                }
                {
                    const env_3 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_3, await page.$("aria/Submit button and some spaces[role='button']"), false);
                        await expectFound(button);
                    }
                    catch (e_2) {
                        env_3.error = e_2;
                        env_3.hasError = true;
                    }
                    finally {
                        __disposeResources(env_3);
                    }
                }
                const button = __addDisposableResource(env_1, await page.$('aria/  Submit button and some spaces[role="button"]'), false);
                await expectFound(button);
                {
                    const env_4 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_4, await page.$('aria/Submit button and some spaces  [role="button"]'), false);
                        await expectFound(button);
                    }
                    catch (e_3) {
                        env_4.error = e_3;
                        env_4.hasError = true;
                    }
                    finally {
                        __disposeResources(env_4);
                    }
                }
                {
                    const env_5 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_5, await page.$('aria/Submit  button   and  some  spaces   [  role  =  "button" ] '), false);
                        await expectFound(button);
                    }
                    catch (e_4) {
                        env_5.error = e_4;
                        env_5.hasError = true;
                    }
                    finally {
                        __disposeResources(env_5);
                    }
                }
                {
                    const env_6 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_6, await page.$('aria/[role="button"]Submit button and some spaces'), false);
                        await expectFound(button);
                    }
                    catch (e_5) {
                        env_6.error = e_5;
                        env_6.hasError = true;
                    }
                    finally {
                        __disposeResources(env_6);
                    }
                }
                {
                    const env_7 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_7, await page.$('aria/Submit button [role="button"]and some spaces'), false);
                        await expectFound(button);
                    }
                    catch (e_6) {
                        env_7.error = e_6;
                        env_7.hasError = true;
                    }
                    finally {
                        __disposeResources(env_7);
                    }
                }
                {
                    const env_8 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_8, await page.$('aria/[name="  Submit  button and some  spaces"][role="button"]'), false);
                        await expectFound(button);
                    }
                    catch (e_7) {
                        env_8.error = e_7;
                        env_8.hasError = true;
                    }
                    finally {
                        __disposeResources(env_8);
                    }
                }
                {
                    const env_9 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_9, await page.$("aria/[name='  Submit  button and some  spaces'][role='button']"), false);
                        await expectFound(button);
                    }
                    catch (e_8) {
                        env_9.error = e_8;
                        env_9.hasError = true;
                    }
                    finally {
                        __disposeResources(env_9);
                    }
                }
                {
                    const env_10 = { stack: [], error: void 0, hasError: false };
                    try {
                        const button = __addDisposableResource(env_10, await page.$('aria/ignored[name="Submit  button and some  spaces"][role="button"]'), false);
                        await expectFound(button);
                        await (0, expect_1.default)(page.$('aria/smth[smth="true"]')).rejects.toThrow('Unknown aria attribute "smth" in selector');
                    }
                    catch (e_9) {
                        env_10.error = e_9;
                        env_10.hasError = true;
                    }
                    finally {
                        __disposeResources(env_10);
                    }
                }
            }
            catch (e_10) {
                env_1.error = e_10;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
    });
    describe('queryOne', () => {
        it('should find button by role', async () => {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div id="div"><button id="btn" role="button">Submit</button></div>');
                const button = __addDisposableResource(env_11, (await page.$('aria/[role="button"]')), false);
                const id = await button.evaluate(button => {
                    return button.id;
                });
                (0, expect_1.default)(id).toBe('btn');
            }
            catch (e_11) {
                env_11.error = e_11;
                env_11.hasError = true;
            }
            finally {
                __disposeResources(env_11);
            }
        });
        it('should find button by name and role', async () => {
            const env_12 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div id="div"><button id="btn" role="button">Submit</button></div>');
                const button = __addDisposableResource(env_12, (await page.$('aria/Submit[role="button"]')), false);
                const id = await button.evaluate(button => {
                    return button.id;
                });
                (0, expect_1.default)(id).toBe('btn');
            }
            catch (e_12) {
                env_12.error = e_12;
                env_12.hasError = true;
            }
            finally {
                __disposeResources(env_12);
            }
        });
        it('should find first matching element', async () => {
            const env_13 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`
        <div role="menu" id="mnu1" aria-label="menu div"></div>
        <div role="menu" id="mnu2" aria-label="menu div"></div>
        `);
                const div = __addDisposableResource(env_13, (await page.$('aria/menu div')), false);
                const id = await div.evaluate(div => {
                    return div.id;
                });
                (0, expect_1.default)(id).toBe('mnu1');
            }
            catch (e_13) {
                env_13.error = e_13;
                env_13.hasError = true;
            }
            finally {
                __disposeResources(env_13);
            }
        });
        it('should find by name', async () => {
            const env_14 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`
        <div role="menu" id="mnu1" aria-label="menu-label1">menu div</div>
        <div role="menu" id="mnu2" aria-label="menu-label2">menu div</div>
        `);
                const menu = __addDisposableResource(env_14, (await page.$('aria/menu-label1')), false);
                const id = await menu.evaluate(div => {
                    return div.id;
                });
                (0, expect_1.default)(id).toBe('mnu1');
            }
            catch (e_14) {
                env_14.error = e_14;
                env_14.hasError = true;
            }
            finally {
                __disposeResources(env_14);
            }
        });
        it('should find 2nd element by name', async () => {
            const env_15 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`
        <div role="menu" id="mnu1" aria-label="menu-label1">menu div</div>
        <div role="menu" id="mnu2" aria-label="menu-label2">menu div</div>
        `);
                const menu = __addDisposableResource(env_15, (await page.$('aria/menu-label2')), false);
                const id = await menu.evaluate(div => {
                    return div.id;
                });
                (0, expect_1.default)(id).toBe('mnu2');
            }
            catch (e_15) {
                env_15.error = e_15;
                env_15.hasError = true;
            }
            finally {
                __disposeResources(env_15);
            }
        });
    });
    describe('queryAll', () => {
        it('should find menu by name', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div role="menu" id="mnu1" aria-label="menu div"></div>
        <div role="menu" id="mnu2" aria-label="menu div"></div>
        `);
            const divs = (await page.$$('aria/menu div'));
            const ids = await Promise.all(divs.map(n => {
                return n.evaluate(div => {
                    return div.id;
                });
            }));
            (0, expect_1.default)(ids.join(', ')).toBe('mnu1, mnu2');
        });
    });
    describe('queryAllArray', () => {
        it('$$eval should handle many elements', async function () {
            this.timeout(40000);
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('');
            await page.evaluate(`
        for (var i = 0; i <= 10000; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            document.body.appendChild(button);
        }
        `);
            const sum = await page.$$eval('aria/[role="button"]', buttons => {
                return buttons.reduce((acc, button) => {
                    return acc + Number(button.textContent);
                }, 0);
            });
            (0, expect_1.default)(sum).toBe(50005000);
        });
    });
    describe('waitForSelector (aria)', function () {
        const addElement = (tag) => {
            return document.body.appendChild(document.createElement(tag));
        };
        it('should immediately resolve promise if node exists', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.evaluate(addElement, 'button');
            await page.waitForSelector('aria/[role="button"]');
        });
        it('should work for ElementHandle.waitForSelector', async () => {
            const env_16 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                await page.evaluate(() => {
                    return (document.body.innerHTML = `<div><button>test</button></div>`);
                });
                const element = __addDisposableResource(env_16, (await page.$('div')), false);
                await element.waitForSelector('aria/test');
            }
            catch (e_16) {
                env_16.error = e_16;
                env_16.hasError = true;
            }
            finally {
                __disposeResources(env_16);
            }
        });
        it('should persist query handler bindings across reloads', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.evaluate(addElement, 'button');
            await page.waitForSelector('aria/[role="button"]');
            await page.reload();
            await page.evaluate(addElement, 'button');
            await page.waitForSelector('aria/[role="button"]');
        });
        it('should persist query handler bindings across navigations', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            // Reset page but make sure that execution context ids start with 1.
            await page.goto('data:text/html,');
            await page.goto(server.EMPTY_PAGE);
            await page.evaluate(addElement, 'button');
            await page.waitForSelector('aria/[role="button"]');
            // Reset page but again make sure that execution context ids start with 1.
            await page.goto('data:text/html,');
            await page.goto(server.EMPTY_PAGE);
            await page.evaluate(addElement, 'button');
            await page.waitForSelector('aria/[role="button"]');
        });
        it('should work independently of `exposeFunction`', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await page.exposeFunction('ariaQuerySelector', (a, b) => {
                return a + b;
            });
            await page.evaluate(addElement, 'button');
            await page.waitForSelector('aria/[role="button"]');
            const result = await page.evaluate('globalThis.ariaQuerySelector(2,8)');
            (0, expect_1.default)(result).toBe(10);
        });
        it('should work with removed MutationObserver', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluate(() => {
                // @ts-expect-error This is the point of the test.
                return delete window.MutationObserver;
            });
            const [handle] = await Promise.all([
                page.waitForSelector('aria/anything'),
                page.setContent(`<h1>anything</h1>`),
            ]);
            (0, assert_1.default)(handle);
            (0, expect_1.default)(await page.evaluate(x => {
                return x.textContent;
            }, handle)).toBe('anything');
        });
        it('should resolve promise when node is added', async () => {
            const env_17 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                const frame = page.mainFrame();
                const watchdog = frame.waitForSelector('aria/[role="heading"]');
                await frame.evaluate(addElement, 'br');
                await frame.evaluate(addElement, 'h1');
                const elementHandle = __addDisposableResource(env_17, (await watchdog), false);
                const tagName = await (await elementHandle.getProperty('tagName')).jsonValue();
                (0, expect_1.default)(tagName).toBe('H1');
            }
            catch (e_17) {
                env_17.error = e_17;
                env_17.hasError = true;
            }
            finally {
                __disposeResources(env_17);
            }
        });
        it('should work when node is added through innerHTML', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const watchdog = page.waitForSelector('aria/name');
            await page.evaluate(addElement, 'span');
            await page.evaluate(() => {
                return (document.querySelector('span').innerHTML =
                    '<h3><div aria-label="name"></div></h3>');
            });
            await watchdog;
        });
        it('Page.waitForSelector is shortcut for main frame', async () => {
            const env_18 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.EMPTY_PAGE);
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                const otherFrame = page.frames()[1];
                const watchdog = page.waitForSelector('aria/[role="button"]');
                await otherFrame.evaluate(addElement, 'button');
                await page.evaluate(addElement, 'button');
                const elementHandle = __addDisposableResource(env_18, await watchdog, false);
                (0, expect_1.default)(elementHandle.frame).toBe(page.mainFrame());
            }
            catch (e_18) {
                env_18.error = e_18;
                env_18.hasError = true;
            }
            finally {
                __disposeResources(env_18);
            }
        });
        it('should run in specified frame', async () => {
            const env_19 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
                await (0, utils_js_1.attachFrame)(page, 'frame2', server.EMPTY_PAGE);
                const frame1 = page.frames()[1];
                const frame2 = page.frames()[2];
                const waitForSelectorPromise = frame2.waitForSelector('aria/[role="button"]');
                await frame1.evaluate(addElement, 'button');
                await frame2.evaluate(addElement, 'button');
                const elementHandle = __addDisposableResource(env_19, await waitForSelectorPromise, false);
                (0, expect_1.default)(elementHandle.frame).toBe(frame2);
            }
            catch (e_19) {
                env_19.error = e_19;
                env_19.hasError = true;
            }
            finally {
                __disposeResources(env_19);
            }
        });
        it('should throw when frame is detached', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
            const frame = page.frames()[1];
            let waitError;
            const waitPromise = frame
                .waitForSelector('aria/does-not-exist')
                .catch(error => {
                return (waitError = error);
            });
            await (0, utils_js_1.detachFrame)(page, 'frame1');
            await waitPromise;
            (0, expect_1.default)(waitError).toBeTruthy();
            (0, expect_1.default)(waitError.message).atLeastOneToContain([
                'waitForFunction failed: frame got detached.',
                'Browsing context already closed.',
            ]);
        });
        it('should survive cross-process navigation', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            let imgFound = false;
            const waitForSelector = page
                .waitForSelector('aria/[role="image"]')
                .then(() => {
                return (imgFound = true);
            });
            await page.goto(server.EMPTY_PAGE);
            (0, expect_1.default)(imgFound).toBe(false);
            await page.reload();
            (0, expect_1.default)(imgFound).toBe(false);
            await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
            await waitForSelector;
            (0, expect_1.default)(imgFound).toBe(true);
        });
        it('should wait for visible', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let divFound = false;
            const waitForSelector = page
                .waitForSelector('aria/name', { visible: true })
                .then(() => {
                return (divFound = true);
            });
            await page.setContent(`<div aria-label='name' style='display: none; visibility: hidden;'>1</div>`);
            (0, expect_1.default)(divFound).toBe(false);
            await page.evaluate(() => {
                return document.querySelector('div').style.removeProperty('display');
            });
            (0, expect_1.default)(divFound).toBe(false);
            await page.evaluate(() => {
                return document
                    .querySelector('div')
                    .style.removeProperty('visibility');
            });
            (0, expect_1.default)(await waitForSelector).toBe(true);
            (0, expect_1.default)(divFound).toBe(true);
        });
        it('should wait for visible recursively', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let divVisible = false;
            const waitForSelector = page
                .waitForSelector('aria/inner', { visible: true })
                .then(() => {
                return (divVisible = true);
            })
                .catch(() => {
                return (divVisible = false);
            });
            await page.setContent(`<div style='display: none; visibility: hidden;'><div aria-label="inner">hi</div></div>`);
            (0, expect_1.default)(divVisible).toBe(false);
            await page.evaluate(() => {
                return document.querySelector('div').style.removeProperty('display');
            });
            (0, expect_1.default)(divVisible).toBe(false);
            await page.evaluate(() => {
                return document
                    .querySelector('div')
                    .style.removeProperty('visibility');
            });
            (0, expect_1.default)(await waitForSelector).toBe(true);
            (0, expect_1.default)(divVisible).toBe(true);
        });
        it('hidden should wait for visibility: hidden', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let divHidden = false;
            await page.setContent(`<div role='button' style='display: block;'>text</div>`);
            const waitForSelector = page
                .waitForSelector('aria/[role="button"]', { hidden: true })
                .then(() => {
                return (divHidden = true);
            })
                .catch(() => {
                return (divHidden = false);
            });
            await page.waitForSelector('aria/[role="button"]'); // do a round trip
            (0, expect_1.default)(divHidden).toBe(false);
            await page.evaluate(() => {
                return document
                    .querySelector('div')
                    .style.setProperty('visibility', 'hidden');
            });
            (0, expect_1.default)(await waitForSelector).toBe(true);
            (0, expect_1.default)(divHidden).toBe(true);
        });
        it('hidden should wait for display: none', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let divHidden = false;
            await page.setContent(`<div role='main' style='display: block;'>text</div>`);
            const waitForSelector = page
                .waitForSelector('aria/[role="main"]', { hidden: true })
                .then(() => {
                return (divHidden = true);
            })
                .catch(() => {
                return (divHidden = false);
            });
            await page.waitForSelector('aria/[role="main"]'); // do a round trip
            (0, expect_1.default)(divHidden).toBe(false);
            await page.evaluate(() => {
                return document
                    .querySelector('div')
                    .style.setProperty('display', 'none');
            });
            (0, expect_1.default)(await waitForSelector).toBe(true);
            (0, expect_1.default)(divHidden).toBe(true);
        });
        it('hidden should wait for removal', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<div role='main'>text</div>`);
            let divRemoved = false;
            const waitForSelector = page
                .waitForSelector('aria/[role="main"]', { hidden: true })
                .then(() => {
                return (divRemoved = true);
            })
                .catch(() => {
                return (divRemoved = false);
            });
            await page.waitForSelector('aria/[role="main"]'); // do a round trip
            (0, expect_1.default)(divRemoved).toBe(false);
            await page.evaluate(() => {
                return document.querySelector('div').remove();
            });
            (0, expect_1.default)(await waitForSelector).toBe(true);
            (0, expect_1.default)(divRemoved).toBe(true);
        });
        it('should return null if waiting to hide non-existing element', async () => {
            const env_20 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const handle = __addDisposableResource(env_20, await page.waitForSelector('aria/non-existing', {
                    hidden: true,
                }), false);
                (0, expect_1.default)(handle).toBe(null);
            }
            catch (e_20) {
                env_20.error = e_20;
                env_20.hasError = true;
            }
            finally {
                __disposeResources(env_20);
            }
        });
        it('should respect timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const error = await page
                .waitForSelector('aria/[role="button"]', {
                timeout: 10,
            })
                .catch(error => {
                return error;
            });
            (0, expect_1.default)(error.message).toContain('Waiting for selector `[role="button"]` failed: Waiting failed: 10ms exceeded');
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should have an error message specifically for awaiting an element to be hidden', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<div role='main'>text</div>`);
            const promise = page.waitForSelector('aria/[role="main"]', {
                hidden: true,
                timeout: 10,
            });
            await (0, expect_1.default)(promise).rejects.toMatchObject({
                message: 'Waiting for selector `[role="main"]` failed: Waiting failed: 10ms exceeded',
            });
        });
        it('should respond to node attribute mutation', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let divFound = false;
            const waitForSelector = page
                .waitForSelector('aria/zombo')
                .then(() => {
                return (divFound = true);
            })
                .catch(() => {
                return (divFound = false);
            });
            await page.setContent(`<div aria-label='notZombo'></div>`);
            (0, expect_1.default)(divFound).toBe(false);
            await page.evaluate(() => {
                return document
                    .querySelector('div')
                    .setAttribute('aria-label', 'zombo');
            });
            (0, expect_1.default)(await waitForSelector).toBe(true);
        });
        it('should return the element handle', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const waitForSelector = page.waitForSelector('aria/zombo').catch(err => {
                return err;
            });
            await page.setContent(`<div aria-label='zombo'>anything</div>`);
            (0, expect_1.default)(await page.evaluate(x => {
                return x?.textContent;
            }, await waitForSelector)).toBe('anything');
        });
        it('should have correct stack trace for timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.waitForSelector('aria/zombo', { timeout: 10 }).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.stack).toContain('Waiting for selector `zombo` failed: Waiting failed: 10ms exceeded');
        });
    });
    describe('queryOne (Chromium web test)', () => {
        async function setupPage() {
            const state = await (0, mocha_utils_js_1.getTestState)();
            await state.page.setContent(`
          <h2 id="shown">title</h2>
          <h2 id="hidden" aria-hidden="true">title</h2>
          <div id="node1" aria-labeledby="node2"></div>
          <div id="node2" aria-label="bar"></div>
          <div id="node3" aria-label="foo"></div>
          <div id="node4" class="container">
          <div id="node5" role="button" aria-label="foo"></div>
          <div id="node6" role="button" aria-label="foo"></div>
          <!-- Accessible name not available when element is hidden -->
          <div id="node7" hidden role="button" aria-label="foo"></div>
          <div id="node8" role="button" aria-label="bar"></div>
          </div>
          <button id="node10">text content</button>
          <h1 id="node11">text content</h1>
          <!-- Accessible name not available when role is "presentation" -->
          <h1 id="node12" role="presentation">text content</h1>
          <!-- Elements inside shadow dom should be found -->
          <script>
          const div = document.createElement('div');
          const shadowRoot = div.attachShadow({mode: 'open'});
          const h1 = document.createElement('h1');
          h1.textContent = 'text content';
          h1.id = 'node13';
          shadowRoot.appendChild(h1);
          document.documentElement.appendChild(div);
          </script>
          <img id="node20" src="" alt="Accessible Name">
          <input id="node21" type="submit" value="Accessible Name">
          <label id="node22" for="node23">Accessible Name</label>
          <!-- Accessible name for the <input> is "Accessible Name" -->
          <input id="node23">
          <div id="node24" title="Accessible Name"></div>
          <div role="treeitem" id="node30">
          <div role="treeitem" id="node31">
          <div role="treeitem" id="node32">item1</div>
          <div role="treeitem" id="node33">item2</div>
          </div>
          <div role="treeitem" id="node34">item3</div>
          </div>
          <!-- Accessible name for the <div> is "item1 item2 item3" -->
          <div aria-describedby="node30"></div>
          `);
            return state;
        }
        const getIds = async (elements) => {
            return await Promise.all(elements.map(element => {
                return element.evaluate((element) => {
                    return element.id;
                });
            }));
        };
        it('should find by name "foo"', async () => {
            const { page } = await setupPage();
            const found = await page.$$('aria/foo');
            const ids = await getIds(found);
            (0, expect_1.default)(ids).toEqual(['node3', 'node5', 'node6']);
        });
        it('should find by name "bar"', async () => {
            const { page } = await setupPage();
            const found = await page.$$('aria/bar');
            const ids = await getIds(found);
            (0, expect_1.default)(ids).toEqual(['node1', 'node2', 'node8']);
        });
        it('should find treeitem by name', async () => {
            const { page } = await setupPage();
            const found = await page.$$('aria/item1 item2 item3');
            const ids = await getIds(found);
            (0, expect_1.default)(ids).toEqual(['node30']);
        });
        it('should find by role "button"', async () => {
            const { page } = await setupPage();
            const found = (await page.$$('aria/[role="button"]'));
            const ids = await getIds(found);
            (0, expect_1.default)(ids).toEqual(['node5', 'node6', 'node8', 'node10', 'node21']);
        });
        it('should find by role "heading"', async () => {
            const { page } = await setupPage();
            const found = await page.$$('aria/[role="heading"]');
            const ids = await getIds(found);
            (0, expect_1.default)(ids).toEqual(['shown', 'node11', 'node13']);
        });
        it('should find both ignored and unignored', async () => {
            const { page } = await setupPage();
            const found = await page.$$('aria/title');
            const ids = await getIds(found);
            (0, expect_1.default)(ids).toEqual(['shown']);
        });
    });
});
//# sourceMappingURL=ariaqueryhandler.spec.js.map