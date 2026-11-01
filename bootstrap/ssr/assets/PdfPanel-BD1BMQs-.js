import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { d as PAGE_TITLES, f as PAPER, g as PRINTED_ROWS, h as PRINTED_ONLY, o as useSketch, s as CODES } from "./gutachtenStore-DERNJqCs.js";
//#region resources/js/Pages/Admin/Skizze/parts/PdfPanel.vue?vue&type=script&setup=true&lang.ts
var PdfPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PdfPanel",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The paper beside the form (the brief §7 step 4): page, zoom, and the page number the editor can take over. In the
		* sketch a placeholder stands where the PDF will — its Verwendungsbereich rows and the code texts on their pages — and
		* says so. The real panel shows the uploaded PDF in the browser's own viewer, driven by these controls (Phase 0 §9).
		*/
		const store = useSketch();
		const { state } = store;
		const zoom = (0, vue_exports.ref)(100);
		const ZOOMS = [
			75,
			100,
			125,
			150
		];
		const rows = (0, vue_exports.computed)(() => PRINTED_ROWS[state.pdfPage] ?? []);
		const current = (0, vue_exports.computed)(() => store.group(state.cell)?.type ?? null);
		const codes = (0, vue_exports.computed)(() => [...CODES.filter((code) => code.page === state.pdfPage && code.text !== null).map((code) => ({
			code: code.code,
			text: code.text ?? ""
		})), ...Object.entries(PRINTED_ONLY).filter(([, printed]) => printed.page === state.pdfPage).map(([code, printed]) => ({
			code,
			text: printed.text
		}))]);
		const heading = (0, vue_exports.computed)(() => PAGE_TITLES[state.pdfPage] ?? (codes.value.length ? "Auflagen und Hinweise" : `Seite ${state.pdfPage}`));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-pdf",
				"aria-label": "Gutachten-PDF"
			}, _attrs))} data-v-db0c9ccc><div class="sk-pdf__bar" data-v-db0c9ccc><span class="sk-pdf__file"${(0, server_renderer_exports.ssrRenderAttr)("title", (0, vue_exports.unref)(PAPER).file)} data-v-db0c9ccc>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "documents",
				size: 16
			}, null, _parent));
			_push(`<span class="sk-pdf__name" data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPER).file)}</span></span><span class="sk-pdf__pages" data-v-db0c9ccc><button class="sk-pdf__btn" type="button" aria-label="Vorherige Seite"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(state).pdfPage <= 1) ? " disabled" : ""} data-v-db0c9ccc>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "chevron-left",
				size: 16
			}, null, _parent));
			_push(`</button><label class="visually-hidden" for="sk-pdf-page" data-v-db0c9ccc>Seite</label><input id="sk-pdf-page" class="input sk-pdf__page" type="number" step="1" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", (0, vue_exports.unref)(PAPER).pages)}${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(state).pdfPage)} data-v-db0c9ccc><span class="sk-count" data-v-db0c9ccc>/ ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPER).pages)}</span><button class="sk-pdf__btn" type="button" aria-label="Nächste Seite"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(state).pdfPage >= (0, vue_exports.unref)(PAPER).pages) ? " disabled" : ""} data-v-db0c9ccc>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "chevron-right",
				size: 16
			}, null, _parent));
			_push(`</button></span><span class="sk-pdf__zoom" data-v-db0c9ccc><button class="sk-pdf__btn" type="button" aria-label="Verkleinern"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(zoom.value === ZOOMS[0]) ? " disabled" : ""} data-v-db0c9ccc>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "minus",
				size: 16
			}, null, _parent));
			_push(`</button><span class="sk-count sk-pdf__pct" data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(zoom.value, "%"))}</span><button class="sk-pdf__btn" type="button" aria-label="Vergrößern"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(zoom.value === ZOOMS[ZOOMS.length - 1]) ? " disabled" : ""} data-v-db0c9ccc>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "plus",
				size: 16
			}, null, _parent));
			_push(`</button></span></div><div class="sk-pdf__view" data-v-db0c9ccc><article class="sk-sheet" style="${(0, server_renderer_exports.ssrRenderStyle)({ "--zoom": zoom.value / 100 })}" data-v-db0c9ccc><p class="sk-sheet__mark" data-v-db0c9ccc>Platzhalter · hier steht im echten Ablauf das PDF</p><header class="sk-sheet__head" data-v-db0c9ccc><span data-v-db0c9ccc>TÜV AUSTRIA · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPER).supplement.replace("Nachtrag ", ""))}</span><span data-v-db0c9ccc>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).pdfPage)} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPER).pages)}</span></header><h3 class="sk-sheet__title" data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(heading.value)}</h3>`);
			if (rows.value.length) {
				_push(`<table class="sk-sheet__table" data-v-db0c9ccc><thead data-v-db0c9ccc><tr data-v-db0c9ccc><th class="sk-sheet__type" data-v-db0c9ccc>Typ</th><th data-v-db0c9ccc>Betriebs­erlaubnis</th><th class="sk-sheet__kw" data-v-db0c9ccc>kW</th><th data-v-db0c9ccc>Reifen</th><th data-v-db0c9ccc>Auflagen zu Reifen</th></tr></thead><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(rows.value, (row) => {
					_push(`<tbody class="${(0, server_renderer_exports.ssrRenderClass)({ "sk-sheet__rows--on": row.type === current.value })}" data-v-db0c9ccc><tr class="sk-sheet__group" data-v-db0c9ccc><td colspan="5" data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(row.group)}</td></tr><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(row.tyres, (tyre, index) => {
						_push(`<tr data-v-db0c9ccc><td data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(index === 0 ? row.type : "")}</td><td data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(index === 0 ? row.approval : "")}</td><td data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(index === 0 ? row.kw : "")}</td><td data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(tyre.size)}</td><td data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(tyre.codes)}</td></tr>`);
					});
					_push(`<!--]--><tr data-v-db0c9ccc><td colspan="5" class="sk-sheet__general" data-v-db0c9ccc><strong data-v-db0c9ccc>Auflagen:</strong> ${(0, server_renderer_exports.ssrInterpolate)(row.general)}</td></tr></tbody>`);
				});
				_push(`<!--]--></table>`);
			} else if (codes.value.length) {
				_push(`<dl class="sk-sheet__codes" data-v-db0c9ccc><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(codes.value, (entry) => {
					_push(`<div data-v-db0c9ccc><dt data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(entry.code)}</dt><dd data-v-db0c9ccc>${(0, server_renderer_exports.ssrInterpolate)(entry.text)}</dd></div>`);
				});
				_push(`<!--]--></dl>`);
			} else {
				_push(`<div class="sk-sheet__lines" aria-hidden="true" data-v-db0c9ccc><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(14, (n) => {
					_push(`<span class="sk-sheet__line" style="${(0, server_renderer_exports.ssrRenderStyle)({ width: `${60 + n * 37 % 40}%` })}" data-v-db0c9ccc></span>`);
				});
				_push(`<!--]--></div>`);
			}
			_push(`</article></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/PdfPanel.vue
var PdfPanel_exports = /* @__PURE__ */ __exportAll({ default: () => PdfPanel_default });
var _sfc_setup = PdfPanel_vue_vue_type_script_setup_true_lang_default.setup;
PdfPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/PdfPanel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var PdfPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PdfPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-db0c9ccc"]]);
//#endregion
export { PdfPanel_exports as n, PdfPanel_default as t };
