import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';

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
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
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
