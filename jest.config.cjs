/** @type {import("jest").Config} */
module.exports = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.ts"],
    extensionsToTreatAsEsm: [".ts"],
    clearMocks: true,
    transform: {
        "^.+\\.ts$": ["ts-jest", { useESM: true}]
    }
};