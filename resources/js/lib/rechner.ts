/**
 * The Felgenrechner's state: what the form offers, what it starts with, and how a comparison
 * travels in a URL (`?rechner=7.5x17-45-225-45_8.5x19-35-225-35`). Shared by the homepage teaser,
 * both documents of /felgenrechner and their tests, so no surface can accept a figure another
 * would refuse.
 *
 * The rule for anything that arrives from outside — a prefill from the database, a shared link —
 * is the same: only a figure the form itself offers is ever applied. Everything else is ignored
 * and the defaults stand (CLAUDE.md §2: fail closed).
 */

import { decimal, NNBSP } from '../format'
import type { WheelSetup } from './felgenGeometry'
import type { CalculatorPrefill } from '../types/pages'

export type { CalculatorPrefill }

export interface RechnerState {
    current: WheelSetup
    next: WheelSetup
}

export type Side = keyof RechnerState
export type Field = keyof WheelSetup
export type SelectField = Exclude<Field, 'etMm'>

function steps(from: number, to: number, step: number): number[] {
    return Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 10) / 10)
}

export const RIM_WIDTHS_IN = steps(5.5, 12, 0.5)
export const DIAMETERS_IN = steps(13, 24, 1)
export const TYRE_WIDTHS_MM = steps(135, 355, 10)
export const ASPECTS = steps(25, 85, 5)
export const ET_MIN = -30
export const ET_MAX = 70

export const OPTIONS: Record<SelectField, number[]> = {
    widthIn: RIM_WIDTHS_IN,
    diameterIn: DIAMETERS_IN,
    tyreWidthMm: TYRE_WIDTHS_MM,
    aspect: ASPECTS,
}

export const SIDES: { key: Side; label: string }[] = [
    { key: 'current', label: 'Aktuell' },
    { key: 'next', label: 'Neu' },
]

/* The worked example from the specification, shown when no vehicle is known: the first paint shows a real change. */
export const DEFAULT_STATE: RechnerState = {
    current: { widthIn: 7.5, diameterIn: 17, etMm: 45, tyreWidthMm: 225, aspect: 45 },
    next: { widthIn: 8.5, diameterIn: 19, etMm: 35, tyreWidthMm: 225, aspect: 35 },
}

/**
 * The line under every result, on every surface: the figures are arithmetic, and it points at the
 * papers that decide (ACCURACY.md §6). No liability wording of our own (finding #52): that comes
 * from the Kanzlei or not at all. It names no verdict — the calculator never judges a size. The
 * field numbers are the KBA's for the Zulassungsbescheinigung Teil I (accuracy-research-motec §3e);
 * the CoC's item numbers are left out because older CoC formats could not be verified.
 */
export const DISCLAIMER =
    'Rechenwerte ersetzen kein Gutachten. Welche Rad- und Reifengrößen für dein Auto gelten, steht in der ' +
    'Zulassungsbescheinigung Teil I (Felder 15.1 und 15.2), im CoC-Papier, in der Reifenfreigabe und im ' +
    'Gutachten oder in der ABE der Felge.'

export function isEt(value: number): boolean {
    return Number.isInteger(value) && value >= ET_MIN && value <= ET_MAX
}

export function isSetup(s: WheelSetup): boolean {
    return (
        RIM_WIDTHS_IN.includes(s.widthIn) &&
        DIAMETERS_IN.includes(s.diameterIn) &&
        isEt(s.etMm) &&
        TYRE_WIDTHS_MM.includes(s.tyreWidthMm) &&
        ASPECTS.includes(s.aspect)
    )
}

export function isState(state: RechnerState | null | undefined): state is RechnerState {
    return state !== null && state !== undefined && isSetup(state.current) && isSetup(state.next)
}

export function cloneState(state: RechnerState): RechnerState {
    return { current: { ...state.current }, next: { ...state.next } }
}

export function sameSetup(a: WheelSetup, b: WheelSetup): boolean {
    return (
        a.widthIn === b.widthIn &&
        a.diameterIn === b.diameterIn &&
        a.etMm === b.etMm &&
        a.tyreWidthMm === b.tyreWidthMm &&
        a.aspect === b.aspect
    )
}

export function sameState(a: RechnerState, b: RechnerState): boolean {
    return sameSetup(a.current, b.current) && sameSetup(a.next, b.next)
}

/**
 * The server's prefill as a setup — the smallest size a published Gutachten names for the chosen
 * vehicle, not its factory size (finding C3) — or null when it is not one the form offers.
 */
export function fromPrefill(p: CalculatorPrefill | null | undefined): WheelSetup | null {
    if (p === null || p === undefined) {
        return null
    }

    const s: WheelSetup = {
        widthIn: p.widthIn,
        diameterIn: p.diameterIn,
        etMm: p.etMm,
        tyreWidthMm: p.tyreWidth,
        aspect: p.aspect,
    }

    return isSetup(s) ? s : null
}

/**
 * `W x D - ET - TW - A` for one side, the two sides joined by `_`. The same pattern the server's
 * `FelgenrechnerRequest` accepts; a shared link never puts a value into the calculator that the
 * calculator could not have produced itself.
 */
export const SHARE_PATTERN = /^(\d+(?:\.\d)?)x(\d{2})-(-?\d{1,2})-(\d{3})-(\d{2})$/

function encodeSetup(s: WheelSetup): string {
    return `${s.widthIn}x${s.diameterIn}-${s.etMm}-${s.tyreWidthMm}-${s.aspect}`
}

function decodeSetup(text: string): WheelSetup | null {
    const m = SHARE_PATTERN.exec(text)

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

export function encodeState(state: RechnerState): string {
    return `${encodeSetup(state.current)}_${encodeSetup(state.next)}`
}

export function decodeState(param: string | null | undefined): RechnerState | null {
    if (typeof param !== 'string') {
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

/** The full page, carrying this comparison. */
export function felgenrechnerHref(state: RechnerState): string {
    return `/felgenrechner?rechner=${encodeState(state)}`
}

/* ── How a size is written (R-10, through format.ts) ─────────────────────────── */

/** `7,5J` · `8J` — the width figure as R-10 and the server's `GermanFormat::rimWidth()` write it. */
export function jLabel(widthIn: number): string {
    return `${decimal(widthIn, Number.isInteger(widthIn) ? 0 : 1)}J`
}

/** `ET 45` · `ET −10` — a real minus sign, a narrow no-break space. */
export function etLabel(etMm: number): string {
    return `ET${NNBSP}${etMm < 0 ? `−${Math.abs(etMm)}` : etMm}`
}

/** `225/45 R17` */
export function tyreLabel(s: WheelSetup): string {
    return `${s.tyreWidthMm}/${s.aspect} R${s.diameterIn}`
}

/** `7,5J × 17 · ET 45 · 225/45 R17` — one setup in one line. */
export function setupLine(s: WheelSetup): string {
    return `${jLabel(s.widthIn)} × ${s.diameterIn} · ${etLabel(s.etMm)} · ${tyreLabel(s)}`
}
