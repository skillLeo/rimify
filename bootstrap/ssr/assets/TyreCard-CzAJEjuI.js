import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-eiBrxJ_i.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { n as SeasonMark_default, t as TyrePicture_default } from "./TyrePicture-MHB3RGrS.js";
import { f as deliveryText } from "./shopDemo-CkuVaHdt.js";
import { o as setPrice } from "./komplettradSketch-BcLQsC6z.js";
//#region resources/js/Pages/Skizze/parts/TyreCard.vue?vue&type=script&setup=true&lang.ts
var TyreCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TyreCard",
	__ssrInlineRender: true,
	props: {
		tyre: {},
		mode: {},
		chosen: { type: Boolean }
	},
	emits: ["choose", "details"],
	setup(__props, { emit: __emit }) {
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["kr-card", { "kr-card--on": __props.chosen }] }, _attrs))} data-v-fc772bf0><label class="kr-card__pick" data-v-fc772bf0><input class="visually-hidden" type="radio" name="kr-tyre"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.chosen) ? " checked" : ""} data-v-fc772bf0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(TyrePicture_default, {
				class: "kr-card__pic",
				size: __props.mode === "mixed" && __props.tyre.rear ? `${__props.tyre.front.size} · ${__props.tyre.rear.size}` : __props.tyre.front.size,
				px: 120
			}, null, _parent));
			_push(`<span class="kr-card__body" data-v-fc772bf0><span class="kr-card__brand" data-v-fc772bf0>${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.brand)}</span><span class="kr-card__model" data-v-fc772bf0>${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.model)}</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SeasonMark_default, { season: __props.tyre.season }, null, _parent));
			if (__props.mode === "mixed" && __props.tyre.rear) _push(`<span class="kr-card__size" data-v-fc772bf0><span data-v-fc772bf0>vorne ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.size)} ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.li)}${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.si)}</span><span data-v-fc772bf0>hinten ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.size)} ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.li)}${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.si)}</span></span>`);
			else _push(`<span class="kr-card__size" data-v-fc772bf0><span data-v-fc772bf0>${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.size)} ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.li)}${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.si)}</span></span>`);
			_push(`<span class="kr-label" data-v-fc772bf0><span class="kr-label__item" data-v-fc772bf0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "fuel",
				size: 16
			}, null, _parent));
			_push(` Kraftstoff ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.label.fuel)}</span><span class="kr-label__item" data-v-fc772bf0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "rain",
				size: 16
			}, null, _parent));
			_push(` Nässe ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.label.wet)}</span><span class="kr-label__item" data-v-fc772bf0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "sound",
				size: 16
			}, null, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(__props.tyre.label.noiseDb, "dB"))}</span>`);
			if (__props.tyre.label.snow) {
				_push(`<span class="kr-label__item" data-v-fc772bf0>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "snow",
					size: 16
				}, null, _parent));
				_push(` Schnee</span>`);
			} else _push(`<!---->`);
			_push(`</span><span class="kr-card__price" data-v-fc772bf0><span class="kr-card__set" data-v-fc772bf0>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(setPrice)(__props.tyre, __props.mode)))}</span><span class="kr-card__each" data-v-fc772bf0>${(0, server_renderer_exports.ssrInterpolate)(__props.mode === "mixed" && __props.tyre.rear ? "für 2 vorne und 2 hinten" : `für 4 · ${(0, vue_exports.unref)(formatMoney)(__props.tyre.front.priceCents)} je Reifen`)}</span></span><span class="${(0, server_renderer_exports.ssrRenderClass)([`kr-card__delivery--${__props.tyre.delivery}`, "kr-card__delivery"])}" data-v-fc772bf0>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(deliveryText)(__props.tyre.delivery))}</span></span><span class="kr-card__check" aria-hidden="true" data-v-fc772bf0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`</span></label><button class="kr-card__details" type="button" data-v-fc772bf0>Details<span class="visually-hidden" data-v-fc772bf0> zu ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.brand)} ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.model)}</span></button></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Skizze/parts/TyreCard.vue
var TyreCard_exports = /* @__PURE__ */ __exportAll({ default: () => TyreCard_default });
var _sfc_setup = TyreCard_vue_vue_type_script_setup_true_lang_default.setup;
TyreCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Skizze/parts/TyreCard.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var TyreCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TyreCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fc772bf0"]]);
//#endregion
export { TyreCard_exports as n, TyreCard_default as t };
