module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/client/'],
  moduleNameMapper: {
    '^exceljs$': '<rootDir>/__mocks__/exceljs.js',
  },
};