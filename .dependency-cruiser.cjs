/**
 * Architecture guardrails (subset, scaled for the walking skeleton).
 * The non-negotiable rules: domain purity + module privacy.
 * Stricter application->infrastructure rules can be layered on later.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-stays-pure',
      comment:
        'Domain layer must not import frameworks / IO / SDKs (NestJS, TypeORM, pg, schedule).',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain' },
      to: {
        path: '(^|/)node_modules/(@nestjs|typeorm|pg|@anthropic-ai)(/|$)',
      },
    },
    {
      name: 'domain-no-outer-layers',
      comment: 'Domain must not import application / database / command / query slices.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/domain' },
      to: { path: '^src/modules/$1/(application|database|commands|queries)' },
    },
    {
      name: 'no-cross-module',
      comment: 'A module is a closed bounded context — talk via bus/events, never direct import.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/(?!$1/)[^/]+/',
      },
    },
    {
      name: 'libs-never-imports-modules',
      comment: 'The shared kernel must not depend on any bounded context.',
      severity: 'error',
      from: { path: '^src/libs/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: ['.ts', '.js'],
    },
  },
};
