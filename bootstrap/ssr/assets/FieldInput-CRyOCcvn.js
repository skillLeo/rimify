import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { i as isIconName, t as Icon_default } from "./Icon-eiBrxJ_i.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { l as overLimit, s as length } from "./content-DmUz2EQt.js";
//#region resources/js/Pages/Admin/Seiten/FieldInput.vue?vue&type=script&setup=true&lang.ts
var FieldInput_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FieldInput",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		field: {},
		id: {},
		error: { default: "" },
		readonly: {
			type: Boolean,
			default: false
		}
	}, {
		"modelValue": { required: true },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* One field of a page, drawn from its schema: the label, the right control, the counter, the help
		* line and the error. The counter reads the same limit the publish check enforces, so a text that
		* turns red here is exactly a text the server will refuse — never a guess (BRIEF-2 §1).
		*
		* The counter is quiet until it matters: always on for short fields, where every character counts,
		* and on a long text only once it passes nine tenths of the limit.
		*/
		const props = __props;
		const model = (0, vue_exports.useModel)(__props, "modelValue");
		const count = (0, vue_exports.computed)(() => length(model.value));
		const over = (0, vue_exports.computed)(() => overLimit(props.field, model.value));
		const showCounter = (0, vue_exports.computed)(() => {
			const max = props.field.max;
			if (max === null || props.field.kind === "number" || props.field.kind === "icon" || props.field.kind === "choice") return false;
			return max <= 300 || count.value >= max * .9;
		});
		const counterText = (0, vue_exports.computed)(() => {
			const max = props.field.max ?? 0;
			return `${formatNumber(count.value)} / ${formatNumber(max)}`;
		});
		const rows = (0, vue_exports.computed)(() => {
			const lines = (typeof model.value === "string" ? model.value : "").split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 72)), 0);
			return Math.min(20, Math.max(props.field.max !== null && props.field.max <= 250 ? 2 : 4, lines));
		});
		const describedBy = (0, vue_exports.computed)(() => [
			props.field.help ? `${props.id}-help` : null,
			`${props.id}-err`,
			showCounter.value ? `${props.id}-count` : null
		].filter(Boolean).join(" "));
		const iconName = (0, vue_exports.computed)(() => typeof model.value === "string" && isIconName(model.value) ? model.value : null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "form-field pg-field" }, _attrs))} data-v-00f617b8><div class="pg-field__top" data-v-00f617b8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", __props.id)} data-v-00f617b8>${(0, server_renderer_exports.ssrInterpolate)(__props.field.label)}`);
			if (!__props.field.required) _push(`<span class="pg-field__optional" data-v-00f617b8> (optional)</span>`);
			else _push(`<!---->`);
			_push(`</label>`);
			if (showCounter.value) _push(`<span${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-count`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "pg-field__count--over": over.value }, "pg-field__count"])}"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${count.value} von höchstens ${__props.field.max} Zeichen`)} data-v-00f617b8>${(0, server_renderer_exports.ssrInterpolate)(counterText.value)}</span>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (__props.field.kind === "textarea" || __props.field.kind === "html") _push(`<textarea${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "pg-field__area--code": __props.field.kind === "html" }, "input pg-field__area"])}"${(0, server_renderer_exports.ssrRenderAttr)("rows", __props.field.kind === "html" ? Math.max(8, rows.value) : rows.value)}${(0, server_renderer_exports.ssrRenderAttr)("spellcheck", __props.field.kind === "html" ? "false" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("autocapitalize", __props.field.kind === "html" ? "off" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-required", __props.field.required ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error || over.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-00f617b8>${(0, server_renderer_exports.ssrInterpolate)(model.value)}</textarea>`);
			else if (__props.field.kind === "choice") {
				_push(`<select${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="input pg-field__choice"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-00f617b8><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.field.options ?? [], (option) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-00f617b8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(model.value) ? (0, server_renderer_exports.ssrLooseContain)(model.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(model.value, option.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
				});
				_push(`<!--]--></select>`);
			} else if (__props.field.kind === "icon") {
				_push(`<div class="pg-field__icon" data-v-00f617b8><span class="pg-field__glyph" aria-hidden="true" data-v-00f617b8>`);
				if (iconName.value) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: iconName.value,
					size: 20
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</span><select${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-00f617b8><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.field.options ?? [], (option) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-00f617b8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(model.value) ? (0, server_renderer_exports.ssrLooseContain)(model.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(model.value, option.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
				});
				_push(`<!--]--></select></div>`);
			} else if (__props.field.kind === "number") _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="input pg-field__number" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("value", model.value ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-required", __props.field.required ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-00f617b8>`);
			else _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)}${(0, server_renderer_exports.ssrRenderAttr)("value", model.value)} class="input" type="text"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-required", __props.field.required ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error || over.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-00f617b8>`);
			if (__props.field.help) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-help`)} class="form-field__help" data-v-00f617b8>${(0, server_renderer_exports.ssrInterpolate)(__props.field.help)}</p>`);
			else _push(`<!---->`);
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-err`)} class="form-field__error" data-v-00f617b8>${(0, server_renderer_exports.ssrInterpolate)(__props.error)}</p></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/FieldInput.vue
var FieldInput_exports = /* @__PURE__ */ __exportAll({ default: () => FieldInput_default });
var _sfc_setup = FieldInput_vue_vue_type_script_setup_true_lang_default.setup;
FieldInput_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/FieldInput.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FieldInput_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FieldInput_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-00f617b8"]]);
//#endregion
export { FieldInput_exports as n, FieldInput_default as t };
