<script setup lang="ts">
/**
 * One section of the Übersicht (the brief's craft rules): a flat panel — surface, a 1 px hairline,
 * 8 px corners, 20 px inside — a 15 px title, an optional menu, then its content.
 *
 * Every widget has the same four states, so none of them improvises one: the content; `empty`, one
 * sentence and at most one link, where the content would be; `loading`, a skeleton at the content's
 * own size; `error`, a sentence and "Erneut versuchen". The link beside the title leads to the full
 * list the widget is a slice of, and each call site names it („Alle Bestellungen“, „Ganzes
 * Protokoll“); „Alle ansehen“ is only the fallback.
 */

import { Link } from '@inertiajs/vue3'
import { computed, useId } from 'vue'
import Icon from '../AdminIcon.vue'

const props = withDefaults(
    defineProps<{
        title: string
        /** The full list behind this slice. */
        href?: string | null
        hrefLabel?: string
        /** One sentence shown instead of the content. */
        empty?: string | null
        emptyLink?: { label: string; href: string } | null
        loading?: boolean
        /** Rows the skeleton draws while loading, where no `bodyHeight` is given. */
        skeletonRows?: number
        error?: string | null
        /**
         * The body's height in px, the same in every state — skeleton, content, empty sentence, error.
         * A chart's box is known before its data: giving it once means nothing on the page moves when
         * the data lands, or when a new Zeitraum replaces it.
         */
        bodyHeight?: number | string | null
    }>(),
    { href: null, hrefLabel: 'Alle ansehen', empty: null, emptyLink: null, loading: false, skeletonRows: 4, error: null, bodyHeight: null }
)

const emit = defineEmits<{ retry: [] }>()

/*
 * Only a plot keeps a minimum — the skeleton standing in for it, and the chart itself. An empty card
 * or an error shrinks to its sentence: a card never holds space for a chart it does not have.
 */
const box = computed(() => (props.bodyHeight ? { minHeight: typeof props.bodyHeight === 'number' ? `${props.bodyHeight}px` : props.bodyHeight } : undefined))

const titleId = useId()
</script>

<template>
    <section class="widget" :aria-labelledby="titleId" :aria-busy="loading ? 'true' : undefined">
        <header class="widget__head">
            <h2 :id="titleId" class="widget__title">{{ title }}</h2>
            <span class="widget__tools">
                <slot name="tools" />
                <Link v-if="href" :href="href" class="widget__all">
                    {{ hrefLabel }}<span class="visually-hidden">: {{ title }}</span>
                    <Icon name="arrow-right" :size="16" />
                </Link>
            </span>
        </header>

        <div v-if="loading" class="widget__skeleton" :style="box" aria-hidden="true">
            <slot name="skeleton">
                <span v-if="bodyHeight" class="skeleton widget__block" />
                <template v-else>
                    <span v-for="n in skeletonRows" :key="n" class="skeleton widget__bar" />
                </template>
            </slot>
        </div>

        <div v-else-if="error" class="widget__state" role="alert">
            <p class="widget__sentence">{{ error }}</p>
            <button class="btn btn--secondary btn--sm" type="button" @click="emit('retry')">Erneut versuchen</button>
        </div>

        <div v-else-if="empty" class="widget__state">
            <p class="widget__sentence">{{ empty }}</p>
            <Link v-if="emptyLink" :href="emptyLink.href" class="widget__link">{{ emptyLink.label }}</Link>
        </div>

        <div v-else class="widget__body">
            <slot />
        </div>
    </section>
</template>

<style scoped>
.widget {
    display: flex;
    flex-direction: column;
    gap: var(--sp-12);
    min-width: 0;
    padding: var(--adm-card-pad);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-surface);
}

/* One height for every head, with a chart's menu or without: the bodies of a row start level. In a
   narrow card the link goes under the title rather than past the card's edge. */
.widget__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-4) var(--sp-12);
    min-height: var(--adm-control-h);
}

.widget__title {
    margin: 0;
    font-size: var(--adm-fs-title);
    line-height: var(--adm-lh-title);
    font-weight: 600;
    color: var(--c-ink);
}

.widget__tools {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
}

.widget__all {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
    color: var(--c-ink-2);
    text-decoration: none;
    white-space: nowrap;
}

/* A finger's target: the link's line grows to 44 px, the text stays where it is. */
@media (pointer: coarse) {
    .widget__all {
        min-height: var(--adm-control-h-lg);
    }
}

@media (hover: hover) and (pointer: fine) {
    .widget__all:hover {
        color: var(--c-ink);
        text-decoration: underline;
        text-underline-offset: var(--sp-4);
    }
}

.widget__body {
    min-width: 0;
}

.widget__state {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
    padding-block: var(--sp-12);
}

.widget__sentence {
    max-width: 48ch;
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.widget__link {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-blue);
}

.widget__skeleton {
    display: grid;
    gap: var(--sp-12);
}

.widget__bar {
    display: block;
    height: var(--sp-20);
}

.widget__skeleton:has(> .widget__block) {
    display: flex;
}

.widget__block {
    display: block;
    flex: 1;
}
</style>
