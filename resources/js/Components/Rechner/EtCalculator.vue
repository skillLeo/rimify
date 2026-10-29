<script setup lang="ts">
/**
 * The Felgenrechner's form, as the client's example sets it (his #11; the operator's brief of 29.10.2026, Batch 2): two
 * blocks, „Aktuelle Felge“ and „Neue Felge“, each with Breite, Einpresstiefe and Distanzscheibe — minus, the figure,
 * plus, 44 px a step, and the figure typed directly. The arrow keys step too.
 *
 * A typed figure the form does not offer stays as typed, with a sentence under its field, and the drawing keeps the
 * last figure that was right — never a cleared field, never a silent reset (R-09). The state itself belongs to the
 * page; this only proposes the next one.
 */

import { reactive, useId, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import ValueText from '../Ui/ValueText.vue'
import { NNBSP } from '../../format'
import { ET_SIDES, parseMm, parseWidth, RANGES, stepped, type EtField, type EtSide, type EtState } from '../../lib/etRechner'

const props = defineProps<{ modelValue: EtState }>()

const emit = defineEmits<{ 'update:modelValue': [state: EtState] }>()

const uid = useId()

const FIELDS: { key: EtField; label: string; unit: string; mode: 'decimal' | 'numeric'; error: string }[] = [
    { key: 'widthIn', label: 'Breite', unit: 'Zoll', mode: 'decimal', error: `Die Breite liegt zwischen 4 und 13${NNBSP}Zoll, in halben Zoll – zum Beispiel 8,5.` },
    { key: 'etMm', label: 'Einpresstiefe (ET)', unit: 'mm', mode: 'numeric', error: `Die Einpresstiefe liegt zwischen −50 und 80${NNBSP}mm, in ganzen Millimetern.` },
    // One spacer per wheel: kits are often sold by the axle's figure, which would double the answer.
    {
        key: 'spacerMm',
        label: 'Distanzscheibe je Rad',
        unit: 'mm',
        mode: 'numeric',
        error: `Die Stärke der Distanzscheibe liegt zwischen 0 und 50${NNBSP}mm, in ganzen Millimetern. Ohne Distanzscheibe trägst du 0 ein.`,
    },
]

/** A figure as the field shows it: `8,5`, `−10`. */
function shown(field: EtField, value: number): string {
    return field === 'widthIn' ? String(value).replace('.', ',') : String(value).replace('-', '−')
}

function textsOf(state: EtState): Record<EtSide, Record<EtField, string>> {
    const of = (side: EtSide): Record<EtField, string> => ({
        widthIn: shown('widthIn', state[side].widthIn),
        etMm: shown('etMm', state[side].etMm),
        spacerMm: shown('spacerMm', state[side].spacerMm),
    })

    return { current: of('current'), next: of('next') }
}

const texts = reactive(textsOf(props.modelValue))
const errors = reactive<Record<EtSide, Partial<Record<EtField, boolean>>>>({ current: {}, next: {} })

/* A comparison set from outside (a link, the car chosen later, a step): the fields follow, and their errors go. */
watch(
    () => props.modelValue,
    (state) => {
        const next = textsOf(state)

        for (const side of ['current', 'next'] as const) {
            for (const field of ['widthIn', 'etMm', 'spacerMm'] as const) {
                const parsed = parse(field, texts[side][field])

                if (parsed !== state[side][field]) {
                    texts[side][field] = next[side][field]
                    errors[side][field] = false
                }
            }
        }
    },
    { deep: true }
)

function parse(field: EtField, text: string): number | null {
    return field === 'widthIn' ? parseWidth(text) : parseMm(field, text)
}

function propose(side: EtSide, field: EtField, value: number): void {
    emit('update:modelValue', { ...props.modelValue, [side]: { ...props.modelValue[side], [field]: value } })
}

function onInput(side: EtSide, field: EtField, event: Event): void {
    const text = (event.target as HTMLInputElement).value
    texts[side][field] = text
    const value = parse(field, text)

    if (value !== null) {
        errors[side][field] = false
        propose(side, field, value)
    }
}

/* Leaving a field: what does not parse is said under it — while typing, a half-typed „8,“ is not an error yet. */
function onBlur(side: EtSide, field: EtField): void {
    errors[side][field] = parse(field, texts[side][field]) === null
}

function step(side: EtSide, field: EtField, direction: 1 | -1): void {
    const value = stepped(field, props.modelValue[side][field], direction)
    texts[side][field] = shown(field, value)
    errors[side][field] = false
    propose(side, field, value)
}

const fid = (side: EtSide, field: EtField): string => `${uid}-${side}-${field}`
</script>

<template>
    <div class="etc">
        <fieldset v-for="block in ET_SIDES" :key="block.key" class="etc__block" :class="`etc__block--${block.key}`">
            <!-- The block's head in the drawing's colour, as his example heads its two panels. -->
            <legend class="etc__title">{{ block.title }}</legend>

            <div class="etc__fields">
                <div v-for="field in FIELDS" :key="field.key" class="etc__field">
                    <label class="etc__label" :for="fid(block.key, field.key)">{{ field.label }}</label>
                    <div class="etc__row" translate="no">
                        <div class="etc__stepper">
                            <button
                                class="etc__step"
                                type="button"
                                :aria-label="`${field.label} verringern`"
                                :aria-controls="fid(block.key, field.key)"
                                :disabled="modelValue[block.key][field.key] <= RANGES[field.key].min"
                                @click="step(block.key, field.key, -1)"
                            >
                                <Icon name="minus" :size="20" />
                            </button>
                            <input
                                :id="fid(block.key, field.key)"
                                class="etc__input tabular"
                                type="text"
                                :inputmode="field.mode"
                                autocomplete="off"
                                spellcheck="false"
                                :value="texts[block.key][field.key]"
                                :aria-invalid="errors[block.key][field.key] ? 'true' : undefined"
                                :aria-describedby="errors[block.key][field.key] ? `${fid(block.key, field.key)}-error` : undefined"
                                @input="onInput(block.key, field.key, $event)"
                                @blur="onBlur(block.key, field.key)"
                                @keydown.up.prevent="step(block.key, field.key, 1)"
                                @keydown.down.prevent="step(block.key, field.key, -1)"
                            >
                            <button
                                class="etc__step"
                                type="button"
                                :aria-label="`${field.label} erhöhen`"
                                :aria-controls="fid(block.key, field.key)"
                                :disabled="modelValue[block.key][field.key] >= RANGES[field.key].max"
                                @click="step(block.key, field.key, 1)"
                            >
                                <Icon name="plus" :size="20" />
                            </button>
                        </div>
                        <span class="etc__unit" aria-hidden="true">{{ field.unit }}</span>
                    </div>
                    <p v-if="errors[block.key][field.key]" :id="`${fid(block.key, field.key)}-error`" class="form-field__error etc__error" role="alert"><ValueText :text="field.error" /></p>
                </div>
            </div>
        </fieldset>
    </div>
</template>

<style scoped>
.etc {
    display: grid;
    gap: var(--sp-16);
}

/* A block as his example's panels: a head band, then the rows on the band's tone — no border, no frame around a frame. */
.etc__block {
    min-width: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: var(--r-tile);
    background: var(--c-band);
    container-type: inline-size;
}

/* The head in the drawing's colour: gray for the rim on the car, blue for the new one (D-357). */
.etc__title {
    float: left;
    width: 100%;
    margin: 0;
    padding: var(--sp-12) var(--sp-20);
    font-size: var(--fs-h4);
    font-weight: 600;
}

.etc__block--current .etc__title {
    background: var(--c-line-2);
    color: var(--c-ink);
}

.etc__block--next .etc__title {
    background: var(--c-blue);
    color: var(--c-surface);
}

/* One column for the three labels, as wide as the longest, so the three steppers stand under each other. */
.etc__fields {
    display: grid;
    clear: both;
    grid-template-columns: max-content auto;
    align-items: center;
    gap: var(--sp-12) var(--sp-20);
    padding: var(--sp-16) var(--sp-20) var(--sp-20);
}

.etc__field {
    display: contents;
}

.etc__label {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.etc__row {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
}

.etc__stepper {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.etc__step {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--c-ink);
    cursor: pointer;
    transition: background-color var(--d-1) var(--ease-std);
}

@media (hover: hover) and (pointer: fine) {
    .etc__step:hover:not(:disabled) {
        background: var(--c-band);
    }
}

.etc__step:active:not(:disabled) {
    background: var(--c-line);
}

.etc__step:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

/* At an end of its range: shown as not pressable (DIRECTION §6). */
.etc__step:disabled {
    background: var(--c-band);
    color: var(--c-ink-3);
    cursor: not-allowed;
}

.etc__input {
    width: 4.5em;
    min-width: 0;
    padding: 0 var(--sp-4);
    border: 0;
    border-inline: 1px solid var(--c-line);
    background: transparent;
    color: var(--c-ink);
    font: inherit;
    font-weight: 600;
    text-align: center;
}

.etc__input:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

.etc__input[aria-invalid='true'] {
    background: var(--c-bad-tint);
}

.etc__unit {
    min-width: 2.5em;
    color: var(--c-ink-3);
    font-size: var(--fs-small);
}

.etc__error {
    grid-column: 1 / -1;
    margin: 0;
}

/* A narrow block (a phone): each label over its stepper, so „Distanzscheibe je Rad“ is never broken in two. */
@container (max-width: 400px) {
    .etc__fields {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--sp-4);
    }

    .etc__field + .etc__field .etc__label {
        margin-top: var(--sp-12);
    }
}
</style>
