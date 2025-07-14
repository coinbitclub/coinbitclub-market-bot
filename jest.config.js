export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'backend/decision-engine/src/rulesEngine.js',
    'backend/order-executor/src/riskManager.js',
    'backend/signal-processor/src/filters.js'
  ]
};
