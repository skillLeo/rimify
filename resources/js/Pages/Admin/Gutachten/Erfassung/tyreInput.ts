/**
 * Tyres as a Gutachten prints them, typed or pasted by staff (the Gutachten rework §6, §7 step 4): one size, and „Mehrere
 * einfügen" — one size or one front/rear pair per line. Typed text is split, never the PDF read. A figure the paper does not
 * give stays not given; what does not read is said, never guessed. The server reads the same notations the same way
 * (App\Support\TyreText); both tests read one list of them (tests/Fixtures/tyre-notations.json).
 */

import { isCodeWord, normaliseCode, readCodes } from './codes'

/* Every ETRTO speed symbol, in the engine's rank order (ReferenceTables::SPEED_SYMBOLS): J and K since the client's round of 08.11.2026, §4 (D-442), (W) since his review of 11.11, D (D-453). */
export const SPEED_SYMBOLS = ['J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', '(W)', 'Y', '(Y)'] as const

/* The highest load index the ETRTO lists. */
export const MAX_LOAD_INDEX = 279

export interface TyreSpec {
    width: number
    aspect: number
    diameter: number
    /** The minimum load index the paper prints beside the size, or null where it gives none. */
    li: number | null
    /** A C tyre's second index, for twin wheels: `115/113R` → 113. Kept as printed; the first is the minimum. */
    li2: number | null
    /** The minimum speed symbol the paper prints, or null where it gives none. */
    si: string | null
    /** `HL`, `XL`, `RF`, `C`: the build the paper prints with the size. */
    marker: string | null
}

export interface TyrePair {
    front: TyreSpec
    rear: TyreSpec
}

export interface PasteLine {
    /** The line in the box, counted from 1 as staff see it. */
    line: number
    text: string
    status: 'single' | 'pair' | 'unread'
    /** The number the paper gives the entry: „Nr. 7:" → `7`. */
    number?: string
    sizes?: TyreSpec[]
    pairs?: TyrePair[]
    /** The codes printed after the sizes (D-451): the combination's, on every line the entry becomes. */
    codes?: string[]
    reason?: string
}

const SIZE = '(\\d{3})\\s*\\/\\s*(\\d{2})\\s*(?:Z?\\s*R|-)\\s*(\\d{2})(\\s*C\\b)?'
/* (92Y) · 92(Y) · 92 (W) · 115/113R · 92 · (Y) · Y — as App\\Support\\TyreText reads them. */
const MINIMUM = '(?:\\s*-?\\s*(?:\\(\\s*(\\d{1,3})\\s*([A-Z])\\s*\\)|(\\d{1,3})(?:\\s*\\/\\s*(\\d{1,3}))?\\s*(\\(\\s*[A-Z]\\s*\\)|[A-Z])?|(\\(\\s*[A-Z]\\s*\\)|[A-Z])))?'
const TYRE = new RegExp(`^${SIZE}${MINIMUM}$`)

/* A size somewhere in the text: what tells a line of tyres from a heading. */
const ANY_SIZE = /\d{3}\s*\/\s*\d{2}/

/* Between front and rear: `–`, `—`, `+`, `→`, `->`, or a hyphen — but only before a size, never before a load index (`-109/107`). */
const PAIR = /\s*(?:→|->|\+|–|—)\s*|\s*-\s*(?=(?:(?:HL|XL|RF)\s+)?\d{3}\s*\/\s*\d{2}\s*(?:Z?\s*R|-))/i

/* „Nr. 7:", „7.", „7)" at the start of an entry. */
const NUMBER = /^(?:nr\.?\s*)?(\d{1,3})\s*[:.)]\s*(?=\S)/i

