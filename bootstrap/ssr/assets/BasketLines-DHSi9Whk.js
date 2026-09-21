import { s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { t as Wheel_default } from "./Wheel-ZekNUHN8.js";
import { n as Tyre_default, t as useBasket } from "./useBasket-UdmGY3Af.js";
//#region resources/js/Components/Basket/BasketLines.vue?vue&type=script&setup=true&lang.ts
var BasketLines_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BasketLines",
	__ssrInlineRender: true,
	props: {
		lines: {},
		readonly: {
			type: Boolean,
			default: false
		}
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
			_push(`<table${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "table table--cart" }, _attrs))} data-v-e71ccd8d><thead data-v-e71ccd8d><tr data-v-e71ccd8d><th scope="col" data-v-e71ccd8d>Artikel</th><th scope="col" data-v-e71ccd8d>Menge</th><th scope="col" class="num" data-v-e71ccd8d>Einzelpreis</th><th scope="col" class="num" data-v-e71ccd8d>Summe</th></tr></thead><tbody data-v-e71ccd8d><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
				_push(`<tr data-v-e71ccd8d><td data-v-e71ccd8d><div class="bl__item" data-v-e71ccd8d><span class="bl__art" data-v-e71ccd8d>`);
				if (line.art.kind === "wheel") _push((0, server_renderer_exports.ssrRenderComponent)(Wheel_default, {
					spokes: line.art.spokes ?? 5,
					finish: line.art.finish ?? "graphite",
					size: 72
				}, null, _parent));
				else _push((0, server_renderer_exports.ssrRenderComponent)(Tyre_default, {
					label: line.art.label ?? "",
					size: 72
				}, null, _parent));
				_push(`</span><div class="bl__text" data-v-e71ccd8d><span class="micro" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.brandName)}</span><p class="bl__title" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.title)}</p><p class="bl__sub" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.subtitle)}</p>`);
				if (line.sizeLabel) _push(`<p class="data" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.sizeLabel)}</p>`);
				else _push(`<!---->`);
				_push(`<div class="bl__flags" data-v-e71ccd8d>`);
				if (!line.inStock) _push(`<span class="tag tag--danger" data-v-e71ccd8d> Nicht mehr verfügbar </span>`);
				else _push(`<!---->`);
				if (line.verdict) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_TONE[line.verdict.status], "tag"])}" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.label)}</span>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (line.verdict && line.verdict.conditions.length) {
					_push(`<ul class="bl__conditions" data-v-e71ccd8d><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(line.verdict.conditions, (c) => {
						_push(`<li data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(c)}</li>`);
					});
					_push(`<!--]--></ul>`);
				} else _push(`<!---->`);
				_push(`</div></div></td><td data-v-e71ccd8d>`);
				if (!__props.readonly) {
					_push(`<div class="bl__stepper" data-v-e71ccd8d><button class="bl__step" type="button" aria-label="Menge verringern" data-v-e71ccd8d> − </button><span class="tabular bl__qty" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)}</span><button class="bl__step" type="button" aria-label="Menge erhöhen" data-v-e71ccd8d> + </button><button class="bl__remove" type="button" aria-label="Position entfernen" data-v-e71ccd8d>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "trash",
						size: 20
					}, null, _parent));
					_push(`</button></div>`);
				} else _push(`<span class="tabular" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)}</span>`);
				_push(`</td><td class="num data" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.unitPrice)}</td><td class="num" data-v-e71ccd8d><strong class="tabular" data-v-e71ccd8d>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</strong></td></tr>`);
			});
			_push(`<!--]--></tbody></table>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Basket/BasketLines.vue
var _sfc_setup = BasketLines_vue_vue_type_script_setup_true_lang_default.setup;
BasketLines_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Basket/BasketLines.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var BasketLines_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BasketLines_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e71ccd8d"]]);
//#endregion
export { BasketLines_default as t };
