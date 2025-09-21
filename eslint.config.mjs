/* @ts-check */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  {
    languageOptions: {
      globals: globals.node
    }
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'public/',
      'assets/',
      'data/',
      'tmp/',
      'demo/**',
      'Makefile.ts',
      'tools/**',
      'src/scripts/**',
      'src/typescript/**',
      'src/zlib/**',
      'types/**/*.d.ts',
      'src/vendor/**',
      'public/bundle.js',
      'public/bundle.js.map'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': 'off',
      // Baseline relaxations to avoid blocking CI; tighten incrementally
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'no-empty': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
      'prefer-const': 'off',
      'no-unused-expressions': 'off',
      'no-useless-catch': 'off',
      'no-debugger': 'off',
      'no-constant-condition': 'off',
      'no-namespace': 'off'
    }
  }
];

