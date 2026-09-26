<script setup lang="ts">
/**
 * What changes, place by place, with the words before and after — shown before publishing and
 * before loading an old version (BRIEF-2 §1, "a field-level diff"). The old words are struck and
 * quiet, the new ones plain; a place that is new or gone shows only the side it has. A long legal
 * text scrolls inside its own box rather than pushing the dialog's buttons off the screen.
 */

import type { Change } from './content'

defineProps<{ changes: Change[] }>()
</script>

<template>
    <ul class="pg-diff">
        <li v-for="(change, index) in changes" :key="`${index}-${change.label}`" class="pg-diff__item">
            <p class="pg-diff__label">{{ change.label }}</p>
            <!-- Focusable, so a long text scrolls from the keyboard too. -->
            <div class="pg-diff__words" role="group" tabindex="0" :aria-label="`Änderung: ${change.label}`">
                <del v-if="change.before" class="pg-diff__before"><span class="visually-hidden">Bisher: </span>{{ change.before }}</del>
                <ins v-if="change.after" class="pg-diff__after"><span class="visually-hidden">Neu: </span>{{ change.after }}</ins>
                <p v-if="!change.after" class="pg-diff__gone">Entfällt.</p>
            </div>
        </li>
    </ul>
</template>

<style scoped>
.pg-diff {
    display: grid;
    gap: var(--sp-16);
}

.pg-diff__item {
    display: grid;
    gap: var(--sp-4);
}

.pg-diff__label {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink-2);
}

.pg-diff__words {
    display: grid;
    gap: var(--sp-4);
    max-height: calc(2 * var(--sp-128));
    overflow-y: auto;
    padding-left: var(--sp-12);
    border-left: 2px solid var(--c-line);
}

.pg-diff__before,
.pg-diff__after {
    white-space: pre-line;
    overflow-wrap: anywhere;
}

.pg-diff__before {
    color: var(--c-ink-3);
    text-decoration: line-through;
    text-decoration-color: var(--c-ink-3);
}

.pg-diff__after {
    color: var(--c-ink);
    text-decoration: none;
}

.pg-diff__gone {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
}
</style>
