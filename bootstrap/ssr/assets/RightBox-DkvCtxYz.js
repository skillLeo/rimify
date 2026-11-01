import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
//#region resources/js/Pages/Admin/Rollen/RightBox.vue?vue&type=script&setup=true&lang.ts
var RightBox_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RightBox",
	__ssrInlineRender: true,
	props: {
		label: {},
		allowed: { type: Boolean },
		editable: { type: Boolean },
		mixed: {
			type: Boolean,
			default: false
		},
		busy: {
			type: Boolean,
			default: false
		}
	},
	emits: ["change"],
	setup(__props, { emit: __emit }) {
		return (_ctx, _push, _parent, _attrs) => {
			if (__props.editable) _push(`<label${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rol-box" }, _attrs))} data-v-2e53e8c7><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.allowed) ? " checked" : ""}${(0, server_renderer_exports.ssrRenderAttr)("indeterminate", __props.mixed)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.busy) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", __props.busy ? "true" : void 0)} data-v-2e53e8c7><span class="visually-hidden" data-v-2e53e8c7>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span></label>`);
			else if (__props.allowed) {
				_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rol-box rol-box--yes" }, _attrs))} data-v-2e53e8c7>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "check",
					size: 20
				}, null, _parent));
				_push(`<span class="visually-hidden" data-v-2e53e8c7>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}: erlaubt</span></span>`);
			} else _push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rol-box rol-box--no" }, _attrs))} data-v-2e53e8c7><span aria-hidden="true" data-v-2e53e8c7>–</span><span class="visually-hidden" data-v-2e53e8c7>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}: nicht erlaubt</span></span>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rollen/RightBox.vue
var RightBox_exports = /* @__PURE__ */ __exportAll({ default: () => RightBox_default });
var _sfc_setup = RightBox_vue_vue_type_script_setup_true_lang_default.setup;
RightBox_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rollen/RightBox.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RightBox_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RightBox_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2e53e8c7"]]);
//#endregion
export { RightBox_exports as n, RightBox_default as t };
