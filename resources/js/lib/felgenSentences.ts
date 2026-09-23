/**
 * What the Felgenrechner says, in plain German, before it shows a number (ACCURACY.md §6, brief W6):
 * one sentence per result, informal *du*, every figure read from the one `FelgenModel`. Nothing
 * here is a verdict — no *zulässig*, *passt*, *legal*, *eintragungsfrei*, *erlaubt* or *OK*: the
 * sentences say what moves and by how much, and point at the papers that decide.
 *
 * Absolute values are whole millimetres and say *rechnerisch*; a percentage has two decimals, a
 * speed one. Every sentence is a plain string; `valueParts` marks the figures in it, so a page can
 * keep the browser's translator off them (`translate="no"`: Chrome once turned "5,5 J" into
 * "5.5 years").
 */

import { decimal, withUnit } from '../format'
import { kmhText, percentText, SPEEDO_MAX_OVER_KMH, SPEEDO_MAX_OVER_PERCENT, wholeMmText, type FelgenModel } from './felgenGeometry'

/** When the tyre and the rim of a side do not belong together (felgenGeometry `rimSuitsTyre`). */
export const IMPLAUSIBLE = 'Diese Reifenbreite und diese Maulweite gehören so nicht zusammen – prüf die Angaben.'

/**
 * The speedometer rule, quoted (UN R39 para. 5.4 — accuracy-research-motec.md §3b). It is a rule
 * about the speedometer, not a statement about this comparison.
 */
export const R39_NOTE = `Der Tacho darf nie weniger anzeigen als die tatsächliche Geschwindigkeit, höchstens ${withUnit(SPEEDO_MAX_OVER_PERCENT, '%')} + ${withUnit(SPEEDO_MAX_OVER_KMH, 'km/h')} mehr (UN-Regelung Nr. 39).`

/**
 * Only when the new size makes the speedometer read less than before: that moves it towards the
 * one thing R39 forbids, reading below the true speed. The Gutachten's Auflagen name the
 * speedometer check (ABE 53810, Auflagen G01/G03 — accuracy-research-motec.md §3b), so the line
 * points there and decides nothing.
 */
export const SPEEDO_ADJUST_NOTE = 'Dann kann eine Tachoangleichung nötig werden – das steht im Gutachten.'

const DASH = '–'
const HUNDRED = withUnit(100, 'km/h')

function mm(value: number): string {
    return withUnit(decimal(Math.abs(value), 0), 'mm')
}

/** `Die neue Felge steht rechnerisch 23 mm weiter außen – näher am Kotflügel.` */
export function outerSentence(m: FelgenModel): string {
    const shown = m.outer.shownMm

    if (!Number.isFinite(shown)) {
        return DASH
    }

    if (shown === 0) {
        return 'Die Außenkante bleibt rechnerisch, wo sie ist.'
    }

    return shown > 0
        ? `Die neue Felge steht rechnerisch ${mm(shown)} weiter außen – näher am Kotflügel.`
        : `Die neue Felge steht rechnerisch ${mm(shown)} weiter innen – weiter weg vom Kotflügel.`
}

/** `Die Innenkante rückt rechnerisch 3 mm näher ans Federbein.` */
export function innerSentence(m: FelgenModel): string {
    const shown = m.inner.shownMm

    if (!Number.isFinite(shown)) {
        return DASH
    }

    if (shown === 0) {
        return 'Die Innenkante bleibt rechnerisch, wo sie ist.'
    }

    return shown > 0
        ? `Die Innenkante rückt rechnerisch ${mm(shown)} näher ans Federbein.`
        : `Die Innenkante rückt rechnerisch ${mm(shown)} weiter weg vom Federbein.`
}

