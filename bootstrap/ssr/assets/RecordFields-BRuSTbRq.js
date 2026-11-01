import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as DateField_default } from "./DateField-COag7VXL.js";
//#region resources/js/Components/Admin/DocumentSelect.vue?vue&type=script&setup=true&lang.ts
var SHORTEN_FROM = 20;
var DocumentSelect_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DocumentSelect",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		id: {},
		options: {},
		noneLabel: {},
		describedby: { default: void 0 },
		invalid: {
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
		* One document chosen from all of them (the admin audit's F-36): „Nachtrag zu“ and „Ersetzt eine frühere Fassung“
		* offered only the newest 300 and 200 — an older Gutachten could not be chosen, and „Einem Gutachten, das uns nicht
		* vorliegt“ was the only way on. Every document is offered, newest first; a long list gets a field above it that
		* shortens it to the documents whose name holds what is typed. The one chosen always stays in the list.
		*/
		const props = __props;
		const model = (0, vue_exports.useModel)(__props, "modelValue");
		/** From this many documents on, the list can be shortened by typing. */
		const query = (0, vue_exports.ref)("");
		/** `ABE 53841`, `abe53841` and `ABE-53841` are one search. */
		function plain(text) {
			return text.toLocaleLowerCase("de-DE").replace(/[\s\-–./]/g, "");
		}
		const typed = (0, vue_exports.computed)(() => plain(query.value));
		const shown = (0, vue_exports.computed)(() => typed.value === "" ? props.options : props.options.filter((doc) => doc.value === model.value || plain(doc.label).includes(typed.value)));
		const found = (0, vue_exports.computed)(() => shown.value.filter((doc) => typed.value === "" || plain(doc.label).includes(typed.value)).length);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "dsel" }, _attrs))} data-v-0282c268>`);
			if (__props.options.length > SHORTEN_FROM) {
				_push(`<!--[--><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-shorten`)}${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input dsel__shorten" type="search" maxlength="64" autocomplete="off" spellcheck="false" placeholder="Nummer eingeben, etwa 53841" aria-label="Dokumente filtern: Nummer oder Name"${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", __props.id)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${__props.id}-shorten-count`)} data-v-0282c268><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-shorten-count`)} class="form-field__help dsel__count" aria-live="polite" data-v-0282c268>`);
				if (typed.value === "") _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.options.length, 0))} Dokumente in der Liste<!--]-->`);
				else if (found.value === 0) _push(`<!--[-->Kein Dokument passt zu „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“.<!--]-->`);
				else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(found.value, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.options.length, 0))} Dokumenten gefunden<!--]-->`);
				_push(`</p><!--]-->`);
			} else _push(`<!---->`);
			_push(`<select${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.invalid ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", __props.describedby)} data-v-0282c268><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} data-v-0282c268${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(model.value) ? (0, server_renderer_exports.ssrLooseContain)(model.value, null) : (0, server_renderer_exports.ssrLooseEqual)(model.value, null)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(__props.noneLabel)}</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(shown.value, (doc) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", doc.value)} data-v-0282c268${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(model.value) ? (0, server_renderer_exports.ssrLooseContain)(model.value, doc.value) : (0, server_renderer_exports.ssrLooseEqual)(model.value, doc.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(doc.label)}</option>`);
			});
			_push(`<!--]--></select></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/DocumentSelect.vue
var _sfc_setup$1 = DocumentSelect_vue_vue_type_script_setup_true_lang_default.setup;
DocumentSelect_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/DocumentSelect.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var DocumentSelect_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DocumentSelect_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0282c268"]]);
//#endregion
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rsf" }, _attrs))} data-v-e3b5f6a7>`);
			if (__props.kind === "NACHTRAG") {
				_push(`<div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("base"))} data-v-e3b5f6a7>Nachtrag zu</label>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DocumentSelect_default, {
					id: id("base"),
					modelValue: shape.value.supplement_to_id,
					"onUpdate:modelValue": ($event) => shape.value.supplement_to_id = $event,
					options: __props.supplementable,
					"none-label": "Einem Gutachten, das uns nicht vorliegt",
					invalid: Boolean(err("supplement_to_id")),
					describedby: `${id("base")}-help ${id("base")}-err`
				}, null, _parent));
				if (shape.value.supplement_to_id === null) _push(`<div class="form-field rsf-base-number" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("base-number"))} data-v-e3b5f6a7>Nummer des Grundgutachtens</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("base-number"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.supplement_to_number)} class="input rsf-short" type="text" maxlength="64" spellcheck="false" placeholder="z. B. ABE 53841"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("supplement_to_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("base")}-help ${id("base")}-err`)} data-v-e3b5f6a7></div>`);
				else _push(`<!---->`);
				_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("base")}-help`)} class="form-field__help" data-v-e3b5f6a7> Liegt das Grundgutachten nicht vor, sagen der Datensatz, die Abdeckung und der Shop: Dieser Nachtrag allein ist nicht die ganze Freigabe. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("base")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("supplement_to_id") || err("supplement_to_number"))}</p></div>`);
			} else _push(`<!---->`);
			_push(`<fieldset class="rsf-group" data-v-e3b5f6a7><legend class="form-field__label" data-v-e3b5f6a7>Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen an?</legend><label class="check" data-v-e3b5f6a7><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("index-document"))}${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(shape.value.tyre_index_source, "document")) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", id("index"))} value="document"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("index")}-help ${id("index")}-err`)} data-v-e3b5f6a7><span data-v-e3b5f6a7>Bei jeder Reifengröße, etwa 245/35 R19 93Y</span></label><label class="check" data-v-e3b5f6a7><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(shape.value.tyre_index_source, "papers")) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", id("index"))} value="papers"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("index")}-help ${id("index")}-err`)} data-v-e3b5f6a7><span data-v-e3b5f6a7>Mit einem Verweis auf die Fahrzeugpapiere, etwa „Der erforderliche Geschwindigkeits-/Lastindex ist den Fahrzeugpapieren zu entnehmen.“</span></label><label class="check" data-v-e3b5f6a7><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(shape.value.tyre_index_source, "table")) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", id("index"))} value="table"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("index")}-help ${id("index")}-err`)} data-v-e3b5f6a7><span data-v-e3b5f6a7>In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit, etwa 210 bis 300 km/h für V, W und Y</span></label><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("index")}-help`)} class="form-field__help" data-v-e3b5f6a7> Steht im Verwendungsbereich oder in den Auflagen. Ohne Antwort ist keine Freigabe möglich. Druckt das Gutachten eine solche Tabelle, wähl die Tabelle – auch wenn es zusätzlich auf die Fahrzeugpapiere verweist. Steht das Geschwindigkeitssymbol nur bei manchen Größen, wähl den Verweis auf die Fahrzeugpapiere. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("index")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("tyre_index_source"))}</p></fieldset><details class="rsf-more" data-v-e3b5f6a7><summary class="rsf-more__summary" data-v-e3b5f6a7>Weitere Angaben von Seite 1</summary><div class="rsf-pair" data-v-e3b5f6a7><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("annex"))} data-v-e3b5f6a7>Anlage</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("annex"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.annex)} class="input" type="text" maxlength="64"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("annex") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("annex")}-err`)} data-v-e3b5f6a7><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("annex")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("annex"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("report"))} data-v-e3b5f6a7>Prüfbericht-Nr.</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("report"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.test_report_number)} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("test_report_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("report")}-err`)} data-v-e3b5f6a7><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("report")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("test_report_number"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("copy"))} data-v-e3b5f6a7>Ausfertigung</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("copy"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.copy_number)} class="input" type="text" maxlength="32"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("copy_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("copy")}-err`)} data-v-e3b5f6a7><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("copy")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("copy_number"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("designation"))} data-v-e3b5f6a7>Benennungsnummer</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("designation"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.designation_number)} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("designation_number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("designation")}-err`)} data-v-e3b5f6a7><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("designation")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("designation_number"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("site"))} data-v-e3b5f6a7>Prüfort</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("site"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.test_site)} class="input" type="text" maxlength="120"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("test_site") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("site")}-err`)} data-v-e3b5f6a7><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("site")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("test_site"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("test-date"))} data-v-e3b5f6a7>Prüfdatum</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("test-date"),
				modelValue: shape.value.test_date,
				"onUpdate:modelValue": ($event) => shape.value.test_date = $event,
				invalid: Boolean(err("test_date")),
				describedby: `${id("test-date")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("test-date")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("test_date"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("revision"))} data-v-e3b5f6a7>Stand</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("revision"),
				modelValue: shape.value.revision_date,
				"onUpdate:modelValue": ($event) => shape.value.revision_date = $event,
				invalid: Boolean(err("revision_date")),
				describedby: `${id("revision")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("revision")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("revision_date"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("production"))} data-v-e3b5f6a7>Gültig ab Fertigungsdatum</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("production"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.valid_from_production)} class="input rsf-short" type="text" maxlength="7" inputmode="decimal" placeholder="03.2021"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("valid_from_production") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("production")}-help ${id("production")}-err`)} data-v-e3b5f6a7><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("production")}-help`)} class="form-field__help" data-v-e3b5f6a7>Monat und Jahr. Eine Felge, die davor gefertigt wurde, deckt das Dokument nicht – der Shop sagt das dazu.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("production")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("valid_from_production"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("papers"))} data-v-e3b5f6a7>Berichtigung der Fahrzeugpapiere</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id("papers"))} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("papers_correction") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("papers")}-help ${id("papers")}-err`)} data-v-e3b5f6a7><option value="" data-v-e3b5f6a7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.papers_correction) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.papers_correction, "") : (0, server_renderer_exports.ssrLooseEqual)(shape.value.papers_correction, "")) ? " selected" : ""}>Steht nicht im Dokument</option><option value="not_required" data-v-e3b5f6a7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.papers_correction) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.papers_correction, "not_required") : (0, server_renderer_exports.ssrLooseEqual)(shape.value.papers_correction, "not_required")) ? " selected" : ""}>Nicht erforderlich (§ 15 FZV)</option><option value="required" data-v-e3b5f6a7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(shape.value.papers_correction) ? (0, server_renderer_exports.ssrLooseContain)(shape.value.papers_correction, "required") : (0, server_renderer_exports.ssrLooseEqual)(shape.value.papers_correction, "required")) ? " selected" : ""}>Erforderlich</option></select><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("papers")}-help`)} class="form-field__help" data-v-e3b5f6a7> Was das Dokument selbst sagt, etwa Punkt 10 der ABE 53841. „Nicht erforderlich“ sieht der Kunde als eigene Zeile. Ein Nachtrag ohne eigene Angabe übernimmt es, sobald sein Grundgutachten freigegeben ist. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("papers")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("papers_correction"))}</p></div><div class="form-field" data-v-e3b5f6a7><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("annexes"))} data-v-e3b5f6a7>Fehlende Anlagen</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("annexes"))}${(0, server_renderer_exports.ssrRenderAttr)("value", shape.value.missing_annexes)} class="input rsf-short" type="text" maxlength="64" placeholder="z. B. 1–15"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("missing_annexes") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("annexes")}-help ${id("annexes")}-err`)} data-v-e3b5f6a7><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("annexes")}-help`)} class="form-field__help" data-v-e3b5f6a7> Anlagen des Verwendungsbereichs, die uns nicht vorliegen. Solange hier etwas steht, bekommt ein Fahrzeug, das die vorliegenden Seiten nicht nennen, im Shop den Hinweis, dass die Anlage noch nicht vorliegt – kein „Nicht freigegeben“. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("annexes")}-err`)} class="form-field__error" data-v-e3b5f6a7>${(0, server_renderer_exports.ssrInterpolate)(err("missing_annexes"))}</p></div></div></details></div>`);
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
var RecordFields_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RecordFields_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e3b5f6a7"]]);
//#endregion
export { RecordFields_exports as n, DocumentSelect_default as r, RecordFields_default as t };
