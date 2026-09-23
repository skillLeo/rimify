<script setup lang="ts">
/**
 * The site-wide *Demodaten* badge (docs/phase0/ACCURACY.md D4).
 *
 * While any published wheel model is a demonstration row, the server shares `demoBadge` and every
 * header carries this badge: the desktop utility strip, the phone header row and the phone app
 * bar. It is decided on the server and in the first frame (R-08), so it never appears a beat late.
 *
 * It is small, it sits in the flow of its row and it never shrinks the row's controls: it takes
 * only the width of its word, and where a title shares the row the title gives way first.
 */

import { computed } from 'vue'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const demo = computed(() => shared.value.demoBadge === true)
</script>

<template>
    <span v-if="demo" class="demo-badge" title="Der Shop zeigt Beispieldaten.">Demodaten</span>
</template>

<style scoped>
.demo-badge {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding-inline: var(--sp-8);
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink-2);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 600;
    white-space: nowrap;
}
</style>
