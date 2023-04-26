module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: ['<rootDir>/src/libs/'],
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
    "jest-canvas-mock"
  ]
};
