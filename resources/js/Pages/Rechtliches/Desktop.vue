<script setup lang="ts">
/**
 * The legal pages, as a rail of five over one route.
 *
 * The bodies are placeholders until the client's Kanzlei supplies the text (D-024). We do not
 * draft German legal copy: an Impressum written by a developer is a liability the client carries,
 * and a page that states plainly what is outstanding is the honest interim.
 */

import { Head, Link } from '@inertiajs/vue3'
import type { RechtlichesProps } from '../../types/pages'

defineProps<RechtlichesProps>()
</script>

<template>
    <Head title="Rechtliches" />

    <section class="section">
        <div class="wrap rec">
            <nav class="rec__rail" aria-label="Rechtliches">
                <Link
                    v-for="tab in tabs"
                    :key="tab.slug"
                    :href="`/rechtliches/${tab.slug}`"
                    class="rec__tab"
                    :class="{ 'rec__tab--on': tab.slug === active }"
                    :aria-current="tab.slug === active ? 'page' : undefined"
                >
                    {{ tab.title }}
                </Link>
            </nav>

            <article class="card rec__body">
                <h1 class="t-h1">{{ tabs.find((t) => t.slug === active)?.title ?? 'Rechtliches' }}</h1>

                <div v-for="block in blocks" :key="block.id" class="rec__block">
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
.rec {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: var(--space-6);
    align-items: start;
}

.rec__rail {
    display: grid;
    gap: var(--space-1);
}

.rec__tab {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding-inline: var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--ink2);
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
}

.rec__tab:hover {
    background: var(--surface);
}

/* The 2px blue left edge that marks the active item, exactly as the admin rail does. */
.rec__tab--on {
    background: var(--wash);
    color: var(--blue);
    box-shadow: inset 2px 0 0 var(--blue);
}

.rec__body h1 {
    margin: 0 0 var(--space-5);
}

.rec__block + .rec__block {
    margin-top: var(--space-5);
}

.rec__block h2 {
    margin: 0 0 var(--space-2);
}
</style>
