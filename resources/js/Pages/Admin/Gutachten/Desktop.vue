<script setup lang="ts">
/**
 * Gutachten erfassen — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/admin-gutachten.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style and the two hand-written chevron SVGs. It is not "based on" the prototype; it IS the
 *    prototype. Do not tidy the inline styles into classes, do not extract components, do not
 *    reorder attributes, do not change a pixel value because it looks odd. All of that is measured.
 *  - The `data-mount` divs are intentionally empty. `shared/admin.js` fills each one at runtime
 *    with the real markup for that slot (the admin sidebar, top bar and module rail, the document
 *    viewer, the HSN/TSN resolution result, the Auflagen chips and the conflict panel). Filling one
 *    here by hand would put our markup back into the page and re-create exactly the drift this
 *    replaced.
 *  - The German copy is the design's, down to "ABE 47231 · BORBET Havanna · Revision 2 · Entwurf".
 *    It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Gutachten" />

    <main id="main">
    <div class="adm">
            <aside class="adm-side" data-mount="adm-side"></aside>
            <div class="adm-main">
                <header class="adm-top" data-mount="adm-top"></header>
                <nav class="adm-rail" data-mount="adm-rail" aria-label="Module"></nav>
                <div class="adm-body">
                    <div class="spread">
                        <div>
                            <h1 class="h2" style="font-size:30px">Gutachten erfassen</h1>
                            <p class="body ink2" style="font-size:15px;margin-top:6px">ABE 47231 · BORBET Havanna · Revision 2 · Entwurf</p>
                        </div>
                        <div class="row" style="gap:10px">
                            <button class="btn btn-s" data-save style="height:44px">Entwurf speichern</button>
                            <button class="btn btn-p" style="height:44px">Veröffentlichen</button>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:44fr 56fr;gap:24px;margin-top:24px;align-items:start">
                        <section class="card pad" style="position:sticky;top:84px">
                            <div class="spread" style="margin-bottom:14px">
                                <h2 class="h4">Dokument</h2>
                                <span class="micro">Seite 3 von 11</span>
                            </div>
                            <div data-mount="gut-doc"></div>
                            <div class="row" style="gap:10px;margin-top:14px;justify-content:center">
                                <button class="btn btn-q" style="height:44px;width:44px;padding:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6l-6 6 6 6"/></svg></button>
                                <span class="mono ink2" style="align-self:center">3 / 11</span>
                                <button class="btn btn-q" style="height:44px;width:44px;padding:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg></button>
                            </div>
                        </section>

                        <div>
                            <section class="card pad">
                                <h2 class="h4">Fahrzeug auflösen</h2>
                                <div class="row" style="gap:12px;margin-top:14px">
                                    <label style="flex:1"><span class="flabel">HSN</span><input class="field field-mono" data-ghsn maxlength="4" value="1860"></label>
                                    <label style="flex:1"><span class="flabel">TSN</span><input class="field field-mono" data-gtsn maxlength="3" value="AAS"></label>
                                </div>
                                <div data-mount="gut-resolve"></div>
                            </section>

                            <section class="card pad" style="margin-top:20px">
                                <h2 class="h4">Zulässige Konfiguration</h2>
                                <div class="grid3" style="gap:16px;margin-top:14px">
                                    <label><span class="flabel">Breite von</span><input class="field mono" value="8,0"></label>
                                    <label><span class="flabel">Breite bis</span><input class="field mono" value="9,0"></label>
                                    <label><span class="flabel">Zoll</span><input class="field mono" value="18"></label>
                                    <label><span class="flabel">ET von</span><input class="field mono" value="30"></label>
                                    <label><span class="flabel">ET bis</span><input class="field mono" value="40"></label>
                                    <label><span class="flabel">Lochkreis</span><input class="field mono" value="5/112"></label>
                                </div>
                                <label class="check" style="margin-top:14px"><input type="checkbox" checked>
                                    <span style="font:400 15px/1.4 Lato,sans-serif">Eintragung in die Fahrzeugpapiere erforderlich</span></label>
                                <div style="margin-top:20px" data-mount="gut-chips"></div>
                            </section>

                            <div style="margin-top:20px" data-mount="gut-conflict"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
