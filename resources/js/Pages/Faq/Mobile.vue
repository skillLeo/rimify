<script setup lang="ts">
/**
 * FAQ — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/faq.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The desktop
 * page is a two-column grid with the help panel as a sticky `<aside>`; here the heading is centred,
 * the list runs full width and the help panel is a `.card.raised.pad-s` that follows the questions
 * rather than sitting beside them. That cannot be reached from the desktop markup with media
 * queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages.js` to fill at runtime.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="FAQ" />

    <main id="main">
    <div class="wrap" style="padding:32px 16px 56px">
            <h1 class="h2" style="text-align:center">Meistgestellte Fragen</h1>
            <div class="ffield" style="margin-top:18px">
                <input class="field" data-faqq placeholder="Suchen" aria-label="Fragen durchsuchen" style="padding-right:48px">
                <span class="ic r"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 18a7 7 0 100-14 7 7 0 000 14zM16.2 16.2L21 21"/></svg></span>
            </div>
            <div style="margin-top:24px" data-mount="faq-list"></div>

            <div class="card raised pad-s" style="margin-top:32px">
                <h2 class="h3">Nicht gefunden, was du suchst?</h2>
                <p class="body ink2" style="margin-top:8px">Schreib uns – wir antworten meist am selben Werktag.</p>
                <div style="margin-top:18px" data-mount="contact-rows"></div>
                <div class="hr" style="margin:20px 0"></div>
                <div class="row" style="gap:10px">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex:none"><circle cx="10" cy="10" r="10" fill="#1A44D4"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <strong style="font:700 15px/1.3 Lato,sans-serif">Kompatibilität sofort prüfen</strong>
                </div>
                <p class="body ink2" style="font-size:14px;margin-top:8px">Fahrzeug wählen, Felge wählen – wir sagen dir verbindlich, ob sie freigegeben ist.</p>
                <a class="btn btn-s btn-full" style="margin-top:14px" href="rimify-check.html">RIMIFY-CHECK öffnen</a>
            </div>
        </div>
    </main>
</template>
