/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" resolution-mode="require"/>
import { execFile as execFileAsync } from 'child_process';
export declare const execFile: typeof execFileAsync.__promisify__;
export declare const readAsset: (...components: string[]) => Promise<string>;
//# sourceMappingURL=util.d.ts.map