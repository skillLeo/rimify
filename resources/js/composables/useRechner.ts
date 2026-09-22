/**
 * The Felgenrechner's state, shared by the homepage teaser and both documents of /felgenrechner.
 *
 * Owns the two setups (always valid — the form only hands over figures it offers), whether the
 * form currently holds something it could not commit (an impossible ET: the results then read
 * a dash and the drawing keeps the last valid comparison), the comparison from `lib/fitmentMath`,
 * the prefill note, and the URL: every valid change is written to `?rechner=` with
 * `history.replaceState`, debounced by `--d-2`, so the address bar is always a share link.
 *
 * Starting values, in order of precedence: a comparison the server parsed from `?rechner=`
 * (the full page), then the vehicle's original size on both sides (an honest "nothing changes
 * yet"), then the specification's worked example. On the homepage the parameter is read on
 * mount instead, because the page does not carry it as a prop. Nothing here touches `window`
 * outside `onMounted`.
 */

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type ComputedRef, type Ref } from 'vue'
import { decimal, NNBSP, withUnit } from '../format'
import { compare, signedDecimal, type Comparison, type WheelSetup } from '../lib/fitmentMath'
import {
    cloneState,
    decodeState,
    DEFAULT_STATE,
    encodeState,
    etLabel,
    felgenrechnerHref,
    fromPrefill,
    isState,
    sameState,
    setupLine,
    type CalculatorPrefill,
    type RechnerState,
    type Side,
} from '../lib/rechner'
import type { VehicleProp } from '../types/rimify'

export interface UseRechnerOptions {
    /** A getter, so a vehicle chosen later (new props) re-applies its size. */
    prefill: () => CalculatorPrefill | null | undefined
    vehicle: () => VehicleProp | null | undefined
    /** The comparison the server parsed from `?rechner=`; outranks the prefill. */
    state?: RechnerState | null
    /** Read `?rechner=` on mount — for a surface whose page does not carry it as a prop. */
    readUrl?: boolean
    /** Write every valid change to `?rechner=`. */
    writeUrl?: boolean
}

export interface SpecRow {
    key: string
    label: string
    value: string
}

export interface Rechner {
    state: RechnerState
    /** False while the form holds a figure it cannot commit; the results then read a dash. */
    valid: Ref<boolean>
    setValid: (valid: boolean) => void
    /** A change from the form: applied, the URL updated, the prefill note withdrawn. */
    update: (next: RechnerState) => void
    result: ComputedRef<Comparison>
    /** The comparison to show: null while the form is invalid. */
    shown: ComputedRef<Comparison | null>
    shareParam: ComputedRef<string>
    /** The full page, carrying the current comparison. */
    href: ComputedRef<string>
    /** True while the figures are the vehicle's own; the *Aktuell* fields then carry `data-prefilled`. */
    fromVehicle: Ref<boolean>
    /** The vehicle's short name for the prefill note, or null when the note would be untrue. */
    prefillNote: ComputedRef<string | null>
    /** `Aktuell: 7,5 J × 17 · ET 45 · 225/45 R17 · Ø 634,3 mm` per side. */
    summaries: ComputedRef<Record<Side, string>>
    /** The full figures for the `.specs` list on /felgenrechner. */
    specs: ComputedRef<SpecRow[]>
}

function parseMs(value: string): number | null {
    const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value)

    if (match === null || match[1] === undefined) {
        return null
    }

    const n = Number(match[1])

    return Number.isFinite(n) ? (match[2] === 's' ? n * 1000 : n) : null
}

function mm(value: number): string {
    return Number.isFinite(value) ? withUnit(decimal(value, 1), 'mm') : '–'
}

/**
 * The next plausible step up from a size: one inch more, ten points less profile, half an inch
 * wider, the ET unchanged — so a page opened with a vehicle shows a real change at first paint
 * instead of "nothing changes" under a heading that asks what changes. Every value stays on the
 * grid the form offers.
 */
export function nextStep(s: WheelSetup): WheelSetup {
    return {
        ...s,
        widthIn: Math.min(12, s.widthIn + 0.5),
        diameterIn: Math.min(24, s.diameterIn + 1),
        aspect: Math.max(25, s.aspect - 10),
    }
}

