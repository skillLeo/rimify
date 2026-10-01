<script setup lang="ts">
/**
 * How many, beside a price (#17): minus, the number, plus — 44 px a step on every screen (DIRECTION §6), the number in
 * a live region so a screen reader hears the change. The bounds are the page's: the amounts the server priced
 * (LinePrice, D-102) and the stock, so the stepper never offers a number nobody can buy, and never computes a price.
 */

import { useId } from 'vue'
import Icon from '../Ui/Icon.vue'

const props = defineProps<{
    modelValue: number
    min: number
    max: number
    /** The visible name, `Anzahl`; the buttons are named after it. */
    label: string
    disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const uid = useId()

function step(by: number): void {
    const next = Math.min(props.max, Math.max(props.min, props.modelValue + by))

    if (next !== props.modelValue) {
        emit('update:modelValue', next)
    }
}
</script>

<template>
    <div class="amt">
        <span :id="`${uid}-label`" class="amt__label">{{ label }}</span>
        <div class="amt__stepper" role="group" :aria-labelledby="`${uid}-label`">
            <button
                class="amt__step"
                type="button"
                :aria-label="`${label} verringern`"
                :disabled="disabled || modelValue <= min"
                @click="step(-1)"
            >
                <Icon name="minus" :size="20" />
            </button>
            <output class="amt__n tabular" aria-live="polite">{{ modelValue }}</output>
            <button
                class="amt__step"
                type="button"
                :aria-label="`${label} erhöhen`"
                :disabled="disabled || modelValue >= max"
                @click="step(1)"
            >
                <Icon name="plus" :size="20" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.amt {
    display: grid;
    gap: var(--space-1);
    justify-items: start;
}

.amt__label {
    color: var(--ink2);
    font-size: var(--text-small);
}

.amt__stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
}

.amt__step {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
    transition: background-color var(--duration-instant) var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
    .amt__step:hover:not(:disabled) {
        background: var(--band);
    }
}

.amt__step:disabled {
    color: var(--ink3);
    cursor: not-allowed;
}

.amt__n {
    min-width: 3ch;
    font-family: var(--mono);
    font-weight: 500;
    text-align: center;
}
</style>
