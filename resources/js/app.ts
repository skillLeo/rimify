import '../css/app.css';

import { createApp, h, type DefineComponent } from 'vue';
import { createInertiaApp, router } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createPinia } from 'pinia';
import { ZiggyVue } from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME ?? 'RIMIFY';

/**
 * The design's runtime lives in public/prototype/shared and is loaded by <script> tags at the end
 * of the body. It exposes `window.APP`, whose `boot()` draws the header and footer into #top and
 * #bottom and fills every `data-mount` slot on the page.
 *
 * It has to be re-run after Vue takes over. The scripts execute once, against the server-rendered
 * HTML; Vue then hydrates `<main>` and replaces those nodes with its own, which throws away
 * anything the runtime had already written inside them. Calling boot() after mount fills the
 * slots that Vue has just put on the page.
 *
 * `fillAll()` marks each slot it fills with `data-filled`, so a second call is cheap and never
 * duplicates a section.
 */
type PrototypeRuntime = { boot?: () => void };

/**
 * The design's own load order. app.js must be last: it boots on execution and expects the other
 * four to have registered `window.RMF`, `window.ART` and `window.PAGES` already.
 *
 * `../local-images.js` is OURS, not the design's — note the path, it sits outside shared/, which
 * stays a verbatim copy. It points the runtime's photo URLs at public/prototype/images instead of
 * Unsplash's download endpoint, which answers 302 and costs two cross-origin round trips per
 * photograph. It runs directly after art.js so the tables are rewritten before anything reads
 * them, and before app.js boots.
 */
const RUNTIME = [
    'shared/data.js',
    // Ours, and it must come straight after data.js: it replaces the design's demonstration
    // catalogue on `window.RMF` with the real one before anything reads it. Absent on the visual
    // fixture routes, where the design's own data has to stay so the baselines remain valid.
    'live-data.js',
    'shared/art.js',
    'local-images.js',
    // Also ours. Corrections that wrap the design's own functions, so ./shared stays verbatim and
    // every divergence from the design sits in one reviewable file.
    'design-fixes.js',
    // Ours: click a product photograph to open it full size. Adds no markup at rest, so the
    // fidelity gate is unaffected.
    'lightbox.js',
    'shared/pages.js',
    'shared/pages2.js',
    'shared/admin.js',
    'shared/app.js',
];

/**
 * Load the design's runtime once Vue has mounted.
 *
 * Order matters twice over. These are classic scripts, so they must be appended one at a time and
 * awaited — appending all six at once lets them execute in whatever order they finish
 * downloading, and app.js would find `window.ART` undefined.
 *
 * And they must run AFTER the mount, not from a <script> tag in the document. A tag would boot the
 * runtime against the server-rendered HTML, Vue would replace that DOM on hydration, and the
 * runtime would need a second boot — which continues `art.js`'s SVG id counter rather than
 * restarting it, renaming every gradient on the page.
 */
async function loadPrototypeRuntime(): Promise<void> {
    for (const file of RUNTIME) {
        await new Promise<void>((resolve) => {
            const el = document.createElement('script');
            el.src = `/prototype/${file}`;
            el.async = false;
            el.onload = () => resolve();
            el.onerror = () => {
                console.error(`[prototype] could not load ${file}`);
                resolve();
            };
            document.body.appendChild(el);
        });
    }
}

/** Re-run the runtime after a client-side navigation, when the new page arrives with empty slots. */
function bootPrototype(): void {
    const app = (window as unknown as { APP?: PrototypeRuntime }).APP;
    if (!app?.boot) return;

    try {
        app.boot();
    } catch (error) {
        // Never let the design's runtime take the page down with it — a half-drawn page is still
        // more use than a blank one, and the error stays visible for the visual suite to catch.
        console.error('[prototype] boot failed', error);
    }
}

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

        // After the first mount, and only then. requestAnimationFrame rather than nextTick so the
        // DOM Vue has just committed is the DOM the runtime walks. app.js boots itself on load,
        // so this is the page's single boot.
        requestAnimationFrame(() => {
            void loadPrototypeRuntime();
        });
    },
    /*
     * No loading bar. The design does not have one, and Inertia draws it by injecting a <style>
     * element at runtime — which our CSP refuses, because <style> elements fall back to
     * `style-src` and need a nonce it cannot be given. Turning it off removes an element the
     * design never had and a console error at the same time.
     */
    progress: false,
});

// And after every client-side navigation, because the new page arrives with empty slots.
router.on('navigate', () => requestAnimationFrame(bootPrototype));
