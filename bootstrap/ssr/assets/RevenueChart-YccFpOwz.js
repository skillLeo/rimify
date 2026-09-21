import { s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { c as Svg_default, i as revenueChartSVG } from "./art-DxGr5VAf.js";
//#region resources/js/Components/Art/RevenueChart.vue?vue&type=script&setup=true&lang.ts
var RevenueChart_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RevenueChart",
	__ssrInlineRender: true,
	props: {
		points: {},
		width: { default: 720 },
		height: { default: 220 }
	},
	setup(__props) {
		/** The admin dashboard revenue line. No charting library: twelve points and a shape. */
		const props = __props;
		const markup = (0, vue_exports.computed)(() => revenueChartSVG(props.points, props.width, props.height));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/RevenueChart.vue
var _sfc_setup = RevenueChart_vue_vue_type_script_setup_true_lang_default.setup;
RevenueChart_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/RevenueChart.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RevenueChart_default = RevenueChart_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { RevenueChart_default as t };
