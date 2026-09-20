<script setup lang="ts">
/**
 * Rollen und Berechtigungen — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/admin-rollen.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The heading
 * drops the 30px override, the sub-line is shortened to one clause, the tab rail and the matrix
 * card each gain `overflow-x:auto` so the permission grid scrolls sideways instead of being
 * squeezed, and the card is `pad-s` rather than `pad`. None of that can be reached from the
 * desktop markup with media queries, which is why the design ships two files and so do we.
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
    <Head title="Rollen" />

    <main id="main" style="padding-bottom:0">
    <div class="adm">
            <aside class="adm-side" data-mount="adm-side"></aside>
            <div class="adm-main">
                <header class="adm-top" data-mount="adm-top"></header>
                <nav class="adm-rail" data-mount="adm-rail" aria-label="Module"></nav>
                <div class="adm-body">
                    <h1 class="h2">Rollen und Berechtigungen</h1>
                    <p class="body ink2" style="margin-top:6px">Änderungen werden erst nach dem Speichern wirksam.</p>
                    <div style="margin-top:18px;overflow-x:auto" data-mount="rol-tabs"></div>
                    <div style="margin-top:16px" data-mount="rol-diff"></div>
                    <section class="card pad-s" style="margin-top:16px;overflow-x:auto" data-mount="rol-matrix"></section>
                </div>
            </div>
        </div>
    </main>
</template>
