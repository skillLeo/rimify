//#region resources/js/composables/admin/useFocusAfter.ts
/**
* How long a request waits for its control: long enough for a large upload on a slow line (K2-37). It
* never jumps late, because it steps aside the moment the person has put the focus somewhere themselves.
*/
var MAX_WAIT_MS = 3e4;
var frame = 0;
var pending = null;
/** Whether the person has moved the focus on while the request waited: a control of their own choosing. */
function movedOn(origin) {
	const active = document.activeElement;
	if (active === null || active === document.body || active === document.documentElement || active === origin) return false;
	return active.closest("[role=\"menu\"], [role=\"dialog\"], [role=\"alertdialog\"]") === null;
}
/** The element a target names: its id, else the element that carries it as `data-focus`. */
function resolveTarget(target) {
	if (typeof target !== "string") return target();
	return document.getElementById(target) ?? document.querySelector(`[data-focus="${CSS.escape(target)}"]`);
}
/** Whether the keyboard can actually be put on the element now. */
function usable(element) {
	if (element === null || !element.isConnected) return false;
	if (element.disabled === true || element.getAttribute("aria-disabled") === "true") return false;
	return element.getClientRects().length > 0;
}
function cancel() {
	if (frame !== 0) {
		cancelAnimationFrame(frame);
		frame = 0;
	}
	pending = null;
}
function attempt() {
	if (pending === null) return true;
	const element = pending.targets.map(resolveTarget).find(usable);
	if (element === void 0) return false;
	element.focus({ preventScroll: true });
	if (document.activeElement !== element) return false;
	if (pending.options.scroll) element.scrollIntoView({
		block: "center",
		behavior: "auto"
	});
	pending = null;
	return true;
}
function tick() {
	frame = 0;
	if (pending === null) return;
	if (movedOn(pending.origin) || attempt() || performance.now() - pending.started >= MAX_WAIT_MS) {
		pending = null;
		return;
	}
	frame = requestAnimationFrame(tick);
}
/**
* Give the focus to the first usable target once the page has settled.
*
* @param targets best first; the first one that exists, is shown and is enabled wins
*/
function request(targets, options = {}) {
	cancel();
	pending = {
		targets: Array.isArray(targets) ? targets : [targets],
		options,
		started: performance.now(),
		origin: document.activeElement
	};
	frame = requestAnimationFrame(tick);
}
/** For DropdownMenuContent's `close-auto-focus`: a waiting request keeps the menu from taking the focus back. */
function onMenuClose(event) {
	if (pending !== null) event.preventDefault();
}
function useFocusAfter() {
	return {
		request,
		onMenuClose,
		cancel
	};
}
//#endregion
export { useFocusAfter as n, resolveTarget as t };
