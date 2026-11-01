import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/Seiten/DiffList.vue?vue&type=script&setup=true&lang.ts
var DiffList_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DiffList",
	__ssrInlineRender: true,
	props: { changes: {} },
	setup(__props) {
		/**
		* What changes, place by place, with the words before and after — shown before publishing and
		* before loading an old version (BRIEF-2 §1, "a field-level diff"). The old words are struck and
		* quiet, the new ones plain; a place that is new or gone shows only the side it has. A long legal
		* text scrolls inside its own box rather than pushing the dialog's buttons off the screen.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<ul${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "pg-diff" }, _attrs))} data-v-4742dc64><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.changes, (change, index) => {
				_push(`<li class="pg-diff__item" data-v-4742dc64><p class="pg-diff__label" data-v-4742dc64>${(0, server_renderer_exports.ssrInterpolate)(change.label)}</p><div class="pg-diff__words" role="group" tabindex="0"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Änderung: ${change.label}`)} data-v-4742dc64>`);
				if (change.before) _push(`<del class="pg-diff__before" data-v-4742dc64><span class="visually-hidden" data-v-4742dc64>Bisher: </span>${(0, server_renderer_exports.ssrInterpolate)(change.before)}</del>`);
				else _push(`<!---->`);
				if (change.after) _push(`<ins class="pg-diff__after" data-v-4742dc64><span class="visually-hidden" data-v-4742dc64>Neu: </span>${(0, server_renderer_exports.ssrInterpolate)(change.after)}</ins>`);
				else _push(`<!---->`);
				if (!change.after) _push(`<p class="pg-diff__gone" data-v-4742dc64>Entfällt.</p>`);
				else _push(`<!---->`);
				_push(`</div></li>`);
			});
			_push(`<!--]--></ul>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/DiffList.vue
var DiffList_exports = /* @__PURE__ */ __exportAll({ default: () => DiffList_default });
var _sfc_setup = DiffList_vue_vue_type_script_setup_true_lang_default.setup;
DiffList_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/DiffList.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DiffList_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DiffList_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4742dc64"]]);
//#endregion
export { DiffList_exports as n, DiffList_default as t };
