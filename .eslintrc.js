module.exports = {
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "script",
  },
  globals: {
    atom: "readonly",
  },
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  rules: {
    "no-constant-condition": ["error", { checkLoops: false }],
    "no-console": ["error", { allow: ["warn", "error"] }],
  },
};
