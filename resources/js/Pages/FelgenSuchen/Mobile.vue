<script setup lang="ts">
/**
 * Felgen suchen (Auto wählen) — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/felgen-suchen.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The desktop
 * page is a two-column card split by a 1px rule, with the guided selector on the left; mobile puts
 * the Fahrzeugschein route FIRST, drops the `doc-toggle`/`doc` diagram entirely in favour of a
 * `data-openhelp` link, and separates the two routes with an "oder" rule instead of a column
 * divider. None of that can be reached from the desktop markup with media queries, which is why
 * the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages.js` to fill.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Auto wählen" />

    <main id="main">
    <div class="wrap" style="padding-top:32px;padding-bottom:56px">
            <h1 class="h2">Auto wählen, garantiert passende Felge finden</h1>
            <p class="body ink2" style="margin-top:10px">Zwei Wege – über die Fahrzeugdaten oder direkt über die Schlüsselnummern aus deinem Fahrzeugschein.</p>

            <div class="card raised pnl pad-s" style="margin-top:24px">
                <h2 class="h4" style="font-size:15px">Oder ganz einfach mit Fahrzeugschein</h2>
                <div style="margin-top:14px" data-mount="sel-keys"></div>
                <button class="link" data-openhelp style="margin-top:14px;min-height:44px">Wo finde ich HSN und TSN?</button>

                <div style="position:relative;text-align:center;margin:24px 0">
                    <div class="hr"></div>
                    <span class="micro" style="position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#fff;padding:0 12px">oder</span>
                </div>

                <h2 class="h4" style="font-size:15px">Wähle dein Auto</h2>
                <div style="margin-top:14px" data-mount="sel-guided"></div>
            </div>
        </div>
    </main>
</template>
