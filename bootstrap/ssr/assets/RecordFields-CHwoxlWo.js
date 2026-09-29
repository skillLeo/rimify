import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as DateField_default } from "./DateField-COag7VXL.js";
//#region resources/js/Pages/Admin/Gutachten/RecordFields.vue?vue&type=script&setup=true&lang.ts
var RecordFields_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RecordFields",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		kind: {},
		errors: {},
		supplementable: {},
		idPrefix: {}
	}, {
		"shape": { required: true },
		"shapeModifiers": {}
	}),
	emits: ["update:shape"],
	setup(__props) {
		/**
		* The record's shape beyond its number (the corrections memo §4): a Nachtrag's base — one of ours, or the
		* number of one we do not hold — and page 1's header: Anlage, Prüfbericht-Nr., Ausfertigung,
		* Benennungsnummer, Prüfort, Prüfdatum, Stand, and „gültig ab Fertigungsdatum“ (a month).
		*
		* The header is folded away while it is empty: most documents are entered without it first. A Nachtrag
		* without its base in our hands is said where it is chosen, as the record, the Abdeckung and the shop
		* will say it.
		*/
		const props = __props;
		const shape = (0, vue_exports.useModel)(__props, "shape");
		function id(name) {
			return `${props.idPrefix}-${name}`;
		}
		function err(key) {
			return props.errors[key] ?? "";
		}
		const HEADER = [
			"annex",
			"test_report_number",
			"copy_number",
			"designation_number",
			"test_site",
			"test_date",
			"revision_date",
			"valid_from_production"
		];
		const more = (0, vue_exports.ref)(null);
		const hasHeader = (0, vue_exports.computed)(() => HEADER.some((key) => shape.value[key] !== ""));
		const refused = (0, vue_exports.computed)(() => HEADER.some((key) => Boolean(props.errors[key])));
		function unfold() {
			if (more.value) more.value.open = true;
		}
		(0, vue_exports.onMounted)(() => {
			if (hasHeader.value || refused.value) unfold();
		});
		(0, vue_exports.watch)(refused, (value) => {
			if (value) unfold();
		}, { flush: "pre" });
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rsf" }, _attrs))} data-v-8509a6d8>`);
			if (__props.kind === "NACHTRAG") {
				_push(`<div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("base"))} data-v-8509a6d8>Nachtrag zu</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id("base"))} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("base")}-help ${id("base")}-err`)} data-v-8509a6d8><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} data-v-8509a6d8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.supplement_to_id) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.supplement_to_id, null) : (0, server_renderer_exports.ssrLooseEqual)(shape.value.supplement_to_id, null)) ? " selected" : ""}>Einem Gutachten, das uns nicht vorliegt</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.supplementable, (doc) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", doc.value)} data-v-8509a6d8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.supplement_to_id) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.supplement_to_id, doc.value) : (0, server_renderer_exports.ssrLooseEqual)(shape.value.supplement_to_id, doc.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(doc.label)}</option>`);
				});
				_push(`<!--]--></select>`);
				if (shape.value.supplement_to_id === null) _push(`<div class="form-field rsf-base-number" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("base-number"))} data-v-8509a6d8>Nummer des Grundgutachtens</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("base-number"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.supplement_to_number)} class="input rsf-short" type="text" maxlength="64" spellcheck="false" placeholder="z. B. ABE 53841"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("supplement_to_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("base")}-help ${id("base")}-err`)} data-v-8509a6d8></div>`);
				else _push(`<!---->`);
				_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("base")}-help`)} class="form-field__help" data-v-8509a6d8> Liegt das Grundgutachten nicht vor, sagen der Datensatz, die Abdeckung und der Shop: Dieser Nachtrag allein ist nicht die ganze Freigabe. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("base")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("supplement_to_id") || err("supplement_to_number"))}</p></div>`);
			} else _push(`<!---->`);
			_push(`<details class="rsf-more" data-v-8509a6d8><summary class="rsf-more__summary" data-v-8509a6d8>Weitere Angaben von Seite 1</summary><div class="rsf-pair" data-v-8509a6d8><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("annex"))} data-v-8509a6d8>Anlage</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("annex"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.annex)} class="input" type="text" maxlength="64"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("annex") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("annex")}-err`)} data-v-8509a6d8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("annex")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("annex"))}</p></div><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("report"))} data-v-8509a6d8>Prüfbericht-Nr.</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("report"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.test_report_number)} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("test_report_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("report")}-err`)} data-v-8509a6d8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("report")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("test_report_number"))}</p></div><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("copy"))} data-v-8509a6d8>Ausfertigung</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("copy"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.copy_number)} class="input" type="text" maxlength="32"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("copy_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("copy")}-err`)} data-v-8509a6d8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("copy")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("copy_number"))}</p></div><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("designation"))} data-v-8509a6d8>Benennungsnummer</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("designation"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.designation_number)} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("designation_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("designation")}-err`)} data-v-8509a6d8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("designation")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("designation_number"))}</p></div><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("site"))} data-v-8509a6d8>Prüfort</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("site"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.test_site)} class="input" type="text" maxlength="120"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("test_site") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("site")}-err`)} data-v-8509a6d8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("site")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("test_site"))}</p></div><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("test-date"))} data-v-8509a6d8>Prüfdatum</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("test-date"),
				modelValue: shape.value.test_date,
				"onUpdate:modelValue": ($event) => shape.value.test_date = $event,
				invalid: Boolean(err("test_date")),
				describedby: `${id("test-date")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("test-date")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("test_date"))}</p></div><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("revision"))} data-v-8509a6d8>Stand</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("revision"),
				modelValue: shape.value.revision_date,
				"onUpdate:modelValue": ($event) => shape.value.revision_date = $event,
				invalid: Boolean(err("revision_date")),
				describedby: `${id("revision")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("revision")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("revision_date"))}</p></div><div class="form-field" data-v-8509a6d8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("production"))} data-v-8509a6d8>Gültig ab Fertigungsdatum</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("production"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.valid_from_production)} class="input rsf-short" type="text" maxlength="7" inputmode="decimal" placeholder="03.2021"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("valid_from_production") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("production")}-help ${id("production")}-err`)} data-v-8509a6d8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("production")}-help`)} class="form-field__help" data-v-8509a6d8>Monat und Jahr. Eine Felge, die davor gefertigt wurde, deckt das Dokument nicht – der Shop sagt das dazu.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("production")}-err`)} class="form-field__error" data-v-8509a6d8>${(0, server_renderer_exports.ssrInterpolate)(err("valid_from_production"))}</p></div></div></details></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/RecordFields.vue
var RecordFields_exports = /* @__PURE__ */ __exportAll({ default: () => RecordFields_default });
var _sfc_setup = RecordFields_vue_vue_type_script_setup_true_lang_default.setup;
RecordFields_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/RecordFields.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RecordFields_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RecordFields_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8509a6d8"]]);
//#endregion
export { RecordFields_exports as n, RecordFields_default as t };
