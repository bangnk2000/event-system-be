import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@libs/(.*)$': '<rootDir>/libs/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
  },
  testEnvironment: 'node',
  // Coverage gate — the domain layer is the pure business logic unit tests must cover
  // (adapters/controllers/queries are exercised by the e2e suite instead). Floors sit just
  // below current coverage so they ratchet up over time without blocking honest work.
  collectCoverageFrom: ['modules/**/domain/**/*.ts', '!**/*.spec.ts'],
  coverageDirectory: '<rootDir>/../coverage',
  coverageThreshold: {
    global: { statements: 80, branches: 60, functions: 68, lines: 80 },
  },
};

export default config;
