<script setup lang="ts">
/**
 * One field of a page, drawn from its schema: the label, the right control, the counter, the help
 * line and the error. The counter reads the same limit the publish check enforces, so a text that
 * turns red here is exactly a text the server will refuse — never a guess (BRIEF-2 §1).
 *
 * The counter is quiet until it matters: always on for short fields, where every character counts,
 * and on a long text only once it passes nine tenths of the limit.
 */

import { computed } from 'vue'
import Icon from '../../../Components/Ui/Icon.vue'
import { isIconName } from '../../../icons'
import { formatNumber } from '../../../lib/num'
import type { SchemaField } from '../../../types/admin/seiten'
import { length, overLimit } from './content'

const props = withDefaults(
    defineProps<{
        field: SchemaField
        id: string
        error?: string
        readonly?: boolean
    }>(),
    { error: '', readonly: false }
)

const model = defineModel<string | number | null>({ required: true })

const count = computed(() => length(model.value))
const over = computed(() => overLimit(props.field, model.value))

const showCounter = computed(() => {
    const max = props.field.max

    if (max === null || props.field.kind === 'number' || props.field.kind === 'icon' || props.field.kind === 'choice') {
        return false
    }

    return max <= 300 || count.value >= max * 0.9
})

const counterText = computed(() => {
    const max = props.field.max ?? 0

    return `${formatNumber(count.value)} / ${formatNumber(max)}`
})

/* A long text gets the room it needs, up to a screenful; the rest scrolls inside the field. */
const rows = computed(() => {
    const text = typeof model.value === 'string' ? model.value : ''
    const lines = text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 72)), 0)

    return Math.min(20, Math.max(props.field.max !== null && props.field.max <= 250 ? 2 : 4, lines))
})

const describedBy = computed(() =>
    [props.field.help ? `${props.id}-help` : null, `${props.id}-err`, showCounter.value ? `${props.id}-count` : null]
        .filter(Boolean)
        .join(' ')
)

/* A reading time is a whole number; anything else is kept as typed so the check can name it. */
function onNumber(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim()

    model.value = /^\d{1,6}$/.test(raw) ? Number(raw) : raw
}

const iconName = computed(() => (typeof model.value === 'string' && isIconName(model.value) ? model.value : null))
</script>

<template>
    <div class="form-field pg-field">
        <div class="pg-field__top">
            <label class="form-field__label" :for="id">
                {{ field.label }}<span v-if="!field.required" class="pg-field__optional"> (optional)</span>
            </label>
            <span
                v-if="showCounter"
                :id="`${id}-count`"
                class="pg-field__count"
                :class="{ 'pg-field__count--over': over }"
                :aria-label="`${count} von höchstens ${field.max} Zeichen`"
            >
                {{ counterText }}
            </span>
        </div>

        <!-- A text, or the HTML-Abschnitt's markup (D-352): taller, never spell-checked or corrected. -->
        <textarea
            v-if="field.kind === 'textarea' || field.kind === 'html'"
            :id="id"
            v-model="model"
            class="input pg-field__area"
            :class="{ 'pg-field__area--code': field.kind === 'html' }"
            :rows="field.kind === 'html' ? Math.max(8, rows) : rows"
            :spellcheck="field.kind === 'html' ? 'false' : undefined"
            :autocapitalize="field.kind === 'html' ? 'off' : undefined"
            :readonly="readonly"
            :aria-required="field.required ? 'true' : undefined"
            :aria-invalid="error || over ? 'true' : undefined"
            :aria-describedby="describedBy"
        />

        <!-- One of a fixed set, by name (the Einstieg's photograph). -->
        <select
            v-else-if="field.kind === 'choice'"
            :id="id"
            v-model="model"
            class="input pg-field__choice"
            :disabled="readonly"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="describedBy"
        >
            <option v-for="option in field.options ?? []" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>

        <div v-else-if="field.kind === 'icon'" class="pg-field__icon">
            <span class="pg-field__glyph" aria-hidden="true">
                <Icon v-if="iconName" :name="iconName" :size="20" />
            </span>
            <select
                :id="id"
                v-model="model"
                class="input"
                :disabled="readonly"
                :aria-invalid="error ? 'true' : undefined"
                :aria-describedby="describedBy"
            >
                <option v-for="option in field.options ?? []" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
        </div>

        <input
            v-else-if="field.kind === 'number'"
            :id="id"
            class="input pg-field__number"
            type="text"
            inputmode="numeric"
            :value="model ?? ''"
            :readonly="readonly"
            :aria-required="field.required ? 'true' : undefined"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="describedBy"
            @input="onNumber"
        >

        <input
            v-else
            :id="id"
            v-model="model"
            class="input"
            type="text"
            :readonly="readonly"
            :aria-required="field.required ? 'true' : undefined"
            :aria-invalid="error || over ? 'true' : undefined"
            :aria-describedby="describedBy"
        >

        <p v-if="field.help" :id="`${id}-help`" class="form-field__help">{{ field.help }}</p>
        <p :id="`${id}-err`" class="form-field__error">{{ error }}</p>
    </div>
</template>

<style scoped>
.pg-field__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-12);
}

.pg-field__optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.pg-field__count {
    flex: none;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
}

.pg-field__count--over {
    color: var(--c-bad);
    font-weight: 500;
}

.pg-field__area {
    min-height: 0;
}

/* Markup reads in the panel's code face (tokens.css: --mono), its indents kept. */
.pg-field__area--code {
    font-family: var(--mono);
    tab-size: 4;
}

.pg-field__number {
    max-width: 12ch;
}

.pg-field__choice {
    max-width: 48ch;
}

.pg-field__icon {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
}

.pg-field__icon > .input {
    flex: 0 1 24ch;
    min-width: 0;
}

.pg-field__glyph {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--sp-24);
    color: var(--c-ink-2);
}

.pg-field .form-field__error:empty {
    display: none;
}
</style>
