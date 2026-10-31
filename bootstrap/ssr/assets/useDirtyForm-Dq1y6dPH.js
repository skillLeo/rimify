import { c as router, o as useForm, u as vue_exports } from "../ssr.js";
import { t as openSheetCount } from "./useSheetHistory-Ci1wpbRn.js";
//#region resources/js/composables/admin/popstateGuard.ts
var guard = null;
var installed = false;
function installPopstateGuard() {
	if (installed || typeof window === "undefined") return;
	window.addEventListener("popstate", (event) => {
		if (guard?.(event)) event.stopImmediatePropagation();
	}, true);
	installed = true;
}
/** Claims the guard; the returned function releases it, if it is still this one's. */
function claimPopstateGuard(next) {
	installPopstateGuard();
	guard = next;
	return () => {
		if (guard === next) guard = null;
	};
}
//#endregion
//#region resources/js/composables/admin/useDirtyForm.ts
/**
* An admin form that knows whether it has changed, and does not let the change be lost by accident
* (admin-shell.md §8.3–8.4).
*
* It wraps Inertia's form with the three things every admin form page owes the person filling it:
*
*   - a state the save bar can read — clean, dirty, saving, failed — so the bar is always there and
*     only its words and buttons change;
*   - a leave guard: a visit away from a dirty form is held and a dialog asks first; a reload or a
*     closed tab gets the browser's own question;
*   - Strg S / ⌘S saves when there is something to save (the shell already keeps the browser's
*     save-page dialog away).
*
* The panel fails to a kept change, never a lost one: the guard's safe answer is *Weiter bearbeiten*.
*/
/** The header the stamp travels in — App\Support\EditStamp::HEADER. */
var STAMP_HEADER = "X-Rimify-Stand";
/** The headers a save sends its stamp in, for forms that submit on their own (useForm). */
function stampHeaders(stamp) {
	return stamp ? { [STAMP_HEADER]: stamp } : {};
}
function useDirtyForm(initial, options) {
	const form = useForm(initial);
	const dirty = (0, vue_exports.computed)(() => form.isDirty);
	const saving = (0, vue_exports.computed)(() => form.processing);
	const failed = (0, vue_exports.ref)(false);
	const problem = (0, vue_exports.computed)(() => form.errors?._stamp ?? null);
	function save() {
		if (!form.isDirty || form.processing) return;
		if (options.beforeSave) {
			options.beforeSave(send);
			return;
		}
		send();
	}
	function send() {
		if (!form.isDirty || form.processing) return;
		failed.value = false;
		const url = typeof options.url === "function" ? options.url() : options.url;
		const method = typeof options.method === "function" ? options.method() : options.method;
		const sent = JSON.stringify(form.data());
		form.submit(method, url, {
			preserveScroll: true,
			headers: stampHeaders(options.stamp?.()),
			onSuccess: () => {
				if (options.resetOnSuccess) form.reset();
				else {
					form.defaults(JSON.parse(sent));
					form.isDirty = JSON.stringify(form.data()) !== sent;
				}
				options.onSaved?.();
			},
			onError: () => {
				failed.value = true;
				(0, vue_exports.nextTick)(() => document.querySelector(".adm-page [aria-invalid=\"true\"]")?.focus());
			},
			onHttpException: () => {
				failed.value = true;
			},
			onNetworkError: () => {
				failed.value = true;
			}
		});
	}
	function discard() {
		form.reset();
		form.clearErrors();
		failed.value = false;
	}
	const leaving = (0, vue_exports.ref)(false);
	let held = null;
	let heldBack = false;
	let letThrough = false;
	let ownState = null;
	let ownUrl = "";
	function remember() {
		ownState = window.history.state;
		ownUrl = window.location.href;
	}
	/** True when the pop is this form's to hold: the guard then swallows it (popstateGuard.ts). */
	function onPopstate(event) {
		if (letThrough) {
			letThrough = false;
			return false;
		}
		if (!form.isDirty || event.state === null || ownState === null || openSheetCount() > 0) return false;
		window.history.pushState(ownState, "", ownUrl);
		held = null;
		heldBack = true;
		leaving.value = true;
		return true;
	}
	function stay() {
		leaving.value = false;
		held = null;
		heldBack = false;
	}
	function leave() {
		const url = held;
		const back = heldBack;
		leaving.value = false;
		held = null;
		heldBack = false;
		discard();
		if (back) {
			letThrough = true;
			window.history.back();
			return;
		}
		if (url) {
			letThrough = true;
			router.visit(url, { onFinish: () => letThrough = false });
		}
	}
	function onBeforeUnload(event) {
		if (form.isDirty) {
			event.preventDefault();
			event.returnValue = "";
		}
	}
	function onKeydown(event) {
		const altGr = event.getModifierState("AltGraph");
		if ((event.metaKey || event.ctrlKey) && !event.altKey && !altGr && event.key.toLowerCase() === "s") {
			event.preventDefault();
			save();
		}
	}
	const unbind = [];
	(0, vue_exports.onMounted)(() => {
		remember();
		unbind.push(router.on("before", (event) => {
			const visit = event.detail.visit;
			if (letThrough || !form.isDirty || visit.method !== "get" || visit.async || visit.prefetch) return;
			event.preventDefault();
			held = visit.url.href;
			leaving.value = true;
		}), router.on("navigate", remember), router.on("success", remember), claimPopstateGuard(onPopstate));
		window.addEventListener("beforeunload", onBeforeUnload);
		window.addEventListener("keydown", onKeydown);
	});
	(0, vue_exports.onBeforeUnmount)(() => {
		unbind.forEach((off) => off());
		window.removeEventListener("beforeunload", onBeforeUnload);
		window.removeEventListener("keydown", onKeydown);
	});
	return {
		form,
		dirty,
		saving,
		failed,
		problem,
		save,
		discard,
		leaving,
		stay,
		leave
	};
}
//#endregion
export { useDirtyForm as n, stampHeaders as t };
