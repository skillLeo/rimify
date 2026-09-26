<script setup lang="ts">
/**
 * One section of the Übersicht (the brief's craft rules): a flat panel — surface, a 1 px hairline,
 * 8 px corners, 20 px inside — a 15 px title, an optional menu, then its content.
 *
 * Every widget has the same four states, so none of them improvises one: the content; `empty`, one
 * sentence and at most one link, where the content would be; `loading`, a skeleton at the content's
 * own size; `error`, a sentence and "Erneut versuchen". The title's „Alle ansehen“ leads to the full
 * list the widget is a slice of.
 */

import { Link } from '@inertiajs/vue3'
import { useId } from 'vue'
import Icon from '../../Ui/Icon.vue'

withDefaults(
    defineProps<{
        title: string
        /** The full list behind this slice. */
        href?: string | null
        hrefLabel?: string
        /** One sentence shown instead of the content. */
        empty?: string | null
        emptyLink?: { label: string; href: string } | null
        loading?: boolean
        /** Rows the skeleton draws while loading. */
        skeletonRows?: number
        error?: string | null
    }>(),
    { href: null, hrefLabel: 'Alle ansehen', empty: null, emptyLink: null, loading: false, skeletonRows: 4, error: null }
)

const emit = defineEmits<{ retry: [] }>()

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

        <div v-if="loading" class="widget__skeleton" aria-hidden="true">
            <span v-for="n in skeletonRows" :key="n" class="skeleton widget__bar" />
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
    padding: var(--sp-20);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-surface);
}

.widget__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-12);
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
</style>
