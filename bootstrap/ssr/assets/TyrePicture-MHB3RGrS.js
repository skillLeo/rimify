import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Sketch/SeasonMark.vue?vue&type=script&setup=true&lang.ts
var SeasonMark_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SeasonMark",
	__ssrInlineRender: true,
	props: { season: {} },
	setup(__props) {
		/**
		* A tyre's season as a small sign and its word — Sommer, Winter, Ganzjahr — so a long list reads at a glance. In the ink
		* of the text around it: green, amber and blue speak of verdicts and actions here, never of a season (DIRECTION §2).
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "sk-season" }, _attrs))} data-v-29d69f4e>`);
			if (__props.season !== "winter") _push(`<svg class="sk-season__sign" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" data-v-29d69f4e><circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5" data-v-29d69f4e></circle><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" fill="none" data-v-29d69f4e></path></svg>`);
			else _push(`<!---->`);
			if (__props.season !== "sommer") _push(`<svg class="sk-season__sign" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" data-v-29d69f4e><path d="M10 2.5v15M3.5 6.25l13 7.5M16.5 6.25l-13 7.5M8 4l2 1.5L12 4M8 16l2-1.5 2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" fill="none" data-v-29d69f4e></path></svg>`);
			else _push(`<!---->`);
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.season === "sommer" ? "Sommer" : __props.season === "winter" ? "Winter" : "Ganzjahr")}</span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Sketch/SeasonMark.vue
var _sfc_setup$1 = SeasonMark_vue_vue_type_script_setup_true_lang_default.setup;
SeasonMark_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Sketch/SeasonMark.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var SeasonMark_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SeasonMark_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-29d69f4e"]]);
//#endregion
//#region resources/js/Components/Sketch/TyrePicture.vue?vue&type=script&setup=true&lang.ts
var TyrePicture_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TyrePicture",
	__ssrInlineRender: true,
	props: {
		size: { default: "" },
		px: { default: 160 },
		caption: { default: "Beispielbild" }
	},
	setup(__props) {
		/**
		* A tyre's picture in the sketches: a flat outline of a tyre, drawn in the ink of the page and captioned „Beispielbild" —
		* never a photograph of a different tyre, which would show the customer something they are not buying (the brief §9).
		* The day the client's photographs arrive, the real pages show them instead.
		*/
		const props = __props;
		const tread = (0, vue_exports.computed)(() => Array.from({ length: 36 }, (_, i) => {
			const a = i * Math.PI / 18;
			return {
				x1: 60 + 50 * Math.cos(a),
				y1: 60 + 50 * Math.sin(a),
				x2: 60 + 56 * Math.cos(a),
				y2: 60 + 56 * Math.sin(a)
			};
		}));
		const label = (0, vue_exports.computed)(() => props.size ? `${props.caption} · ${props.size}` : props.caption);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<figure${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "sk-tyrepic" }, _attrs))} data-v-0762e2a3><svg class="sk-tyrepic__art" viewBox="0 0 120 120" style="${(0, server_renderer_exports.ssrRenderStyle)({ maxWidth: `${__props.px}px` })}" aria-hidden="true" focusable="false" data-v-0762e2a3><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="1.5" data-v-0762e2a3></circle><circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" stroke-width="1.5" data-v-0762e2a3></circle><circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" stroke-width="1" data-v-0762e2a3></circle><circle cx="60" cy="60" r="6" fill="none" stroke="currentColor" stroke-width="1" data-v-0762e2a3></circle><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(tread.value, (mark, i) => {
				_push(`<line${(0, server_renderer_exports.ssrRenderAttr)("x1", mark.x1)}${(0, server_renderer_exports.ssrRenderAttr)("y1", mark.y1)}${(0, server_renderer_exports.ssrRenderAttr)("x2", mark.x2)}${(0, server_renderer_exports.ssrRenderAttr)("y2", mark.y2)} stroke="currentColor" stroke-width="1" data-v-0762e2a3></line>`);
			});
			_push(`<!--]--></svg>`);
			if (__props.caption) _push(`<figcaption class="sk-tyrepic__caption" data-v-0762e2a3>${(0, server_renderer_exports.ssrInterpolate)(label.value)}</figcaption>`);
			else _push(`<!---->`);
			_push(`</figure>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Sketch/TyrePicture.vue
var _sfc_setup = TyrePicture_vue_vue_type_script_setup_true_lang_default.setup;
TyrePicture_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Sketch/TyrePicture.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var TyrePicture_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TyrePicture_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0762e2a3"]]);
//#endregion
export { SeasonMark_default as n, TyrePicture_default as t };
