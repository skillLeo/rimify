<script setup lang="ts">
/**
 * The Felgenrechner's form: two setups, Aktuell and Neu, five figures each. It owns nothing but
 * the controls — the state lives in `useRechner`, the arithmetic in `lib/fitmentMath`, the
 * drawing and the results in their own components — and it hands a comparison up only when every
 * figure is one it offers itself. An ET outside −30 … 70 is explained under its field and never
 * computed with: the parent keeps the last valid comparison and shows a dash meanwhile.
 *
 * Three layouts, one component, chosen by the surface:
 * - `row` (the homepage teaser, desktop): two fieldsets side by side, five fields in a row each;
 * - `table` (/felgenrechner, desktop): the compact table — the label at the left, the two
 *   controls beside it, five rows;
 * - `tabs` (both phone documents): Aktuell · Neu as tabs, the five fields two abreast.
 *
 * Every control is at least 16 px (`.input`), has a visible label or a row-and-column name, and
 * validates on blur.
 */

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, reactive, ref, useId, watch } from 'vue'
import { withUnit } from '../../format'
import type { WheelSetup } from '../../lib/fitmentMath'
import {
    cloneState,
    ET_MAX,
    ET_MIN,
    isEt,
    isSetup,
    jLabel,
    OPTIONS,
    sameState,
    SIDES,
    type Field,
    type RechnerState,
    type SelectField,
    type Side,
} from '../../lib/rechner'

export type CalculatorLayout = 'row' | 'table' | 'tabs'

const props = withDefaults(
    defineProps<{
        modelValue: RechnerState
        layout?: CalculatorLayout
        /** True while *Aktuell* is the vehicle's own size; its controls then carry `data-prefilled`. */
        prefilled?: boolean
    }>(),
    { layout: 'row', prefilled: false }
)

const emit = defineEmits<{
    'update:modelValue': [state: RechnerState]
    'update:valid': [valid: boolean]
}>()

/* ── The fields ───────────────────────────────────────────────────────────────── */

interface FieldDef {
    key: Field
    /** The short label for the teaser's 117 px fields, the full one where there is room. */
    short: string
    long: string
    option: (v: number) => string
}

/* Selects carry their unit in the option text (the chevron owns the right edge); the ET field carries a suffix. */
const FIELDS: FieldDef[] = [
    { key: 'widthIn', short: 'Breite', long: 'Felgenbreite', option: jLabel },
    { key: 'diameterIn', short: 'Durchmesser', long: 'Durchmesser', option: (v) => withUnit(v, 'Zoll') },
    { key: 'etMm', short: 'ET', long: 'Einpresstiefe (ET)', option: String },
    { key: 'tyreWidthMm', short: 'Reifenbreite', long: 'Reifenbreite', option: (v) => withUnit(v, 'mm') },
    { key: 'aspect', short: 'Querschnitt', long: 'Querschnitt', option: (v) => withUnit(v, '%') },
]

const label = (field: FieldDef): string => (props.layout === 'row' ? field.short : field.long)

const ET_ERROR = `Die Einpresstiefe liegt zwischen ${ET_MIN.toString().replace('-', '−')} und ${ET_MAX}${' '}mm.`
const SELECT_ERROR = 'Bitte einen Wert aus der Liste wählen.'

/* ── State: what the controls hold, and what has been committed upward ─────────── */

const local = reactive<RechnerState>(cloneState(props.modelValue))

/* What is typed into the ET fields; the committed number lives in `local`. */
const etText = reactive<Record<Side, string>>({
    current: String(local.current.etMm),
    next: String(local.next.etMm),
})

const errors = reactive<Record<Side, Partial<Record<Field, string>>>>({ current: {}, next: {} })

function parseEt(text: string): number | null {
    const t = text.trim().replace('−', '-')

    if (!/^-?\d{1,2}$/.test(t)) {
        return null
    }

    const n = Number(t)

    return isEt(n) ? n : null
}

const valid = computed(
    () => isSetup(local.current) && isSetup(local.next) && parseEt(etText.current) !== null && parseEt(etText.next) !== null
)

/* A comparison applied from outside (a shared link, a vehicle chosen later): the controls follow, errors clear. */
watch(
    () => props.modelValue,
    (next) => {
        if (sameState(next, local)) {
            return
        }

        Object.assign(local.current, next.current)
        Object.assign(local.next, next.next)
        etText.current = String(next.current.etMm)
        etText.next = String(next.next.etMm)
        errors.current = {}
        errors.next = {}
        emit('update:valid', true)
    },
    { deep: true }
)

function commit(): void {
    emit('update:valid', valid.value)

    if (valid.value) {
        emit('update:modelValue', cloneState(local))
    }
}

function onSelect(side: Side, field: SelectField): void {
    errors[side][field] = OPTIONS[field].includes(local[side][field]) ? undefined : SELECT_ERROR
    commit()
}

