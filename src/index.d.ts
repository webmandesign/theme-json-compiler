export interface ThemeJsonCompilerOptions {
   path?: string;
   dir?: string;
   output?: string;
   schema?: string;
   version?: number;
}

export class ThemeJsonCompiler {
   constructor(options?: ThemeJsonCompilerOptions);
   apply(compiler: any): void;
}

export function compileJSON(
   options?: ThemeJsonCompilerOptions,
   webpackLogger?: any
): void;
