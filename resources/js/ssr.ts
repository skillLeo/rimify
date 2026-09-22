import { createSSRApp, h, type DefineComponent } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createInertiaApp } from '@inertiajs/vue3';
import createServer from '@inertiajs/vue3/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createPinia } from 'pinia';
import { ZiggyVue, type Config } from 'ziggy-js';

const appName = process.env.VITE_APP_NAME || 'RIMIFY';

// SSR is a requirement, not an option (CONTRIBUTING.md §4). The device split and the header mode
// arrive in the page props, so the first frame the server renders is the frame the client
// hydrates to — nothing here may consult `window`.
createServer((page) =>
    createInertiaApp({
        page,
        render: renderToString,
        title: (title) => (title ? `${title} · ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob<DefineComponent>('./Pages/**/*.vue')),
        setup({ App, props, plugin }) {
            // The server has no `window.Ziggy`; HandleInertiaRequests shares the route list instead.
            // A page rendered outside the web middleware (a maintenance page) has none, and must
            // still render rather than take the SSR process down.
            const ziggy = page.props.ziggy as (Config & { location: string }) | undefined;

            const app = createSSRApp({ render: () => h(App, props) })
                .use(plugin)
                .use(createPinia());

            return ziggy ? app.use(ZiggyVue, { ...ziggy, location: new URL(ziggy.location) }) : app;
        },
    }),
    // On a shared host the default port may already belong to another application, so it is
    // configurable. INERTIA_SSR_URL in .env must point at the same port.
    { port: Number(process.env.INERTIA_SSR_PORT ?? 13714) },
);
