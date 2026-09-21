import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { a as thankYouCheckSVG, c as Svg_default } from "./art-DxGr5VAf.js";
//#region resources/js/Pages/Bestellung/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		order: {},
		lines: {},
		contact: {}
	},
	setup(__props) {
		/** The confirmation on a phone: the same frozen verdicts, stacked as cards. */
		const tick = thankYouCheckSVG(48);
		const VERDICT_LABEL = {
			PERMITTED: "Freigegeben",
			CONDITIONAL: "Freigegeben mit Auflagen",
			NOT_PERMITTED: "Nicht freigegeben",
			UNKNOWN: "Keine Freigabe hinterlegt"
		};
		const VERDICT_CLASS = {
			PERMITTED: "tag--ok",
			CONDITIONAL: "tag--warn",
			NOT_PERMITTED: "tag--danger",
			UNKNOWN: "tag--unknown"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `Bestellung ${__props.order.number}` }, null, _parent));
			_push(`<section class="section" data-v-2bdf286e><div class="wrap" data-v-2bdf286e><div class="mord__head" data-v-2bdf286e>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, { markup: (0, vue_exports.unref)(tick) }, null, _parent));
			_push(`<h1 class="t-h1" data-v-2bdf286e>Danke für deine Bestellung.</h1><p class="t-body" data-v-2bdf286e> Bestellnummer <strong class="data" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(__props.order.number)}</strong></p></div><div class="stack-4 mord__lines" data-v-2bdf286e><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
				_push(`<article class="card" data-v-2bdf286e><span class="micro" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(line.kindLabel)}</span><p class="mord__label" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</p><div class="between mord__foot" data-v-2bdf286e>`);
				if (line.verdict) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_CLASS[line.verdict.status], "tag"])}" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(VERDICT_LABEL[line.verdict.status])}</span>`);
				else _push(`<span class="quiet" data-v-2bdf286e>—</span>`);
				_push(`<strong class="tabular" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</strong></div></article>`);
			});
			_push(`<!--]--></div><div class="card mord__summary" data-v-2bdf286e><dl class="mord__rows" data-v-2bdf286e><div data-v-2bdf286e><dt data-v-2bdf286e>Status</dt><dd data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(__props.order.statusLabel)}</dd></div>`);
			if (__props.order.vehicleLabel) _push(`<div data-v-2bdf286e><dt data-v-2bdf286e>Fahrzeug</dt><dd data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(__props.order.vehicleLabel)}</dd></div>`);
			else _push(`<!---->`);
			_push(`<div data-v-2bdf286e><dt data-v-2bdf286e>Versand</dt><dd class="tabular" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(__props.order.shipping)}</dd></div><div data-v-2bdf286e><dt data-v-2bdf286e>Gesamt</dt><dd class="tabular mord__total" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(__props.order.total)}</dd></div></dl><p class="price-note" data-v-2bdf286e>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.order.tax)} MwSt.</p></div><div class="panel--wash mord__help" data-v-2bdf286e><span class="micro" data-v-2bdf286e>Fragen zur Bestellung</span><p class="mord__contact" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phone)}</p><p class="quiet" data-v-2bdf286e>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/kontakt",
				class: "btn btn--secondary btn--block"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zum Kontaktformular`);
					else return [(0, vue_exports.createTextVNode)("Zum Kontaktformular")];
				}),
				_: 1
			}, _parent));
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Bestellung/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Bestellung/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2bdf286e"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
