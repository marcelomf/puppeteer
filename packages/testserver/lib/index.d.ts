/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
/// <reference types="node" />
import { type IncomingMessage, type ServerResponse } from 'http';
import { type ServerOptions as HttpsServerOptions } from 'https';
type TestIncomingMessage = IncomingMessage & {
    postBody?: Promise<string>;
};
export declare class TestServer {
    #private;
    PORT: number;
    PREFIX: string;
    CROSS_PROCESS_PREFIX: string;
    EMPTY_PAGE: string;
    static create(dirPath: string): Promise<TestServer>;
    static createHTTPS(dirPath: string): Promise<TestServer>;
    constructor(dirPath: string, sslOptions?: HttpsServerOptions);
    get port(): number;
    enableHTTPCache(pathPrefix: string): void;
    setAuth(path: string, username: string, password: string): void;
    enableGzip(path: string): void;
    setCSP(path: string, csp: string): void;
    stop(): Promise<void>;
    setRoute(path: string, handler: (req: IncomingMessage, res: ServerResponse) => void): void;
    setRedirect(from: string, to: string): void;
    waitForRequest(path: string): Promise<TestIncomingMessage>;
    reset(): void;
    serveFile(request: IncomingMessage, response: ServerResponse, pathName: string): void;
}
export {};
//# sourceMappingURL=index.d.ts.map