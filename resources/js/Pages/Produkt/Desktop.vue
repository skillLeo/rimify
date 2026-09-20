<script setup lang="ts">
/**
 * Produkt (PDP) — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/produkt.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style and every hand-written SVG. It is not "based on" the prototype; it IS the prototype.
 *    Do not tidy the inline styles into classes, do not extract components, do not reorder
 *    attributes, do not change a pixel value because it looks odd. All of that is measured.
 *  - The `data-mount` divs are intentionally empty. `shared/pages.js` fills each one at runtime
 *    with the real markup for that section (crumb, gallery, thumbnails, title, rating, colour
 *    swatches, size chips, vehicle selector, verdict, price, add-to-cart, Felgendetails and the
 *    Komplettrad offers). Filling one here by hand would put our markup back into the page and
 *    re-create exactly the drift this replaced.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected — the
 *    finance figure, the tyre sizes and the example vehicle stay exactly as the design wrote them.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Felge" />

    <main id="main">
    <div class="wrap" style="padding-top:24px">
            <nav class="crumb" data-mount="pdp-crumb"></nav>

            <div style="display:grid;grid-template-columns:52fr 48fr;gap:48px;margin-top:28px">
                <div>
                    <div data-mount="pdp-gallery"></div>
                    <div class="row" style="gap:8px;margin-top:16px;justify-content:center" data-mount="pdp-thumbs"></div>
                </div>
                <div>
                    <h1 class="h2" style="font-size:30px" data-mount="pdp-title"></h1>
                    <div class="row" style="gap:0;margin-top:8px" data-mount="pdp-rating"></div>

                    <div style="margin-top:24px"><span class="lab">Farbe:</span>
                        <div class="row" style="gap:12px;flex-wrap:wrap;margin-top:10px" data-mount="pdp-swatch"></div></div>

                    <div style="margin-top:20px"><span class="lab">Größe:</span>
                        <div class="chips" style="margin-top:10px" data-mount="pdp-sizes"></div></div>

                    <div style="margin-top:20px" data-mount="pdp-select"></div>
                    <div style="margin-top:20px" data-mount="pdp-verdict"></div>
                    <div style="margin-top:24px" data-mount="pdp-price"></div>
                    <div style="margin-top:20px" data-mount="pdp-add"></div>
                </div>
            </div>

            <!-- Finanzierung -->
            <div class="card" style="margin-top:48px;padding:16px 20px;border-radius:10px;display:flex;align-items:center;gap:16px">
                <span class="bl" style="display:flex"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/></svg></span>
                <div class="grow"><div style="font:700 15px/1.3 Lato,sans-serif">Finanzierung ab 62,52 € / Monat</div>
                    <div class="ink3" style="font:400 13px/1.4 Lato,sans-serif;margin-top:2px">Bei 12 Monaten Laufzeit. Ohne Zinsen.</div></div>
                <a class="link" href="#">Mehr erfahren</a>
            </div>

            <!-- Drei Panels -->
            <div class="grid3" style="margin-top:32px;align-items:start">
                <section class="card raised pad">
                    <div class="row" style="gap:10px"><span class="bl" style="display:flex"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.8a8.8 8.8 0 100-17.6 8.8 8.8 0 000 17.6zM12 14.8a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6z"/></svg></span>
                        <h2 style="font:700 16px/1 Lato,sans-serif">Felgendetails</h2></div>
                    <div style="margin-top:16px" data-mount="pdp-details"></div>
                </section>

                <section class="card raised pad">
                    <div class="row" style="gap:10px"><span class="bl" style="display:flex"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.8a8.8 8.8 0 100-17.6 8.8 8.8 0 000 17.6zM12 3.2v6M12 14.8v6M3.2 12h6M14.8 12h6"/></svg></span>
                        <h2 style="font:700 16px/1 Lato,sans-serif">Passende Reifen</h2></div>
                    <div class="micro" style="margin-top:16px">Empfohlen</div>
                    <div class="wash row" style="margin-top:8px;padding:12px 14px;gap:10px">
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <span class="mono"><b class="bl">VA:</b> 245 / 45 R20 · <b class="bl">HA:</b> 245 / 45 R20</span></div>
                    <div class="micro" style="margin-top:18px">Weitere</div>
                    <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
                        <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="mono"><b class="bl">VA:</b> 235 / 40 R20 · <b class="bl">HA:</b> 265 / 35 R20</span></div>
                        <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="mono"><b class="bl">VA:</b> 225 / 40 R19 · <b class="bl">HA:</b> 245 / 35 R19</span></div>
                    </div>
                    <p class="ink3" style="font:400 12px/1.5 Lato,sans-serif;margin-top:16px">Mindestens Tragfähigkeitsindex 92, Geschwindigkeitsindex Y.</p>
                </section>

                <section class="card raised pad">
                    <div class="row" style="gap:10px"><span class="bl" style="display:flex"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4zM12 11.5v9"/></svg></span>
                        <h2 style="font:700 16px/1 Lato,sans-serif">Zubehör (inkl.)</h2></div>
                    <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">
                        <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1 Lato,sans-serif">ABE</span></div>
                        <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1 Lato,sans-serif">Anbauset</span></div>
                        <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1 Lato,sans-serif">Ventile</span></div>
                    </div>
                </section>
            </div>
        </div>

        <!-- Kompletträder -->
        <section class="sec band" style="margin-top:64px">
            <div class="wrap">
                <h2 class="h2" style="text-align:center">Angebote für 4 Kompletträder</h2>
                <div class="row" style="justify-content:center;gap:10px;margin-top:10px">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#1A44D4"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span class="ink2" style="font:400 14px/1.4 Lato,sans-serif"><b class="bl">RIMIFY-CHECK:</b> Passend für BMW 3er Coupe mit Borbet Havanna <span class="mono">8,5 x 18 | ET 35</span></span>
                </div>
                <div class="grid4" style="margin-top:32px" data-mount="pdp-tyres"></div>
            </div>
        </section>

        <!-- Reifensortiment -->
        <section class="sec white">
            <div class="wrap">
                <h2 class="h2" style="text-align:center;max-width:24ch;margin-inline:auto">Unser gesamtes Reifensortiment passend für BORBET Havanna</h2>
                <div style="max-width:620px;margin:28px auto 0;background:var(--wash);border-radius:14px;padding:28px">
                    <div class="grid2" style="gap:16px">
                        <label><span class="flabel">Art</span><select class="field" style="background:#fff"><option>Sommerreifen</option><option>Winterreifen</option><option>Ganzjahresreifen</option></select></label>
                        <label><span class="flabel">Reifengröße</span><select class="field mono" style="background:#fff"><option>VA: 245 / 45 R20 · HA: 245 / 45 R20</option><option>VA: 235 / 40 R20 · HA: 265 / 35 R20</option></select></label>
                    </div>
                    <button class="btn btn-p btn-full" style="margin-top:20px">suchen</button>
                    <div class="row" style="justify-content:center;gap:10px;margin-top:16px">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#1A44D4"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <span class="ink2" style="font:400 13px/1.4 Lato,sans-serif"><b class="bl">RIMIFY-CHECK:</b> Passend für BMW 3er Coupe mit Borbet Havanna <span class="mono">8,5 x 18 | ET 35</span></span>
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>
