/**
 * *Was die Zahlen auf einer Felge bedeuten* (ACCURACY.md §5, D9): the pure part of the explainer.
 *
 * Everything the section says comes from the hero product's `facts`, which the server formats
 * through GermanFormat (R-10) from the hero configuration, and from the photograph's measured
 * anchors (§4). Nothing here invents a value: a fact that is missing or empty drops its token, a
 * token without a measured anchor draws nothing on the photograph, and the KBA token exists only
 * when the server says the photographed stamp belongs to this configuration (CLAUDE.md §2 — the
 * explainer may be silent, never confidently wrong).
 *
 * The definitions are the research report's (`docs/reviews/accuracy-research-motec.md` §3 (d),
 * ISO 3911 / ETRTO terms), one sentence each: technical, never a verdict.
 */

import type { ImageManifest, WheelAnchors } from '../Ui/Picture.vue'

/** The hero configuration's values as the server formats them (`HeroProduct.facts`, §4). */
export interface RimFacts {
    /** `8,5J` */
    width: string
    /** `19` */
    diameter: string
    /** `ET 45` */
    et: string
    /** `5 × 112` */
    boltPattern: string
    /** `66,6 mm` */
    centreBore: string
    /** `53810`, only when the photographed stamp belongs to this configuration; else null. */
    kba?: string | null
}

/**
 * What the explainer reads from `hero.product`. Structural on purpose: the hero payload may carry
 * more (the spec line, the price) and the page passes it whole.
 */
export interface RimCodeProduct {
    brand?: string
    name?: string
    finish?: string
    facts?: RimFacts | null
    imageManifest?: ImageManifest | null
}

export type RimKey = 'width' | 'diameter' | 'et' | 'lk' | 'mlb' | 'kba'

/** The features the cross-section draws. KBA is a marking, not a dimension: it has none. */
export type SchematicKey = Exclude<RimKey, 'kba'>

export interface RimToken {
    key: RimKey
    /** What the chip shows, as it is written on a wheel or in a Gutachten: `ET 45`, `LK 5 × 112`. */
    text: string
    /** The German term of art the token stands for. */
    term: string
    /** One sentence: what the value is. */
    sentence: string
}

/** Joins a prefix and its value so the pair never breaks across a line. */
const NBSP = ' '

const clean = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()

    return trimmed === '' ? null : trimmed
}

/**
 * The approval mark, digits only. Five digits are an ABE, six a Teiletypgenehmigung (KBA PM
 * 18/2025); anything else is not a KBA number we can explain, and the token stays away.
 */
export function kbaNumber(value: unknown): string | null {
    const digits = clean(value)

    return digits !== null && /^\d{5,6}$/.test(digits) ? digits : null
}

/** The facts, or null when there are none worth a section: no facts, no explainer (§4). */
export function rimFactsOf(product: RimCodeProduct | null | undefined): RimFacts | null {
    const facts = product?.facts ?? null

    if (facts === null || typeof facts !== 'object') {
        return null
    }

    return rimTokens(facts).length > 0 ? facts : null
}

/** The word order of `hier …` in the diameter sentence: `19 Zoll`, never `19 Zoll Zoll`. */
function inches(diameter: string): string {
    return /zoll/i.test(diameter) ? diameter : `${diameter}${NBSP}Zoll`
}

/**
 * The sentence for the approval mark. It says what the number identifies and that the car must
 * be named in the approval, with its Auflagen — never whether the wheel may go on this car.
 */
function kbaSentence(kba: string): string {
    const approval = kba.length === 5 ? 'Allgemeinen Betriebserlaubnis (ABE)' : 'Teiletypgenehmigung (TTG)'
    const short = kba.length === 5 ? 'ABE' : 'TTG'

    return (
        `Die KBA-Nummer ${kba} auf dem Rad ist das Genehmigungszeichen der ${approval}, die das Kraftfahrt-Bundesamt ` +
        `für genau diesen Radtyp erteilt hat; ob du das Rad an deinem Auto fahren darfst, hängt davon ab, ob die ${short} ` +
        'dein Fahrzeug nennt – mit den Auflagen, die sie dafür stellt.'
    )
}

/**
 * The token row, in the order the values are read off a wheel: `8,5J` · `19` · `ET 45` ·
 * `LK 5 × 112` · `MLB 66,6 mm` · `KBA 53810`. A fact the server did not send drops its token.
 */
