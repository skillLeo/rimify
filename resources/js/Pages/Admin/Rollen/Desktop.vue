<script setup lang="ts">
/**
 * Rollen und Berechtigungen — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/admin-rollen.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style. It is not "based on" the prototype; it IS the prototype. Do not tidy the inline styles
 *    into classes, do not extract components, do not reorder attributes, do not change a pixel
 *    value because it looks odd. All of that is measured.
 *  - The page is almost entirely `data-mount` slots, and they are intentionally empty.
 *    `shared/admin.js` fills each one at runtime: the admin sidebar, top bar and module rail, the
 *    role tabs, the unsaved-difference panel and the whole permission matrix. Writing the matrix
 *    out here by hand would put our markup back into the page and re-create exactly the drift this
 *    replaced.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Rollen" />

    <main id="main">
    <div class="adm">
            <aside class="adm-side" data-mount="adm-side"></aside>
            <div class="adm-main">
                <header class="adm-top" data-mount="adm-top"></header>
                <nav class="adm-rail" data-mount="adm-rail" aria-label="Module"></nav>
                <div class="adm-body">
                    <h1 class="h2" style="font-size:30px">Rollen und Berechtigungen</h1>
                    <p class="body ink2" style="font-size:15px;margin-top:6px">Änderungen werden erst nach dem Speichern wirksam – der Unterschied wird vorher angezeigt.</p>

                    <div style="margin-top:24px" data-mount="rol-tabs"></div>
                    <div style="margin-top:20px" data-mount="rol-diff"></div>
                    <section class="card pad" style="margin-top:20px" data-mount="rol-matrix"></section>
                </div>
            </div>
        </div>
    </main>
</template>
