# Theme JSON Compiler

[![npm](https://img.shields.io/npm/v/theme-json-compiler)](https://www.npmjs.com/package/theme-json-compiler)

Recursively compile WordPress [theme.json](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/) from organized JSON and JavaScript files in a directory structure.

## What It Does

This tool takes a structured directory of Javascript or JSON files and compiles them into a single, unified `theme.json` file. Instead of maintaining one large JSON file, you can organize your theme configuration across multiple smaller files for better maintainability.

**Key Features:**

- 🗂️ Organize theme configuration in a logical directory structure
- 📦 Automatically compiles multiple JS/JSON files into a single `theme.json`
- 🔄 Recursively processes all subdirectories
- 💾 Use JavaScript to leverage variables, functions, and dynamic values instead of static JSON
- ⚙️ Works as a standalone Node.js script or as a Webpack plugin

## Getting Started

Install the package:

```console
npm install theme-json-compiler --save-dev
```

Integrate with Webpack:

```js
// webpack.config.js
const { ThemeJsonCompiler } = require('theme-json-compiler');

module.exports = {
  plugins: [
    new ThemeJsonCompiler({
      dir: 'example/theme-json',
      output: 'theme.json',
    }),
  ],
};
```

Standalone Compiler:

```js
const { compileJSON } = require('theme-json-compiler');
compileJSON({
    dir: 'example/theme-json',
   output: 'theme.json'
})
```

## Directory Structure

Organize your files like this:

```
theme-json/
├── settings/
│   ├── _.js              # Spreads into parent level
│   ├── color.js
│   ├── layout.js
│   └── spacing/
│       ├── _.js
│       └── spacingSizes.js
└── styles/
    └── elements.js
```

This structure compiles to:

```json
{
  "settings": {
    "appearanceTools": false,
    "useRootPaddingAwareAlignments": false,
    "color": { ... },
    "layout": { ... },
    "spacing": {
      "customSpacingSize": false,
      "spacingSizes": [ ... ]
    }
  },
  "styles": {
    "elements": { ... }
  }
}
```

## Configuration

| Option   | Description                                | Default          | Type     |
|----------|--------------------------------------------|------------------|----------|
| `dir`    | Source directory path                      | `theme-json`     | `string` |
| `output` | Output filename                            | `theme-json.json`| `string` |

## File Naming Rules

- **Regular files** (e.g., `color.json`): Becomes a key with that name (minus `.json`)
- **Underscore files** (e.g., `_.json`): Properties are spread into the parent object level
- **Directories**: Become nested keys in the output structure

## Supported File Types

The compiler supports both **JSON** and **JavaScript** files (`.json` and `.js`). JavaScript files must export a valid object using `module.exports`:

```js
// color.js
module.exports = {
  text: "var(--wp--custom--colors--site-foreground)",
  background: "var(--wp--custom--colors--site-background)"
};
```

This allows you to use dynamic values, import external configs, or leverage JavaScript logic in your theme configuration.
