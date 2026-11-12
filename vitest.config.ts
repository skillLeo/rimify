import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        // scripts/: the gate's own rules, read as the suites are (D-458's timeout-retry).
        include: ['resources/js/**/*.test.ts', 'scripts/**/*.test.mjs'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            reportsDirectory: 'coverage/vitest',
            include: ['resources/js/**/*.{ts,vue}'],
            exclude: ['resources/js/**/*.test.ts', 'resources/js/app.ts', 'resources/js/ssr.ts', 'resources/js/**/*.d.ts'],
        },
    },
});
