<script setup lang="ts">
/**
 * Bestellung (Bestellbestätigung) — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/bestellung.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The three
 * follow-up actions are stacked full-width rows with a chevron rather than a `.grid3` of centred
 * icon cards, the RIMIFY-CHECK panel aligns its ticks to the top of wrapped lines, the paddings
 * are the phone's and the "Bestätigung drucken" button is not on the page at all. None of that can
 * be reached from the desktop markup with media queries, which is why the design ships two files
 * and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` slots stay as the shell left them for `shared/pages2.js` to
 * fill.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Vielen Dank" />

    <main id="main">
    <div class="wrap" style="padding:40px 16px 56px">
            <div style="text-align:center">
                <div style="width:56px;height:56px;border-radius:999px;background:var(--ok-w);display:flex;align-items:center;justify-content:center;margin:0 auto">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A44D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l4.5 4.5L19.5 6.5"/></svg>
                </div>
                <h1 class="h2" style="margin-top:18px">Vielen Dank für deine Bestellung.</h1>
                <span class="mono" style="display:inline-block;margin-top:14px;background:var(--ground);border-radius:999px;padding:8px 16px" data-mount="best-nr">Bestellnummer RMF-2026-04711</span>
                <p class="body ink2" style="margin-top:14px">Wir haben dir eine Bestätigung an max@beispiel.de geschickt – inklusive Gutachten als PDF.</p>
            </div>

            <div style="margin-top:28px;border-radius:14px;overflow:hidden;box-shadow:var(--sh-1)">
                <div class="row" style="gap:10px;background:var(--blue);padding:14px 16px">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#1A44D4" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <strong style="font:700 15px/1 Lato,sans-serif;color:#fff">RIMIFY-CHECK</strong></div>
                <div style="background:#fff;padding:16px;display:flex;flex-direction:column;gap:10px">
                    <div class="row" style="gap:10px;align-items:flex-start"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none;margin-top:3px"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 14px/1.4 Lato,sans-serif">Alle bestellten Felgen sind für dein Fahrzeug freigegeben.</span></div>
                    <div class="row" style="gap:10px;align-items:flex-start"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none;margin-top:3px"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 14px/1.4 Lato,sans-serif">Das Gutachten liegt der Bestätigungsmail als PDF bei.</span></div>
                    <div class="row" style="gap:10px;align-items:flex-start"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none;margin-top:3px"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 14px/1.4 Lato,sans-serif">Die geprüfte Konfiguration ist auf deiner Bestellung festgehalten.</span></div>
                </div>
            </div>

            <div class="card raised pad-s" style="margin-top:16px" data-mount="best-summary"></div>

            <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
                <a class="card pad-s row" style="text-decoration:none;color:inherit;justify-content:space-between" href="#"><span style="font:700 14px/1 Lato,sans-serif">Bestellung verfolgen</span><span class="ink3" style="display:flex"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg></span></a>
                <a class="card pad-s row" style="text-decoration:none;color:inherit;justify-content:space-between" href="#"><span style="font:700 14px/1 Lato,sans-serif">Gutachten herunterladen</span><span class="ink3" style="display:flex"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg></span></a>
                <a class="card pad-s row" style="text-decoration:none;color:inherit;justify-content:space-between" href="kontakt.html"><span style="font:700 14px/1 Lato,sans-serif">Fragen? Kontakt</span><span class="ink3" style="display:flex"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg></span></a>
            </div>

            <p class="ink2" style="text-align:center;font:400 15px/1.6 Lato,sans-serif;margin-top:24px">Deine Räder werden montiert und gewuchtet, bevor sie das Lager verlassen.</p>
        </div>
    </main>
</template>
