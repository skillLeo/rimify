<script setup lang="ts">
/**
 * Startseite — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/startseite.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style and every hand-written SVG. It is not "based on" the prototype; it IS the prototype.
 *    Do not tidy the inline styles into classes, do not extract components, do not reorder
 *    attributes, do not change a pixel value because it looks odd. All of that is measured.
 *  - The `data-mount` divs are intentionally empty. `shared/pages.js` fills each one at runtime
 *    with the real markup for that section (hero photograph, brand cards, marque tiles, product
 *    cards, FAQ). Filling one here by hand would put our markup back into the page and re-create
 *    exactly the drift this replaced.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Felgen mit Gutachten" />

    <main id="main">
    <!-- 1 · HERO -->
        <section style="position:relative;min-height:880px;overflow:hidden;background:#05070B">
            <div data-mount="hero-scene" style="position:absolute;inset:0"></div>
            <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,rgba(4,6,10,.94) 0%,rgba(4,6,10,.80) 38%,rgba(4,6,10,.28) 68%,rgba(4,6,10,.10) 100%)"></div>
            <div class="wrap" style="position:relative;min-height:880px;padding-top:56px;padding-bottom:108px;display:flex;align-items:center">
                <div style="width:480px">
                    <div class="rise" style="font:700 11px/1.4 Lato,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8FA6FF">RIMIFY-CHECK · Freigabe geprüft</div>
                    <h1 lang="de" class="display rise rise-1" style="margin-top:14px;color:#fff">Felgen, die zu deinem Auto passen.<br><span style="color:#8FA6FF">Garantiert.</span></h1>
                    <p class="rise rise-2" style="margin-top:16px;max-width:400px;font:400 17px/1.55 Lato,sans-serif;color:rgba(255,255,255,.80)">Wähle dein Fahrzeug – wir zeigen dir nur Felgen, die dafür freigegeben sind.</p>
                    <div class="rise rise-3" style="margin-top:28px;width:440px;background:#fff;border-radius:18px;box-shadow:var(--sh-2);overflow:hidden">
                        <div style="background:var(--blue);color:#fff;font:700 15px/1 Lato,sans-serif;padding:16px 24px">Fahrzeug wählen</div>
                        <div style="padding:24px" data-mount="hero-selector"></div>
                    </div>
                </div>
            </div>
            <div style="position:absolute;left:0;right:0;bottom:0;height:52px;background:rgba(4,6,10,.55);border-top:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center" data-mount="trust"></div>
        </section>

        <!-- 2 · BRAND STRIP -->
        <section style="height:96px;background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);display:flex;align-items:center">
            <div class="wrap" style="width:100%;display:flex;align-items:center;justify-content:space-between" data-mount="brandstrip"></div>
        </section>

        <!-- 3 · MARKEN -->
        <section class="sec white">
            <div class="wrap">
                <h2 class="h2" style="text-align:center;margin-bottom:40px">Entdecke die beliebtesten Felgenmarken</h2>
                <div class="grid2" data-mount="brandcards"></div>
            </div>
        </section>

        <!-- 4 · AUTO WÄHLEN -->
        <section class="sec band">
            <div class="wrap">
                <h2 class="h2" style="margin-bottom:32px">Auto wählen, garantiert passende Felge finden</h2>
                <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:24px" data-mount="tiles"></div>
                <a class="link" style="margin-top:28px" href="felgen-suchen.html">Alle Marken anzeigen
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14M13.5 6.5L19 12l-5.5 5.5"/></svg></a>
            </div>
        </section>

        <!-- 5 · BESTSELLER -->
        <section class="sec white">
            <div class="wrap">
                <div class="spread" style="align-items:baseline;margin-bottom:36px">
                    <h2 class="h2">Bestseller aus Mai 2026</h2>
                    <a class="link" href="felgen.html">Alle Felgen ansehen
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14M13.5 6.5L19 12l-5.5 5.5"/></svg></a>
                </div>
                <div class="grid4" data-mount="bestseller"></div>
            </div>
        </section>

        <!-- 6 · DEIN VORTEIL -->
        <section class="sec band">
            <div class="wrap">
                <div class="card raised pnl" style="display:grid;grid-template-columns:46fr 54fr;overflow:hidden">
                    <div class="pad-l">
                        <div class="row" style="gap:10px">
                            <span class="h3" style="font-size:20px">Dein Vorteil:</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#1A44D4"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <span class="h3 bl" style="font-size:20px">RIMIFY-CHECK</span>
                        </div>
                        <p class="body ink2" style="margin-top:16px;max-width:460px">Mit RIMIFY CHECK prüfen wir die Kompatibilität zwischen Fahrzeug und Felge. So kannst du sicher sein, dass deine Wunschfelge zu deinem Fahrzeug passt und zugelassen ist.</p>
                        <div class="wash" style="margin-top:24px;padding:18px 20px">
                            <div class="row" style="gap:40px">
                                <div><div class="micro" style="color:var(--ink2)">Fahrzeug</div><div class="mono" style="margin-top:6px">BMW M4 F82</div></div>
                                <div><div class="micro" style="color:var(--ink2)">Felge</div><div class="mono" style="margin-top:6px">Wheelforce CF.3</div></div>
                            </div>
                            <div style="height:1px;background:var(--bline);margin:16px 0"></div>
                            <div class="row" style="gap:10px">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                <span style="font:700 14px/1.4 Lato,sans-serif">Freigegeben – keine Eintragung erforderlich</span>
                            </div>
                        </div>
                        <a class="btn btn-p" style="margin-top:24px" href="rimify-check.html">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9.2" stroke="#fff" stroke-width="1.6"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            RIMIFY-CHECK</a>
                    </div>
                    <div style="position:relative;min-height:460px;background:var(--ground);overflow:hidden">
                        <div data-mount="car-check" style="position:absolute;inset:0"></div>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
                            <line x1="0" y1="46" x2="44" y2="56" stroke="#1A44D4" stroke-width="0.25" vector-effect="non-scaling-stroke"/>
                            <line x1="0" y1="58" x2="26" y2="76" stroke="#1A44D4" stroke-width="0.25" vector-effect="non-scaling-stroke"/>
                            <circle cx="44" cy="56" r="0.7" fill="#1A44D4" vector-effect="non-scaling-stroke"/>
                            <circle cx="26" cy="76" r="0.7" fill="#1A44D4" vector-effect="non-scaling-stroke"/>
                        </svg>
                    </div>
                </div>
            </div>
        </section>

        <!-- 7 · WARUM RIMIFY -->
        <section class="sec white">
            <div class="wrap">
                <h2 class="h2" style="margin-bottom:40px">Warum RIMIFY?</h2>
                <div style="display:grid;grid-template-columns:repeat(3,1fr)" data-mount="warum"></div>
            </div>
        </section>

        <!-- 8 · FELGENPAKET -->
        <section class="sec band">
            <div class="wrap">
                <div class="card raised pnl" style="display:grid;grid-template-columns:42fr 58fr;overflow:hidden">
                    <div data-mount="scene-lager" style="min-height:400px"></div>
                    <div class="pad-l">
                        <h2 class="h2">Dein Felgenpaket</h2>
                        <div style="margin-top:28px;border:1px solid var(--line);border-radius:14px;padding:22px 24px">
                            <div class="micro">Lieferung</div>
                            <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#4A5160" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">Felgen</span></div>
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#4A5160" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Anbauset &amp; ABE</span></div>
                            </div>
                        </div>
                        <div style="margin-top:16px;background:var(--wash);border:1px solid var(--blue);border-radius:14px;padding:22px 24px">
                            <div class="row" style="gap:12px"><span class="pill pill-blue">Empfohlen</span><span class="h4">Komplettrad</span></div>
                            <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Montage der Reifen auf die Felgen</span></div>
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Wuchten</span></div>
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Ventile &amp; Gewichte</span></div>
                            </div>
                        </div>
                        <a class="btn btn-p btn-full" style="margin-top:24px" href="felgen-suchen.html">Jetzt Auto wählen und passende Felgen finden
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14M13.5 6.5L19 12l-5.5 5.5"/></svg></a>
                    </div>
                </div>
            </div>
        </section>

        <!-- 9 · FAQ -->
        <section class="sec white" style="padding-bottom:112px">
            <div class="wrap" style="display:grid;grid-template-columns:62fr 38fr;gap:40px;align-items:start">
                <div>
                    <h2 class="h2" style="margin-bottom:28px">Meistgestellte Fragen</h2>
                    <div data-mount="faq-home"></div>
                </div>
                <div class="card raised pad">
                    <h3 class="h4">Weitere Fragen oder Unterstützung benötigt?</h3>
                    <div style="margin-top:20px" data-mount="contact-rows"></div>
                    <p class="body ink2" style="margin-top:20px;font-size:15px">Wir freuen uns von dir zu hören.</p>
                    <div style="margin-top:18px;border-radius:10px;overflow:hidden" data-mount="scene-werkstatt"></div>
                    <a class="btn btn-s btn-full" style="margin-top:18px" href="kontakt.html">Zum Kontaktformular</a>
                </div>
            </div>
        </section>
    </main>
</template>
