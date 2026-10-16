import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as useOcr } from "./useOcr-D0gGfIT2.js";
import { k as useShared } from "./useShopFeedback-DOGyiD0l.js";
import { A as isTsn, k as isHsn } from "./meta-95GYficl.js";
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
		useOcr();
		const how = useShared().value?.isMobile === true ? "Foto aufnehmen" : "Datei wählen";
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "scan" }, _attrs))} data-v-2f9939aa><label${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-file`)} class="visually-hidden" data-v-2f9939aa>Foto der Zulassungsbescheinigung Teil I</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-file`)} class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" data-v-2f9939aa>`);
			if (phase.value !== "confirm") {
				_push(`<!--[--><button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", phase.value === "busy" ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(id)}-how`)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(phase.value === "busy") ? " disabled" : ""} data-v-2f9939aa>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "camera",
					size: 20
				}, null, _parent));
				_push(` Fahrzeugschein scannen </button><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-how`)} class="small quiet scan__how" data-v-2f9939aa>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(how))}</p><p class="small quiet scan__privacy" data-v-2f9939aa> Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen. </p>`);
				if (phase.value === "busy") _push(`<p class="small muted scan__status" role="status" data-v-2f9939aa>Erkennung läuft …</p>`);
				else _push(`<!---->`);
				if (phase.value === "failed") _push(`<p class="notice scan__failed" role="alert" data-v-2f9939aa> Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein. </p>`);
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else _push(`<div class="scan__confirm" data-v-2f9939aa><p class="label" data-v-2f9939aa>Stimmt das?</p><div class="scan__keys" data-v-2f9939aa><div class="form-field" data-v-2f9939aa><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-hsn`)} data-v-2f9939aa>HSN (Feld 2.1)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-hsn`)} class="input input--code"${(0, server_renderer_exports.ssrRenderAttr)("value", hsn.value)} inputmode="numeric" maxlength="4" autocomplete="off" enterkeyhint="next"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", hsn.value !== "" && !(0, vue_exports.unref)(isHsn)(hsn.value) ? "true" : void 0)} data-v-2f9939aa></div><div class="form-field" data-v-2f9939aa><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-tsn`)} data-v-2f9939aa>TSN (Feld 2.2)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-tsn`)} class="input input--code"${(0, server_renderer_exports.ssrRenderAttr)("value", tsn.value)} maxlength="3" autocapitalize="characters" autocomplete="off" enterkeyhint="done"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", tsn.value !== "" && !(0, vue_exports.unref)(isTsn)(tsn.value) ? "true" : void 0)} data-v-2f9939aa></div></div><div class="scan__actions" data-v-2f9939aa><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(isHsn)(hsn.value) || !(0, vue_exports.unref)(isTsn)(tsn.value)) ? " disabled" : ""} data-v-2f9939aa> Übernehmen </button><button class="link small" type="button" data-v-2f9939aa>Noch einmal scannen</button></div></div>`);
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
var DocumentScan_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DocumentScan_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2f9939aa"]]);
//#endregion
export { DocumentScan_exports as n, DocumentScan_default as t };
