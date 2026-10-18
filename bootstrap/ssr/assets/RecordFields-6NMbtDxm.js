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
		* will say it. How the document gives its tyres' index stays unfolded: the release asks for it (D-277).
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
			"valid_from_production",
			"papers_correction",
			"missing_annexes"
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rsf" }, _attrs))} data-v-beaf0097>`);
			if (__props.kind === "NACHTRAG") {
				_push(`<div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("base"))} data-v-beaf0097>Nachtrag zu</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id("base"))} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("base")}-help ${id("base")}-err`)} data-v-beaf0097><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} data-v-beaf0097${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.supplement_to_id) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.supplement_to_id, null) : (0, server_renderer_exports.ssrLooseEqual)(shape.value.supplement_to_id, null)) ? " selected" : ""}>Einem Gutachten, das uns nicht vorliegt</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.supplementable, (doc) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", doc.value)} data-v-beaf0097${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.supplement_to_id) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.supplement_to_id, doc.value) : (0, server_renderer_exports.ssrLooseEqual)(shape.value.supplement_to_id, doc.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(doc.label)}</option>`);
				});
				_push(`<!--]--></select>`);
				if (shape.value.supplement_to_id === null) _push(`<div class="form-field rsf-base-number" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("base-number"))} data-v-beaf0097>Nummer des Grundgutachtens</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("base-number"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.supplement_to_number)} class="input rsf-short" type="text" maxlength="64" spellcheck="false" placeholder="z. B. ABE 53841"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("supplement_to_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("base")}-help ${id("base")}-err`)} data-v-beaf0097></div>`);
				else _push(`<!---->`);
				_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("base")}-help`)} class="form-field__help" data-v-beaf0097> Liegt das Grundgutachten nicht vor, sagen der Datensatz, die Abdeckung und der Shop: Dieser Nachtrag allein ist nicht die ganze Freigabe. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("base")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("supplement_to_id") || err("supplement_to_number"))}</p></div>`);
			} else _push(`<!---->`);
			_push(`<fieldset class="rsf-group" data-v-beaf0097><legend class="form-field__label" data-v-beaf0097>Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen an?</legend><label class="check" data-v-beaf0097><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("index-document"))}${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(shape.value.tyre_index_source, "document")) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", id("index"))} value="document"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("index")}-help ${id("index")}-err`)} data-v-beaf0097><span data-v-beaf0097>Bei jeder Reifengröße, etwa 245/35 R19 93Y</span></label><label class="check" data-v-beaf0097><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(shape.value.tyre_index_source, "papers")) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", id("index"))} value="papers"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("index")}-help ${id("index")}-err`)} data-v-beaf0097><span data-v-beaf0097>Mit einem Verweis auf die Fahrzeugpapiere, etwa „Der erforderliche Geschwindigkeits-/Lastindex ist den Fahrzeugpapieren zu entnehmen.“</span></label><label class="check" data-v-beaf0097><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(shape.value.tyre_index_source, "table")) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", id("index"))} value="table"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("index")}-help ${id("index")}-err`)} data-v-beaf0097><span data-v-beaf0097>In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit, etwa 210 bis 300 km/h für V, W und Y</span></label><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("index")}-help`)} class="form-field__help" data-v-beaf0097> Steht im Verwendungsbereich oder in den Auflagen. Ohne Antwort ist keine Freigabe möglich. Druckt das Gutachten eine solche Tabelle, wähl die Tabelle – auch wenn es zusätzlich auf die Fahrzeugpapiere verweist. Steht das Geschwindigkeitssymbol nur bei manchen Größen, wähl den Verweis auf die Fahrzeugpapiere. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("index")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("tyre_index_source"))}</p></fieldset><details class="rsf-more" data-v-beaf0097><summary class="rsf-more__summary" data-v-beaf0097>Weitere Angaben von Seite 1</summary><div class="rsf-pair" data-v-beaf0097><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("annex"))} data-v-beaf0097>Anlage</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("annex"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.annex)} class="input" type="text" maxlength="64"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("annex") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("annex")}-err`)} data-v-beaf0097><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("annex")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("annex"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("report"))} data-v-beaf0097>Prüfbericht-Nr.</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("report"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.test_report_number)} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("test_report_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("report")}-err`)} data-v-beaf0097><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("report")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("test_report_number"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("copy"))} data-v-beaf0097>Ausfertigung</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("copy"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.copy_number)} class="input" type="text" maxlength="32"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("copy_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("copy")}-err`)} data-v-beaf0097><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("copy")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("copy_number"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("designation"))} data-v-beaf0097>Benennungsnummer</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("designation"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.designation_number)} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("designation_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("designation")}-err`)} data-v-beaf0097><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("designation")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("designation_number"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("site"))} data-v-beaf0097>Prüfort</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("site"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.test_site)} class="input" type="text" maxlength="120"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("test_site") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("site")}-err`)} data-v-beaf0097><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("site")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("test_site"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("test-date"))} data-v-beaf0097>Prüfdatum</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("test-date"),
				modelValue: shape.value.test_date,
				"onUpdate:modelValue": ($event) => shape.value.test_date = $event,
				invalid: Boolean(err("test_date")),
				describedby: `${id("test-date")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("test-date")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("test_date"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("revision"))} data-v-beaf0097>Stand</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("revision"),
				modelValue: shape.value.revision_date,
				"onUpdate:modelValue": ($event) => shape.value.revision_date = $event,
				invalid: Boolean(err("revision_date")),
				describedby: `${id("revision")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("revision")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("revision_date"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("production"))} data-v-beaf0097>Gültig ab Fertigungsdatum</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("production"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.valid_from_production)} class="input rsf-short" type="text" maxlength="7" inputmode="decimal" placeholder="03.2021"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("valid_from_production") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("production")}-help ${id("production")}-err`)} data-v-beaf0097><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("production")}-help`)} class="form-field__help" data-v-beaf0097>Monat und Jahr. Eine Felge, die davor gefertigt wurde, deckt das Dokument nicht – der Shop sagt das dazu.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("production")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("valid_from_production"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("papers"))} data-v-beaf0097>Berichtigung der Fahrzeugpapiere</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id("papers"))} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("papers_correction") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("papers")}-help ${id("papers")}-err`)} data-v-beaf0097><option value="" data-v-beaf0097${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.papers_correction) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.papers_correction, "") : (0, server_renderer_exports.ssrLooseEqual)(shape.value.papers_correction, "")) ? " selected" : ""}>Steht nicht im Dokument</option><option value="not_required" data-v-beaf0097${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.papers_correction) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.papers_correction, "not_required") : (0, server_renderer_exports.ssrLooseEqual)(shape.value.papers_correction, "not_required")) ? " selected" : ""}>Nicht erforderlich (§ 15 FZV)</option><option value="required" data-v-beaf0097${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.papers_correction) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.papers_correction, "required") : (0, server_renderer_exports.ssrLooseEqual)(shape.value.papers_correction, "required")) ? " selected" : ""}>Erforderlich</option></select><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("papers")}-help`)} class="form-field__help" data-v-beaf0097> Was das Dokument selbst sagt, etwa Punkt 10 der ABE 53841. „Nicht erforderlich“ sieht der Kunde als eigene Zeile. Ein Nachtrag ohne eigene Angabe übernimmt es, sobald sein Grundgutachten freigegeben ist. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("papers")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("papers_correction"))}</p></div><div class="form-field" data-v-beaf0097><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("annexes"))} data-v-beaf0097>Fehlende Anlagen</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("annexes"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.missing_annexes)} class="input rsf-short" type="text" maxlength="64" placeholder="z. B. 1–15"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("missing_annexes") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("annexes")}-help ${id("annexes")}-err`)} data-v-beaf0097><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("annexes")}-help`)} class="form-field__help" data-v-beaf0097> Anlagen des Verwendungsbereichs, die uns nicht vorliegen. Solange hier etwas steht, bekommt ein Fahrzeug, das die vorliegenden Seiten nicht nennen, im Shop den Hinweis, dass die Anlage noch nicht vorliegt – kein „Nicht freigegeben“. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("annexes")}-err`)} class="form-field__error" data-v-beaf0097>${(0, server_renderer_exports.ssrInterpolate)(err("missing_annexes"))}</p></div></div></details></div>`);
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
var RecordFields_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RecordFields_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-beaf0097"]]);
//#endregion
export { RecordFields_exports as n, RecordFields_default as t };
