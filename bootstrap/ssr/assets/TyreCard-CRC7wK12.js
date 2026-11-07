import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { t as Picture_default } from "./Picture-BCiP7qkM.js";
import { n as SeasonMark_default, t as TyreSilhouette_default } from "./TyreSilhouette-cwM27VIO.js";
import { o as entryLineOrNone } from "./papers-B4aUsj_q.js";
//#region resources/js/Pages/Komplettrad/parts/TyreCard.vue?vue&type=script&setup=true&lang.ts
var TyreCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TyreCard",
	__ssrInlineRender: true,
	props: {
		card: {},
		chosen: { type: Boolean },
		papersExempt: { type: Boolean }
	},
	emits: ["choose", "details"],
	setup(__props, { emit: __emit }) {
		const failed = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["tc", { "tc--on": __props.chosen }],
				"data-tyre-card": __props.card.key
			}, _attrs))} data-v-c77150e8><label class="tc__pick" data-v-c77150e8><input class="visually-hidden" type="radio" name="kr-tyre"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.chosen) ? " checked" : ""} data-v-c77150e8><span class="tc__picture" data-v-c77150e8>`);
			if (__props.card.photos[0] && !failed.value) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
				image: __props.card.photos[0],
				alt: String(__props.card.photos[0].alt ?? ""),
				sizes: "(min-width: 600px) 355px, 112px"
			}, null, _parent));
			else _push((0, server_renderer_exports.ssrRenderComponent)(TyreSilhouette_default, null, null, _parent));
			_push(`</span><span class="tc__body" data-v-c77150e8><span class="tc__brand" translate="no" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(__props.card.brands.join(" · "))}</span>`);
			if (__props.card.name) _push(`<span class="tc__model" translate="no" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(__props.card.name)}</span>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SeasonMark_default, { season: __props.card.season }, null, _parent));
			_push(`<span class="tc__sizes" data-v-c77150e8><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.card.sides, (side) => {
				_push(`<span class="tc__size" data-v-c77150e8>`);
				if (side.axle) _push(`<span class="tc__axle" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(side.axle)}</span>`);
				else _push(`<!---->`);
				_push(`${(0, server_renderer_exports.ssrInterpolate)(side.axle ? " " : "")}`);
				if (side.line) _push(`<span translate="no" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(side.line)}</span>`);
				else _push(`<!---->`);
				_push(`${(0, server_renderer_exports.ssrInterpolate)(side.line ? " " : "")}<span class="tc__figure" translate="no" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(side.size)}</span></span>`);
			});
			_push(`<!--]--></span><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.card.sides.filter((s) => s.eu), (side) => {
				_push(`<span class="tc__label" data-v-c77150e8>`);
				if (side.axle && __props.card.sides.length > 1) _push(`<span class="tc__label-axle" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(side.axle)}</span>`);
				else _push(`<!---->`);
				_push(`<span class="tc__label-item" data-v-c77150e8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "fuel",
					size: 16
				}, null, _parent));
				_push(` Kraftstoff ${(0, server_renderer_exports.ssrInterpolate)(side.eu.fuel)}</span><span class="tc__label-item" data-v-c77150e8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "rain",
					size: 16
				}, null, _parent));
				_push(` Nässe ${(0, server_renderer_exports.ssrInterpolate)(side.eu.wet)}</span><span class="tc__label-item" data-v-c77150e8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "sound",
					size: 16
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(side.eu.noiseDb, "dB"))}</span>`);
				if (side.eu.snowGrip) {
					_push(`<span class="tc__label-item" data-v-c77150e8>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "snow",
						size: 16
					}, null, _parent));
					_push(` Schnee</span>`);
				} else _push(`<!---->`);
				_push(`</span>`);
			});
			_push(`<!--]-->`);
			if (__props.card.answer?.entry) _push(`<span class="tc__entry" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(entryLineOrNone)(true, __props.papersExempt === true))}</span>`);
			else _push(`<!---->`);
			_push(`<span class="tc__price" data-v-c77150e8><span class="tc__set" translate="no" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(__props.card.set)}</span><span class="tc__each" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(__props.card.unit)} · ${(0, server_renderer_exports.ssrInterpolate)(__props.card.each)}</span></span><span class="tc__stock" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(__props.card.isDemo ? "Beispielsortiment" : "Verfügbar")}</span><span class="btn btn--secondary tc__choice" data-v-c77150e8>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen ? "Ausgewählt" : "Auswählen")}</span></span><span class="tc__check" aria-hidden="true" data-v-c77150e8>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`</span></label><button class="link tc__details" type="button" data-v-c77150e8>Details<span class="visually-hidden" data-v-c77150e8> zu ${(0, server_renderer_exports.ssrInterpolate)(__props.card.brands.join(" "))} ${(0, server_renderer_exports.ssrInterpolate)(__props.card.name)}</span></button></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Komplettrad/parts/TyreCard.vue
var TyreCard_exports = /* @__PURE__ */ __exportAll({ default: () => TyreCard_default });
var _sfc_setup = TyreCard_vue_vue_type_script_setup_true_lang_default.setup;
TyreCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Komplettrad/parts/TyreCard.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var TyreCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TyreCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c77150e8"]]);
//#endregion
export { TyreCard_exports as n, TyreCard_default as t };
