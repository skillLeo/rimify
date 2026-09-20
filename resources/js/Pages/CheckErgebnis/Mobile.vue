<script setup lang="ts">
/**
 * Prüfergebnis — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/check-ergebnis.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The
 * wordmark and the heading stack above the result instead of sitting opposite a pair of action
 * buttons; Drucken and Ergebnis teilen move below the verdict and lose their icons; the closing
 * note is one sentence shorter and carries no `max-width`. None of that can be reached from the
 * desktop markup with media queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages2.js` to fill. Any visual fix
 * belongs in the shared CSS/JS, never in new markup added here.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Prüfergebnis · RIMIFY-CHECK" />

    <main id="main">
    <div class="wrap" style="padding:32px 0 56px">
            <span class="wordmark" style="font-size:20px">RIMIFY</span>
            <h1 class="h2" style="margin-top:14px">Prüfergebnis</h1>
            <div style="margin-top:18px" data-mount="erg-meta"></div>
            <div style="margin-top:18px" data-mount="erg-result"></div>
            <div class="row no-print" style="gap:10px;margin-top:20px;flex-wrap:wrap">
                <button class="btn btn-s" data-print>Drucken</button>
                <button class="btn btn-s" data-share>Ergebnis teilen</button>
            </div>
            <p class="ink3" style="font:400 13px/1.6 Lato,sans-serif;margin-top:24px">
                Dieses Ergebnis wurde zum genannten Zeitpunkt gegen die angegebene Dokumentrevision geprüft.
            </p>
        </div>
    </main>
</template>
