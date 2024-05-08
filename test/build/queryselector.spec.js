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
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const expect_1 = __importDefault(require("expect"));
const puppeteer_1 = require("puppeteer");
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('querySelector', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Page.$eval', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<section id="testAttribute">43543</section>');
            const idAttribute = await page.$eval('section', e => {
                return e.id;
            });
            (0, expect_1.default)(idAttribute).toBe('testAttribute');
        });
        it('should accept arguments', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<section>hello</section>');
            const text = await page.$eval('section', (e, suffix) => {
                return e.textContent + suffix;
            }, ' world!');
            (0, expect_1.default)(text).toBe('hello world!');
        });
        it('should accept ElementHandles as arguments', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>hello</section><div> world</div>');
                const divHandle = __addDisposableResource(env_1, (await page.$('div')), false);
                const text = await page.$eval('section', (e, div) => {
                    return e.textContent + div.textContent;
                }, divHandle);
                (0, expect_1.default)(text).toBe('hello world');
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should throw error if no element is found', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page
                .$eval('section', e => {
                return e.id;
            })
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toContain('failed to find element matching selector "section"');
        });
    });
    // The tests for $$eval are repeated later in this file in the test group 'QueryAll'.
    // This is done to also test a query handler where QueryAll returns an Element[]
    // as opposed to NodeListOf<Element>.
    describe('Page.$$eval', function () {
        it('should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>hello</div><div>beautiful</div><div>world!</div>');
            const divsCount = await page.$$eval('div', divs => {
                return divs.length;
            });
            (0, expect_1.default)(divsCount).toBe(3);
        });
        it('should accept extra arguments', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>hello</div><div>beautiful</div><div>world!</div>');
            const divsCountPlus5 = await page.$$eval('div', (divs, two, three) => {
                return divs.length + two + three;
            }, 2, 3);
            (0, expect_1.default)(divsCountPlus5).toBe(8);
        });
        it('should accept ElementHandles as arguments', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>2</section><section>2</section><section>1</section><div>3</div>');
                const divHandle = __addDisposableResource(env_2, (await page.$('div')), false);
                const sum = await page.$$eval('section', (sections, div) => {
                    return (sections.reduce((acc, section) => {
                        return acc + Number(section.textContent);
                    }, 0) + Number(div.textContent));
                }, divHandle);
                (0, expect_1.default)(sum).toBe(8);
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should handle many elements', async function () {
            this.timeout(25000);
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluate(`
        for (var i = 0; i <= 1000; i++) {
            const section = document.createElement('section');
            section.textContent = i;
            document.body.appendChild(section);
        }
        `);
            const sum = await page.$$eval('section', sections => {
                return sections.reduce((acc, section) => {
                    return acc + Number(section.textContent);
                }, 0);
            });
            (0, expect_1.default)(sum).toBe(500500);
        });
    });
    describe('Page.$', function () {
        it('should query existing element', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>test</section>');
                const element = __addDisposableResource(env_3, (await page.$('section')), false);
                (0, expect_1.default)(element).toBeTruthy();
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        it('should return null for non-existing element', async () => {
            const env_4 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const element = __addDisposableResource(env_4, (await page.$('non-existing-element')), false);
                (0, expect_1.default)(element).toBe(null);
            }
            catch (e_4) {
                env_4.error = e_4;
                env_4.hasError = true;
            }
            finally {
                __disposeResources(env_4);
            }
        });
    });
    describe('Page.$$', function () {
        it('should query existing elements', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>A</div><br/><div>B</div>');
            const elements = await page.$$('div');
            (0, expect_1.default)(elements).toHaveLength(2);
            const promises = elements.map(element => {
                return page.evaluate(e => {
                    return e.textContent;
                }, element);
            });
            (0, expect_1.default)(await Promise.all(promises)).toEqual(['A', 'B']);
        });
        it('should return empty array if nothing is found', async () => {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            const elements = await page.$$('div');
            (0, expect_1.default)(elements).toHaveLength(0);
        });
        describe('xpath', function () {
            it('should query existing element', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>test</section>');
                const elements = await page.$$('xpath/html/body/section');
                (0, expect_1.default)(elements[0]).toBeTruthy();
                (0, expect_1.default)(elements).toHaveLength(1);
            });
            it('should return empty array for non-existing element', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const element = await page.$$('xpath/html/body/non-existing-element');
                (0, expect_1.default)(element).toEqual([]);
            });
            it('should return multiple elements', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div></div><div></div>');
                const elements = await page.$$('xpath/html/body/div');
                (0, expect_1.default)(elements).toHaveLength(2);
            });
        });
    });
    describe('ElementHandle.$', function () {
        it('should query existing element', async () => {
            const env_5 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/playground.html');
                await page.setContent('<html><body><div class="second"><div class="inner">A</div></div></body></html>');
                const html = __addDisposableResource(env_5, (await page.$('html')), false);
                const second = __addDisposableResource(env_5, (await html.$('.second')), false);
                const inner = __addDisposableResource(env_5, await second.$('.inner'), false);
                const content = await page.evaluate(e => {
                    return e?.textContent;
                }, inner);
                (0, expect_1.default)(content).toBe('A');
            }
            catch (e_5) {
                env_5.error = e_5;
                env_5.hasError = true;
            }
            finally {
                __disposeResources(env_5);
            }
        });
        it('should return null for non-existing element', async () => {
            const env_6 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<html><body><div class="second"><div class="inner">B</div></div></body></html>');
                const html = __addDisposableResource(env_6, (await page.$('html')), false);
                const second = __addDisposableResource(env_6, await html.$('.third'), false);
                (0, expect_1.default)(second).toBe(null);
            }
            catch (e_6) {
                env_6.error = e_6;
                env_6.hasError = true;
            }
            finally {
                __disposeResources(env_6);
            }
        });
    });
    describe('ElementHandle.$eval', function () {
        it('should work', async () => {
            const env_7 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<html><body><div class="tweet"><div class="like">100</div><div class="retweets">10</div></div></body></html>');
                const tweet = __addDisposableResource(env_7, (await page.$('.tweet')), false);
                const content = await tweet.$eval('.like', node => {
                    return node.innerText;
                });
                (0, expect_1.default)(content).toBe('100');
            }
            catch (e_7) {
                env_7.error = e_7;
                env_7.hasError = true;
            }
            finally {
                __disposeResources(env_7);
            }
        });
        it('should retrieve content from subtree', async () => {
            const env_8 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const htmlContent = '<div class="a">not-a-child-div</div><div id="myId"><div class="a">a-child-div</div></div>';
                await page.setContent(htmlContent);
                const elementHandle = __addDisposableResource(env_8, (await page.$('#myId')), false);
                const content = await elementHandle.$eval('.a', node => {
                    return node.innerText;
                });
                (0, expect_1.default)(content).toBe('a-child-div');
            }
            catch (e_8) {
                env_8.error = e_8;
                env_8.hasError = true;
            }
            finally {
                __disposeResources(env_8);
            }
        });
        it('should throw in case of missing selector', async () => {
            const env_9 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const htmlContent = '<div class="a">not-a-child-div</div><div id="myId"></div>';
                await page.setContent(htmlContent);
                const elementHandle = __addDisposableResource(env_9, (await page.$('#myId')), false);
                const errorMessage = await elementHandle
                    .$eval('.a', node => {
                    return node.innerText;
                })
                    .catch(error => {
                    return error.message;
                });
                (0, expect_1.default)(errorMessage).toBe(`Error: failed to find element matching selector ".a"`);
            }
            catch (e_9) {
                env_9.error = e_9;
                env_9.hasError = true;
            }
            finally {
                __disposeResources(env_9);
            }
        });
    });
    describe('ElementHandle.$$eval', function () {
        it('should work', async () => {
            const env_10 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<html><body><div class="tweet"><div class="like">100</div><div class="like">10</div></div></body></html>');
                const tweet = __addDisposableResource(env_10, (await page.$('.tweet')), false);
                const content = await tweet.$$eval('.like', nodes => {
                    return nodes.map(n => {
                        return n.innerText;
                    });
                });
                (0, expect_1.default)(content).toEqual(['100', '10']);
            }
            catch (e_10) {
                env_10.error = e_10;
                env_10.hasError = true;
            }
            finally {
                __disposeResources(env_10);
            }
        });
        it('should retrieve content from subtree', async () => {
            const env_11 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const htmlContent = '<div class="a">not-a-child-div</div><div id="myId"><div class="a">a1-child-div</div><div class="a">a2-child-div</div></div>';
                await page.setContent(htmlContent);
                const elementHandle = __addDisposableResource(env_11, (await page.$('#myId')), false);
                const content = await elementHandle.$$eval('.a', nodes => {
                    return nodes.map(n => {
                        return n.innerText;
                    });
                });
                (0, expect_1.default)(content).toEqual(['a1-child-div', 'a2-child-div']);
            }
            catch (e_11) {
                env_11.error = e_11;
                env_11.hasError = true;
            }
            finally {
                __disposeResources(env_11);
            }
        });
        it('should not throw in case of missing selector', async () => {
            const env_12 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                const htmlContent = '<div class="a">not-a-child-div</div><div id="myId"></div>';
                await page.setContent(htmlContent);
                const elementHandle = __addDisposableResource(env_12, (await page.$('#myId')), false);
                const nodesLength = await elementHandle.$$eval('.a', nodes => {
                    return nodes.length;
                });
                (0, expect_1.default)(nodesLength).toBe(0);
            }
            catch (e_12) {
                env_12.error = e_12;
                env_12.hasError = true;
            }
            finally {
                __disposeResources(env_12);
            }
        });
    });
    describe('ElementHandle.$$', function () {
        it('should query existing elements', async () => {
            const env_13 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<html><body><div>A</div><br/><div>B</div></body></html>');
                const html = __addDisposableResource(env_13, (await page.$('html')), false);
                const elements = await html.$$('div');
                (0, expect_1.default)(elements).toHaveLength(2);
                const promises = elements.map(element => {
                    return page.evaluate(e => {
                        return e.textContent;
                    }, element);
                });
                (0, expect_1.default)(await Promise.all(promises)).toEqual(['A', 'B']);
            }
            catch (e_13) {
                env_13.error = e_13;
                env_13.hasError = true;
            }
            finally {
                __disposeResources(env_13);
            }
        });
        it('should return empty array for non-existing elements', async () => {
            const env_14 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<html><body><span>A</span><br/><span>B</span></body></html>');
                const html = __addDisposableResource(env_14, (await page.$('html')), false);
                const elements = await html.$$('div');
                (0, expect_1.default)(elements).toHaveLength(0);
            }
            catch (e_14) {
                env_14.error = e_14;
                env_14.hasError = true;
            }
            finally {
                __disposeResources(env_14);
            }
        });
        describe('xpath', function () {
            it('should query existing element', async () => {
                const env_15 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                    await page.goto(server.PREFIX + '/playground.html');
                    await page.setContent('<html><body><div class="second"><div class="inner">A</div></div></body></html>');
                    const html = __addDisposableResource(env_15, (await page.$('html')), false);
                    const second = await html.$$(`xpath/./body/div[contains(@class, 'second')]`);
                    const inner = await second[0].$$(`xpath/./div[contains(@class, 'inner')]`);
                    const content = await page.evaluate(e => {
                        return e.textContent;
                    }, inner[0]);
                    (0, expect_1.default)(content).toBe('A');
                }
                catch (e_15) {
                    env_15.error = e_15;
                    env_15.hasError = true;
                }
                finally {
                    __disposeResources(env_15);
                }
            });
            it('should return null for non-existing element', async () => {
                const env_16 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<html><body><div class="second"><div class="inner">B</div></div></body></html>');
                    const html = __addDisposableResource(env_16, (await page.$('html')), false);
                    const second = await html.$$(`xpath/div[contains(@class, 'third')]`);
                    (0, expect_1.default)(second).toEqual([]);
                }
                catch (e_16) {
                    env_16.error = e_16;
                    env_16.hasError = true;
                }
                finally {
                    __disposeResources(env_16);
                }
            });
        });
    });
    // This is the same tests for `$$eval` and `$$` as above, but with a queryAll
    // handler that returns an array instead of a list of nodes.
    describe('QueryAll', function () {
        const handler = {
            queryAll: (element, selector) => {
                return [...element.querySelectorAll(selector)];
            },
        };
        before(() => {
            puppeteer_1.Puppeteer.registerCustomQueryHandler('allArray', handler);
        });
        it('should have registered handler', async () => {
            (0, expect_1.default)(puppeteer_1.Puppeteer.customQueryHandlerNames().includes('allArray')).toBeTruthy();
        });
        it('$$ should query existing elements', async () => {
            const env_17 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<html><body><div>A</div><br/><div>B</div></body></html>');
                const html = __addDisposableResource(env_17, (await page.$('html')), false);
                const elements = await html.$$('allArray/div');
                (0, expect_1.default)(elements).toHaveLength(2);
                const promises = elements.map(element => {
                    return page.evaluate(e => {
                        return e.textContent;
                    }, element);
                });
                (0, expect_1.default)(await Promise.all(promises)).toEqual(['A', 'B']);
            }
            catch (e_17) {
                env_17.error = e_17;
                env_17.hasError = true;
            }
            finally {
                __disposeResources(env_17);
            }
        });
        it('$$ should return empty array for non-existing elements', async () => {
            const env_18 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<html><body><span>A</span><br/><span>B</span></body></html>');
                const html = __addDisposableResource(env_18, (await page.$('html')), false);
                const elements = await html.$$('allArray/div');
                (0, expect_1.default)(elements).toHaveLength(0);
            }
            catch (e_18) {
                env_18.error = e_18;
                env_18.hasError = true;
            }
            finally {
                __disposeResources(env_18);
            }
        });
        it('$$eval should work', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>hello</div><div>beautiful</div><div>world!</div>');
            const divsCount = await page.$$eval('allArray/div', divs => {
                return divs.length;
            });
            (0, expect_1.default)(divsCount).toBe(3);
        });
        it('$$eval should accept extra arguments', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent('<div>hello</div><div>beautiful</div><div>world!</div>');
            const divsCountPlus5 = await page.$$eval('allArray/div', (divs, two, three) => {
                return divs.length + two + three;
            }, 2, 3);
            (0, expect_1.default)(divsCountPlus5).toBe(8);
        });
        it('$$eval should accept ElementHandles as arguments', async () => {
            const env_19 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>2</section><section>2</section><section>1</section><div>3</div>');
                const divHandle = __addDisposableResource(env_19, (await page.$('div')), false);
                const sum = await page.$$eval('allArray/section', (sections, div) => {
                    return (sections.reduce((acc, section) => {
                        return acc + Number(section.textContent);
                    }, 0) + Number(div.textContent));
                }, divHandle);
                (0, expect_1.default)(sum).toBe(8);
            }
            catch (e_19) {
                env_19.error = e_19;
                env_19.hasError = true;
            }
            finally {
                __disposeResources(env_19);
            }
        });
        it('$$eval should handle many elements', async function () {
            this.timeout(25000);
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.evaluate(`
        for (var i = 0; i <= 1000; i++) {
            const section = document.createElement('section');
            section.textContent = i;
            document.body.appendChild(section);
        }
        `);
            const sum = await page.$$eval('allArray/section', sections => {
                return sections.reduce((acc, section) => {
                    return acc + Number(section.textContent);
                }, 0);
            });
            (0, expect_1.default)(sum).toBe(500500);
        });
    });
});
//# sourceMappingURL=queryselector.spec.js.map