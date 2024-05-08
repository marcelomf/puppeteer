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
const assert_1 = __importDefault(require("assert"));
const expect_1 = __importDefault(require("expect"));
const puppeteer_core_1 = require("puppeteer-core");
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('Query handler tests', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('Pierce selectors', function () {
        async function setUpPage() {
            const state = await (0, mocha_utils_js_1.getTestState)();
            await state.page.setContent(`<script>
         const div = document.createElement('div');
         const shadowRoot = div.attachShadow({mode: 'open'});
         const div1 = document.createElement('div');
         div1.textContent = 'Hello';
         div1.className = 'foo';
         const div2 = document.createElement('div');
         div2.textContent = 'World';
         div2.className = 'foo';
         shadowRoot.appendChild(div1);
         shadowRoot.appendChild(div2);
         document.documentElement.appendChild(div);
         </script>`);
            return state;
        }
        it('should find first element in shadow', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await setUpPage();
                const div = __addDisposableResource(env_1, (await page.$('pierce/.foo')), false);
                const text = await div.evaluate(element => {
                    return element.textContent;
                });
                (0, expect_1.default)(text).toBe('Hello');
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should find all elements in shadow', async () => {
            const { page } = await setUpPage();
            const divs = (await page.$$('pierce/.foo'));
            const text = await Promise.all(divs.map(div => {
                return div.evaluate(element => {
                    return element.textContent;
                });
            }));
            (0, expect_1.default)(text.join(' ')).toBe('Hello World');
        });
        it('should find first child element', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await setUpPage();
                const parentElement = __addDisposableResource(env_2, (await page.$('html > div')), false);
                const childElement = __addDisposableResource(env_2, (await parentElement.$('pierce/div')), false);
                const text = await childElement.evaluate(element => {
                    return element.textContent;
                });
                (0, expect_1.default)(text).toBe('Hello');
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
        it('should find all child elements', async () => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const { page } = await setUpPage();
                const parentElement = __addDisposableResource(env_3, (await page.$('html > div')), false);
                const childElements = (await parentElement.$$('pierce/div'));
                const text = await Promise.all(childElements.map(div => {
                    return div.evaluate(element => {
                        return element.textContent;
                    });
                }));
                (0, expect_1.default)(text.join(' ')).toBe('Hello World');
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
    });
    describe('Text selectors', function () {
        describe('in Page', function () {
            it('should query existing element', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>test</section>');
                (0, expect_1.default)(await page.$('text/test')).toBeTruthy();
                (0, expect_1.default)(await page.$$('text/test')).toHaveLength(1);
            });
            it('should return empty array for non-existing element', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                (0, expect_1.default)(await page.$('text/test')).toBeFalsy();
                (0, expect_1.default)(await page.$$('text/test')).toHaveLength(0);
            });
            it('should return first element', async () => {
                const env_4 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div id="1">a</div><div>a</div>');
                    const element = __addDisposableResource(env_4, await page.$('text/a'), false);
                    (0, expect_1.default)(await element?.evaluate(e => {
                        return e.id;
                    })).toBe('1');
                }
                catch (e_4) {
                    env_4.error = e_4;
                    env_4.hasError = true;
                }
                finally {
                    __disposeResources(env_4);
                }
            });
            it('should return multiple elements', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div>a</div><div>a</div>');
                const elements = await page.$$('text/a');
                (0, expect_1.default)(elements).toHaveLength(2);
            });
            it('should pierce shadow DOM', async () => {
                const env_5 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.evaluate(() => {
                        const div = document.createElement('div');
                        const shadow = div.attachShadow({ mode: 'open' });
                        const diva = document.createElement('div');
                        shadow.append(diva);
                        const divb = document.createElement('div');
                        shadow.append(divb);
                        diva.innerHTML = 'a';
                        divb.innerHTML = 'b';
                        document.body.append(div);
                    });
                    const element = __addDisposableResource(env_5, await page.$('text/a'), false);
                    (0, expect_1.default)(await element?.evaluate(e => {
                        return e.textContent;
                    })).toBe('a');
                }
                catch (e_5) {
                    env_5.error = e_5;
                    env_5.hasError = true;
                }
                finally {
                    __disposeResources(env_5);
                }
            });
            it('should query deeply nested text', async () => {
                const env_6 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div><div>a</div><div>b</div></div>');
                    const element = __addDisposableResource(env_6, await page.$('text/a'), false);
                    (0, expect_1.default)(await element?.evaluate(e => {
                        return e.textContent;
                    })).toBe('a');
                }
                catch (e_6) {
                    env_6.error = e_6;
                    env_6.hasError = true;
                }
                finally {
                    __disposeResources(env_6);
                }
            });
            it('should query inputs', async () => {
                const env_7 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<input value="a">');
                    const element = __addDisposableResource(env_7, (await page.$('text/a')), false);
                    (0, expect_1.default)(await element?.evaluate(e => {
                        return e.value;
                    })).toBe('a');
                }
                catch (e_7) {
                    env_7.error = e_7;
                    env_7.hasError = true;
                }
                finally {
                    __disposeResources(env_7);
                }
            });
            it('should not query radio', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<radio value="a">');
                (0, expect_1.default)(await page.$('text/a')).toBeNull();
            });
            it('should query text spanning multiple elements', async () => {
                const env_8 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div><span>a</span> <span>b</span><div>');
                    const element = __addDisposableResource(env_8, await page.$('text/a b'), false);
                    (0, expect_1.default)(await element?.evaluate(e => {
                        return e.textContent;
                    })).toBe('a b');
                }
                catch (e_8) {
                    env_8.error = e_8;
                    env_8.hasError = true;
                }
                finally {
                    __disposeResources(env_8);
                }
            });
            it('should clear caches', async () => {
                const env_9 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div id=target1>text</div><input id=target2 value=text><div id=target3>text</div>');
                    const div = __addDisposableResource(env_9, (await page.$('#target1')), false);
                    const input = __addDisposableResource(env_9, (await page.$('#target2')), false);
                    await div.evaluate(div => {
                        div.textContent = 'text';
                    });
                    (0, expect_1.default)(await page.$eval(`text/text`, e => {
                        return e.id;
                    })).toBe('target1');
                    await div.evaluate(div => {
                        div.textContent = 'foo';
                    });
                    (0, expect_1.default)(await page.$eval(`text/text`, e => {
                        return e.id;
                    })).toBe('target2');
                    await input.evaluate(input => {
                        input.value = '';
                    });
                    await input.type('foo');
                    (0, expect_1.default)(await page.$eval(`text/text`, e => {
                        return e.id;
                    })).toBe('target3');
                    await div.evaluate(div => {
                        div.textContent = 'text';
                    });
                    await input.evaluate(input => {
                        input.value = '';
                    });
                    await input.type('text');
                    (0, expect_1.default)(await page.$$eval(`text/text`, es => {
                        return es.length;
                    })).toBe(3);
                    await div.evaluate(div => {
                        div.textContent = 'foo';
                    });
                    (0, expect_1.default)(await page.$$eval(`text/text`, es => {
                        return es.length;
                    })).toBe(2);
                    await input.evaluate(input => {
                        input.value = '';
                    });
                    await input.type('foo');
                    (0, expect_1.default)(await page.$$eval(`text/text`, es => {
                        return es.length;
                    })).toBe(1);
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
        describe('in ElementHandles', function () {
            it('should query existing element', async () => {
                const env_10 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div class="a"><span>a</span></div>');
                    const elementHandle = __addDisposableResource(env_10, (await page.$('div')), false);
                    (0, expect_1.default)(await elementHandle.$(`text/a`)).toBeTruthy();
                    (0, expect_1.default)(await elementHandle.$$(`text/a`)).toHaveLength(1);
                }
                catch (e_10) {
                    env_10.error = e_10;
                    env_10.hasError = true;
                }
                finally {
                    __disposeResources(env_10);
                }
            });
            it('should return null for non-existing element', async () => {
                const env_11 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div class="a"></div>');
                    const elementHandle = __addDisposableResource(env_11, (await page.$('div')), false);
                    (0, expect_1.default)(await elementHandle.$(`text/a`)).toBeFalsy();
                    (0, expect_1.default)(await elementHandle.$$(`text/a`)).toHaveLength(0);
                }
                catch (e_11) {
                    env_11.error = e_11;
                    env_11.hasError = true;
                }
                finally {
                    __disposeResources(env_11);
                }
            });
        });
    });
    describe('XPath selectors', function () {
        describe('in Page', function () {
            it('should query existing element', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<section>test</section>');
                (0, expect_1.default)(await page.$('xpath/html/body/section')).toBeTruthy();
                (0, expect_1.default)(await page.$$('xpath/html/body/section')).toHaveLength(1);
            });
            it('should return empty array for non-existing element', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                (0, expect_1.default)(await page.$('xpath/html/body/non-existing-element')).toBeFalsy();
                (0, expect_1.default)(await page.$$('xpath/html/body/non-existing-element')).toHaveLength(0);
            });
            it('should return first element', async () => {
                const env_12 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div>a</div><div></div>');
                    const element = __addDisposableResource(env_12, await page.$('xpath/html/body/div'), false);
                    (0, expect_1.default)(await element?.evaluate(e => {
                        return e.textContent === 'a';
                    })).toBeTruthy();
                }
                catch (e_12) {
                    env_12.error = e_12;
                    env_12.hasError = true;
                }
                finally {
                    __disposeResources(env_12);
                }
            });
            it('should return multiple elements', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent('<div></div><div></div>');
                const elements = await page.$$('xpath/html/body/div');
                (0, expect_1.default)(elements).toHaveLength(2);
            });
        });
        describe('in ElementHandles', function () {
            it('should query existing element', async () => {
                const env_13 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div class="a">a<span></span></div>');
                    const elementHandle = __addDisposableResource(env_13, (await page.$('div')), false);
                    (0, expect_1.default)(await elementHandle.$(`xpath/span`)).toBeTruthy();
                    (0, expect_1.default)(await elementHandle.$$(`xpath/span`)).toHaveLength(1);
                }
                catch (e_13) {
                    env_13.error = e_13;
                    env_13.hasError = true;
                }
                finally {
                    __disposeResources(env_13);
                }
            });
            it('should return null for non-existing element', async () => {
                const env_14 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent('<div class="a">a</div>');
                    const elementHandle = __addDisposableResource(env_14, (await page.$('div')), false);
                    (0, expect_1.default)(await elementHandle.$(`xpath/span`)).toBeFalsy();
                    (0, expect_1.default)(await elementHandle.$$(`xpath/span`)).toHaveLength(0);
                }
                catch (e_14) {
                    env_14.error = e_14;
                    env_14.hasError = true;
                }
                finally {
                    __disposeResources(env_14);
                }
            });
        });
    });
    describe('P selectors', () => {
        beforeEach(async () => {
            puppeteer_core_1.Puppeteer.clearCustomQueryHandlers();
        });
        it('should work with CSS selectors', async () => {
            const env_15 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_15, await page.$('div > button'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
                // Should parse more complex CSS selectors. Listing a few problematic
                // cases from bug reports.
                for (const selector of [
                    '.user_row[data-user-id="\\38 "]:not(.deactivated_user)',
                    `input[value='Search']:not([class='hidden'])`,
                    `[data-test-id^="test-"]:not([data-test-id^="test-foo"])`,
                ]) {
                    await page.$$(selector);
                }
            }
            catch (e_15) {
                env_15.error = e_15;
                env_15.hasError = true;
            }
            finally {
                __disposeResources(env_15);
            }
        });
        it('should work with deep combinators', async () => {
            const { server, page } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(`${server.PREFIX}/p-selectors.html`);
            {
                const env_16 = { stack: [], error: void 0, hasError: false };
                try {
                    const element = __addDisposableResource(env_16, await page.$('div >>>> div'), false);
                    (0, assert_1.default)(element, 'Could not find element');
                    (0, expect_1.default)(await element.evaluate(element => {
                        return element.id === 'c';
                    })).toBeTruthy();
                }
                catch (e_16) {
                    env_16.error = e_16;
                    env_16.hasError = true;
                }
                finally {
                    __disposeResources(env_16);
                }
            }
            {
                const elements = await page.$$('div >>> div');
                (0, assert_1.default)(elements[1], 'Could not find element');
                (0, expect_1.default)(await elements[1]?.evaluate(element => {
                    return element.id === 'd';
                })).toBeTruthy();
            }
            {
                const elements = await page.$$('#c >>>> div');
                (0, assert_1.default)(elements[0], 'Could not find element');
                (0, expect_1.default)(await elements[0]?.evaluate(element => {
                    return element.id === 'd';
                })).toBeTruthy();
            }
            {
                const elements = await page.$$('#c >>> div');
                (0, assert_1.default)(elements[0], 'Could not find element');
                (0, expect_1.default)(await elements[0]?.evaluate(element => {
                    return element.id === 'd';
                })).toBeTruthy();
            }
        });
        it('should work with text selectors', async () => {
            const env_17 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_17, await page.$('div ::-p-text(world)'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
            }
            catch (e_17) {
                env_17.error = e_17;
                env_17.hasError = true;
            }
            finally {
                __disposeResources(env_17);
            }
        });
        it('should work ARIA selectors', async () => {
            const env_18 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_18, await page.$('div ::-p-aria(world)'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
            }
            catch (e_18) {
                env_18.error = e_18;
                env_18.hasError = true;
            }
            finally {
                __disposeResources(env_18);
            }
        });
        it('should work for ARIA selectors in multiple isolated worlds', async () => {
            const env_19 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_19, await page.waitForSelector('::-p-aria(world)'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
                // $ would add ARIA query handler to the main world.
                await element.$('::-p-aria(world)');
                const element2 = __addDisposableResource(env_19, await page.waitForSelector('::-p-aria(world)'), false);
                (0, assert_1.default)(element2, 'Could not find element');
                (0, expect_1.default)(await element2.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
            }
            catch (e_19) {
                env_19.error = e_19;
                env_19.hasError = true;
            }
            finally {
                __disposeResources(env_19);
            }
        });
        it('should work ARIA selectors with role', async () => {
            const env_20 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_20, await page.$('::-p-aria(world[role="button"])'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
            }
            catch (e_20) {
                env_20.error = e_20;
                env_20.hasError = true;
            }
            finally {
                __disposeResources(env_20);
            }
        });
        it('should work ARIA selectors with name and role', async () => {
            const env_21 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_21, await page.$('::-p-aria([name="world"][role="button"])'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
            }
            catch (e_21) {
                env_21.error = e_21;
                env_21.hasError = true;
            }
            finally {
                __disposeResources(env_21);
            }
        });
        it('should work XPath selectors', async () => {
            const env_22 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_22, await page.$('div ::-p-xpath(//button)'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'b';
                })).toBeTruthy();
            }
            catch (e_22) {
                env_22.error = e_22;
                env_22.hasError = true;
            }
            finally {
                __disposeResources(env_22);
            }
        });
        it('should work with custom selectors', async () => {
            const env_23 = { stack: [], error: void 0, hasError: false };
            try {
                puppeteer_core_1.Puppeteer.registerCustomQueryHandler('div', {
                    queryOne() {
                        return document.querySelector('div');
                    },
                });
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_23, await page.$('::-p-div'), false);
                (0, assert_1.default)(element, 'Could not find element');
                (0, expect_1.default)(await element.evaluate(element => {
                    return element.id === 'a';
                })).toBeTruthy();
            }
            catch (e_23) {
                env_23.error = e_23;
                env_23.hasError = true;
            }
            finally {
                __disposeResources(env_23);
            }
        });
        it('should work with custom selectors with args', async () => {
            const { server, page } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(`${server.PREFIX}/p-selectors.html`);
            puppeteer_core_1.Puppeteer.registerCustomQueryHandler('div', {
                queryOne(_, selector) {
                    if (selector === 'true') {
                        return document.querySelector('div');
                    }
                    else {
                        return document.querySelector('button');
                    }
                },
            });
            {
                const env_24 = { stack: [], error: void 0, hasError: false };
                try {
                    const element = __addDisposableResource(env_24, await page.$('::-p-div(true)'), false);
                    (0, assert_1.default)(element, 'Could not find element');
                    (0, expect_1.default)(await element.evaluate(element => {
                        return element.id === 'a';
                    })).toBeTruthy();
                }
                catch (e_24) {
                    env_24.error = e_24;
                    env_24.hasError = true;
                }
                finally {
                    __disposeResources(env_24);
                }
            }
            {
                const env_25 = { stack: [], error: void 0, hasError: false };
                try {
                    const element = __addDisposableResource(env_25, await page.$('::-p-div("true")'), false);
                    (0, assert_1.default)(element, 'Could not find element');
                    (0, expect_1.default)(await element.evaluate(element => {
                        return element.id === 'a';
                    })).toBeTruthy();
                }
                catch (e_25) {
                    env_25.error = e_25;
                    env_25.hasError = true;
                }
                finally {
                    __disposeResources(env_25);
                }
            }
            {
                const env_26 = { stack: [], error: void 0, hasError: false };
                try {
                    const element = __addDisposableResource(env_26, await page.$("::-p-div('true')"), false);
                    (0, assert_1.default)(element, 'Could not find element');
                    (0, expect_1.default)(await element.evaluate(element => {
                        return element.id === 'a';
                    })).toBeTruthy();
                }
                catch (e_26) {
                    env_26.error = e_26;
                    env_26.hasError = true;
                }
                finally {
                    __disposeResources(env_26);
                }
            }
            {
                const env_27 = { stack: [], error: void 0, hasError: false };
                try {
                    const element = __addDisposableResource(env_27, await page.$('::-p-div'), false);
                    (0, assert_1.default)(element, 'Could not find element');
                    (0, expect_1.default)(await element.evaluate(element => {
                        return element.id === 'b';
                    })).toBeTruthy();
                }
                catch (e_27) {
                    env_27.error = e_27;
                    env_27.hasError = true;
                }
                finally {
                    __disposeResources(env_27);
                }
            }
        });
        it('should work with :hover', async () => {
            const env_28 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const button = __addDisposableResource(env_28, await page.$('div ::-p-text(world)'), false);
                (0, assert_1.default)(button, 'Could not find element');
                await button.hover();
                const button2 = __addDisposableResource(env_28, await page.$('div ::-p-text(world):hover'), false);
                (0, assert_1.default)(button2, 'Could not find element');
                const value = await button2.evaluate(span => {
                    return { textContent: span.textContent, tagName: span.tagName };
                });
                (0, expect_1.default)(value).toMatchObject({ textContent: 'world', tagName: 'BUTTON' });
            }
            catch (e_28) {
                env_28.error = e_28;
                env_28.hasError = true;
            }
            finally {
                __disposeResources(env_28);
            }
        });
        it('should work with selector lists', async () => {
            const { server, page } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(`${server.PREFIX}/p-selectors.html`);
            const elements = await page.$$('div, ::-p-text(world)');
            (0, expect_1.default)(elements).toHaveLength(3);
        });
        const permute = (inputs) => {
            const results = [];
            for (let i = 0; i < inputs.length; ++i) {
                const permutation = permute(inputs.slice(0, i).concat(inputs.slice(i + 1)));
                const value = inputs[i];
                if (permutation.length === 0) {
                    results.push([value]);
                    continue;
                }
                for (const part of permutation) {
                    results.push([value].concat(part));
                }
            }
            return results;
        };
        it('should match querySelector* ordering', async () => {
            const { server, page } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(`${server.PREFIX}/p-selectors.html`);
            for (const list of permute(['div', 'button', 'span'])) {
                const elements = await page.$$(list
                    .map(selector => {
                    return selector === 'button' ? '::-p-text(world)' : selector;
                })
                    .join(','));
                const actual = await Promise.all(elements.map(element => {
                    return element.evaluate(element => {
                        return element.id;
                    });
                }));
                (0, expect_1.default)(actual.join()).toStrictEqual('a,b,f,c');
            }
        });
        it('should not have duplicate elements from selector lists', async () => {
            const { server, page } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(`${server.PREFIX}/p-selectors.html`);
            const elements = await page.$$('::-p-text(world), button');
            (0, expect_1.default)(elements).toHaveLength(1);
        });
        it('should handle escapes', async () => {
            const env_29 = { stack: [], error: void 0, hasError: false };
            try {
                const { server, page } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(`${server.PREFIX}/p-selectors.html`);
                const element = __addDisposableResource(env_29, await page.$(':scope >>> ::-p-text(My name is Jun \\(pronounced like "June"\\))'), false);
                (0, expect_1.default)(element).toBeTruthy();
                const element2 = __addDisposableResource(env_29, await page.$(':scope >>> ::-p-text("My name is Jun (pronounced like \\"June\\")")'), false);
                (0, expect_1.default)(element2).toBeTruthy();
                const element3 = __addDisposableResource(env_29, await page.$(':scope >>> ::-p-text(My name is Jun \\(pronounced like "June"\\)")'), false);
                (0, expect_1.default)(element3).toBeFalsy();
                const element4 = __addDisposableResource(env_29, await page.$(':scope >>> ::-p-text("My name is Jun \\(pronounced like "June"\\))'), false);
                (0, expect_1.default)(element4).toBeFalsy();
            }
            catch (e_29) {
                env_29.error = e_29;
                env_29.hasError = true;
            }
            finally {
                __disposeResources(env_29);
            }
        });
    });
});
//# sourceMappingURL=queryhandler.spec.js.map