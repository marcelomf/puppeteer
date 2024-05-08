"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ngAdd = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const files_js_1 = require("../utils/files.js");
const json_js_1 = require("../utils/json.js");
const packages_js_1 = require("../utils/packages.js");
const types_js_1 = require("../utils/types.js");
const DEFAULT_PORT = 4200;
// You don't have to export the function as default. You can also have more than one rule
// factory per file.
function ngAdd(options) {
    return (tree, context) => {
        return (0, schematics_1.chain)([
            addDependencies(options),
            addCommonFiles(options),
            addOtherFiles(options),
            updateScripts(),
            updateAngularConfig(options),
        ])(tree, context);
    };
}
exports.ngAdd = ngAdd;
function addDependencies(options) {
    return (tree, context) => {
        context.logger.debug('Adding dependencies to "package.json"');
        const dependencies = (0, packages_js_1.getDependenciesFromOptions)(options);
        return (0, rxjs_1.of)(...dependencies).pipe((0, operators_1.concatMap)((packageName) => {
            return (0, packages_js_1.getPackageLatestNpmVersion)(packageName);
        }), (0, operators_1.scan)((array, nodePackage) => {
            array.push(nodePackage);
            return array;
        }, []), (0, operators_1.map)(packages => {
            context.logger.debug('Updating dependencies...');
            (0, packages_js_1.addPackageJsonDependencies)(tree, packages, packages_js_1.DependencyType.Dev);
            context.addTask(new tasks_1.NodePackageInstallTask({
                // Trigger Post-Install hooks to download the browser
                allowScripts: true,
            }));
            return tree;
        }));
    };
}
function updateScripts() {
    return (tree, context) => {
        context.logger.debug('Updating "package.json" scripts');
        const projects = (0, json_js_1.getApplicationProjects)(tree);
        const projectsKeys = Object.keys(projects);
        if (projectsKeys.length === 1) {
            const name = (0, files_js_1.getNgCommandName)(projects);
            const prefix = (0, files_js_1.hasE2ETester)(projects) ? `run ${projectsKeys[0]}:` : '';
            return (0, packages_js_1.addPackageJsonScripts)(tree, [
                {
                    name,
                    script: `ng ${prefix}${name}`,
                },
            ]);
        }
        return tree;
    };
}
function addCommonFiles(options) {
    return (tree, context) => {
        context.logger.debug('Adding Puppeteer base files.');
        const projects = (0, json_js_1.getApplicationProjects)(tree);
        return (0, files_js_1.addCommonFiles)(projects, {
            options: {
                ...options,
                port: DEFAULT_PORT,
                ext: options.testRunner === types_js_1.TestRunner.Node ? 'test' : 'e2e',
            },
        });
    };
}
function addOtherFiles(options) {
    return (tree, context) => {
        context.logger.debug('Adding Puppeteer additional files.');
        const projects = (0, json_js_1.getApplicationProjects)(tree);
        return (0, files_js_1.addFrameworkFiles)(projects, {
            options: {
                ...options,
                port: DEFAULT_PORT,
            },
        });
    };
}
function updateAngularConfig(options) {
    return (tree, context) => {
        context.logger.debug('Updating "angular.json".');
        return (0, packages_js_1.updateAngularJsonScripts)(tree, options);
    };
}
//# sourceMappingURL=index.js.map