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