<script setup lang="ts">
/**
 * Gutachten erfassen — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/admin-gutachten.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. There is no
 * sticky two-column split: the document viewer, the vehicle resolution and the configuration are
 * three stacked `card pad-s` sections; the configuration grid is two columns rather than a
 * `.grid3`; the page-turn controls and the "Zoll"/"Lochkreis" fields are absent altogether; the
 * two actions move to the bottom as full-width buttons; and the checkbox label is shortened to
 * "Eintragung erforderlich". None of that can be reached from the desktop markup with media
 * queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/admin.js` to fill.
 *
 * One thing the shell carries that this file cannot: its `<main>` opens as
 * `<main id="main" style="padding-bottom:0">`, cancelling `body.is-mobile main{padding-bottom:96px}`
 * because the admin has no bottom bar. `<main>` belongs to `PrototypeLayout`, so that override
 * belongs in the shared CSS — not in new markup here.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Gutachten" />

    <main id="main" style="padding-bottom:0">
    <div class="adm">
            <aside class="adm-side" data-mount="adm-side"></aside>
            <div class="adm-main">
                <header class="adm-top" data-mount="adm-top"></header>
                <nav class="adm-rail" data-mount="adm-rail" aria-label="Module"></nav>
                <div class="adm-body">
                    <h1 class="h2">Gutachten erfassen</h1>
                    <p class="body ink2" style="margin-top:6px">ABE 47231 · BORBET Havanna · Revision 2</p>

                    <section class="card pad-s" style="margin-top:18px">
                        <div class="spread" style="margin-bottom:12px"><h2 class="h4">Dokument</h2><span class="micro">Seite 3 von 11</span></div>
                        <div data-mount="gut-doc"></div>
                    </section>

                    <section class="card pad-s" style="margin-top:16px">
                        <h2 class="h4">Fahrzeug auflösen</h2>
                        <div class="row" style="gap:12px;margin-top:12px">
                            <label style="flex:1"><span class="flabel">HSN</span><input class="field field-mono" data-ghsn maxlength="4" value="1860"></label>
                            <label style="flex:1"><span class="flabel">TSN</span><input class="field field-mono" data-gtsn maxlength="3" value="AAS"></label>
                        </div>
                        <div data-mount="gut-resolve"></div>
                    </section>

                    <section class="card pad-s" style="margin-top:16px">
                        <h2 class="h4">Zulässige Konfiguration</h2>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
                            <label><span class="flabel">Breite von</span><input class="field mono" value="8,0"></label>
                            <label><span class="flabel">Breite bis</span><input class="field mono" value="9,0"></label>
                            <label><span class="flabel">ET von</span><input class="field mono" value="30"></label>
                            <label><span class="flabel">ET bis</span><input class="field mono" value="40"></label>
                        </div>
                        <label class="check" style="margin-top:12px"><input type="checkbox" checked>
                            <span style="font:400 15px/1.4 Lato,sans-serif">Eintragung erforderlich</span></label>
                        <div style="margin-top:18px" data-mount="gut-chips"></div>
                    </section>

                    <div style="margin-top:16px" data-mount="gut-conflict"></div>
                    <button class="btn btn-s btn-full" data-save style="margin-top:16px">Entwurf speichern</button>
                    <button class="btn btn-p btn-full" style="margin-top:12px">Veröffentlichen</button>
                </div>
            </div>
        </div>
    </main>
</template>