function onEtChange(side: Side, event: Event): void {
    const text = (event.target as HTMLInputElement).value
    etText[side] = text
    const n = parseEt(text)

    if (n !== null) {
        local[side].etMm = n
    }

    errors[side].etMm = n === null ? ET_ERROR : undefined
    commit()
}

function validateEt(side: Side): void {
    errors[side].etMm = parseEt(etText[side]) === null ? ET_ERROR : undefined
}

function isInvalid(side: Side, field: Field): 'true' | undefined {
    return errors[side][field] ? 'true' : undefined
}

function prefilledAttr(side: Side): 'true' | undefined {
    return props.prefilled && side === 'current' ? 'true' : undefined
}

/* ── Ids: one per control, stable across server and client ───────────────────── */

const uid = useId()

function fid(side: Side, field: Field): string {
    return `${uid}-${side}-${field}`
}

function eid(side: Side, field: Field): string {
    return `${fid(side, field)}-error`
}

/** The table's row labels and column heads, referenced by every control's `aria-labelledby`. */
function rid(field: Field): string {
    return `${uid}-row-${field}`
}

function hid(side: Side): string {
    return `${uid}-head-${side}`
}

const tab = ref<Side>('current')

const setup = (side: Side): WheelSetup => local[side]
</script>

<template>
    <form class="calc-form" :class="`calc-form--${layout}`" novalidate @submit.prevent>
        <!-- Desktop, the full page: a compact table of controls — the label at the left, Aktuell and Neu beside it. -->
        <div v-if="layout === 'table'" class="calc-form__table" role="group" aria-label="Aktuelle und neue Größe">
            <span class="calc-form__corner" aria-hidden="true" />
            <span v-for="side in SIDES" :id="hid(side.key)" :key="side.key" class="label calc-form__head">{{ side.label }}</span>

            <template v-for="field in FIELDS" :key="field.key">
                <span :id="rid(field.key)" class="label calc-form__row-label">{{ label(field) }}</span>

                <span v-for="side in SIDES" :key="side.key" class="input-group calc-form__cell">
                    <input
                        v-if="field.key === 'etMm'"
                        :id="fid(side.key, field.key)"
                        class="input num calc-form__et"
                        type="number"
                        :min="ET_MIN"
                        :max="ET_MAX"
                        step="1"
                        autocomplete="off"
                        :value="etText[side.key]"
                        :aria-labelledby="`${rid(field.key)} ${hid(side.key)}`"
                        :aria-invalid="isInvalid(side.key, field.key)"
                        :aria-describedby="eid(side.key, field.key)"
                        :data-prefilled="prefilledAttr(side.key)"
                        @change="onEtChange(side.key, $event)"
                        @blur="validateEt(side.key)"
                    />
                    <select
                        v-else
                        :id="fid(side.key, field.key)"
                        v-model="setup(side.key)[field.key]"
                        class="input num"
                        :aria-labelledby="`${rid(field.key)} ${hid(side.key)}`"
                        :aria-invalid="isInvalid(side.key, field.key)"
                        :aria-describedby="eid(side.key, field.key)"
                        :data-prefilled="prefilledAttr(side.key)"
                        @change="onSelect(side.key, field.key as SelectField)"
                    >
                        <option v-for="option in OPTIONS[field.key as SelectField]" :key="option" :value="option">
                            {{ field.option(option) }}
                        </option>
                    </select>
                    <span v-if="field.key === 'etMm'" class="input-group__suffix" aria-hidden="true">mm</span>
                </span>

                <div class="calc-form__errors">
                    <p v-for="side in SIDES" :id="eid(side.key, field.key)" :key="side.key" class="form-field__error">
                        {{ errors[side.key][field.key] ?? '' }}
                    </p>
                </div>
            </template>
        </div>

        <!-- The teaser: Aktuell and Neu as two fieldsets, five fields in a row each. -->
        <div v-else-if="layout === 'row'" class="calc-row">
            <fieldset v-for="side in SIDES" :key="side.key" class="calc-form__set">
                <legend class="label calc-form__legend">{{ side.label }}</legend>

                <div class="calc-form__fields">
                    <div v-for="field in FIELDS" :key="field.key" class="form-field">
                        <label class="form-field__label" :for="fid(side.key, field.key)">{{ label(field) }}</label>

                        <span class="input-group">
                            <input
                                v-if="field.key === 'etMm'"
                                :id="fid(side.key, field.key)"
                                class="input num calc-form__et"
                                type="number"
                                :min="ET_MIN"
                                :max="ET_MAX"
                                step="1"
                                autocomplete="off"
                                :value="etText[side.key]"
                                :aria-invalid="isInvalid(side.key, field.key)"
                                :aria-describedby="eid(side.key, field.key)"
                                :data-prefilled="prefilledAttr(side.key)"
                                @change="onEtChange(side.key, $event)"
                                @blur="validateEt(side.key)"
                            />
                            <select
                                v-else
                                :id="fid(side.key, field.key)"
                                v-model="setup(side.key)[field.key]"
                                class="input num"
                                :aria-invalid="isInvalid(side.key, field.key)"
                                :aria-describedby="eid(side.key, field.key)"
                                :data-prefilled="prefilledAttr(side.key)"
                                @change="onSelect(side.key, field.key as SelectField)"
                            >
                                <option v-for="option in OPTIONS[field.key as SelectField]" :key="option" :value="option">
                                    {{ field.option(option) }}
                                </option>
                            </select>
                            <span v-if="field.key === 'etMm'" class="input-group__suffix" aria-hidden="true">mm</span>
                        </span>

                        <p :id="eid(side.key, field.key)" class="form-field__error">
                            {{ errors[side.key][field.key] ?? '' }}
                        </p>
                    </div>
                </div>
            </fieldset>
        </div>

        <!-- Phone: Aktuell · Neu as tabs, the five fields two abreast under each. -->
        <TabsRoot v-else v-model="tab" class="calc-form__tabs">
            <TabsList class="tabs__list" aria-label="Aktuelle oder neue Größe">
                <TabsTrigger v-for="side in SIDES" :key="side.key" :value="side.key" class="tabs__trigger">{{ side.label }}</TabsTrigger>
            </TabsList>

            <TabsContent v-for="side in SIDES" :key="side.key" :value="side.key" class="tabs__content calc-form__fields calc-form__fields--two">
                <div v-for="field in FIELDS" :key="field.key" class="form-field">
                    <label class="form-field__label" :for="fid(side.key, field.key)">{{ label(field) }}</label>

                    <span class="input-group">
                        <input
                            v-if="field.key === 'etMm'"
                            :id="fid(side.key, field.key)"
                            class="input num calc-form__et"
                            type="number"
                            :min="ET_MIN"
                            :max="ET_MAX"
                            step="1"
                            autocomplete="off"
                            :value="etText[side.key]"
                            :aria-invalid="isInvalid(side.key, field.key)"
                            :aria-describedby="eid(side.key, field.key)"
                            :data-prefilled="prefilledAttr(side.key)"
                            @change="onEtChange(side.key, $event)"
                            @blur="validateEt(side.key)"
                        />
                        <select
                            v-else
                            :id="fid(side.key, field.key)"
                            v-model="setup(side.key)[field.key]"
                            class="input num"
                            :aria-invalid="isInvalid(side.key, field.key)"
                            :aria-describedby="eid(side.key, field.key)"
                            :data-prefilled="prefilledAttr(side.key)"
                            @change="onSelect(side.key, field.key as SelectField)"
                        >
                            <option v-for="option in OPTIONS[field.key as SelectField]" :key="option" :value="option">
                                {{ field.option(option) }}
                            </option>
                        </select>
                        <span v-if="field.key === 'etMm'" class="input-group__suffix" aria-hidden="true">mm</span>
                    </span>

                    <p :id="eid(side.key, field.key)" class="form-field__error">
                        {{ errors[side.key][field.key] ?? '' }}
                    </p>
                </div>
            </TabsContent>
        </TabsRoot>
    </form>
