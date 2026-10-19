import { t as AppLayout_default } from "./AppLayout-Cpv58bz_.js";
import { i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as Icon_default } from "./Icon-GXmbqY1-.js";
//#region resources/js/Pages/Gutachten/Beispiel.vue?vue&type=script&setup=true&lang.ts
var Beispiel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Beispiel",
	__ssrInlineRender: true,
	props: {
		document: {},
		pdf: {}
	},
	setup(__props) {
		/**
		* An example document, opened from the shop (decision 6, D-239). The PDF carries no mark of its own, so the shop never
		* links it bare: it opens through this page, which says first — before anything else, in the heading — that the document
		* is held here only as an example and that no answer drawn from it is evidence for a car, and then offers the file.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `Beispiel: ${__props.document.label}` }, null, _parent));
			_push(`<section class="section-dense" data-v-e2fba40f><div class="wrap ex" data-v-e2fba40f><p class="ex__mark" data-v-e2fba40f>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "info",
				size: 20
			}, null, _parent));
			_push(`<span class="tag tag--unknown" data-v-e2fba40f>Beispieldaten</span></p><h1 class="t-h1" data-v-e2fba40f>${(0, server_renderer_exports.ssrInterpolate)(__props.document.label)} – nur als Beispiel hinterlegt</h1><p class="t-lead ex__lead" data-v-e2fba40f> Dieses Gutachten gehört zu den Beispieldaten dieses Shops. Eine Freigabe, die auf ihm beruht, ist hier kein Nachweis für ein Fahrzeug, und eine Bestellung damit ist ein Testkauf. </p>`);
			if (__props.document.issuer) _push(`<p class="ex__issuer" data-v-e2fba40f>${(0, server_renderer_exports.ssrInterpolate)(__props.document.issuer)}</p>`);
			else _push(`<!---->`);
			if (__props.pdf) {
				_push(`<p class="ex__open" data-v-e2fba40f><a class="btn btn--secondary"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.pdf.url)} target="_blank" rel="noopener" data-v-e2fba40f> Das Dokument öffnen (PDF`);
				if (__props.pdf.page) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.pdf.page)}<!--]-->`);
				else _push(`<!---->`);
				_push(`) </a></p>`);
			} else _push(`<p class="ex__issuer" data-v-e2fba40f>Die Datei zu diesem Dokument liegt gerade nicht bei uns.</p>`);
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Gutachten/Beispiel.vue
var _sfc_setup = Beispiel_vue_vue_type_script_setup_true_lang_default.setup;
Beispiel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Gutachten/Beispiel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Beispiel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Beispiel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e2fba40f"]]);
//#endregion
export { Beispiel_default as default };
