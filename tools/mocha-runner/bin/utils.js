"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testIdMatchesExpectationPattern = exports.getTestId = exports.getTestResultForFailure = exports.getExpectationUpdates = exports.isWildCardPattern = exports.findEffectiveExpectationForTest = exports.filterByParameters = exports.printSuggestions = exports.prettyPrintJSON = exports.filterByPlatform = exports.writeJSON = exports.readJSON = exports.getFilename = exports.extendProcessEnv = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function extendProcessEnv(envs) {
    const env = envs.reduce((acc, item) => {
        Object.assign(acc, item);
        return acc;
    }, {
        ...process.env,
    });
    if (process.env['CI']) {
        const puppeteerEnv = Object.entries(env).reduce((acc, [key, value]) => {
            if (key.startsWith('PUPPETEER_')) {
                acc[key] = value;
            }
            return acc;
        }, {});
        console.log('PUPPETEER env:\n', JSON.stringify(puppeteerEnv, null, 2), '\n');
    }
    return env;
}
exports.extendProcessEnv = extendProcessEnv;
function getFilename(file) {
    return path_1.default.basename(file).replace(path_1.default.extname(file), '');
}
exports.getFilename = getFilename;
function readJSON(path) {
    return JSON.parse(fs_1.default.readFileSync(path, 'utf-8'));
}
exports.readJSON = readJSON;
function writeJSON(path, json) {
    return fs_1.default.writeFileSync(path, JSON.stringify(json, null, 2));
}
exports.writeJSON = writeJSON;
function filterByPlatform(items, platform) {
    return items.filter(item => {
        return item.platforms.includes(platform);
    });
}
exports.filterByPlatform = filterByPlatform;
function prettyPrintJSON(json) {
    console.log(JSON.stringify(json, null, 2));
}
exports.prettyPrintJSON = prettyPrintJSON;
function printSuggestions(recommendations, action, message) {
    const toPrint = recommendations.filter(item => {
        return item.action === action;
    });
    if (toPrint.length) {
        console.log(message);
        prettyPrintJSON(toPrint.map(item => {
            return item.expectation;
        }));
        if (action !== 'remove') {
            console.log('The recommendations are based on the following applied expectations:');
            prettyPrintJSON(toPrint.map(item => {
                return item.basedOn;
            }));
        }
    }
}
exports.printSuggestions = printSuggestions;
function filterByParameters(expectations, parameters) {
    const querySet = new Set(parameters);
    return expectations.filter(ex => {
        return ex.parameters.every(param => {
            return querySet.has(param);
        });
    });
}
exports.filterByParameters = filterByParameters;
/**
 * The last expectation that matches an empty string as all tests pattern
 * or the name of the file or the whole name of the test the filter wins.
 */
function findEffectiveExpectationForTest(expectations, result) {
    return expectations.find(expectation => {
        return testIdMatchesExpectationPattern(result, expectation.testIdPattern);
    });
}
exports.findEffectiveExpectationForTest = findEffectiveExpectationForTest;
function isWildCardPattern(testIdPattern) {
    return testIdPattern.includes('*');
}
exports.isWildCardPattern = isWildCardPattern;
function getExpectationUpdates(results, expectations, context) {
    const output = new Map();
    const passesByKey = results.passes.reduce((acc, pass) => {
        acc.add(getTestId(pass.file, pass.fullTitle));
        return acc;
    }, new Set());
    for (const pass of results.passes) {
        const expectationEntry = findEffectiveExpectationForTest(expectations, pass);
        if (expectationEntry && !expectationEntry.expectations.includes('PASS')) {
            if (isWildCardPattern(expectationEntry.testIdPattern)) {
                addEntry({
                    expectation: {
                        testIdPattern: getTestId(pass.file, pass.fullTitle),
                        platforms: context.platforms,
                        parameters: context.parameters,
                        expectations: ['PASS'],
                    },
                    action: 'add',
                    basedOn: expectationEntry,
                });
            }
            else {
                addEntry({
                    expectation: expectationEntry,
                    action: 'remove',
                    basedOn: expectationEntry,
                });
            }
        }
    }
    for (const failure of results.failures) {
        // If an error occurs during a hook
        // the error not have a file associated with it
        if (!failure.file) {
            console.error('Hook failed:', failure.err);
            addEntry({
                expectation: {
                    testIdPattern: failure.fullTitle,
                    platforms: context.platforms,
                    parameters: context.parameters,
                    expectations: [],
                },
                action: 'add',
            });
            continue;
        }
        if (passesByKey.has(getTestId(failure.file, failure.fullTitle))) {
            continue;
        }
        const expectationEntry = findEffectiveExpectationForTest(expectations, failure);
        if (expectationEntry && !expectationEntry.expectations.includes('SKIP')) {
            if (!expectationEntry.expectations.includes(getTestResultForFailure(failure))) {
                // If the effective explanation is a wildcard, we recommend adding a new
                // expectation instead of updating the wildcard that might affect multiple
                // tests.
                if (isWildCardPattern(expectationEntry.testIdPattern)) {
                    addEntry({
                        expectation: {
                            testIdPattern: getTestId(failure.file, failure.fullTitle),
                            platforms: context.platforms,
                            parameters: context.parameters,
                            expectations: [getTestResultForFailure(failure)],
                        },
                        action: 'add',
                        basedOn: expectationEntry,
                    });
                }
                else {
                    addEntry({
                        expectation: {
                            ...expectationEntry,
                            expectations: [
                                ...expectationEntry.expectations,
                                getTestResultForFailure(failure),
                            ],
                        },
                        action: 'update',
                        basedOn: expectationEntry,
                    });
                }
            }
        }
        else if (!expectationEntry) {
            addEntry({
                expectation: {
                    testIdPattern: getTestId(failure.file, failure.fullTitle),
                    platforms: context.platforms,
                    parameters: context.parameters,
                    expectations: [getTestResultForFailure(failure)],
                },
                action: 'add',
            });
        }
    }
    function addEntry(value) {
        const key = JSON.stringify(value);
        if (!output.has(key)) {
            output.set(key, value);
        }
    }
    return [...output.values()];
}
exports.getExpectationUpdates = getExpectationUpdates;
function getTestResultForFailure(test) {
    return test.err?.code === 'ERR_MOCHA_TIMEOUT' ? 'TIMEOUT' : 'FAIL';
}
exports.getTestResultForFailure = getTestResultForFailure;
function getTestId(file, fullTitle) {
    return fullTitle
        ? `[${getFilename(file)}] ${fullTitle}`
        : `[${getFilename(file)}]`;
}
exports.getTestId = getTestId;
function testIdMatchesExpectationPattern(test, pattern) {
    const patternRegExString = pattern
        // Replace `*` with non special character
        .replace(/\*/g, '--STAR--')
        // Escape special characters https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Replace placeholder with greedy match
        .replace(/--STAR--/g, '(.*)?');
    // Match beginning and end explicitly
    const patternRegEx = new RegExp(`^${patternRegExString}$`);
    const fullTitle = typeof test.fullTitle === 'string' ? test.fullTitle : test.fullTitle();
    return patternRegEx.test(getTestId(test.file ?? '', fullTitle));
}
exports.testIdMatchesExpectationPattern = testIdMatchesExpectationPattern;
//# sourceMappingURL=utils.js.map