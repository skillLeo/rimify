<script setup lang="ts">
/**
 * Prüfergebnis — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/check-ergebnis.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style and every hand-written SVG. It is not "based on" the prototype; it IS the prototype.
 *    Do not tidy the inline styles into classes, do not extract components, do not reorder
 *    attributes, do not change a pixel value because it looks odd. All of that is measured.
 *  - The `data-mount` divs are intentionally empty. `shared/pages2.js` fills `erg-meta` and
 *    `erg-result` at runtime with the vehicle/wheel strip and the verdict card, and binds the
 *    `data-print` and `data-share` buttons. Filling one here by hand would put our markup back
 *    into the page and re-create exactly the drift this replaced.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * The shell also carries an `@media print` block in its head. That is page chrome rather than
 * page content, so it is not copied here; it belongs in the shared CSS.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Prüfergebnis · RIMIFY-CHECK" />

    <main id="main">
    <div class="wrap" style="padding:56px 0 96px;max-width:860px">
            <div class="spread">
                <div>
                    <span class="wordmark" style="font-size:22px">RIMIFY</span>
                    <h1 class="h2" style="margin-top:16px">Prüfergebnis</h1>
                </div>
                <div class="row no-print" style="gap:10px">
                    <button class="btn btn-s" data-print><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3.5h10V9M7 18.5H4.5V9h15v9.5H17M7 14.5h10V21H7z"/></svg>Drucken</button>
                    <button class="btn btn-s" data-share><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8.2 10.8l7.1-3.6M8.2 13.2l7.1 3.6"/></svg>Ergebnis teilen</button>
                </div>
            </div>

            <div style="margin-top:24px" data-mount="erg-meta"></div>
            <div style="margin-top:20px" data-mount="erg-result"></div>

            <p class="ink3" style="font:400 13px/1.6 Lato,sans-serif;margin-top:28px;max-width:70ch">
                Dieses Ergebnis wurde zum genannten Zeitpunkt gegen die angegebene Dokumentrevision geprüft.
                Ändert sich das Gutachten, weisen wir beim erneuten Aufruf darauf hin und bieten eine neue Prüfung an.
            </p>
        </div>
    </main>
</template>
