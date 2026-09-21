import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as VehicleSelector_default } from "./VehicleSelector-DhI378vn.js";
//#region resources/js/Pages/FelgenSuchen/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		makes: {},
		models: {},
		variants: {},
		selectedMake: {},
		selectedModel: {}
	},
	setup(__props) {
		/**
		* The vehicle selector as a full page.
		*
		* Two routes in, side by side and equally weighted — the guided drill and the key numbers. A
		* failure here never clears the form and never dead-ends: the empty state names a way forward
		* (R-09), because a customer who cannot find their car is a customer who leaves.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Auto wählen" }, null, _parent));
			_push(`<section class="section" data-v-ef9a2f9d><div class="wrap" data-v-ef9a2f9d><h1 class="t-h1" data-v-ef9a2f9d>Auto wählen, garantiert passende Felge finden</h1><p class="t-body" data-v-ef9a2f9d> Zwei Wege – über die Fahrzeugdaten oder direkt über die Schlüsselnummern aus deinem Fahrzeugschein. </p><div class="panel sel__panel" data-v-ef9a2f9d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehicleSelector_default, {
				makes: __props.makes,
				models: __props.models,
				variants: __props.variants,
				"selected-make": __props.selectedMake,
				"selected-model": __props.selectedModel,
				"base-path": "/felgen-suchen"
			}, null, _parent));
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/FelgenSuchen/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/FelgenSuchen/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ef9a2f9d"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