/** `225/40R18 88W`, `225/40R18-88`, `245/45R18 100`, `235/50R18`, `255/35 R 18 90 W`, `HL 255/35R20 100` → its parts. */
export function readTyre(text: string): TyreSpec | null {
    let normal = text.replace(/\s+/g, ' ').trim().toUpperCase()
    let marker: string | null = null

    const prefix = normal.match(/^(HL|XL|RF)\s+(.*)$/)

    if (prefix) {
        marker = prefix[1] ?? null
        normal = prefix[2] ?? ''
    }

    const suffix = normal.match(/^(.*?)\s+(XL|HL|RF|REINF|REINFORCED|EXTRA LOAD)$/)

    if (suffix) {
        const word = suffix[2] ?? ''
        marker ??= word === 'EXTRA LOAD' ? 'XL' : word === 'REINF' || word === 'REINFORCED' ? 'RF' : word
        normal = suffix[1] ?? ''
    }

    const m = normal.match(TYRE)

    if (!m) {
        return null
    }

    // In brackets, the service description says the open category above it: above 300 km/h for Y, above 270 km/h for W (D-453).
    if (m[5] !== undefined && m[6] !== 'Y' && m[6] !== 'W') {
        return null
    }

    const plain = m[9] ?? m[10]
    const symbol = m[5] !== undefined ? `(${m[6]})` : plain === undefined ? null : plain.replace(/\s+/g, '')
    const index = m[5] ?? m[7] ?? null
    const dual = m[8] ?? null

    if ((symbol !== null && !(SPEED_SYMBOLS as readonly string[]).includes(symbol)) || (index !== null && Number(index) > MAX_LOAD_INDEX) || (dual !== null && Number(dual) > MAX_LOAD_INDEX)) {
        return null
    }

    return {
        width: Number(m[1]),
        aspect: Number(m[2]),
        diameter: Number(m[3]),
        li: index === null ? null : Number(index),
        li2: dual === null ? null : Number(dual),
        si: symbol,
        // A C tyre is built for its load: the C names it, whatever else the paper prints beside it.
        marker: m[4] !== undefined ? 'C' : marker,
    }
}

/**
 * The service description alone, as the catalogue form takes it (D-453): `97(W)`, `94W XL`, `115/113R`, `(92Y)`, `92 (W)`, `W`, `(w)` —
 * read as the end of a size is (readTyre); as App\\Support\\TyreText::service reads it. Null where it does not read.
 */
export function readService(text: string): Pick<TyreSpec, 'li' | 'li2' | 'si' | 'marker'> | null {
    const tyre = readTyre(`100/10R10 ${text.trim()}`)

    if (tyre === null || (tyre.li === null && tyre.si === null) || tyre.marker === 'C') {
        return null
    }

    return { li: tyre.li, li2: tyre.li2, si: tyre.si, marker: tyre.marker }
}

/**
 * Why a size does not read, where there is more to say than „no size": the size and the load index read, and only the
 * speed symbol is one nobody knows (`255/35R18 90X`). Null where nothing more can be said.
 */
export function whyUnread(text: string): string | null {
    const m = text.trim().toUpperCase().match(/^(?:(?:HL|XL|RF)\s+)?\d{3}\s*\/\s*\d{2}\s*Z?\s*R\s*\d{2}(?:\s*C\b)?\s*-?\s*\(?\s*\d{1,3}(?:\s*\/\s*\d{1,3})?\s*([A-Z])\s*\)?$/)

    if (m === null || (SPEED_SYMBOLS as readonly string[]).includes(m[1] ?? '')) {
        return null
    }

    return `Das Geschwindigkeitssymbol „${m[1]}“ gibt es nicht.`
}

/** As the shop and the admin write it: `225/40 R18 88W`, `HL 255/35 R20 100`, `235/50 R18`, `235/65 R16 C 115/113R`. */
export function tyreLabel(tyre: Omit<TyreSpec, 'li2'> & { li2?: number | null }): string {
    const index = tyre.li === null ? '' : `${tyre.li}${tyre.li2 === null || tyre.li2 === undefined ? '' : `/${tyre.li2}`}`
    const minimum = `${index}${tyre.si ?? ''}`
    const lead = tyre.marker && tyre.marker !== 'C' ? `${tyre.marker} ` : ''
    const c = tyre.marker === 'C' ? ' C' : ''

    return `${lead}${tyre.width}/${tyre.aspect} R${tyre.diameter}${c}${minimum === '' ? '' : ` ${minimum}`}`
}

/** The size alone, whatever the minimum: what a duplicate or a pair is compared by. */
export function sizeKey(tyre: Pick<TyreSpec, 'width' | 'aspect' | 'diameter'>): string {
    return `${tyre.width}/${tyre.aspect}R${tyre.diameter}`
}

