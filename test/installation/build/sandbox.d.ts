/// <reference types="node" resolution-mode="require"/>
export interface ItEvaluatesOptions {
    commonjs?: boolean;
}
export interface ItEvaluatesFn {
    (title: string, options: ItEvaluatesOptions, getScriptContent: (cwd: string) => Promise<string>): void;
    (title: string, getScriptContent: (cwd: string) => Promise<string>): void;
}
export interface SandboxOptions {
    dependencies?: string[];
    devDependencies?: string[];
    /**
     * This should be idempotent.
     */
    env?: ((cwd: string) => NodeJS.ProcessEnv) | NodeJS.ProcessEnv;
    before?: (cwd: string) => Promise<void>;
}
declare module 'mocha' {
    interface Context {
        /**
         * The path to the root of the sandbox folder.
         */
        sandbox: string;
        env: NodeJS.ProcessEnv | undefined;
        runScript: (content: string, type: 'cjs' | 'mjs', args?: string[]) => Promise<void>;
    }
}
/**
 * Configures mocha before/after hooks to create a temp folder and install
 * specified dependencies.
 */
export declare const configureSandbox: (options: SandboxOptions) => void;
//# sourceMappingURL=sandbox.d.ts.map