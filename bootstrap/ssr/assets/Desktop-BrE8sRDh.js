import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { t as BasketLines_default } from "./BasketLines-DHSi9Whk.js";
//#region resources/js/Pages/Warenkorb/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		lines: {},
		totals: {}
	},
	setup(__props) {
		/**
		* The basket.
		*
		* The empty state is designed rather than defaulted: an empty basket is a page people reach by
		* accident, and it should send them somewhere rather than apologise.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Warenkorb" }, null, _parent));
			_push(`<section class="section" data-v-e2397f20><div class="wrap" data-v-e2397f20><h1 class="t-h1" data-v-e2397f20>Warenkorb</h1>`);
			if (__props.lines.length > 0) {
				_push(`<div class="split cart__split" data-v-e2397f20><div class="card cart__lines" data-v-e2397f20>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(BasketLines_default, { lines: __props.lines }, null, _parent));
				_push(`</div><aside class="card cart__summary" data-v-e2397f20><h2 class="t-h3" data-v-e2397f20>Zusammenfassung</h2><dl class="cart__rows" data-v-e2397f20><div data-v-e2397f20><dt data-v-e2397f20>Zwischensumme</dt><dd class="tabular" data-v-e2397f20>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.subtotal)}</dd></div><div data-v-e2397f20><dt data-v-e2397f20>Versand</dt><dd class="tabular" data-v-e2397f20>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.freeShipping ? "Kostenlos" : __props.totals.shipping)}</dd></div></dl><hr class="hr" data-v-e2397f20><div class="cart__total" data-v-e2397f20><span class="t-ui" data-v-e2397f20>Gesamt</span><span class="price" data-v-e2397f20>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</span></div><p class="price-note" data-v-e2397f20>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt.</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/kasse",
					class: "btn btn--primary btn--block btn--lg cart__go"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Zur Kasse `);
						else return [(0, vue_exports.createTextVNode)(" Zur Kasse ")];
					}),
					_: 1
				}, _parent));
				_push(`<p class="cart__ssl" data-v-e2397f20>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "lock",
					size: 20
				}, null, _parent));
				_push(`<span class="micro" data-v-e2397f20>SSL gesichert</span></p></aside></div>`);
			} else {
				_push(`<div class="state" data-v-e2397f20>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "cart",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-e2397f20>Dein Warenkorb ist leer.</p><p class="t-body" data-v-e2397f20> Wähle dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind. </p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug wählen`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			}
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Warenkorb/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Warenkorb/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e2397f20"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
