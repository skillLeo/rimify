<script setup lang="ts">
/**
 * The fitment calculator (H8 / F6): "Was ändert sich mit der neuen Größe?"
 *
 * Two setups, Aktuell and Neu, five figures each. Out of them come the cross-section drawing and
 * four values — Außenkante, Innenkante, Abrollumfang, Tacho bei 100 km/h — all from
 * `lib/fitmentMath`, which is the only place the arithmetic lives.
 *
 * Two layouts, one component, chosen by the page: `table` (the desktop document) is the compact
 * table of controls — the label at the left, the two `.input`s beside it, five rows — with the
 * drawing and the values beside it; `tabs` (the phone document) is Aktuell · Neu as tabs with the
 * five fields stacked, then the drawing, the values, the honest line and a full-width button.
 *
 * The page supplies the section and the heading; this is the body. When the customer's vehicle is
 * known, `prefill` sets Aktuell to its original size and Neu to the same, says so above the form,
 * and the first thing shown is an honest "nothing changes yet". Without a vehicle, the two setups
 * show the worked example from the specification.
 *
 * Sharing: "Link kopieren" writes `?rechner=W1-D1-ET1-TW1-A1_W2-D2-ET2-TW2-A2` to the clipboard;
 * on mount, the same parameter is read back and — if every figure is one this form offers —
 * applied. Anything else in that parameter is ignored: a shared link never puts a value into the
 * calculator that the calculator could not have produced itself.
 *
 * The one line under the values is the point of the section: these are arithmetic, not approval.
 */

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, onMounted, reactive, ref, useId, watch } from 'vue'
import { decimal, NNBSP, withUnit } from '../../format'
import { compare, type WheelSetup, signedDecimal } from '../../lib/fitmentMath'
import OffsetSection from './OffsetSection.vue'
import type { VehicleProp } from '../../types/rimify'

export interface CalculatorPrefill {
    widthIn: number
    diameterIn: number
    etMm: number
    tyreWidth: number
    aspect: number
}

export type CalculatorLayout = 'table' | 'tabs'

const props = withDefaults(
    defineProps<{
        prefill?: CalculatorPrefill | null
        /** The shared vehicle, named in the prefill note; the note needs both a vehicle and a prefill. */
        vehicle?: VehicleProp | null
        layout?: CalculatorLayout
    }>(),
    { prefill: null, vehicle: null, layout: 'table' }
)

type Side = 'current' | 'next'
type SelectField = Exclude<keyof WheelSetup, 'etMm'>
type Field = keyof WheelSetup

/* ── What the form offers ─────────────────────────────────────────────────────── */

function steps(from: number, to: number, step: number): number[] {
    return Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 10) / 10)
}

const RIM_WIDTHS_IN = steps(5.5, 12, 0.5)
const DIAMETERS_IN = steps(13, 24, 1)
const TYRE_WIDTHS_MM = steps(135, 355, 10)
const ASPECTS = steps(25, 80, 5)
const ET_MIN = -50
const ET_MAX = 70

const OPTIONS: Record<SelectField, number[]> = {
    widthIn: RIM_WIDTHS_IN,
    diameterIn: DIAMETERS_IN,
    tyreWidthMm: TYRE_WIDTHS_MM,
    aspect: ASPECTS,
}

const SIDES: { key: Side; label: string }[] = [
    { key: 'current', label: 'Aktuell' },
    { key: 'next', label: 'Neu' },
]

function jLabel(widthIn: number): string {
    return withUnit(decimal(widthIn, Number.isInteger(widthIn) ? 0 : 1), 'J')
}

/* Selects carry their unit in the option text (the chevron owns the right edge); the ET field carries a suffix. */
const FIELDS: { key: Field; label: string; option: (v: number) => string }[] = [
    { key: 'widthIn', label: 'Felgenbreite', option: jLabel },
    { key: 'diameterIn', label: 'Durchmesser', option: (v) => withUnit(v, 'Zoll') },
    { key: 'etMm', label: 'Einpresstiefe (ET)', option: String },
    { key: 'tyreWidthMm', label: 'Reifenbreite', option: (v) => withUnit(v, 'mm') },
    { key: 'aspect', label: 'Querschnitt', option: (v) => withUnit(v, '%') },
]

