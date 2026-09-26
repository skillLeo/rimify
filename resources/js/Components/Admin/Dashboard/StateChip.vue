<script setup lang="ts">
/**
 * A state as a text chip with a dot (the Übersicht's tables): the word carries the meaning, the dot
 * only repeats it in colour — never the other way round. `–` (nothing to say) is written as a dash,
 * not as a chip.
 */

defineProps<{ label: string; tone: 'plain' | 'warn' | 'bad' | 'neutral' }>()
</script>

<template>
    <span v-if="label === '–'" class="chip-none" aria-label="nichts zu tun">–</span>
    <span v-else class="chip" :class="`chip--${tone}`">
        <span class="chip__dot" aria-hidden="true" />
        {{ label }}
    </span>
</template>

<style scoped>
.chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 22px;
    padding-inline: var(--sp-8);
    border-radius: var(--r-round);
    background: var(--c-band);
    color: var(--c-ink);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
    white-space: nowrap;
}

.chip__dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-round);
    background: var(--c-ok);
}

.chip--warn {
    background: var(--c-warn-tint);
}

.chip--warn .chip__dot {
    background: var(--c-warn);
}

.chip--bad {
    background: var(--c-bad-tint);
    color: var(--c-bad);
}

.chip--bad .chip__dot {
    background: var(--c-bad);
}

.chip--neutral .chip__dot {
    background: var(--c-ink-3);
}

.chip-none {
    color: var(--c-ink-3);
}
</style>
