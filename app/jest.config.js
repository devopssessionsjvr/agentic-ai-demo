/**
 * Jest Configuration for AI-Showcase Application
 * 
 * Configures test runner, coverage thresholds, and test environment
 */

module.exports = {
  // Test environment (node or jsdom)
  testEnvironment: 'node',

  // Coverage directory
  coverageDirectory: 'coverage',

  // Collect coverage from these files
  collectCoverageFrom: [
    'app.js',
    '!node_modules/**'
  ],

  // Coverage thresholds to enforce minimum coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Verbose output
  verbose: true,

  // Timeout for tests (in milliseconds)
  testTimeout: 10000,

  // Setup files
  setupFiles: [],

  // Module name mapper for path aliases (if needed)
  moduleNameMapper: {},

  // Transform files
  transform: {}
};
