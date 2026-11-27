//#region resources/js/Components/Chrome/toast.ts
/** How long a confirmation stays on screen. Long enough to read three words twice. */
var TOAST_MS = 4e3;
/** A toast with an action stays half as long again: there is a button to find. */
var TOAST_ACTION_MS = TOAST_MS * 1.5;
/** The confirmation a response flashed, or null when it flashed none. */
function toastFrom(props) {
	const flash = props?.flash;
	if (flash === null || typeof flash !== "object") return null;
	const toast = flash.toast;
	return typeof toast === "string" && toast.trim() !== "" ? toast : null;
}
var taken = /* @__PURE__ */ new Set();
/**
* Whether a confirmation component may read the page's own flash on mount: once per document, on its first load. A
* layout that mounts again later — Back from the homepage's phone layout to a product page — mounts its toast and panel
* afresh while Inertia restores that page's props from history, flash and all: the old add must not be shown again
* (PDP-04). Every later confirmation arrives through a response (`router.on('success')`).
*/
function firstLoad(kind) {
	if (taken.has(kind)) return false;
	taken.add(kind);
	return true;
}
/** What a response put in the basket (#16), or null: the panel after an add shows it, and the toast then stays quiet. */
function addedFrom(props) {
	const flash = props?.flash;
	if (flash === null || typeof flash !== "object") return null;
	const added = flash.added;
	return added !== null && typeof added === "object" && Array.isArray(added.lines) && added.lines.length > 0 ? added : null;
}
var listeners = /* @__PURE__ */ new Set();
/**
* The client channel (home-overhaul.md §2.3): a component shows a confirmation without a server
* round trip — "zum Vergleich hinzugefügt", with *Rückgängig*. One toast at a time; a new one
* replaces the current. Module state, so a caller needs no injection and no layout.
*/
var toast = {
	show(message) {
		for (const listener of listeners) listener(message);
	},
	subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}
};
//#endregion
export { toast as a, firstLoad as i, TOAST_MS as n, toastFrom as o, addedFrom as r, TOAST_ACTION_MS as t };