</template>

<style scoped>
.calc-form {
    min-width: 0;
}

/* ── The two fieldsets (teaser) ─────────────────────────────────────────────── */

.calc-form__set {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

/* A rank above its field labels: the group name is ink, and a beat of space sits under it. */
.calc-form__legend {
    padding: 0;
    margin-bottom: var(--sp-12);
    color: var(--c-ink);
}

.calc-form__fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-12) var(--gutter);
}

/* Five in a row where the fieldset is wide enough: 117 px each at 1440, 131 at 768. */
@media (min-width: 768px) {
    .calc-form--row .calc-form__fields {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: var(--sp-12);
    }
}

/* ── The compact table (full page): one label, two controls, five rows ───────── */

.calc-form__table {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px 120px;
    gap: var(--sp-12) var(--gutter);
    align-items: center;
}

.calc-form__head {
    text-align: left;
}

.calc-form__row-label {
    overflow-wrap: anywhere;
}

.calc-form__cell {
    min-width: 0;
}

/* The errors take a row of their own under the controls; empty ones keep no height. */
.calc-form__errors {
    display: grid;
    grid-column: 1 / -1;
    gap: var(--sp-4);
    margin-top: calc(-1 * var(--sp-12));
}

.calc-form__errors .form-field__error:empty {
    display: none;
}

/* ── The ET field: the suffix owns the right edge, so the number keeps its spinner off it ─ */

.calc-form__et {
    appearance: textfield;
    padding-right: var(--sp-40);
}

.calc-form__et::-webkit-inner-spin-button,
.calc-form__et::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
}

/* ── The tabs (phone) ───────────────────────────────────────────────────────── */

.calc-form__tabs .tabs__content {
    padding-top: var(--sp-16);
}
</style>
