import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports, o as useForm } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as stampHeaders } from "./useDirtyForm-CUSvyfaU.js";
import { t as FilePick_default } from "./FilePick-2dSToBON.js";
import "./file-65D2TnCP.js";
import { t as DeratingTable_default } from "./DeratingTable-C_7GKnVA.js";
import { t as DocumentExtras_default } from "./DocumentExtras-BVFXNgqn.js";
import { h as useGutachtenPage, m as useEntry } from "./entryStore-XWwzBuxT.js";
import { t as DateField_default } from "./DateField-DBwXoxz-.js";
import { r as DocumentSelect_default, t as RecordFields_default } from "./RecordFields-6u0zfWXP.js";
import { t as usePresignedUpload } from "./usePresignedUpload-OlzXcuzV.js";
import { n as deratingShown, t as deratingAbsent } from "./derating-HgTblNFT.js";
import { t as createAutosave } from "./autosave-C5HjIjlG.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepPaper.vue?vue&type=script&setup=true&lang.ts
var StepPaper_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepPaper",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 1, Gutachten (the Gutachten rework §7): the PDF, the Art and the number are all a paper needs; date and issuer are optional;
		* everything else is folded under „Weitere Angaben“. Saved as it is typed, one save at a time: what does not pass stays in its
		* field and says why, and the step is only left once the server holds what was typed (autosave.ts).
		*/
		const store = useEntry();
		const { state, go } = store;
		const page = useGutachtenPage();
		const doc = (0, vue_exports.computed)(() => page.props.document);
		const shape = (0, vue_exports.ref)({ ...doc.value.shape });
		const pdf = (0, vue_exports.ref)(null);
		const upload = usePresignedUpload();
		const form = useForm({
			upload_key: "",
			kind: doc.value.kind,
			kba_number: doc.value.kbaNumber,
			report_number: doc.value.reportNumber,
			approval_mark: doc.value.approvalMark,
			issuer: doc.value.issuer,
			issued_on: doc.value.issuedOn,
			page_count: doc.value.pageCount ?? "",
			supersedes_id: doc.value.supersedesId
		});
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
		const errors = (0, vue_exports.computed)(() => form.errors);
		const uploading = (0, vue_exports.computed)(() => upload.state.value === "uploading" || upload.state.value === "retrying");
		const numberMissing = (0, vue_exports.computed)(() => String(form[numberField.value.key] ?? "").trim() === "");
		async function write() {
			if (!state.editable || numberMissing.value) return false;
			form.upload_key = "";
			if (pdf.value !== null) {
				const key = await upload.upload(pdf.value);
				if (key === null) {
					form.setError("upload_key", upload.error.value ?? "Die Datei konnte nicht hochgeladen werden.");
					if (upload.error.value === "Die Datei hat sich geändert, seit du sie ausgewählt hast. Wähl sie bitte noch einmal aus.") pdf.value = null;
					return false;
				}
				form.upload_key = key;
			}
			state.save = "saving";
			return new Promise((resolve) => {
				let ok = false;
				form.transform((data) => ({
					...data,
					...shape.value,
					autosave: true
				})).put(`/admin/gutachten/${state.documentId}`, {
					preserveScroll: true,
					preserveState: true,
					headers: stampHeaders(page.props.stamps?.document),
					onSuccess: () => {
						ok = true;
						pdf.value = null;
					},
					onError: (bag) => {
						if (bag.upload_key) pdf.value = null;
					},
					onFinish: () => {
						state.save = ok ? "saved" : "failed";
						resolve(ok);
					}
				});
			});
		}
		const autosave = createAutosave({
			content: () => JSON.stringify([
				form.kind,
				form.kba_number,
				form.report_number,
				form.approval_mark,
				form.issuer,
				form.issued_on,
				form.page_count,
				form.supersedes_id,
				shape.value
			]),
			write,
			delay: 700,
			clean: () => {
				form.clearErrors();
				state.save = "saved";
			}
		});
		(0, vue_exports.watch)(() => [
			form.kind,
			form.kba_number,
			form.report_number,
			form.approval_mark,
			form.issuer,
			form.issued_on,
			form.page_count,
			form.supersedes_id
		], () => autosave.changed());
		(0, vue_exports.watch)(shape, () => autosave.changed(), { deep: true });
		(0, vue_exports.watch)(pdf, (file) => {
			if (file !== null) {
				autosave.force();
				autosave.flush();
			}
		});
		let letGo = () => {};
		(0, vue_exports.onMounted)(() => {
			autosave.mark();
			letGo = store.hold(autosave);
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			letGo();
			if (autosave.owed()) autosave.flush();
		});
		const deratingRequired = (0, vue_exports.computed)(() => doc.value.shape.tyre_index_source === "table");
		const deratingShown$1 = (0, vue_exports.computed)(() => deratingShown(doc.value.shape.tyre_index_source, page.props.derating.rows.length));
		const deratingAbsent$1 = (0, vue_exports.computed)(() => deratingAbsent(doc.value.shape.tyre_index_source, state.editable));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-step",
				"aria-labelledby": "ef-paper-h"
			}, _attrs))} data-v-f0d5354c><h2 id="ef-paper-h" class="adm-section__title" tabindex="-1" data-v-f0d5354c>Gutachten</h2><p class="adm-note" data-v-f0d5354c>Nur das PDF, die Art und die Nummer sind nötig. Alles andere ist freiwillig.</p><div class="ef-paper" data-v-f0d5354c>`);
			if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="form-field" data-v-f0d5354c><span id="ef-pdf-label" class="form-field__label" data-v-f0d5354c>PDF des Gutachtens</span>`);
			if (doc.value.hasPdf) {
				_push(`<p class="ef-file" data-v-f0d5354c>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "documents",
					size: 20
				}, null, _parent));
				if (doc.value.pdfUrl) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", doc.value.pdfUrl)} target="_blank" rel="noopener" data-v-f0d5354c>PDF öffnen</a>`);
				else _push(`<!---->`);
				if (doc.value.pageCount) _push(`<span class="ef-file__meta" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(doc.value.pageCount === 1 ? "1 Seite" : `${doc.value.pageCount} Seiten`)}</span>`);
				else _push(`<!---->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
				id: "ef-pdf",
				modelValue: pdf.value,
				"onUpdate:modelValue": ($event) => pdf.value = $event,
				accept: "application/pdf,.pdf",
				label: doc.value.hasPdf ? "PDF ersetzen" : "PDF auswählen",
				invalid: !!errors.value.upload_key,
				describedby: "ef-pdf-label ef-pdf-err",
				disabled: uploading.value || !(0, vue_exports.unref)(state).editable
			}, null, _parent));
			if (uploading.value) {
				_push(`<p class="form-field__help" role="status" data-v-f0d5354c>`);
				if ((0, vue_exports.unref)(upload).state.value === "uploading") _push(`<!--[-->Wird hochgeladen … ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(Math.round((0, vue_exports.unref)(upload).progress.value * 100), 0))} %<!--]-->`);
				else _push(`<!--[-->Die Verbindung hakt – neuer Versuch (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(upload).attempt.value)} von 3) …<!--]-->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			_push(`<p id="ef-pdf-err" class="form-field__error" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.upload_key)}</p><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(doc.value.samePdf ?? [], (twin) => {
				_push(`<span class="form-field__help" data-v-f0d5354c> Dieselbe Datei liegt auch bei <a${(0, server_renderer_exports.ssrRenderAttr)("href", twin.href)} data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(twin.label)}</a> (${(0, server_renderer_exports.ssrInterpolate)(twin.status)}). </span>`);
			});
			_push(`<!--]--></div><fieldset class="form-field ef-fieldset" data-v-f0d5354c><legend class="form-field__label" data-v-f0d5354c>Art</legend><div class="ef-seg" role="radiogroup" aria-label="Art" data-v-f0d5354c><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(page).props.kinds, (kind) => {
				_push(`<label class="adm-chip" data-v-f0d5354c><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).kind, kind.value)) ? " checked" : ""} class="visually-hidden" type="radio" name="ef-art"${(0, server_renderer_exports.ssrRenderAttr)("value", kind.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-f0d5354c> ${(0, server_renderer_exports.ssrInterpolate)(kind.label)}</label>`);
			});
			_push(`<!--]--></div></fieldset><div class="ef-pair" data-v-f0d5354c><div class="form-field" data-v-f0d5354c><label class="form-field__label" for="ef-number" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(numberField.value.label)}</label><input id="ef-number"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form)[numberField.value.key])} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[numberField.value.key] || numberMissing.value ? "true" : void 0)} aria-describedby="ef-number-help ef-number-err" data-v-f0d5354c><p id="ef-number-help" class="form-field__help" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(numberField.value.help)}</p><p id="ef-number-err" class="form-field__error" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(errors.value[numberField.value.key] ?? (numberMissing.value ? "Die Nummer fehlt. Gib sie so ein, wie sie im Gutachten steht." : ""))}</p></div><div class="form-field" data-v-f0d5354c><label class="form-field__label" for="ef-date" data-v-f0d5354c>Ausgestellt am <span class="ef-optional" data-v-f0d5354c>(optional)</span></label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: "ef-date",
				modelValue: (0, vue_exports.unref)(form).issued_on,
				"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).issued_on = $event,
				invalid: Boolean(errors.value.issued_on),
				describedby: "ef-date-err"
			}, null, _parent));
			_push(`<p id="ef-date-err" class="form-field__error" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.issued_on)}</p></div></div><div class="form-field" data-v-f0d5354c><label class="form-field__label" for="ef-issuer" data-v-f0d5354c>Aussteller <span class="ef-optional" data-v-f0d5354c>(optional)</span></label><input id="ef-issuer"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).issuer)} class="input ef-wide" type="text" maxlength="120" placeholder="z. B. TÜV Austria"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-f0d5354c><p class="form-field__error" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.issuer)}</p></div><details class="ef-more" data-v-f0d5354c><summary class="ef-more__summary" data-v-f0d5354c>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				class: "ef-more__marker",
				name: "chevron-right",
				size: 16
			}, null, _parent));
			_push(` <span data-v-f0d5354c>Weitere Angaben <span class="ef-optional" data-v-f0d5354c>(optional)</span></span></summary><div class="ef-more__body" data-v-f0d5354c>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RecordFields_default, {
				shape: shape.value,
				"onUpdate:shape": ($event) => shape.value = $event,
				kind: (0, vue_exports.unref)(form).kind,
				errors: errors.value,
				supplementable: (0, vue_exports.unref)(page).props.supplementable.filter((d) => d.value !== doc.value.id),
				"id-prefix": "ef"
			}, null, _parent));
			_push(`<div class="ef-pair" data-v-f0d5354c><div class="form-field" data-v-f0d5354c><label class="form-field__label" for="ef-pages" data-v-f0d5354c>Seiten</label><input id="ef-pages"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).page_count)} class="input" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.page_count ? "true" : void 0)} aria-describedby="ef-pages-err"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-f0d5354c><p id="ef-pages-err" class="form-field__error" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.page_count)}</p></div>`);
			if ((0, vue_exports.unref)(page).props.replaceable.length) {
				_push(`<div class="form-field" data-v-f0d5354c><label class="form-field__label" for="ef-supersedes" data-v-f0d5354c>Ersetzt eine frühere Fassung</label>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DocumentSelect_default, {
					id: "ef-supersedes",
					modelValue: (0, vue_exports.unref)(form).supersedes_id,
					"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).supersedes_id = $event,
					options: (0, vue_exports.unref)(page).props.replaceable,
					"none-label": "Nein, ein neues Dokument",
					invalid: Boolean(errors.value.supersedes_id),
					describedby: "ef-supersedes-err"
				}, null, _parent));
				_push(`<p id="ef-supersedes-err" class="form-field__error" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(errors.value.supersedes_id)}</p></div>`);
			} else _push(`<!---->`);
			_push(`</div><section class="ef-more__section" aria-labelledby="ef-derating-h" data-v-f0d5354c><h3 id="ef-derating-h" class="ef-more__title" data-v-f0d5354c>Tragfähigkeit bei hoher Geschwindigkeit</h3>`);
			if (deratingShown$1.value) _push((0, server_renderer_exports.ssrRenderComponent)(DeratingTable_default, {
				"document-id": doc.value.id,
				stamp: (0, vue_exports.unref)(page).props.stamps.derating,
				derating: (0, vue_exports.unref)(page).props.derating,
				editable: (0, vue_exports.unref)(state).editable,
				"page-count": doc.value.pageCount,
				required: deratingRequired.value
			}, null, _parent));
			else _push(`<p class="adm-note" data-v-f0d5354c>${(0, server_renderer_exports.ssrInterpolate)(deratingAbsent$1.value)}</p>`);
			_push(`</section><section class="ef-more__section" aria-labelledby="ef-extras-h" data-v-f0d5354c><h3 id="ef-extras-h" class="ef-more__title" data-v-f0d5354c>Befestigung und Hinweise</h3>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DocumentExtras_default, {
				"document-id": doc.value.id,
				fasteners: (0, vue_exports.unref)(page).props.fasteners,
				notices: (0, vue_exports.unref)(page).props.notices,
				reworks: (0, vue_exports.unref)(page).props.reworks,
				conditions: (0, vue_exports.unref)(page).props.conditions,
				editable: (0, vue_exports.unref)(state).editable,
				"page-count": doc.value.pageCount
			}, null, _parent));
			_push(`</section></div></details></div><div class="ef-actions" data-v-f0d5354c><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(numberMissing.value || uploading.value) ? " disabled" : ""} data-v-f0d5354c> Weiter: Felge `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "arrow-right",
				size: 20
			}, null, _parent));
			_push(`</button></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepPaper.vue
var StepPaper_exports = /* @__PURE__ */ __exportAll({ default: () => StepPaper_default });
var _sfc_setup = StepPaper_vue_vue_type_script_setup_true_lang_default.setup;
StepPaper_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/StepPaper.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepPaper_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepPaper_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f0d5354c"]]);
//#endregion
export { StepPaper_exports as n, StepPaper_default as t };
