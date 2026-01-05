// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  /* =======================
     Ignore files
  ======================== */
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs'],
  },

  /* =======================
     Base ESLint
  ======================== */
  eslint.configs.recommended,

  /* =======================
     TypeScript (LESS NOISY)
  ======================== */
  ...tseslint.configs.recommended,

  /* =======================
     Prettier
  ======================== */
  eslintPluginPrettierRecommended,

  /* =======================
     Language Options
  ======================== */
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  /* =======================
     RULES — QUIET MODE
  ======================== */
  {
    rules: {
      /* 🔕 Kill noisy TS rules */
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',

      /* 🔕 Windows / formatting */
      'linebreak-style': 'off',

      /* ✅ Keep real errors */
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
);
