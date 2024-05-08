/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Tree } from '@angular-devkit/schematics';
import { type SchematicsOptions } from './types.js';
export interface NodePackage {
    name: string;
    version: string;
}
export interface NodeScripts {
    name: string;
    script: string;
}
export declare enum DependencyType {
    Default = "dependencies",
    Dev = "devDependencies",
    Peer = "peerDependencies",
    Optional = "optionalDependencies"
}
export declare function getPackageLatestNpmVersion(name: string): Promise<NodePackage>;
export declare function addPackageJsonDependencies(tree: Tree, packages: NodePackage[], type: DependencyType, overwrite?: boolean, fileLocation?: string): Tree;
export declare function getDependenciesFromOptions(options: SchematicsOptions): string[];
export declare function addPackageJsonScripts(tree: Tree, scripts: NodeScripts[], overwrite?: boolean, fileLocation?: string): Tree;
export declare function updateAngularJsonScripts(tree: Tree, options: SchematicsOptions, overwrite?: boolean): Tree;
//# sourceMappingURL=packages.d.ts.map