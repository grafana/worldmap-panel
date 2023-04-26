module.exports = {
  verbose: true,
  coveragePathIgnorePatterns: ['<rootDir>/src/libs/'],
  "globals": {
    "ts-jest": {
      "tsConfig": "tsconfig.jest.json"
    },
  },
  "transform": {
    "\\.ts$": "ts-jest"
  },
  "testRegex": "(\\.|/)(test)\\.ts$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json"
  ],
  "setupFiles": [
    "<rootDir>/src/test/setupTests.ts"
  ]
};
