import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { a as thankYouCheckSVG, c as Svg_default } from "./art-DxGr5VAf.js";
//#region resources/js/Pages/Bestellung/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		order: {},
		lines: {},
		contact: {}
	},
	setup(__props) {
		/**
		* The order confirmation.
		*
		* The verdict shown per line is the FROZEN one, not a fresh computation. Eleven months from now a
		* customer whose workshop refused the wheels will open this page, and it has to say what they were
		* told on the day — including which revision of the document that answer came from.
		*/
		const tick = thankYouCheckSVG(56);
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
			_push(`<section class="section" data-v-2610c445><div class="wrap ord" data-v-2610c445><div class="ord__head" data-v-2610c445>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, { markup: (0, vue_exports.unref)(tick) }, null, _parent));
			_push(`<h1 class="t-h1" data-v-2610c445>Danke für deine Bestellung.</h1><p class="t-body" data-v-2610c445> Deine Bestellnummer ist <strong class="data" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.number)}</strong>. Eine Bestätigung ist unterwegs. </p></div><div class="split ord__split" data-v-2610c445><div class="card" data-v-2610c445><h2 class="t-h3" data-v-2610c445>Positionen</h2><table class="table" data-v-2610c445><thead data-v-2610c445><tr data-v-2610c445><th scope="col" data-v-2610c445>Artikel</th><th scope="col" data-v-2610c445>Freigabe</th><th scope="col" class="num" data-v-2610c445>Menge</th><th scope="col" class="num" data-v-2610c445>Summe</th></tr></thead><tbody data-v-2610c445><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
				_push(`<tr data-v-2610c445><td data-v-2610c445><span class="micro" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(line.kindLabel)}</span><p class="ord__label" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</p></td><td data-v-2610c445>`);
				if (line.verdict) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_CLASS[line.verdict.status], "tag"])}" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(VERDICT_LABEL[line.verdict.status])}</span>`);
				else _push(`<!---->`);
				if (line.verdict) _push(`<p class="data ord__rev" data-v-2610c445> Fassung ${(0, server_renderer_exports.ssrInterpolate)(line.verdict.documentRevision)}</p>`);
				else _push(`<!---->`);
				if (!line.verdict) _push(`<span class="quiet" data-v-2610c445>—</span>`);
				else _push(`<!---->`);
				_push(`</td><td class="num tabular" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)}</td><td class="num" data-v-2610c445><strong class="tabular" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</strong></td></tr>`);
			});
			_push(`<!--]--></tbody></table></div><aside class="stack-4" data-v-2610c445><div class="card" data-v-2610c445><h2 class="t-h3" data-v-2610c445>Übersicht</h2><dl class="ord__rows" data-v-2610c445><div data-v-2610c445><dt data-v-2610c445>Status</dt><dd data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.statusLabel)}</dd></div>`);
			if (__props.order.placedAt) _push(`<div data-v-2610c445><dt data-v-2610c445>Bestellt am</dt><dd class="data" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.placedAt)}</dd></div>`);
			else _push(`<!---->`);
			if (__props.order.vehicleLabel) _push(`<div data-v-2610c445><dt data-v-2610c445>Fahrzeug</dt><dd data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.vehicleLabel)}</dd></div>`);
			else _push(`<!---->`);
			if (__props.order.keyNumbers) _push(`<div data-v-2610c445><dt data-v-2610c445>HSN/TSN</dt><dd class="data" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.keyNumbers)}</dd></div>`);
			else _push(`<!---->`);
			if (__props.order.trackingCode) _push(`<div data-v-2610c445><dt data-v-2610c445>Sendung</dt><dd class="data" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.trackingCode)}</dd></div>`);
			else _push(`<!---->`);
			_push(`</dl><hr class="hr" data-v-2610c445><dl class="ord__rows" data-v-2610c445><div data-v-2610c445><dt data-v-2610c445>Zwischensumme</dt><dd class="tabular" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.subtotal)}</dd></div><div data-v-2610c445><dt data-v-2610c445>Versand</dt><dd class="tabular" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.shipping)}</dd></div><div data-v-2610c445><dt data-v-2610c445>Gesamt</dt><dd class="tabular ord__total" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.order.total)}</dd></div></dl><p class="price-note" data-v-2610c445>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.order.tax)} MwSt.</p></div><div class="panel--wash" data-v-2610c445><span class="micro" data-v-2610c445>Fragen zur Bestellung</span><p class="ord__contact" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phone)}</p><p class="quiet" data-v-2610c445>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</p>`);
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
			_push(`</div></aside></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Bestellung/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Bestellung/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2610c445"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
