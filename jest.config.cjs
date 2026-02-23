/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // Allows imports like "../server.js" in TS (NodeNext style) to work in Jest
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  clearMocks: true,
};