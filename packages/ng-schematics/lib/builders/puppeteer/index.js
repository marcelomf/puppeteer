"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandForRunner = void 0;
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const child_process_1 = require("child_process");
const path_1 = require("path");
const architect_1 = require("@angular-devkit/architect");
const types_js_1 = require("../../schematics/utils/types.js");
const terminalStyles = {
    cyan: '\u001b[36;1m',
    green: '\u001b[32m',
    red: '\u001b[31m',
    bold: '\u001b[1m',
    reverse: '\u001b[7m',
    clear: '\u001b[0m',
};
function getCommandForRunner(runner) {
    switch (runner) {
        case types_js_1.TestRunner.Jasmine:
            return [`jasmine`, '--config=./e2e/jasmine.json'];
        case types_js_1.TestRunner.Jest:
            return [`jest`, '-c', 'e2e/jest.config.js'];
        case types_js_1.TestRunner.Mocha:
            return [`mocha`, '--config=./e2e/.mocharc.js'];
        case types_js_1.TestRunner.Node:
            return ['node', '--test', '--test-reporter', 'spec', 'e2e/build/'];
    }
    throw new Error(`Unknown test runner ${runner}!`);
}
exports.getCommandForRunner = getCommandForRunner;
function getExecutable(command) {
    const executable = command.shift();
    const debugError = `Error running '${executable}' with arguments '${command.join(' ')}'.`;
    return {
        executable,
        args: command,
        debugError,
        error: 'Please look at the output above to determine the issue!',
    };
}
function updateExecutablePath(command, root) {
    if (command === types_js_1.TestRunner.Node) {
        return command;
    }
    let path = 'node_modules/.bin/';
    if (root && root !== '') {
        const nested = root
            .split('/')
            .map(() => {
            return '../';
        })
            .join('');
        path = `${nested}${path}${command}`;
    }
    else {
        path = `./${path}${command}`;
    }
    return (0, path_1.normalize)(path);
}
async function executeCommand(context, command, env = {}) {
    let project;
    if (context.target) {
        project = await context.getProjectMetadata(context.target.project);
        command[0] = updateExecutablePath(command[0], String(project['root']));
    }
    await new Promise(async (resolve, reject) => {
        context.logger.debug(`Trying to execute command - ${command.join(' ')}.`);
        const { executable, args, debugError, error } = getExecutable(command);
        let path = context.workspaceRoot;
        if (context.target) {
            path = (0, path_1.join)(path, project['root'] ?? '');
        }
        const child = (0, child_process_1.spawn)(executable, args, {
            cwd: path,
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                ...env,
            },
        });
        child.on('error', message => {
            context.logger.debug(debugError);
            console.log(message);
            reject(error);
        });
        child.on('exit', code => {
            if (code === 0) {
                resolve(true);
            }
            else {
                reject(error);
            }
        });
    });
}
function message(message, context, type = 'info') {
    let style;
    switch (type) {
        case 'info':
            style = terminalStyles.reverse + terminalStyles.cyan;
            break;
        case 'success':
            style = terminalStyles.reverse + terminalStyles.green;
            break;
        case 'error':
            style = terminalStyles.red;
            break;
    }
    context.logger.info(`${terminalStyles.bold}${style}${message}${terminalStyles.clear}`);
}
async function startServer(options, context) {
    context.logger.debug('Trying to start server.');
    const target = (0, architect_1.targetFromTargetString)(options.devServerTarget);
    const defaultServerOptions = await context.getTargetOptions(target);
    const overrides = {
        watch: false,
        host: defaultServerOptions['host'],
        port: options.port ?? defaultServerOptions['port'],
    };
    message(' Spawning test server ⚙️ ... \n', context);
    const server = await context.scheduleTarget(target, overrides);
    const result = await server.result;
    if (!result.success) {
        throw new Error('Failed to spawn server! Stopping tests...');
    }
    return server;
}
async function executeE2ETest(options, context) {
    let server = null;
    try {
        message('\n Building tests 🛠️ ... \n', context);
        await executeCommand(context, [`tsc`, '-p', 'e2e/tsconfig.json']);
        server = await startServer(options, context);
        const result = await server.result;
        message('\n Running tests 🧪 ... \n', context);
        const testRunnerCommand = getCommandForRunner(options.testRunner);
        await executeCommand(context, testRunnerCommand, {
            baseUrl: result['baseUrl'],
        });
        message('\n 🚀 Test ran successfully! 🚀 ', context, 'success');
        return { success: true };
    }
    catch (error) {
        message('\n 🛑 Test failed! 🛑 ', context, 'error');
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: error };
    }
    finally {
        if (server) {
            await server.stop();
        }
    }
}
exports.default = (0, architect_1.createBuilder)(executeE2ETest);
//# sourceMappingURL=index.js.map