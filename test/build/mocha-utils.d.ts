/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { TestServer } from '@pptr/testserver';
import type * as MochaBase from 'mocha';
import type { Browser } from 'puppeteer-core/internal/api/Browser.js';
import type { BrowserContext } from 'puppeteer-core/internal/api/BrowserContext.js';
import type { Page } from 'puppeteer-core/internal/api/Page.js';
import type { Cookie } from 'puppeteer-core/internal/common/Cookie.js';
import type { PuppeteerLaunchOptions, PuppeteerNode } from 'puppeteer-core/internal/node/PuppeteerNode.js';
declare global {
    namespace Mocha {
        interface SuiteFunction {
            /**
             * Use it if you want to capture debug logs for a specitic test suite in CI.
             * This describe function enables capturing of debug logs and would print them
             * only if a test fails to reduce the amount of output.
             */
            withDebugLogs: (description: string, body: (this: MochaBase.Suite) => void) => void;
        }
        interface TestFunction {
            deflake: (repeats: number, title: string, fn: MochaBase.AsyncFunc) => void;
            deflakeOnly: (repeats: number, title: string, fn: MochaBase.AsyncFunc) => void;
        }
    }
}
export declare const isHeadless: boolean;
export declare const setupTestBrowserHooks: () => void;
export declare const getTestState: (options?: {
    skipLaunch?: boolean;
    skipContextCreation?: boolean;
}) => Promise<PuppeteerTestState>;
export interface PuppeteerTestState {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    puppeteer: PuppeteerNode;
    defaultBrowserOptions: PuppeteerLaunchOptions;
    server: TestServer;
    httpsServer: TestServer;
    isFirefox: boolean;
    isChrome: boolean;
    isHeadless: boolean;
    headless: 'true' | 'false' | 'shell';
    puppeteerPath: string;
}
export declare const mochaHooks: {
    beforeAll(): Promise<void>;
    afterAll(): Promise<void>;
    afterEach(): Promise<void>;
};
declare module 'expect' {
    interface Matchers<R> {
        atLeastOneToContain(expected: string[]): R;
    }
}
export declare const expectCookieEquals: (cookies: Cookie[], expectedCookies: Array<Partial<Cookie>>) => Promise<void>;
export declare const shortWaitForArrayToHaveAtLeastNElements: (data: unknown[], minLength: number, attempts?: number, timeout?: number) => Promise<void>;
export declare const createTimeout: <T>(n: number, value?: T | undefined) => Promise<T | undefined>;
export declare const launch: (launchOptions: Readonly<PuppeteerLaunchOptions>, options?: {
    after?: 'each' | 'all';
    createContext?: boolean;
    createPage?: boolean;
}) => Promise<PuppeteerTestState & {
    close: () => Promise<void>;
}>;
//# sourceMappingURL=mocha-utils.d.ts.map