/** `Das Rad wird rechnerisch 6 mm größer im Durchmesser (+0,91 %).` */
export function sizeSentence(m: FelgenModel): string {
    const shown = m.shownDiameterDeltaMm
    const percent = percentText(m.circumferenceDeltaPercent)

    if (!Number.isFinite(shown) || !Number.isFinite(m.shownPercent)) {
        return DASH
    }

    if (shown !== 0) {
        return `Das Rad wird rechnerisch ${mm(shown)} ${shown > 0 ? 'größer' : 'kleiner'} im Durchmesser (${percent}).`
    }

    // Under half a millimetre: said as such, never as a figure the percentage would contradict.
    if (m.diameterDeltaMm !== 0) {
        return `Das Rad wird rechnerisch weniger als ${mm(1)} ${m.diameterDeltaMm > 0 ? 'größer' : 'kleiner'} im Durchmesser (${percent}).`
    }

    return `Der Durchmesser bleibt rechnerisch gleich (${percent}).`
}

/** `Zeigt der Tacho 100 km/h, fährst du rechnerisch 100,9 km/h – 0,9 km/h mehr als mit der bisherigen Größe.` */
export function speedSentence(m: FelgenModel): string {
    if (!Number.isFinite(m.shownSpeedKmH)) {
        return DASH
    }

    const lead = `Zeigt der Tacho ${HUNDRED}, fährst du rechnerisch ${kmhText(m.shownSpeedKmH)}`
    const raw = m.speedAt100KmH - 100

    if (raw === 0) {
        return `${lead} – genauso schnell wie mit der bisherigen Größe.`
    }

    if (m.shownSpeedDeltaKmH === 0) {
        return `${lead} – weniger als ${kmhText(0.1)} Unterschied zur bisherigen Größe.`
    }

    return `${lead} – ${kmhText(Math.abs(m.shownSpeedDeltaKmH))} ${raw > 0 ? 'mehr' : 'weniger'} als mit der bisherigen Größe.`
}

/** What the speedometer does against before, judged on the printed percentage (never a hidden digit). */
export function speedoDirection(m: FelgenModel): string | null {
    if (!Number.isFinite(m.shownPercent)) {
        return null
    }

    if (m.shownPercent === 0) {
        return 'Rechnerisch ändert sich die Tachoanzeige nicht.'
    }

    return `Bei gleicher Geschwindigkeit zeigt der Tacho also ${m.shownPercent > 0 ? 'weniger' : 'mehr'} an als bisher.`
}

/** The Tachoangleichung line, or null: only when the speedometer now reads less than before. */
export function speedoAdjust(m: FelgenModel): string | null {
    return Number.isFinite(m.shownPercent) && m.shownPercent > 0 ? SPEEDO_ADJUST_NOTE : null
}

/** `Außendurchmesser rechnerisch 634 mm → 640 mm · Abrollumfang +0,91 %` */
export function sizeFigures(m: FelgenModel): string {
    return `Außendurchmesser rechnerisch ${wholeMmText(m.current.diameterMm)} → ${wholeMmText(m.next.diameterMm)} · Abrollumfang ${percentText(m.circumferenceDeltaPercent)}`
}

/* ── Keeping the translator off the figures ───────────────────────────────────── */

export interface TextPart {
    text: string
    /** A figure with its unit or a technical code: rendered with `translate="no"`. */
    value: boolean
}

/*
 * A figure as this site writes it (R-10, format.ts): a tyre size `225/45 R17`, an ET `ET 45` or
 * `ET −10`, a rim width `8,5J`, or a number with an optional sign and unit — `23 mm`, `+0,91 %`,
 * `100,9 km/h`, `17 Zoll`, `1.993 mm`, `15.1`. The unit follows a (narrow no-break) space.
 */
const VALUE = /\d{3}\/\d{2}\s?R\d{2}|ET\s[−-]?\d+|[+−±]?\d+(?:[.,]\d+)*(?:J|\s(?:mm|km\/h|%|Zoll|kg))?/gu

/** Splits a sentence into prose and figures, in order; joined, the parts are the sentence again. */
export function valueParts(text: string): TextPart[] {
    const parts: TextPart[] = []
    let last = 0

    for (const match of text.matchAll(VALUE)) {
        const at = match.index ?? 0

        if (at > last) {
            parts.push({ text: text.slice(last, at), value: false })
        }

        parts.push({ text: match[0], value: true })
        last = at + match[0].length
    }

    if (last < text.length) {
        parts.push({ text: text.slice(last), value: false })
    }

    return parts
}
