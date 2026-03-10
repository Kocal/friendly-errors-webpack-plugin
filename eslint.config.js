const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["test/**/*.spec.js", "test/utils/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
  {
    ignores: ["test/fixtures/**", "_sandbox/**"],
  },
];
