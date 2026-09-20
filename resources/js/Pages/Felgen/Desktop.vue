<script setup lang="ts">
/**
 * Felgen (Produktliste) — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/felgen.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style. It is not "based on" the prototype; it IS the prototype. Do not tidy the inline styles
 *    into classes, do not extract components, do not reorder attributes, do not change a pixel
 *    value because it looks odd. All of that is measured.
 *  - The `data-mount` slots are intentionally empty. `shared/pages2.js` fills each one at runtime
 *    with the real markup for that slot (heading and count, the "kein Fahrzeug" prompt, the filter
 *    rail, the segment control, the reset link, the product grid, the pager). The headline text
 *    inside `plp-head` is the design's own pre-runtime state and is copied with it; everything
 *    else stays empty. Filling one here by hand would put our markup back into the page and
 *    re-create exactly the drift this replaced.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Felgen" />

    <main id="main">
    <div class="wrap" style="padding-top:28px;padding-bottom:96px">
            <nav class="crumb"><a href="startseite.html">RIMIFY</a>›<span class="ink2">Felgen</span></nav>

            <h1 class="h2" style="text-align:center;margin-top:28px;max-width:20ch;margin-inline:auto" data-mount="plp-head">Unser gesamtes Felgensortiment</h1>
            <p class="body ink2" style="text-align:center;font-size:15px;margin-top:10px" data-mount="plp-count"></p>

            <div style="margin-top:28px" data-mount="plp-novehicle"></div>

            <div style="margin-top:28px" data-mount="plp-filters"></div>

            <div class="spread" style="margin-top:20px">
                <div class="row" style="gap:16px">
                    <span data-mount="plp-seg"></span>
                    <span data-mount="plp-reset"></span>
                </div>
                <label class="row" style="gap:10px"><span class="ink2" style="font:400 14px/1 Lato,sans-serif">Sortieren:</span>
                    <select class="field" data-sort style="width:190px;height:40px;background:#fff;box-shadow:0 0 0 1px var(--line)">
                        <option>Beliebt</option><option>Preis aufsteigend</option><option>Preis absteigend</option><option>Bewertung</option>
                    </select></label>
            </div>

            <div class="grid4" style="margin-top:28px" data-mount="plp-grid"></div>
            <div class="pager" data-mount="plp-pager"></div>
        </div>
    </main>
</template>
