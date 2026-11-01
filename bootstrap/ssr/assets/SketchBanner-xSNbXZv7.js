import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Sketch/SketchBanner.vue?vue&type=script&setup=true&lang.ts
var SketchBanner_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SketchBanner",
	__ssrInlineRender: true,
	props: { note: { default: "Zum Anschauen und Durchklicken. Hier wird nichts gespeichert, nichts bestellt und nichts freigegeben." } },
	setup(__props) {
		/**
		* What every sketch page says first (the Gutachten rework brief §11, Phase 1): a picture of a page to come, filled with
		* invented data, where nothing is saved, ordered or released. Said in words, at the top, before anything can be mistaken
		* for the shop or the admin as they are.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-banner",
				role: "note",
				"data-sketch-banner": ""
			}, _attrs))} data-v-66754cca><strong class="sk-banner__title" data-v-66754cca>Skizze – keine echten Daten</strong><span class="sk-banner__note" data-v-66754cca>${(0, server_renderer_exports.ssrInterpolate)(__props.note)}</span></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Sketch/SketchBanner.vue
var _sfc_setup = SketchBanner_vue_vue_type_script_setup_true_lang_default.setup;
SketchBanner_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Sketch/SketchBanner.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var SketchBanner_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SketchBanner_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-66754cca"]]);
//#endregion
export { SketchBanner_default as t };
