import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { h as useGutachtenPage, m as useEntry } from "./entryStore-wk8wq0su.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/PdfPanel.vue?vue&type=script&setup=true&lang.ts
var PdfPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PdfPanel",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The paper beside the form (the Gutachten rework §7 step 4; D-389): the uploaded PDF in the browser's own viewer, on our own
		* address for the CSP, driven by our page control through `#page=N` — no pdf.js. „Aktuelle PDF-Seite übernehmen“ takes our
		* control's number: a page scrolled to inside the viewer goes unseen, and the viewer says so by keeping our number.
		*/
		const { state } = useEntry();
		const page = useGutachtenPage();
		const zoom = (0, vue_exports.ref)(null);
		const ZOOMS = [
			50,
			75,
			100,
			125,
			150
		];
		const pages = (0, vue_exports.computed)(() => page.props.document.pageCount);
		const src = (0, vue_exports.computed)(() => page.props.document.hasPdf ? `/admin/gutachten/${state.documentId}/pdf?v=${page.props.document.pdfVersion ?? ""}#page=${state.pdfPage}&${zoom.value === null ? "view=FitH&zoom=FitH" : `zoom=${zoom.value}`}` : null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-pdf",
				"aria-label": "Gutachten-PDF"
			}, _attrs))} data-v-70d3a73d><div class="ef-pdf__bar" data-v-70d3a73d><span class="ef-pdf__pages" data-v-70d3a73d><button class="ef-pdf__btn" type="button" aria-label="Vorherige Seite"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(state).pdfPage <= 1) ? " disabled" : ""} data-v-70d3a73d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "chevron-left",
				size: 16
			}, null, _parent));
			_push(`</button><label class="visually-hidden" for="ef-pdf-page" data-v-70d3a73d>Seite</label><input id="ef-pdf-page" class="input ef-pdf__page" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(state).pdfPage)} data-v-70d3a73d>`);
			if (pages.value) _push(`<span class="ef-count" data-v-70d3a73d>/ ${(0, server_renderer_exports.ssrInterpolate)(pages.value)}</span>`);
			else _push(`<!---->`);
			_push(`<button class="ef-pdf__btn" type="button" aria-label="Nächste Seite"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(pages.value !== null && (0, vue_exports.unref)(state).pdfPage >= pages.value) ? " disabled" : ""} data-v-70d3a73d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "chevron-right",
				size: 16
			}, null, _parent));
			_push(`</button></span><span class="ef-pdf__zoom" data-v-70d3a73d><button class="ef-pdf__btn" type="button" aria-label="Verkleinern"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(zoom.value === ZOOMS[0]) ? " disabled" : ""} data-v-70d3a73d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "minus",
				size: 16
			}, null, _parent));
			_push(`</button><button class="ef-count ef-pdf__pct" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", zoom.value === null ? "Passt auf die Spaltenbreite" : "Auf die Spaltenbreite einpassen")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(zoom.value === null) ? " disabled" : ""} data-v-70d3a73d>${(0, server_renderer_exports.ssrInterpolate)(zoom.value === null ? "Breite" : (0, vue_exports.unref)(withUnit)(zoom.value, "%"))}</button><button class="ef-pdf__btn" type="button" aria-label="Vergrößern"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(zoom.value === ZOOMS[ZOOMS.length - 1]) ? " disabled" : ""} data-v-70d3a73d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "plus",
				size: 16
			}, null, _parent));
			_push(`</button></span>`);
			if (src.value) {
				_push(`<a class="ef-pdf__btn ef-pdf__open"${(0, server_renderer_exports.ssrRenderAttr)("href", (0, vue_exports.unref)(page).props.document.pdfUrl ?? void 0)} target="_blank" rel="noopener" aria-label="PDF in neuem Tab öffnen" title="PDF in neuem Tab öffnen" data-v-70d3a73d>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "documents",
					size: 16
				}, null, _parent));
				_push(`</a>`);
			} else _push(`<!---->`);
			_push(`</div><div class="ef-pdf__view" data-v-70d3a73d>`);
			if (src.value) _push(`<iframe class="ef-pdf__frame"${(0, server_renderer_exports.ssrRenderAttr)("src", src.value)} title="Gutachten-PDF" data-v-70d3a73d></iframe>`);
			else _push(`<p class="adm-note" data-v-70d3a73d>Noch kein PDF hinterlegt. Lad es in Schritt 1 hoch.</p>`);
			_push(`</div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/PdfPanel.vue
var PdfPanel_exports = /* @__PURE__ */ __exportAll({ default: () => PdfPanel_default });
var _sfc_setup = PdfPanel_vue_vue_type_script_setup_true_lang_default.setup;
PdfPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/PdfPanel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var PdfPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PdfPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-70d3a73d"]]);
//#endregion
export { PdfPanel_exports as n, PdfPanel_default as t };
