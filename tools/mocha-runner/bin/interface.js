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
const mocha_1 = __importDefault(require("mocha"));
const common_1 = __importDefault(require("mocha/lib/interfaces/common"));
const Debug_js_1 = require("puppeteer-core/internal/common/Debug.js");
const utils_js_1 = require("./utils.js");
const skippedTests = process.env['PUPPETEER_SKIPPED_TEST_CONFIG']
    ? JSON.parse(process.env['PUPPETEER_SKIPPED_TEST_CONFIG'])
    : [];
const deflakeRetries = Number(process.env['PUPPETEER_DEFLAKE_RETRIES']
    ? process.env['PUPPETEER_DEFLAKE_RETRIES']
    : 100);
const deflakeTestPattern = process.env['PUPPETEER_DEFLAKE_TESTS'];
function shouldSkipTest(test) {
    // TODO: more efficient lookup.
    const definition = skippedTests.find(skippedTest => {
        return (0, utils_js_1.testIdMatchesExpectationPattern)(test, skippedTest.testIdPattern);
    });
    if (definition && definition.skip) {
        return true;
    }
    return false;
}
function shouldDeflakeTest(test) {
    if (deflakeTestPattern) {
        // TODO: cache if we have seen it already
        return (0, utils_js_1.testIdMatchesExpectationPattern)(test, deflakeTestPattern);
    }
    return false;
}
function dumpLogsIfFail() {
    if (this.currentTest?.state === 'failed') {
        console.log(`\n"${this.currentTest.fullTitle()}" failed. Here is a debug log:`);
        console.log((0, Debug_js_1.getCapturedLogs)().join('\n') + '\n');
    }
    (0, Debug_js_1.setLogCapture)(false);
}
function customBDDInterface(suite) {
    const suites = [suite];
    suite.on(mocha_1.default.Suite.constants.EVENT_FILE_PRE_REQUIRE, function (context, file, mocha) {
        const common = (0, common_1.default)(suites, context, mocha);
        context['before'] = common.before;
        context['after'] = common.after;
        context['beforeEach'] = common.beforeEach;
        context['afterEach'] = common.afterEach;
        if (mocha.options.delay) {
            context['run'] = common.runWithSuite(suite);
        }
        function describe(title, fn) {
            return common.suite.create({
                title: title,
                file: file,
                fn: fn,
            });
        }
        describe.only = function (title, fn) {
            return common.suite.only({
                title: title,
                file: file,
                fn: fn,
                isOnly: true,
            });
        };
        describe.skip = function (title, fn) {
            return common.suite.skip({
                title: title,
                file: file,
                fn: fn,
            });
        };
        describe.withDebugLogs = function (description, body) {
            context['describe']('with Debug Logs', () => {
                context['beforeEach'](() => {
                    (0, Debug_js_1.setLogCapture)(true);
                });
                context['afterEach'](dumpLogsIfFail);
                context['describe'](description, body);
            });
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        context['describe'] = describe;
        function it(title, fn, itOnly = false) {
            const suite = suites[0];
            const test = new mocha_1.default.Test(title, suite.isPending() ? undefined : fn);
            test.file = file;
            test.parent = suite;
            const describeOnly = Boolean(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            suite.parent?._onlySuites.find(child => {
                return child === suite;
            }));
            if (shouldDeflakeTest(test)) {
                const deflakeSuit = mocha_1.default.Suite.create(suite, 'with Debug Logs');
                test.file = file;
                deflakeSuit.beforeEach(function () {
                    (0, Debug_js_1.setLogCapture)(true);
                });
                deflakeSuit.afterEach(dumpLogsIfFail);
                for (let i = 0; i < deflakeRetries; i++) {
                    deflakeSuit.addTest(test.clone());
                }
                return test;
            }
            else if (!(itOnly || describeOnly) && shouldSkipTest(test)) {
                const test = new mocha_1.default.Test(title);
                test.file = file;
                suite.addTest(test);
                return test;
            }
            else {
                suite.addTest(test);
                return test;
            }
        }
        it.only = function (title, fn) {
            return common.test.only(mocha, context['it'](title, fn, true));
        };
        it.skip = function (title) {
            return context['it'](title);
        };
        function wrapDeflake(func) {
            return (repeats, title, fn) => {
                context['describe'].withDebugLogs('with Debug Logs', () => {
                    for (let i = 1; i <= repeats; i++) {
                        func(`${i}/${title}`, fn);
                    }
                });
            };
        }
        it.deflake = wrapDeflake(it);
        it.deflakeOnly = wrapDeflake(it.only);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        context.it = it;
    });
}
customBDDInterface.description = 'Custom BDD';
module.exports = customBDDInterface;
//# sourceMappingURL=interface.js.map