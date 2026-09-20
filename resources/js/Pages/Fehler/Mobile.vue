<script setup lang="ts">
/**
 * Seite nicht gefunden (404) — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/404.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The desktop
 * page sets the two actions side by side in a `.row` and caps the paragraph at `60ch`; here each
 * action is its own full-width `.btn-full` with its own top margin and the paragraph runs to the
 * gutter. None of that can be reached from the desktop markup with media queries, which is why
 * the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, the links stay the design's own `.html` targets, and the `data-mount="nf-grid"` div
 * stays empty for `shared/pages2.js` to fill.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Seite nicht gefunden" />

    <main id="main">
    <div class="wrap" style="padding:40px 16px 56px">
            <div class="mono ink3" style="font-size:13px;letter-spacing:.14em">FEHLER 404</div>
            <h1 class="h2" style="margin-top:12px">Diese Seite gibt es nicht mehr.</h1>
            <p class="body ink2" style="margin-top:10px">Vielleicht wurde sie verschoben oder der Link ist veraltet. Von hier kommst du direkt zurück in die Felgensuche.</p>
            <a class="btn btn-p btn-full" style="margin-top:20px" href="felgen-suchen.html">Zurück zur Felgensuche</a>
            <a class="btn btn-s btn-full" style="margin-top:12px" href="startseite.html">Zur Startseite</a>

            <h2 class="h4" style="margin-top:48px">Beliebte Felgen</h2>
            <div class="grid4" style="margin-top:16px" data-mount="nf-grid"></div>
        </div>
    </main>
</template>
