/**
 * A Gutachten's Auflagen legend, pasted as it comes out of the PDF, split into code + sentence (step 4 of
 * the entry flow). Nothing is classified and nothing is stored here: the split is shown for a person to
 * correct and to give every code its kind — that choice decides what a customer is told.
 *
 * A line that starts with a code opens an entry; a line that does not continues the one before (the
 * documents wrap long sentences). The codes of the two real documents: `A01 K1c Cbo Cpe T88 140` and
 * `11A 21B 76O GA3 YDM BDC`.
 */

export interface LegendEntry {
    code: string
    text: string
}

/** Words a wrapped German sentence starts with — never a code, though they look like `Cpe` or `Lim`. */
const SENTENCE_WORDS = new Set(['Die', 'Der', 'Das', 'Den', 'Dem', 'Des', 'Bei', 'Mit', 'Für', 'Und', 'Nur', 'Ein', 'Zum', 'Zur', 'Von', 'Auf', 'Aus', 'Bis', 'Ist', 'Sie', 'Wir', 'Als', 'Wie', 'Wenn', 'Ohne', 'Bzw', 'Ggf'])

const LEGEND_LINE = /^([A-Za-z0-9]{1,8})(?:\s*[:.\-–]\s*|\s+)(.+)$/u

/**
 * Whether the first word of a line is a code: it carries a digit (`A01`, `K1c`, `140`, `76O`), is in
 * capitals (`YDM`, `KMV`), or is a three-letter body-style abbreviation (`Cpe`, `Lim`) that is not a word a
 * sentence starts with.
 */
export function looksLikeCode(token: string): boolean {
    if (/\d/.test(token) || /^[A-Z]{2,4}$/.test(token)) {
        return true
    }

    return /^[A-Z][a-z]{2}$/.test(token) && !SENTENCE_WORDS.has(token)
}

export function splitLegend(pasted: string): LegendEntry[] {
    const entries: LegendEntry[] = []

    for (const raw of pasted.split(/\r?\n/)) {
        const line = raw.replace(/\s+/g, ' ').trim()

        if (line === '') {
            continue
        }

        const match = LEGEND_LINE.exec(line)

        if (match && looksLikeCode(match[1] ?? '')) {
            entries.push({ code: match[1] ?? '', text: (match[2] ?? '').trim() })

            continue
        }

        const last = entries[entries.length - 1]

        if (last) {
            last.text = `${last.text} ${line}`.trim()
        }
    }

    return entries
}
