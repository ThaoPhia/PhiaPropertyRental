import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

export default createJestConfig({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
});