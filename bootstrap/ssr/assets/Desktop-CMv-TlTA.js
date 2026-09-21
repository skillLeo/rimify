import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { n as Photo_default, t as PHOTOS } from "./photos-BD5qS4Lv.js";
import { t as VehicleSelector_default } from "./VehicleSelector-DhI378vn.js";
//#region resources/js/Pages/Check/Desktop.vue?vue&type=script&setup=true&lang.ts
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
		* RIMIFY-CHECK as its own page: the promise the brand is built on, asked directly.
		*
		* It exists separately from the listing because the question is different. The listing asks "what
		* fits my car"; this page asks "does THIS wheel fit", which is what someone already holding a
		* quote from a workshop wants to know.
		*/
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
			_push(`<section class="rcheck-hero chk__hero" data-v-3fe2d162><div class="chk__art" aria-hidden="true" data-v-3fe2d162>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Photo_default, { photo: (0, vue_exports.unref)(PHOTOS).checkHero }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<span data-v-3fe2d162${_scopeId}></span>`);
					else return [(0, vue_exports.createVNode)("span")];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="wrap chk__inner" data-v-3fe2d162><p class="micro" data-v-3fe2d162>RIMIFY-CHECK</p><h1 class="t-display chk__title" data-v-3fe2d162>Passt diese Felge an mein Auto?</h1><p class="t-body chk__sub" data-v-3fe2d162> Wir beantworten die Frage anhand des Gutachtens – nicht anhand der Maße allein. </p></div></section><section class="section" data-v-3fe2d162><div class="wrap" data-v-3fe2d162><div class="panel" data-v-3fe2d162>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehicleSelector_default, {
				makes: __props.makes,
				models: __props.models,
				variants: __props.variants,
				"selected-make": __props.selectedMake,
				"selected-model": __props.selectedModel,
				"base-path": "/rimify-check"
			}, null, _parent));
			_push(`</div><div class="chk__steps" data-v-3fe2d162><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STEPS, (step, index) => {
				_push(`<article class="card chk__step" data-v-3fe2d162><span class="chk__num" data-v-3fe2d162>${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</span><h2 class="t-h3" data-v-3fe2d162>${(0, server_renderer_exports.ssrInterpolate)(step.title)}</h2><p class="t-body" data-v-3fe2d162>${(0, server_renderer_exports.ssrInterpolate)(step.body)}</p></article>`);
			});
			_push(`<!--]--></div><div class="panel--wash chk__note" data-v-3fe2d162>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "shield",
				size: 24
			}, null, _parent));
			_push(`<p class="t-body" data-v-3fe2d162> Liegt für eine Kombination kein Gutachten vor, sagen wir das – und raten nicht. </p></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Check/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Check/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3fe2d162"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
