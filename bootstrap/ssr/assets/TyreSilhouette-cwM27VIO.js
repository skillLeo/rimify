import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Ui/SeasonMark.vue?vue&type=script&setup=true&lang.ts
var SeasonMark_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SeasonMark",
	__ssrInlineRender: true,
	props: { season: {} },
	setup(__props) {
		/**
		* A tyre's season as a small sign and its word — Sommer, Winter, Ganzjahr — so a long list reads at a glance. In the ink of the text
		* around it: green, amber and blue speak of verdicts and actions here, never of a season (DIRECTION §2).
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "season-mark" }, _attrs))} data-v-7b8f22d2>`);
			if (__props.season !== "winter") _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "sun",
				size: 20,
				class: "season-mark__sign"
			}, null, _parent));
			else _push(`<!---->`);
			if (__props.season !== "sommer") _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "snowflake",
				size: 20,
				class: "season-mark__sign"
			}, null, _parent));
			else _push(`<!---->`);
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.season === "sommer" ? "Sommer" : __props.season === "winter" ? "Winter" : "Ganzjahr")}</span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/SeasonMark.vue
var _sfc_setup$1 = SeasonMark_vue_vue_type_script_setup_true_lang_default.setup;
SeasonMark_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/SeasonMark.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var SeasonMark_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SeasonMark_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7b8f22d2"]]);
//#endregion
//#region resources/js/Components/Ui/TyreSilhouette.vue?vue&type=script&setup=true&lang.ts
var TyreSilhouette_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TyreSilhouette",
	__ssrInlineRender: true,
	props: { plain: { type: Boolean } },
	setup(__props) {
		/**
		* A tyre without a photograph, in the shop and the admin (the Gutachten rework §9): a flat outline of a tyre, drawn in the ink of the
		* page — never a photograph of a different tyre, which would show the customer something they are not buying. Its width is the place
		* it stands in; its lines keep their thickness at any size.
		*/
		const tread = (0, vue_exports.computed)(() => Array.from({ length: 36 }, (_, i) => {
			const a = i * Math.PI / 18;
			return {
				x1: 60 + 50 * Math.cos(a),
				y1: 60 + 50 * Math.sin(a),
				x2: 60 + 56 * Math.cos(a),
				y2: 60 + 56 * Math.sin(a)
			};
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<svg${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "tyre-silhouette",
				viewBox: "0 0 120 120",
				"aria-hidden": "true",
				focusable: "false",
				"data-qa-ignore": ""
			}, _attrs))} data-v-bebc18e5><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" data-v-bebc18e5></circle><circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" data-v-bebc18e5></circle><circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" data-v-bebc18e5></circle><circle cx="60" cy="60" r="6" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" data-v-bebc18e5></circle><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.plain ? [] : tread.value, (mark, i) => {
				_push(`<line${(0, server_renderer_exports.ssrRenderAttr)("x1", mark.x1)}${(0, server_renderer_exports.ssrRenderAttr)("y1", mark.y1)}${(0, server_renderer_exports.ssrRenderAttr)("x2", mark.x2)}${(0, server_renderer_exports.ssrRenderAttr)("y2", mark.y2)} stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" data-v-bebc18e5></line>`);
			});
			_push(`<!--]--></svg>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/TyreSilhouette.vue
var _sfc_setup = TyreSilhouette_vue_vue_type_script_setup_true_lang_default.setup;
TyreSilhouette_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/TyreSilhouette.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var TyreSilhouette_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TyreSilhouette_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-bebc18e5"]]);
//#endregion
export { SeasonMark_default as n, TyreSilhouette_default as t };