export function rimTokens(facts: RimFacts): RimToken[] {
    const out: RimToken[] = []
    const width = clean(facts.width)
    const diameter = clean(facts.diameter)
    const et = clean(facts.et)
    const bolt = clean(facts.boltPattern)
    const bore = clean(facts.centreBore)
    const kba = kbaNumber(facts.kba)

    if (width !== null) {
        out.push({
            key: 'width',
            text: width,
            term: 'Maulweite',
            sentence:
                `Die Maulweite ist der Abstand zwischen den Innenseiten der beiden Felgenhörner in Zoll – hier ${width}; ` +
                'das „J“ bezeichnet die Form des Felgenhorns, nicht die Breite.',
        })
    }

    if (diameter !== null) {
        out.push({
            key: 'diameter',
            text: diameter,
            term: 'Felgendurchmesser',
            sentence: `Der Felgendurchmesser – hier ${inches(diameter)} – wird am Wulstsitz gemessen, dort, wo der Reifen aufliegt, nicht am Felgenhorn.`,
        })
    }

    if (et !== null) {
        out.push({
            key: 'et',
            text: et,
            term: 'Einpresstiefe (ET)',
            sentence:
                `Die Einpresstiefe ist der Abstand in Millimetern von der Felgenmitte bis zur Anlagefläche des Rades an der Nabe – hier ${et}; ` +
                'je kleiner die ET, desto weiter steht das Rad nach außen.',
        })
    }

    if (bolt !== null) {
        out.push({
            key: 'lk',
            text: `LK${NBSP}${bolt}`,
            term: 'Lochkreis',
            sentence: `Der Lochkreis ist der Durchmesser des Kreises durch die Mitten der Schraubenlöcher und wird mit der Lochzahl angegeben – hier ${bolt}.`,
        })
    }

    if (bore !== null) {
        out.push({
            key: 'mlb',
            text: `MLB${NBSP}${bore}`,
            term: 'Mittenlochbohrung',
            sentence:
                `Die Mittenlochbohrung – hier ${bore} – ist die Öffnung in der Radmitte, mit der das Rad auf der Nabe zentriert wird; ` +
                'ist sie größer als die Nabe, gleicht ein Zentrierring das aus.',
        })
    }

    if (kba !== null) {
        out.push({ key: 'kba', text: `KBA${NBSP}${kba}`, term: 'KBA-Nummer', sentence: kbaSentence(kba) })
    }

    return out
}

/**
 * Which side of the rim centre plane the Anlagefläche lies on, read from the formatted ET:
 * positive → outboard (toward the fender), negative → inboard, zero → on the plane. Null when the
 * value cannot be read — then the cross-section draws no ET dimension at all (fail closed).
 */
export type EtSide = 'outboard' | 'inboard' | 'plane'

export function etSide(et: string | null | undefined): EtSide | null {
    const match = /([−–-])?\s*(\d+(?:[.,]\d+)?)/.exec(et ?? '')

    if (match === null || match[2] === undefined) {
        return null
    }

    const magnitude = Number(match[2].replace(',', '.'))

    if (!Number.isFinite(magnitude)) {
        return null
    }

    if (magnitude === 0) {
        return 'plane'
    }

    return match[1] === undefined ? 'outboard' : 'inboard'
}

/* ── The photograph ─────────────────────────────────────────────────────────────── */

/** The frame the explainer shows and the anchors measured on it; null draws no photograph at all. */
export interface PhotoFrame {
    image: ImageManifest
    anchors: WheelAnchors
    /** The approval number read off the photograph, when there is one. */
    stamp: string | null
}

/**
 * The shadow-free `bare` frame when the pipeline wrote one (it shares the square frame's geometry,
 * so the square frame's anchors apply to it), else the square frame itself. Without measured
 * anchors there is nothing to point at, and the explainer shows the cross-section only (§4).
 */
export function photoFrame(manifest: ImageManifest | null | undefined): PhotoFrame | null {
    if (manifest === null || manifest === undefined) {
        return null
    }

    const image = manifest.bare ?? manifest
    const anchors = manifest.bare?.anchors ?? manifest.anchors

    if (anchors === undefined || !finitePoint(anchors.centre)) {
        return null
    }

    return { image, anchors, stamp: kbaNumber(manifest.stamp) }
}

function finitePoint(p: { x: number; y: number } | undefined): boolean {
    return p !== undefined && Number.isFinite(p.x) && Number.isFinite(p.y)
}

export type PhotoShape =
    | { key: 'lk'; kind: 'circle'; dashed: true; cx: number; cy: number; r: number; label: string }
    | { key: 'mlb'; kind: 'circle'; dashed: false; cx: number; cy: number; r: number; label: string }
    | { key: 'kba'; kind: 'rect'; x: number; y: number; width: number; height: number; label: string }

/** The label under a highlighted feature, as fractions of the frame (left edge centred on `x`). */
export interface PhotoLabel {
    text: string
    x: number
    y: number
}

