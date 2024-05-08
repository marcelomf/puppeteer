/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Tree } from '@angular-devkit/schematics';
import type { AngularJson, AngularProject } from './types.js';
export declare function getJsonFileAsObject(tree: Tree, path: string): Record<string, unknown>;
export declare function getObjectAsJson(object: Record<string, unknown>): string;
export declare function getAngularConfig(tree: Tree): AngularJson;
export declare function getApplicationProjects(tree: Tree): Record<string, AngularProject>;
//# sourceMappingURL=json.d.ts.map