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
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const puppeteer_1 = require("puppeteer");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
const FILE_TO_UPLOAD = path_1.default.join(__dirname, '/../assets/file-to-upload.txt');
describe('input tests', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    describe('ElementHandle.uploadFile', function () {
        it('should upload the file', async () => {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/fileupload.html');
                const input = __addDisposableResource(env_1, (await page.$('input')), false);
                await input.evaluate(e => {
                    globalThis._inputEvents = [];
                    e.addEventListener('change', ev => {
                        return globalThis._inputEvents.push(ev.type);
                    });
                    e.addEventListener('input', ev => {
                        return globalThis._inputEvents.push(ev.type);
                    });
                });
                const file = path_1.default.relative(process.cwd(), FILE_TO_UPLOAD);
                await input.uploadFile(file);
                (0, expect_1.default)(await input.evaluate(e => {
                    return e.files?.[0]?.name;
                })).toBe('file-to-upload.txt');
                (0, expect_1.default)(await input.evaluate(e => {
                    return e.files?.[0]?.type;
                })).toBe('text/plain');
                (0, expect_1.default)(await page.evaluate(() => {
                    return globalThis._inputEvents;
                })).toEqual(['input', 'change']);
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        });
        it('should read the file', async () => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                const { page, server } = await (0, mocha_utils_js_1.getTestState)();
                await page.goto(server.PREFIX + '/input/fileupload.html');
                const input = __addDisposableResource(env_2, (await page.$('input')), false);
                await input.evaluate(e => {
                    globalThis._inputEvents = [];
                    e.addEventListener('change', ev => {
                        return globalThis._inputEvents.push(ev.type);
                    });
                    e.addEventListener('input', ev => {
                        return globalThis._inputEvents.push(ev.type);
                    });
                });
                const file = path_1.default.relative(process.cwd(), FILE_TO_UPLOAD);
                await input.uploadFile(file);
                (0, expect_1.default)(await input.evaluate(e => {
                    const file = e.files?.[0];
                    if (!file) {
                        throw new Error('No file found');
                    }
                    const reader = new FileReader();
                    const promise = new Promise(fulfill => {
                        reader.addEventListener('load', fulfill);
                    });
                    reader.readAsText(file);
                    return promise.then(() => {
                        return reader.result;
                    });
                })).toBe('contents of the file');
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        });
    });
    describe('Page.waitForFileChooser', function () {
        it('should work when file input is attached to DOM', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('input'),
            ]);
            (0, expect_1.default)(chooser).toBeTruthy();
        });
        it('should work when file input is not attached to DOM', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.evaluate(() => {
                    const el = document.createElement('input');
                    el.type = 'file';
                    el.click();
                }),
            ]);
            (0, expect_1.default)(chooser).toBeTruthy();
        });
        it('should respect timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            let error;
            await page.waitForFileChooser({ timeout: 1 }).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should respect default timeout when there is no custom timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            page.setDefaultTimeout(1);
            let error;
            await page.waitForFileChooser().catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should prioritize exact timeout over default timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            page.setDefaultTimeout(0);
            let error;
            await page.waitForFileChooser({ timeout: 1 }).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeInstanceOf(puppeteer_1.TimeoutError);
        });
        it('should work with no timeout', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            const [chooser] = await Promise.all([
                page.waitForFileChooser({ timeout: 0 }),
                page.evaluate(() => {
                    return setTimeout(() => {
                        const el = document.createElement('input');
                        el.type = 'file';
                        el.click();
                    }, 50);
                }),
            ]);
            (0, expect_1.default)(chooser).toBeTruthy();
        });
        it('should return the same file chooser when there are many watchdogs simultaneously', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            const [fileChooser1, fileChooser2] = await Promise.all([
                page.waitForFileChooser(),
                page.waitForFileChooser(),
                page.$eval('input', input => {
                    return input.click();
                }),
            ]);
            (0, expect_1.default)(fileChooser1 === fileChooser2).toBe(true);
        });
    });
    describe('FileChooser.accept', function () {
        it('should accept single file', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file oninput='javascript:console.timeStamp()'>`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('input'),
            ]);
            await Promise.all([
                chooser.accept([FILE_TO_UPLOAD]),
                (0, utils_js_1.waitEvent)(page, 'metrics'),
            ]);
            (0, expect_1.default)(await page.$eval('input', input => {
                return input.files.length;
            })).toBe(1);
            (0, expect_1.default)(await page.$eval('input', input => {
                return input.files[0].name;
            })).toBe('file-to-upload.txt');
        });
        it('should be able to read selected file', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            void page.waitForFileChooser().then(chooser => {
                return chooser.accept([FILE_TO_UPLOAD]);
            });
            (0, expect_1.default)(await page.$eval('input', async (pick) => {
                pick.click();
                await new Promise(x => {
                    return (pick.oninput = x);
                });
                const reader = new FileReader();
                const promise = new Promise(fulfill => {
                    return (reader.onload = fulfill);
                });
                reader.readAsText(pick.files[0]);
                return await promise.then(() => {
                    return reader.result;
                });
            })).toBe('contents of the file');
        });
        it('should be able to reset selected files with empty file list', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            void page.waitForFileChooser().then(chooser => {
                return chooser.accept([FILE_TO_UPLOAD]);
            });
            (0, expect_1.default)(await page.$eval('input', async (pick) => {
                pick.click();
                await new Promise(x => {
                    return (pick.oninput = x);
                });
                return pick.files.length;
            })).toBe(1);
            void page.waitForFileChooser().then(chooser => {
                return chooser.accept([]);
            });
            (0, expect_1.default)(await page.$eval('input', async (pick) => {
                pick.click();
                await new Promise(x => {
                    return (pick.oninput = x);
                });
                return pick.files.length;
            })).toBe(0);
        });
        it('should not accept multiple files for single-file input', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('input'),
            ]);
            let error;
            await chooser
                .accept([
                path_1.default.relative(process.cwd(), __dirname + '/../assets/file-to-upload.txt'),
                path_1.default.relative(process.cwd(), __dirname + '/../assets/pptr.png'),
            ])
                .catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).not.toBe(null);
        });
        it('should succeed even for non-existent files', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('input'),
            ]);
            let error;
            await chooser.accept(['file-does-not-exist.txt']).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error).toBeUndefined();
        });
        it('should error on read of non-existent files', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            void page.waitForFileChooser().then(chooser => {
                return chooser.accept(['file-does-not-exist.txt']);
            });
            (0, expect_1.default)(await page.$eval('input', async (pick) => {
                pick.click();
                await new Promise(x => {
                    return (pick.oninput = x);
                });
                const reader = new FileReader();
                const promise = new Promise(fulfill => {
                    return (reader.onerror = fulfill);
                });
                reader.readAsText(pick.files[0]);
                return await promise.then(() => {
                    return false;
                });
            })).toBeFalsy();
        });
        it('should fail when accepting file chooser twice', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.$eval('input', input => {
                    return input.click();
                }),
            ]);
            await fileChooser.accept([]);
            let error;
            await fileChooser.accept([]).catch(error_ => {
                return (error = error_);
            });
            (0, expect_1.default)(error.message).toBe('Cannot accept FileChooser which is already handled!');
        });
    });
    describe('FileChooser.cancel', function () {
        it('should cancel dialog', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            // Consider file chooser canceled if we can summon another one.
            // There's no reliable way in WebPlatform to see that FileChooser was
            // canceled.
            await page.setContent(`<input type=file>`);
            const [fileChooser1] = await Promise.all([
                page.waitForFileChooser(),
                page.$eval('input', input => {
                    return input.click();
                }),
            ]);
            await fileChooser1.cancel();
            // If this resolves, than we successfully canceled file chooser.
            await Promise.all([
                page.waitForFileChooser(),
                page.$eval('input', input => {
                    return input.click();
                }),
            ]);
        });
        it('should fail when canceling file chooser twice', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.$eval('input', input => {
                    return input.click();
                }),
            ]);
            await fileChooser.cancel();
            let error;
            try {
                await fileChooser.cancel();
            }
            catch (error_) {
                error = error_;
            }
            (0, expect_1.default)(error.message).toBe('Cannot cancel FileChooser which is already handled!');
        });
    });
    describe('FileChooser.isMultiple', () => {
        it('should work for single file pick', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input type=file>`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('input'),
            ]);
            (0, expect_1.default)(chooser.isMultiple()).toBe(false);
        });
        it('should work for "multiple"', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input multiple type=file>`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('input'),
            ]);
            (0, expect_1.default)(chooser.isMultiple()).toBe(true);
        });
        it('should work for "webkitdirectory"', async () => {
            const { page } = await (0, mocha_utils_js_1.getTestState)();
            await page.setContent(`<input multiple webkitdirectory type=file>`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('input'),
            ]);
            (0, expect_1.default)(chooser.isMultiple()).toBe(true);
        });
    });
});
//# sourceMappingURL=input.spec.js.map