import { s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Desktop_default } from "./Desktop-BhyzN5iQ.js";
import { t as Mobile_default } from "./Mobile-3THdygPC.js";
import { r as useShared } from "./useShared-Cs__JTYP.js";
//#region resources/js/Pages/Admin/Anmelden/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Index",
	__ssrInlineRender: true,
	props: { stage: {} },
	setup(__props) {
		/** No layout: the login screen is the only admin page outside the panel frame. */
		const props = __props;
		const shared = useShared();
		return (_ctx, _push, _parent, _attrs) => {
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(shared).isMobile ? Mobile_default : Desktop_default), (0, vue_exports.mergeProps)(props, _attrs), null), _parent);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Anmelden/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Anmelden/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = Index_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Index_default as default };
