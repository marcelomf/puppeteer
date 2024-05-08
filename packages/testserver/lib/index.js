"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestServer = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const http_1 = require("http");
const https_1 = require("https");
const path_1 = require("path");
const zlib_1 = require("zlib");
const mime_1 = require("mime");
const ws_1 = require("ws");
class TestServer {
    PORT;
    PREFIX;
    CROSS_PROCESS_PREFIX;
    EMPTY_PAGE;
    #dirPath;
    #server;
    #wsServer;
    #startTime = new Date();
    #cachedPathPrefix;
    #connections = new Set();
    #routes = new Map();
    #auths = new Map();
    #csp = new Map();
    #gzipRoutes = new Set();
    #requestSubscribers = new Map();
    #requests = new Set();
    static async create(dirPath) {
        let res;
        const promise = new Promise(resolve => {
            res = resolve;
        });
        const server = new TestServer(dirPath);
        server.#server.once('listening', res);
        server.#server.listen(0);
        await promise;
        return server;
    }
    static async createHTTPS(dirPath) {
        let res;
        const promise = new Promise(resolve => {
            res = resolve;
        });
        const server = new TestServer(dirPath, {
            key: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '..', 'key.pem')),
            cert: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '..', 'cert.pem')),
            passphrase: 'aaaa',
        });
        server.#server.once('listening', res);
        server.#server.listen(0);
        await promise;
        return server;
    }
    constructor(dirPath, sslOptions) {
        this.#dirPath = dirPath;
        if (sslOptions) {
            this.#server = (0, https_1.createServer)(sslOptions, this.#onRequest);
        }
        else {
            this.#server = (0, http_1.createServer)(this.#onRequest);
        }
        this.#server.on('connection', this.#onServerConnection);
        // Disable this as sometimes the socket will timeout
        // We rely on the fact that we will close the server at the end
        this.#server.keepAliveTimeout = 0;
        this.#server.on('clientError', err => {
            if ('code' in err &&
                err.code === 'ERR_SSL_SSLV3_ALERT_CERTIFICATE_UNKNOWN') {
                return;
            }
            console.error('test-server client error', err);
        });
        this.#wsServer = new ws_1.Server({ server: this.#server });
        this.#wsServer.on('connection', this.#onWebSocketConnection);
    }
    #onServerConnection = (connection) => {
        this.#connections.add(connection);
        // ECONNRESET is a legit error given
        // that tab closing simply kills process.
        connection.on('error', error => {
            if (error.code !== 'ECONNRESET') {
                throw error;
            }
        });
        connection.once('close', () => {
            return this.#connections.delete(connection);
        });
    };
    get port() {
        return this.#server.address().port;
    }
    enableHTTPCache(pathPrefix) {
        this.#cachedPathPrefix = pathPrefix;
    }
    setAuth(path, username, password) {
        this.#auths.set(path, { username, password });
    }
    enableGzip(path) {
        this.#gzipRoutes.add(path);
    }
    setCSP(path, csp) {
        this.#csp.set(path, csp);
    }
    async stop() {
        this.reset();
        for (const socket of this.#connections) {
            socket.destroy();
        }
        this.#connections.clear();
        await new Promise(x => {
            return this.#server.close(x);
        });
    }
    setRoute(path, handler) {
        this.#routes.set(path, handler);
    }
    setRedirect(from, to) {
        this.setRoute(from, (_, res) => {
            res.writeHead(302, { location: to });
            res.end();
        });
    }
    waitForRequest(path) {
        const subscriber = this.#requestSubscribers.get(path);
        if (subscriber) {
            return subscriber.promise;
        }
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        this.#requestSubscribers.set(path, { resolve, reject, promise });
        return promise;
    }
    reset() {
        this.#routes.clear();
        this.#auths.clear();
        this.#csp.clear();
        this.#gzipRoutes.clear();
        const error = new Error('Static Server has been reset');
        for (const subscriber of this.#requestSubscribers.values()) {
            subscriber.reject.call(undefined, error);
        }
        this.#requestSubscribers.clear();
        for (const request of this.#requests.values()) {
            if (!request.writableEnded) {
                request.destroy();
            }
        }
        this.#requests.clear();
    }
    #onRequest = (request, response) => {
        this.#requests.add(response);
        request.on('error', (error) => {
            if (error.code === 'ECONNRESET') {
                response.end();
            }
            else {
                throw error;
            }
        });
        request.postBody = new Promise(resolve => {
            let body = '';
            request.on('data', (chunk) => {
                return (body += chunk);
            });
            request.on('end', () => {
                return resolve(body);
            });
        });
        (0, assert_1.default)(request.url);
        const url = new URL(request.url, `https://${request.headers.host}`);
        const path = url.pathname + url.search;
        const auth = this.#auths.get(path);
        if (auth) {
            const credentials = Buffer.from((request.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
            if (credentials !== `${auth.username}:${auth.password}`) {
                response.writeHead(401, {
                    'WWW-Authenticate': 'Basic realm="Secure Area"',
                });
                response.end('HTTP Error 401 Unauthorized: Access is denied');
                return;
            }
        }
        const subscriber = this.#requestSubscribers.get(path);
        if (subscriber) {
            subscriber.resolve.call(undefined, request);
            this.#requestSubscribers.delete(path);
        }
        const handler = this.#routes.get(path);
        if (handler) {
            handler.call(undefined, request, response);
        }
        else {
            this.serveFile(request, response, path);
        }
    };
    serveFile(request, response, pathName) {
        if (pathName === '/') {
            pathName = '/index.html';
        }
        const filePath = (0, path_1.join)(this.#dirPath, pathName.substring(1));
        if (this.#cachedPathPrefix && filePath.startsWith(this.#cachedPathPrefix)) {
            if (request.headers['if-modified-since']) {
                response.statusCode = 304; // not modified
                response.end();
                return;
            }
            response.setHeader('Cache-Control', 'public, max-age=31536000');
            response.setHeader('Last-Modified', this.#startTime.toISOString());
        }
        else {
            response.setHeader('Cache-Control', 'no-cache, no-store');
        }
        const csp = this.#csp.get(pathName);
        if (csp) {
            response.setHeader('Content-Security-Policy', csp);
        }
        (0, fs_1.readFile)(filePath, (err, data) => {
            // This can happen if the request is not awaited but started
            // in the test and get clean via `reset()`
            if (response.writableEnded) {
                return;
            }
            if (err) {
                response.statusCode = 404;
                response.end(`File not found: ${filePath}`);
                return;
            }
            const mimeType = (0, mime_1.getType)(filePath);
            if (mimeType) {
                const isTextEncoding = /^text\/|^application\/(javascript|json)/.test(mimeType);
                const contentType = isTextEncoding
                    ? `${mimeType}; charset=utf-8`
                    : mimeType;
                response.setHeader('Content-Type', contentType);
            }
            if (this.#gzipRoutes.has(pathName)) {
                response.setHeader('Content-Encoding', 'gzip');
                (0, zlib_1.gzip)(data, (_, result) => {
                    response.end(result);
                });
            }
            else {
                response.end(data);
            }
        });
    }
    #onWebSocketConnection = (socket) => {
        socket.send('opened');
    };
}
exports.TestServer = TestServer;
//# sourceMappingURL=index.js.map