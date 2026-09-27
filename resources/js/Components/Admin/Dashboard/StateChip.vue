<script setup lang="ts">
/**
 * A state in the Übersicht's tables, by the list rule: an ordinary state is plain text („bezahlt“,
 * „versandt“), and only an exception wears a chip with a dot, in the status palette (`warn`, `bad`) —
 * never a verdict's chart colour; the word carries the meaning, the dot only repeats it. A column of
 * chips on every row says nothing; one chip among plain words is read. Nothing to say (tone `none`:
 * „noch nicht versandt“, „entfällt“) is quiet text.
 */

defineProps<{ label: string; tone: 'plain' | 'warn' | 'bad' | 'neutral' | 'none' }>()
</script>

<template>
    <span v-if="label === '–'" class="chip-none"><span aria-hidden="true">–</span><span class="visually-hidden">nichts zu tun</span></span>
    <span v-else-if="tone === 'warn' || tone === 'bad'" class="chip" :class="`chip--${tone}`">
        <span class="chip__dot" aria-hidden="true" />
        {{ label }}
    </span>
    <span v-else :class="tone === 'plain' ? 'chip-plain' : 'chip-none'">{{ label }}</span>
</template>

<style scoped>
.chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    height: 22px;
    padding-inline: var(--sp-8);
    border-radius: var(--r-round);
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

.chip-plain {
    color: var(--c-ink);
}

.chip-none {
    color: var(--c-ink-3);
}
</style>