/* The worked example from the specification, shown when no vehicle is known. */
const DEFAULT_CURRENT: WheelSetup = { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 }
const DEFAULT_NEXT: WheelSetup = { widthIn: 8.5, diameterIn: 19, etMm: 35, tyreWidthMm: 225, aspect: 35 }

const ET_ERROR = `Bitte eine ganze Zahl zwischen ${ET_MIN.toString().replace('-', '−')} und ${ET_MAX} angeben.`
const SELECT_ERROR = 'Bitte einen Wert aus der Liste wählen.'

/* ── Validation: only a figure the form itself offers is ever accepted ─────────── */

function isEt(value: number): boolean {
    return Number.isInteger(value) && value >= ET_MIN && value <= ET_MAX
}

function isSetup(s: WheelSetup): boolean {
    return (
        RIM_WIDTHS_IN.includes(s.widthIn) &&
        DIAMETERS_IN.includes(s.diameterIn) &&
        isEt(s.etMm) &&
        TYRE_WIDTHS_MM.includes(s.tyreWidthMm) &&
        ASPECTS.includes(s.aspect)
    )
}

function fromPrefill(p: CalculatorPrefill): WheelSetup | null {
    const s: WheelSetup = {
        widthIn: p.widthIn,
        diameterIn: p.diameterIn,
        etMm: p.etMm,
        tyreWidthMm: p.tyreWidth,
        aspect: p.aspect,
    }

    return isSetup(s) ? s : null
}

function parseEt(text: string): number | null {
    const t = text.trim().replace('−', '-')

    if (!/^-?\d{1,2}$/.test(t)) {
        return null
    }

    const n = Number(t)

    return isEt(n) ? n : null
}

/* ── State ────────────────────────────────────────────────────────────────────── */

const prefilled = props.prefill === null ? null : fromPrefill(props.prefill)

const setups = reactive<Record<Side, WheelSetup>>({
    current: { ...(prefilled ?? DEFAULT_CURRENT) },
    next: { ...(prefilled ?? DEFAULT_NEXT) },
})

/* What is typed into the ET fields; the committed number lives in `setups`. */
const etText = reactive<Record<Side, string>>({
    current: String(setups.current.etMm),
    next: String(setups.next.etMm),
})

const errors = reactive<Record<Side, Partial<Record<Field, string>>>>({ current: {}, next: {} })

/* True while the figures are the vehicle's own; a shared link or a hand-edit makes the note untrue. */
const fromVehicle = ref(prefilled !== null)
const prefillNote = computed(() => (fromVehicle.value && props.vehicle !== null ? props.vehicle.short : null))

function apply(current: WheelSetup, next: WheelSetup): void {
    Object.assign(setups.current, current)
    Object.assign(setups.next, next)
    etText.current = String(current.etMm)
    etText.next = String(next.etMm)
    errors.current = {}
    errors.next = {}
}

watch(
    () => props.prefill,
    (prefill) => {
        const s = prefill === null ? null : fromPrefill(prefill)

        if (s !== null) {
            apply(s, s)
            fromVehicle.value = true
        }
    }
)

function onEtChange(side: Side, event: Event): void {
    const text = (event.target as HTMLInputElement).value
    etText[side] = text
    const n = parseEt(text)

    if (n !== null) {
        setups[side].etMm = n
        errors[side].etMm = undefined
    }
}

function validateEt(side: Side): void {
    errors[side].etMm = parseEt(etText[side]) === null ? ET_ERROR : undefined
}

function validateSelect(side: Side, field: SelectField): void {
    errors[side][field] = OPTIONS[field].includes(setups[side][field]) ? undefined : SELECT_ERROR
}

/* ── Results ──────────────────────────────────────────────────────────────────── */

const result = computed(() => compare(setups.current, setups.next))

function unit(value: number, suffix: string, digits = 1): string {
    return Number.isFinite(value) ? withUnit(decimal(value, digits), suffix) : '–'
}

function signed(value: number, suffix: string): string {
    return withUnit(signedDecimal(value, 1), suffix)
}

function direction(value: number, positive: string, negative: string): string {
    if (value > 0.05) {
        return positive
    }

    return value < -0.05 ? negative : 'unverändert'
}

