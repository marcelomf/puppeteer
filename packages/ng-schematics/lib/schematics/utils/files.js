"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNgCommandName = exports.hasE2ETester = exports.addFrameworkFiles = exports.addCommonFiles = exports.addFilesSingle = exports.addFilesToProjects = void 0;
const path_1 = require("path");
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
function addFilesToProjects(projects, options) {
    return (0, schematics_1.chain)(Object.keys(projects).map(name => {
        return addFilesSingle(name, projects[name], options);
    }));
}
exports.addFilesToProjects = addFilesToProjects;
function addFilesSingle(name, project, { options, applyPath, movePath, relativeToWorkspacePath }) {
    const projectPath = (0, path_1.resolve)((0, core_1.getSystemPath)((0, core_1.normalize)(project.root)));
    const workspacePath = (0, path_1.resolve)((0, core_1.getSystemPath)((0, core_1.normalize)('')));
    const relativeToWorkspace = (0, path_1.relative)(`${projectPath}${relativeToWorkspacePath}`, workspacePath);
    const baseUrl = getProjectBaseUrl(project, options.port);
    const tsConfigPath = getTsConfigPath(project);
    return (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)(applyPath), [
        (0, schematics_1.move)(movePath ? `${project.root}${movePath}` : project.root),
        (0, schematics_1.applyTemplates)({
            ...options,
            ...core_1.strings,
            root: project.root ? `${project.root}/` : project.root,
            baseUrl,
            tsConfigPath,
            project: name,
            relativeToWorkspace,
        }),
    ]));
}
exports.addFilesSingle = addFilesSingle;
function getProjectBaseUrl(project, port) {
    let options = { protocol: 'http', port, host: 'localhost' };
    if (project.architect?.serve?.options) {
        const projectOptions = project.architect?.serve?.options;
        const projectPort = port !== 4200 ? port : projectOptions?.port ?? port;
        options = { ...options, ...projectOptions, port: projectPort };
        options.protocol = projectOptions.ssl ? 'https' : 'http';
    }
    return `${options.protocol}://${options.host}:${options.port}/`;
}
function getTsConfigPath(project) {
    const filename = 'tsconfig.json';
    if (!project.root) {
        return `../${filename}`;
    }
    const nested = project.root
        .split('/')
        .map(() => {
        return '../';
    })
        .join('');
    // Prepend a single `../` as we put the test inside `e2e` folder
    return `../${nested}${filename}`;
}
function addCommonFiles(projects, filesOptions) {
    const options = {
        ...filesOptions,
        applyPath: './files/common',
        relativeToWorkspacePath: `/`,
    };
    return addFilesToProjects(projects, options);
}
exports.addCommonFiles = addCommonFiles;
function addFrameworkFiles(projects, filesOptions) {
    const testRunner = filesOptions.options.testRunner;
    const options = {
        ...filesOptions,
        applyPath: `./files/${testRunner}`,
        relativeToWorkspacePath: `/`,
    };
    return addFilesToProjects(projects, options);
}
exports.addFrameworkFiles = addFrameworkFiles;
function hasE2ETester(projects) {
    return Object.values(projects).some((project) => {
        return Boolean(project.architect?.e2e);
    });
}
exports.hasE2ETester = hasE2ETester;
function getNgCommandName(projects) {
    if (!hasE2ETester(projects)) {
        return 'e2e';
    }
    return 'puppeteer';
}
exports.getNgCommandName = getNgCommandName;
//# sourceMappingURL=files.js.map