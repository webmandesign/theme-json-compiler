const path = require('path');
const fs = require('fs');

const defaults = {
   path: addTrailingSlash(path.resolve('./')),
   dir: 'src/theme-json',
   output: 'theme.json',
   schema: 'https://schemas.wp.org/trunk/theme.json',
   version: 3,
};

/**
 * Webpack plugin class to create file from sources.
 *
 * @see https://webpack.js.org/contribute/writing-a-plugin/
 */
class ThemeJSONCompiler {
   constructor(options) {
      this.name = 'theme-json-compiler';
      this.options = options;
   }
   apply(compiler) {
      compiler.hooks.done.tap('ThemeJSONCompiler', () => {
         const logger = compiler.getInfrastructureLogger(this.name);
         compileJSON(this.options, logger);
      });
   }
}

/**
 * Compile Theme JSON from directory structure.
 *
 * @param {object|Array} options       Array or object of config entries.
 * @param {object}       webpackLogger Optional webpack logger.
 */
function compileJSON(options, webpackLogger = false) {
   const params = {...defaults, ...options};

   // Exit if required param is missing or path is referencing an outside directory.
   const validPaths = validatePaths(params, webpackLogger);
   if (!validPaths) {
      return;
   }

   // Validate the file paths.
   const paths = generatePaths(params);

   // Comfirm file paths exists.
   if (fileExists(paths?.dir) && paths?.output) {
      console.log(`Compiling JSON from ${paths.dir}`);
      const output = walkDirectory(paths.dir, '');

      const data = {
         $schema: params.schema,
         version: params.version,
         ...output,
      };

      try {
         fs.writeFileSync(paths.output, JSON.stringify(data, null, 2));
         console.log(`✅ Successfully compiled ${params.output}`);
      } catch (err) {
         console.error(`❌ Error writing output file:`, err.message);
      }
   } else {
      if (webpackLogger) {
         webpackLogger.error(
            'Unable to locate source files. Use the `dir` option to specify the relative path to the config file and the `output` option to speicify the output file.'
         );
      }
   }
}

/**
 * Recursively walk directory and compile JSON files.
 *
 * @param {string} dir     The directory to walk.
 * @param {string} baseDir The base directory.
 * @returns {object}       The compiled JSON object.
 */
function walkDirectory(dir, baseDir = null) {
   if (!baseDir) {
      baseDir = dir;
   }

   const result = {};
   try {
      const entries = fs.readdirSync(dir, {withFileTypes: true});

      // Sort entries to process directories first, then files.
      const sorted = entries.sort((a, b) => b.isDirectory() - a.isDirectory());

      for (const entry of sorted) {
         const {name} = entry;
         const filePath = path.join(dir, name);
         const key = name.split('.')[0];
         const extension = name.includes('.') ? name.split('.').pop() : null;
         const type = entry.isDirectory() ? 'directory' : extension;

         switch (type) {
            case 'directory':
               // Recursively compile subdirectories.
               const subResult = walkDirectory(filePath, baseDir);
               result[replaceDashes(key)] = subResult;
               break;

            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
               const content = requireUncached(filePath); // Load and require JavaScript file.
               if (key === '_') {
                  Object.assign(result, content); // If key is `_`, spread it into the current level
               } else {
                  result[replaceDashes(key)] = content;
               }
               break;

            case 'json':
               // Read and parse JSON file
               try {
                  const content = fs.readFileSync(filePath, 'utf-8');
                  const json = JSON.parse(content);

                  if (key === '_') {
                     Object.assign(result, json); // If key is `_`, spread it into the current level
                  } else {
                     result[replaceDashes(key)] = json;
                  }
               } catch (err) {
                  console.error(
                     `Error reading/parsing ${filePath}:`,
                     err.message
                  );
               }
               break;
            default:
               console.warn(`Unsupported file type: ${name}`);
               break;
         }
      }
   } catch (err) {
      console.error(`Error reading directory ${dir}:`, err.message);
   }

   return result;
}

export {ThemeJSONCompiler, compileJSON};

/**
 * Add trailing slash to a string if not present.
 *
 * The regex /\/?$/ matches an optional (zero or one) trailing slash
 * at the end of the string ($ anchor) and replaces it with a single slash.
 *
 * @param {string} str The string to modify.
 * @returns {string}   The modified string.
 */
function addTrailingSlash(str) {
   return str.replace(/\/?$/, '/');
}

/**
 * Replace double dashes with slashes in a string.
 *
 * @param {string} name The string to modify.
 * @returns {string} The modified string.
 */
function replaceDashes(name) {
   return name.replace(/--/g, '/');
}

/**
 * Check if a file exists.
 *
 * @param {string} path The file and/or directory path to check.
 * @return {boolean}
 */
function fileExists(path) {
   return fs.existsSync(path);
}

/**
 * Vaildate the paths do not contain `./`.
 *
 * @param {object} options Webpack config options.
 * @return {object}        Modified file and out params.
 */
function generatePaths(params) {
   let {dir, output, path} = params;

   // Validate the `dir` path.
   dir = dir.replace(/\/\//g, '/'); // Remove `//`, from string.
   dir = dir.charAt(0) === '.' ? dir.substring(1) : dir; // Remove leading `.` from string.
   dir = dir.startsWith('/') ? dir.substring(1) : dir; // Remove leading `/` from string.

   // Validate the `output` path.
   output = output.replace(/\/\//g, '/'); // Remove // from string.
   output = output.charAt(0) === '.' ? output.substring(1) : output; // Remove leading `.` from string.
   output = output.startsWith('/') ? output.substring(1) : output; //

   return {
      dir: path + dir,
      output: path + output,
   };
}

/**
 * Validate paths to file and out parameters do not try to back out of the current .
 *
 * @param {object} options       Webpack config options.
 * @param {object} webpackLogger Optional webpack logger.
 * @return {boolean}             True if paths are valid.
 */
function validatePaths(params, webpackLogger = false) {
   const {path, dir, output} = params;

   // Exit if any required parameter is empty or missing.
   if (!path || !dir || !output) {
      const missing =
         'Missing required parameters to generate theme.json file.';
      if (webpackLogger) {
         webpackLogger.error(missing);
      } else {
         console.warn(missing);
      }
      return false;
   }

   // Exit if any path is outside current directory.
   if (dir.includes('../') || output.includes('../')) {
      const msg =
         'The directory paths cannot reference a directory outside of the current working directory.';
      if (webpackLogger) {
         webpackLogger.error(msg);
      } else {
         console.warn(msg);
      }
      return false;
   }

   return true;
}

/**
 * Uncache a NodeJS require module.
 *
 * @param {string} module The module path to uncache.
 */
function requireUncached(module) {
   delete require.cache[require.resolve(module)];
   return require(module);
}
