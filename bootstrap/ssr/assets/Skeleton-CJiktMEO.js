import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
//#region resources/js/Components/Ui/Skeleton.vue?vue&type=script&setup=true&lang.ts
var Skeleton_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Skeleton",
	__ssrInlineRender: true,
	props: {
		width: { default: "100%" },
		height: { default: "1em" },
		tile: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* A placeholder the exact size of the content it stands in for. Never a spinner where the layout
		* is already known.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["skeleton", { "skeleton--tile": __props.tile }],
				style: {
					width: __props.width,
					height: __props.height
				},
				"aria-hidden": "true"
			}, _attrs))} data-v-be2ec241></span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Skeleton.vue
var _sfc_setup = Skeleton_vue_vue_type_script_setup_true_lang_default.setup;
Skeleton_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Skeleton.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Skeleton_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Skeleton_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-be2ec241"]]);
//#endregion
export { Skeleton_default as t };
