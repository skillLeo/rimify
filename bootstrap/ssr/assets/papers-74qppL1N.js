//#region resources/js/fitment/papers.ts
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
var ENTRY_REQUIRED = "Eintragung in die Fahrzeugpapiere erforderlich.";
var ABNAHME_REQUIRED = "Abnahme durch einen Prüfer erforderlich (§\xA019 Abs.\xA03 StVZO).";
var PAPERS_EXEMPT = "Keine Berichtigung der Fahrzeugpapiere nötig (§\xA015 FZV).";
/** The Auflagen's line where a code requires it; null otherwise — never a „keine“ (D-486). */
function entryLine(requiresEntry, papersExempt) {
	if (!requiresEntry) return null;
	return papersExempt ? ABNAHME_REQUIRED : ENTRY_REQUIRED;
}
/** The document's line: only where it frees the papers. */
function papersLine(papersExempt) {
	return papersExempt ? PAPERS_EXEMPT : null;
}
/**
* The papers' lines for one answer — the Auflagen's (per size where the sizes differ, a Komplettrad's tyre's), then the
* document's § 15 FZV — for a wheel that may go on the car at all; nothing for one that may not.
*/
function papersLines(verdict) {
	if (!verdict || !verdict.sellable) return [];
	const exempt = verdict.papersExempt === true;
	return [entryBySize(verdict.conditionGroups?.sizes, exempt) ?? entryLine(verdict.conditionGroups?.entry ?? verdict.requiresEntry, exempt), papersLine(exempt)].filter((line) => line !== null);
}
function listed(sizes) {
	return sizes.length === 1 ? sizes[0] ?? "" : `${sizes.slice(0, -1).join(", ")} und ${sizes[sizes.length - 1] ?? ""}`;
}
/**
* Where one tyre size needs the Abnahme or Eintragung and another does not (ABE 55255, BMW X3 X83: A01 with
* 255/40R19 alone), one line names the sizes that need it — never one answer for all sizes, and never a „nicht mit“ for
* the others (D-486). Null where they agree. The PHP twin is PapersWording::entryBySize().
*/
function entryBySize(sizes, papersExempt) {
	const yes = (sizes ?? []).filter((s) => s.entry).map((s) => s.size);
	const no = (sizes ?? []).filter((s) => !s.entry);
	if (yes.length === 0 || no.length === 0) return null;
	return `${papersExempt ? "Abnahme durch einen Prüfer" : "Eintragung in die Fahrzeugpapiere"} erforderlich mit ${listed(yes)}.`;
}
//#endregion
export { entryLine as a, entryBySize as i, ENTRY_REQUIRED as n, papersLine as o, PAPERS_EXEMPT as r, papersLines as s, ABNAHME_REQUIRED as t };
