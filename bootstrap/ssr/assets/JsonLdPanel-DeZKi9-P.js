import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/Felgen/JsonLdPanel.vue?vue&type=script&setup=true&lang.ts
var TEST_URL = "https://search.google.com/test/rich-results";
var JsonLdPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "JsonLdPanel",
	__ssrInlineRender: true,
	props: { jsonLd: {} },
	setup(__props) {
		const open = (0, vue_exports.ref)(false);
		const copied = (0, vue_exports.ref)("");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "adm-section jl",
				"aria-labelledby": "fe-h-jsonld"
			}, _attrs))} data-v-52373f92><div class="adm-section__head" data-v-52373f92><h2 id="fe-h-jsonld" class="adm-section__title" data-v-52373f92>Strukturierte Daten (JSON-LD)</h2></div><p class="adm-note jl__lead" data-v-52373f92> Was Suchmaschinen von dieser Felge lesen: Name, Marke, Größen, Preise und Verfügbarkeit. Die Vorschau ist für Suchmaschinen gesperrt, deshalb prüfst du den Code hier. </p>`);
			if (__props.jsonLd.code === null) _push(`<p class="adm-note" data-v-52373f92>Sobald die Felge eine Größe hat, steht hier ihr JSON-LD.</p>`);
			else {
				_push(`<!--[-->`);
				if (__props.jsonLd.demo) _push(`<p class="adm-note jl__state" data-v-52373f92> Beispielfelge (Demodaten): Ihre Seite im Shop gibt Suchmaschinen keine strukturierten Daten. So sähen sie für eine echte Felge aus. </p>`);
				else if (!__props.jsonLd.published) _push(`<p class="adm-note jl__state" data-v-52373f92> Die Felge ist noch nicht veröffentlicht. Sobald sie es ist, steht dieser Code im Kopf ihrer Seite. </p>`);
				else _push(`<!---->`);
				_push(`<div class="jl__actions" data-v-52373f92><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", open.value ? "true" : "false")} aria-controls="fe-jsonld-code" data-v-52373f92>${(0, server_renderer_exports.ssrInterpolate)(open.value ? "JSON-LD ausblenden" : "JSON-LD anzeigen")}</button><button class="btn btn--secondary" type="button" data-v-52373f92>Code kopieren</button><span class="adm-note jl__copied" role="status" data-v-52373f92>${(0, server_renderer_exports.ssrInterpolate)(copied.value === "ok" ? "Kopiert." : copied.value === "failed" ? "Kopieren ging nicht – blende den Code ein, markier ihn und kopier ihn selbst." : "")}</span></div><pre id="fe-jsonld-code" class="jl__code" translate="no" style="${(0, server_renderer_exports.ssrRenderStyle)(open.value ? null : { display: "none" })}" data-v-52373f92><code data-v-52373f92>${(0, server_renderer_exports.ssrInterpolate)(__props.jsonLd.code)}</code></pre><ol class="jl__steps" data-v-52373f92><li data-v-52373f92>Öffne den <a${(0, server_renderer_exports.ssrRenderAttr)("href", TEST_URL)} target="_blank" rel="noopener noreferrer" data-v-52373f92>Test für Rich-Suchergebnisse</a> von Google.</li><li data-v-52373f92>Wähl dort „Code“, füg den kopierten Text ein und drück „Code testen“.</li></ol><!--]-->`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Felgen/JsonLdPanel.vue
var JsonLdPanel_exports = /* @__PURE__ */ __exportAll({ default: () => JsonLdPanel_default });
var _sfc_setup = JsonLdPanel_vue_vue_type_script_setup_true_lang_default.setup;
JsonLdPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Felgen/JsonLdPanel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var JsonLdPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(JsonLdPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-52373f92"]]);
//#endregion
export { JsonLdPanel_exports as n, JsonLdPanel_default as t };
