"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationProjects = exports.getAngularConfig = exports.getObjectAsJson = exports.getJsonFileAsObject = void 0;
const schematics_1 = require("@angular-devkit/schematics");
function getJsonFileAsObject(tree, path) {
    try {
        const buffer = tree.read(path);
        const content = buffer.toString();
        return JSON.parse(content);
    }
    catch {
        throw new schematics_1.SchematicsException(`Unable to retrieve file at ${path}.`);
    }
}
exports.getJsonFileAsObject = getJsonFileAsObject;
function getObjectAsJson(object) {
    return JSON.stringify(object, null, 2);
}
exports.getObjectAsJson = getObjectAsJson;
function getAngularConfig(tree) {
    return getJsonFileAsObject(tree, './angular.json');
}
exports.getAngularConfig = getAngularConfig;
function getApplicationProjects(tree) {
    const { projects } = getAngularConfig(tree);
    const applications = {};
    for (const key in projects) {
        const project = projects[key];
        if (project.projectType === 'application') {
            applications[key] = project;
        }
    }
    return applications;
}
exports.getApplicationProjects = getApplicationProjects;
//# sourceMappingURL=json.js.map