const values = computed(() => {
    const r = result.value

    return [
        {
            key: 'outer',
            label: 'Außenkante',
            value: signed(r.outerEdgeMm, 'mm'),
            note: direction(r.outerEdgeMm, 'steht weiter nach außen', 'steht weiter nach innen'),
        },
        {
            key: 'inner',
            label: 'Innenkante',
            value: signed(r.innerEdgeMm, 'mm'),
            note: direction(r.innerEdgeMm, 'rückt näher ans Fahrwerk', 'rückt vom Fahrwerk weg'),
        },
        {
            key: 'circumference',
            label: 'Abrollumfang',
            value: unit(r.next.circumferenceMm, 'mm'),
            note: `${signed(r.diameterDeltaPercent, '%')} gegenüber ${unit(r.current.circumferenceMm, 'mm')}`,
        },
        {
            key: 'speed',
            label: `Tacho bei ${withUnit(100, 'km/h')}`,
            value: `tatsächlich ${unit(r.speedoAt100KmH, 'km/h')}`,
            note: null,
        },
    ]
})

function etLabel(etMm: number): string {
    return `ET${NNBSP}${etMm < 0 ? `−${Math.abs(etMm)}` : etMm}`
}

const summaries = computed<Record<Side, string>>(() => {
    const line = (s: WheelSetup, diameterMm: number) =>
        `${jLabel(s.widthIn)} × ${s.diameterIn} · ${etLabel(s.etMm)} · ` +
        `${s.tyreWidthMm}/${s.aspect} R${s.diameterIn} · Ø${NNBSP}${unit(diameterMm, 'mm')}`

    return {
        current: line(setups.current, result.value.current.diameterMm),
        next: line(setups.next, result.value.next.diameterMm),
    }
})

/* ── Sharing ──────────────────────────────────────────────────────────────────── */

const SHARE_HALF = /^(\d{1,2}(?:\.5)?)-(\d{1,2})-(-?\d{1,2})-(\d{3})-(\d{1,2})$/

function encode(s: WheelSetup): string {
    return `${s.widthIn}-${s.diameterIn}-${s.etMm}-${s.tyreWidthMm}-${s.aspect}`
}

function decodeSetup(text: string): WheelSetup | null {
    const m = SHARE_HALF.exec(text)

    if (m === null) {
        return null
    }

    const s: WheelSetup = {
        widthIn: Number(m[1]),
        diameterIn: Number(m[2]),
        etMm: Number(m[3]),
        tyreWidthMm: Number(m[4]),
        aspect: Number(m[5]),
    }

    return isSetup(s) ? s : null
}

function decodeShare(param: string | null): { current: WheelSetup; next: WheelSetup } | null {
    if (param === null) {
        return null
    }

    const parts = param.split('_')

    if (parts.length !== 2) {
        return null
    }

    const current = decodeSetup(parts[0] ?? '')
    const next = decodeSetup(parts[1] ?? '')

    return current !== null && next !== null ? { current, next } : null
}

const shareParam = computed(() => `${encode(setups.current)}_${encode(setups.next)}`)
const shareStatus = ref<'idle' | 'copied' | 'manual'>('idle')
const shareUrl = ref('')

/* A link describes one comparison; once the figures move, the old confirmation is stale — and so is the note. */
watch(shareParam, () => {
    shareStatus.value = 'idle'
    fromVehicle.value = false
})

async function copyLink(): Promise<void> {
    const url = new URL(window.location.href)
    url.searchParams.set('rechner', shareParam.value)
    shareUrl.value = url.toString()

    try {
        await navigator.clipboard.writeText(shareUrl.value)
        shareStatus.value = 'copied'
    } catch {
        shareStatus.value = 'manual'
    }
}

function selectAll(event: FocusEvent): void {
    ;(event.target as HTMLInputElement).select()
}

onMounted(() => {
    const shared = decodeShare(new URLSearchParams(window.location.search).get('rechner'))

    if (shared !== null) {
        apply(shared.current, shared.next)
        fromVehicle.value = false
    }
})

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
</script>

