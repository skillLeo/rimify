import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import { FontaineTransform } from 'fontaine';

// No Tailwind: the design system is resources/css/tokens.css, governed by docs/design/DIRECTION.md.
// Archivo Variable is self-hosted from public/fonts; fontaine reads its metrics at build time and
// writes an "Archivo Variable fallback" face over Arial, so the swap moves no text.
//
// Both subsets are one family, so their metrics are read from the latin file. Read from its own file,
// the latin-ext subset (Š, ł, … — no everyday letters) measured 131 % wide, and its fallback face, the
// last one written with the same descriptors, won for every letter: before the font arrived every page
// was set 31 % too wide, and the swap moved whole blocks (FAQ-06, 05.10.2026).
const sameMetricsAsLatin = (id: string): string => id.replace('archivo-latin-ext-', 'archivo-latin-');

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
        FontaineTransform.vite({
            fallbacks: ['Arial', 'Helvetica Neue', 'Segoe UI'],
            resolvePath: (id) => new URL(`./public${sameMetricsAsLatin(id)}`, import.meta.url),
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
