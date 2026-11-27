import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Admin/AdminProgress.vue?vue&type=script&setup=true&lang.ts
var AdminProgress_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminProgress",
	__ssrInlineRender: true,
	props: {
		id: {},
		percent: {},
		text: {}
	},
	setup(__props) {
		/**
		* How far a long piece of work is, as a bar and the words beside it (Fahrzeuge › Import, D-462): the bar for a glance,
		* the text — „12,4 MB von 100,0 MB gelesen“ — for what it means. The text names the bar for a screen reader.
		*/
		const props = __props;
		const shown = (0, vue_exports.computed)(() => Math.max(0, Math.min(100, Math.floor(props.percent))));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "adm-progress" }, _attrs))} data-v-ff70b759><div class="adm-progress__bar" role="progressbar"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${__props.id}-text`)} aria-valuemin="0" aria-valuemax="100"${(0, server_renderer_exports.ssrRenderAttr)("aria-valuenow", shown.value)} data-v-ff70b759><span class="adm-progress__fill" style="${(0, server_renderer_exports.ssrRenderStyle)({ width: `${shown.value}%` })}" data-v-ff70b759></span></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-text`)} class="adm-progress__text" data-v-ff70b759>${(0, server_renderer_exports.ssrInterpolate)(__props.text)} · ${(0, server_renderer_exports.ssrInterpolate)(shown.value)} %</p></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminProgress.vue
var _sfc_setup = AdminProgress_vue_vue_type_script_setup_true_lang_default.setup;
AdminProgress_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminProgress.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminProgress_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AdminProgress_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ff70b759"]]);
//#endregion
export { AdminProgress_default as t };
