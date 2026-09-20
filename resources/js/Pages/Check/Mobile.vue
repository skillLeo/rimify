<script setup lang="ts">
/**
 * RIMIFY-CHECK — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/rimify-check.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The desktop
 * page draws the two steps as a 72px numbered rail in a `grid-template-columns:72px 1fr` card;
 * the mobile page drops that rail entirely and puts a small numbered badge inline on each step's
 * heading row. None of that can be reached from the desktop markup with media queries, which is
 * why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages2.js` to fill at runtime.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="RIMIFY-CHECK" />

    <main id="main">
    <section class="white" style="padding:40px 0">
            <div class="wrap" style="text-align:center">
                <div class="micro bl" style="letter-spacing:.14em">RIMIFY-CHECK</div>
                <h1 class="display" style="font-size:30px;margin-top:10px">Passt diese Felge auf dein Auto?</h1>
                <p class="body ink2" style="margin-top:10px">In zwei Schritten zur verbindlichen Antwort – mit dem Gutachten als Beleg.</p>
            </div>
        </section>

        <div class="wrap" style="padding-bottom:56px">
            <div class="card lifted pnl pad-s">
                <div class="row" style="gap:10px"><span style="width:28px;height:28px;border-radius:999px;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font:700 13px/1 Lato,sans-serif;flex:none">1</span>
                    <h2 class="h4">Fahrzeug wählen</h2></div>
                <div style="margin-top:14px" data-mount="chk-step1"></div>
                <div class="hr" style="margin:24px 0"></div>
                <div class="row" style="gap:10px"><span style="width:28px;height:28px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 1px var(--line);color:var(--ink2);display:flex;align-items:center;justify-content:center;font:700 13px/1 Lato,sans-serif;flex:none">2</span>
                    <h2 class="h4">Felge wählen</h2></div>
                <div style="margin-top:14px" data-mount="chk-step2"></div>
            </div>
            <div style="margin-top:20px" data-mount="chk-result"></div>
        </div>
    </main>
</template>
