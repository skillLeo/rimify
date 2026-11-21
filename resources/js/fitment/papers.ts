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

/*
 * Only what a code requires is said: „Keine Eintragung erforderlich.“ and „Keine Abnahme durch einen Prüfer erforderlich.“
 * are gone (D-486, the client's round of 18.11.2026, item 4) — the absence of a code is no statement the shop can stand
 * behind. The § 15 FZV line stays: it rests on the document's own recorded field.
 */
export const ENTRY_REQUIRED = 'Eintragung in die Fahrzeugpapiere erforderlich.'
export const ABNAHME_REQUIRED = 'Abnahme durch einen Prüfer erforderlich (§ 19 Abs. 3 StVZO).'
export const PAPERS_EXEMPT = 'Keine Berichtigung der Fahrzeugpapiere nötig (§ 15 FZV).'

/** The Auflagen's line where a code requires it; null otherwise — never a „keine“ (D-486). */
export function entryLine(requiresEntry: boolean, papersExempt: boolean): string | null {
    if (!requiresEntry) {
        return null
    }

    return papersExempt ? ABNAHME_REQUIRED : ENTRY_REQUIRED
}

/** The document's line: only where it frees the papers. */
export function papersLine(papersExempt: boolean): string | null {
    return papersExempt ? PAPERS_EXEMPT : null
}

/** What a verdict says about the papers, as every page that shows a line says it (`sellable`, the groups, § 15 FZV). */
export interface PapersOf {
    sellable: boolean
    requiresEntry: boolean
    papersExempt?: boolean
    conditionGroups?: { sizes: SizeEntry[]; entry: boolean | null } | null
}

/**
 * The papers' lines for one answer — the Auflagen's (per size where the sizes differ, a Komplettrad's tyre's), then the
 * document's § 15 FZV — for a wheel that may go on the car at all; nothing for one that may not.
 */
export function papersLines(verdict: PapersOf | null | undefined): string[] {
    if (!verdict || !verdict.sellable) {
        return []
    }

    const exempt = verdict.papersExempt === true
    const entry = entryBySize(verdict.conditionGroups?.sizes, exempt)
        ?? entryLine(verdict.conditionGroups?.entry ?? verdict.requiresEntry, exempt)

    return [entry, papersLine(exempt)].filter((line): line is string => line !== null)
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
 * 255/40R19 alone), one line names the sizes that need it — never one answer for all sizes, and never a „nicht mit“ for
 * the others (D-486). Null where they agree. The PHP twin is PapersWording::entryBySize().
 */
export function entryBySize(sizes: SizeEntry[] | undefined, papersExempt: boolean): string | null {
    const yes = (sizes ?? []).filter((s) => s.entry).map((s) => s.size)
    const no = (sizes ?? []).filter((s) => !s.entry)

    if (yes.length === 0 || no.length === 0) {
        return null
    }

    return `${papersExempt ? 'Abnahme durch einen Prüfer' : 'Eintragung in die Fahrzeugpapiere'} erforderlich mit ${listed(yes)}.`
}