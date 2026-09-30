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
/** The Auflagen's line where it is required; null otherwise (the product page adds its own „keine“ form). */
function entryLine(requiresEntry, papersExempt) {
	if (!requiresEntry) return null;
	return papersExempt ? ABNAHME_REQUIRED : ENTRY_REQUIRED;
}
/** The product page's line, said either way for a wheel that may go on the car. */
function entryLineOrNone(requiresEntry, papersExempt) {
	return entryLine(requiresEntry, papersExempt) ?? (papersExempt ? "Keine Abnahme durch einen Prüfer erforderlich." : "Keine Eintragung erforderlich.");
}
/** The document's line: only where it frees the papers. */
function papersLine(papersExempt) {
	return papersExempt ? PAPERS_EXEMPT : null;
}
//#endregion
export { papersLine as i, entryLine as n, entryLineOrNone as r, PAPERS_EXEMPT as t };
