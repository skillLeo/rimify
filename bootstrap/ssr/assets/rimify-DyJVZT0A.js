//#region resources/js/types/rimify.ts
/** The one key the compare store, the tray and `/vergleich?f=` share (home-overhaul.md §0.3). */
function compareKeyOf(card) {
	return card.compareKey ?? `${card.modelId}:${card.finishId}`;
}
//#endregion
export { compareKeyOf as t };
