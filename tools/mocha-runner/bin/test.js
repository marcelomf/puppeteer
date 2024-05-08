"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const utils_js_1 = require("./utils.js");
const utils_js_2 = require("./utils.js");
(0, node_test_1.describe)('extendProcessEnv', () => {
    (0, node_test_1.it)('should extend env variables for the subprocess', () => {
        const env = (0, utils_js_2.extendProcessEnv)([{ TEST: 'TEST' }, { TEST2: 'TEST2' }]);
        strict_1.default.equal(env['TEST'], 'TEST');
        strict_1.default.equal(env['TEST2'], 'TEST2');
    });
});
(0, node_test_1.describe)('getFilename', () => {
    (0, node_test_1.it)('extract filename for a path', () => {
        strict_1.default.equal((0, utils_js_2.getFilename)('/etc/test.ts'), 'test');
        strict_1.default.equal((0, utils_js_2.getFilename)('/etc/test.js'), 'test');
    });
});
(0, node_test_1.describe)('getTestResultForFailure', () => {
    (0, node_test_1.it)('should get a test result for a mocha failure', () => {
        strict_1.default.equal((0, utils_js_1.getTestResultForFailure)({ err: { code: 'ERR_MOCHA_TIMEOUT' } }), 'TIMEOUT');
        strict_1.default.equal((0, utils_js_1.getTestResultForFailure)({ err: { code: 'ERROR' } }), 'FAIL');
    });
});
(0, node_test_1.describe)('filterByParameters', () => {
    (0, node_test_1.it)('should filter a list of expectations by parameters', () => {
        const expectations = [
            {
                testIdPattern: '[oopif.spec] OOPIF "after all" hook for "should keep track of a frames OOP state"',
                platforms: ['darwin'],
                parameters: ['firefox', 'headless'],
                expectations: ['FAIL'],
            },
        ];
        strict_1.default.equal((0, utils_js_1.filterByParameters)(expectations, ['firefox', 'headless']).length, 1);
        strict_1.default.equal((0, utils_js_1.filterByParameters)(expectations, ['firefox']).length, 0);
        strict_1.default.equal((0, utils_js_1.filterByParameters)(expectations, ['firefox', 'headless', 'other']).length, 1);
        strict_1.default.equal((0, utils_js_1.filterByParameters)(expectations, ['other']).length, 0);
    });
});
(0, node_test_1.describe)('isWildCardPattern', () => {
    (0, node_test_1.it)('should detect if an expectation is a wildcard pattern', () => {
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)(''), false);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)('a'), false);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)('*'), true);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)('[queryHandler.spec]'), false);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)('[queryHandler.spec] *'), true);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)(' [queryHandler.spec] '), false);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)('[queryHandler.spec] Query'), false);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)('[queryHandler.spec] Page *'), true);
        strict_1.default.equal((0, utils_js_1.isWildCardPattern)('[queryHandler.spec] Page Page.goto *'), true);
    });
});
(0, node_test_1.describe)('testIdMatchesExpectationPattern', () => {
    const expectations = [
        ['', false],
        ['*', true],
        ['* should work', true],
        ['* Page.setContent *', true],
        ['* should work as expected', false],
        ['Page.setContent *', false],
        ['[page.spec]', false],
        ['[page.spec] *', true],
        ['[page.spec] Page *', true],
        ['[page.spec] Page Page.setContent *', true],
        ['[page.spec] Page Page.setContent should work', true],
        ['[page.spec] Page * should work', true],
        ['[page.spec] * Page.setContent *', true],
        ['[jshandle.spec] *', false],
        ['[jshandle.spec] JSHandle should work', false],
    ];
    (0, node_test_1.it)('with MochaTest', () => {
        const test = {
            title: 'should work',
            file: 'page.spec.ts',
            fullTitle() {
                return 'Page Page.setContent should work';
            },
        };
        for (const [pattern, expected] of expectations) {
            strict_1.default.equal((0, utils_js_1.testIdMatchesExpectationPattern)(test, pattern), expected, `Expected "${pattern}" to yield "${expected}"`);
        }
    });
    (0, node_test_1.it)('with MochaTestResult', () => {
        const test = {
            title: 'should work',
            file: 'page.spec.ts',
            fullTitle: 'Page Page.setContent should work',
        };
        for (const [pattern, expected] of expectations) {
            strict_1.default.equal((0, utils_js_1.testIdMatchesExpectationPattern)(test, pattern), expected, `Expected "${pattern}" to yield "${expected}"`);
        }
    });
});
(0, node_test_1.describe)('getExpectationUpdates', () => {
    (0, node_test_1.it)('should generate an update for expectations if a test passed with a fail expectation', () => {
        const mochaResults = {
            stats: { tests: 1 },
            pending: [],
            passes: [
                {
                    fullTitle: 'Page Page.setContent should work',
                    title: 'should work',
                    file: 'page.spec.ts',
                },
            ],
            failures: [],
        };
        const expectations = [
            {
                testIdPattern: '[page.spec] Page Page.setContent should work',
                platforms: ['darwin'],
                parameters: ['test'],
                expectations: ['FAIL'],
            },
        ];
        const updates = (0, utils_js_1.getExpectationUpdates)(mochaResults, expectations, {
            platforms: ['darwin'],
            parameters: ['test'],
        });
        strict_1.default.deepEqual(updates, [
            {
                action: 'remove',
                basedOn: {
                    expectations: ['FAIL'],
                    parameters: ['test'],
                    platforms: ['darwin'],
                    testIdPattern: '[page.spec] Page Page.setContent should work',
                },
                expectation: {
                    expectations: ['FAIL'],
                    parameters: ['test'],
                    platforms: ['darwin'],
                    testIdPattern: '[page.spec] Page Page.setContent should work',
                },
            },
        ]);
    });
    (0, node_test_1.it)('should not generate an update for successful retries', () => {
        const mochaResults = {
            stats: { tests: 1 },
            pending: [],
            passes: [
                {
                    fullTitle: 'Page Page.setContent should work',
                    title: 'should work',
                    file: 'page.spec.ts',
                },
            ],
            failures: [
                {
                    fullTitle: 'Page Page.setContent should work',
                    title: 'should work',
                    file: 'page.spec.ts',
                    err: { code: 'Timeout' },
                },
            ],
        };
        const updates = (0, utils_js_1.getExpectationUpdates)(mochaResults, [], {
            platforms: ['darwin'],
            parameters: ['test'],
        });
        strict_1.default.deepEqual(updates, []);
    });
});
//# sourceMappingURL=test.js.map