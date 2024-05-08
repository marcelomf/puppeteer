"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("../mocha-utils.js");
const utils_js_1 = require("../utils.js");
describe('TargetManager', () => {
    /* We use a special browser for this test as we need the --site-per-process flag */
    let state;
    beforeEach(async () => {
        const { defaultBrowserOptions } = await (0, mocha_utils_js_1.getTestState)({
            skipLaunch: true,
        });
        state = (await (0, mocha_utils_js_1.launch)(Object.assign({}, defaultBrowserOptions, {
            args: (defaultBrowserOptions.args || []).concat([
                '--site-per-process',
                '--remote-debugging-port=21222',
                '--host-rules=MAP * 127.0.0.1',
            ]),
        }), { createPage: false }));
    });
    afterEach(async () => {
        await state.close();
    });
    // CDP-specific test.
    it('should handle targets', async () => {
        const { server, context, browser } = state;
        const targetManager = browser._targetManager();
        (0, expect_1.default)(targetManager.getAvailableTargets().size).toBe(3);
        (0, expect_1.default)(await context.pages()).toHaveLength(0);
        (0, expect_1.default)(targetManager.getAvailableTargets().size).toBe(3);
        const page = await context.newPage();
        (0, expect_1.default)(await context.pages()).toHaveLength(1);
        (0, expect_1.default)(targetManager.getAvailableTargets().size).toBe(5);
        await page.goto(server.EMPTY_PAGE);
        (0, expect_1.default)(await context.pages()).toHaveLength(1);
        (0, expect_1.default)(targetManager.getAvailableTargets().size).toBe(5);
        // attach a local iframe.
        let framePromise = page.waitForFrame(frame => {
            return frame.url().endsWith('/empty.html');
        });
        await (0, utils_js_1.attachFrame)(page, 'frame1', server.EMPTY_PAGE);
        await framePromise;
        (0, expect_1.default)(await context.pages()).toHaveLength(1);
        (0, expect_1.default)(targetManager.getAvailableTargets().size).toBe(5);
        (0, expect_1.default)(page.frames()).toHaveLength(2);
        // // attach a remote frame iframe.
        framePromise = page.waitForFrame(frame => {
            return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
        });
        await (0, utils_js_1.attachFrame)(page, 'frame2', server.CROSS_PROCESS_PREFIX + '/empty.html');
        await framePromise;
        (0, expect_1.default)(await context.pages()).toHaveLength(1);
        (0, expect_1.default)(targetManager.getAvailableTargets().size).toBe(6);
        (0, expect_1.default)(page.frames()).toHaveLength(3);
        framePromise = page.waitForFrame(frame => {
            return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
        });
        await (0, utils_js_1.attachFrame)(page, 'frame3', server.CROSS_PROCESS_PREFIX + '/empty.html');
        await framePromise;
        (0, expect_1.default)(await context.pages()).toHaveLength(1);
        (0, expect_1.default)(targetManager.getAvailableTargets().size).toBe(7);
        (0, expect_1.default)(page.frames()).toHaveLength(4);
    });
});
//# sourceMappingURL=TargetManager.spec.js.map