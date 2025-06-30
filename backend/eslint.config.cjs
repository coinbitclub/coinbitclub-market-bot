/** eslint.config.cjs */
module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: { requireConfigFile: false, ecmaVersion: 2021, sourceType: 'module' },
  env: { node: true, es2021: true, mocha: true },
  extends: ['eslint:recommended'],
  rules: { 'no-unused-vars': 'warn', 'no-console': 'off' }
};
