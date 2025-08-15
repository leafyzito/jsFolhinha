const js = require("@eslint/js");
const globals = require("globals");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  {
    ignores: [
      "node_modules/",
      "*.min.js",
      "dist/",
      "build/",
      "coverage/",
      ".git/",
      "apps/twitchClipper/",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
        fb: "readonly",
      },
      sourceType: "commonjs",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: "off",
      curly: "off",
      "no-trailing-spaces": "off",
      "eol-last": "off",
    },
  },
]);
