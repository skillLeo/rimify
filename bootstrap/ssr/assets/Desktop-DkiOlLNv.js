import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
//#region resources/js/Pages/Admin/Gutachten/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: { documents: {} },
	setup(__props) {
		/**
		* Gutachten-Erfassung, list view.
		*
		* The count column shows published against total on purpose: a document with twenty rows entered
		* and none published is the most common half-finished state in this workflow, and it is invisible
		* unless the list says so.
		*/
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
			_push(`<div class="card" data-v-1d6eeb6e><div class="between gut__head" data-v-1d6eeb6e><span class="micro" data-v-1d6eeb6e>${(0, server_renderer_exports.ssrInterpolate)(__props.documents.length)} Dokumente</span><button class="btn btn--primary btn--sm" type="button" data-v-1d6eeb6e>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "plus",
				size: 20
			}, null, _parent));
			_push(` Gutachten erfassen </button></div><table class="table" data-v-1d6eeb6e><thead data-v-1d6eeb6e><tr data-v-1d6eeb6e><th scope="col" data-v-1d6eeb6e>Nummer</th><th scope="col" data-v-1d6eeb6e>Art</th><th scope="col" data-v-1d6eeb6e>Aussteller</th><th scope="col" data-v-1d6eeb6e>Ausgestellt</th><th scope="col" data-v-1d6eeb6e>Status</th><th scope="col" class="num" data-v-1d6eeb6e>Freigaben</th></tr></thead><tbody data-v-1d6eeb6e><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.documents, (doc) => {
				_push(`<tr data-v-1d6eeb6e><td data-v-1d6eeb6e><p class="gut__num" data-v-1d6eeb6e>${(0, server_renderer_exports.ssrInterpolate)(doc.reportNumber)}</p>`);
				if (doc.kbaNumber) _push(`<span class="data" data-v-1d6eeb6e>KBA ${(0, server_renderer_exports.ssrInterpolate)(doc.kbaNumber)}</span>`);
				else _push(`<!---->`);
				_push(`</td><td data-v-1d6eeb6e>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[doc.kind] ?? doc.kind)}</td><td data-v-1d6eeb6e>${(0, server_renderer_exports.ssrInterpolate)(doc.issuer)}</td><td class="data" data-v-1d6eeb6e>${(0, server_renderer_exports.ssrInterpolate)(doc.issuedOn ?? "—")}</td><td data-v-1d6eeb6e><span class="${(0, server_renderer_exports.ssrRenderClass)([STATUS_CLASS[doc.status] ?? "tag--unknown", "tag"])}" data-v-1d6eeb6e>${(0, server_renderer_exports.ssrInterpolate)(doc.status)}</span><span class="data gut__rev" data-v-1d6eeb6e>Fassung ${(0, server_renderer_exports.ssrInterpolate)(doc.revision)}</span></td><td class="num data" data-v-1d6eeb6e>${(0, server_renderer_exports.ssrInterpolate)(doc.publishedCount)} / ${(0, server_renderer_exports.ssrInterpolate)(doc.fitmentCount)}</td></tr>`);
			});
			_push(`<!--]--></tbody></table>`);
			if (__props.documents.length === 0) _push(`<p class="quiet gut__empty" data-v-1d6eeb6e> Noch keine Gutachten erfasst. </p>`);
			else _push(`<!---->`);
			_push(`</div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1d6eeb6e"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
