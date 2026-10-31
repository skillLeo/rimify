<script setup lang="ts">
/**
 * The steps of a sketched flow, in one order that never changes (the Gutachten rework brief §7): done steps are ticked and
 * lead back, the current one is marked, the next one opens once everything before it has been seen. The admin's five
 * Gutachten steps and the shop's Komplettrad steps wear the same bar, so the two read as one product (§9).
 */

defineProps<{
    steps: string[]
    /** The step on screen, from 0. */
    current: number
    /** The furthest step that may be opened. */
    reached: number
    /** What the bar is, for a screen reader: „Schritte zum Gutachten". */
    label: string
}>()

const emit = defineEmits<{ go: [index: number] }>()
</script>

<template>
    <nav class="sk-steps" :aria-label="label">
        <ol class="sk-steps__list">
            <li
                v-for="(step, index) in steps"
                :key="step"
                class="sk-steps__item"
                :class="{ 'sk-steps__item--done': index < current, 'sk-steps__item--current': index === current }"
            >
                <button
                    type="button"
                    class="sk-steps__button"
                    :disabled="index > reached"
                    :aria-current="index === current ? 'step' : undefined"
                    @click="emit('go', index)"
                >
                    <span class="sk-steps__n" aria-hidden="true">
                        <svg v-if="index < current" viewBox="0 0 16 16" width="14" height="14" focusable="false">
                            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <template v-else>{{ index + 1 }}</template>
                    </span>
                    <span class="sk-steps__label">{{ step }}</span>
                    <span v-if="index < current" class="visually-hidden">(erledigt)</span>
                </button>
            </li>
        </ol>
    </nav>
</template>

<style scoped>
.sk-steps__list {
    display: flex;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: none;
}

.sk-steps__item {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
}

.sk-steps__button {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--sp-8);
    min-width: 0;
    min-height: 44px;
    padding: var(--sp-8) var(--sp-12);
    border: 0;
    border-bottom: 2px solid var(--c-line);
    background: transparent;
    color: var(--c-ink-3);
    font: inherit;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    text-align: left;
    cursor: pointer;
}

.sk-steps__button:disabled {
    cursor: default;
}

.sk-steps__button:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.sk-steps__n {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-round);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
}

.sk-steps__label {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sk-steps__item--done .sk-steps__button {
    border-bottom-color: var(--c-ink-3);
    color: var(--c-ink-2);
}

.sk-steps__item--done .sk-steps__n {
    border-color: var(--c-ink);
    background: var(--c-ink);
    color: var(--c-surface);
}

.sk-steps__item--current .sk-steps__button {
    border-bottom-color: var(--c-blue);
    color: var(--c-ink);
}

.sk-steps__item--current .sk-steps__n {
    border-color: var(--c-blue);
    background: var(--c-blue);
    color: var(--c-surface);
}

@media (hover: hover) and (pointer: fine) {
    .sk-steps__button:not(:disabled):hover {
        color: var(--c-ink);
    }
}

/* On a phone only the current step shows its name; the others keep theirs for a screen reader, so each button is
   still called by its step, never by a bare number. */
@media (max-width: 599px) {
    .sk-steps__item:not(.sk-steps__item--current) .sk-steps__label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    .sk-steps__item--current {
        flex: 3 1 0;
    }
}
</style>
