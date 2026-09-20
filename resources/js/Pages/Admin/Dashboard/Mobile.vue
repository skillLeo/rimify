<script setup lang="ts">
/**
 * Admin · Dashboard — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/admin-dashboard.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The greeting
 * loses the `.spread` row and the theme switch drops below it as a full-width button; the two
 * 62fr/38fr columns become one stack of four `.card.pad-s` sections; the chart and the order table
 * each get their own `overflow-x:auto` scroller. None of that can be reached from the desktop
 * markup with media queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/admin.js` to fill — including
 * `adm-side`, `adm-top` and `adm-rail`, which are the panel's own chrome rather than a Vue layout.
 *
 * One thing the shell carries that this file cannot: its `<main>` is `<main id="main"
 * style="padding-bottom:0">`, cancelling the 96px the bottom navigation reserves. The `<main>` tag
 * belongs to `PrototypeLayout`, so that belongs in the layout or the shared CSS — not in markup
 * invented here.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Dashboard" />

    <main id="main" style="padding-bottom:0">
    <div class="adm">
            <aside class="adm-side" data-mount="adm-side"></aside>
            <div class="adm-main">
                <header class="adm-top" data-mount="adm-top"></header>
                <nav class="adm-rail" data-mount="adm-rail" aria-label="Module"></nav>
                <div class="adm-body">
                    <h1 class="h2">Guten Morgen, Stefan.</h1>
                    <p class="body ink2" style="margin-top:6px">7 Bestellungen warten auf Bearbeitung.</p>
                    <button class="btn btn-s btn-full" data-theme style="margin-top:16px">Dunkel</button>

                    <div class="grid3" style="margin-top:20px" data-mount="adm-tiles"></div>

                    <section class="card pad-s" style="margin-top:20px">
                        <h2 class="h4">Umsatz</h2>
                        <div style="margin-top:14px;overflow-x:auto" data-mount="adm-chart"></div>
                    </section>
                    <section class="card pad-s" style="margin-top:16px">
                        <h2 class="h4" style="margin-bottom:14px">Letzte Bestellungen</h2>
                        <div style="overflow-x:auto" data-mount="adm-orders"></div>
                    </section>
                    <section class="card pad-s" style="margin-top:16px">
                        <h2 class="h4">Aktivität</h2>
                        <div style="margin-top:6px" data-mount="adm-activity"></div>
                    </section>
                    <section class="card pad-s" style="margin-top:16px">
                        <h2 class="h4">Zu erledigen</h2>
                        <div style="margin-top:6px" data-mount="adm-todo"></div>
                    </section>
                </div>
            </div>
        </div>
    </main>
</template>
