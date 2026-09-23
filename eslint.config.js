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
    // Plain TypeScript is parsed by the TypeScript parser itself; only .vue files go through the
    // Vue parser (with TypeScript inside <script>).
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: { '@typescript-eslint': tsPlugin },
        rules: {
            'no-undef': 'off',
            // The base rule misreads type-level parameters; the TypeScript rule understands them.
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
    {
        files: ['**/*.vue'],
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
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            // `any` is a review failure (frontend review rules).
            '@typescript-eslint/no-explicit-any': 'error',
            'vue/multi-word-component-names': 'off',
            'vue/html-indent': ['error', 4],
            'vue/max-attributes-per-line': 'off',
            'vue/singleline-html-element-content-newline': 'off',
        },
    },
];
