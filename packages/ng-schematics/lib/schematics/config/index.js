"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const files_js_1 = require("../utils/files.js");
const types_js_1 = require("../utils/types.js");
// You don't have to export the function as default. You can also have more than one rule
// factory per file.
function config() {
    return (tree, context) => {
        return (0, schematics_1.chain)([addPuppeteerConfig()])(tree, context);
    };
}
exports.config = config;
function addPuppeteerConfig() {
    return (_tree, context) => {
        context.logger.debug('Adding Puppeteer config file.');
        return (0, files_js_1.addFilesSingle)('', { root: '' }, {
            // No-op here to fill types
            options: {
                testRunner: types_js_1.TestRunner.Jasmine,
                port: 4200,
            },
            applyPath: './files',
            relativeToWorkspacePath: `/`,
        });
    };
}
//# sourceMappingURL=index.js.map