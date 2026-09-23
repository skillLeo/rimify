import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
import { t as VehicleSelector_default } from "./VehicleSelector-DobBWcVM.js";
//#region resources/js/Pages/FelgenSuchen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
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
		* Two routes in — the guided drill and the key numbers. On a phone the key numbers come first,
		* because someone holding their Zulassungsbescheinigung is faster typing seven characters than
		* scrolling a make list; from 900px the two sit side by side. The selector owns that order.
		*
		* A failure here never clears the form and never dead-ends (R-09): the selector keeps what was
		* typed and offers three ways forward.
		*
		* One page for every width.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Auto wählen" }, null, _parent));
			_push(`<section class="section" data-v-9e26bdd1><div class="wrap" data-v-9e26bdd1><h1 class="t-h1" data-v-9e26bdd1>Auto wählen, garantiert passende Felge finden</h1><p class="t-lead sel__lead" data-v-9e26bdd1> Zwei Wege – über die Fahrzeugdaten oder direkt über die Schlüsselnummern aus deinem Fahrzeugschein. </p><div class="sel__panel" data-v-9e26bdd1>`);
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
//#region resources/js/Pages/FelgenSuchen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/FelgenSuchen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9e26bdd1"]]);
//#endregion
export { Index_default as default };
