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
const mocha_1 = __importDefault(require("mocha"));
class SpecJSONReporter extends mocha_1.default.reporters.Spec {
    constructor(runner, options) {
        super(runner, options);
        mocha_1.default.reporters.JSON.call(this, runner, options);
    }
}
module.exports = SpecJSONReporter;
//# sourceMappingURL=reporter.js.map