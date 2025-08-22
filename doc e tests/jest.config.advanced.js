module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true
    }
  },
  moduleNameMapping: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.spec.ts",
    "**/__tests__/**/*.ts"
  ],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/server.ts",
    "!src/types/**/*.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: [
    "text",
    "lcov", 
    "html",
    "json-summary"
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
      testEnvironment: "node"
    },
    {
      displayName: "integration", 
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.ts"]
    },
    {
      displayName: "load",
      testMatch: ["<rootDir>/tests/load/**/*.test.ts"],
      testEnvironment: "node",
      testTimeout: 300000 // 5 minutes for load tests
    },
    {
      displayName: "security",
      testMatch: ["<rootDir>/tests/security/**/*.test.ts"],
      testEnvironment: "node"
    },
    {
      displayName: "e2e",
      testMatch: ["<rootDir>/tests/e2e/**/*.test.ts"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/e2e/setup.ts"],
      testTimeout: 60000 // 1 minute for e2e tests
    }
  ]
};
