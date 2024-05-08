"use strict";
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
const sinon_1 = __importDefault(require("sinon"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('Page.Events.Dialog', function () {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('should fire', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const onDialog = sinon_1.default.stub().callsFake(dialog => {
            dialog.accept();
        });
        page.on('dialog', onDialog);
        await page.evaluate(() => {
            return alert('yo');
        });
        (0, expect_1.default)(onDialog.callCount).toEqual(1);
        const dialog = onDialog.firstCall.args[0];
        (0, expect_1.default)(dialog.type()).toBe('alert');
        (0, expect_1.default)(dialog.defaultValue()).toBe('');
        (0, expect_1.default)(dialog.message()).toBe('yo');
    });
    it('should allow accepting prompts', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        const onDialog = sinon_1.default.stub().callsFake(dialog => {
            dialog.accept('answer!');
        });
        page.on('dialog', onDialog);
        const result = await page.evaluate(() => {
            return prompt('question?', 'yes.');
        });
        (0, expect_1.default)(onDialog.callCount).toEqual(1);
        const dialog = onDialog.firstCall.args[0];
        (0, expect_1.default)(dialog.type()).toBe('prompt');
        (0, expect_1.default)(dialog.defaultValue()).toBe('yes.');
        (0, expect_1.default)(dialog.message()).toBe('question?');
        (0, expect_1.default)(result).toBe('answer!');
    });
    it('should dismiss the prompt', async () => {
        const { page } = await (0, mocha_utils_js_1.getTestState)();
        page.on('dialog', dialog => {
            void dialog.dismiss();
        });
        const result = await page.evaluate(() => {
            return prompt('question?');
        });
        (0, expect_1.default)(result).toBe(null);
    });
});
//# sourceMappingURL=dialog.spec.js.map