/**
 * The box of „Mehrere einfügen": every line on its own, and a paragraph pasted whole from the paper split at each „Nr."
 * („Nr. 1: 215/35R19 – 245/30R19, 255/30R19; Nr. 2: …"). One front with several rears is one pair each.
 */
export function readPaste(text: string): PasteLine[] {
    const out: PasteLine[] = []

    text.split(/\r?\n/).forEach((raw, index) => {
        for (const segment of raw.split(/;\s*(?=nr\.?\s*\d)/i)) {
            const entry = segment.trim()

            if (entry !== '') {
                out.push(readEntry(entry, index + 1))
            }
        }
    })

    return out
}

/**
 * One size as printed, and the codes after it (D-451): `255/35R18 90W 11A K2b` → the size, then `11A`, `K2b` — the longest beginning
 * that reads as a size is the size, every word after it must be a code by itself (codes.ts), else nothing reads. Null where no size does.
 */
function sizeAndCodes(part: string): { tyre: TyreSpec; codes: string[] } | { tyre: null; why: string | null } {
    const words = part.trim().split(/\s+/)

    for (let k = words.length; k > 0; k--) {
        const tyre = readTyre(words.slice(0, k).join(' '))

        if (tyre !== null) {
            const rest = words.slice(k).map(normaliseCode).filter((word) => word !== '')
            // `255/35R18 90X`: a load index with a speed symbol nobody knows, not a code — `11A` after a size is one (no tyre carries
            // index 11). Said as the symbol it is, and nothing taken over.
            const service = rest[0]?.match(/^(\d{2,3})([A-Z])$/)

            if (service && tyre.li === null && tyre.si === null && Number(service[1]) >= 50) {
                return { tyre: null, why: whyUnread(`${words.slice(0, k).join(' ')} ${rest[0]}`) }
            }

            return rest.every(isCodeWord) ? { tyre, codes: rest } : { tyre: null, why: `„${words.slice(k).join(' ')}“ hinter der Größe ist kein Code.` }
        }
    }

    return { tyre: null, why: null }
}

/** The parts of a line split at its commas: each a size with its codes, or — where it holds no size — codes alone (`…, Nicht 330D`). */
function readParts(text: string): { tyres: (TyreSpec | null)[]; bad: string; why: string | null; codes: string[] } {
    const tyres: (TyreSpec | null)[] = []
    const codes: string[] = []
    let bad = ''
    let why: string | null = null

    for (const part of text.split(/\s*[,;]\s*/).filter((p) => p.trim() !== '')) {
        if (!ANY_SIZE.test(part)) {
            codes.push(...readCodes(part, []))
            continue
        }

        const read = sizeAndCodes(part)

        if (read.tyre === null) {
            tyres.push(null)
            bad ||= part
            why ??= read.why
            continue
        }

        tyres.push(read.tyre)
        codes.push(...read.codes)
    }

    return { tyres, bad, why, codes: [...new Set(codes)] }
}

function readEntry(entry: string, line: number): PasteLine {
    const numbered = entry.match(NUMBER)
    const number = numbered?.[1]
    const body = numbered ? entry.slice(numbered[0].length) : entry
    const base = { line, text: entry, ...(number === undefined ? {} : { number }) }

    if (!ANY_SIZE.test(body)) {
        return { ...base, status: 'unread', reason: 'Keine Reifengröße erkannt.' }
    }

    const parts = body.split(PAIR).map((part) => part.trim())

    if (parts.length > 2) {
        return { ...base, status: 'unread', reason: 'Mehr als zwei Größen in einer Zeile.' }
    }

    if (parts.length === 2) {
        const front = sizeAndCodes(parts[0] ?? '')
        const rears = readParts(parts[1] ?? '')

        if (front.tyre === null) {
            return { ...base, status: 'unread', reason: whyUnread(parts[0] ?? '') ?? front.why ?? 'Die vordere Größe ist nicht lesbar.' }
        }

        if (rears.tyres.length === 0 || rears.tyres.some((rear) => rear === null)) {
            return { ...base, status: 'unread', reason: whyUnread(rears.bad) ?? rears.why ?? 'Die hintere Größe ist nicht lesbar.' }
        }

        const codes = [...new Set([...front.codes, ...rears.codes])]

        return { ...base, status: 'pair', pairs: (rears.tyres as TyreSpec[]).map((rear) => ({ front: front.tyre, rear })), ...(codes.length ? { codes } : {}) }
    }

    const read = readParts(body)

    if (read.tyres.length === 0 || read.tyres.some((size) => size === null)) {
        const why = whyUnread(read.bad || body) ?? read.why

        return { ...base, status: 'unread', reason: why ?? (read.tyres.every((size) => size === null) ? 'Keine Reifengröße erkannt.' : 'Nicht jede Größe in der Zeile ist lesbar.') }
    }

    return { ...base, status: 'single', sizes: read.tyres as TyreSpec[], ...(read.codes.length ? { codes: read.codes } : {}) }
}

