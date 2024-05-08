"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const expect_1 = __importDefault(require("expect"));
const mocha_utils_js_1 = require("../mocha-utils.js");
describe('Page.pdf', () => {
    (0, mocha_utils_js_1.setupTestBrowserHooks)();
    it('can print to PDF with accessible', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        const outputFile = __dirname + '/../../assets/output.pdf';
        const outputFileAccessible = __dirname + '/../../assets/output-accessible.pdf';
        await page.goto(server.PREFIX + '/pdf.html');
        await page.pdf({ path: outputFile, tagged: false });
        await page.pdf({ path: outputFileAccessible, tagged: true });
        try {
            const [base, tagged] = await Promise.all([
                (0, promises_1.readFile)(outputFile),
                (0, promises_1.readFile)(outputFileAccessible),
            ]);
            (0, expect_1.default)(tagged.byteLength).toBeGreaterThan(base.byteLength);
        }
        finally {
            await Promise.all([(0, promises_1.unlink)(outputFile), (0, promises_1.unlink)(outputFileAccessible)]);
        }
    });
    it('can print to PDF with outline', async () => {
        const { page, server } = await (0, mocha_utils_js_1.getTestState)();
        const outputFile = __dirname + '/../../assets/output.pdf';
        const outputFileOutlined = __dirname + '/../../assets/output-outlined.pdf';
        await page.goto(server.PREFIX + '/pdf.html');
        await page.pdf({ path: outputFile, tagged: true });
        await page.pdf({ path: outputFileOutlined, tagged: true, outline: true });
        try {
            const [base, outlined] = await Promise.all([
                (0, promises_1.readFile)(outputFile),
                (0, promises_1.readFile)(outputFileOutlined),
            ]);
            (0, expect_1.default)(outlined.byteLength).toBeGreaterThan(base.byteLength);
        }
        finally {
            await Promise.all([(0, promises_1.unlink)(outputFile), (0, promises_1.unlink)(outputFileOutlined)]);
        }
    });
});
//# sourceMappingURL=pdf.spec.js.map