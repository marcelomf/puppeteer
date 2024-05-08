"use strict";
/**
 * @license
 * Copyright 2018 Google Inc.
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
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('Accessibility', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should work', async () => {
        const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent(`
      <head>
        <title>Accessibility Test</title>
      </head>
      <body>
        <div>Hello World</div>
        <h1>Inputs</h1>
        <input placeholder="Empty input" autofocus />
        <input placeholder="readonly input" readonly />
        <input placeholder="disabled input" disabled />
        <input aria-label="Input with whitespace" value="  " />
        <input value="value only" />
        <input aria-placeholder="placeholder" value="and a value" />
        <div aria-hidden="true" id="desc">This is a description!</div>
        <input aria-placeholder="placeholder" value="and a value" aria-describedby="desc" />
        <select>
          <option>First Option</option>
          <option>Second Option</option>
        </select>
      </body>`);
        await page.focus('[placeholder="Empty input"]');
        const golden = isFirefox
            ? {
                role: 'document',
                name: 'Accessibility Test',
                children: [
                    { role: 'text leaf', name: 'Hello World' },
                    { role: 'heading', name: 'Inputs', level: 1 },
                    { role: 'entry', name: 'Empty input', focused: true },
                    { role: 'entry', name: 'readonly input', readonly: true },
                    { role: 'entry', name: 'disabled input', disabled: true },
                    { role: 'entry', name: 'Input with whitespace', value: '  ' },
                    { role: 'entry', name: '', value: 'value only' },
                    { role: 'entry', name: '', value: 'and a value' }, // firefox doesn't use aria-placeholder for the name
                    {
                        role: 'entry',
                        name: '',
                        value: 'and a value',
                        description: 'This is a description!',
                    }, // and here
                    {
                        role: 'combobox',
                        name: '',
                        value: 'First Option',
                        haspopup: true,
                        children: [
                            {
                                role: 'combobox option',
                                name: 'First Option',
                                selected: true,
                            },
                            { role: 'combobox option', name: 'Second Option' },
                        ],
                    },
                ],
            }
            : {
                role: 'RootWebArea',
                name: 'Accessibility Test',
                children: [
                    { role: 'StaticText', name: 'Hello World' },
                    { role: 'heading', name: 'Inputs', level: 1 },
                    { role: 'textbox', name: 'Empty input', focused: true },
                    { role: 'textbox', name: 'readonly input', readonly: true },
                    { role: 'textbox', name: 'disabled input', disabled: true },
                    { role: 'textbox', name: 'Input with whitespace', value: '  ' },
                    { role: 'textbox', name: '', value: 'value only' },
                    { role: 'textbox', name: 'placeholder', value: 'and a value' },
                    {
                        role: 'textbox',
                        name: 'placeholder',
                        value: 'and a value',
                        description: 'This is a description!',
                    },
                    {
                        role: 'combobox',
                        name: '',
                        value: 'First Option',
                        haspopup: 'menu',
                        children: [
                            { role: 'option', name: 'First Option', selected: true },
                            { role: 'option', name: 'Second Option' },
                        ],
                    },
                ],
            };
        (0, expect_1.default)(await page.accessibility.snapshot()).toMatchObject(golden);
    });
    it('should report uninteresting nodes', async () => {
        const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent(`<textarea>hi</textarea>`);
        await page.focus('textarea');
        const golden = isFirefox
            ? {
                role: 'entry',
                name: '',
                value: 'hi',
                focused: true,
                multiline: true,
                children: [
                    {
                        role: 'text leaf',
                        name: 'hi',
                    },
                ],
            }
            : {
                role: 'textbox',
                name: '',
                value: 'hi',
                focused: true,
                multiline: true,
                children: [
                    {
                        role: 'generic',
                        name: '',
                        children: [
                            {
                                role: 'StaticText',
                                name: 'hi',
                            },
                        ],
                    },
                ],
            };
        (0, expect_1.default)(findFocusedNode(await page.accessibility.snapshot({ interestingOnly: false }))).toMatchObject(golden);
    });
    it('get snapshots while the tree is re-calculated', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            // see https://github.com/puppeteer/puppeteer/issues/9404
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accessible name + aria-expanded puppeteer bug</title>
        <style>
          [aria-expanded="false"] + * {
            display: none;
          }
        </style>
      </head>
      <body>
        <button hidden>Show</button>
        <p>Some content</p>
        <script>
          const button = document.querySelector('button');
          button.removeAttribute('hidden')
          button.setAttribute('aria-expanded', 'false');
          button.addEventListener('click', function() {
            button.setAttribute('aria-expanded', button.getAttribute('aria-expanded') !== 'true')
            if (button.getAttribute('aria-expanded') == 'true') {
              button.textContent = 'Hide'
            } else {
              button.textContent = 'Show'
            }
          })
        </script>
      </body>
      </html>`);
            async function getAccessibleName(page, element) {
                return (await page.accessibility.snapshot({ root: element })).name;
            }
            const button = __addDisposableResource(env_1, await page.$('button'), false);
            (0, expect_1.default)(await getAccessibleName(page, button)).toEqual('Show');
            await button?.click();
            await page.waitForSelector('aria/Hide');
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('roledescription', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent('<div tabIndex=-1 aria-roledescription="foo">Hi</div>');
        const snapshot = await page.accessibility.snapshot();
        // See https://chromium-review.googlesource.com/c/chromium/src/+/3088862
        (0, assert_1.default)(snapshot);
        (0, assert_1.default)(snapshot.children);
        (0, assert_1.default)(snapshot.children[0]);
        (0, expect_1.default)(snapshot.children[0].roledescription).toBeUndefined();
    });
    it('orientation', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent('<a href="" role="slider" aria-orientation="vertical">11</a>');
        const snapshot = await page.accessibility.snapshot();
        (0, assert_1.default)(snapshot);
        (0, assert_1.default)(snapshot.children);
        (0, assert_1.default)(snapshot.children[0]);
        (0, expect_1.default)(snapshot.children[0].orientation).toEqual('vertical');
    });
    it('autocomplete', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent('<input type="number" aria-autocomplete="list" />');
        const snapshot = await page.accessibility.snapshot();
        (0, assert_1.default)(snapshot);
        (0, assert_1.default)(snapshot.children);
        (0, assert_1.default)(snapshot.children[0]);
        (0, expect_1.default)(snapshot.children[0].autocomplete).toEqual('list');
    });
    it('multiselectable', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent('<div role="grid" tabIndex=-1 aria-multiselectable=true>hey</div>');
        const snapshot = await page.accessibility.snapshot();
        (0, assert_1.default)(snapshot);
        (0, assert_1.default)(snapshot.children);
        (0, assert_1.default)(snapshot.children[0]);
        (0, expect_1.default)(snapshot.children[0].multiselectable).toEqual(true);
    });
    it('keyshortcuts', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent('<div role="grid" tabIndex=-1 aria-keyshortcuts="foo">hey</div>');
        const snapshot = await page.accessibility.snapshot();
        (0, assert_1.default)(snapshot);
        (0, assert_1.default)(snapshot.children);
        (0, assert_1.default)(snapshot.children[0]);
        (0, expect_1.default)(snapshot.children[0].keyshortcuts).toEqual('foo');
    });
    describe('filtering children of leaf nodes', function () {
        it('should not report text nodes inside controls', async () => {
            const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div role="tablist">
          <div role="tab" aria-selected="true"><b>Tab1</b></div>
          <div role="tab">Tab2</div>
        </div>`);
            const golden = isFirefox
                ? {
                    role: 'document',
                    name: '',
                    children: [
                        {
                            role: 'pagetab',
                            name: 'Tab1',
                            selected: true,
                        },
                        {
                            role: 'pagetab',
                            name: 'Tab2',
                        },
                    ],
                }
                : {
                    role: 'RootWebArea',
                    name: '',
                    children: [
                        {
                            role: 'tab',
                            name: 'Tab1',
                            selected: true,
                        },
                        {
                            role: 'tab',
                            name: 'Tab2',
                        },
                    ],
                };
            (0, expect_1.default)(await page.accessibility.snapshot()).toEqual(golden);
        });
        it('rich text editable fields should have children', async () => {
            const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div contenteditable="true">
          Edit this image: <img src="fakeimage.png" alt="my fake image">
        </div>`);
            const golden = isFirefox
                ? {
                    role: 'section',
                    name: '',
                    children: [
                        {
                            role: 'text leaf',
                            name: 'Edit this image:',
                        },
                        {
                            role: 'StaticText',
                            name: 'my fake image',
                        },
                    ],
                }
                : {
                    role: 'generic',
                    name: '',
                    value: 'Edit this image: ',
                    children: [
                        {
                            role: 'StaticText',
                            name: 'Edit this image: ',
                        },
                        {
                            role: 'image',
                            name: 'my fake image',
                        },
                    ],
                };
            const snapshot = await page.accessibility.snapshot();
            (0, assert_1.default)(snapshot);
            (0, assert_1.default)(snapshot.children);
            (0, expect_1.default)(snapshot.children[0]).toMatchObject(golden);
        });
        it('rich text editable fields with role should have children', async () => {
            const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div contenteditable="true" role='textbox'>
          Edit this image: <img src="fakeimage.png" alt="my fake image">
        </div>`);
            // Image node should not be exposed in contenteditable elements. See https://crbug.com/1324392.
            const golden = isFirefox
                ? {
                    role: 'entry',
                    name: '',
                    value: 'Edit this image: my fake image',
                    children: [
                        {
                            role: 'StaticText',
                            name: 'my fake image',
                        },
                    ],
                }
                : {
                    role: 'textbox',
                    name: '',
                    value: 'Edit this image: ',
                    multiline: true,
                    children: [
                        {
                            role: 'StaticText',
                            name: 'Edit this image: ',
                        },
                    ],
                };
            const snapshot = await page.accessibility.snapshot();
            (0, assert_1.default)(snapshot);
            (0, assert_1.default)(snapshot.children);
            (0, expect_1.default)(snapshot.children[0]).toMatchObject(golden);
        });
        // Firefox does not support contenteditable="plaintext-only".
        describe('plaintext contenteditable', function () {
            it('plain text field with role should not have children', async () => {
                const { page } = await (0, mocha_utils_js_1.getTestState)();
                await page.setContent(`
          <div contenteditable="plaintext-only" role='textbox'>Edit this image:<img src="fakeimage.png" alt="my fake image"></div>`);
                const snapshot = await page.accessibility.snapshot();
                (0, assert_1.default)(snapshot);
                (0, assert_1.default)(snapshot.children);
                (0, expect_1.default)(snapshot.children[0]).toEqual({
                    role: 'textbox',
                    name: '',
                    value: 'Edit this image:',
                    multiline: true,
                });
            });
        });
        it('non editable textbox with role and tabIndex and label should not have children', async () => {
            const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div role="textbox" tabIndex=0 aria-checked="true" aria-label="my favorite textbox">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
            const golden = isFirefox
                ? {
                    role: 'entry',
                    name: 'my favorite textbox',
                    value: 'this is the inner content yo',
                }
                : {
                    role: 'textbox',
                    name: 'my favorite textbox',
                    value: 'this is the inner content ',
                };
            const snapshot = await page.accessibility.snapshot();
            (0, assert_1.default)(snapshot);
            (0, assert_1.default)(snapshot.children);
            (0, expect_1.default)(snapshot.children[0]).toEqual(golden);
        });
        it('checkbox with and tabIndex and label should not have children', async () => {
            const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div role="checkbox" tabIndex=0 aria-checked="true" aria-label="my favorite checkbox">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
            const golden = isFirefox
                ? {
                    role: 'checkbutton',
                    name: 'my favorite checkbox',
                    checked: true,
                }
                : {
                    role: 'checkbox',
                    name: 'my favorite checkbox',
                    checked: true,
                };
            const snapshot = await page.accessibility.snapshot();
            (0, assert_1.default)(snapshot);
            (0, assert_1.default)(snapshot.children);
            (0, expect_1.default)(snapshot.children[0]).toEqual(golden);
        });
        it('checkbox without label should not have children', async () => {
            const { page, isFirefox } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`
        <div role="checkbox" aria-checked="true">
          this is the inner content
          <img alt="yo" src="fakeimg.png">
        </div>`);
            const golden = isFirefox
                ? {
                    role: 'checkbutton',
                    name: 'this is the inner content yo',
                    checked: true,
                }
                : {
                    role: 'checkbox',
                    name: 'this is the inner content yo',
                    checked: true,
                };
            const snapshot = await page.accessibility.snapshot();
            (0, assert_1.default)(snapshot);
            (0, assert_1.default)(snapshot.children);
            (0, expect_1.default)(snapshot.children[0]).toEqual(golden);
        });
        describe('root option', function () {
            it('should work a button', async () => {
                const env_2 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent(`<button>My Button</button>`);
                    const button = __addDisposableResource(env_2, (await page.$('button')), false);
                    (0, expect_1.default)(await page.accessibility.snapshot({ root: button })).toEqual({
                        role: 'button',
                        name: 'My Button',
                    });
                }
                catch (e_2) {
                    env_2.error = e_2;
                    env_2.hasError = true;
                }
                finally {
                    __disposeResources(env_2);
                }
            });
            it('should work an input', async () => {
                const env_3 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent(`<input title="My Input" value="My Value">`);
                    const input = __addDisposableResource(env_3, (await page.$('input')), false);
                    (0, expect_1.default)(await page.accessibility.snapshot({ root: input })).toEqual({
                        role: 'textbox',
                        name: 'My Input',
                        value: 'My Value',
                    });
                }
                catch (e_3) {
                    env_3.error = e_3;
                    env_3.hasError = true;
                }
                finally {
                    __disposeResources(env_3);
                }
            });
            it('should work a menu', async () => {
                const env_4 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent(`
            <div role="menu" title="My Menu">
              <div role="menuitem">First Item</div>
              <div role="menuitem">Second Item</div>
              <div role="menuitem">Third Item</div>
            </div>
          `);
                    const menu = __addDisposableResource(env_4, (await page.$('div[role="menu"]')), false);
                    (0, expect_1.default)(await page.accessibility.snapshot({ root: menu })).toEqual({
                        role: 'menu',
                        name: 'My Menu',
                        children: [
                            { role: 'menuitem', name: 'First Item' },
                            { role: 'menuitem', name: 'Second Item' },
                            { role: 'menuitem', name: 'Third Item' },
                        ],
                        orientation: 'vertical',
                    });
                }
                catch (e_4) {
                    env_4.error = e_4;
                    env_4.hasError = true;
                }
                finally {
                    __disposeResources(env_4);
                }
            });
            it('should return null when the element is no longer in DOM', async () => {
                const env_5 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent(`<button>My Button</button>`);
                    const button = __addDisposableResource(env_5, (await page.$('button')), false);
                    await page.$eval('button', button => {
                        return button.remove();
                    });
                    (0, expect_1.default)(await page.accessibility.snapshot({ root: button })).toEqual(null);
                }
                catch (e_5) {
                    env_5.error = e_5;
                    env_5.hasError = true;
                }
                finally {
                    __disposeResources(env_5);
                }
            });
            it('should support the interestingOnly option', async () => {
                const env_6 = { stack: [], error: void 0, hasError: false };
                try {
                    const { page } = await (0, mocha_utils_js_1.getTestState)();
                    await page.setContent(`<div><button>My Button</button></div>`);
                    const div = __addDisposableResource(env_6, (await page.$('div')), false);
                    (0, expect_1.default)(await page.accessibility.snapshot({ root: div })).toEqual(null);
                    (0, expect_1.default)(await page.accessibility.snapshot({
                        root: div,
                        interestingOnly: false,
                    })).toMatchObject({
                        role: 'generic',
                        name: '',
                        children: [
                            {
                                role: 'button',
                                name: 'My Button',
                                children: [{ role: 'StaticText', name: 'My Button' }],
                            },
                        ],
                    });
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
    });
    function findFocusedNode(node) {
        if (node?.focused) {
            return node;
        }
        for (const child of node?.children || []) {
            const focusedChild = findFocusedNode(child);
            if (focusedChild) {
                return focusedChild;
            }
        }
        return null;
    }
});
//# sourceMappingURL=accessibility.spec.js.map