/**
 * The paste against the wheels of this combination (the operator's brief of 07.11.2026, §3): a size alone stands for both axles
 * only where both wheels share its diameter; a pair's sides each on their own wheel. What does not fit is an error line, with the
 * reason, and left out like one that does not read.
 */
export function checkPaste(lines: PasteLine[], wheels: { front: number; rear: number }): PasteLine[] {
    const inch = (value: number): string => String(value).replace('.', ',')
    const misfit = (tyre: TyreSpec, wheel: number, side: string): string | null => (Math.abs(tyre.diameter - wheel) < 0.001 ? null : `Passt nicht: Die Felge ${side} hat ${inch(wheel)} Zoll, der Reifen R${inch(tyre.diameter)}.`)

    return lines.map((line) => {
        for (const size of line.sizes ?? []) {
            if (Math.abs(wheels.front - wheels.rear) >= 0.001) {
                return { ...line, status: 'unread' as const, reason: `Eine Größe allein geht hier nicht: Die Felgen haben vorne ${inch(wheels.front)} und hinten ${inch(wheels.rear)} Zoll. Schreib vorne + hinten.`, sizes: undefined }
            }

            const why = misfit(size, wheels.front, 'vorne und hinten')

            if (why !== null) {
                return { ...line, status: 'unread' as const, reason: why, sizes: undefined }
            }
        }

        for (const pair of line.pairs ?? []) {
            const why = misfit(pair.front, wheels.front, 'vorne') ?? misfit(pair.rear, wheels.rear, 'hinten')

            if (why !== null) {
                return { ...line, status: 'unread' as const, reason: why, pairs: undefined }
            }
        }

        return line
    })
}

/**
 * What „Mehrere einfügen" adds: each read line as vorne + hinten — a size alone on both sides, a pair as a pair —, with the codes
 * printed after it (D-451), on each.
 */
export function pasteToSides(lines: PasteLine[]): { front: string; rear: string; codes: string[] }[] {
    const out: { front: string; rear: string; codes: string[] }[] = []

    for (const line of lines) {
        for (const size of line.sizes ?? []) {
            out.push({ front: tyreLabel(size), rear: tyreLabel(size), codes: [...(line.codes ?? [])] })
        }

        for (const pair of line.pairs ?? []) {
            out.push({ front: tyreLabel(pair.front), rear: tyreLabel(pair.rear), codes: [...(line.codes ?? [])] })
        }
    }

    return out
}

/**
 * A kW band as the paper prints it: `85-142`, or one figure for one power (`170 kW`, the §4 Z3). Undefined where nothing is typed,
 * null where it does not read. The same reading as the server's (EntryLinesRequest::band).
 */
export function parseKwBand(text: string): { kw_min: number; kw_max: number } | null | undefined {
    const trimmed = text.replace(/\s+/g, ' ').trim()

    if (trimmed === '') {
        return undefined
    }

    const m = trimmed.match(/^(\d{1,4})(?:\s*[-–]\s*(\d{1,4}))?(?:\s*kW)?$/i)

    if (!m) {
        return null
    }

    const min = Number(m[1])
    const max = Number(m[2] ?? m[1])

    return min >= 1 && max <= 1000 && min <= max ? { kw_min: min, kw_max: max } : null
}
