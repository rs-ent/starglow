/// jest.config.js

const nextJest = require("next/jest");

const createJestConfig = nextJest({
    dir: "./",
});

const customJestConfig = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testEnvironment: "node",
    moduleNameMapper: {
        "^@/lib/(.*)$": "<rootDir>/lib/$1",
        "^@/(.*)$": "<rootDir>/app/$1",
    },
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
    transformIgnorePatterns: [
        "node_modules/(?!(@web3-storage|@ucanto|@ipld|multiformats)/)",
    ],
};

module.exports = createJestConfig(customJestConfig);