export function useRechner(options: UseRechnerOptions): Rechner {
    const prefilled = fromPrefill(options.prefill())
    const shared = isState(options.state) ? options.state : null
    const initial = shared ?? (prefilled === null ? DEFAULT_STATE : { current: prefilled, next: nextStep(prefilled) })

    const state = reactive<RechnerState>(cloneState(initial))
    const valid = ref(true)
    const fromVehicle = ref(shared === null && prefilled !== null)

    const result = computed(() => compare(state.current, state.next))
    const shown = computed(() => (valid.value ? result.value : null))
    const shareParam = computed(() => encodeState(state))
    const href = computed(() => felgenrechnerHref(state))
    const prefillNote = computed(() => (fromVehicle.value ? (options.vehicle()?.short ?? null) : null))

    const summaries = computed<Record<Side, string>>(() => ({
        current: `${setupLine(state.current)} · Ø${NNBSP}${mm(result.value.current.diameterMm)}`,
        next: `${setupLine(state.next)} · Ø${NNBSP}${mm(result.value.next.diameterMm)}`,
    }))

    const specs = computed<SpecRow[]>(() => {
        const r = result.value

        return [
            { key: 'diameter', label: 'Ø Rad', value: `${mm(r.current.diameterMm)} → ${mm(r.next.diameterMm)}` },
            { key: 'circumference', label: 'Umfang', value: `${mm(r.current.circumferenceMm)} → ${mm(r.next.circumferenceMm)}` },
            { key: 'abroll', label: 'Abrollumfang', value: `${mm(r.current.abrollumfangMm)} → ${mm(r.next.abrollumfangMm)}` },
            { key: 'outer', label: 'Außenkante', value: withUnit(signedDecimal(r.outerEdgeMm, 1), 'mm') },
            { key: 'inner', label: 'Innenkante', value: withUnit(signedDecimal(r.innerEdgeMm, 1), 'mm') },
            { key: 'et', label: 'Einpresstiefe wirksam', value: `${etLabel(state.current.etMm)} → ${etLabel(state.next.etMm)}` },
        ]
    })

    function replace(next: RechnerState): void {
        Object.assign(state.current, next.current)
        Object.assign(state.next, next.next)
    }

    /* ── The URL as a share link ────────────────────────────────────────────────── */

    let timer: ReturnType<typeof setTimeout> | undefined
    let delay = 200

    function writeUrl(): void {
        const url = new URL(window.location.href)
        url.searchParams.set('rechner', shareParam.value)
        window.history.replaceState(window.history.state, '', url.toString())
    }

    function scheduleUrl(): void {
        if (options.writeUrl !== true || typeof window === 'undefined') {
            return
        }

        if (timer !== undefined) {
            clearTimeout(timer)
        }

        timer = setTimeout(writeUrl, delay)
    }

    function update(next: RechnerState): void {
        if (!sameState(state, next)) {
            replace(next)
            scheduleUrl()
        }

        // Once a figure is the customer's own, the note would be untrue.
        fromVehicle.value = false
    }

    function setValid(next: boolean): void {
        valid.value = next
    }

    watch(options.prefill, (prefill) => {
        const s = fromPrefill(prefill)

        if (s !== null) {
            replace({ current: s, next: nextStep(s) })
            fromVehicle.value = true
        }
    })

    onMounted(() => {
        delay = parseMs(getComputedStyle(document.documentElement).getPropertyValue('--d-2')) ?? delay

        if (options.readUrl === true) {
            const fromUrl = decodeState(new URLSearchParams(window.location.search).get('rechner'))

            if (fromUrl !== null) {
                replace(fromUrl)
                fromVehicle.value = false
            }
        }

        // The address bar is the share link from the first paint, not from the first change.
        if (options.writeUrl === true && !new URLSearchParams(window.location.search).has('rechner')) {
            writeUrl()
        }
    })

    onBeforeUnmount(() => {
        if (timer !== undefined) {
            clearTimeout(timer)
        }
    })

    return { state, valid, setValid, update, result, shown, shareParam, href, fromVehicle, prefillNote, summaries, specs }
}
