//#region resources/js/fitment/auflagen.ts
/** A listing card: two short sentences. */
var CARD_ROOM = {
	sentences: 2,
	characters: 160
};
/** A basket line: three sentences of ordinary length. */
var LINE_ROOM = {
	sentences: 3,
	characters: 420
};
function fitsWhole(conditions, room) {
	return conditions.length <= room.sentences && conditions.join(" ").length <= room.characters;
}
/**
* `9 Auflagen und Hinweise aus dem Gutachten` — the list holds both kinds — and, where the server says every one of
* them is a Hinweis (#23), `3 Hinweise aus dem Gutachten`.
*
* A single sentence is `1 Auflage oder Hinweis aus dem Gutachten`: which of the two it is, neither caller is told. A
* card counts the sentences common to every size while its badge speaks for all of them, and `notesOnly` is also false
* for an Eintragung or an open tyre answer — so „1 Auflage“ could name a Hinweis. The count never claims a kind.
*/
function countedDe(count, notesOnly = false) {
	if (notesOnly) return count === 1 ? "1 Hinweis aus dem Gutachten" : `${count} Hinweise aus dem Gutachten`;
	return count === 1 ? "1 Auflage oder Hinweis aus dem Gutachten" : `${count} Auflagen und Hinweise aus dem Gutachten`;
}
//#endregion
export { fitsWhole as i, LINE_ROOM as n, countedDe as r, CARD_ROOM as t };
