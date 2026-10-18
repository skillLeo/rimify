import '../css/app.css';

import { createApp, createSSRApp, type DefineComponent } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createPinia } from 'pinia';
import { installPopstateGuard } from './composables/admin/popstateGuard';
import { installNumberWheelGuard } from './lib/numberWheelGuard';
import { installPreloadErrorGuard } from './lib/preloadErrors';
import { installRestoredPages } from './lib/restoredPages';
import { vehicleVisitOptions } from './lib/vehicleMemory';
import { root } from './root';

// `||`, not `??`: an empty VITE_APP_NAME would otherwise leave every tab title ending in " ·".
const appName = import.meta.env.VITE_APP_NAME || 'RIMIFY';

// Before the app starts, so its listener runs ahead of Inertia's on Back (popstateGuard.ts).
installPopstateGuard();

// Back and Forward tell the server which car the restored page is about (the client's #8), and a page whose car, papers
// or catalogue moved on while it lay in history is asked again whole (his admin item 16, D-294; restoredPages.ts).
installRestoredPages();

// A chunk's stylesheet cancelled because the page moved on is no crash (preloadErrors.ts).
installPreloadErrorGuard();

// No number field changes under the mouse wheel: 1160 typed into 8.1 never becomes 1180 on a scroll (D-290).
if (typeof document !== 'undefined') {
    installNumberWheelGuard();
}

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    defaults: {
        // A visit from a car's page to another of its pages carries the car in its address (the client's #8).
        visitOptions: (href, options) => vehicleVisitOptions(href, options),
        // A page fetched ahead on hover or press is used for five seconds, not Inertia's thirty: enough for the click
        // that follows, and no page kept ready after a Gutachten was corrected (his admin item 16, D-294).
        prefetch: { cacheFor: 5_000 },
    },
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob<DefineComponent>('./Pages/**/*.vue')),
    setup({ el, App, props, plugin }) {
        // Hydrate the server-rendered page rather than drawing it again. `createApp` threw the
        // server's DOM away and re-created it, so every animation already running on it (the hero's
        // roll-in, the leaders) started a second time, and images were re-requested. A page that
        // arrives without server HTML (SSR down) still mounts from scratch.
        const hasServerHtml = el !== null && el.hasChildNodes();

        (hasServerHtml ? createSSRApp : createApp)({ render: () => root(App, props) })
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
