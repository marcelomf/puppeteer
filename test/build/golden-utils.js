"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = void 0;
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const diff_1 = require("diff");
const jpeg_js_1 = __importDefault(require("jpeg-js"));
const mime_1 = __importDefault(require("mime"));
const pixelmatch_1 = __importDefault(require("pixelmatch"));
const pngjs_1 = require("pngjs");
const GoldenComparators = new Map();
const addSuffix = (filePath, suffix, customExtension) => {
    const dirname = path_1.default.dirname(filePath);
    const ext = path_1.default.extname(filePath);
    const name = path_1.default.basename(filePath, ext);
    return path_1.default.join(dirname, name + suffix + (customExtension || ext));
};
const compareImages = (actualBuffer, expectedBuffer, mimeType) => {
    (0, assert_1.default)(typeof actualBuffer !== 'string');
    (0, assert_1.default)(typeof expectedBuffer !== 'string');
    const actual = mimeType === 'image/png'
        ? pngjs_1.PNG.sync.read(actualBuffer)
        : jpeg_js_1.default.decode(actualBuffer);
    const expected = mimeType === 'image/png'
        ? pngjs_1.PNG.sync.read(expectedBuffer)
        : jpeg_js_1.default.decode(expectedBuffer);
    if (expected.width !== actual.width || expected.height !== actual.height) {
        throw new Error(`Sizes differ: expected image ${expected.width}px X ${expected.height}px, but got ${actual.width}px X ${actual.height}px.`);
    }
    const diff = new pngjs_1.PNG({ width: expected.width, height: expected.height });
    const count = (0, pixelmatch_1.default)(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.1 });
    return count > 0 ? { diff: pngjs_1.PNG.sync.write(diff) } : undefined;
};
const compareText = (actual, expectedBuffer) => {
    (0, assert_1.default)(typeof actual === 'string');
    const expected = expectedBuffer.toString('utf-8');
    if (expected === actual) {
        return;
    }
    const result = (0, diff_1.diffLines)(expected, actual);
    const html = result.reduce((text, change) => {
        text += change.added
            ? `<span class='ins'>${change.value}</span>`
            : change.removed
                ? `<span class='del'>${change.value}</span>`
                : change.value;
        return text;
    }, `<link rel="stylesheet" href="file://${path_1.default.join(__dirname, 'diffstyle.css')}">`);
    return {
        diff: html,
        ext: '.html',
    };
};
GoldenComparators.set('image/png', compareImages);
GoldenComparators.set('image/jpeg', compareImages);
GoldenComparators.set('text/plain', compareText);
const compare = (goldenPath, outputPath, actual, goldenName) => {
    goldenPath = path_1.default.normalize(goldenPath);
    outputPath = path_1.default.normalize(outputPath);
    const expectedPath = path_1.default.join(goldenPath, goldenName);
    const actualPath = path_1.default.join(outputPath, goldenName);
    const messageSuffix = `Output is saved in "${path_1.default.basename(outputPath + '" directory')}`;
    if (!fs_1.default.existsSync(expectedPath)) {
        ensureOutputDir();
        fs_1.default.writeFileSync(actualPath, actual);
        return {
            pass: false,
            message: `${goldenName} is missing in golden results. ${messageSuffix}`,
        };
    }
    const expected = fs_1.default.readFileSync(expectedPath);
    const mimeType = mime_1.default.getType(goldenName);
    (0, assert_1.default)(mimeType);
    const comparator = GoldenComparators.get(mimeType);
    if (!comparator) {
        return {
            pass: false,
            message: `Failed to find comparator with type ${mimeType}: ${goldenName}`,
        };
    }
    const result = comparator(actual, expected, mimeType);
    if (!result) {
        return { pass: true };
    }
    ensureOutputDir();
    if (goldenPath === outputPath) {
        fs_1.default.writeFileSync(addSuffix(actualPath, '-actual'), actual);
    }
    else {
        fs_1.default.writeFileSync(actualPath, actual);
        // Copy expected to the output/ folder for convenience.
        fs_1.default.writeFileSync(addSuffix(actualPath, '-expected'), expected);
    }
    if (result) {
        const diffPath = addSuffix(actualPath, '-diff', result.ext);
        fs_1.default.writeFileSync(diffPath, result.diff);
    }
    return {
        pass: false,
        message: `${goldenName} mismatch! ${messageSuffix}`,
    };
    function ensureOutputDir() {
        if (!fs_1.default.existsSync(outputPath)) {
            fs_1.default.mkdirSync(outputPath);
        }
    }
};
exports.compare = compare;
//# sourceMappingURL=golden-utils.js.map