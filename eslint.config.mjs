import js from '@eslint/js';
import ts from 'typescript-eslint';

// Self-contained flat config: the app is mirrored as a standalone repo
// (github.com/marius321967/bmad-dash) where the monorepo root config and its
// @nx/eslint-plugin dependency do not exist.
export default [
  {
    ignores: ['dist/**'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
