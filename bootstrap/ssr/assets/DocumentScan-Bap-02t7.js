import { c as vue_exports, l as __exportAll } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default } from "./useShared-B1ZdimaV.js";
//#region resources/js/lib/fahrzeugschein.ts
/** What is typed or pasted into the HSN field: spaces gone, four characters at most. */
function cleanHsn(raw) {
	return raw.replace(/\s+/g, "").slice(0, 4);
}
/** What is typed or pasted into the TSN field: spaces gone, upper case, three characters at most. */
function cleanTsn(raw) {
	return raw.replace(/\s+/g, "").toUpperCase().slice(0, 3);
}
/** An HSN has four digits; leading zeros count (R-10). */
function isHsn(value) {
	return /^\d{4}$/.test(value);
}
/** A TSN has three characters, letters or digits. */
function isTsn(value) {
	return /^[A-Z0-9]{3}$/.test(value);
}
//#endregion
//#region resources/js/Components/Home/DocumentScan.vue?vue&type=script&setup=true&lang.ts
var DocumentScan_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DocumentScan",
	__ssrInlineRender: true,
	emits: ["confirm", "failed"],
	setup(__props, { emit: __emit }) {
		const id = (0, vue_exports.useId)();
		const phase = (0, vue_exports.ref)("idle");
		const hsn = (0, vue_exports.ref)("");
		const tsn = (0, vue_exports.ref)("");
		(0, vue_exports.ref)(null);
		(0, vue_exports.ref)(null);
		let worker = null;
		(0, vue_exports.onBeforeUnmount)(() => {
			worker?.terminate();
			worker = null;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "scan" }, _attrs))} data-v-c9dcb343><label${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-file`)} class="visually-hidden" data-v-c9dcb343>Foto der Zulassungsbescheinigung Teil I</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-file`)} class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" data-v-c9dcb343>`);
			if (phase.value !== "confirm") {
				_push(`<!--[--><button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", phase.value === "busy" ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(phase.value === "busy") ? " disabled" : ""} data-v-c9dcb343>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "camera",
					size: 20
				}, null, _parent));
				_push(` Fahrzeugschein fotografieren </button><p class="small quiet scan__privacy" data-v-c9dcb343> Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen. </p>`);
				if (phase.value === "busy") _push(`<p class="small muted scan__status" role="status" data-v-c9dcb343>Erkennung läuft …</p>`);
				else _push(`<!---->`);
				if (phase.value === "failed") _push(`<p class="notice scan__failed" role="alert" data-v-c9dcb343> Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein. </p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else _push(`<div class="scan__confirm" data-v-c9dcb343><p class="label" data-v-c9dcb343>Stimmt das?</p><div class="scan__keys" data-v-c9dcb343><div class="form-field" data-v-c9dcb343><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-hsn`)} data-v-c9dcb343>HSN (Feld 2.1)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-hsn`)} class="input input--code"${(0, server_renderer_exports.ssrRenderAttr)("value", hsn.value)} inputmode="numeric" maxlength="4" autocomplete="off" enterkeyhint="next"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", hsn.value !== "" && !(0, vue_exports.unref)(isHsn)(hsn.value) ? "true" : void 0)} data-v-c9dcb343></div><div class="form-field" data-v-c9dcb343><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-tsn`)} data-v-c9dcb343>TSN (Feld 2.2)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-tsn`)} class="input input--code"${(0, server_renderer_exports.ssrRenderAttr)("value", tsn.value)} maxlength="3" autocapitalize="characters" autocomplete="off" enterkeyhint="done"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", tsn.value !== "" && !(0, vue_exports.unref)(isTsn)(tsn.value) ? "true" : void 0)} data-v-c9dcb343></div></div><div class="scan__actions" data-v-c9dcb343><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(isHsn)(hsn.value) || !(0, vue_exports.unref)(isTsn)(tsn.value)) ? " disabled" : ""} data-v-c9dcb343> Übernehmen </button><button class="link small" type="button" data-v-c9dcb343>Noch einmal fotografieren</button></div></div>`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/DocumentScan.vue
var DocumentScan_exports = /* @__PURE__ */ __exportAll({ default: () => DocumentScan_default });
var _sfc_setup = DocumentScan_vue_vue_type_script_setup_true_lang_default.setup;
DocumentScan_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/DocumentScan.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DocumentScan_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DocumentScan_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c9dcb343"]]);
//#endregion
export { isHsn as a, cleanTsn as i, DocumentScan_exports as n, isTsn as o, cleanHsn as r, DocumentScan_default as t };
