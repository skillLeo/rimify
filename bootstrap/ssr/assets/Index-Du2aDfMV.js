import { i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AppLayout_default } from "./AppLayout-CBKndt4m.js";
import { t as VehicleSelector_default } from "./VehicleSelector-CEJoA1FE.js";
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
		selectedModel: {},
		returnTo: {}
	},
	setup(__props) {
		/**
		* The vehicle selector as a full page.
		*
		* Two routes in — the key numbers and the guided drill. The key numbers come first, because someone
		* holding their Zulassungsbescheinigung is faster typing seven characters than scrolling a make list;
		* from 900px the two sit side by side in the same order. The selector owns that order, in its markup.
		*
		* A failure here never clears the form and never dead-ends (R-09): the selector keeps what was
		* typed and offers three ways forward.
		*
		* One page for every width.
		*/
		const props = __props;
		const baseQuery = (0, vue_exports.computed)(() => {
			const query = {};
			if (props.returnTo) query.zurueck = props.returnTo;
			return query;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Fahrzeug wählen" }, null, _parent));
			_push(`<section class="section" data-v-72a5a568><div class="wrap" data-v-72a5a568><h1 class="t-h1" data-v-72a5a568>Fahrzeug wählen</h1><p class="t-lead sel__lead" data-v-72a5a568> Danach siehst du nur Felgen, deren Gutachten dein Auto nennt. Zwei Wege – direkt über die Schlüsselnummern aus deinen Fahrzeugpapieren oder über Marke und Modell. </p><div class="sel__panel" data-v-72a5a568>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehicleSelector_default, {
				makes: __props.makes,
				models: __props.models,
				variants: __props.variants,
				"selected-make": __props.selectedMake,
				"selected-model": __props.selectedModel,
				"base-path": "/felgen-suchen",
				"base-query": baseQuery.value,
				"return-to": __props.returnTo ?? null,
				"heading-level": 2
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-72a5a568"]]);
//#endregion
export { Index_default as default };
