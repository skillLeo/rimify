import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Product/BuyModeChoice.vue?vue&type=script&setup=true&lang.ts
var BuyModeChoice_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BuyModeChoice",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		rimPrice: {},
		rimPriceUnit: {},
		setFrom: {},
		setFromUnit: {},
		name: {}
	}, {
		"modelValue": { default: "felgen" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* „Was möchtest du bestellen?“ — Nur Felgen or Kompletträder (the client's #18), two radio tiles, the whole tile the
		* control. The product page and the RIMIFY-Check (#28) ask it the same way; what follows the choice is theirs.
		*
		* Each tile says what it costs in the same words: the rims „pro Felge“, the Kompletträder „ab … pro Rad“ — figures the server
		* formatted. One selected state for every tile on the page: a 2 px blue border and the check, no tint (D-132).
		*/
		const mode = (0, vue_exports.useModel)(__props, "modelValue");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<fieldset${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "bmc" }, _attrs))} data-v-0e0c82d0><legend class="label bmc__legend" data-v-0e0c82d0>Was möchtest du bestellen?</legend><div class="bmc__tiles" data-v-0e0c82d0><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "bmc-tile--on": mode.value === "felgen" }, "bmc-tile"])}" data-v-0e0c82d0><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "felgen")) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", __props.name ?? "pdp-mode")} value="felgen" data-v-0e0c82d0><span class="bmc-tile__name" data-v-0e0c82d0>Nur Felgen</span><span class="bmc-tile__sub" data-v-0e0c82d0> Ohne Reifen `);
			if (__props.rimPrice) _push(`<span class="bmc-tile__price" data-v-0e0c82d0><span class="num" translate="no" data-v-0e0c82d0>${(0, server_renderer_exports.ssrInterpolate)(__props.rimPrice)}</span> ${(0, server_renderer_exports.ssrInterpolate)(__props.rimPriceUnit ?? "pro Felge")}</span>`);
			else _push(`<!---->`);
			_push(`</span><span class="bmc-tile__check" aria-hidden="true" data-v-0e0c82d0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`</span></label><label class="${(0, server_renderer_exports.ssrRenderClass)([{ "bmc-tile--on": mode.value === "komplettrad" }, "bmc-tile"])}" data-v-0e0c82d0><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "komplettrad")) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", __props.name ?? "pdp-mode")} value="komplettrad" data-v-0e0c82d0><span class="bmc-tile__name" data-v-0e0c82d0>Kompletträder</span><span class="bmc-tile__sub" data-v-0e0c82d0> Mit Reifen, fertig montiert `);
			if (__props.setFrom) _push(`<span class="bmc-tile__price" data-v-0e0c82d0>ab <span class="num" translate="no" data-v-0e0c82d0>${(0, server_renderer_exports.ssrInterpolate)(__props.setFrom)}</span> ${(0, server_renderer_exports.ssrInterpolate)(__props.setFromUnit ?? "pro Rad")}</span>`);
			else _push(`<!---->`);
			_push(`</span><span class="bmc-tile__check" aria-hidden="true" data-v-0e0c82d0>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "check",
				size: 20
			}, null, _parent));
			_push(`</span></label></div></fieldset>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/BuyModeChoice.vue
var _sfc_setup = BuyModeChoice_vue_vue_type_script_setup_true_lang_default.setup;
BuyModeChoice_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/BuyModeChoice.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var BuyModeChoice_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BuyModeChoice_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0e0c82d0"]]);
//#endregion
//#region resources/js/lib/papersForm.ts
/** Whether a verdict's tyres wait for fields of the car's papers (`tyre.owed`, D-286). */
function waitsForPapers(verdict) {
	return (verdict?.tyre?.owed ?? []).length > 0;
}
//#endregion
export { BuyModeChoice_default as n, waitsForPapers as t };
