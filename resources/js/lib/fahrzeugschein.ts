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

/** What is typed or pasted into the HSN field: spaces gone, four characters at most. */
export function cleanHsn(raw: string): string {
    return raw.replace(/\s+/g, '').slice(0, 4)
}

/** What is typed or pasted into the TSN field: spaces gone, upper case, three characters at most. */
export function cleanTsn(raw: string): string {
    return raw.replace(/\s+/g, '').toUpperCase().slice(0, 3)
}

/** An HSN has four digits; leading zeros count (R-10). */
export function isHsn(value: string): boolean {
    return /^\d{4}$/.test(value)
}

/** A TSN has three characters, letters or digits. */
export function isTsn(value: string): boolean {
    return /^[A-Z0-9]{3}$/.test(value)
}
