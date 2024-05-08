import type { JsonObject } from '@angular-devkit/core';
import { TestRunner } from '../../schematics/utils/types.js';
import type { PuppeteerBuilderOptions } from './types.js';
export declare function getCommandForRunner(runner: TestRunner): [string, ...string[]];
declare const _default: import("@angular-devkit/architect/src/internal.js").Builder<PuppeteerBuilderOptions & JsonObject>;
export default _default;
//# sourceMappingURL=index.d.ts.map