/**
 * What a verdict says about the car's papers — two questions, two lines, one place for their words. The PHP twin is
 * App\Domain\Fitment\Verdict\PapersWording, which explains the two questions in full:
 *
 * - the Auflagen decide whether a Prüfer must look at the car (`requiresEntry`, from an Abnahme code);
 * - the document decides whether the papers must be corrected (§ 15 FZV — ABE 53841, point 10: `papersExempt`).
 *
 * Where a document says nothing about § 15 FZV, the first line keeps the words it always had. Where it frees the
 * papers, the Abnahme is named as what it is, so the two lines never contradict each other.
 */

export const ENTRY_REQUIRED = 'Eintragung in die Fahrzeugpapiere erforderlich.'
export const NO_ENTRY = 'Keine Eintragung erforderlich.'
export const ABNAHME_REQUIRED = 'Abnahme durch einen Prüfer erforderlich (§ 19 Abs. 3 StVZO).'
export const NO_ABNAHME = 'Keine Abnahme durch einen Prüfer erforderlich.'
export const PAPERS_EXEMPT = 'Keine Berichtigung der Fahrzeugpapiere nötig (§ 15 FZV).'

/** The Auflagen's line where it is required; null otherwise (the product page adds its own „keine“ form). */
export function entryLine(requiresEntry: boolean, papersExempt: boolean): string | null {
    if (!requiresEntry) {
        return null
    }

    return papersExempt ? ABNAHME_REQUIRED : ENTRY_REQUIRED
}

/** The product page's line, said either way for a wheel that may go on the car. */
export function entryLineOrNone(requiresEntry: boolean, papersExempt: boolean): string {
    return entryLine(requiresEntry, papersExempt) ?? (papersExempt ? NO_ABNAHME : NO_ENTRY)
}

/** The document's line: only where it frees the papers. */
export function papersLine(papersExempt: boolean): string | null {
    return papersExempt ? PAPERS_EXEMPT : null
}

/** The sizes an answer says the Abnahme per (ConditionGroups): only their names and whether each needs it. */
export interface SizeEntry {
    size: string
    entry: boolean
}

function listed(sizes: string[]): string {
    return sizes.length === 1 ? sizes[0] ?? '' : `${sizes.slice(0, -1).join(', ')} und ${sizes[sizes.length - 1] ?? ''}`
}

/**
 * Where one tyre size needs the Abnahme or Eintragung and another does not (ABE 55255, BMW X3 X83: A01 with
 * 255/40R19 alone), one line names them — never one answer for all sizes. Null where they agree. The PHP twin is
 * PapersWording::entryBySize().
 */
export function entryBySize(sizes: SizeEntry[] | undefined, papersExempt: boolean): string | null {
    const yes = (sizes ?? []).filter((s) => s.entry).map((s) => s.size)
    const no = (sizes ?? []).filter((s) => !s.entry).map((s) => s.size)

    if (yes.length === 0 || no.length === 0) {
        return null
    }

    return `${papersExempt ? 'Abnahme durch einen Prüfer' : 'Eintragung in die Fahrzeugpapiere'} erforderlich mit ${listed(yes)}, nicht mit ${listed(no)}.`
}