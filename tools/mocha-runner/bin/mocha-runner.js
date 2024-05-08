#! /usr/bin/env -S node
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
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const node_child_process_1 = require("node:child_process");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const types_js_1 = require("./types.js");
const utils_js_1 = require("./utils.js");
const { _: mochaArgs, testSuite: testSuiteId, saveStatsTo, cdpTests: includeCdpTests, suggestions: provideSuggestions, coverage: useCoverage, minTests, shard, reporter, printMemory, } = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .parserConfiguration({ 'unknown-options-as-args': true })
    .scriptName('@puppeteer/mocha-runner')
    .option('coverage', {
    boolean: true,
    default: false,
})
    .option('suggestions', {
    boolean: true,
    default: true,
})
    .option('cdp-tests', {
    boolean: true,
    default: true,
})
    .option('save-stats-to', {
    string: true,
    requiresArg: true,
})
    .option('min-tests', {
    number: true,
    default: 0,
    requiresArg: true,
})
    .option('test-suite', {
    string: true,
    requiresArg: true,
})
    .option('shard', {
    string: true,
    requiresArg: true,
})
    .option('reporter', {
    string: true,
    requiresArg: true,
})
    .option('print-memory', {
    boolean: true,
    default: false,
})
    .parseSync();
function getApplicableTestSuites(parsedSuitesFile, platform) {
    let applicableSuites = [];
    if (!testSuiteId) {
        applicableSuites = (0, utils_js_1.filterByPlatform)(parsedSuitesFile.testSuites, platform);
    }
    else {
        const testSuite = parsedSuitesFile.testSuites.find(suite => {
            return suite.id === testSuiteId;
        });
        if (!testSuite) {
            console.error(`Test suite ${testSuiteId} is not defined`);
            process.exit(1);
        }
        if (!testSuite.platforms.includes(platform)) {
            console.warn(`Test suite ${testSuiteId} is not enabled for your platform. Running it anyway.`);
        }
        applicableSuites = [testSuite];
    }
    return applicableSuites;
}
async function main() {
    let statsPath = saveStatsTo;
    if (statsPath && statsPath.includes('INSERTID')) {
        statsPath = statsPath.replace(/INSERTID/gi, (0, crypto_1.randomUUID)());
    }
    const platform = types_js_1.zPlatform.parse(os_1.default.platform());
    const expectations = (0, utils_js_1.readJSON)(path_1.default.join(process.cwd(), 'test', 'TestExpectations.json'));
    const parsedSuitesFile = types_js_1.zTestSuiteFile.parse((0, utils_js_1.readJSON)(path_1.default.join(process.cwd(), 'test', 'TestSuites.json')));
    const applicableSuites = getApplicableTestSuites(parsedSuitesFile, platform);
    console.log('Planning to run the following test suites', applicableSuites);
    if (statsPath) {
        console.log('Test stats will be saved to', statsPath);
    }
    let fail = false;
    const recommendations = [];
    try {
        for (const suite of applicableSuites) {
            const parameters = suite.parameters;
            const applicableExpectations = (0, utils_js_1.filterByParameters)((0, utils_js_1.filterByPlatform)(expectations, platform), parameters).reverse();
            // Add more logging when the GitHub Action Debugging option is set
            // https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables
            const githubActionDebugging = process.env['RUNNER_DEBUG']
                ? {
                    DEBUG: 'puppeteer:*',
                    EXTRA_LAUNCH_OPTIONS: JSON.stringify({
                        dumpio: true,
                        extraPrefsFirefox: {
                            'remote.log.level': 'Trace',
                        },
                    }),
                }
                : {};
            const env = (0, utils_js_1.extendProcessEnv)([
                ...parameters.map(param => {
                    return parsedSuitesFile.parameterDefinitions[param];
                }),
                {
                    PUPPETEER_SKIPPED_TEST_CONFIG: JSON.stringify(applicableExpectations.map(ex => {
                        return {
                            testIdPattern: ex.testIdPattern,
                            skip: ex.expectations.includes('SKIP'),
                        };
                    })),
                },
                githubActionDebugging,
            ]);
            const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'puppeteer-test-runner-'));
            const tmpFilename = statsPath
                ? statsPath
                : path_1.default.join(tmpDir, 'output.json');
            console.log('Running', JSON.stringify(parameters), tmpFilename);
            const args = [
                '-u',
                path_1.default.join(__dirname, 'interface.js'),
                '-R',
                !reporter ? path_1.default.join(__dirname, 'reporter.js') : reporter,
                '-O',
                `output=${tmpFilename}`,
                '-n',
                'trace-warnings',
            ];
            if (printMemory) {
                args.push('-n', 'expose-gc');
            }
            const specPattern = 'test/build/**/*.spec.js';
            const specs = (0, glob_1.globSync)(specPattern, {
                ignore: !includeCdpTests ? 'test/build/cdp/**/*.spec.js' : undefined,
            }).sort((a, b) => {
                return a.localeCompare(b);
            });
            if (shard) {
                // Shard ID is 1-based.
                const [shardId, shards] = shard.split('-').map(s => {
                    return Number(s);
                });
                const argsLength = args.length;
                for (let i = 0; i < specs.length; i++) {
                    if (i % shards === shardId - 1) {
                        args.push(specs[i]);
                    }
                }
                if (argsLength === args.length) {
                    throw new Error('Shard did not result in any test files');
                }
                console.log(`Running shard ${shardId}-${shards}. Picked ${args.length - argsLength} files out of ${specs.length}.`);
            }
            else {
                args.push(...specs);
            }
            const handle = (0, node_child_process_1.spawn)('npx', [
                ...(useCoverage
                    ? [
                        'c8',
                        '--check-coverage',
                        '--lines',
                        String(suite.expectedLineCoverage),
                        'npx',
                    ]
                    : []),
                'mocha',
                ...mochaArgs.map(String),
                ...args,
            ], {
                shell: true,
                cwd: process.cwd(),
                stdio: 'inherit',
                env,
            });
            await new Promise((resolve, reject) => {
                handle.on('error', err => {
                    reject(err);
                });
                handle.on('close', () => {
                    resolve();
                });
            });
            console.log('Finished', JSON.stringify(parameters));
            try {
                const results = (0, utils_js_1.readJSON)(tmpFilename);
                const updates = (0, utils_js_1.getExpectationUpdates)(results, applicableExpectations, {
                    platforms: [os_1.default.platform()],
                    parameters,
                });
                const totalTests = results.stats.tests;
                results.parameters = parameters;
                results.platform = platform;
                results.date = new Date().toISOString();
                if (updates.length > 0) {
                    fail = true;
                    recommendations.push(...updates);
                    results.updates = updates;
                    (0, utils_js_1.writeJSON)(tmpFilename, results);
                }
                else {
                    if (!shard && totalTests < minTests) {
                        fail = true;
                        console.log(`Test run matches expectations but the number of discovered tests is too low (expected: ${minTests}, actual: ${totalTests}).`);
                        (0, utils_js_1.writeJSON)(tmpFilename, results);
                        continue;
                    }
                    console.log('Test run matches expectations');
                    (0, utils_js_1.writeJSON)(tmpFilename, results);
                    continue;
                }
            }
            catch (err) {
                fail = true;
                console.error(err);
            }
        }
    }
    catch (err) {
        fail = true;
        console.error(err);
    }
    finally {
        if (!!provideSuggestions) {
            (0, utils_js_1.printSuggestions)(recommendations, 'add', 'Add the following to TestExpectations.json to ignore the error:');
            (0, utils_js_1.printSuggestions)(recommendations, 'remove', 'Remove the following from the TestExpectations.json to ignore the error:');
            (0, utils_js_1.printSuggestions)(recommendations, 'update', 'Update the following expectations in the TestExpectations.json to ignore the error:');
        }
        process.exit(fail ? 1 : 0);
    }
}
main().catch(error => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=mocha-runner.js.map