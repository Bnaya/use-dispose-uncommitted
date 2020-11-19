module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testRunner: "jest-circus/runner",
  testPathIgnorePatterns: ["/node_modules/", "kill-finalization-registry"],
  globals: {
    "ts-jest": {
      tsconfig: "__tests__/tsconfig.json"
    }
  },
  setupFiles: ["./ensureNodeGTE14ForTests"],
  collectCoverageFrom: ["./src/**"]
};
