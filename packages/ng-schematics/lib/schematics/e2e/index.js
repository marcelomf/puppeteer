"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.e2e = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const files_js_1 = require("../utils/files.js");
const json_js_1 = require("../utils/json.js");
const types_js_1 = require("../utils/types.js");
// You don't have to export the function as default. You can also have more than one rule
// factory per file.
function e2e(userArgs) {
    const options = parseUserTestArgs(userArgs);
    return (tree, context) => {
        return (0, schematics_1.chain)([addE2EFile(options)])(tree, context);
    };
}
exports.e2e = e2e;
function parseUserTestArgs(userArgs) {
    const options = {
        ...userArgs,
    };
    if ('p' in userArgs) {
        options['project'] = userArgs['p'];
    }
    if ('n' in userArgs) {
        options['name'] = userArgs['n'];
    }
    if ('r' in userArgs) {
        options['route'] = userArgs['r'];
    }
    if (options['route'] && options['route'].startsWith('/')) {
        options['route'] = options['route'].substring(1);
    }
    return options;
}
function findTestingOption([name, project], property) {
    if (!project) {
        throw new Error(`Project "${name}" not found.`);
    }
    const e2e = project.architect?.e2e;
    const puppeteer = project.architect?.puppeteer;
    const builder = '@puppeteer/ng-schematics:puppeteer';
    if (e2e?.builder === builder) {
        return e2e.options[property];
    }
    else if (puppeteer?.builder === builder) {
        return puppeteer.options[property];
    }
    throw new Error(`Can't find property "${property}" for project "${name}".`);
}
function addE2EFile(options) {
    return async (tree, context) => {
        context.logger.debug('Adding Spec file.');
        const projects = (0, json_js_1.getApplicationProjects)(tree);
        const projectNames = Object.keys(projects);
        const foundProject = projectNames.length === 1
            ? [projectNames[0], projects[projectNames[0]]]
            : Object.entries(projects).find(([name, project]) => {
                return options.project
                    ? options.project === name
                    : project.root === '';
            });
        if (!foundProject) {
            throw new schematics_1.SchematicsException(`Project not found! Please run "ng generate @puppeteer/ng-schematics:test <Test> <Project>"`);
        }
        const testRunner = findTestingOption(foundProject, 'testRunner');
        const port = findTestingOption(foundProject, 'port');
        context.logger.debug('Creating Spec file.');
        return (0, files_js_1.addCommonFiles)({ [foundProject[0]]: foundProject[1] }, {
            options: {
                name: options.name,
                route: options.route,
                testRunner,
                // Node test runner does not support glob patterns
                // It looks for files `*.test.js`
                ext: testRunner === types_js_1.TestRunner.Node ? 'test' : 'e2e',
                port,
            },
        });
    };
}
//# sourceMappingURL=index.js.map