/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import type { Frame } from 'puppeteer-core/internal/api/Frame.js';
import type { Page } from 'puppeteer-core/internal/api/Page.js';
import type { EventEmitter } from 'puppeteer-core/internal/common/EventEmitter.js';
declare module 'expect' {
    interface Matchers<R> {
        toBeGolden(pathOrBuffer: string | Buffer): R;
    }
}
export declare const extendExpectWithToBeGolden: (goldenDir: string, outputDir: string) => void;
export declare const attachFrame: (pageOrFrame: Page | Frame, frameId: string, url: string) => Promise<Frame>;
export declare const isFavicon: (request: {
    url: () => string | string[];
}) => boolean;
export declare function detachFrame(pageOrFrame: Page | Frame, frameId: string): Promise<void>;
export declare function navigateFrame(pageOrFrame: Page | Frame, frameId: string, url: string): Promise<void>;
export declare const dumpFrames: (frame: Frame, indentation?: string) => Promise<string[]>;
export declare const waitEvent: <T = any>(emitter: EventEmitter<any>, eventName: string, predicate?: (event: T) => boolean) => Promise<T>;
export interface FilePlaceholder {
    filename: `${string}.webm`;
    [Symbol.dispose](): void;
}
export declare function getUniqueVideoFilePlaceholder(): FilePlaceholder;
export declare function rmIfExists(file: string): Promise<void>;
//# sourceMappingURL=utils.d.ts.map