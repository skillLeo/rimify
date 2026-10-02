import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-C-07FMpe.js";
import { o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-DGFu8Y3r.js";
import { n as focusRefused } from "./focusRefused-BCX3fX_F.js";
import { t as FilePick_default } from "./FilePick-BXVVnRF8.js";
import "./file-65D2TnCP.js";
import { t as DateField_default } from "./DateField-COag7VXL.js";
import { t as usePresignedUpload } from "./usePresignedUpload-D54r6eaj.js";
import { t as RecordFields_default } from "./RecordFields-DsoRvheX.js";
//#region resources/js/Pages/Admin/Gutachten/FactsDialog.vue?vue&type=script&setup=true&lang.ts
var FactsDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FactsDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		document: {},
		kinds: {},
		replaceable: {},
		supplementable: {}
	}, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: ["update:open"],
	setup(__props) {
		/**
		* The facts of a draft Gutachten, changed: kind, number, issuer, date, pages, the revision it
		* replaces — and, if the wrong file was uploaded, the PDF itself (usePresignedUpload, confirmed by the
		* server). A released Gutachten does not change (ApprovalDocumentPolicy); this opens only for drafts.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const shape = (0, vue_exports.ref)({ ...props.document.shape });
		function fromDocument() {
			return {
				upload_key: "",
				kind: props.document.kind,
				kba_number: props.document.kbaNumber,
				report_number: props.document.reportNumber,
				approval_mark: props.document.approvalMark,
				issuer: props.document.issuer,
				issued_on: props.document.issuedOn,
				page_count: props.document.pageCount ?? "",
				supersedes_id: props.document.supersedesId
			};
		}
		const form = useForm(fromDocument());
		const pdf = (0, vue_exports.ref)(null);
		const upload = usePresignedUpload();
		(0, vue_exports.watch)(open, (value) => {
			if (value) {
				form.defaults(fromDocument());
				form.reset();
				form.clearErrors();
				shape.value = { ...props.document.shape };
				pdf.value = null;
			}
		});
		const numberField = (0, vue_exports.computed)(() => {
			switch (form.kind) {
				case "ABE": return {
					key: "kba_number",
					label: "KBA-Nummer"
				};
				case "NACHTRAG": return {
					key: "report_number",
					label: "Nummer des Nachtrags"
				};
				case "TEILEGUTACHTEN": return {
					key: "report_number",
					label: "Gutachten-Nummer"
				};
				default: return {
					key: "approval_mark",
					label: "Genehmigungszeichen"
				};
			}
		});
		const errors = (0, vue_exports.computed)(() => form.errors);
		const busy = (0, vue_exports.computed)(() => form.processing || upload.state.value === "uploading" || upload.state.value === "retrying");
		async function save() {
			if (busy.value) return;
			form.upload_key = "";
			if (pdf.value !== null) {
				const key = await upload.upload(pdf.value);
				if (key === null) {
					form.setError("upload_key", upload.error.value ?? "Die Datei konnte nicht hochgeladen werden.");
					if (upload.error.value === "Die Datei hat sich geändert, seit du sie ausgewählt hast. Wähl sie bitte noch einmal aus.") pdf.value = null;
					focusRefused(".fd");
					return;
				}
				form.upload_key = key;
			}
			form.transform((data) => ({
				...data,
				...shape.value
			})).put(`/admin/gutachten/${props.document.id}`, {
				preserveScroll: true,
				onSuccess: () => open.value = false,
				onError: () => focusRefused(".fd")
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: "Angaben ändern",
				description: __props.document.label,
				"content-class": "adm-dialog",
				"initial-focus": "#fd-kind"
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-c6f194fa${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="fd-form"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-c6f194fa${_scopeId}>Speichern</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "submit",
						form: "fd-form",
						disabled: busy.value,
						"aria-busy": busy.value ? "true" : void 0
					}, "Speichern", 8, ["disabled", "aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form id="fd-form" class="fd" novalidate data-v-c6f194fa${_scopeId}><div class="form-field" data-v-c6f194fa${_scopeId}><label class="form-field__label" for="fd-kind" data-v-c6f194fa${_scopeId}>Art</label><select id="fd-kind" class="input" data-v-c6f194fa${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.kinds, (kind) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", kind.value)} data-v-c6f194fa${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).kind) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).kind, kind.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).kind, kind.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(kind.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-c6f194fa${_scopeId}><label class="form-field__label" for="fd-number" data-v-c6f194fa${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(numberField.value.label)}</label><input id="fd-number"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form)[numberField.value.key])} class="input" type="text" maxlength="64"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[numberField.value.key] ? "true" : void 0)} aria-describedby="fd-number-err" data-v-c6f194fa${_scopeId}><p id="fd-number-err" class="form-field__error" data-v-c6f194fa${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value[numberField.value.key])}</p></div><div class="form-field" data-v-c6f194fa${_scopeId}><label class="form-field__label" for="fd-issuer" data-v-c6f194fa${_scopeId}>Aussteller</label><input id="fd-issuer"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).issuer)} class="input" type="text" maxlength="120" data-v-c6f194fa${_scopeId}></div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(RecordFields_default, {
							shape: shape.value,
							"onUpdate:shape": ($event) => shape.value = $event,
							kind: (0, vue_exports.unref)(form).kind,
							errors: errors.value,
							supplementable: __props.supplementable.filter((d) => d.value !== __props.document.id),
							"id-prefix": "fd"
						}, null, _parent, _scopeId));
						_push(`<div class="fd-pair" data-v-c6f194fa${_scopeId}><div class="form-field" data-v-c6f194fa${_scopeId}><label class="form-field__label" for="fd-date" data-v-c6f194fa${_scopeId}>Ausgestellt am</label>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
							id: "fd-date",
							modelValue: (0, vue_exports.unref)(form).issued_on,
							"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).issued_on = $event,
							invalid: Boolean(errors.value.issued_on),
							describedby: "fd-date-err"
						}, null, _parent, _scopeId));
						_push(`<p id="fd-date-err" class="form-field__error" data-v-c6f194fa${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.issued_on)}</p></div><div class="form-field" data-v-c6f194fa${_scopeId}><label class="form-field__label" for="fd-pages" data-v-c6f194fa${_scopeId}>Seiten</label><input id="fd-pages"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).page_count)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.page_count ? "true" : void 0)} aria-describedby="fd-pages-err" data-v-c6f194fa${_scopeId}><p id="fd-pages-err" class="form-field__error" data-v-c6f194fa${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.page_count)}</p></div></div>`);
						if (__props.replaceable.length) {
							_push(`<div class="form-field" data-v-c6f194fa${_scopeId}><label class="form-field__label" for="fd-supersedes" data-v-c6f194fa${_scopeId}>Ersetzt eine frühere Fassung</label><select id="fd-supersedes" class="input" aria-describedby="fd-supersedes-err" data-v-c6f194fa${_scopeId}><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} data-v-c6f194fa${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).supersedes_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).supersedes_id, null) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).supersedes_id, null)) ? " selected" : ""}${_scopeId}>Nein, ein neues Dokument</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.replaceable, (doc) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", doc.value)} data-v-c6f194fa${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).supersedes_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).supersedes_id, doc.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).supersedes_id, doc.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(doc.label)}</option>`);
							});
							_push(`<!--]--></select><p id="fd-supersedes-err" class="form-field__error" data-v-c6f194fa${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.supersedes_id)}</p></div>`);
						} else _push(`<!---->`);
						_push(`<div class="form-field" data-v-c6f194fa${_scopeId}><span id="fd-pdf-label" class="form-field__label" data-v-c6f194fa${_scopeId}>Anderes PDF (optional)</span>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
							id: "fd-pdf",
							modelValue: pdf.value,
							"onUpdate:modelValue": ($event) => pdf.value = $event,
							accept: "application/pdf,.pdf",
							label: "PDF ersetzen",
							invalid: !!errors.value.upload_key,
							describedby: "fd-pdf-label fd-pdf-err",
							disabled: busy.value
						}, null, _parent, _scopeId));
						_push(`<p class="form-field__help" role="status" data-v-c6f194fa${_scopeId}>`);
						if ((0, vue_exports.unref)(upload).state.value === "uploading") _push(`<!--[-->Wird hochgeladen … ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(Math.round((0, vue_exports.unref)(upload).progress.value * 100), 0))} %<!--]-->`);
						else if ((0, vue_exports.unref)(upload).state.value === "retrying") _push(`<!--[-->Die Verbindung hakt – neuer Versuch (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).attempt.value)} von 3) …<!--]-->`);
						else _push(`<!---->`);
						_push(`</p><p id="fd-pdf-err" class="form-field__error" data-v-c6f194fa${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.upload_key)}</p></div></form>`);
					} else return [(0, vue_exports.createVNode)("form", {
						id: "fd-form",
						class: "fd",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
					}, [
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "fd-kind"
						}, "Art"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "fd-kind",
							"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).kind = $event,
							class: "input"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.kinds, (kind) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: kind.value,
								value: kind.value
							}, (0, vue_exports.toDisplayString)(kind.label), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).kind]])]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fd-number"
							}, (0, vue_exports.toDisplayString)(numberField.value.label), 1),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fd-number",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form)[numberField.value.key] = $event,
								class: "input",
								type: "text",
								maxlength: "64",
								"aria-invalid": errors.value[numberField.value.key] ? "true" : void 0,
								"aria-describedby": "fd-number-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form)[numberField.value.key]]]),
							(0, vue_exports.createVNode)("p", {
								id: "fd-number-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value[numberField.value.key]), 1)
						]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "fd-issuer"
						}, "Aussteller"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
							id: "fd-issuer",
							"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).issuer = $event,
							class: "input",
							type: "text",
							maxlength: "120"
						}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).issuer]])]),
						(0, vue_exports.createVNode)(RecordFields_default, {
							shape: shape.value,
							"onUpdate:shape": ($event) => shape.value = $event,
							kind: (0, vue_exports.unref)(form).kind,
							errors: errors.value,
							supplementable: __props.supplementable.filter((d) => d.value !== __props.document.id),
							"id-prefix": "fd"
						}, null, 8, [
							"shape",
							"onUpdate:shape",
							"kind",
							"errors",
							"supplementable"
						]),
						(0, vue_exports.createVNode)("div", { class: "fd-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fd-date"
							}, "Ausgestellt am"),
							(0, vue_exports.createVNode)(DateField_default, {
								id: "fd-date",
								modelValue: (0, vue_exports.unref)(form).issued_on,
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).issued_on = $event,
								invalid: Boolean(errors.value.issued_on),
								describedby: "fd-date-err"
							}, null, 8, [
								"modelValue",
								"onUpdate:modelValue",
								"invalid"
							]),
							(0, vue_exports.createVNode)("p", {
								id: "fd-date-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.issued_on), 1)
						]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fd-pages"
							}, "Seiten"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fd-pages",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).page_count = $event,
								class: "input",
								type: "number",
								min: "1",
								inputmode: "numeric",
								"aria-invalid": errors.value.page_count ? "true" : void 0,
								"aria-describedby": "fd-pages-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).page_count]]),
							(0, vue_exports.createVNode)("p", {
								id: "fd-pages-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.page_count), 1)
						])]),
						__props.replaceable.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "form-field"
						}, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fd-supersedes"
							}, "Ersetzt eine frühere Fassung"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "fd-supersedes",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).supersedes_id = $event,
								class: "input",
								"aria-describedby": "fd-supersedes-err"
							}, [(0, vue_exports.createVNode)("option", { value: null }, "Nein, ein neues Dokument"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.replaceable, (doc) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: doc.value,
									value: doc.value
								}, (0, vue_exports.toDisplayString)(doc.label), 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).supersedes_id]]),
							(0, vue_exports.createVNode)("p", {
								id: "fd-supersedes-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.supersedes_id), 1)
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("span", {
								id: "fd-pdf-label",
								class: "form-field__label"
							}, "Anderes PDF (optional)"),
							(0, vue_exports.createVNode)(FilePick_default, {
								id: "fd-pdf",
								modelValue: pdf.value,
								"onUpdate:modelValue": ($event) => pdf.value = $event,
								accept: "application/pdf,.pdf",
								label: "PDF ersetzen",
								invalid: !!errors.value.upload_key,
								describedby: "fd-pdf-label fd-pdf-err",
								disabled: busy.value
							}, null, 8, [
								"modelValue",
								"onUpdate:modelValue",
								"invalid",
								"disabled"
							]),
							(0, vue_exports.createVNode)("p", {
								class: "form-field__help",
								role: "status"
							}, [(0, vue_exports.unref)(upload).state.value === "uploading" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Wird hochgeladen … " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(Math.round((0, vue_exports.unref)(upload).progress.value * 100), 0)) + " %", 1)], 64)) : (0, vue_exports.unref)(upload).state.value === "retrying" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Die Verbindung hakt – neuer Versuch (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(upload).attempt.value) + " von 3) …", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
							(0, vue_exports.createVNode)("p", {
								id: "fd-pdf-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.upload_key), 1)
						])
					], 32)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/FactsDialog.vue
var FactsDialog_exports = /* @__PURE__ */ __exportAll({ default: () => FactsDialog_default });
var _sfc_setup = FactsDialog_vue_vue_type_script_setup_true_lang_default.setup;
FactsDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/FactsDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FactsDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FactsDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c6f194fa"]]);
//#endregion
export { FactsDialog_exports as n, FactsDialog_default as t };
