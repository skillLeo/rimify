import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
//#region resources/js/Pages/Admin/Gutachten/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: { documents: {} },
	setup(__props) {
		/** Gutachten on a phone: cards, not a six-column table squeezed to 390px. */
		const KIND_LABEL = {
			ABE: "ABE",
			TEILEGUTACHTEN: "Teilegutachten",
			ECE: "ECE",
			EC: "EG-Genehmigung"
		};
		const STATUS_CLASS = {
			published: "tag--ok",
			draft: "tag--unknown",
			superseded: "tag--warn",
			withdrawn: "tag--danger"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Gutachten" }, null, _parent));
			_push(`<div class="stack" data-v-83637928><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.documents, (doc) => {
				_push(`<article class="card mgut__card" data-v-83637928><div class="between" data-v-83637928><span class="mgut__num" data-v-83637928>${(0, server_renderer_exports.ssrInterpolate)(doc.reportNumber)}</span><span class="${(0, server_renderer_exports.ssrRenderClass)([STATUS_CLASS[doc.status] ?? "tag--unknown", "tag"])}" data-v-83637928>${(0, server_renderer_exports.ssrInterpolate)(doc.status)}</span></div><p class="mgut__issuer" data-v-83637928>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[doc.kind] ?? doc.kind)} · ${(0, server_renderer_exports.ssrInterpolate)(doc.issuer)}</p><p class="data" data-v-83637928>${(0, server_renderer_exports.ssrInterpolate)(doc.issuedOn ?? "—")} · Fassung ${(0, server_renderer_exports.ssrInterpolate)(doc.revision)} · ${(0, server_renderer_exports.ssrInterpolate)(doc.publishedCount)} / ${(0, server_renderer_exports.ssrInterpolate)(doc.fitmentCount)} Freigaben </p></article>`);
			});
			_push(`<!--]-->`);
			if (__props.documents.length === 0) _push(`<p class="quiet" data-v-83637928>Noch keine Gutachten erfasst.</p>`);
			else _push(`<!---->`);
			_push(`</div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-83637928"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
