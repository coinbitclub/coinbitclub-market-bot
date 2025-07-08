export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    },
    env: { node: true, es2021: true, mocha: true },
    rules: { 'no-unused-vars': 'warn', 'no-console': 'off' }
  }
];




