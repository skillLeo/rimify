<script setup lang="ts">
/** The legal rail as a horizontal scroller above the text. */

import { Head, Link } from '@inertiajs/vue3'
import type { RechtlichesProps } from '../../types/pages'

defineProps<RechtlichesProps>()
</script>

<template>
    <Head title="Rechtliches" />

    <section class="section">
        <div class="wrap">
            <nav class="mrec__rail" aria-label="Rechtliches">
                <Link
                    v-for="tab in tabs"
                    :key="tab.slug"
                    :href="`/rechtliches/${tab.slug}`"
                    class="pill"
                    :class="{ 'pill--on': tab.slug === active }"
                    :aria-current="tab.slug === active ? 'page' : undefined"
                >
                    {{ tab.title }}
                </Link>
            </nav>

            <article class="card mrec__body">
                <h1 class="t-h2">{{ tabs.find((t) => t.slug === active)?.title ?? 'Rechtliches' }}</h1>

                <div v-for="block in blocks" :key="block.id" class="mrec__block">
                    <h2 v-if="block.data.heading" class="t-h3">{{ block.data.heading }}</h2>
                    <p class="t-body">{{ block.data.body }}</p>
                </div>

                <p v-if="blocks.length === 0" class="t-body quiet">
                    Für diesen Abschnitt liegt noch kein Text vor.
                </p>
            </article>
        </div>
    </section>
</template>

<style scoped>
.mrec__rail {
    display: flex;
    gap: var(--s2);
    overflow-x: auto;
    padding-bottom: var(--s2);
    margin-inline: calc(var(--gutter-m) * -1);
    padding-inline: var(--gutter-m);
    scrollbar-width: none;
}

.mrec__rail::-webkit-scrollbar {
    display: none;
}

.mrec__rail .pill {
    flex: none;
    text-decoration: none;
}

.mrec__body {
    margin-top: var(--s4);
}

.mrec__body h1 {
    margin: 0 0 var(--s4);
}

.mrec__block + .mrec__block {
    margin-top: var(--s4);
}

.mrec__block h2 {
    margin: 0 0 var(--s2);
}
</style>
