import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { i as wheelSVG, t as Svg_default } from "./Svg-Zaejjhw8.js";
//#region resources/js/Components/Art/Wheel.vue?vue&type=script&setup=true&lang.ts
var Wheel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Wheel",
	__ssrInlineRender: true,
	props: {
		spokes: { default: 5 },
		finish: { default: "graphite" },
		size: { default: 400 },
		tyre: {
			type: Boolean,
			default: false
		},
		initial: { default: "R" },
		title: { default: void 0 }
	},
	setup(__props) {
		/**
		* The alloy wheel. Nine layers, drawn in SVG — see resources/js/art/wheel.ts.
		*
		* Memoised on its own props so a listing page with twenty-four cards builds the markup once per
		* distinct spokes-and-finish pair rather than twenty-four times.
		*/
		const props = __props;
		const markup = (0, vue_exports.computed)(() => wheelSVG({
			spokes: props.spokes,
			finish: props.finish,
			size: props.size,
			tyre: props.tyre,
			initial: props.initial,
			title: props.title
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/Wheel.vue
var _sfc_setup = Wheel_vue_vue_type_script_setup_true_lang_default.setup;
Wheel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/Wheel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Wheel_default = Wheel_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Wheel_default as t };
