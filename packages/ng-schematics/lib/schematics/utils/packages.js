"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAngularJsonScripts = exports.addPackageJsonScripts = exports.getDependenciesFromOptions = exports.addPackageJsonDependencies = exports.getPackageLatestNpmVersion = exports.DependencyType = void 0;
const https_1 = require("https");
const files_js_1 = require("./files.js");
const json_js_1 = require("./json.js");
const types_js_1 = require("./types.js");
var DependencyType;
(function (DependencyType) {
    DependencyType["Default"] = "dependencies";
    DependencyType["Dev"] = "devDependencies";
    DependencyType["Peer"] = "peerDependencies";
    DependencyType["Optional"] = "optionalDependencies";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
function getPackageLatestNpmVersion(name) {
    return new Promise(resolve => {
        let version = 'latest';
        return (0, https_1.get)(`https://registry.npmjs.org/${name}`, res => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    version = response?.['dist-tags']?.latest ?? version;
                }
                catch {
                }
                finally {
                    resolve({
                        name,
                        version,
                    });
                }
            });
        }).on('error', () => {
            resolve({
                name,
                version,
            });
        });
    });
}
exports.getPackageLatestNpmVersion = getPackageLatestNpmVersion;
function updateJsonValues(json, target, updates, overwrite = false) {
    updates.forEach(({ name, value }) => {
        if (!json[target][name] || overwrite) {
            json[target] = {
                ...json[target],
                [name]: value,
            };
        }
    });
}
function addPackageJsonDependencies(tree, packages, type, overwrite, fileLocation = './package.json') {
    const packageJson = (0, json_js_1.getJsonFileAsObject)(tree, fileLocation);
    updateJsonValues(packageJson, type, packages.map(({ name, version }) => {
        return { name, value: version };
    }), overwrite);
    tree.overwrite(fileLocation, (0, json_js_1.getObjectAsJson)(packageJson));
    return tree;
}
exports.addPackageJsonDependencies = addPackageJsonDependencies;
function getDependenciesFromOptions(options) {
    const dependencies = ['puppeteer'];
    switch (options.testRunner) {
        case types_js_1.TestRunner.Jasmine:
            dependencies.push('jasmine');
            break;
        case types_js_1.TestRunner.Jest:
            dependencies.push('jest', '@types/jest');
            break;
        case types_js_1.TestRunner.Mocha:
            dependencies.push('mocha', '@types/mocha');
            break;
        case types_js_1.TestRunner.Node:
            dependencies.push('@types/node');
            break;
    }
    return dependencies;
}
exports.getDependenciesFromOptions = getDependenciesFromOptions;
function addPackageJsonScripts(tree, scripts, overwrite, fileLocation = './package.json') {
    const packageJson = (0, json_js_1.getJsonFileAsObject)(tree, fileLocation);
    updateJsonValues(packageJson, 'scripts', scripts.map(({ name, script }) => {
        return { name, value: script };
    }), overwrite);
    tree.overwrite(fileLocation, (0, json_js_1.getObjectAsJson)(packageJson));
    return tree;
}
exports.addPackageJsonScripts = addPackageJsonScripts;
function updateAngularJsonScripts(tree, options, overwrite = true) {
    const angularJson = (0, json_js_1.getAngularConfig)(tree);
    const projects = (0, json_js_1.getApplicationProjects)(tree);
    const name = (0, files_js_1.getNgCommandName)(projects);
    Object.keys(projects).forEach(project => {
        const e2eScript = [
            {
                name,
                value: {
                    builder: '@puppeteer/ng-schematics:puppeteer',
                    options: {
                        devServerTarget: `${project}:serve`,
                        testRunner: options.testRunner,
                    },
                    configurations: {
                        production: {
                            devServerTarget: `${project}:serve:production`,
                        },
                    },
                },
            },
        ];
        updateJsonValues(angularJson['projects'][project], 'architect', e2eScript, overwrite);
    });
    tree.overwrite('./angular.json', (0, json_js_1.getObjectAsJson)(angularJson));
    return tree;
}
exports.updateAngularJsonScripts = updateAngularJsonScripts;
//# sourceMappingURL=packages.js.map