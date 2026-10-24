import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
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
		const problem = (0, vue_exports.computed)(() => props.editor.problem?.value ?? null);
		const status = (0, vue_exports.computed)(() => {
			if (saving.value) return "Wird gespeichert …";
			if (failed.value && problem.value) return problem.value;
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
			_push(`<!--[--><div class="adm-savebar"${(0, server_renderer_exports.ssrRenderAttr)("data-state", saving.value ? "saving" : failed.value ? "failed" : dirty.value ? "dirty" : "clean")}><p class="adm-savebar__status"${(0, server_renderer_exports.ssrRenderAttr)("role", failed.value && problem.value ? "alert" : "status")}>${(0, server_renderer_exports.ssrInterpolate)(status.value)}</p><div class="adm-savebar__actions"><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!dirty.value || saving.value) ? " disabled" : ""}>Verwerfen</button><button class="btn btn--primary adm-savebar__save" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", dirty.value ? void 0 : "true")}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", saving.value ? "true" : void 0)}> Speichern </button></div></div>`);
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
export { AdminSaveBar_default as t };
