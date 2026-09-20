<script setup lang="ts">
/**
 * Bestellung (Bestellbestätigung) — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/bestellung.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style and every hand-written SVG. It is not "based on" the prototype; it IS the prototype.
 *    Do not tidy the inline styles into classes, do not extract components, do not reorder
 *    attributes, do not change a pixel value because it looks odd. All of that is measured.
 *  - The `data-mount` slots are intentionally empty of our markup. `shared/pages2.js` fills them
 *    at runtime: `best-nr` gets the order number written into it, `best-summary` gets the ordered
 *    lines and totals. `best-nr` carries the design's own placeholder text, which is part of the
 *    shell and stays. Writing markup into either by hand would put our markup back into the page
 *    and re-create exactly the drift this replaced.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Vielen Dank" />

    <main id="main">
    <div style="max-width:720px;margin:0 auto;padding:80px 40px">
            <div style="text-align:center">
                <div style="width:56px;height:56px;border-radius:999px;background:var(--ok-w);display:flex;align-items:center;justify-content:center;margin:0 auto">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A44D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l4.5 4.5L19.5 6.5"/></svg>
                </div>
                <h1 class="h2" style="margin-top:20px">Vielen Dank für deine Bestellung.</h1>
                <span class="mono" style="display:inline-block;margin-top:14px;background:var(--ground);border-radius:999px;padding:8px 16px;font-size:15px" data-mount="best-nr">Bestellnummer RMF-2026-04711</span>
                <p class="body ink2" style="margin-top:14px">Wir haben dir eine Bestätigung an max@beispiel.de geschickt – inklusive Gutachten als PDF.</p>
            </div>

            <div style="margin-top:36px;border-radius:14px;overflow:hidden;box-shadow:var(--sh-1)">
                <div class="row" style="gap:10px;background:var(--blue);padding:14px 20px">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#1A44D4" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <strong style="font:700 15px/1 Lato,sans-serif;color:#fff">RIMIFY-CHECK</strong>
                </div>
                <div style="background:#fff;padding:20px;display:flex;flex-direction:column;gap:10px">
                    <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">Alle bestellten Felgen sind für dein Fahrzeug freigegeben.</span></div>
                    <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">Das Gutachten liegt der Bestätigungsmail als PDF bei.</span></div>
                    <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">Die geprüfte Konfiguration ist auf deiner Bestellung festgehalten.</span></div>
                </div>
            </div>

            <div class="card raised pad" style="margin-top:20px" data-mount="best-summary"></div>

            <div class="grid3" style="margin-top:20px">
                <a class="card pad" style="text-align:center;text-decoration:none;color:inherit" href="#">
                    <span class="bl" style="display:flex;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2h11.6v9.6H2.5zM14.1 9.4h4.2l3.2 3.2v3.2h-7.4M6.5 20a2 2 0 100-4 2 2 0 000 4zM17.5 20a2 2 0 100-4 2 2 0 000 4z"/></svg></span>
                    <span style="display:block;font:700 14px/1.3 Lato,sans-serif;margin-top:10px">Bestellung verfolgen</span></a>
                <a class="card pad" style="text-align:center;text-decoration:none;color:inherit" href="#">
                    <span class="bl" style="display:flex;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h7.5L19 8.5V21H6zM13.5 3v5.5H19"/></svg></span>
                    <span style="display:block;font:700 14px/1.3 Lato,sans-serif;margin-top:10px">Gutachten herunterladen</span></a>
                <a class="card pad" style="text-align:center;text-decoration:none;color:inherit" href="kontakt.html">
                    <span class="bl" style="display:flex;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 5.2h17.6v13.6H3.2zM3.8 6.4L12 12.6l8.2-6.2"/></svg></span>
                    <span style="display:block;font:700 14px/1.3 Lato,sans-serif;margin-top:10px">Fragen? Kontakt</span></a>
            </div>

            <p class="ink2" style="text-align:center;font:400 15px/1.6 Lato,sans-serif;margin-top:28px">Deine Räder werden montiert und gewuchtet, bevor sie das Lager verlassen.</p>
            <div class="row no-print" style="justify-content:center;margin-top:20px"><button class="btn btn-q" data-print>Bestätigung drucken</button></div>
        </div>
    </main>
</template>
