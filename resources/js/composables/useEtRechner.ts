/**
 * The Felgenrechner's state, on both documents of /felgenrechner, since its rebuild after the client's example (his #11;
 * the operator's brief of 29.10.2026, Batch 2): the two setups, how far each edge moves, the sentence about a prefill,
 * and the address.
 *
 * Starting values, in this order: the comparison the server read from `?rechner=`; then the chosen car's prefill — the
 * smallest size a Gutachten names for it (finding C3), half an inch wider at the same ET beside it, so the first paint
 * shows a change; then his example. Every change is written to `?rechner=` with `history.replaceState`, debounced by
 * `--d-2`, so the address bar is always the share link. Nothing here touches `window` outside `onMounted`.
 */

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
    DEFAULT_ET_STATE,
    edgeChange,
    encodeEtState,
    innerSentence,
    isEtSetup,
    outerSentence,
    RANGES,
    roundToTenths,
    setupLine,
    type EtSetup,
    type EtSide,
    type EtState,
} from '../lib/etRechner'
import type { CalculatorPrefill } from '../types/pages'
import type { VehicleProp } from '../types/rimify'

export interface UseEtRechnerOptions {
    /** A getter, so a car chosen later (new props) applies its prefill. */
    prefill: () => CalculatorPrefill | null | undefined
    vehicle: () => VehicleProp | null | undefined
    /** The comparison the server read from `?rechner=`; it outranks the prefill. */
    state?: EtState | null
    /** Write every change to `?rechner=`. */
    writeUrl?: boolean
}

export interface EtRechner {
    state: EtState
    update: (next: EtState) => void
    /** Tenths of a millimetre, rounded once (lib/etRechner). */
    change: ComputedRef<{ inner: number; outer: number }>
    sentences: ComputedRef<{ inner: string; outer: string }>
    /** `8,5J · ET 40` per side, with the spacer where there is one. */
    lines: ComputedRef<Record<EtSide, string>>
    shareParam: ComputedRef<string>
    /** True while „Aktuelle Felge“ holds the prefill. */
    fromVehicle: Ref<boolean>
    /** What „Aktuelle Felge“ was prefilled with, or null when it was not. */
    prefillLine: ComputedRef<string | null>
}

/** The car's smallest Gutachten size as the current rim, without a spacer — or null when the form does not offer it. */
export function fromPrefill(p: CalculatorPrefill | null | undefined): EtSetup | null {
    if (p === null || p === undefined) {
        return null
    }

    const s: EtSetup = { widthIn: p.widthIn, etMm: p.etMm, spacerMm: 0 }

    return isEtSetup(s) ? s : null
}

/** Beside a prefill: half an inch wider at the same ET — a comparison to look at, never a recommendation. */
export function wider(s: EtSetup): EtSetup {
    return { ...s, widthIn: Math.min(RANGES.widthIn.max, s.widthIn + 0.5) }
}

/** What the prefill is, said plainly (C3) and of our record (R-17): the smallest size we hold a Gutachten for. */
export function prefillSentence(vehicleShort: string): string {
    return `„Aktuelle Felge“ ist mit der kleinsten Größe aus den bei uns hinterlegten Gutachten für ${vehicleShort} vorbelegt. Das ist nicht unbedingt die Felge, die du heute fährst.`
}

function isEtState(state: EtState | null | undefined): state is EtState {
    return state !== null && state !== undefined && isEtSetup(state.current) && isEtSetup(state.next)
}

function same(a: EtState, b: EtState): boolean {
    return encodeEtState(a) === encodeEtState(b)
}

function parseMs(value: string): number | null {
    const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value)

    if (match === null || match[1] === undefined) {
        return null
    }

    const n = Number(match[1])

    return Number.isFinite(n) ? (match[2] === 's' ? n * 1000 : n) : null
}

export function useEtRechner(options: UseEtRechnerOptions): EtRechner {
    const prefilled = fromPrefill(options.prefill())
    const shared = isEtState(options.state) ? options.state : null
    const initial = shared ?? (prefilled === null ? DEFAULT_ET_STATE : { current: prefilled, next: wider(prefilled) })

    const state = reactive<EtState>({ current: { ...initial.current }, next: { ...initial.next } })
    const fromVehicle = ref(shared === null && prefilled !== null)

    const change = computed(() => {
        const c = edgeChange(state)

        return { inner: roundToTenths(c.inner), outer: roundToTenths(c.outer) }
    })
    const sentences = computed(() => ({ inner: innerSentence(change.value.inner), outer: outerSentence(change.value.outer) }))
    const lines = computed<Record<EtSide, string>>(() => ({ current: setupLine(state.current), next: setupLine(state.next) }))
    const shareParam = computed(() => encodeEtState(state))
    const prefillLine = computed(() => {
        const short = options.vehicle()?.short

        return fromVehicle.value && short !== undefined && short !== '' ? prefillSentence(short) : null
    })

    function replace(next: EtState): void {
        Object.assign(state.current, next.current)
        Object.assign(state.next, next.next)
    }

    /* ── The address as the share link ──────────────────────────────────────────── */

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

    function update(next: EtState): void {
        if (!same(state, next)) {
            replace(next)
            scheduleUrl()
        }

        // Once a figure is the customer's own, the sentence about the prefill would be untrue.
        fromVehicle.value = false
    }

    watch(options.prefill, (prefill) => {
        const s = fromPrefill(prefill)

        if (s !== null) {
            replace({ current: s, next: wider(s) })
            fromVehicle.value = true
            scheduleUrl()
        }
    })

    onMounted(() => {
        delay = parseMs(getComputedStyle(document.documentElement).getPropertyValue('--d-2')) ?? delay

        // The address bar is the share link from the first paint — also over a link from before the rebuild, which
        // opened on the defaults and must not go on carrying figures the page does not show.
        if (options.writeUrl === true && new URLSearchParams(window.location.search).get('rechner') !== shareParam.value) {
            writeUrl()
        }
    })

    onBeforeUnmount(() => {
        if (timer !== undefined) {
            clearTimeout(timer)
        }
    })

    return { state, update, change, sentences, lines, shareParam, fromVehicle, prefillLine }
}
