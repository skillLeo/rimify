import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as VehicleSelector_default } from "./VehicleSelector-DhI378vn.js";
//#region resources/js/Pages/FelgenSuchen/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
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
		* The selector on a phone: one column, the guided route first, the key numbers beneath an `ODER`
		* divider, and the Fahrzeugschein help as a sheet rather than inline — the document drawing is
		* wider than the screen and pushing it into the flow would bury the fields it explains.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Auto wählen" }, null, _parent));
			_push(`<section class="section" data-v-cfb29efd><div class="wrap" data-v-cfb29efd><h1 class="t-h1" data-v-cfb29efd>Auto wählen, garantiert passende Felge finden</h1><p class="t-body" data-v-cfb29efd> Zwei Wege – über die Fahrzeugdaten oder direkt über die Schlüsselnummern aus deinem Fahrzeugschein. </p><div class="card msel" data-v-cfb29efd>`);
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
//#region resources/js/Pages/FelgenSuchen/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/FelgenSuchen/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-cfb29efd"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
