<script setup lang="ts">
/**
 * The fitment calculator (H8 / F6): "Was ändert sich mit der neuen Größe?"
 *
 * Two columns, Aktuell and Neu, five figures each. Out of them come the cross-section drawing and
 * four values — Außenkante, Innenkante, Abrollumfang, Tacho bei 100 km/h — all from
 * `lib/fitmentMath`, which is the only place the arithmetic lives.
 *
 * The page supplies the section and the heading; this is the body. When the customer's vehicle is
 * known, `prefill` sets Aktuell to its original size and Neu to the same, so the first thing shown
 * is an honest "nothing changes yet". Without a vehicle, the two columns show the worked example
 * from the specification.
 *
 * Sharing: "Link kopieren" writes `?rechner=W1-D1-ET1-TW1-A1_W2-D2-ET2-TW2-A2` to the clipboard;
 * on mount, the same parameter is read back and — if every figure is one this form offers —
 * applied. Anything else in that parameter is ignored: a shared link never puts a value into the
 * calculator that the calculator could not have produced itself.
 *
 * The one line under the values is the point of the section: these are arithmetic, not approval.
 */

import { computed, onMounted, reactive, ref, useId, watch } from 'vue'
import { decimal, NNBSP, withUnit } from '../../format'
import { compare, type WheelSetup, signedDecimal } from '../../lib/fitmentMath'
import OffsetSection from './OffsetSection.vue'

export interface CalculatorPrefill {
    widthIn: number
    diameterIn: number
    etMm: number
    tyreWidth: number
    aspect: number
}

const props = withDefaults(defineProps<{ prefill?: CalculatorPrefill | null }>(), { prefill: null })

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

const FIELDS: { key: Field; label: string; option: (v: number) => string }[] = [
    { key: 'widthIn', label: 'Felgenbreite', option: jLabel },
    { key: 'diameterIn', label: 'Durchmesser', option: (v) => withUnit(v, 'Zoll') },
    { key: 'etMm', label: 'Einpresstiefe (ET) in mm', option: String },
    { key: 'tyreWidthMm', label: 'Reifenbreite', option: (v) => withUnit(v, 'mm') },
    { key: 'aspect', label: 'Querschnitt', option: String },
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

/* A link describes one comparison; once the figures move, the old confirmation is stale. */
watch(shareParam, () => {
    shareStatus.value = 'idle'
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
</script>

<template>
    <div class="calc">
        <form class="calc__form" novalidate @submit.prevent>
            <div class="calc__cols">
                <fieldset v-for="side in SIDES" :key="side.key" class="calc__col">
                    <legend class="h4 calc__legend">{{ side.label }}</legend>
                    <p class="small muted num calc__summary">{{ summaries[side.key] }}</p>

                    <div v-for="field in FIELDS" :key="field.key" class="form-field">
                        <label class="form-field__label" :for="fid(side.key, field.key)">{{ field.label }}</label>

                        <input
                            v-if="field.key === 'etMm'"
                            :id="fid(side.key, field.key)"
                            class="input num"
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

                        <p :id="eid(side.key, field.key)" class="form-field__error">
                            {{ errors[side.key][field.key] ?? '' }}
                        </p>
                    </div>
                </fieldset>
            </div>

            <div class="calc__actions">
                <button class="btn btn--secondary" type="button" @click="copyLink">Link kopieren</button>
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
    </div>
</template>

<style scoped>
.calc {
    display: grid;
    gap: var(--sp-40);
    align-items: start;
}

.calc__form {
    display: grid;
    gap: var(--sp-24);
    min-width: 0;
}

.calc__cols {
    display: grid;
    gap: var(--sp-24);
}

/* A fieldset is a column, not a box. */
.calc__col {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.calc__legend {
    padding: 0;
}

.calc__summary {
    margin-bottom: var(--sp-4);
    overflow-wrap: anywhere;
}

.calc__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-16);
}

.calc__result {
    display: grid;
    gap: var(--sp-24);
    min-width: 0;
}

/* The sheet is a portrait drawing: never wider than a wheel needs, and centred on a phone. */
.calc__drawing {
    max-width: 320px;
    margin-inline: auto;
}

.calc__note {
    display: block;
    font-weight: 400;
}

.calc__honest {
    max-width: 68ch;
    hyphens: auto;
}

@media (min-width: 560px) {
    .calc__cols {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--gutter);
    }
}

@media (min-width: 1024px) {
    .calc {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        gap: var(--sp-64);
    }

    .calc__drawing {
        margin-inline: 0;
    }
}
</style>
