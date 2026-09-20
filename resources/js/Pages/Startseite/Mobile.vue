<script setup lang="ts">
/**
 * Startseite — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/startseite.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The hero is
 * a 4/5 image block with the selector card pulled up over its lower edge by `margin:-28px 16px 0`;
 * the marque tiles are a 4-column grid rather than 8; the bestsellers are a horizontal `.rail`
 * instead of a `.grid4`; the "Dein Vorteil" panel stacks the photograph above the text rather
 * than beside it. None of that can be reached from the desktop markup with media queries, which
 * is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages.js` to fill.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Felgen mit Gutachten" />

    <main id="main">
    <!-- 1 · HERO -->
        <section style="position:relative;padding-bottom:28px">
            <div style="position:relative;width:100%;aspect-ratio:4/5;min-height:560px;overflow:hidden;background:#05070B">
                <div data-mount="hero-scene" style="position:absolute;inset:0"></div>
                <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(4,6,10,.94) 0%,rgba(4,6,10,.70) 46%,rgba(4,6,10,.30) 76%,rgba(4,6,10,.60) 100%)"></div>
                <div style="position:absolute;left:16px;right:16px;top:28px;pointer-events:none">
                    <div class="rise" style="font:700 11px/1.4 Lato,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8FA6FF">RIMIFY-CHECK · Freigabe geprüft</div>
                    <h1 lang="de" class="display rise rise-1" style="margin-top:12px;color:#fff">Felgen, die zu deinem Auto passen.<br><span style="color:#8FA6FF">Garantiert.</span></h1>
                    <p class="rise rise-2" style="margin-top:12px;font:400 15px/1.55 Lato,sans-serif;color:rgba(255,255,255,.80)">Wähle dein Fahrzeug – wir zeigen dir nur Felgen, die dafür freigegeben sind.</p>
                </div>
            </div>
            <div class="rise rise-3" style="margin:-28px 16px 0;position:relative;background:#fff;border-radius:18px;box-shadow:var(--sh-2);overflow:hidden">
                <div style="background:var(--blue);color:#fff;font:700 15px/1 Lato,sans-serif;padding:16px 20px">Fahrzeug wählen</div>
                <div style="padding:20px" data-mount="hero-selector"></div>
            </div>
            <div style="margin-top:20px;display:flex;gap:10px;overflow-x:auto;padding:0 16px;scroll-snap-type:x mandatory" data-mount="trust"></div>
        </section>

        <!-- 2 · BRAND STRIP -->
        <section style="background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:24px 16px;display:flex;gap:32px;overflow-x:auto;scroll-snap-type:x mandatory" data-mount="brandstrip"></section>

        <!-- 3 · MARKEN -->
        <section class="sec white">
            <div class="wrap">
                <h2 class="h2" style="margin-bottom:24px">Entdecke die beliebtesten Felgenmarken</h2>
                <div style="display:flex;flex-direction:column;gap:16px" data-mount="brandcards"></div>
            </div>
        </section>

        <!-- 4 · AUTO WÄHLEN -->
        <section class="sec band">
            <div class="wrap">
                <h2 class="h2" style="margin-bottom:20px">Auto wählen, garantiert passende Felge finden</h2>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px" data-mount="tiles"></div>
                <a class="link" style="margin-top:20px" href="felgen-suchen.html">Alle Marken anzeigen
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14M13.5 6.5L19 12l-5.5 5.5"/></svg></a>
            </div>
        </section>

        <!-- 5 · BESTSELLER -->
        <section class="sec white" style="padding-left:0;padding-right:0">
            <div class="wrap" style="margin-bottom:20px"><h2 class="h2">Bestseller aus Mai 2026</h2></div>
            <div style="padding:0 16px"><div class="rail" data-mount="bestseller"></div></div>
        </section>

        <!-- 6 · DEIN VORTEIL -->
        <section class="sec band">
            <div class="wrap">
                <div class="card raised pnl" style="overflow:hidden">
                    <div style="position:relative;aspect-ratio:16/10;background:var(--ground);overflow:hidden" data-mount="car-check"></div>
                    <div class="pad-s">
                        <div class="row" style="gap:8px;flex-wrap:wrap">
                            <span class="h3" style="font-size:20px">Dein Vorteil:</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#1A44D4"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <span class="h3 bl" style="font-size:20px">RIMIFY-CHECK</span>
                        </div>
                        <p class="body ink2" style="margin-top:14px">Mit RIMIFY CHECK prüfen wir die Kompatibilität zwischen Fahrzeug und Felge. So kannst du sicher sein, dass deine Wunschfelge zu deinem Fahrzeug passt und zugelassen ist.</p>
                        <div class="wash" style="margin-top:18px">
                            <div class="row" style="gap:28px">
                                <div><div class="micro" style="color:var(--ink2)">Fahrzeug</div><div class="mono" style="margin-top:6px">BMW M4 F82</div></div>
                                <div><div class="micro" style="color:var(--ink2)">Felge</div><div class="mono" style="margin-top:6px">Wheelforce CF.3</div></div>
                            </div>
                            <div style="height:1px;background:var(--bline);margin:14px 0"></div>
                            <div class="row" style="gap:10px;align-items:flex-start">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="flex:none;margin-top:2px"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#2E8B22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                <span style="font:700 14px/1.4 Lato,sans-serif">Freigegeben – keine Eintragung erforderlich</span>
                            </div>
                        </div>
                        <a class="btn btn-p btn-full" style="margin-top:18px" href="rimify-check.html">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9.2" stroke="#fff" stroke-width="1.6"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            RIMIFY-CHECK</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- 7 · WARUM RIMIFY -->
        <section class="sec white">
            <div class="wrap">
                <h2 class="h2" style="margin-bottom:24px">Warum RIMIFY?</h2>
                <div style="display:flex;flex-direction:column" data-mount="warum"></div>
            </div>
        </section>

        <!-- 8 · FELGENPAKET -->
        <section class="sec band">
            <div class="wrap">
                <div class="card raised pnl" style="overflow:hidden">
                    <div data-mount="scene-lager"></div>
                    <div class="pad-s">
                        <h2 class="h2">Dein Felgenpaket</h2>
                        <div style="margin-top:20px;border:1px solid var(--line);border-radius:14px;padding:18px">
                            <div class="micro">Lieferung</div>
                            <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#4A5160" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">Felgen</span></div>
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#4A5160" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Anbauset &amp; ABE</span></div>
                            </div>
                        </div>
                        <div style="margin-top:14px;background:var(--wash);border:1px solid var(--blue);border-radius:14px;padding:18px">
                            <div class="row" style="gap:10px;flex-wrap:wrap"><span class="pill pill-blue">Empfohlen</span><span class="h4">Komplettrad</span></div>
                            <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
                                <div class="row" style="align-items:flex-start"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none;margin-top:3px"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Montage der Reifen auf die Felgen</span></div>
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Wuchten</span></div>
                                <div class="row"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 15px/1.4 Lato,sans-serif">inkl. Ventile &amp; Gewichte</span></div>
                            </div>
                        </div>
                        <a class="btn btn-p btn-full" style="margin-top:20px;height:auto;min-height:52px;padding:12px 16px;line-height:1.3" href="felgen-suchen.html">Jetzt Auto wählen und passende Felgen finden</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- 9 · FAQ -->
        <section class="sec white">
            <div class="wrap">
                <h2 class="h2" style="margin-bottom:20px">Meistgestellte Fragen</h2>
                <div data-mount="faq-home"></div>
                <div class="card raised pad-s" style="margin-top:24px">
                    <h3 class="h4">Weitere Fragen oder Unterstützung benötigt?</h3>
                    <div style="margin-top:18px" data-mount="contact-rows"></div>
                    <p class="body ink2" style="margin-top:18px">Wir freuen uns von dir zu hören.</p>
                    <div style="margin-top:16px;border-radius:10px;overflow:hidden" data-mount="scene-werkstatt"></div>
                    <a class="btn btn-s btn-full" style="margin-top:16px" href="kontakt.html">Zum Kontaktformular</a>
                </div>
            </div>
        </section>
    </main>
</template>
