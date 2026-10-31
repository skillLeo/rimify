//#region resources/js/composables/mobile/useSheetHistory.ts
/**
* Android back and browser back close an open bottom sheet instead of leaving the page.
*
* Opening a sheet pushes one history entry that copies the current Inertia state and adds a
* marker. Inertia handles `popstate` from a listener it adds on `window` when the app starts; this
* module's listener swallows the event with `stopImmediatePropagation()` while a sheet is open — so
* Inertia never sees the pop and never re-renders the page. The page keeps its state; only the sheet
* closes. At the window the browser calls listeners in the order they were added, capture or not
* (Chromium; WebKit puts capture first), so the listener is added in app.ts before the app starts —
* added on the first sheet, after Inertia's, it came too late on Android and every closed sheet threw
* the page's state away (HQ-24; popstateGuard.ts says the same for the admin's forms).
*
* Closing a sheet by any other means (handle, backdrop, button) pops that entry again, so the
* history never carries a dead entry. A navigation while a sheet is open strips the marker in
* place instead (`stripSheetState()`), because a `history.back()` racing Inertia's own push is
* exactly the kind of thing that cannot be made reliable.
*
* Bookkeeping, not the marker, decides whether an entry was pushed: Inertia rewrites the current
* entry on every scroll (to save the position) and drops the marker with it.
*/
var SHEET_STATE_KEY = "rmfSheet";
var stack = [];
var pending = null;
var installed = false;
function onPopstate(event) {
	const top = stack[stack.length - 1];
	if (top === void 0) return;
	event.stopImmediatePropagation();
	stack.pop();
	if (pending && pending.id === top.id) {
		clearTimeout(pending.timer);
		pending.resolve();
		pending = null;
		return;
	}
	top.onBack();
}
/** Adds the listener. Call in app.ts before the app starts, so it runs ahead of Inertia's (HQ-24). */
function installSheetHistory() {
	if (installed || typeof window === "undefined") return;
	window.addEventListener("popstate", onPopstate, true);
	installed = true;
}
function useSheetHistory(id, onBack) {
	installSheetHistory();
	function owns() {
		const top = stack[stack.length - 1];
		return top !== void 0 && top.id === id;
	}
	function open() {
		if (typeof window === "undefined" || owns()) return;
		const base = window.history.state ?? {};
		window.history.pushState({
			...base,
			[SHEET_STATE_KEY]: id
		}, "", window.location.href);
		stack.push({
			id,
			onBack
		});
	}
	function close() {
		if (typeof window === "undefined" || !owns()) return Promise.resolve();
		return new Promise((resolve) => {
			pending = {
				id,
				resolve,
				timer: setTimeout(() => {
					if (pending && pending.id === id) {
						pending = null;
						const index = stack.findIndex((e) => e.id === id);
						if (index !== -1) stack.splice(index, 1);
						resolve();
					}
				}, 400)
			};
			window.history.back();
		});
	}
	return {
		open,
		close,
		owns
	};
}
/** Before a navigation: forget every open sheet and remove the marker from the current entry. */
function stripSheetState() {
	if (typeof window === "undefined") return;
	stack.length = 0;
	if (pending) {
		clearTimeout(pending.timer);
		pending.resolve();
		pending = null;
	}
	const state = window.history.state;
	if (state && "rmfSheet" in state) {
		const { [SHEET_STATE_KEY]: _marker, ...rest } = state;
		window.history.replaceState(rest, "", window.location.href);
	}
}
/** How many sheets currently own a history entry — for tests and the layout's "close all". */
function openSheetCount() {
	return stack.length;
}
//#endregion
export { stripSheetState as n, useSheetHistory as r, openSheetCount as t };
