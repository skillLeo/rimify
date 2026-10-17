import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
//#region resources/js/Components/Admin/FilePick.vue?vue&type=script&setup=true&lang.ts
var FilePick_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FilePick",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		id: {},
		accept: {},
		label: { default: "Datei auswählen" },
		invalid: {
			type: Boolean,
			default: false
		},
		describedby: { default: void 0 },
		disabled: {
			type: Boolean,
			default: false
		}
	}, {
		"modelValue": { default: null },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["refused"], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		const file = (0, vue_exports.useModel)(__props, "modelValue");
		/** A file is being dragged over the field. */
		const hovering = (0, vue_exports.ref)(false);
		const summary = (0, vue_exports.computed)(() => {
			const chosen = file.value;
			if (chosen === null) return "Noch keine Datei gewählt";
			const kb = chosen.size / 1024;
			const size = kb < 1024 ? `${decimal(Math.max(1, Math.round(kb)), 0)} KB` : `${decimal(kb / 1024, 1)} MB`;
			return `${chosen.name} · ${size}`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["adm-filepick", { "adm-filepick--over": hovering.value }] }, _attrs))} data-v-e84ea527><input${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="visually-hidden" type="file"${(0, server_renderer_exports.ssrRenderAttr)("accept", __props.accept)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.disabled) ? " disabled" : ""} aria-hidden="true" tabindex="-1" data-v-e84ea527><label${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-button`)}${(0, server_renderer_exports.ssrRenderAttr)("for", __props.id)} class="btn btn--secondary adm-filepick__button" role="button"${(0, server_renderer_exports.ssrRenderAttr)("tabindex", __props.disabled ? -1 : 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", __props.disabled ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.invalid ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", __props.describedby ? `${__props.id}-name ${__props.describedby}` : `${__props.id}-name`)} data-v-e84ea527>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</label><span${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-name`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-filepick__name--empty": file.value === null }, "adm-filepick__name"])}" data-v-e84ea527>${(0, server_renderer_exports.ssrInterpolate)(summary.value)}</span></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/FilePick.vue
var _sfc_setup = FilePick_vue_vue_type_script_setup_true_lang_default.setup;
FilePick_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/FilePick.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FilePick_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FilePick_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e84ea527"]]);
//#endregion
export { FilePick_default as t };
