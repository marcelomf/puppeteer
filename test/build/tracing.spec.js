"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const expect_1 = __importDefault(require("expect"));
const utils = __importStar(require("puppeteer-core/internal/common/util.js"));
const sinon_1 = __importDefault(require("sinon"));
const mocha_utils_js_1 = require("./mocha-utils.js");
describe('Tracing', function () {
    let outputFile;
    let testState;
    /* we manually manage the browser here as we want a new browser for each
     * individual test, which isn't the default behaviour of getTestState()
     */
    beforeEach(async () => {
        testState = await (0, mocha_utils_js_1.launch)({});
        outputFile = path_1.default.join(__dirname, 'trace.json');
    });
    afterEach(async () => {
        await testState.close();
        if (fs_1.default.existsSync(outputFile)) {
            fs_1.default.unlinkSync(outputFile);
        }
    });
    it('should output a trace', async () => {
        const { server, page } = testState;
        await page.tracing.start({ screenshots: true, path: outputFile });
        await page.goto(server.PREFIX + '/grid.html');
        await page.tracing.stop();
        (0, expect_1.default)(fs_1.default.existsSync(outputFile)).toBe(true);
    });
    it('should run with custom categories if provided', async () => {
        const { page } = testState;
        await page.tracing.start({
            path: outputFile,
            categories: ['-*', 'disabled-by-default-devtools.timeline.frame'],
        });
        await page.tracing.stop();
        const traceJson = JSON.parse(fs_1.default.readFileSync(outputFile, { encoding: 'utf8' }));
        const traceConfig = JSON.parse(traceJson.metadata['trace-config']);
        (0, expect_1.default)(traceConfig.included_categories).toEqual([
            'disabled-by-default-devtools.timeline.frame',
        ]);
        (0, expect_1.default)(traceConfig.excluded_categories).toEqual(['*']);
        (0, expect_1.default)(traceJson.traceEvents).not.toContainEqual(expect_1.default.objectContaining({
            cat: 'toplevel',
        }));
    });
    it('should run with default categories', async () => {
        const { page } = testState;
        await page.tracing.start({
            path: outputFile,
        });
        await page.tracing.stop();
        const traceJson = JSON.parse(fs_1.default.readFileSync(outputFile, { encoding: 'utf8' }));
        (0, expect_1.default)(traceJson.traceEvents).toContainEqual(expect_1.default.objectContaining({
            cat: 'toplevel',
        }));
    });
    it('should throw if tracing on two pages', async () => {
        const { page, browser } = testState;
        await page.tracing.start({ path: outputFile });
        const newPage = await browser.newPage();
        let error;
        await newPage.tracing.start({ path: outputFile }).catch(error_ => {
            return (error = error_);
        });
        await newPage.close();
        (0, expect_1.default)(error).toBeTruthy();
        await page.tracing.stop();
    });
    it('should return a buffer', async () => {
        const { page, server } = testState;
        await page.tracing.start({ screenshots: true, path: outputFile });
        await page.goto(server.PREFIX + '/grid.html');
        const trace = (await page.tracing.stop());
        const buf = fs_1.default.readFileSync(outputFile);
        (0, expect_1.default)(trace.toString()).toEqual(buf.toString());
    });
    it('should work without options', async () => {
        const { page, server } = testState;
        await page.tracing.start();
        await page.goto(server.PREFIX + '/grid.html');
        const trace = await page.tracing.stop();
        (0, expect_1.default)(trace).toBeTruthy();
    });
    it('should return undefined in case of Buffer error', async () => {
        const { page, server } = testState;
        await page.tracing.start({ screenshots: true });
        await page.goto(server.PREFIX + '/grid.html');
        const oldGetReadableAsBuffer = utils.getReadableAsBuffer;
        sinon_1.default.stub(utils, 'getReadableAsBuffer').callsFake(() => {
            return oldGetReadableAsBuffer({
                getReader() {
                    return {
                        done: false,
                        read() {
                            if (!this.done) {
                                this.done = true;
                                return { done: false, value: 42 };
                            }
                            return { done: true };
                        },
                    };
                },
            });
        });
        const trace = await page.tracing.stop();
        (0, expect_1.default)(trace).toEqual(undefined);
    });
    it('should support a buffer without a path', async () => {
        const { page, server } = testState;
        await page.tracing.start({ screenshots: true });
        await page.goto(server.PREFIX + '/grid.html');
        const trace = (await page.tracing.stop());
        (0, expect_1.default)(trace.toString()).toContain('screenshot');
    });
    it('should properly fail if readProtocolStream errors out', async () => {
        const { page } = testState;
        await page.tracing.start({ path: __dirname });
        let error;
        try {
            await page.tracing.stop();
        }
        catch (error_) {
            error = error_;
        }
        (0, expect_1.default)(error).toBeDefined();
    });
});
//# sourceMappingURL=tracing.spec.js.map