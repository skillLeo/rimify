import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as Icon_default } from "./Icon-D4PPT3t7.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Ui/StepBar.vue?vue&type=script&setup=true&lang.ts
var StepBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepBar",
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
			}, _attrs))} data-v-edef8ea9><ol class="sk-steps__list" data-v-edef8ea9><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.steps, (step, index) => {
				_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{
					"sk-steps__item--done": index < __props.current,
					"sk-steps__item--current": index === __props.current
				}, "sk-steps__item"])}" data-v-edef8ea9><button type="button" class="sk-steps__button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index > __props.reached) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-current", index === __props.current ? "step" : void 0)} data-v-edef8ea9><span class="sk-steps__n" aria-hidden="true" data-v-edef8ea9>`);
				if (index < __props.current) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 16
				}, null, _parent));
				else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(index + 1)}<!--]-->`);
				_push(`</span><span class="sk-steps__label" data-v-edef8ea9>${(0, server_renderer_exports.ssrInterpolate)(step)}</span>`);
				if (index < __props.current) _push(`<span class="visually-hidden" data-v-edef8ea9>(erledigt)</span>`);
				else _push(`<!---->`);
				_push(`</button></li>`);
			});
			_push(`<!--]--></ol></nav>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/StepBar.vue
var _sfc_setup = StepBar_vue_vue_type_script_setup_true_lang_default.setup;
StepBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/StepBar.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepBar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepBar_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-edef8ea9"]]);
//#endregion
export { StepBar_default as t };
