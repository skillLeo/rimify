/**
 * Reading the two key numbers out of a photographed Zulassungsbescheinigung Teil I (F5).
 *
 * The OCR text is noisy: a `0` comes back as an `O`, a `1` as an `l`, a field label as `2 .1`.
 * The parser looks for the labels the document prints — `2.1` for the HSN, `2.2` for the field
 * whose first three characters are the TSN — and reads the value that follows each. Without a
 * label nothing is read: a four-digit number found somewhere on a page is not an HSN, and a guess
 * here would be confirmed by a customer who trusts the machine (governing rule: never confidently
 * wrong). Whatever is found is shown for confirmation and can be edited before it is used.
 */

export interface KeyNumbers {
    hsn: string | null
    tsn: string | null
}

/* The letters an OCR engine reads for a digit on a printed form. Only the unambiguous ones. */
const DIGIT_LOOKALIKES: Readonly<Record<string, string>> = { O: '0', Q: '0', I: '1', L: '1' }

/*
 * Field 2.1: the label, an optional separator, then four characters. The lookbehind keeps `12.1`
 * and `2.2.1` from matching; the lookahead keeps `2.10` from matching.
 */
const HSN_FIELD = /(?<![\d.,])2\s*[.,]\s*1(?!\d)[\s:.\-–]*([0-9OQIL]{4})(?![0-9A-Z])/i

/* Field 2.2: the first three characters after the label are the TSN. */
const TSN_FIELD = /(?<![\d.,])2\s*[.,]\s*2(?!\d)[\s:.\-–]*([A-Z0-9]{3})/i

export function parseKeyNumbers(text: string): KeyNumbers {
    const upper = text.toUpperCase()

    const hsnMatch = HSN_FIELD.exec(upper)
    const tsnMatch = TSN_FIELD.exec(upper)

    const hsn = hsnMatch?.[1] === undefined ? null : digitsOnly(hsnMatch[1])
    const tsn = tsnMatch?.[1] === undefined ? null : tsnMatch[1]

    return { hsn: hsn !== null && isHsn(hsn) ? hsn : null, tsn: tsn !== null && isTsn(tsn) ? tsn : null }
}

function digitsOnly(raw: string): string {
    return raw
        .split('')
        .map((c) => DIGIT_LOOKALIKES[c] ?? c)
        .join('')
}

/**
 * The four figures the tyre check reads off the same document (Block C, item 10): the permitted axle
 * loads 8.1 (front) and 8.2 (rear) in kg, the top speed T in km/h, and the power P.2 in kW. Each only
 * after its own label and only inside a range a car can have; anything else is null, never a guess —
 * the customer confirms every figure before it is used.
 */
export interface PapersFigures {
    axleFrontKg: number | null
    axleRearKg: number | null
    topSpeedKmh: number | null
    powerKw: number | null
}

/* 8.1 / 8.2: the label, then the load as printed — `1120` or `1.120`. */
const AXLE_FIELD = (n: 1 | 2): RegExp => new RegExp(`(?<![\\d.,])8\\s*[.,]\\s*${n}(?!\\d)[\\s:.\\-–]*(\\d{1,2}\\.?\\d{3})(?![\\d])`)

/* T: a lone letter — never the T of TSN or of a word — then the speed. */
const SPEED_FIELD = /(?<![A-Z0-9.])T(?![A-Z0-9])[\s:.\-–]*(\d{2,3})(?![\d,.]\d)/

/* P.2, printed with the rated speed as `P.2/P.4 140/5500`: the kW before the slash. */
const POWER_FIELD = /(?<![A-Z0-9.])P\s*[.,]\s*2(?!\d)(?:\s*\/\s*P\s*[.,]\s*4)?[\s:.\-–]*(\d{1,3})(?![\d])/

const within = (value: number, min: number, max: number): number | null => (value >= min && value <= max ? value : null)

export function parsePapers(text: string): PapersFigures {
    const upper = text.toUpperCase()
    const number = (re: RegExp): number | null => {
        const raw = re.exec(upper)?.[1]

        return raw === undefined ? null : Number(raw.replace('.', ''))
    }

    const front = number(AXLE_FIELD(1))
    const rear = number(AXLE_FIELD(2))
    const speed = number(SPEED_FIELD)
    const power = number(POWER_FIELD)

    return {
        axleFrontKg: front === null ? null : within(front, 300, 4000),
        axleRearKg: rear === null ? null : within(rear, 300, 4000),
        topSpeedKmh: speed === null ? null : within(speed, 60, 420),
        powerKw: power === null ? null : within(power, 10, 1000),
    }
}

/** What stands between or inside key numbers as people write and copy them: spaces, „/“, „-“, „–“, „.“, „,“. */
const SEPARATORS = /[\s/\-–.,]+/g

/** What is typed or pasted into the HSN field: separators gone, upper case, four characters at most. */
export function cleanHsn(raw: string): string {
    return raw.replace(SEPARATORS, '').toUpperCase().slice(0, 4)
}

/** What is typed or pasted into the TSN field: separators gone, upper case, three characters at most. */
export function cleanTsn(raw: string): string {
    return raw.replace(SEPARATORS, '').toUpperCase().slice(0, 3)
}

/**
 * What landed in the HSN field, as the two key numbers. A pair copied from a list or a message — „0005/582“,
 * „0005 582“, „0005-582“, „0005582“ — fills both fields, and a fifth character typed on carries on into the TSN.
 * `tsn` is null when nothing went past the HSN. Every HSN field takes its input through here: a field that clips at
 * four characters drops the TSN of a pair a phone's keyboard inserts.
 */
export function splitKeys(raw: string): { hsn: string; tsn: string | null } {
    const all = raw.replace(SEPARATORS, '').toUpperCase()

    return { hsn: all.slice(0, 4), tsn: all.length > 4 ? all.slice(4, 7) : null }
}

/** An HSN has four digits; leading zeros count (R-10). */
export function isHsn(value: string): boolean {
    return /^\d{4}$/.test(value)
}

/** A TSN has three characters, letters or digits. */
export function isTsn(value: string): boolean {
    return /^[A-Z0-9]{3}$/.test(value)
}