/**
 * The shape that marks a feature on the photograph, in the frame's own pixels (the overlay's
 * viewBox is the frame's width × height, so a shape lands where the anchor was measured):
 *
 * - Lochkreis: a dashed circle through the bolt-hole centres (`pcd`);
 * - Mittenlochbohrung: the cap that covers it (`bore`) — the bore itself is behind the cap;
 * - KBA: a box around the stamp (`kba`), a little larger than the stamp so it frames it, and only
 *   when the stamp on the photograph is the number the token explains.
 *
 * Width, diameter and ET have no feature a front view shows: null.
 */
export function photoShape(key: RimKey, frame: PhotoFrame | null, kba: string | null = null): PhotoShape | null {
    if (frame === null) {
        return null
    }

    const { width: w, height: h } = frame.image
    const a = frame.anchors

    if (key === 'lk' && a.pcd !== undefined && circleOk(a.pcd)) {
        return { key, kind: 'circle', dashed: true, cx: a.pcd.x * w, cy: a.pcd.y * h, r: a.pcd.r * w, label: 'Lochkreis' }
    }

    if (key === 'mlb' && a.bore !== undefined && circleOk(a.bore)) {
        return { key, kind: 'circle', dashed: false, cx: a.bore.x * w, cy: a.bore.y * h, r: a.bore.r * w, label: 'hinter der Nabenkappe' }
    }

    if (key === 'kba' && a.kba !== undefined && kba !== null && frame.stamp === kba && boxOk(a.kba)) {
        // The frame stands off the stamp by half its height on every side.
        const pad = (a.kba.h * h) / 2
        const width = a.kba.w * w + 2 * pad
        const height = a.kba.h * h + 2 * pad

        return { key, kind: 'rect', x: a.kba.x * w - width / 2, y: a.kba.y * h - height / 2, width, height, label: `KBA${NBSP}${kba}` }
    }

    return null
}

function circleOk(c: { x: number; y: number; r: number }): boolean {
    return finitePoint(c) && Number.isFinite(c.r) && c.r > 0
}

function boxOk(b: { x: number; y: number; w: number; h: number }): boolean {
    return finitePoint(b) && Number.isFinite(b.w) && Number.isFinite(b.h) && b.w > 0 && b.h > 0
}

/** Where the shape's label sits: centred under the shape, as fractions of the frame. */
export function photoLabel(shape: PhotoShape, frame: PhotoFrame): PhotoLabel {
    const { width: w, height: h } = frame.image

    if (shape.kind === 'circle') {
        return { text: shape.label, x: shape.cx / w, y: (shape.cy + shape.r) / h }
    }

    return { text: shape.label, x: (shape.x + shape.width / 2) / w, y: (shape.y + shape.height) / h }
}

/**
 * The line under the photograph: what is marked, or where to look instead.
 *
 * `etDrawn` is the cross-section's own answer (`RimCode`'s `showEt`): it draws the ET dimension for
 * a positive ET only. For any other ET the line may not send the reader to a dimension that is not
 * there, so it says only that the photograph does not show it (CLAUDE.md §2 — silent, never
 * confidently wrong). The Maulweite, the Felgendurchmesser, the Lochkreis and the
 * Mittenlochbohrung are always drawn, so their lines point at the drawing unconditionally.
 */
export function photoHint(key: RimKey, marked: boolean, etDrawn = true): string {
    switch (key) {
        case 'width':
            return 'Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt die Maulweite.'
        case 'diameter':
            return 'Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt den Felgendurchmesser.'
        case 'et':
            return etDrawn ? 'Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt die Einpresstiefe.' : 'Auf dem Foto nicht zu sehen.'
        case 'lk':
            return marked ? 'Gestrichelt: der Kreis durch die Mitten der Schraubenlöcher.' : 'Auf dem Foto nicht markiert – die Schnittzeichnung zeigt den Lochkreis.'
        case 'mlb':
            return marked
                ? 'Markiert: die Nabenkappe – die Mittenlochbohrung liegt dahinter.'
                : 'Auf dem Foto nicht markiert – die Schnittzeichnung zeigt die Mittenlochbohrung.'
        case 'kba':
            // The cross-section has no KBA number, so the unmarked line names the wheel itself
            // rather than sending the reader to a drawing that cannot show it.
            return marked ? 'Markiert: die KBA-Nummer auf dem Rad.' : 'Auf dem Foto nicht markiert – die KBA-Nummer steht auf dem Rad selbst.'
    }
}

/** The cross-section's feature for a token; the KBA number has none. */
export function schematicKey(key: RimKey): SchematicKey | null {
    return key === 'kba' ? null : key
}
