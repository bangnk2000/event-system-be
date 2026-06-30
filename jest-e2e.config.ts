import type { Config } from 'jest';

/** HTTP REST acceptance tests (supertest). Requires a running PostgreSQL (docker compose up -d). */
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@libs/(.*)$': '<rootDir>/src/libs/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  setupFiles: ['<rootDir>/test/setup/env.ts'],
  testEnvironment: 'node',
  testTimeout: 30000,
};

export default config;
