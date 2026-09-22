/**
 * The Felgenrechner's state, shared by the homepage teaser and both documents of /felgenrechner.
 *
 * Owns the two setups (always valid — the form only hands over figures it offers), whether the
 * form currently holds something it could not commit (an impossible ET: the results then read
 * a dash and the drawing keeps the last valid comparison), the model from `lib/felgenGeometry`,
 * the prefill note, and the URL: every valid change is written to `?rechner=` with
 * `history.replaceState`, debounced by `--d-2`, so the address bar is always a share link.
 *
 * Starting values, in order of precedence: a comparison the server parsed from `?rechner=`
 * (the full page), then the prefill — the smallest size a Gutachten names for the chosen car —
 * against the next plausible step, then the specification's worked example. On the homepage the
 * parameter is read on mount instead, because the page does not carry it as a prop. Nothing here
 * touches `window` outside `onMounted`.
 */

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type ComputedRef, type Ref } from 'vue'
import { NNBSP } from '../format'
import { felgenModel, percentText, rimSuitsTyre, wholeMmText, type FelgenModel, type WheelSetup } from '../lib/felgenGeometry'
import {
    cloneState,
    decodeState,
    DEFAULT_STATE,
    encodeState,
    etLabel,
    felgenrechnerHref,
    fromPrefill,
    isState,
    jLabel,
    sameState,
    setupLine,
    type CalculatorPrefill,
    type RechnerState,
    type Side,
} from '../lib/rechner'
import type { VehicleProp } from '../types/rimify'

export interface UseRechnerOptions {
    /** A getter, so a vehicle chosen later (new props) re-applies its prefill. */
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
    /** The model of the current comparison: the drawing and every printed figure come from it. */
    result: ComputedRef<FelgenModel>
    /** The model to print: null while the form is invalid. */
    shown: ComputedRef<FelgenModel | null>
    /**
     * True when a side's tyre and rim do not belong together (`rimSuitsTyre`): then nothing is drawn
     * and no figure is printed for the comparison — the results say so in one sentence.
     */
    implausible: ComputedRef<boolean>
    shareParam: ComputedRef<string>
    /** The full page, carrying the current comparison. */
    href: ComputedRef<string>
    /** True while *Aktuell* holds the prefill; its fields then carry `data-prefilled`. */
    fromVehicle: Ref<boolean>
    /**
     * Always null, kept for compatibility only. The old homepage teaser wrapped it in "Serienbereifung",
     * which the prefill is not (finding C3); that teaser is gone (W5). Use `prefillLine`.
     */
    prefillNote: ComputedRef<string | null>
    /** The sentence that says what *Aktuell* was prefilled with, or null when it was not (C3). */
    prefillLine: ComputedRef<string | null>
    /** `7,5J × 17 · ET 45 · 225/45 R17 · Ø rechnerisch 634 mm` per side; without the Ø when implausible. */
    summaries: ComputedRef<Record<Side, string>>
    /** The full figures for the `.specs` list on /felgenrechner; empty when implausible. */
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

/**
 * The next plausible step up from a size: one inch more, ten points less profile, half an inch
 * wider, the ET unchanged — so a page opened with a vehicle shows a real change at first paint
 * instead of "nothing changes" under a heading that asks what changes. Every value stays on the
 * grid the form offers. It is a comparison to look at, not a recommendation. The width stays put
 * where half an inch more would no longer suit the tyre (`rimSuitsTyre`), so a page opened with a
 * vehicle never greets the customer with a pairing it flags itself.
 */
export function nextStep(s: WheelSetup): WheelSetup {
    const wider = { ...s, widthIn: Math.min(12, s.widthIn + 0.5) }

    return {
        ...s,
        widthIn: rimSuitsTyre(s) && !rimSuitsTyre(wider) ? s.widthIn : wider.widthIn,
        diameterIn: Math.min(24, s.diameterIn + 1),
        aspect: Math.max(25, s.aspect - 10),
    }
}

/** What the prefill is, said plainly (C3): not the factory size, the smallest size a Gutachten names. */
export function prefillSentence(vehicleShort: string): string {
    return `Aktuell ist vorbelegt mit der kleinsten Größe, die ein Gutachten für deinen ${vehicleShort} nennt – nicht unbedingt mit deiner heutigen Bereifung.`
}

export function useRechner(options: UseRechnerOptions): Rechner {
    const prefilled = fromPrefill(options.prefill())
    const shared = isState(options.state) ? options.state : null
    const initial = shared ?? (prefilled === null ? DEFAULT_STATE : { current: prefilled, next: nextStep(prefilled) })

    const state = reactive<RechnerState>(cloneState(initial))
    const valid = ref(true)
    const fromVehicle = ref(shared === null && prefilled !== null)

    const result = computed(() => felgenModel(state.current, state.next))
    const shown = computed(() => (valid.value ? result.value : null))
    const implausible = computed(() => result.value.implausible.length > 0)
    const shareParam = computed(() => encodeState(state))
    const href = computed(() => felgenrechnerHref(state))
    const prefillNote = computed<string | null>(() => null)
    const prefillLine = computed(() => {
        const short = options.vehicle()?.short

        return fromVehicle.value && short !== undefined && short !== '' ? prefillSentence(short) : null
    })

    // The setup lines echo the customer's own figures; the computed Ø is left out when implausible.
    const summary = (s: WheelSetup, diameterMm: number): string =>
        implausible.value ? setupLine(s) : `${setupLine(s)} · Ø${NNBSP}rechnerisch ${wholeMmText(diameterMm)}`

    const summaries = computed<Record<Side, string>>(() => ({
        current: summary(state.current, result.value.current.diameterMm),
        next: summary(state.next, result.value.next.diameterMm),
    }))

    const specs = computed<SpecRow[]>(() => {
        const r = result.value

        if (implausible.value) {
            return []
        }

        return [
            { key: 'rim', label: 'Felge', value: `${jLabel(state.current.widthIn)} × ${state.current.diameterIn} → ${jLabel(state.next.widthIn)} × ${state.next.diameterIn}` },
            { key: 'et', label: 'Einpresstiefe', value: `${etLabel(state.current.etMm)} → ${etLabel(state.next.etMm)}` },
            { key: 'diameter', label: 'Außendurchmesser, rechnerisch', value: `${wholeMmText(r.current.diameterMm)} → ${wholeMmText(r.next.diameterMm)}` },
            { key: 'circumference', label: 'Umfang (π × Ø), rechnerisch', value: `${wholeMmText(r.current.circumferenceMm)} → ${wholeMmText(r.next.circumferenceMm)}` },
            { key: 'abroll', label: 'Abrollumfang, Änderung', value: percentText(r.circumferenceDeltaPercent) },
            { key: 'outer', label: 'Außenkante, rechnerisch', value: r.outer.phrase },
            { key: 'inner', label: 'Innenkante, rechnerisch', value: r.inner.phrase },
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

    return { state, valid, setValid, update, result, shown, implausible, shareParam, href, fromVehicle, prefillNote, prefillLine, summaries, specs }
}
