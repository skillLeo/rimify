<script setup lang="ts">
/**
 * Rechtliches — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/rechtliches.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The desktop
 * page is a two-column grid with the rail held sticky in a card beside the body; here the rail is
 * a bare `<nav>` stacked above an article that is pushed down by `margin-top:24px`. That cannot be
 * reached from the desktop markup with media queries, which is why the design ships two files and
 * so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages2.js` to fill.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Rechtliches" />

    <main id="main">
    <div class="wrap" style="padding:28px 16px 56px">
            <nav data-mount="legal-tabs"></nav>
            <article style="margin-top:24px" data-mount="legal-body"></article>
        </div>
    </main>
</template>
