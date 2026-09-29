import type { Page } from '@inertiajs/core';
import { createSSRApp, type DefineComponent } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createInertiaApp } from '@inertiajs/vue3';
import createServer from '@inertiajs/vue3/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createPinia } from 'pinia';
import { root } from './root';
import { listenOnSocket } from './ssrSocket';

const appName = process.env.VITE_APP_NAME || 'RIMIFY';

// SSR is a requirement, not an option (CONTRIBUTING.md §4). The device split and the header mode
// arrive in the page props, so the first frame the server renders is the frame the client
// hydrates to — nothing here may consult `window`.
const render = (page: Page) =>
    createInertiaApp({
        page,
        render: renderToString,
        title: (title) => (title ? `${title} · ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob<DefineComponent>('./Pages/**/*.vue')),
        setup({ App, props, plugin }) {
            return createSSRApp({ render: () => root(App, props) })
                .use(plugin)
                .use(createPinia());
        },
    });

const socket = process.env.INERTIA_SSR_SOCKET;

if (socket) {
    // The shared host: a socket file, reachable by this account only (ssrSocket.ts, D-047).
    listenOnSocket((page) => render(page as Page), socket);
} else {
    // On a shared host the default port may already belong to another application, so it is
    // configurable. INERTIA_SSR_URL in .env must point at the same port. Only this machine may ask
    // for a render: the default would listen on every interface. No cluster: it forks one renderer
    // per visible CPU, which on a shared host runs into its process and memory limits.
    createServer(render, { port: Number(process.env.INERTIA_SSR_PORT ?? 13714), host: '127.0.0.1' });
}
