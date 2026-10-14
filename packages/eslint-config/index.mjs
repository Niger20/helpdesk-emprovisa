import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import componentRule from './component-rule.mjs';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '.tools/**', 'docs/mockups/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-console': 'error',
      'max-lines': ['error', 200],
    },
  },
  { files: ['apps/api/**/*.ts'], rules: { 'max-lines': ['error', 300] } },
  {
    files: ['apps/web/src/**/*.tsx'],
    plugins: { helpdesk: { rules: { 'one-component': componentRule } } },
    rules: {
      'helpdesk/one-component': 'error',
      'max-lines-per-function': ['error', { max: 150, skipBlankLines: false }],
    },
  },
  {
    files: ['apps/{api,web}/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: 'tsconfig.base.json' } },
      'boundaries/elements': [
        { type: 'feature', pattern: 'apps/web/src/features/*', capture: ['feature'] },
        { type: 'module', pattern: 'apps/api/src/modules/*', capture: ['module'] },
        { type: 'shared', pattern: 'apps/{api,web}/src/*' },
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'allow',
        policies: [{
          to: { element: { type: ['feature', 'module'] } },
          disallow: { to: { element: { fileInternalPath: '!index.ts' } } },
        }],
      }],
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['kysely'], message: 'Solo repository e infra/db pueden importar Kysely.' }],
      }],
    },
  },
  {
    files: ['apps/api/src/**/*.repository.ts', 'apps/api/src/infra/db/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
