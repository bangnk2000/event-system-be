import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';

/**
 * Flat ESLint config. dependency-cruiser (`pnpm arch`) is the source of truth for architecture;
 * the boundaries/dependencies rule mirrors the same guarantees at the lint layer so violations
 * surface in the editor too: domain purity, module privacy (no cross-context imports), and a
 * closed shared kernel (libs must not reach into modules). Inter-layer imports *within* a module
 * are intentionally unrestricted here — dependency-cruiser does not constrain them either.
 */
const MODULE_TYPES = ['domain', 'application', 'command', 'query', 'database', 'module-file'];
const sameModule = (type) => ({ type, captured: { module: '{{from.captured.module}}' } });
// Any same-module element plus the shared kernel.
const ownModuleAndLib = { to: [{ type: 'lib' }, ...MODULE_TYPES.map(sameModule)] };

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '**/*.config.ts',
      '**/*.config.mjs',
      '.dependency-cruiser.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    plugins: { boundaries },
    settings: {
      // Resolve @libs/@modules path aliases (and relative TS imports) so boundaries classifies
      // dependency targets correctly. Without this, aliased imports resolve to "unknown".
      'import/resolver': { typescript: { project: 'tsconfig.json' } },
      'boundaries/elements': [
        { type: 'lib', pattern: 'src/libs/**' },
        { type: 'domain', pattern: 'src/modules/*/domain/**', capture: ['module'] },
        { type: 'application', pattern: 'src/modules/*/application/**', capture: ['module'] },
        { type: 'command', pattern: 'src/modules/*/commands/**', capture: ['module'] },
        { type: 'query', pattern: 'src/modules/*/queries/**', capture: ['module'] },
        { type: 'database', pattern: 'src/modules/*/database/**', capture: ['module'] },
        { type: 'module-file', pattern: 'src/modules/*/*', mode: 'file', capture: ['module'] },
      ],
      'boundaries/ignore': ['**/*.spec.ts'],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Shared kernel is closed — libs may only depend on libs (never a bounded context).
            { from: { type: 'lib' }, allow: { to: { type: 'lib' } } },
            // Domain purity — the domain layer only sees the shared kernel and its own domain.
            { from: { type: 'domain' }, allow: { to: [{ type: 'lib' }, sameModule('domain')] } },
            // Other layers: any element of the SAME module (module privacy) plus the shared kernel.
            { from: { type: 'application' }, allow: ownModuleAndLib },
            { from: { type: 'command' }, allow: ownModuleAndLib },
            { from: { type: 'query' }, allow: ownModuleAndLib },
            { from: { type: 'database' }, allow: ownModuleAndLib },
            { from: { type: 'module-file' }, allow: ownModuleAndLib },
          ],
        },
      ],
      // Type-level naming consistency.
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
      ],
    },
  },
);
