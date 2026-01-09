export interface ThemeJSONCompilerOptions {
	path?: string;
	dir?: string;
	output?: string;
	schema?: string;
	version?: number;
}

export class ThemeJSONCompiler {
	constructor(options?: ThemeJSONCompilerOptions);
	apply(compiler: any): void;
}

export function compileJSON(options?: ThemeJSONCompilerOptions, webpackLogger?: any): void;
