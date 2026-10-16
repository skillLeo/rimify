import { t as Dialog_default } from "./Dialog-CzCvzZac.js";
import { c as router, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { s as openSheetCount } from "./Toast-D0-WjjlZ.js";
//#region resources/js/Components/Admin/AdminSaveBar.vue?vue&type=script&setup=true&lang.ts
var AdminSaveBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminSaveBar",
	__ssrInlineRender: true,
	props: { editor: {} },
	setup(__props) {
		/**
		* The save bar (admin-shell.md §8.3) and the question asked before a change is lost (§8.4).
		*
		* Always rendered on a form page, from the first frame: it never appears or disappears, so its
		* disabled state is legible and a change never shifts the layout under the pointer. Only its words
		* and buttons change. A role that may not edit gets no bar at all — the page says it is read-only.
		*
		* *Speichern* is `aria-disabled` rather than `disabled` while there is nothing to save, so it stays
		* in the tab order and a keyboard can still find out why it does nothing.
		*/
		const props = __props;
		const dirty = (0, vue_exports.computed)(() => props.editor.dirty.value);
		const saving = (0, vue_exports.computed)(() => props.editor.saving.value);
		const failed = (0, vue_exports.computed)(() => props.editor.failed.value);
		const status = (0, vue_exports.computed)(() => {
			if (saving.value) return "Wird gespeichert …";
			if (failed.value) return "Die Änderungen konnten nicht gespeichert werden.";
			return dirty.value ? "Nicht gespeicherte Änderungen" : "Keine Änderungen";
		});
		const leaving = (0, vue_exports.computed)({
			get: () => props.editor.leaving.value,
			set: (open) => {
				if (!open) props.editor.stay();
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><div class="adm-savebar"${(0, server_renderer_exports.ssrRenderAttr)("data-state", saving.value ? "saving" : failed.value ? "failed" : dirty.value ? "dirty" : "clean")}><p class="adm-savebar__status" role="status">${(0, server_renderer_exports.ssrInterpolate)(status.value)}</p><div class="adm-savebar__actions"><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!dirty.value || saving.value) ? " disabled" : ""}>Verwerfen</button><button class="btn btn--primary adm-savebar__save" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", dirty.value ? void 0 : "true")}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", saving.value ? "true" : void 0)}> Speichern </button></div></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: leaving.value,
				"onUpdate:open": ($event) => leaving.value = $event,
				title: "Änderungen nicht gespeichert",
				description: "Du hast Änderungen an dieser Seite, die noch nicht gespeichert sind.",
				"content-class": "adm-dialog adm-dialog--narrow"
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary adm-btn--danger" type="button"${_scopeId}>Änderungen verwerfen</button><button class="btn btn--primary" type="button"${_scopeId}>Weiter bearbeiten</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary adm-btn--danger",
						type: "button",
						onClick: __props.editor.leave
					}, "Änderungen verwerfen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: __props.editor.stay
					}, "Weiter bearbeiten", 8, ["onClick"])];
				}),
				_: 1
			}, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminSaveBar.vue
var _sfc_setup = AdminSaveBar_vue_vue_type_script_setup_true_lang_default.setup;
AdminSaveBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminSaveBar.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminSaveBar_default = AdminSaveBar_vue_vue_type_script_setup_true_lang_default;
//#endregion
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
function useDirtyForm(initial, options) {
	const form = useForm(initial);
	const dirty = (0, vue_exports.computed)(() => form.isDirty);
	const saving = (0, vue_exports.computed)(() => form.processing);
	const failed = (0, vue_exports.ref)(false);
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
		save,
		discard,
		leaving,
		stay,
		leave
	};
}
//#endregion
export { AdminSaveBar_default as n, useDirtyForm as t };