<template>
    <div class="calc grid" :class="`calc--${layout}`">
        <form class="calc__form" novalidate @submit.prevent>
            <p v-if="prefillNote" class="small quiet calc__prefill">Vorbelegt mit der Serienbereifung deines {{ prefillNote }}.</p>

            <!-- Desktop: a compact table of controls — the label at the left, Aktuell and Neu beside it. -->
            <div v-if="layout === 'table'" class="calc__table" role="group" aria-label="Aktuelle und neue Größe">
                <span class="calc__corner" aria-hidden="true" />
                <span v-for="side in SIDES" :id="hid(side.key)" :key="side.key" class="label calc__head">{{ side.label }}</span>

                <template v-for="field in FIELDS" :key="field.key">
                    <span :id="rid(field.key)" class="label calc__row-label">{{ field.label }}</span>

                    <span v-for="side in SIDES" :key="side.key" class="input-group calc__cell">
                        <input
                            v-if="field.key === 'etMm'"
                            :id="fid(side.key, field.key)"
                            class="input num calc__et"
                            type="number"
                            :min="ET_MIN"
                            :max="ET_MAX"
                            step="1"
                            autocomplete="off"
                            :value="etText[side.key]"
                            :aria-labelledby="`${rid(field.key)} ${hid(side.key)}`"
                            :aria-invalid="errors[side.key].etMm ? 'true' : undefined"
                            :aria-describedby="eid(side.key, field.key)"
                            @change="onEtChange(side.key, $event)"
                            @blur="validateEt(side.key)"
                        />
                        <select
                            v-else
                            :id="fid(side.key, field.key)"
                            v-model="setups[side.key][field.key]"
                            class="input num"
                            :aria-labelledby="`${rid(field.key)} ${hid(side.key)}`"
                            :aria-invalid="errors[side.key][field.key] ? 'true' : undefined"
                            :aria-describedby="eid(side.key, field.key)"
                            @blur="validateSelect(side.key, field.key as SelectField)"
                        >
                            <option v-for="option in OPTIONS[field.key as SelectField]" :key="option" :value="option">
                                {{ field.option(option) }}
                            </option>
                        </select>
                        <span v-if="field.key === 'etMm'" class="input-group__suffix" aria-hidden="true">mm</span>
                    </span>

                    <div class="calc__errors">
                        <p v-for="side in SIDES" :id="eid(side.key, field.key)" :key="side.key" class="form-field__error">
                            {{ errors[side.key][field.key] ?? '' }}
                        </p>
                    </div>
                </template>
            </div>

            <!-- Each setup in one line, as a tyre shop would write it. -->
            <ul v-if="layout === 'table'" class="calc__summaries" aria-label="Die beiden Größen">
                <li v-for="side in SIDES" :key="side.key" class="small muted num calc__summary">
                    <span class="calc__summary-side">{{ side.label }}:</span> {{ summaries[side.key] }}
                </li>
            </ul>

            <!-- Phone: Aktuell · Neu as tabs, the five fields stacked under each. -->
            <TabsRoot v-else v-model="tab" class="calc__tabs">
                <TabsList class="tabs__list" aria-label="Aktuelle oder neue Größe">
                    <TabsTrigger v-for="side in SIDES" :key="side.key" :value="side.key" class="tabs__trigger">{{ side.label }}</TabsTrigger>
                </TabsList>

                <TabsContent v-for="side in SIDES" :key="side.key" :value="side.key" class="tabs__content calc__fields">
                    <p class="small muted num calc__summary">{{ summaries[side.key] }}</p>

                    <div v-for="field in FIELDS" :key="field.key" class="form-field">
                        <label class="form-field__label" :for="fid(side.key, field.key)">{{ field.label }}</label>

                        <span class="input-group">
                            <input
                                v-if="field.key === 'etMm'"
                                :id="fid(side.key, field.key)"
                                class="input num calc__et"
                                type="number"
                                :min="ET_MIN"
                                :max="ET_MAX"
                                step="1"
                                autocomplete="off"
                                :value="etText[side.key]"
                                :aria-invalid="errors[side.key].etMm ? 'true' : undefined"
                                :aria-describedby="eid(side.key, field.key)"
                                @change="onEtChange(side.key, $event)"
                                @blur="validateEt(side.key)"
                            />
                            <select
                                v-else
                                :id="fid(side.key, field.key)"
                                v-model="setups[side.key][field.key]"
                                class="input num"
                                :aria-invalid="errors[side.key][field.key] ? 'true' : undefined"
                                :aria-describedby="eid(side.key, field.key)"
                                @blur="validateSelect(side.key, field.key as SelectField)"
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

        <div class="calc__result">
            <OffsetSection class="calc__drawing" :current="setups.current" :next="setups.next" />

            <dl class="specs calc__values">
                <template v-for="row in values" :key="row.key">
                    <dt>{{ row.label }}</dt>
                    <dd>
                        <span class="num">{{ row.value }}</span>
                        <span v-if="row.note" class="small quiet num calc__note">{{ row.note }}</span>
                    </dd>
                </template>
            </dl>

            <p class="small muted calc__honest">
                Rechenwerte ersetzen kein Gutachten – ob eine Kombination zulässig ist, steht im Gutachten.
            </p>
        </div>

        <!-- Sharing: in the form's column on the desktop, under the honest line on the phone. -->
        <div class="calc__share">
            <div class="calc__actions">
                <button class="btn btn--secondary" :class="layout === 'tabs' ? 'btn--block' : 'btn--sm'" type="button" @click="copyLink">
                    Link kopieren
                </button>
                <span class="small quiet" role="status" aria-live="polite">
                    {{ shareStatus === 'copied' ? 'Link kopiert.' : '' }}
                </span>
            </div>

            <!-- No clipboard here (an older browser, a page without HTTPS): the link is still yours to copy. -->
            <div v-if="shareStatus === 'manual'" class="form-field">
                <label class="form-field__label" :for="`${uid}-share`">Link zum Kopieren</label>
                <input :id="`${uid}-share`" class="input" type="url" readonly :value="shareUrl" @focus="selectAll" />
                <p class="form-field__help">Automatisch kopieren klappt hier nicht – markiere den Link und kopiere ihn selbst.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* The page grid's columns, the section's own rows. */
