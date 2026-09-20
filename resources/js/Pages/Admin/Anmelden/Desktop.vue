<script setup lang="ts">
/**
 * Admin · Anmelden — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/admin-anmelden.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style. It is not "based on" the prototype; it IS the prototype. Do not tidy the inline styles
 *    into classes, do not extract components, do not reorder attributes, do not change a pixel
 *    value because it looks odd. All of that is measured.
 *  - The `data-mount` divs are intentionally empty. `shared/admin.js` fills each one at runtime:
 *    `blueprint` draws the engineering backdrop behind the brand panel, `adm-login` writes the
 *    whole sign-in form. Filling one here by hand would put our markup back into the page and
 *    re-create exactly the drift this replaced — the previous version of this file was a
 *    hand-written `.login` grid that shared neither class names nor proportions with the design.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Anmelden" />

    <main id="main">
    <div class="split">
            <div class="brandp">
                <div class="bp" data-mount="blueprint"></div>
                <span class="wordmark" style="position:relative">RIMIFY</span>
                <div style="position:relative">
                    <div class="micro" style="color:#8FA6FF;letter-spacing:.14em">Internes System</div>
                    <div style="font:700 30px/1.25 Lato,sans-serif;letter-spacing:-.02em;margin-top:14px;max-width:16ch">Freigaben verwalten. Bestellungen abwickeln.</div>
                </div>
                <div style="position:relative;font:400 12px/1 Lato,sans-serif;color:rgba(255,255,255,.4)">RIMIFY GmbH · Düsseldorf</div>
            </div>
            <div class="formp"><div data-mount="adm-login"></div></div>
        </div>
    </main>
</template>
