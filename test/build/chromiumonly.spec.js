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
const expect_1 = __importDefault(require("expect"));
const Deferred_js_1 = require("puppeteer-core/internal/util/Deferred.js");
const mocha_utils_js_1 = require("./mocha-utils.js");
const utils_js_1 = require("./utils.js");
// TODO: rename this test suite to launch/connect test suite as it actually
// works across browsers.
describe('Chromium-Specific Launcher tests', function () {
    describe('Puppeteer.launch |browserURL| option', function () {
        it('should be able to connect using browserUrl, with and without trailing slash', async () => {
            const { close, puppeteer } = await (0, mocha_utils_js_1.launch)({
                args: ['--remote-debugging-port=21222'],
            });
            try {
                const env_1 = { stack: [], error: void 0, hasError: false };
                try {
                    const browserURL = 'http://127.0.0.1:21222';
                    const browser1 = __addDisposableResource(env_1, await puppeteer.connect({ browserURL }), false);
                    const page1 = await browser1.newPage();
                    (0, expect_1.default)(await page1.evaluate(() => {
                        return 7 * 8;
                    })).toBe(56);
                    await browser1.disconnect();
                    const browser2 = __addDisposableResource(env_1, await puppeteer.connect({
                        browserURL: browserURL + '/',
                    }), false);
                    const page2 = await browser2.newPage();
                    (0, expect_1.default)(await page2.evaluate(() => {
                        return 8 * 7;
                    })).toBe(56);
                }
                catch (e_1) {
                    env_1.error = e_1;
                    env_1.hasError = true;
                }
                finally {
                    __disposeResources(env_1);
                }
            }
            finally {
                await close();
            }
        });
        it('should throw when using both browserWSEndpoint and browserURL', async () => {
            const { browser, close, puppeteer } = await (0, mocha_utils_js_1.launch)({
                args: ['--remote-debugging-port=21222'],
            });
            try {
                const browserURL = 'http://127.0.0.1:21222';
                let error;
                await puppeteer
                    .connect({
                    browserURL,
                    browserWSEndpoint: browser.wsEndpoint(),
                })
                    .catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error.message).toContain('Exactly one of browserWSEndpoint, browserURL or transport');
            }
            finally {
                await close();
            }
        });
        it('should throw when trying to connect to non-existing browser', async () => {
            const { close, puppeteer } = await (0, mocha_utils_js_1.launch)({
                args: ['--remote-debugging-port=21222'],
            });
            try {
                const browserURL = 'http://127.0.0.1:32333';
                let error;
                await puppeteer.connect({ browserURL }).catch(error_ => {
                    return (error = error_);
                });
                (0, expect_1.default)(error.message).toContain('Failed to fetch browser webSocket URL from');
            }
            finally {
                await close();
            }
        });
    });
    describe('Puppeteer.launch |pipe| option', function () {
        it('should support the pipe option', async () => {
            const { browser, close } = await (0, mocha_utils_js_1.launch)({ pipe: true }, { createPage: false });
            try {
                (0, expect_1.default)(await browser.pages()).toHaveLength(1);
                (0, expect_1.default)(browser.wsEndpoint()).toBe('');
                const page = await browser.newPage();
                (0, expect_1.default)(await page.evaluate('11 * 11')).toBe(121);
                await page.close();
            }
            finally {
                await close();
            }
        });
        it('should support the pipe argument', async () => {
            const { defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({ skipLaunch: true });
            const options = Object.assign({}, defaultBrowserOptions);
            options.args = ['--remote-debugging-pipe'].concat(options.args || []);
            const { browser, close } = await (0, mocha_utils_js_1.launch)(options);
            try {
                (0, expect_1.default)(browser.wsEndpoint()).toBe('');
                const page = await browser.newPage();
                (0, expect_1.default)(await page.evaluate('11 * 11')).toBe(121);
                await page.close();
            }
            finally {
                await close();
            }
        });
        it('should fire "disconnected" when closing with pipe', async function () {
            const { browser, close } = await (0, mocha_utils_js_1.launch)({ pipe: true });
            try {
                const disconnectedEventPromise = (0, utils_js_1.waitEvent)(browser, 'disconnected');
                // Emulate user exiting browser.
                browser.process().kill();
                await Deferred_js_1.Deferred.race([
                    disconnectedEventPromise,
                    Deferred_js_1.Deferred.create({
                        message: `Failed in after Hook`,
                        timeout: this.timeout() - 1000,
                    }),
                ]);
            }
            finally {
                await close();
            }
        });
    });
});
describe('Chromium-Specific Page Tests', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('Page.setRequestInterception should work with intervention headers', async () => {
        const { server, page } = await (0, mocha_utils_js_1.getTestState)();
        server.setRoute('/intervention', (_req, res) => {
            return res.end(`
        <script>
          document.write('<script src="${server.CROSS_PROCESS_PREFIX}/intervention.js">' + '</scr' + 'ipt>');
        </script>
      `);
        });
        server.setRedirect('/intervention.js', '/redirect.js');
        let serverRequest;
        server.setRoute('/redirect.js', (req, res) => {
            serverRequest = req;
            res.end('console.log(1);');
        });
        await page.setRequestInterception(true);
        page.on('request', request => {
            return request.continue();
        });
        await page.goto(server.PREFIX + '/intervention');
        // Check for feature URL substring rather than https://www.chromestatus.com to
        // make it work with Edgium.
        (0, expect_1.default)(serverRequest.headers['intervention']).toContain('feature/5718547946799104');
    });
});
//# sourceMappingURL=chromiumonly.spec.js.map