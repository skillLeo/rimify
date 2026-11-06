/**
 * What a text typed or pasted into a codes field is: one code or several, as the paper prints them. Comma and semicolon always
 * separate. A space separates only codes that are codes by themselves — `11A 68B` is two —, and never the words of one: `Nicht
 * 330D` and `Schrägheck 2-türig` are what the 18″ Nachtrag prints in its Auflagen column. The paper's own list decides first. A
 * printed closing bracket is not part of a code, as on the server (DocumentConditions::normaliseCode): `16a)` is `16a`.
 */

/** As the server stores a code: one plain space between words, no closing bracket. */
export function normaliseCode(code: string): string {
    return code.replace(/\s+/g, ' ').trim().replace(/\s*\)$/, '')
}

/** A word that is a code by itself: it holds a digit, or is up to three capitals. */
export function isCodeWord(word: string): boolean {
    return /\d/.test(word) || (word.length <= 3 && word !== '' && word === word.toUpperCase())
}

/** The codes in a text, spelled as the paper's list spells them where it holds them (`11a` is 11A). */
export function readCodes(text: string, listed: readonly string[]): string[] {
    const spelled = (code: string): string => listed.find((known) => known.toLowerCase() === code.toLowerCase()) ?? code
    const known = (code: string): boolean => listed.some((other) => other.toLowerCase() === code.toLowerCase())
    const out: string[] = []

    for (const part of text.split(/[,;]+/)) {
        const code = normaliseCode(part)

        if (code === '') {
            continue
        }

        const words = code.split(' ')

        if (known(code) || !words.every(isCodeWord)) {
            out.push(spelled(code))
        } else {
            out.push(...words.map((word) => spelled(normaliseCode(word))))
        }
    }

    return [...new Set(out)].filter((code) => code !== '')
}
