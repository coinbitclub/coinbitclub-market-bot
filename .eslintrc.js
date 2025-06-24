module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['warn'],
    'no-console': 'off'
  }
};
