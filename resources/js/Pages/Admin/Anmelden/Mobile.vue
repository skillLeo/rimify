<script setup lang="ts">
/**
 * Admin · Anmelden — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/admin-anmelden.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The brand
 * panel is a 230px band above the form rather than a 46fr column beside it, the wordmark is pinned
 * to 20px, the headline drops from 30px to 20px and loses its `max-width:16ch`, and the
 * "RIMIFY GmbH · Düsseldorf" footline is dropped altogether. None of that can be reached from the
 * desktop markup with media queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/admin.js` to fill.
 *
 * One thing the shell carries that this file cannot: its `<main>` is `<main id="main"
 * style="padding-bottom:0">`, cancelling the 96px the bottom navigation reserves. The `<main>` tag
 * belongs to `PrototypeLayout`, so that belongs in the layout or the shared CSS — not in markup
 * invented here.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Anmelden" />

    <main id="main" style="padding-bottom:0">
    <div class="split">
            <div class="brandp">
                <div class="bp" data-mount="blueprint"></div>
                <span class="wordmark" style="position:relative;font-size:20px">RIMIFY</span>
                <div style="position:relative">
                    <div class="micro" style="color:#8FA6FF;letter-spacing:.14em">Internes System</div>
                    <div style="font:700 20px/1.25 Lato,sans-serif;letter-spacing:-.02em;margin-top:8px">Freigaben verwalten. Bestellungen abwickeln.</div>
                </div>
            </div>
            <div class="formp"><div data-mount="adm-login"></div></div>
        </div>
    </main>
</template>
