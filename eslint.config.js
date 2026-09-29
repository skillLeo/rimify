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
    // Tools run with Node beside the suite (e2e/tools): its globals, nothing of the browser's.
    {
        files: ['e2e/**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.node },
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
    // R-10: a number becomes text in one module only (resources/js/lib/num.ts). A second formatter
    // anywhere is how „1000“ and „1.000“ come to mean two things (SV-13).
    {
        files: ['resources/js/**/*.{ts,vue}'],
        ignores: ['resources/js/lib/num.ts'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: "CallExpression[callee.property.name='toLocaleString']",
                    message: 'Numbers are formatted in resources/js/lib/num.ts only (formatNumber, formatCurrency, formatPercent).',
                },
                {
                    selector: "NewExpression[callee.object.name='Intl'][callee.property.name='NumberFormat']",
                    message: 'Numbers are formatted in resources/js/lib/num.ts only (formatNumber, formatCurrency, formatPercent).',
                },
                // The launch release §4: an amount is computed on the server and becomes text through
                // formatMoney. A component that divides or multiplies cents is how a tile came to show
                // a quarter of the price.
                {
                    selector: "BinaryExpression[operator=/^[*\\/]$/][left.name=/[Cc]ents$/]",
                    message: 'Money is computed on the server (App\\Support\\Money) and shown with formatMoney(cents) from lib/num.ts.',
                },
                {
                    selector: "BinaryExpression[operator=/^[*\\/]$/][left.property.name=/[Cc]ents$/]",
                    message: 'Money is computed on the server (App\\Support\\Money) and shown with formatMoney(cents) from lib/num.ts.',
                },
            ],
        },
    },
];
