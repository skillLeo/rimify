<script setup lang="ts">
/**
 * The Felgenrechner's form, as the client's example sets it (his #11; the operator's brief of 29.10.2026, Batch 2): two
 * blocks, „Aktuelle Felge“ and „Neue Felge“, each with Breite, Einpresstiefe and Distanzscheibe — minus, the figure,
 * plus, 44 px a step, and the figure typed directly. The arrow keys step too.
 *
 * A typed figure the form does not offer stays as typed, with a sentence under its field, and the drawing keeps the
 * figure the field had before the typing began — never one on the way (`8` on the way to `81`), never a cleared field,
 * never a silent reset (R-09). The state itself belongs to the page; this only proposes the next one.
 */

import { reactive, useId, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import ValueText from '../Ui/ValueText.vue'
import { NNBSP } from '../../format'
import { ET_SIDES, parseMm, parseWidth, pastRange, RANGES, stepped, type EtField, type EtSide, type EtState } from '../../lib/etRechner'

const props = defineProps<{ modelValue: EtState }>()

const emit = defineEmits<{ 'update:modelValue': [state: EtState] }>()

const uid = useId()

/* `unitSaid`: the unit as a screen reader names it with the field — „mm“ would be read as two letters. */
const FIELDS: { key: EtField; label: string; unit: string; unitSaid: string; mode: 'decimal' | 'numeric'; error: string }[] = [
    { key: 'widthIn', label: 'Breite', unit: 'Zoll', unitSaid: 'Zoll', mode: 'decimal', error: `Gib eine Breite zwischen 4 und 13${NNBSP}Zoll ein, in halben Zoll – zum Beispiel 8,5.` },
    { key: 'etMm', label: 'Einpresstiefe (ET)', unit: 'mm', unitSaid: 'Millimeter', mode: 'numeric', error: `Gib eine Einpresstiefe zwischen −50 und 80${NNBSP}mm ein, in ganzen Millimetern.` },
    // One spacer per wheel: kits are often sold by the axle's figure, which would double the answer.
    {
        key: 'spacerMm',
        label: 'Distanzscheibe je Rad',
        unit: 'mm',
        unitSaid: 'Millimeter',
        mode: 'numeric',
        error: `Gib die Stärke der Distanzscheibe zwischen 0 und 50${NNBSP}mm ein, in ganzen Millimetern. Ohne Distanzscheibe trägst du 0 ein.`,
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

/* The figure a field had when its typing began: what the answers use while the typed one is not right. */
const before = reactive<Record<EtSide, Partial<Record<EtField, number>>>>({ current: {}, next: {} })

/* The field being typed in: its words are the person's, and no answer coming back rewrites them. */
let editing: string | null = null

/*
 * A comparison set from outside (a link, the car chosen later, a step): the fields whose figure changed follow, and
 * their errors go. A field whose figure did not change keeps what was typed in it — a wrong figure and its sentence
 * stay when another stepper is pressed.
 */
watch(
    () => props.modelValue,
    (state, old) => {
        const next = textsOf(state)

        for (const side of ['current', 'next'] as const) {
            for (const field of ['widthIn', 'etMm', 'spacerMm'] as const) {
                if (`${side}.${field}` === editing || old?.[side][field] === state[side][field]) {
                    continue
                }

                texts[side][field] = next[side][field]
                errors[side][field] = false
            }
        }
    },
    { deep: true }
)

function parse(field: EtField, text: string): number | null {
    return field === 'widthIn' ? parseWidth(text) : parseMm(field, text)
}

function propose(side: EtSide, field: EtField, value: number): void {
    if (props.modelValue[side][field] !== value) {
        emit('update:modelValue', { ...props.modelValue, [side]: { ...props.modelValue[side], [field]: value } })
    }
}

function onFocus(side: EtSide, field: EtField): void {
    editing = `${side}.${field}`

    if (parse(field, texts[side][field]) !== null) {
        before[side][field] = props.modelValue[side][field]
    }
}

/*
 * A figure that is right is the answer's at once. One that is not puts the answer back on the figure before the typing
 * — never on one on the way — and is said at once where no further key can make it right (`81` for an ET), else on
 * leaving the field: a half-typed „8,“ is not an error yet.
 */
function onInput(side: EtSide, field: EtField, event: Event): void {
    const text = (event.target as HTMLInputElement).value
    texts[side][field] = text
    editing = `${side}.${field}`
    const value = parse(field, text)

    if (value !== null) {
        errors[side][field] = false
        propose(side, field, value)

        return
    }

    errors[side][field] = pastRange(field, text)
    propose(side, field, before[side][field] ?? props.modelValue[side][field])
}

function onBlur(side: EtSide, field: EtField): void {
    editing = null
    errors[side][field] = parse(field, texts[side][field]) === null
}

function atEnd(side: EtSide, field: EtField, direction: 1 | -1): boolean {
    const value = props.modelValue[side][field]

    return direction === 1 ? value >= RANGES[field].max : value <= RANGES[field].min
}

/* At an end of its range a stepper does nothing — and keeps the focus, which a disabled button would drop to the page. */
function step(side: EtSide, field: EtField, direction: 1 | -1): void {
    if (atEnd(side, field, direction)) {
        return
    }

    const value = stepped(field, props.modelValue[side][field], direction)
    texts[side][field] = shown(field, value)
    errors[side][field] = false
    before[side][field] = value
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
                                :aria-disabled="atEnd(block.key, field.key, -1) ? 'true' : undefined"
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
                                :aria-describedby="errors[block.key][field.key] ? `${fid(block.key, field.key)}-unit ${fid(block.key, field.key)}-error` : `${fid(block.key, field.key)}-unit`"
                                @focus="onFocus(block.key, field.key)"
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
                                :aria-disabled="atEnd(block.key, field.key, 1) ? 'true' : undefined"
                                @click="step(block.key, field.key, 1)"
                            >
                                <Icon name="plus" :size="20" />
                            </button>
                        </div>
                        <span class="etc__unit" aria-hidden="true">{{ field.unit }}</span>
                        <span :id="`${fid(block.key, field.key)}-unit`" class="visually-hidden">{{ field.unitSaid }}</span>
                    </div>
                    <p v-if="errors[block.key][field.key]" :id="`${fid(block.key, field.key)}-error`" class="form-field__error etc__error" role="alert">
                        <!-- One sentence: the paragraph is a flex box (form-field__error), and ValueText's pieces were its columns. -->
                        <span><ValueText :text="field.error" /></span>
                    </p>
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

/* One column for the three labels, as wide as the longest, so the three steppers stand under each other. The second
   column is flexible: a sentence under a field spans both, and a spanning item that crosses a flexible track never
   widens the label column — with `auto` it did, and pushed the steppers out of the block (interaction QA, 30.10.2026). */
.etc__fields {
    display: grid;
    clear: both;
    grid-template-columns: max-content minmax(0, 1fr);
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
    .etc__step:hover:not([aria-disabled='true']) {
        background: var(--c-band);
    }
}

.etc__step:active:not([aria-disabled='true']) {
    background: var(--c-line);
}

.etc__step:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: -2px;
}

/* At an end of its range: shown as not pressable (DIRECTION §6), and still in the tab order. */
.etc__step[aria-disabled='true'] {
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
