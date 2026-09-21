import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { t as BasketLines_default } from "./BasketLines-DHSi9Whk.js";
//#region resources/js/Pages/Kasse/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		contact: {},
		lines: {},
		totals: {}
	},
	setup(__props) {
		/**
		* Checkout. Guest only.
		*
		* `Zahlungspflichtig bestellen` is the exact wording on the final button, and it is not a style
		* choice: German distance-selling law requires the button to state that the order carries an
		* obligation to pay. `Jetzt kaufen` is not a lawful substitute.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kasse" }, null, _parent));
			_push(`<section class="section" data-v-3a65d6e7><div class="wrap" data-v-3a65d6e7><h1 class="t-h1" data-v-3a65d6e7>Kasse</h1><div class="split ko__split" data-v-3a65d6e7><form class="stack-5" data-v-3a65d6e7><fieldset class="card ko__group" data-v-3a65d6e7><legend class="t-h3" data-v-3a65d6e7>Kontakt</legend><div class="ko__grid" data-v-3a65d6e7><div data-v-3a65d6e7><label class="field-label" for="ko-mail" data-v-3a65d6e7> E-Mail <span class="field-label__req" data-v-3a65d6e7>*</span></label><input id="ko-mail" class="field" type="email" autocomplete="email" data-v-3a65d6e7></div><div data-v-3a65d6e7><label class="field-label" for="ko-tel" data-v-3a65d6e7>Telefon</label><input id="ko-tel" class="field" type="tel" autocomplete="tel" data-v-3a65d6e7></div></div></fieldset><fieldset class="card ko__group" data-v-3a65d6e7><legend class="t-h3" data-v-3a65d6e7>Lieferadresse</legend><div class="ko__grid" data-v-3a65d6e7><div data-v-3a65d6e7><label class="field-label" for="ko-first" data-v-3a65d6e7> Vorname <span class="field-label__req" data-v-3a65d6e7>*</span></label><input id="ko-first" class="field" autocomplete="given-name" data-v-3a65d6e7></div><div data-v-3a65d6e7><label class="field-label" for="ko-last" data-v-3a65d6e7> Nachname <span class="field-label__req" data-v-3a65d6e7>*</span></label><input id="ko-last" class="field" autocomplete="family-name" data-v-3a65d6e7></div><div class="ko__wide" data-v-3a65d6e7><label class="field-label" for="ko-street" data-v-3a65d6e7> Straße <span class="field-label__req" data-v-3a65d6e7>*</span></label><input id="ko-street" class="field" autocomplete="address-line1" data-v-3a65d6e7></div><div data-v-3a65d6e7><label class="field-label" for="ko-nr" data-v-3a65d6e7> Hausnummer <span class="field-label__req" data-v-3a65d6e7>*</span></label><input id="ko-nr" class="field" data-v-3a65d6e7></div><div data-v-3a65d6e7><label class="field-label" for="ko-zip" data-v-3a65d6e7> PLZ <span class="field-label__req" data-v-3a65d6e7>*</span></label><input id="ko-zip" class="field" inputmode="numeric" autocomplete="postal-code" data-v-3a65d6e7></div><div class="ko__wide" data-v-3a65d6e7><label class="field-label" for="ko-city" data-v-3a65d6e7> Ort <span class="field-label__req" data-v-3a65d6e7>*</span></label><input id="ko-city" class="field" autocomplete="address-level2" data-v-3a65d6e7></div></div></fieldset></form><aside class="card ko__summary" data-v-3a65d6e7><h2 class="t-h3" data-v-3a65d6e7>Deine Bestellung</h2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(BasketLines_default, {
				lines: __props.lines,
				readonly: ""
			}, null, _parent));
			_push(`<dl class="ko__rows" data-v-3a65d6e7><div data-v-3a65d6e7><dt data-v-3a65d6e7>Zwischensumme</dt><dd class="tabular" data-v-3a65d6e7>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.subtotal)}</dd></div><div data-v-3a65d6e7><dt data-v-3a65d6e7>Versand</dt><dd class="tabular" data-v-3a65d6e7>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.freeShipping ? "Kostenlos" : __props.totals.shipping)}</dd></div></dl><hr class="hr" data-v-3a65d6e7><div class="ko__total" data-v-3a65d6e7><span class="t-ui" data-v-3a65d6e7>Gesamt</span><span class="price" data-v-3a65d6e7>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</span></div><p class="price-note" data-v-3a65d6e7>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt.</p><button class="btn btn--primary btn--block btn--lg ko__pay" type="button" data-v-3a65d6e7> Zahlungspflichtig bestellen </button><p class="ko__ssl" data-v-3a65d6e7>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "lock",
				size: 20
			}, null, _parent));
			_push(`<span class="micro" data-v-3a65d6e7>SSL gesichert</span></p></aside></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kasse/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kasse/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3a65d6e7"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
