import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
//#region resources/js/Pages/Kasse/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		contact: {},
		lines: {},
		totals: {}
	},
	setup(__props) {
		/**
		* Checkout on a phone: one column, the summary collapsed above the form so the total is visible
		* before the typing starts rather than after it.
		*/
		const summaryOpen = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kasse" }, null, _parent));
			_push(`<section class="section mko" data-v-467c5ea8><div class="wrap" data-v-467c5ea8><h1 class="t-h1" data-v-467c5ea8>Kasse</h1><div class="card mko__summary" data-v-467c5ea8><button class="acc__head" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", summaryOpen.value)} data-v-467c5ea8><span data-v-467c5ea8>Bestellung ansehen · ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "chevron-down",
				size: 20
			}, null, _parent));
			_push(`</button>`);
			if (summaryOpen.value) {
				_push(`<div class="acc__body" data-v-467c5ea8><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
					_push(`<div class="mko__line" data-v-467c5ea8><span data-v-467c5ea8>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(line.title)}</span><span class="tabular" data-v-467c5ea8>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</span></div>`);
				});
				_push(`<!--]--><hr class="hr" data-v-467c5ea8><div class="mko__line" data-v-467c5ea8><span data-v-467c5ea8>Versand</span><span class="tabular" data-v-467c5ea8>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.freeShipping ? "Kostenlos" : __props.totals.shipping)}</span></div></div>`);
			} else _push(`<!---->`);
			_push(`</div><form class="stack-4 mko__form" data-v-467c5ea8><div data-v-467c5ea8><label class="field-label" for="mko-mail" data-v-467c5ea8> E-Mail <span class="field-label__req" data-v-467c5ea8>*</span></label><input id="mko-mail" class="field" type="email" autocomplete="email" data-v-467c5ea8></div><div data-v-467c5ea8><label class="field-label" for="mko-first" data-v-467c5ea8> Vorname <span class="field-label__req" data-v-467c5ea8>*</span></label><input id="mko-first" class="field" autocomplete="given-name" data-v-467c5ea8></div><div data-v-467c5ea8><label class="field-label" for="mko-last" data-v-467c5ea8> Nachname <span class="field-label__req" data-v-467c5ea8>*</span></label><input id="mko-last" class="field" autocomplete="family-name" data-v-467c5ea8></div><div data-v-467c5ea8><label class="field-label" for="mko-street" data-v-467c5ea8> Straße und Hausnummer <span class="field-label__req" data-v-467c5ea8>*</span></label><input id="mko-street" class="field" autocomplete="address-line1" data-v-467c5ea8></div><div class="mko__pair" data-v-467c5ea8><div data-v-467c5ea8><label class="field-label" for="mko-zip" data-v-467c5ea8> PLZ <span class="field-label__req" data-v-467c5ea8>*</span></label><input id="mko-zip" class="field" inputmode="numeric" autocomplete="postal-code" data-v-467c5ea8></div><div data-v-467c5ea8><label class="field-label" for="mko-city" data-v-467c5ea8> Ort <span class="field-label__req" data-v-467c5ea8>*</span></label><input id="mko-city" class="field" autocomplete="address-level2" data-v-467c5ea8></div></div></form></div></section><div class="stickybar" data-v-467c5ea8><div data-v-467c5ea8><span class="micro" data-v-467c5ea8>Gesamt</span><p class="price price--sm" data-v-467c5ea8>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</p></div><button class="btn btn--primary mko__pay" type="button" data-v-467c5ea8>Zahlungspflichtig bestellen</button></div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kasse/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kasse/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-467c5ea8"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
