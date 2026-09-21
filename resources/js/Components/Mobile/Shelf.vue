<script setup lang="ts">
/**
 * A horizontal shelf: a row header with "Alle ansehen", then tiles that snap as they scroll,
 * 2.2 of them visible so the cut-off third says "there is more" without a hint. The track bleeds
 * to the viewport edges and its scroll padding equals the page margin, so a snapped tile sits
 * exactly on the page grid.
 */

import { Link } from '@inertiajs/vue3'

import { computed, useId } from 'vue'

const props = withDefaults(
    defineProps<{
        title: string
        href?: string
        linkLabel?: string
        headingLevel?: 2 | 3
        /** The tile width; by default 2.2 tiles fit the viewport. A page may pass `62vw`, `96px`. */
        width?: string
        /** Names the list for assistive technology; the title when omitted. */
        listLabel?: string
        /** Render as a plain block when the caller already provides the section element. */
        bare?: boolean
        /** The caller renders its own heading; only the track is rendered. */
        hideHead?: boolean
        /** A shelf of static cards has nothing to tab to; the track itself then takes focus so a keyboard can scroll it. */
        focusable?: boolean
    }>(),
    { href: undefined, linkLabel: 'Alle ansehen', headingLevel: 2, width: undefined, listLabel: undefined, bare: false, hideHead: false, focusable: false }
)

const uid = useId()
const style = computed(() => (props.width ? { '--shelf-w': props.width } : undefined))
</script>

<template>
    <component :is="bare ? 'div' : 'section'" class="mshelf" :aria-labelledby="bare ? undefined : `${uid}-title`">
        <div v-if="!hideHead" class="mshelf__head">
            <component :is="`h${headingLevel}`" :id="`${uid}-title`" class="h3 mshelf__title">{{ title }}</component>
            <Link v-if="href" :href="href" class="mshelf__all" prefetch>{{ linkLabel }}</Link>
        </div>

        <ul class="mshelf__track" :style="style" :aria-label="listLabel ?? title" :tabindex="focusable ? 0 : undefined">
            <slot />
        </ul>
    </component>
</template>

<style scoped>
.mshelf__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-16);
    padding-inline: var(--page-margin);
    margin-bottom: var(--sp-16);
}

.mshelf__title {
    min-width: 0;
}

.mshelf__all {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--c-blue);
    font-size: var(--fs-small);
    font-weight: 500;
    white-space: nowrap;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .mshelf__all:hover {
        text-decoration: underline;
    }
}

.mshelf__track {
    --shelf-w: calc((100% - 2 * var(--gutter)) / 2.2);

    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--shelf-w);
    gap: var(--gutter);
    padding-inline: var(--page-margin);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--page-margin);
    scrollbar-width: none;
}

.mshelf__track::-webkit-scrollbar {
    display: none;
}

.mshelf__track > :deep(*) {
    min-width: 0;
    scroll-snap-align: start;
}

/* The row can rest flush right. */
.mshelf__track > :deep(:last-child) {
    scroll-snap-align: end;
}
</style>
