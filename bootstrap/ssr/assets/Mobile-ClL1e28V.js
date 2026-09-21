import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { n as Photo_default, t as PHOTOS } from "./photos-BD5qS4Lv.js";
import { t as VehicleSelector_default } from "./VehicleSelector-DhI378vn.js";
//#region resources/js/Pages/Check/Mobile.vue?vue&type=script&setup=true&lang.ts
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
		/** RIMIFY-CHECK on a phone: the selector first, the explanation beneath it. */
		const STEPS = [
			{
				title: "Fahrzeug wählen",
				body: "Über die Fahrzeugdaten oder die Schlüsselnummern aus deinem Fahrzeugschein."
			},
			{
				title: "Felge wählen",
				body: "Marke, Modell und Größe – wir prüfen jede Kombination einzeln."
			},
			{
				title: "Ergebnis erhalten",
				body: "Mit Gutachten, Auflagen im Klartext und passenden Reifengrößen."
			}
		];
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "RIMIFY-CHECK" }, null, _parent));
			_push(`<section class="rcheck-hero mchk__hero" data-v-f8ff0fe6><div class="mchk__art" aria-hidden="true" data-v-f8ff0fe6>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Photo_default, { photo: (0, vue_exports.unref)(PHOTOS).checkHero }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<span data-v-f8ff0fe6${_scopeId}></span>`);
					else return [(0, vue_exports.createVNode)("span")];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="mchk__inner" data-v-f8ff0fe6><p class="micro" data-v-f8ff0fe6>RIMIFY-CHECK</p><h1 class="t-display mchk__title" data-v-f8ff0fe6>Passt diese Felge an mein Auto?</h1></div></section><section class="section" data-v-f8ff0fe6><div class="wrap" data-v-f8ff0fe6><div class="card mchk__card" data-v-f8ff0fe6>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehicleSelector_default, {
				makes: __props.makes,
				models: __props.models,
				variants: __props.variants,
				"selected-make": __props.selectedMake,
				"selected-model": __props.selectedModel,
				"base-path": "/rimify-check"
			}, null, _parent));
			_push(`</div><div class="stack-4 mchk__steps" data-v-f8ff0fe6><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STEPS, (step, index) => {
				_push(`<article class="card" data-v-f8ff0fe6><span class="mchk__num" data-v-f8ff0fe6>${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</span><h2 class="t-h3" data-v-f8ff0fe6>${(0, server_renderer_exports.ssrInterpolate)(step.title)}</h2><p class="t-body" data-v-f8ff0fe6>${(0, server_renderer_exports.ssrInterpolate)(step.body)}</p></article>`);
			});
			_push(`<!--]--></div><div class="panel--wash mchk__note" data-v-f8ff0fe6>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "shield",
				size: 24
			}, null, _parent));
			_push(`<p class="t-body" data-v-f8ff0fe6> Liegt für eine Kombination kein Gutachten vor, sagen wir das – und raten nicht. </p></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Check/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Check/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f8ff0fe6"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
