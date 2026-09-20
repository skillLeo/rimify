<script setup lang="ts">
/**
 * Admin · Dashboard — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/admin-dashboard.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style. It is not "based on" the prototype; it IS the prototype. Do not tidy the inline styles
 *    into classes, do not extract components, do not reorder attributes, do not change a pixel
 *    value because it looks odd. All of that is measured — the 62fr/38fr column split, the 28px
 *    first gap and the 24px ones after it included.
 *  - The `data-mount` divs are intentionally empty. `shared/admin.js` fills each one at runtime:
 *    the sidebar, the top bar and the module rail are the panel's own chrome, and `adm-tiles`,
 *    `adm-chart`, `adm-orders`, `adm-activity` and `adm-todo` are its content. The panel frame is
 *    therefore part of this page's markup, not a Vue `AdminLayout` wrapped around it — an
 *    `AdminLayout` would draw a second, hand-written sidebar over the design's own.
 *  - The `data-theme` button is the design's own dark-mode switch; `shared/app.js` binds it.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Dashboard" />

    <main id="main">
    <div class="adm">
            <aside class="adm-side" data-mount="adm-side"></aside>
            <div class="adm-main">
                <header class="adm-top" data-mount="adm-top"></header>
                <nav class="adm-rail" data-mount="adm-rail" aria-label="Module"></nav>
                <div class="adm-body">
                    <div class="spread">
                        <div>
                            <h1 class="h2" style="font-size:30px">Guten Morgen, Stefan.</h1>
                            <p class="body ink2" style="font-size:15px;margin-top:6px">7 Bestellungen warten auf Bearbeitung.</p>
                        </div>
                        <button class="btn btn-s" data-theme style="height:44px">Dunkel</button>
                    </div>

                    <div class="grid3" style="margin-top:28px" data-mount="adm-tiles"></div>

                    <div style="display:grid;grid-template-columns:62fr 38fr;gap:24px;margin-top:24px;align-items:start">
                        <div>
                            <section class="card pad">
                                <div class="spread"><h2 class="h4">Umsatz</h2><span class="micro">Letzte 12 Monate</span></div>
                                <div style="margin-top:16px" data-mount="adm-chart"></div>
                            </section>
                            <section class="card pad" style="margin-top:24px">
                                <h2 class="h4" style="margin-bottom:16px">Letzte Bestellungen</h2>
                                <div data-mount="adm-orders"></div>
                            </section>
                        </div>
                        <div>
                            <section class="card pad">
                                <h2 class="h4">Aktivität</h2>
                                <div style="margin-top:8px" data-mount="adm-activity"></div>
                            </section>
                            <section class="card pad" style="margin-top:24px">
                                <h2 class="h4">Zu erledigen</h2>
                                <div style="margin-top:8px" data-mount="adm-todo"></div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
