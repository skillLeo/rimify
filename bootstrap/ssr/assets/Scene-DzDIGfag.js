import { s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { c as Svg_default, n as sceneSVG } from "./art-DxGr5VAf.js";
//#region resources/js/Components/Art/Scene.vue?vue&type=script&setup=true&lang.ts
var Scene_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Scene",
	__ssrInlineRender: true,
	props: {
		name: {},
		width: { default: 640 },
		title: { default: void 0 }
	},
	setup(__props) {
		/**
		* The two named scenes. These fill the slots where the client's own Figma used stock photography
		* and a flat-people illustration, both of which are on the banned list.
		*/
		const props = __props;
		const markup = (0, vue_exports.computed)(() => sceneSVG(props.name, {
			width: props.width,
			title: props.title
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/Scene.vue
var _sfc_setup = Scene_vue_vue_type_script_setup_true_lang_default.setup;
Scene_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/Scene.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Scene_default = Scene_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Scene_default as t };
