/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Rule } from '@angular-devkit/schematics';
import type { AngularProject, TestRunner } from './types.js';
export interface FilesOptions {
    options: {
        testRunner: TestRunner;
        port: number;
        name?: string;
        exportConfig?: boolean;
        ext?: string;
        route?: string;
    };
    applyPath: string;
    relativeToWorkspacePath: string;
    movePath?: string;
}
export declare function addFilesToProjects(projects: Record<string, AngularProject>, options: FilesOptions): Rule;
export declare function addFilesSingle(name: string, project: AngularProject, { options, applyPath, movePath, relativeToWorkspacePath }: FilesOptions): Rule;
export declare function addCommonFiles(projects: Record<string, AngularProject>, filesOptions: Omit<FilesOptions, 'applyPath' | 'relativeToWorkspacePath'>): Rule;
export declare function addFrameworkFiles(projects: Record<string, AngularProject>, filesOptions: Omit<FilesOptions, 'applyPath' | 'relativeToWorkspacePath'>): Rule;
export declare function hasE2ETester(projects: Record<string, AngularProject>): boolean;
export declare function getNgCommandName(projects: Record<string, AngularProject>): string;
//# sourceMappingURL=files.d.ts.map