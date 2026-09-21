import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { t as Wheel_default } from "./Wheel-ZekNUHN8.js";
import { n as Tyre_default, t as useBasket } from "./useBasket-UdmGY3Af.js";
//#region resources/js/Pages/Warenkorb/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		lines: {},
		totals: {}
	},
	setup(__props) {
		useBasket();
		const VERDICT_TONE = {
			PERMITTED: "tag--ok",
			CONDITIONAL: "tag--warn",
			NOT_PERMITTED: "tag--danger",
			UNKNOWN: "tag--unknown"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Warenkorb" }, null, _parent));
			_push(`<section class="section mcart" data-v-b24fab0d><div class="wrap" data-v-b24fab0d><h1 class="t-h1" data-v-b24fab0d>Warenkorb</h1>`);
			if (__props.lines.length > 0) {
				_push(`<div class="stack-4 mcart__lines" data-v-b24fab0d><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
					_push(`<article class="card mcart__line" data-v-b24fab0d><span class="mcart__art" data-v-b24fab0d>`);
					if (line.art.kind === "wheel") _push((0, server_renderer_exports.ssrRenderComponent)(Wheel_default, {
						spokes: line.art.spokes ?? 5,
						finish: line.art.finish ?? "graphite",
						size: 80
					}, null, _parent));
					else _push((0, server_renderer_exports.ssrRenderComponent)(Tyre_default, {
						label: line.art.label ?? "",
						size: 80
					}, null, _parent));
					_push(`</span><div class="mcart__text" data-v-b24fab0d><span class="micro" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(line.brandName)}</span><p class="mcart__title" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(line.title)}</p><p class="mcart__sub" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(line.subtitle)}</p>`);
					if (line.sizeLabel) _push(`<p class="data" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(line.sizeLabel)}</p>`);
					else _push(`<!---->`);
					_push(`<div class="mcart__flags" data-v-b24fab0d>`);
					if (!line.inStock) _push(`<span class="tag tag--danger" data-v-b24fab0d> Nicht mehr verfügbar </span>`);
					else _push(`<!---->`);
					if (line.verdict) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_TONE[line.verdict.status], "tag"])}" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.label)}</span>`);
					else _push(`<!---->`);
					_push(`</div><div class="between mcart__foot" data-v-b24fab0d><div class="mcart__stepper" data-v-b24fab0d><button class="mcart__step" type="button" aria-label="Menge verringern" data-v-b24fab0d> − </button><span class="tabular mcart__qty" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)}</span><button class="mcart__step" type="button" aria-label="Menge erhöhen" data-v-b24fab0d> + </button></div><strong class="tabular" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</strong></div></div></article>`);
				});
				_push(`<!--]--></div>`);
			} else {
				_push(`<div class="state" data-v-b24fab0d>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "cart",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-b24fab0d>Dein Warenkorb ist leer.</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "btn btn--primary btn--block"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug wählen`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			}
			_push(`</div></section>`);
			if (__props.lines.length > 0) {
				_push(`<div class="stickybar" data-v-b24fab0d><div data-v-b24fab0d><span class="micro" data-v-b24fab0d>Gesamt</span><p class="price price--sm" data-v-b24fab0d>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</p></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/kasse",
					class: "btn btn--primary mcart__go"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zur Kasse`);
						else return [(0, vue_exports.createTextVNode)("Zur Kasse")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Warenkorb/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Warenkorb/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b24fab0d"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
