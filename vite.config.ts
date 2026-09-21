import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

// No Tailwind: the design system is resources/css/tokens.css + components.css (CONTRIBUTING.md §4).
// Lato and IBM Plex Mono are self-hosted through @fontsource and fingerprinted by Vite.
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
