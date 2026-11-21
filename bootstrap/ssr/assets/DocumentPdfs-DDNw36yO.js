import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as usePresignedUpload } from "./usePresignedUpload-OlzXcuzV.js";
//#region resources/js/Pages/Admin/Gutachten/DocumentPdfs.vue?vue&type=script&setup=true&lang.ts
var DocumentPdfs_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DocumentPdfs",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		pdfs: {},
		can: { type: Boolean },
		maxMb: {}
	},
	setup(__props) {
		const LABELS = [
			"Gutachten",
			"Nachtrag",
			"Anlage",
			"Ältere Fassung"
		];
		usePresignedUpload();
		(0, vue_exports.ref)(null);
		(0, vue_exports.ref)(null);
		const label = (0, vue_exports.ref)("Nachtrag");
		const datedOn = (0, vue_exports.ref)("");
		const error = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		const editing = (0, vue_exports.ref)(null);
		const editLabel = (0, vue_exports.ref)("");
		const editDate = (0, vue_exports.ref)("");
		const keyOf = (entry) => entry.main ? "main" : entry.id;
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "adm-section dp",
				"aria-labelledby": "dp-h",
				"data-document-pdfs": ""
			}, _attrs))} data-v-3864bf08><div class="adm-section__head" data-v-3864bf08><h2 id="dp-h" class="adm-section__title" data-v-3864bf08>PDFs im Shop</h2></div><p class="adm-note" data-v-3864bf08> Der Kunde sieht alle sichtbaren PDFs in dieser Reihenfolge, mit Bezeichnung und Datum. Das PDF, das bei uns für diesen Eintrag hinterlegt ist, gehört stets dazu. Ein ausgeblendetes PDF bleibt gespeichert, denn Bestellungen können darauf verweisen. </p><ol class="dp__list" data-v-3864bf08><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.pdfs, (entry, i) => {
				_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "dp__item--hidden": entry.hidden }, "dp__item"])}" data-v-3864bf08>`);
				if (editing.value === keyOf(entry)) _push(`<div class="dp__edit" data-v-3864bf08><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `dp-label-${i}`)} data-v-3864bf08>Bezeichnung</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `dp-label-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", editLabel.value)} class="input" type="text" maxlength="80" list="dp-labels" data-v-3864bf08><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `dp-date-${i}`)} data-v-3864bf08>Datum <span class="adm-hint" data-v-3864bf08>(wahlweise)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `dp-date-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", editDate.value)} class="input" type="date" data-v-3864bf08><div class="dp__actions" data-v-3864bf08><button class="btn btn--primary btn--sm" type="button" data-v-3864bf08>Speichern</button><button class="btn btn--secondary btn--sm" type="button" data-v-3864bf08>Abbrechen</button></div></div>`);
				else {
					_push(`<!--[--><span class="dp__name" data-v-3864bf08>`);
					if (entry.url) _push(`<a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", entry.url)} target="_blank" rel="noopener" data-v-3864bf08>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</a>`);
					else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(entry.label)}<!--]-->`);
					if (entry.dateLabel) _push(`<span class="dp__date" data-v-3864bf08> · ${(0, server_renderer_exports.ssrInterpolate)(entry.dateLabel)}</span>`);
					else _push(`<!---->`);
					if (entry.main) _push(`<span class="adm-tag adm-tag--neutral" data-v-3864bf08>PDF des Gutachtens</span>`);
					else _push(`<!---->`);
					if (entry.hidden) _push(`<span class="adm-tag adm-tag--neutral" data-v-3864bf08>Ausgeblendet</span>`);
					else _push(`<!---->`);
					_push(`</span>`);
					if (__props.can) {
						_push(`<span class="dp__actions" data-v-3864bf08><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(i === 0) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${entry.label} nach oben`)} data-v-3864bf08>↑</button><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(i === __props.pdfs.length - 1) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${entry.label} nach unten`)} data-v-3864bf08>↓</button><button class="btn btn--secondary btn--sm" type="button" data-v-3864bf08>Bearbeiten</button>`);
						if (!entry.main) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-3864bf08>${(0, server_renderer_exports.ssrInterpolate)(entry.hidden ? "Einblenden" : "Ausblenden")}</button>`);
						else _push(`<!---->`);
						_push(`</span>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				}
				_push(`</li>`);
			});
			_push(`<!--]--></ol>`);
			if (__props.can) {
				_push(`<form class="dp__add" novalidate data-v-3864bf08><div class="form-field" data-v-3864bf08><label class="form-field__label" for="dp-file" data-v-3864bf08>Weiteres PDF</label><input id="dp-file" class="input" type="file" accept="application/pdf,.pdf" aria-describedby="dp-file-help dp-err" data-v-3864bf08><p id="dp-file-help" class="form-field__help" data-v-3864bf08>Nur PDF, bis ${(0, server_renderer_exports.ssrInterpolate)(__props.maxMb)} MB.</p></div><div class="form-field" data-v-3864bf08><label class="form-field__label" for="dp-new-label" data-v-3864bf08>Bezeichnung</label><input id="dp-new-label"${(0, server_renderer_exports.ssrRenderAttr)("value", label.value)} class="input" type="text" maxlength="80" list="dp-labels" data-v-3864bf08></div><div class="form-field" data-v-3864bf08><label class="form-field__label" for="dp-new-date" data-v-3864bf08>Datum <span class="adm-hint" data-v-3864bf08>(wahlweise)</span></label><input id="dp-new-date"${(0, server_renderer_exports.ssrRenderAttr)("value", datedOn.value)} class="input" type="date" data-v-3864bf08></div><div data-v-3864bf08><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-3864bf08>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird hochgeladen …" : "PDF hinzufügen")}</button></div><datalist id="dp-labels" data-v-3864bf08><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(LABELS, (item) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", item)} data-v-3864bf08></option>`);
				});
				_push(`<!--]--></datalist></form>`);
			} else _push(`<!---->`);
			_push(`<p id="dp-err" class="form-field__error" role="alert" data-v-3864bf08>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</p></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/DocumentPdfs.vue
var DocumentPdfs_exports = /* @__PURE__ */ __exportAll({ default: () => DocumentPdfs_default });
var _sfc_setup = DocumentPdfs_vue_vue_type_script_setup_true_lang_default.setup;
DocumentPdfs_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/DocumentPdfs.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DocumentPdfs_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DocumentPdfs_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3864bf08"]]);
//#endregion
export { DocumentPdfs_exports as n, DocumentPdfs_default as t };
