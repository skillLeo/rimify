/**
 * The Felgenrechner, rebuilt close to the client's example (his #11: „replicate it as closely as possible“; the
 * operator's brief of 29.10.2026, Batch 2): two setups — the current rim and the new one, each a width, an ET and a
 * spacer — and how far the new rim's inner and outer edges sit from the current ones. Arithmetic only; it judges
 * nothing (ACCURACY.md §6).
 *
 * Measured from the hub's face, towards the car positive: the inner edge sits at width/2 + ET − spacer, the outer edge
 * at width/2 − ET + spacer, the width in millimetres at 25,4 to the inch. Each change is new − current.
 *
 * Everything is counted in whole hundredths of a millimetre — a tenth of an inch is 254 of them, half of it 127 — and
 * rounded once, half away from zero, to the tenth the page shows. 6,35 mm shows as „6,4 mm“; a float would say 6,3.
 */

import { NNBSP, withUnit } from '../format'
import { formatNumber } from './num'

export interface EtSetup {
    widthIn: number
    etMm: number
    spacerMm: number
}

export interface EtState {
    current: EtSetup
    next: EtSetup
}

export type EtSide = keyof EtState
export type EtField = keyof EtSetup

/** What each field offers: rim widths in half inches, ET and spacer in whole millimetres. */
export const RANGES: Record<EtField, { min: number; max: number; step: number }> = {
    widthIn: { min: 4, max: 13, step: 0.5 },
    etMm: { min: -50, max: 80, step: 1 },
    spacerMm: { min: 0, max: 50, step: 1 },
}

/** His example's first view: 8 Zoll at ET 45 against 8 Zoll at ET 40, no spacer. */
export const DEFAULT_ET_STATE: EtState = {
    current: { widthIn: 8, etMm: 45, spacerMm: 0 },
    next: { widthIn: 8, etMm: 40, spacerMm: 0 },
}

export const ET_SIDES: { key: EtSide; title: string }[] = [
    { key: 'current', title: 'Aktuelle Felge' },
    { key: 'next', title: 'Neue Felge' },
]

/* ── The arithmetic, in hundredths of a millimetre ───────────────────────────── */

/** Half the rim's width: tenths of an inch × 127 hundredths. A width the form offers has at most one decimal. */
function halfWidth(widthIn: number): number {
    return Math.round(widthIn * 10) * 127
}

/** The inner edge's distance from the hub's face, towards the car. */
export function innerEdge(s: EtSetup): number {
    return halfWidth(s.widthIn) + (s.etMm - s.spacerMm) * 100
}

/** The outer edge's distance from the hub's face, away from the car. */
export function outerEdge(s: EtSetup): number {
    return halfWidth(s.widthIn) - (s.etMm - s.spacerMm) * 100
}

/** How far each edge of the new rim moves against the current one, in hundredths of a millimetre. */
export function edgeChange(state: EtState): { inner: number; outer: number } {
    return {
        inner: innerEdge(state.next) - innerEdge(state.current),
        outer: outerEdge(state.next) - outerEdge(state.current),
    }
}

/** Hundredths to the tenths the page shows, a half away from zero: 635 → 64, −635 → −64. */
export function roundToTenths(hundredths: number): number {
    return Math.sign(hundredths) * Math.floor((Math.abs(hundredths) + 5) / 10)
}

/* ── How it is written (R-10) ────────────────────────────────────────────────── */

/** Tenths of a millimetre as „6,4 mm“ — the whole millimetres and the tenth apart, so no float is ever rounded. */
export function mmText(tenths: number): string {
    const whole = Math.floor(Math.abs(tenths) / 10)

    return withUnit(`${formatNumber(whole, 0)},${Math.abs(tenths) % 10}`, 'mm')
}

/** „+6,4 mm“ · „−10,0 mm“ · „0,0 mm“, with a real minus, for the drawing's arrows. */
export function signedMm(tenths: number): string {
    return `${tenths > 0 ? '+' : tenths < 0 ? '−' : ''}${mmText(tenths)}`
}

export function innerSentence(tenths: number): string {
    if (tenths === 0) {
        return 'Innen: unverändert'
    }

    return `Innen: ${mmText(tenths)} ${tenths > 0 ? 'näher am Fahrwerk' : 'weiter vom Fahrwerk entfernt'}`
}

