import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { s as icon } from "./useShared-B1ZdimaV.js";
import { t as Svg_default } from "./Svg-Zaejjhw8.js";
//#region resources/js/Components/Art/Icon.vue?vue&type=script&setup=true&lang.ts
var Icon_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Icon",
	__ssrInlineRender: true,
	props: {
		name: {},
		size: { default: 20 },
		label: { default: void 0 }
	},
	setup(__props) {
		/**
		* One icon from the set. 1.5px stroke, currentColor, 20px or 24px only.
		*
		* Decorative by default. Pass `label` only where the icon is the whole control — a bare icon
		* button in the header — because an aria-label beside a visible text label reads the name twice.
		*/
		const props = __props;
		const markup = (0, vue_exports.computed)(() => icon(props.name, {
			size: props.size,
			label: props.label
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/Icon.vue
var _sfc_setup = Icon_vue_vue_type_script_setup_true_lang_default.setup;
Icon_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/Icon.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Icon_default = Icon_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Icon_default as t };
