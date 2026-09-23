<script setup lang="ts">
/**
 * The legal pages: five sections over one route, and the text of the selected one.
 *
 * The bodies are placeholders until the client's Kanzlei supplies the text (D-024), and each one
 * says so visibly with the marker it was seeded with. We do not draft German legal copy: an
 * Impressum written by a developer is a liability the client carries. This page renders exactly
 * what the `page_blocks` rows hold — nothing is filled in here.
 *
 * The section list is a sticky rail beside the text from 900px and a wrapped row of links above
 * it on a phone — the same links either way, one DOM.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import type { RechtlichesProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<RechtlichesProps>()

const title = computed(() => props.tabs.find((t) => t.slug === props.active)?.title ?? 'Rechtliches')

/*
 * A block carries `heading` and `text` (older rows used `body`). A heading that merely repeats the
 * page title is dropped: the H1 already says it, and saying it twice reads as a template.
 */
const blocks = computed(() =>
    props.blocks.map((block) => {
        const heading = typeof block.data.heading === 'string' ? block.data.heading : null
        const text =
            typeof block.data.text === 'string'
                ? block.data.text
                : typeof block.data.body === 'string'
                  ? block.data.body
                  : ''

        return {
            id: block.id,
            heading: heading !== null && heading.trim() !== title.value ? heading : null,
            text,
            placeholder: block.data.placeholder === true,
        }
    })
)
</script>

<template>
    <Head :title="title" />

    <section class="section-dense">
        <div class="wrap rec">
            <nav class="rec__nav" aria-label="Rechtliches">
                <Link
                    v-for="tab in tabs"
                    :key="tab.slug"
                    :href="`/rechtliches/${tab.slug}`"
                    class="rec__link"
                    :class="{ 'rec__link--on': tab.slug === active }"
                    :aria-current="tab.slug === active ? 'page' : undefined"
                >
                    {{ tab.title }}
                </Link>
            </nav>

            <article class="rec__body">
                <h1 class="t-h1">{{ title }}</h1>

                <div v-for="block in blocks" :key="block.id" class="rec__block">
                    <h2 v-if="block.heading" class="t-h3">{{ block.heading }}</h2>
                    <p class="t-body" :class="{ 'rec__placeholder': block.placeholder }">{{ block.text }}</p>
                </div>

                <p v-if="blocks.length === 0" class="t-body rec__placeholder">
                    Für diesen Abschnitt liegt noch kein Text vor.
                </p>
            </article>
        </div>
    </section>
</template>

<style scoped>
.rec {
    display: grid;
    gap: var(--space-5);
}

/* Phone: the five sections as a wrapped row above the text. */
.rec__nav {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    border-bottom: 1px solid var(--line);
}

.rec__link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* Both ways: `AGB` is three letters and came out 36px wide, short of a thumb (DIRECTION §6). */
    min-width: 44px;
    min-height: 44px;
    color: var(--ink2);
    font-weight: 700;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color var(--duration-instant) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
    .rec__link:hover {
        color: var(--ink);
    }
}

/* The current section is marked by the strong rule as well as by colour. */
.rec__link--on {
    color: var(--ink);
    border-bottom-color: var(--border-strong);
}

.rec__body {
    min-width: 0;
    max-width: 75ch;
}

.rec__block {
    margin-top: var(--space-5);
}

.rec__block h2 {
    margin-bottom: var(--space-2);
}

.rec__placeholder {
    margin-top: var(--space-5);
    padding: var(--space-4);
    background: var(--field);
    border-radius: var(--radius-sm);
    color: var(--ink2);
}

.rec__block .rec__placeholder {
    margin-top: 0;
}

/* From 900px: a sticky rail beside the text. */
@media (min-width: 900px) {
    .rec {
        grid-template-columns: 220px minmax(0, 1fr);
        gap: var(--space-7);
        align-items: start;
    }

    .rec__nav {
        position: sticky;
        top: calc(var(--header-h) + var(--space-5));
        flex-direction: column;
        flex-wrap: nowrap;
        gap: 0;
        border-bottom: 0;
        border-left: 1px solid var(--line);
    }

    .rec__link {
        padding-left: var(--space-4);
        margin: 0 0 0 -1px;
        border-bottom: 0;
        border-left: 2px solid transparent;
    }

    .rec__link--on {
        border-left-color: var(--border-strong);
    }
}
</style>
