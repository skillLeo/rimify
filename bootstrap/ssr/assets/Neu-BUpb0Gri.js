import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-yqAbwMfa.js";
import { o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { n as focusRefused } from "./focusRefused-BCX3fX_F.js";
import { t as FilePick_default } from "./FilePick-DONFNSZK.js";
import "./file-65D2TnCP.js";
import { t as DateField_default } from "./DateField-COag7VXL.js";
import { r as DocumentSelect_default, t as RecordFields_default } from "./RecordFields-BRuSTbRq.js";
import { t as usePresignedUpload } from "./usePresignedUpload-D54r6eaj.js";
//#region resources/js/Pages/Admin/Gutachten/Neu.vue?vue&type=script&setup=true&lang.ts
var Neu_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Neu",
	__ssrInlineRender: true,
	props: {
		kinds: {},
		replaceable: {},
		supplementable: {},
		maxMb: {}
	},
	setup(__props) {
		/**
		* Gutachten › Neues Gutachten — the first step of the chain: the PDF and the facts printed on its
		* first page (the review release §4.3). The PDF goes from the browser straight into the bucket
		* (usePresignedUpload); the server confirms it — a PDF, not too large, scanned — before the document's
		* row exists. The document starts as a draft; the Verwendungsbereich follows on its own page.
		*
		* Each kind is named by its own number, so the form asks for the one the chosen kind carries.
		*/
		const props = __props;
		const shape = (0, vue_exports.ref)({
			supplement_to_id: null,
			supplement_to_number: "",
			annex: "",
			test_report_number: "",
			copy_number: "",
			designation_number: "",
			test_site: "",
			test_date: "",
			revision_date: "",
			valid_from_production: "",
			papers_correction: "",
			missing_annexes: "",
			tyre_index_source: ""
		});
		const pdf = (0, vue_exports.ref)(null);
		const upload = usePresignedUpload();
		const form = useForm({
			upload_key: "",
			kind: props.kinds[0]?.value ?? "ABE",
			kba_number: "",
			report_number: "",
			approval_mark: "",
			issuer: "",
			issued_on: "",
			page_count: "",
			supersedes_id: null
		});
		/** The number field the chosen kind is known by. */
		const numberField = (0, vue_exports.computed)(() => {
			switch (form.kind) {
				case "ABE": return {
					key: "kba_number",
					label: "KBA-Nummer",
					help: "Die Nummer der Allgemeinen Betriebserlaubnis, zum Beispiel 53810."
				};
				case "NACHTRAG": return {
					key: "report_number",
					label: "Nummer des Nachtrags",
					help: "So, wie sie auf der ersten Seite steht, zum Beispiel 366-0350-21-WIRD/N1."
				};
				case "TEILEGUTACHTEN": return {
					key: "report_number",
					label: "Gutachten-Nummer",
					help: "So, wie sie auf der ersten Seite steht."
				};
				default: return {
					key: "approval_mark",
					label: "Genehmigungszeichen",
					help: "Zum Beispiel E1 124R-001234."
				};
			}
		});
		const busy = (0, vue_exports.computed)(() => form.processing || upload.state.value === "uploading" || upload.state.value === "retrying");
		const progressText = (0, vue_exports.computed)(() => {
			if (upload.state.value === "uploading") return `Wird hochgeladen … ${decimal(Math.round(upload.progress.value * 100), 0)} %`;
			if (upload.state.value === "retrying") return `Die Verbindung hakt – neuer Versuch (${upload.attempt.value} von 3) …`;
			return "";
		});
		const errors = (0, vue_exports.computed)(() => form.errors);
		async function submit() {
			if (busy.value) return;
			form.clearErrors();
			if (pdf.value === null) {
				form.setError("upload_key", "Bitte wähl das PDF des Gutachtens aus.");
				focusRefused(".gn-form");
				return;
			}
			if (form.upload_key === "") {
				const key = await upload.upload(pdf.value);
				if (key === null) {
					form.setError("upload_key", upload.error.value ?? "Die Datei konnte nicht hochgeladen werden.");
					if (upload.error.value === "Die Datei hat sich geändert, seit du sie ausgewählt hast. Wähl sie bitte noch einmal aus.") pdf.value = null;
					focusRefused(".gn-form");
					return;
				}
				form.upload_key = key;
			}
			form.transform((data) => ({
				...data,
				...shape.value
			})).post("/admin/gutachten", {
				preserveScroll: true,
				onError: (bag) => {
					if (bag.upload_key) form.upload_key = "";
					focusRefused(".gn-form");
				}
			});
		}
		function chose(file) {
			pdf.value = file;
			form.upload_key = "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Neues Gutachten",
				context: "Entwurf, noch nicht freigegeben"
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form class="adm-form gn-form" novalidate data-v-3e4ceb69${_scopeId}><section class="adm-form__group" aria-labelledby="gn-h-pdf" data-v-3e4ceb69${_scopeId}><h2 id="gn-h-pdf" class="adm-form__heading" data-v-3e4ceb69${_scopeId}>Das Dokument</h2><div class="form-field" data-v-3e4ceb69${_scopeId}><span id="gn-pdf-label" class="form-field__label" data-v-3e4ceb69${_scopeId}>PDF des Gutachtens (höchstens ${(0, server_renderer_exports.ssrInterpolate)(__props.maxMb)} MB)</span>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
							id: "gn-pdf",
							"model-value": pdf.value,
							accept: "application/pdf,.pdf",
							label: "PDF auswählen",
							invalid: !!errors.value.upload_key,
							describedby: "gn-pdf-label gn-pdf-err",
							disabled: busy.value,
							"onUpdate:modelValue": chose
						}, null, _parent, _scopeId));
						if (progressText.value) _push(`<p class="form-field__help" role="status" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(progressText.value)}</p>`);
						else _push(`<!---->`);
						_push(`<p id="gn-pdf-err" class="form-field__error" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.upload_key)}</p></div><div class="form-field" data-v-3e4ceb69${_scopeId}><label class="form-field__label" for="gn-kind" data-v-3e4ceb69${_scopeId}>Art</label><select id="gn-kind" class="input gn-short"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-3e4ceb69${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.kinds, (kind) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", kind.value)} data-v-3e4ceb69${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).kind) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).kind, kind.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).kind, kind.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(kind.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-3e4ceb69${_scopeId}><label class="form-field__label" for="gn-number" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(numberField.value.label)}</label><input id="gn-number"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form)[numberField.value.key])} class="input gn-short" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[numberField.value.key] ? "true" : void 0)} aria-describedby="gn-number-help gn-number-err" data-v-3e4ceb69${_scopeId}><p id="gn-number-help" class="form-field__help" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(numberField.value.help)}</p><p id="gn-number-err" class="form-field__error" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value[numberField.value.key])}</p></div><div class="form-field" data-v-3e4ceb69${_scopeId}><label class="form-field__label" for="gn-issuer" data-v-3e4ceb69${_scopeId}>Aussteller <span class="gn-optional" data-v-3e4ceb69${_scopeId}>(optional)</span></label><input id="gn-issuer"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).issuer)} class="input" type="text" maxlength="120" placeholder="z. B. Kraftfahrt-Bundesamt" aria-describedby="gn-issuer-err" data-v-3e4ceb69${_scopeId}><p id="gn-issuer-err" class="form-field__error" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.issuer)}</p></div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(RecordFields_default, {
							shape: shape.value,
							"onUpdate:shape": ($event) => shape.value = $event,
							kind: (0, vue_exports.unref)(form).kind,
							errors: errors.value,
							supplementable: __props.supplementable,
							"id-prefix": "gn"
						}, null, _parent, _scopeId));
						_push(`<div class="gn-pair" data-v-3e4ceb69${_scopeId}><div class="form-field" data-v-3e4ceb69${_scopeId}><label class="form-field__label" for="gn-date" data-v-3e4ceb69${_scopeId}>Ausgestellt am <span class="gn-optional" data-v-3e4ceb69${_scopeId}>(optional)</span></label>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
							id: "gn-date",
							modelValue: (0, vue_exports.unref)(form).issued_on,
							"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).issued_on = $event,
							invalid: Boolean(errors.value.issued_on),
							describedby: "gn-date-err"
						}, null, _parent, _scopeId));
						_push(`<p id="gn-date-err" class="form-field__error" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.issued_on)}</p></div><div class="form-field" data-v-3e4ceb69${_scopeId}><label class="form-field__label" for="gn-pages" data-v-3e4ceb69${_scopeId}>Seiten <span class="gn-optional" data-v-3e4ceb69${_scopeId}>(optional)</span></label><input id="gn-pages"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).page_count)} class="input" type="number" min="1" max="2000" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.page_count ? "true" : void 0)} aria-describedby="gn-pages-help gn-pages-err" data-v-3e4ceb69${_scopeId}><p id="gn-pages-help" class="form-field__help" data-v-3e4ceb69${_scopeId}>Damit jede Zeile auf eine echte Seite zeigt.</p><p id="gn-pages-err" class="form-field__error" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.page_count)}</p></div></div>`);
						if (__props.replaceable.length) {
							_push(`<div class="form-field" data-v-3e4ceb69${_scopeId}><label class="form-field__label" for="gn-supersedes" data-v-3e4ceb69${_scopeId}>Ersetzt eine frühere Fassung <span class="gn-optional" data-v-3e4ceb69${_scopeId}>(optional)</span></label>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(DocumentSelect_default, {
								id: "gn-supersedes",
								modelValue: (0, vue_exports.unref)(form).supersedes_id,
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).supersedes_id = $event,
								options: __props.replaceable,
								"none-label": "Nein, ein neues Dokument",
								invalid: Boolean(errors.value.supersedes_id),
								describedby: "gn-supersedes-help gn-supersedes-err"
							}, null, _parent, _scopeId));
							_push(`<p id="gn-supersedes-help" class="form-field__help" data-v-3e4ceb69${_scopeId}>Die frühere Fassung gilt bis zur Freigabe dieser weiter; Bestellungen darauf bleiben erklärbar.</p><p id="gn-supersedes-err" class="form-field__error" data-v-3e4ceb69${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.supersedes_id)}</p></div>`);
						} else _push(`<!---->`);
						_push(`</section><div class="gn-actions" data-v-3e4ceb69${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-3e4ceb69${_scopeId}>Gutachten anlegen</button></div></form>`);
					} else return [(0, vue_exports.createVNode)("form", {
						class: "adm-form gn-form",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
					}, [(0, vue_exports.createVNode)("section", {
						class: "adm-form__group",
						"aria-labelledby": "gn-h-pdf"
					}, [
						(0, vue_exports.createVNode)("h2", {
							id: "gn-h-pdf",
							class: "adm-form__heading"
						}, "Das Dokument"),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("span", {
								id: "gn-pdf-label",
								class: "form-field__label"
							}, "PDF des Gutachtens (höchstens " + (0, vue_exports.toDisplayString)(__props.maxMb) + " MB)", 1),
							(0, vue_exports.createVNode)(FilePick_default, {
								id: "gn-pdf",
								"model-value": pdf.value,
								accept: "application/pdf,.pdf",
								label: "PDF auswählen",
								invalid: !!errors.value.upload_key,
								describedby: "gn-pdf-label gn-pdf-err",
								disabled: busy.value,
								"onUpdate:modelValue": chose
							}, null, 8, [
								"model-value",
								"invalid",
								"disabled"
							]),
							progressText.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "form-field__help",
								role: "status"
							}, (0, vue_exports.toDisplayString)(progressText.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("p", {
								id: "gn-pdf-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.upload_key), 1)
						]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "gn-kind"
						}, "Art"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "gn-kind",
							"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).kind = $event,
							class: "input gn-short",
							disabled: busy.value
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.kinds, (kind) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: kind.value,
								value: kind.value
							}, (0, vue_exports.toDisplayString)(kind.label), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).kind]])]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "gn-number"
							}, (0, vue_exports.toDisplayString)(numberField.value.label), 1),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "gn-number",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form)[numberField.value.key] = $event,
								class: "input gn-short",
								type: "text",
								maxlength: "64",
								spellcheck: "false",
								"aria-invalid": errors.value[numberField.value.key] ? "true" : void 0,
								"aria-describedby": "gn-number-help gn-number-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form)[numberField.value.key]]]),
							(0, vue_exports.createVNode)("p", {
								id: "gn-number-help",
								class: "form-field__help"
							}, (0, vue_exports.toDisplayString)(numberField.value.help), 1),
							(0, vue_exports.createVNode)("p", {
								id: "gn-number-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value[numberField.value.key]), 1)
						]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "gn-issuer"
							}, [(0, vue_exports.createTextVNode)("Aussteller "), (0, vue_exports.createVNode)("span", { class: "gn-optional" }, "(optional)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "gn-issuer",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).issuer = $event,
								class: "input",
								type: "text",
								maxlength: "120",
								placeholder: "z. B. Kraftfahrt-Bundesamt",
								"aria-describedby": "gn-issuer-err"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).issuer]]),
							(0, vue_exports.createVNode)("p", {
								id: "gn-issuer-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.issuer), 1)
						]),
						(0, vue_exports.createVNode)(RecordFields_default, {
							shape: shape.value,
							"onUpdate:shape": ($event) => shape.value = $event,
							kind: (0, vue_exports.unref)(form).kind,
							errors: errors.value,
							supplementable: __props.supplementable,
							"id-prefix": "gn"
						}, null, 8, [
							"shape",
							"onUpdate:shape",
							"kind",
							"errors",
							"supplementable"
						]),
						(0, vue_exports.createVNode)("div", { class: "gn-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "gn-date"
							}, [(0, vue_exports.createTextVNode)("Ausgestellt am "), (0, vue_exports.createVNode)("span", { class: "gn-optional" }, "(optional)")]),
							(0, vue_exports.createVNode)(DateField_default, {
								id: "gn-date",
								modelValue: (0, vue_exports.unref)(form).issued_on,
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).issued_on = $event,
								invalid: Boolean(errors.value.issued_on),
								describedby: "gn-date-err"
							}, null, 8, [
								"modelValue",
								"onUpdate:modelValue",
								"invalid"
							]),
							(0, vue_exports.createVNode)("p", {
								id: "gn-date-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.issued_on), 1)
						]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "gn-pages"
							}, [(0, vue_exports.createTextVNode)("Seiten "), (0, vue_exports.createVNode)("span", { class: "gn-optional" }, "(optional)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "gn-pages",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).page_count = $event,
								class: "input",
								type: "number",
								min: "1",
								max: "2000",
								inputmode: "numeric",
								"aria-invalid": errors.value.page_count ? "true" : void 0,
								"aria-describedby": "gn-pages-help gn-pages-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).page_count]]),
							(0, vue_exports.createVNode)("p", {
								id: "gn-pages-help",
								class: "form-field__help"
							}, "Damit jede Zeile auf eine echte Seite zeigt."),
							(0, vue_exports.createVNode)("p", {
								id: "gn-pages-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.page_count), 1)
						])]),
						__props.replaceable.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "form-field"
						}, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "gn-supersedes"
							}, [(0, vue_exports.createTextVNode)("Ersetzt eine frühere Fassung "), (0, vue_exports.createVNode)("span", { class: "gn-optional" }, "(optional)")]),
							(0, vue_exports.createVNode)(DocumentSelect_default, {
								id: "gn-supersedes",
								modelValue: (0, vue_exports.unref)(form).supersedes_id,
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).supersedes_id = $event,
								options: __props.replaceable,
								"none-label": "Nein, ein neues Dokument",
								invalid: Boolean(errors.value.supersedes_id),
								describedby: "gn-supersedes-help gn-supersedes-err"
							}, null, 8, [
								"modelValue",
								"onUpdate:modelValue",
								"options",
								"invalid"
							]),
							(0, vue_exports.createVNode)("p", {
								id: "gn-supersedes-help",
								class: "form-field__help"
							}, "Die frühere Fassung gilt bis zur Freigabe dieser weiter; Bestellungen darauf bleiben erklärbar."),
							(0, vue_exports.createVNode)("p", {
								id: "gn-supersedes-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.supersedes_id), 1)
						])) : (0, vue_exports.createCommentVNode)("", true)
					]), (0, vue_exports.createVNode)("div", { class: "gn-actions" }, [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "submit",
						disabled: busy.value,
						"aria-busy": busy.value ? "true" : void 0
					}, "Gutachten anlegen", 8, ["disabled", "aria-busy"])])], 32)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Neu.vue
var _sfc_setup = Neu_vue_vue_type_script_setup_true_lang_default.setup;
Neu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Neu.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Neu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Neu_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3e4ceb69"]]);
//#endregion
export { Neu_default as default };
