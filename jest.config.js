module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  "testRunner": "jest-circus/runner",
  globals: {
    'ts-jest': {
      tsconfig: '__tests__/tsconfig.json'
    }
  }
};
