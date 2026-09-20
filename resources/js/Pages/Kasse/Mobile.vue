<script setup lang="ts">
/**
 * Kasse — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/kasse.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The summary
 * is moved to the top instead of a sticky right column, the step bar drops its tick icon, the
 * address fields stack one per row rather than sitting in 70/30 and 34/66 grids, the shipping
 * tiles become a single column with price and lead time on one line, and the billing block asks
 * for "Straße und Hausnummer" as one field. None of that can be reached from the desktop markup
 * with media queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages2.js` to fill.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Kasse" />

    <main id="main" style="padding-bottom:40px">
    <div class="wrap" style="padding:20px 16px 56px">
            <div class="stepbar" style="justify-content:center">
                <span class="s done">Adresse</span><span class="bar"></span>
                <span class="s cur">Versand</span><span class="bar"></span><span class="s">Zahlung</span>
            </div>

            <aside class="card raised pad-s" style="margin-top:24px" data-mount="kasse-summary"></aside>

            <section class="card raised pad-s" style="margin-top:20px">
                <h2 class="h4">Kontakt</h2>
                <label class="flabel" style="margin-top:14px" for="k-mail">E-Mail<span class="req">*</span></label>
                <input class="field" id="k-mail" type="email" required>
                <p class="ink3" style="font:400 12px/1.5 Lato,sans-serif;margin-top:8px">Für die Bestellbestätigung und das Gutachten.</p>
            </section>

            <section class="card raised pad-s" style="margin-top:16px">
                <h2 class="h4">Lieferadresse</h2>
                <label class="flabel" style="margin-top:14px">Vollständiger Name<span class="req">*</span></label><input class="field" required>
                <label class="flabel" style="margin-top:14px">Straße<span class="req">*</span></label><input class="field" required>
                <label class="flabel" style="margin-top:14px">Hausnummer<span class="req">*</span></label><input class="field" required>
                <label class="flabel" style="margin-top:14px">PLZ<span class="req">*</span></label><input class="field" inputmode="numeric" required>
                <label class="flabel" style="margin-top:14px">Ort<span class="req">*</span></label><input class="field" required>
                <label class="flabel" style="margin-top:14px">Land</label>
                <select class="field"><option>Deutschland</option><option>Österreich</option></select>
            </section>

            <section class="card raised pad-s" style="margin-top:16px">
                <h2 class="h4">Rechnungsadresse</h2>
                <label class="check" style="margin-top:10px"><input type="checkbox" data-billing checked>
                    <span style="font:400 15px/1.4 Lato,sans-serif">Rechnungsadresse entspricht der Lieferadresse</span></label>
                <div data-mount="kasse-billing" style="margin-top:14px">
                    <label class="flabel">Vollständiger Name<span class="req">*</span></label><input class="field">
                    <label class="flabel" style="margin-top:14px">Straße und Hausnummer<span class="req">*</span></label><input class="field">
                </div>
            </section>

            <section class="card raised pad-s" style="margin-top:16px">
                <h2 class="h4">Versand</h2>
                <div style="display:flex;flex-direction:column;gap:12px;margin-top:14px">
                    <button class="tile" data-tile="ship" aria-pressed="true" style="padding:16px">
                        <span class="tick"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l4.5 4.5L19.5 6.5"/></svg></span>
                        <span style="display:block;font:700 15px/1 Lato,sans-serif">Standard DHL</span>
                        <span class="mono ink2" style="display:block;margin-top:6px">25,00 € · 2–4 Werktage</span></button>
                    <button class="tile" data-tile="ship" aria-pressed="false" style="padding:16px">
                        <span class="tick"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l4.5 4.5L19.5 6.5"/></svg></span>
                        <span style="display:block;font:700 15px/1 Lato,sans-serif">Express</span>
                        <span class="mono ink2" style="display:block;margin-top:6px">39,00 € · 1–2 Werktage</span></button>
                </div>
            </section>

            <section class="card raised pad-s" style="margin-top:16px">
                <h2 class="h4">Zahlung</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px">
                    <button class="tile" data-tile="pay" aria-pressed="true" style="padding:14px;text-align:center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto"><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 9.5h19"/></svg>
                        <span style="display:block;font:700 13px/1 Lato,sans-serif;margin-top:8px">Karte</span></button>
                    <button class="tile" data-tile="pay" aria-pressed="false" style="padding:14px;text-align:center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" style="margin:0 auto"><path d="M6 20l2.4-14h5.2c3 0 4.6 1.7 4.2 4.3-.4 2.8-2.5 4.3-5.6 4.3H9.6L9 20z"/></svg>
                        <span style="display:block;font:700 13px/1 Lato,sans-serif;margin-top:8px">PayPal</span></button>
                    <button class="tile" data-tile="pay" aria-pressed="false" style="padding:14px;text-align:center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" style="margin:0 auto"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 15c2.5-1.5 4-3.8 4-7"/></svg>
                        <span style="display:block;font:700 13px/1 Lato,sans-serif;margin-top:8px">Klarna</span></button>
                </div>
                <p class="ink2" style="font:400 13px/1.6 Lato,sans-serif;margin-top:14px">Die Zahlung wird sicher über Stripe abgewickelt. Deine Kartendaten erreichen RIMIFY nicht.</p>
            </section>

            <div style="margin-top:20px;display:flex;flex-direction:column;gap:8px">
                <label class="check"><input type="checkbox"><span style="font:400 13px/1.5 Lato,sans-serif">Ich habe die <a href="rechtliches.html?t=agb">AGB</a> und die <a href="rechtliches.html?t=widerruf">Widerrufsbelehrung</a> gelesen und akzeptiere sie.</span></label>
                <label class="check"><input type="checkbox"><span style="font:400 13px/1.5 Lato,sans-serif">Mir ist bekannt, dass eintragungspflichtige Felgen von einer Prüfstelle abgenommen werden müssen.</span></label>
            </div>
            <button class="btn btn-p btn-full btn-xl" style="margin-top:18px" data-pay>Zahlungspflichtig bestellen</button>
            <p class="ink3" style="font:400 12px/1.5 Lato,sans-serif;margin-top:10px;text-align:center">Es entstehen keine weiteren Kosten.</p>
        </div>
    </main>
</template>
