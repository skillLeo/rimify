import { u as vue_exports } from "../ssr.js";
//#region resources/js/composables/admin/focusRefused.ts
/**
* After a refused save: the first refused field takes the focus, so the keyboard lands where the
* fix is and a phone scrolls the sentence into view. Where no field is marked (a sentence about the
* whole form), the first sentence itself is focused instead — never nothing, never the button.
*/
function focusRefused(scope) {
	(0, vue_exports.nextTick)(() => {
		const root = typeof scope === "string" ? document.querySelector(scope) : scope;
		if (!root) return;
		const field = root.querySelector("[aria-invalid=\"true\"]:not([aria-hidden=\"true\"])");
		if (field) {
			field.focus();
			return;
		}
		const sentence = [...root.querySelectorAll(".form-field__error, .adm-alert")].find((el) => el.textContent?.trim());
		if (sentence) {
			sentence.tabIndex = -1;
			sentence.focus();
		}
	});
}
/**
* Runs `then` once every dialog has left the page. Focus moved while a dialog is still closing is taken
* back by its focus trap (and its close animation held); after it is gone, the page decides again.
*/
function afterDialogsClose(then, frames = 90) {
	if (typeof window === "undefined") return;
	const step = (left) => {
		if (document.querySelector("[role=\"dialog\"], [role=\"alertdialog\"]") === null || left <= 0) {
			then();
			return;
		}
		window.requestAnimationFrame(() => step(left - 1));
	};
	window.requestAnimationFrame(() => step(frames));
}
//#endregion
export { focusRefused as n, afterDialogsClose as t };
