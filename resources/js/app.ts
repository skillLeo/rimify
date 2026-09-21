import '../css/app.css';

import { createApp, h, type DefineComponent } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createPinia } from 'pinia';
import { ZiggyVue } from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME ?? 'RIMIFY';

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob<DefineComponent>('./Pages/**/*.vue')),
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(createPinia())
            .use(ZiggyVue)
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
