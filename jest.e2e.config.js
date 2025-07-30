module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.e2e.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/e2e.setup.js'],
    testTimeout: 30000,
    verbose: true,
    maxWorkers: 1
}; 