export function outerSentence(tenths: number): string {
    if (tenths === 0) {
        return 'Außen: unverändert'
    }

    return `Außen: ${mmText(tenths)} ${tenths > 0 ? 'weiter heraus' : 'weiter hinein'}`
}

/** `8,5J` · `8J` */
export function widthLabel(widthIn: number): string {
    return `${Number.isInteger(widthIn) ? widthIn : String(widthIn).replace('.', ',')}J`
}

/** `ET 45` · `ET −10` */
export function etText(etMm: number): string {
    return `ET${NNBSP}${etMm < 0 ? `−${Math.abs(etMm)}` : etMm}`
}

/** `8,5J · ET 40` and, with a spacer, `· Distanzscheibe 10 mm` — the label before the value, as in `ET 40`. */
export function setupLine(s: EtSetup): string {
    return `${widthLabel(s.widthIn)} · ${etText(s.etMm)}${s.spacerMm > 0 ? ` · Distanzscheibe ${withUnit(s.spacerMm, 'mm')}` : ''}`
}

/* ── The fields ──────────────────────────────────────────────────────────────── */

function offered(field: EtField, value: number): boolean {
    const { min, max, step } = RANGES[field]

    return Number.isFinite(value) && value >= min && value <= max && Number.isInteger(Math.round(value * 100) / (step * 100))
}

/**
 * A typed figure no further key can bring into range — above the field's highest, or below its lowest with the minus
 * typed: said at once. A half-typed `8,`, or a `1` on its way to 12, is no error yet.
 */
export function pastRange(field: EtField, typed: string): boolean {
    const text = typed
        .trim()
        .replace(/\s*(j|mm)$/i, '')
        .replace(/^[−–]/, '-')
        .replace(/^\+/, '')
        .replace(',', '.')

    if (!/^-?\d+(\.\d*)?$/.test(text)) {
        return false
    }

    const value = Number(text)
    const { min, max } = RANGES[field]

    return value > max || (value < 0 && value < min)
}

export function isEtSetup(s: EtSetup): boolean {
    return offered('widthIn', s.widthIn) && offered('etMm', s.etMm) && offered('spacerMm', s.spacerMm)
}

/** One step up (+1) or down (−1), never past the field's ends. */
export function stepped(field: EtField, value: number, direction: 1 | -1): number {
    const { min, max, step } = RANGES[field]
    const next = Math.round((value + direction * step) * 10) / 10

    return Math.min(max, Math.max(min, next))
}

/**
 * A typed width: `8,5`, `8.5`, `9`, the shop's own `8,5J` or `8,50`, in half inches the form offers — else null, and the
 * field says so.
 */
export function parseWidth(typed: string): number | null {
    const text = typed.trim().replace(/\s*j$/i, '').replace(',', '.')

    if (!/^\d{1,2}(\.\d0?)?$/.test(text)) {
        return null
    }

    const value = Number(text)

    return offered('widthIn', value) ? value : null
}

/** A typed ET or spacer: a whole number — any minus (`-`, `−`, `–`), a plus, `35,0` and `45 mm` taken as they mean. */
export function parseMm(field: 'etMm' | 'spacerMm', typed: string): number | null {
    const text = typed
        .trim()
        .replace(/\s*mm$/i, '')
        .replace(/^[−–]/, '-')
        .replace(/^\+/, '')
        .replace(/[.,]0$/, '')

    if (!/^-?\d{1,3}$/.test(text)) {
        return null
    }

    const value = Number(text)

    return offered(field, value) ? value : null
}

/* ── The address: `?rechner=8.5x40x0_9.5x45x10` ──────────────────────────────── */

const SETUP_PATTERN = /^(\d{1,2}(?:\.\d)?)x(-?\d{1,2})x(\d{1,2})$/

function encodeSetup(s: EtSetup): string {
    return `${s.widthIn}x${s.etMm}x${s.spacerMm}`
}

function decodeSetup(text: string): EtSetup | null {
    const m = SETUP_PATTERN.exec(text)

    if (m === null) {
        return null
    }

    const s: EtSetup = { widthIn: Number(m[1]), etMm: Number(m[2]), spacerMm: Number(m[3]) }

    return isEtSetup(s) ? s : null
}

export function encodeEtState(state: EtState): string {
    return `${encodeSetup(state.current)}_${encodeSetup(state.next)}`
}

/** A comparison from the address, or null — a link the form could not have written opens on the defaults. */
export function decodeEtState(param: string | null | undefined): EtState | null {
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
