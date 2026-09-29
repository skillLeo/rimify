/**
 * The letters on a person's avatar tile when there is no photo: the first letter of the first and
 * the last word of the name — „Sabine Roth“ → SR, „Dr. Mirjam Halbach“ → MH (a title is not a name),
 * „Lea“ → L. Uppercase, German letters kept (Ö stays Ö).
 */

const TITLES = new Set(['dr.', 'prof.', 'dipl.-ing.', 'ing.'])

export function monogram(name: string | null | undefined): string {
    const words = (name ?? '')
        .trim()
        .split(/\s+/)
        .filter((w) => w !== '' && !TITLES.has(w.toLowerCase()))

    if (words.length === 0) {
        return '?'
    }

    const first = words[0]!.charAt(0)
    const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : ''

    return (first + last).toLocaleUpperCase('de-DE')
}
