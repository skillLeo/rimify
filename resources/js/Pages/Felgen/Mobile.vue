<script setup lang="ts">
/**
 * Felgen (Produktliste) — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/felgen.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. Mobile adds
 * a `plp-mobilebtn` mount that opens the filters, keeps the filter rail itself hidden behind
 * `.hide`, and stacks the segment control, the sort field and the reset link in one centred
 * column instead of spreading them across a `.spread` row. None of that can be reached from the
 * desktop markup with media queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` slots stay empty for `shared/pages2.js` to fill — the headline
 * text inside `plp-head` being the design's own pre-runtime state, copied with it.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Felgen" />

    <main id="main">
    <div class="wrap" style="padding-top:20px;padding-bottom:56px">
            <nav class="crumb"><a href="startseite.html">RIMIFY</a>›<span class="ink2">Felgen</span></nav>

            <h1 class="h2" style="text-align:center;margin-top:20px" data-mount="plp-head">Unser gesamtes Felgensortiment</h1>
            <p class="body ink2" style="text-align:center;font-size:14px;margin-top:8px" data-mount="plp-count"></p>

            <div style="margin-top:20px" data-mount="plp-novehicle"></div>

            <div style="margin-top:20px" data-mount="plp-mobilebtn"></div>
            <div class="hide" data-mount="plp-filters"></div>

            <div style="margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:14px">
                <span data-mount="plp-seg"></span>
                <label style="display:flex;flex-direction:column;align-items:center;gap:8px">
                    <span class="ink2" style="font:400 14px/1 Lato,sans-serif">Sortieren:</span>
                    <select class="field" data-sort style="width:190px;height:44px;background:#fff;box-shadow:0 0 0 1px var(--line)">
                        <option>Beliebt</option><option>Preis aufsteigend</option><option>Preis absteigend</option><option>Bewertung</option>
                    </select></label>
                <span data-mount="plp-reset"></span>
            </div>

            <div class="grid4" style="margin-top:24px" data-mount="plp-grid"></div>
            <div class="pager" data-mount="plp-pager"></div>
        </div>
    </main>
</template>