.calc {
    row-gap: var(--sp-32);
    align-items: start;
}

.calc__form,
.calc__result,
.calc__share {
    grid-column: 1 / -1;
    min-width: 0;
}

.calc__form {
    display: grid;
    gap: var(--sp-16);
}

/* ── The compact table: one label, two controls, five rows ─────────────────── */

.calc__table {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px 120px;
    gap: var(--sp-12) var(--gutter);
    align-items: center;
}

.calc__head {
    text-align: left;
}

.calc__row-label {
    overflow-wrap: anywhere;
}

.calc__cell {
    min-width: 0;
}

/* The errors take a row of their own under the controls; empty ones keep no height. */
.calc__errors {
    display: grid;
    grid-column: 1 / -1;
    gap: var(--sp-4);
    margin-top: calc(-1 * var(--sp-12));
}

.calc__errors .form-field__error:empty {
    display: none;
}

/* The suffix owns the right edge of the ET field, so the number keeps its spinner off it. */
.calc__et {
    appearance: textfield;
    padding-right: var(--sp-40);
}

.calc__et::-webkit-inner-spin-button,
.calc__et::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
}

/* ── The tabs (phone): the five fields stacked under each ───────────────────── */

.calc__fields {
    display: grid;
    gap: var(--sp-12);
}

.calc__summary {
    overflow-wrap: anywhere;
}

.calc__summaries {
    display: grid;
    gap: var(--sp-4);
}

.calc__summary-side {
    color: var(--c-ink);
    font-weight: 500;
}

/* ── Sharing ───────────────────────────────────────────────────────────────── */

.calc__actions {
    display: grid;
    gap: var(--sp-8);
}

.calc__share {
    display: grid;
    gap: var(--sp-16);
}

/* ── The result ────────────────────────────────────────────────────────────── */

.calc__result {
    display: grid;
    gap: var(--sp-24);
}

.calc__note {
    display: block;
    font-weight: 400;
}

.calc__honest {
    max-width: 54ch;
    hyphens: auto;
}

/*
 * Stacked (tabs, and the table below 1024): the phone puts the button after the honest line, the
 * last thing in the block; the table keeps it with the form, so the result goes last there.
 */
.calc--table .calc__result {
    order: 1;
}

/* ── ≥ 1024: form in columns 1–5, drawing and values in 7–12 ───────────────── */

@media (min-width: 1024px) {
    /* Two rows: the form, then the share block — which takes the slack of the taller result column, from its top. */
    .calc--table {
        grid-template-rows: auto minmax(0, 1fr);
    }

    .calc--table .calc__form,
    .calc--table .calc__share {
        grid-column: 1 / span 5;
    }

    .calc--table .calc__form {
        grid-row: 1;
    }

    .calc--table .calc__share {
        grid-row: 2;
        align-self: start;
        margin-top: calc(-1 * var(--sp-16));
    }

    .calc--table .calc__result {
        grid-column: 7 / span 6;
        grid-row: 1 / span 2;
        order: 0;
    }

    .calc--table .calc__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--sp-16);
    }
}
</style>
