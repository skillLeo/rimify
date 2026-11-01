import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { S as levelFloor, h as PRINTED_ONLY, l as KINDS, o as useSketch, u as LEVELS } from "./gutachtenStore-DERNJqCs.js";
//#region resources/js/Pages/Admin/Skizze/parts/CodeDefine.vue?vue&type=script&setup=true&lang.ts
var CodeDefine_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CodeDefine",
	__ssrInlineRender: true,
	props: {
		code: {},
		idPrefix: {}
	},
	emits: ["done", "cancel"],
	setup(__props, { emit: __emit }) {
		/**
		* „68B definieren": a code of this paper, described once (the brief §4.5, §7). The text as printed, and — beyond the
		* brief, for the reason Phase 0 gives — the kind: it is what makes a code act (an Abnahme derives the Eintragung, a body
		* form filters the cars, a tyre limit narrows the tyres), so it is chosen by a person, never guessed. The level stays
		* optional, with its floor: an Abnahme or work on the body is always at least an Auflage.
		*/
		const props = __props;
		const store = useSketch();
		const existing = store.codeOf(props.code);
		const form = (0, vue_exports.reactive)({
			code: props.code,
			text: existing?.text ?? "",
			kind: existing?.kind ?? "",
			level: existing?.level ?? null,
			value: ""
		});
		const tried = (0, vue_exports.ref)(false);
		const floor = (0, vue_exports.computed)(() => form.kind === "" ? "hinweis" : levelFloor(form.kind));
		const needs = (0, vue_exports.computed)(() => KINDS.find((kind) => kind.value === form.kind)?.needs ?? null);
		const printed = (0, vue_exports.computed)(() => PRINTED_ONLY[form.code.trim()] ?? null);
		const taken = (0, vue_exports.computed)(() => props.code === "" ? store.state.codes.find((c) => c.code.toLowerCase() === form.code.trim().toLowerCase()) ?? null : null);
		const errors = (0, vue_exports.computed)(() => ({
			code: tried.value && form.code.trim() === "" ? "Der Code fehlt. Gib ihn so ein, wie er im Gutachten steht." : taken.value ? `Den Code ${taken.value.code} gibt es schon. Ändere ihn in der Liste.` : "",
			text: tried.value && form.text.trim() === "" ? "Der Text fehlt. Schreib ihn ab oder füg ihn ein, wie das Gutachten ihn druckt." : "",
			kind: tried.value && form.kind === "" ? "Wähl, was der Code bewirkt." : ""
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<form${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-define",
				novalidate: ""
			}, _attrs))} data-v-6f07f466>`);
			if (!__props.code) _push(`<div class="form-field" data-v-6f07f466><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-code`)} data-v-6f07f466>Code</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-code`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.code)} class="input sk-define__code" type="text" maxlength="32" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.code ? "true" : void 0)} data-v-6f07f466><p class="form-field__error" data-v-6f07f466>${(0, server_renderer_exports.ssrInterpolate)(errors.value.code)}</p></div>`);
			else _push(`<!---->`);
			_push(`<div class="form-field" data-v-6f07f466><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-text`)} data-v-6f07f466>Text, wie im Gutachten gedruckt</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-text`)} class="input sk-define__text" rows="4"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.text ? "true" : void 0)} data-v-6f07f466>${(0, server_renderer_exports.ssrInterpolate)(form.text)}</textarea>`);
			if (printed.value && form.text.trim() === "") _push(`<p class="form-field__help" data-v-6f07f466> Im PDF auf Seite ${(0, server_renderer_exports.ssrInterpolate)(printed.value.page)}. <button class="sk-link" type="button" data-v-6f07f466>Text aus der Skizze einsetzen</button></p>`);
			else _push(`<!---->`);
			_push(`<p class="form-field__error" data-v-6f07f466>${(0, server_renderer_exports.ssrInterpolate)(errors.value.text)}</p></div><div class="form-field" data-v-6f07f466><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-kind`)} data-v-6f07f466>Was bewirkt der Code?</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-kind`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.kind ? "true" : void 0)} data-v-6f07f466><option value="" disabled data-v-6f07f466${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.kind) ? (0, server_renderer_exports.ssrLooseContain)(form.kind, "") : (0, server_renderer_exports.ssrLooseEqual)(form.kind, "")) ? " selected" : ""}>Bitte wählen</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(KINDS), (kind) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", kind.value)} data-v-6f07f466${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.kind) ? (0, server_renderer_exports.ssrLooseContain)(form.kind, kind.value) : (0, server_renderer_exports.ssrLooseEqual)(form.kind, kind.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(kind.label)}</option>`);
			});
			_push(`<!--]--></select><p class="form-field__error" data-v-6f07f466>${(0, server_renderer_exports.ssrInterpolate)(errors.value.kind)}</p></div>`);
			if (needs.value) _push(`<div class="form-field" data-v-6f07f466><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-value`)} data-v-6f07f466>${(0, server_renderer_exports.ssrInterpolate)(needs.value)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-value`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value)} class="input" type="text" data-v-6f07f466></div>`);
			else _push(`<!---->`);
			_push(`<fieldset class="sk-fieldset form-field" data-v-6f07f466><legend class="form-field__label" data-v-6f07f466>Einstufung im Shop <span class="sk-optional" data-v-6f07f466>(optional)</span></legend><div class="sk-define__levels" data-v-6f07f466><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(LEVELS), (level) => {
				_push(`<label class="adm-chip" data-v-6f07f466><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(form.level, level.value)) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `${__props.idPrefix}-level`)}${(0, server_renderer_exports.ssrRenderAttr)("value", level.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(floor.value === "auflage" && level.value === "hinweis") ? " disabled" : ""} data-v-6f07f466> ${(0, server_renderer_exports.ssrInterpolate)(level.label)}</label>`);
			});
			_push(`<!--]--></div>`);
			if (floor.value === "auflage") _push(`<p class="form-field__help" data-v-6f07f466>Eine Abnahme oder Arbeit an der Karosserie ist immer mindestens eine Auflage.</p>`);
			else _push(`<!---->`);
			_push(`</fieldset><div class="sk-define__actions" data-v-6f07f466><button class="btn btn--ghost" type="button" data-v-6f07f466>Abbrechen</button><button class="btn btn--primary" type="submit" data-v-6f07f466>Speichern</button></div></form>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/CodeDefine.vue
var CodeDefine_exports = /* @__PURE__ */ __exportAll({ default: () => CodeDefine_default });
var _sfc_setup = CodeDefine_vue_vue_type_script_setup_true_lang_default.setup;
CodeDefine_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/CodeDefine.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CodeDefine_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CodeDefine_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6f07f466"]]);
//#endregion
export { CodeDefine_exports as n, CodeDefine_default as t };
