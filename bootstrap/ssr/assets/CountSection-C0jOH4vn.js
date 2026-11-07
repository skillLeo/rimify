import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as CountCard_default } from "./CountCard-31UOuJWt.js";
import { h as useGutachtenPage, m as useEntry } from "./entryStore-DmyNlH0L.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CountSection.vue?vue&type=script&setup=true&lang.ts
var CountSection_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CountSection",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The count of the paper's Verwendungsbereich, in step 5: what the person releasing reads off the PDF (D-228), which the release
		* compares with what was entered. Folded while it agrees; the card itself is the one the page has always used.
		*/
		const { state } = useEntry();
		const page = useGutachtenPage();
		const doc = (0, vue_exports.computed)(() => page.props.document);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-check",
				"aria-labelledby": "ef-count-h"
			}, _attrs))}><h3 id="ef-count-h" class="ef-check__title">Zählung aus dem Gutachten</h3>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CountCard_default, {
				"document-id": doc.value.id,
				stamp: (0, vue_exports.unref)(page).props.stamps.document,
				count: doc.value.count ?? null,
				editable: (0, vue_exports.unref)(state).editable,
				"page-count": doc.value.pageCount,
				rows: (0, vue_exports.unref)(page).props.rowsTotal ?? 0
			}, null, _parent));
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CountSection.vue
var CountSection_exports = /* @__PURE__ */ __exportAll({ default: () => CountSection_default });
var _sfc_setup = CountSection_vue_vue_type_script_setup_true_lang_default.setup;
CountSection_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/CountSection.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CountSection_default = CountSection_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { CountSection_exports as n, CountSection_default as t };
