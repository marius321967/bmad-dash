import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  testEnvironment: 'node',
};

export default config;
