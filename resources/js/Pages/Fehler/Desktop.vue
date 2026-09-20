<script setup lang="ts">
/**
 * Seite nicht gefunden (404) — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/404.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, down to the line break the
 *    design puts inside the button `.row`. It is not "based on" the prototype; it IS the
 *    prototype. Do not tidy the inline styles into classes, do not extract components, do not
 *    reorder attributes, do not change a pixel value because it looks odd. All of that is measured.
 *  - The `data-mount="nf-grid"` div is intentionally empty. `shared/pages2.js` fills it at runtime
 *    with the "Beliebte Felgen" cards. Filling it here by hand would put our markup back into the
 *    page and re-create exactly the drift this replaced.
 *  - The two links stay the design's own `felgen-suchen.html` and `startseite.html`. They are not
 *    rewritten into Inertia `<Link>`s here.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Seite nicht gefunden" />

    <main id="main">
    <div class="wrap" style="padding:96px 40px">
            <div class="mono ink3" style="font-size:13px;letter-spacing:.14em">FEHLER 404</div>
            <h1 class="h2" style="margin-top:14px">Diese Seite gibt es nicht mehr.</h1>
            <p class="body ink2" style="margin-top:10px;max-width:60ch">Vielleicht wurde sie verschoben oder der Link ist veraltet. Von hier kommst du direkt zurück in die Felgensuche.</p>
            <div class="row" style="gap:12px;margin-top:24px"><a class="btn btn-p" href="felgen-suchen.html">Zurück zur Felgensuche</a>
                <a class="btn btn-s" href="startseite.html">Zur Startseite</a></div>

            <h2 class="h4" style="margin-top:64px">Beliebte Felgen</h2>
            <div class="grid4" style="margin-top:20px" data-mount="nf-grid"></div>
        </div>
    </main>
</template>
