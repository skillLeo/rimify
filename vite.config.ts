import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

// No Tailwind: the design system is resources/css/tokens.css, governed by docs/design/DIRECTION.md.
// Archivo Variable is self-hosted from public/fonts. Its fallback faces — Arial and Roboto, scaled per
// weight and width so the swap moves no text — are resources/css/fonts-fallback.css, generated from the
// font file by scripts/fonts/fallbacks.mjs and held to it by fonts.test.ts (the operator's brief of
// 05.10.2026, §4). fontaine, which wrote them here before, knew one width and one weight.

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            ssr: 'resources/js/ssr.ts',
            refresh: true,
        }),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    // The SSR bundle carries its dependencies inside it. The production host is shared hosting,
    // where installing node_modules is slow and competes with the sites for processes; a
    // self-contained ssr.js needs nothing but the node binary.
    ssr: {
        noExternal: true,
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
