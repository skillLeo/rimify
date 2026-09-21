import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules/**', 'vendor/**', 'public/**', 'bootstrap/ssr/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
    },
    js.configs.recommended,
    ...vue.configs['flat/recommended'],
    {
        files: ['**/*.ts', '**/*.vue'],
        languageOptions: {
            parser: vue.parser ?? undefined,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
                extraFileExtensions: ['.vue'],
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // TypeScript checks names; ESLint's `no-undef` does not know DOM and Vue types.
            'no-undef': 'off',
            // `any` is a review failure (frontend review rules).
            '@typescript-eslint/no-explicit-any': 'error',
            'vue/multi-word-component-names': 'off',
            'vue/html-indent': ['error', 4],
            'vue/max-attributes-per-line': 'off',
            'vue/singleline-html-element-content-newline': 'off',
        },
    },
];
