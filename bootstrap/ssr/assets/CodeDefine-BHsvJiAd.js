import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports, o as useForm } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as HINT_COLOURS } from "./hintColour-DMvuo_px.js";
import "./useDirtyForm-CUSvyfaU.js";
import "./focusRefused-CpIslrZ7.js";
import { h as useGutachtenPage, m as useEntry } from "./entryStore-wk8wq0su.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CodeDefine.vue?vue&type=script&setup=true&lang.ts
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
		* „68B beschreiben“: a code of this paper, described once (the Gutachten rework §4.5). The text as printed, and the kind, one
		* required select with no default (D-381): it is what makes a code act — an Abnahme derives the Eintragung, a body form filters
		* the cars, a tyre limit narrows the tyres — so a person chooses it. For the four kinds that need it, the one value. The level
		* stays optional, with its floor. Saved through the paper's own Auflagenverzeichnis, as before.
		*/
		const props = __props;
		const store = useEntry();
		const page = useGutachtenPage();
		const existing = (0, vue_exports.computed)(() => page.props.conditions.find((c) => c.code === props.code));
		const kinds = (0, vue_exports.computed)(() => page.props.choices.kinds);
		const draftKey = `code:${props.code}`;
		const draft = store.drafts.get(draftKey);
		const form = useForm({
			code: props.code,
			kind: existing.value?.kind ?? "",
			shop_colour: existing.value?.shopColour ?? "green",
			text_de: existing.value?.text ?? "",
			source_page: existing.value?.page ?? "",
			body_forms: [...existing.value?.bodyForms ?? []],
			drive: existing.value?.drive ?? {
				mode: "only",
				drive: ""
			},
			max_axle_load_kg: existing.value?.maxAxleLoadKg ?? "",
			axle: existing.value?.axle ?? "",
			...draft?.fields ?? {}
		});
		const level = (0, vue_exports.ref)(draft?.level ?? existing.value?.level ?? "");
		(0, vue_exports.watch)([() => form.data(), level], ([fields, chosen]) => {
			store.drafts.set(draftKey, {
				fields,
				level: chosen
			});
		}, { deep: true });
		const help = (0, vue_exports.computed)(() => kinds.value.find((k) => k.value === form.kind)?.help ?? "");
		const errors = (0, vue_exports.computed)(() => form.errors);
		const levels = (0, vue_exports.computed)(() => page.props.levels ?? []);
		const floor = (0, vue_exports.computed)(() => form.kind === "abnahme" || form.kind === "karosseriearbeit" ? "auflage" : "hinweis");
		(0, vue_exports.watch)(floor, (now) => {
			if (now === "auflage" && level.value === "hinweis") level.value = "auflage";
		});
		const root = (0, vue_exports.ref)(null);
		(0, vue_exports.onMounted)(() => root.value?.querySelector("input, textarea")?.focus());
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<form${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "root",
				ref: root,
				class: "ef-define",
				novalidate: ""
			}, _attrs))} data-v-d8a6bcdf>`);
			if (!__props.code) _push(`<div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-code`)} data-v-d8a6bcdf>Code</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-code`)}${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).code)} class="input ef-define__code" type="text" maxlength="32" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.code ? "true" : void 0)} data-v-d8a6bcdf><p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.code)}</p></div>`);
			else if (errors.value.code) _push(`<p class="adm-alert" role="alert" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.code)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-text`)} data-v-d8a6bcdf>Text, wie im Gutachten gedruckt</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-text`)} class="input ef-define__text" rows="4"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.text_de ? "true" : void 0)} data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).text_de)}</textarea><p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.text_de)}</p></div><div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-kind`)} data-v-d8a6bcdf>Was bewirkt der Code?</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-kind`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.kind ? "true" : void 0)} data-v-d8a6bcdf><option value="" disabled data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).kind) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).kind, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).kind, "")) ? " selected" : ""}>Bitte wählen</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(kinds.value, (kind) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", kind.value)} data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).kind) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).kind, kind.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).kind, kind.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(kind.label)}</option>`);
			});
			_push(`<!--]--></select>`);
			if (help.value) _push(`<p class="form-field__help" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(help.value)}</p>`);
			else _push(`<!---->`);
			_push(`<p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.kind)}</p></div>`);
			if ((0, vue_exports.unref)(form).kind === "karosserieform") {
				_push(`<fieldset class="ef-fieldset form-field" data-v-d8a6bcdf><legend class="form-field__label" data-v-d8a6bcdf>Für welche Karosserieformen?</legend><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(page).props.choices.bodyForms, (body) => {
					_push(`<label class="check" data-v-d8a6bcdf><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).body_forms) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).body_forms, body) : (0, vue_exports.unref)(form).body_forms) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", body)} data-v-d8a6bcdf> ${(0, server_renderer_exports.ssrInterpolate)(body)}</label>`);
				});
				_push(`<!--]--><p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.body_forms)}</p></fieldset>`);
			} else _push(`<!---->`);
			if ((0, vue_exports.unref)(form).kind === "antrieb") {
				_push(`<div class="ef-define__pair" data-v-d8a6bcdf><div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-drive-mode`)} data-v-d8a6bcdf>Gilt</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-drive-mode`)} class="input" data-v-d8a6bcdf><option value="only" data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive.mode) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive.mode, "only") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive.mode, "only")) ? " selected" : ""}>nur mit</option><option value="not" data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive.mode) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive.mode, "not") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive.mode, "not")) ? " selected" : ""}>nicht mit</option></select></div><div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-drive`)} data-v-d8a6bcdf>Antrieb</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-drive`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value["drive.drive"] ? "true" : void 0)} data-v-d8a6bcdf><option value="" disabled data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive.drive) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive.drive, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive.drive, "")) ? " selected" : ""}>Bitte wählen</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(page).props.choices.drives, (drive) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", drive)} data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive.drive) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive.drive, drive) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive.drive, drive)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(drive)}</option>`);
				});
				_push(`<!--]--></select><p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value["drive.drive"] ?? errors.value.drive)}</p></div></div>`);
			} else _push(`<!---->`);
			if ((0, vue_exports.unref)(form).kind === "reifen_tragfaehigkeit") _push(`<div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-kg`)} data-v-d8a6bcdf>Zulässige Achslast in kg</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-kg`)}${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).max_axle_load_kg)} class="input ef-define__code" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.max_axle_load_kg ? "true" : void 0)} data-v-d8a6bcdf><p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.max_axle_load_kg)}</p></div>`);
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(form).kind === "reifen_achse") _push(`<div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-axle`)} data-v-d8a6bcdf>Achse</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-axle`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle ? "true" : void 0)} data-v-d8a6bcdf><option value="" disabled data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).axle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).axle, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).axle, "")) ? " selected" : ""}>Bitte wählen</option><option value="FRONT" data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).axle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).axle, "FRONT") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).axle, "FRONT")) ? " selected" : ""}>Nur Vorderachse</option><option value="REAR" data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).axle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).axle, "REAR") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).axle, "REAR")) ? " selected" : ""}>Nur Hinterachse</option></select><p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle)}</p></div>`);
			else _push(`<!---->`);
			_push(`<div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-page`)} data-v-d8a6bcdf>Seite im Gutachten <span class="ef-optional" data-v-d8a6bcdf>(optional)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-page`)}${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).source_page)} class="input ef-define__code" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.source_page ? "true" : void 0)} data-v-d8a6bcdf><p class="form-field__error" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value.source_page)}</p></div><div class="form-field" data-v-d8a6bcdf><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-colour`)} data-v-d8a6bcdf>Farbe im Shop</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-colour`)} class="input" data-v-d8a6bcdf><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(HINT_COLOURS), (colour) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", colour.value)} data-v-d8a6bcdf${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).shop_colour) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).shop_colour, colour.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).shop_colour, colour.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(colour.label)}</option>`);
			});
			_push(`<!--]--></select><p class="form-field__help" data-v-d8a6bcdf>Nur die Farbe des Hinweises „Mit Auflagen“. Was der Shop sagt, ändert sich dadurch nicht.</p></div>`);
			if (levels.value.length) {
				_push(`<fieldset class="ef-fieldset form-field" data-v-d8a6bcdf><legend class="form-field__label" data-v-d8a6bcdf>Einstufung im Shop <span class="ef-optional" data-v-d8a6bcdf>(optional)</span></legend><div class="ef-define__levels" data-v-d8a6bcdf><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(levels.value, (option) => {
					_push(`<label class="adm-chip" data-v-d8a6bcdf><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(level.value, option.value)) ? " checked" : ""} class="visually-hidden" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `${__props.idPrefix}-level`)}${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(floor.value === "auflage" && option.value === "hinweis") ? " disabled" : ""} data-v-d8a6bcdf> ${(0, server_renderer_exports.ssrInterpolate)(option.label)}</label>`);
				});
				_push(`<!--]--></div>`);
				if (floor.value === "auflage") _push(`<p class="form-field__help" data-v-d8a6bcdf>Eine Abnahme oder Arbeit an der Karosserie ist immer mindestens eine Auflage.</p>`);
				else _push(`<!---->`);
				_push(`</fieldset>`);
			} else _push(`<!---->`);
			if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-d8a6bcdf>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="ef-define__actions" data-v-d8a6bcdf><button class="btn btn--secondary" type="button" data-v-d8a6bcdf>Abbrechen</button><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-d8a6bcdf>Speichern</button></div></form>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/CodeDefine.vue
var CodeDefine_exports = /* @__PURE__ */ __exportAll({ default: () => CodeDefine_default });
var _sfc_setup = CodeDefine_vue_vue_type_script_setup_true_lang_default.setup;
CodeDefine_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/CodeDefine.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CodeDefine_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CodeDefine_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d8a6bcdf"]]);
//#endregion
export { CodeDefine_exports as n, CodeDefine_default as t };
