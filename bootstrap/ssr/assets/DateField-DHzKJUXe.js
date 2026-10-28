import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Components/Admin/dateField.ts
/** `2024-03-12` → `12.03.2024`; anything that is not an ISO date is shown as it is. */
function toGermanDate(iso) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
	return match ? `${match[3]}.${match[2]}.${match[1]}` : iso ?? "";
}
/** `12.3.2024` → `2024-03-12`; '' stays ''; null where the text is not a date that exists. */
function fromGermanDate(text) {
	const value = text.trim();
	if (value === "") return "";
	const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
	if (!match) return null;
	const [day, month, year] = [
		Number(match[1]),
		Number(match[2]),
		Number(match[3])
	];
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
//#endregion
//#region resources/js/Components/Admin/DateField.vue?vue&type=script&setup=true&lang.ts
var DateField_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DateField",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		id: {},
		invalid: { type: Boolean },
		describedby: {},
		disabled: { type: Boolean }
	}, {
		"modelValue": { required: true },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* A date typed the German way, TT.MM.JJJJ, whatever language the browser speaks — the native date
		* field follows the browser and shows „mm/dd/yyyy“ or „dd-----yyyy“. The model stays the ISO date the
		* server reads (`2024-03-12`, or '' for none). Text that is not a whole date goes to the server as
		* typed, so its German sentence says what is wrong instead of the field quietly dropping it.
		*/
		const model = (0, vue_exports.useModel)(__props, "modelValue");
		const text = (0, vue_exports.ref)(toGermanDate(model.value));
		(0, vue_exports.watch)(model, (value) => {
			if ((fromGermanDate(text.value) ?? text.value.trim()) !== value) text.value = toGermanDate(value);
		});
		return (_ctx, _push, _parent, _attrs) => {
			let _temp0;
			_push(`<input${(0, server_renderer_exports.ssrRenderAttrs)((_temp0 = (0, vue_exports.mergeProps)({
				id: __props.id,
				value: text.value,
				class: "input adm-date",
				type: "text",
				inputmode: "numeric",
				placeholder: "TT.MM.JJJJ",
				autocomplete: "off",
				maxlength: "10",
				disabled: __props.disabled,
				"aria-invalid": __props.invalid ? "true" : void 0,
				"aria-describedby": __props.describedby
			}, _attrs), (0, vue_exports.mergeProps)(_temp0, (0, server_renderer_exports.ssrGetDynamicModelProps)(_temp0, text.value))))} data-v-280119bb>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/DateField.vue
var _sfc_setup = DateField_vue_vue_type_script_setup_true_lang_default.setup;
DateField_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/DateField.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DateField_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DateField_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-280119bb"]]);
//#endregion
export { DateField_default as t };
