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
const ErrorLike_js_1 = require("puppeteer-core/internal/util/ErrorLike.js");
const mocha_utils_js_1 = require("../mocha-utils.js");
const utils_js_1 = require("../utils.js");
describe('Target.createCDPSession', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should work', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const client = await page.createCDPSession();
        await Promise.all([
            client.send('Runtime.enable'),
            client.send('Runtime.evaluate', { expression: 'window.foo = "bar"' }),
        ]);
        const foo = await page.evaluate(() => {
            return globalThis.foo;
        });
        (0, expect_1.default)(foo).toBe('bar');
    });
    it('should not report created targets for custom CDP sessions', async () => {
        const { context } = await (0, mocha_utils_js_1.getTestState)();
        let called = 0;
        const handler = async (target) => {
            called++;
            if (called > 1) {
                throw new Error('Too many targets created');
            }
            await target.createCDPSession();
        };
        context.on('targetcreated', handler);
        await context.newPage();
        context.off('targetcreated', handler);
    });
    it('should send events', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        const client = await page.createCDPSession();
        await client.send('Network.enable');
        const events = [];
        client.on('Network.requestWillBeSent', event => {
            events.push(event);
        });
        await Promise.all([
            (0, utils_js_1.waitEvent)(client, 'Network.requestWillBeSent'),
            page.goto(server.EMPTY_PAGE),
        ]);
        (0, expect_1.default)(events).toHaveLength(1);
    });
    it('should enable and disable domains independently', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const client = await page.createCDPSession();
        await client.send('Runtime.enable');
        await client.send('Debugger.enable');
        // JS coverage enables and then disables Debugger domain.
        await page.coverage.startJSCoverage();
        await page.coverage.stopJSCoverage();
        // generate a script in page and wait for the event.
        const [event] = await Promise.all([
            (0, utils_js_1.waitEvent)(client, 'Debugger.scriptParsed'),
            page.evaluate('//# sourceURL=foo.js'),
        ]);
        // expect events to be dispatched.
        (0, expect_1.default)(event.url).toBe('foo.js');
    });
    it('should be able to detach session', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const client = await page.createCDPSession();
        await client.send('Runtime.enable');
        const evalResponse = await client.send('Runtime.evaluate', {
            expression: '1 + 2',
            returnByValue: true,
        });
        (0, expect_1.default)(evalResponse.result.value).toBe(3);
        await client.detach();
        let error;
        try {
            await client.send('Runtime.evaluate', {
                expression: '3 + 1',
                returnByValue: true,
            });
        }
        catch (error_) {
            if ((0, ErrorLike_js_1.isErrorLike)(error_)) {
                error = error_;
            }
        }
        (0, expect_1.default)(error.message).toContain('Session closed.');
    });
    it('should throw nice errors', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const client = await page.createCDPSession();
        const error = await theSourceOfTheProblems().catch(error => {
            return error;
        });
        (0, expect_1.default)(error.stack).toContain('theSourceOfTheProblems');
        (0, expect_1.default)(error.message).toContain('ThisCommand.DoesNotExist');
        async function theSourceOfTheProblems() {
            // @ts-expect-error This fails in TS as it knows that command does not
            // exist but we want to have this tests for our users who consume in JS
            // not TS.
            await client.send('ThisCommand.DoesNotExist');
        }
    });
    it('should respect custom timeout', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const client = await page.createCDPSession();
        await (0, expect_1.default)(client.send('Runtime.evaluate', {
            expression: 'new Promise(resolve => {})',
            awaitPromise: true,
        }, {
            timeout: 50,
        })).rejects.toThrowError(/Increase the 'protocolTimeout' setting in launch\/connect calls for a higher timeout if needed./gi);
    });
    it('should expose the underlying connection', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const client = await page.createCDPSession();
        (0, expect_1.default)(client.connection()).toBeTruthy();
    });
});
//# sourceMappingURL=CDPSession.spec.js.map