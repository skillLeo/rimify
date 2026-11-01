import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Sketch/SketchSteps.vue?vue&type=script&setup=true&lang.ts
var SketchSteps_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SketchSteps",
	__ssrInlineRender: true,
	props: {
		steps: {},
		current: {},
		reached: {},
		label: {}
	},
	emits: ["go"],
	setup(__props, { emit: __emit }) {
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<nav${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-steps",
				"aria-label": __props.label
			}, _attrs))} data-v-859a1d36><ol class="sk-steps__list" data-v-859a1d36><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.steps, (step, index) => {
				_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{
					"sk-steps__item--done": index < __props.current,
					"sk-steps__item--current": index === __props.current
				}, "sk-steps__item"])}" data-v-859a1d36><button type="button" class="sk-steps__button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index > __props.reached) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-current", index === __props.current ? "step" : void 0)} data-v-859a1d36><span class="sk-steps__n" aria-hidden="true" data-v-859a1d36>`);
				if (index < __props.current) _push(`<svg viewBox="0 0 16 16" width="14" height="14" focusable="false" data-v-859a1d36><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-859a1d36></path></svg>`);
				else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(index + 1)}<!--]-->`);
				_push(`</span><span class="sk-steps__label" data-v-859a1d36>${(0, server_renderer_exports.ssrInterpolate)(step)}</span>`);
				if (index < __props.current) _push(`<span class="visually-hidden" data-v-859a1d36>(erledigt)</span>`);
				else _push(`<!---->`);
				_push(`</button></li>`);
			});
			_push(`<!--]--></ol></nav>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Sketch/SketchSteps.vue
var _sfc_setup = SketchSteps_vue_vue_type_script_setup_true_lang_default.setup;
SketchSteps_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Sketch/SketchSteps.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var SketchSteps_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SketchSteps_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-859a1d36"]]);
//#endregion
export { SketchSteps_default as t };
