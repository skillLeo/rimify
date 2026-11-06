<script setup lang="ts">
/**
 * A tyre's picture in the sketches: a flat outline of a tyre, drawn in the ink of the page and captioned „Beispielbild" —
 * never a photograph of a different tyre, which would show the customer something they are not buying (the brief §9).
 * The day the client's photographs arrive, the real pages show them instead.
 */

import { computed } from 'vue'

const props = withDefaults(defineProps<{ size?: string; px?: number; caption?: string }>(), { size: '', px: 160, caption: 'Beispielbild' })

/* The tread: short marks round the outer edge, every 10°. */
const tread = computed(() =>
    Array.from({ length: 36 }, (_, i) => {
        const a = (i * Math.PI) / 18

        return { x1: 60 + 50 * Math.cos(a), y1: 60 + 50 * Math.sin(a), x2: 60 + 56 * Math.cos(a), y2: 60 + 56 * Math.sin(a) }
    }),
)

const label = computed(() => (props.size ? `${props.caption} · ${props.size}` : props.caption))
</script>

<template>
    <figure class="sk-tyrepic">
        <svg class="sk-tyrepic__art" viewBox="0 0 120 120" :style="{ maxWidth: `${px}px` }" aria-hidden="true" focusable="false">
            <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="1.5" />
            <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" stroke-width="1.5" />
            <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" stroke-width="1" />
            <circle cx="60" cy="60" r="6" fill="none" stroke="currentColor" stroke-width="1" />
            <line v-for="(mark, i) in tread" :key="i" :x1="mark.x1" :y1="mark.y1" :x2="mark.x2" :y2="mark.y2" stroke="currentColor" stroke-width="1" />
        </svg>
        <figcaption v-if="caption" class="sk-tyrepic__caption">{{ label }}</figcaption>
    </figure>
</template>

<style scoped>
.sk-tyrepic {
    display: grid;
    gap: var(--sp-8);
    justify-items: center;
    margin: 0;
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
    color: var(--c-ink-3);
}

.sk-tyrepic__art {
    display: block;
    width: 100%;
    height: auto;
}

.sk-tyrepic__caption {
    color: var(--c-ink-2);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
}
</style>
