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
const os_1 = __importDefault(require("os"));
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
describe('Keyboard', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should type into a textarea', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.evaluate(() => {
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);
            textarea.focus();
        });
        const text = 'Hello world. I am the text that was typed!';
        await page.keyboard.type(text);
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('textarea').value;
        })).toBe(text);
    });
    it('should move with the arrow keys', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.type('textarea', 'Hello World!');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('textarea').value;
        })).toBe('Hello World!');
        for (const _ of 'World!') {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.type('inserted ');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('textarea').value;
        })).toBe('Hello inserted World!');
        await page.keyboard.down('Shift');
        for (const _ of 'inserted ') {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.up('Shift');
        await page.keyboard.press('Backspace');
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('textarea').value;
        })).toBe('Hello World!');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/1313
    it('should trigger commands of keyboard shortcuts', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        const cmdKey = os_1.default.platform() === 'darwin' ? 'Meta' : 'Control';
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.type('textarea', 'hello');
        await page.keyboard.down(cmdKey);
        await page.keyboard.press('a', { commands: ['SelectAll'] });
        await page.keyboard.up(cmdKey);
        await page.keyboard.down(cmdKey);
        await page.keyboard.down('c', { commands: ['Copy'] });
        await page.keyboard.up('c');
        await page.keyboard.up(cmdKey);
        await page.keyboard.down(cmdKey);
        await page.keyboard.press('v', { commands: ['Paste'] });
        await page.keyboard.press('v', { commands: ['Paste'] });
        await page.keyboard.up(cmdKey);
        (0, expect_1.default)(await page.evaluate(() => {
            return document.querySelector('textarea').value;
        })).toBe('hellohello');
    });
    it('should send a character with ElementHandle.press', async () => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/textarea.html');
            const textarea = __addDisposableResource(env_1, (await page.$('textarea')), false);
            await textarea.press('a');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('textarea').value;
            })).toBe('a');
            await page.evaluate(() => {
                return window.addEventListener('keydown', e => {
                    return e.preventDefault();
                }, true);
            });
            await textarea.press('b');
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('textarea').value;
            })).toBe('a');
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    it('ElementHandle.press should not support |text| option', async () => {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/textarea.html');
            const textarea = __addDisposableResource(env_2, (await page.$('textarea')), false);
            await textarea.press('a', { text: 'ё' });
            (0, expect_1.default)(await page.evaluate(() => {
                return document.querySelector('textarea').value;
            })).toBe('a');
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    });
    it('should send a character with sendCharacter', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.focus('textarea');
        await page.evaluate(() => {
            globalThis.inputCount = 0;
            globalThis.keyDownCount = 0;
            window.addEventListener('input', () => {
                globalThis.inputCount += 1;
            }, true);
            window.addEventListener('keydown', () => {
                globalThis.keyDownCount += 1;
            }, true);
        });
        await page.keyboard.sendCharacter('嗨');
        (0, expect_1.default)(await page.$eval('textarea', textarea => {
            return {
                value: textarea.value,
                inputs: globalThis.inputCount,
                keyDowns: globalThis.keyDownCount,
            };
        })).toMatchObject({ value: '嗨', inputs: 1, keyDowns: 0 });
        await page.keyboard.sendCharacter('a');
        (0, expect_1.default)(await page.$eval('textarea', textarea => {
            return {
                value: textarea.value,
                inputs: globalThis.inputCount,
                keyDowns: globalThis.keyDownCount,
            };
        })).toMatchObject({ value: '嗨a', inputs: 2, keyDowns: 0 });
    });
    it('should send a character with sendCharacter in iframe', async () => {
        this.timeout(2000);
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.setContent(`
      <iframe srcdoc="<iframe name='test' srcdoc='<textarea></textarea>'></iframe>"</iframe>
    `);
        const frame = await page.waitForFrame(async (frame) => {
            const env_3 = { stack: [], error: void 0, hasError: false };
            try {
                const element = __addDisposableResource(env_3, await frame.frameElement(), false);
                if (!element) {
                    return false;
                }
                const name = await element.evaluate(frame => {
                    return frame.name;
                });
                return name === 'test';
            }
            catch (e_3) {
                env_3.error = e_3;
                env_3.hasError = true;
            }
            finally {
                __disposeResources(env_3);
            }
        });
        await frame.focus('textarea');
        await frame.evaluate(() => {
            globalThis.inputCount = 0;
            globalThis.keyDownCount = 0;
            window.addEventListener('input', () => {
                globalThis.inputCount += 1;
            }, true);
            window.addEventListener('keydown', () => {
                globalThis.keyDownCount += 1;
            }, true);
        });
        await page.keyboard.sendCharacter('嗨');
        (0, expect_1.default)(await frame.$eval('textarea', textarea => {
            return {
                value: textarea.value,
                inputs: globalThis.inputCount,
                keyDowns: globalThis.keyDownCount,
            };
        })).toMatchObject({ value: '嗨', inputs: 1, keyDowns: 0 });
        await page.keyboard.sendCharacter('a');
        (0, expect_1.default)(await frame.$eval('textarea', textarea => {
            return {
                value: textarea.value,
                inputs: globalThis.inputCount,
                keyDowns: globalThis.keyDownCount,
            };
        })).toMatchObject({ value: '嗨a', inputs: 2, keyDowns: 0 });
    });
    it('should report shiftKey', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/keyboard.html');
        const keyboard = page.keyboard;
        const codeForKey = new Set(['Shift', 'Alt', 'Control']);
        for (const modifierKey of codeForKey) {
            await keyboard.down(modifierKey);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.getResult();
            })).toBe(`Keydown: ${modifierKey} ${modifierKey}Left [${modifierKey}]`);
            await keyboard.down('!');
            if (modifierKey === 'Shift') {
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis.getResult();
                })).toBe(`Keydown: ! Digit1 [${modifierKey}]\n` + `input: ! insertText false`);
            }
            else {
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis.getResult();
                })).toBe(`Keydown: ! Digit1 [${modifierKey}]`);
            }
            await keyboard.up('!');
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.getResult();
            })).toBe(`Keyup: ! Digit1 [${modifierKey}]`);
            await keyboard.up(modifierKey);
            (0, expect_1.default)(await page.evaluate(() => {
                return globalThis.getResult();
            })).toBe(`Keyup: ${modifierKey} ${modifierKey}Left []`);
        }
    });
    it('should report multiple modifiers', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/keyboard.html');
        const keyboard = page.keyboard;
        await keyboard.down('Control');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe('Keydown: Control ControlLeft [Control]');
        await keyboard.down('Alt');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe('Keydown: Alt AltLeft [Alt Control]');
        await keyboard.down(';');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe('Keydown: ; Semicolon [Alt Control]');
        await keyboard.up(';');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe('Keyup: ; Semicolon [Alt Control]');
        await keyboard.up('Control');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe('Keyup: Control ControlLeft [Alt]');
        await keyboard.up('Alt');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe('Keyup: Alt AltLeft []');
    });
    it('should send proper codes while typing', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/keyboard.html');
        await page.keyboard.type('!');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe([
            'Keydown: ! Digit1 []',
            'input: ! insertText false',
            'Keyup: ! Digit1 []',
        ].join('\n'));
        await page.keyboard.type('^');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe([
            'Keydown: ^ Digit6 []',
            'input: ^ insertText false',
            'Keyup: ^ Digit6 []',
        ].join('\n'));
    });
    it('should send proper codes while typing with shift', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/keyboard.html');
        const keyboard = page.keyboard;
        await keyboard.down('Shift');
        await page.keyboard.type('~');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.getResult();
        })).toBe([
            'Keydown: Shift ShiftLeft [Shift]',
            'Keydown: ~ Backquote [Shift]',
            'input: ~ insertText false',
            'Keyup: ~ Backquote [Shift]',
        ].join('\n'));
        await keyboard.up('Shift');
    });
    it('should not type canceled events', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.focus('textarea');
        await page.evaluate(() => {
            window.addEventListener('keydown', event => {
                event.stopPropagation();
                event.stopImmediatePropagation();
                if (event.key === 'l') {
                    event.preventDefault();
                }
                if (event.key === 'o') {
                    event.preventDefault();
                }
            }, false);
        });
        await page.keyboard.type('Hello World!');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.textarea.value;
        })).toBe('He Wrd!');
    });
    it('should specify repeat property', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.focus('textarea');
        await page.evaluate(() => {
            return document.querySelector('textarea').addEventListener('keydown', e => {
                return (globalThis.lastEvent = e);
            }, true);
        });
        await page.keyboard.down('a');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.lastEvent.repeat;
        })).toBe(false);
        await page.keyboard.press('a');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.lastEvent.repeat;
        })).toBe(true);
        await page.keyboard.down('b');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.lastEvent.repeat;
        })).toBe(false);
        await page.keyboard.down('b');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.lastEvent.repeat;
        })).toBe(true);
        await page.keyboard.up('a');
        await page.keyboard.down('a');
        (0, expect_1.default)(await page.evaluate(() => {
            return globalThis.lastEvent.repeat;
        })).toBe(false);
    });
    it('should type all kinds of characters', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.focus('textarea');
        const text = 'This text goes onto two lines.\nThis character is 嗨.';
        await page.keyboard.type(text);
        (0, expect_1.default)(await page.evaluate('result')).toBe(text);
    });
    it('should specify location', async () => {
        const env_4 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.PREFIX + '/input/textarea.html');
            await page.evaluate(() => {
                window.addEventListener('keydown', event => {
                    return (globalThis.keyLocation = event.location);
                }, true);
            });
            const textarea = __addDisposableResource(env_4, (await page.$('textarea')), false);
            await textarea.press('Digit5');
            (0, expect_1.default)(await page.evaluate('keyLocation')).toBe(0);
            await textarea.press('ControlLeft');
            (0, expect_1.default)(await page.evaluate('keyLocation')).toBe(1);
            await textarea.press('ControlRight');
            (0, expect_1.default)(await page.evaluate('keyLocation')).toBe(2);
            await textarea.press('NumpadSubtract');
            (0, expect_1.default)(await page.evaluate('keyLocation')).toBe(3);
        }
        catch (e_4) {
            env_4.error = e_4;
            env_4.hasError = true;
        }
        finally {
            __disposeResources(env_4);
        }
    });
    it('should throw on unknown keys', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const error = await page.keyboard
            // @ts-expect-error bad input
            .press('NotARealKey')
            .catch(error_ => {
            return error_;
        });
        (0, expect_1.default)(error.message).toBe('Unknown key: "NotARealKey"');
    });
    it('should type emoji', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        await page.goto(server.PREFIX + '/input/textarea.html');
        await page.type('textarea', '👹 Tokyo street Japan 🇯🇵');
        (0, expect_1.default)(await page.$eval('textarea', textarea => {
            return textarea.value;
        })).toBe('👹 Tokyo street Japan 🇯🇵');
    });
    it('should type emoji into an iframe', async () => {
        const env_5 = { stack: [], error: void 0, hasError: false };
        try {
            const { page, server } = await (0, mocha_utils_js_1.getTestState)();
            await page.goto(server.EMPTY_PAGE);
            await (0, utils_js_1.attachFrame)(page, 'emoji-test', server.PREFIX + '/input/textarea.html');
            const frame = page.frames()[1];
            const textarea = __addDisposableResource(env_5, (await frame.$('textarea')), false);
            await textarea.type('👹 Tokyo street Japan 🇯🇵');
            (0, expect_1.default)(await frame.$eval('textarea', textarea => {
                return textarea.value;
            })).toBe('👹 Tokyo street Japan 🇯🇵');
        }
        catch (e_5) {
            env_5.error = e_5;
            env_5.hasError = true;
        }
        finally {
            __disposeResources(env_5);
        }
    });
    it('should press the meta key', async () => {
        // This test only makes sense on macOS.
        if (os_1.default.platform() !== 'darwin') {
            return;
        }
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        await page.evaluate(() => {
            globalThis.result = null;
            document.addEventListener('keydown', event => {
                globalThis.result = [event.key, event.code, event.metaKey];
            });
        });
        await page.keyboard.press('Meta');
        // Have to do this because we lose a lot of type info when evaluating a
        // string not a function. This is why functions are recommended rather than
        // using strings (although we'll leave this test so we have coverage of both
        // approaches.)
        const [key, code, metaKey] = (await page.evaluate('result'));
        (0, expect_1.default)(key).toBe('Meta');
        (0, expect_1.default)(code).toBe('MetaLeft');
        (0, expect_1.default)(metaKey).toBe(true);
    });
});
//# sourceMappingURL=keyboard.spec.js.map