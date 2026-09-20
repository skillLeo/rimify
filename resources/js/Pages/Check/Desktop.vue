<script setup lang="ts">
/**
 * RIMIFY-CHECK — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/rimify-check.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including the inline
 *    styles that draw the two-step rail down the left edge of the card. It is not "based on" the
 *    prototype; it IS the prototype. Do not tidy the inline styles into classes, do not extract
 *    components, do not reorder attributes, do not change a pixel value because it looks odd.
 *  - The `data-mount` divs are intentionally empty. `shared/pages2.js` fills each one at runtime:
 *    `chk-step1` the vehicle step, `chk-step2` the wheel step, `chk-result` the verdict. Filling
 *    one here by hand would put our markup back into the page and re-create exactly the drift
 *    this replaced — and the verdict in particular is the one thing on this site that must never
 *    be hand-written markup.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="RIMIFY-CHECK" />

    <main id="main">
    <section class="white" style="padding:72px 0">
            <div class="wrap" style="text-align:center">
                <div class="micro bl" style="letter-spacing:.14em">RIMIFY-CHECK</div>
                <h1 class="display" style="font-size:44px;margin-top:12px;max-width:18ch;margin-inline:auto">Passt diese Felge auf dein Auto?</h1>
                <p class="body ink2" style="font-size:17px;margin-top:12px">In zwei Schritten zur verbindlichen Antwort – mit dem Gutachten als Beleg.</p>
            </div>
        </section>

        <div class="wrap" style="padding-bottom:96px">
            <div class="card lifted pnl" style="max-width:960px;margin:0 auto;padding:0;overflow:hidden">
                <div style="display:grid;grid-template-columns:72px 1fr">
                    <div style="background:var(--ground);display:flex;flex-direction:column;align-items:center;padding:32px 0;gap:0">
                        <span style="width:36px;height:36px;border-radius:999px;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font:700 15px/1 Lato,sans-serif">1</span>
                        <span style="flex:1;width:1px;background:var(--line);margin:12px 0"></span>
                        <span style="width:36px;height:36px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 1px var(--line);color:var(--ink2);display:flex;align-items:center;justify-content:center;font:700 15px/1 Lato,sans-serif">2</span>
                        <span style="flex:1"></span>
                    </div>
                    <div style="padding:32px 40px">
                        <h2 class="h4">Fahrzeug wählen</h2>
                        <div style="margin-top:16px" data-mount="chk-step1"></div>
                        <div class="hr" style="margin:32px 0"></div>
                        <h2 class="h4">Felge wählen</h2>
                        <div style="margin-top:16px" data-mount="chk-step2"></div>
                    </div>
                </div>
            </div>

            <div style="max-width:960px;margin:24px auto 0" data-mount="chk-result"></div>
        </div>
    </main>
</template>
