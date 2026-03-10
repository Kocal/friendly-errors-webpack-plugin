const globals = require("globals");

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 6,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es6,
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-expressions": "warn",
      "no-unused-labels": "warn",
      "no-unused-vars": ["warn", { vars: "local", args: "none" }],
    },
  },
];
