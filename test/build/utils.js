"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        function next() {
            while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                    var result = rec.dispose && rec.dispose.call(rec.value);
                    if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                catch (e) {
                    fail(e);
                }
            }
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rmIfExists = exports.getUniqueVideoFilePlaceholder = exports.waitEvent = exports.dumpFrames = exports.navigateFrame = exports.detachFrame = exports.isFavicon = exports.attachFrame = exports.extendExpectWithToBeGolden = void 0;
const promises_1 = require("fs/promises");
const os_1 = require("os");
const expect_1 = __importDefault(require("expect"));
const Deferred_js_1 = require("puppeteer-core/internal/util/Deferred.js");
const golden_utils_js_1 = require("./golden-utils.js");
const extendExpectWithToBeGolden = (goldenDir, outputDir) => {
    expect_1.default.extend({
        toBeGolden: (testScreenshot, goldenFilePath) => {
            const result = (0, golden_utils_js_1.compare)(goldenDir, outputDir, testScreenshot, goldenFilePath);
            if (result.pass) {
                return {
                    pass: true,
                    message: () => {
                        return '';
                    },
                };
            }
            else {
                return {
                    pass: false,
                    message: () => {
                        return result.message;
                    },
                };
            }
        },
    });
};
exports.extendExpectWithToBeGolden = extendExpectWithToBeGolden;
const attachFrame = async (pageOrFrame, frameId, url) => {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
        const handle = __addDisposableResource(env_1, await pageOrFrame.evaluateHandle(async (frameId, url) => {
            const frame = document.createElement('iframe');
            frame.src = url;
            frame.id = frameId;
            document.body.appendChild(frame);
            await new Promise(x => {
                return (frame.onload = x);
            });
            return frame;
        }, frameId, url), false);
        return await handle.contentFrame();
    }
    catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
    }
    finally {
        __disposeResources(env_1);
    }
};
exports.attachFrame = attachFrame;
const isFavicon = (request) => {
    return request.url().includes('favicon.ico');
};
exports.isFavicon = isFavicon;
async function detachFrame(pageOrFrame, frameId) {
    await pageOrFrame.evaluate(frameId => {
        const frame = document.getElementById(frameId);
        frame.remove();
    }, frameId);
}
exports.detachFrame = detachFrame;
async function navigateFrame(pageOrFrame, frameId, url) {
    await pageOrFrame.evaluate((frameId, url) => {
        const frame = document.getElementById(frameId);
        frame.src = url;
        return new Promise(x => {
            return (frame.onload = x);
        });
    }, frameId, url);
}
exports.navigateFrame = navigateFrame;
const dumpFrames = async (frame, indentation) => {
    const env_2 = { stack: [], error: void 0, hasError: false };
    try {
        indentation = indentation || '';
        let description = frame.url().replace(/:\d{4,5}\//, ':<PORT>/');
        const element = __addDisposableResource(env_2, await frame.frameElement(), false);
        if (element) {
            const nameOrId = await element.evaluate(frame => {
                return frame.name || frame.id;
            });
            if (nameOrId) {
                description += ' (' + nameOrId + ')';
            }
        }
        const result = [indentation + description];
        for (const child of frame.childFrames()) {
            result.push(...(await (0, exports.dumpFrames)(child, '    ' + indentation)));
        }
        return result;
    }
    catch (e_2) {
        env_2.error = e_2;
        env_2.hasError = true;
    }
    finally {
        __disposeResources(env_2);
    }
};
exports.dumpFrames = dumpFrames;
const waitEvent = async (emitter, eventName, predicate = () => {
    return true;
}) => {
    const deferred = Deferred_js_1.Deferred.create({
        timeout: 5000,
        message: `Waiting for ${eventName} event timed out.`,
    });
    const handler = (event) => {
        if (!predicate(event)) {
            return;
        }
        deferred.resolve(event);
    };
    emitter.on(eventName, handler);
    try {
        return await deferred.valueOrThrow();
    }
    finally {
        emitter.off(eventName, handler);
    }
};
exports.waitEvent = waitEvent;
function getUniqueVideoFilePlaceholder() {
    return {
        filename: `${(0, os_1.tmpdir)()}/test-video-${Math.round(Math.random() * 10000)}.webm`,
        [Symbol.dispose]() {
            void rmIfExists(this.filename);
        },
    };
}
exports.getUniqueVideoFilePlaceholder = getUniqueVideoFilePlaceholder;
function rmIfExists(file) {
    return (0, promises_1.rm)(file).catch(() => { });
}
exports.rmIfExists = rmIfExists;
//# sourceMappingURL=utils.js.map