"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.zTestSuiteFile = exports.zTestSuite = exports.zPlatform = void 0;
const zod_1 = require("zod");
exports.zPlatform = zod_1.z.enum(['win32', 'linux', 'darwin']);
exports.zTestSuite = zod_1.z.object({
    id: zod_1.z.string(),
    platforms: zod_1.z.array(exports.zPlatform),
    parameters: zod_1.z.array(zod_1.z.string()),
    expectedLineCoverage: zod_1.z.number(),
});
exports.zTestSuiteFile = zod_1.z.object({
    testSuites: zod_1.z.array(exports.zTestSuite),
    parameterDefinitions: zod_1.z.record(zod_1.z.any()),
});
//# sourceMappingURL=types.js.map