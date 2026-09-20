<script setup lang="ts">
/**
 * Rechtliches — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/rechtliches.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including the inline grid
 *    on the wrapper and the sticky offset on the rail. It is not "based on" the prototype; it IS
 *    the prototype. Do not tidy the inline styles into classes, do not extract components, do not
 *    reorder attributes, do not change a pixel value because it looks odd. All of that is measured.
 *  - The two `data-mount` divs are intentionally empty. `shared/pages2.js` fills `legal-tabs` with
 *    the rail of legal sections and `legal-body` with the text of the selected one at runtime.
 *    Writing the rail or the bodies here by hand would put our markup back into the page and
 *    re-create exactly the drift this replaced.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Rechtliches" />

    <main id="main">
    <div class="wrap" style="padding:64px 40px 96px;display:grid;grid-template-columns:240px 1fr;gap:48px;align-items:start">
            <nav class="card" style="padding:8px;position:sticky;top:24px" data-mount="legal-tabs"></nav>
            <article data-mount="legal-body"></article>
        </div>
    </main>
</template>
