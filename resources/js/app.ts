import '../css/app.css';

import { createApp, createSSRApp, h, type DefineComponent } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createPinia } from 'pinia';

// `||`, not `??`: an empty VITE_APP_NAME would otherwise leave every tab title ending in " ·".
const appName = import.meta.env.VITE_APP_NAME || 'RIMIFY';

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob<DefineComponent>('./Pages/**/*.vue')),
    setup({ el, App, props, plugin }) {
        // Hydrate the server-rendered page rather than drawing it again. `createApp` threw the
        // server's DOM away and re-created it, so every animation already running on it (the hero's
        // roll-in, the leaders) started a second time, and images were re-requested. A page that
        // arrives without server HTML (SSR down) still mounts from scratch.
        const hasServerHtml = el !== null && el.hasChildNodes();

        (hasServerHtml ? createSSRApp : createApp)({ render: () => h(App, props) })
            .use(plugin)
            .use(createPinia())
            .mount(el);
    },
    /*
     * The navigation progress bar, styled from our own stylesheet. Inertia would otherwise inject
     * a <style> element at runtime, which the nonce-based CSP refuses.
     */
    progress: {
        delay: 150,
        color: '#1a44d4',
        includeCSS: false,
        showSpinner: false,
    },
});
