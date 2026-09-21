import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

// A throwaway build of the real WheelScene chunk (three + TresJS + loaders), served by
// scripts/3d/harness/run.mjs and driven by Playwright: proves the 3D path in a browser without
// touching the application build. Output goes to the temp directory run.mjs names.
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    plugins: [vue()],
    resolve: {
        alias: { '@': fileURLToPath(new URL('../../../resources/js', import.meta.url)) },
    },
    build: {
        outDir: process.env.HARNESS_OUT ?? fileURLToPath(new URL('../../../storage/framework/testing/3d-harness', import.meta.url)),
        emptyOutDir: true,
        minify: false,
        rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) },
    },
    base: '/dist/',
});
