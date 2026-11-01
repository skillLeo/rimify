import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { t as DateField_default } from "./DateField-DHzKJUXe.js";
import { f as PAPER, o as useSketch } from "./gutachtenStore-DERNJqCs.js";
//#region resources/js/Pages/Admin/Skizze/parts/StepPaper.vue?vue&type=script&setup=true&lang.ts
var StepPaper_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepPaper",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 1, Gutachten (the brief §7): the PDF, the Art and the number are all a paper needs to start; date and issuer are
		* optional; everything else is folded under „Weitere Angaben" — including how the paper gives load index and speed
		* symbol, which step 5 asks if nobody answered it here.
		*/
		const { state, go } = useSketch();
		const ARTS = [
			"ABE",
			"Teilegutachten",
			"EG-Genehmigung"
		];
		const LI_SOURCES = [
			{
				value: "document",
				label: "Bei jeder Reifengröße"
			},
			{
				value: "papers",
				label: "Mit einem Verweis auf die Fahrzeugpapiere"
			},
			{
				value: "table",
				label: "In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit"
			}
		];
		const tried = (0, vue_exports.ref)(false);
		const numberError = (0, vue_exports.computed)(() => tried.value && state.number.trim() === "" ? "Die Nummer fehlt. Gib sie so ein, wie sie im Gutachten steht." : "");
		const replaced = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-step",
				"aria-labelledby": "sk-paper-h"
			}, _attrs))} data-v-661fb2f8><h2 id="sk-paper-h" class="adm-section__title" tabindex="-1" data-v-661fb2f8>Gutachten</h2><p class="adm-note" data-v-661fb2f8>Nur das PDF, die Art und die Nummer sind nötig. Alles andere ist freiwillig.</p><div class="sk-paper" data-v-661fb2f8><div class="form-field" data-v-661fb2f8><span id="sk-pdf-label" class="form-field__label" data-v-661fb2f8>PDF des Gutachtens</span><div class="sk-file" aria-describedby="sk-pdf-label" data-v-661fb2f8>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "documents",
				size: 20
			}, null, _parent));
			_push(`<span class="sk-file__name" data-v-661fb2f8>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPER).file)}</span><span class="sk-file__meta" data-v-661fb2f8>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPER).pages)} Seiten · hochgeladen</span><button class="btn btn--ghost" type="button" data-v-661fb2f8>Ersetzen</button></div>`);
			if (replaced.value) _push(`<p class="form-field__help" role="status" data-v-661fb2f8>In der Skizze wird keine Datei hochgeladen.</p>`);
			else _push(`<!---->`);
			_push(`</div><fieldset class="form-field sk-fieldset" data-v-661fb2f8><legend class="form-field__label" data-v-661fb2f8>Art</legend><div class="sk-seg" role="radiogroup" aria-label="Art" data-v-661fb2f8><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(ARTS, (art) => {
				_push(`<label class="adm-chip" data-v-661fb2f8><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(state).art, art)) ? " checked" : ""} class="visually-hidden" type="radio" name="sk-art"${(0, server_renderer_exports.ssrRenderAttr)("value", art)} data-v-661fb2f8> ${(0, server_renderer_exports.ssrInterpolate)(art)}</label>`);
			});
			_push(`<!--]--></div></fieldset><div class="sk-pair" data-v-661fb2f8><div class="form-field" data-v-661fb2f8><label class="form-field__label" for="sk-number" data-v-661fb2f8>Nummer</label><input id="sk-number"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(state).number)} class="input" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", numberError.value ? "true" : void 0)} aria-describedby="sk-number-help sk-number-err" data-v-661fb2f8><p id="sk-number-help" class="form-field__help" data-v-661fb2f8>Wie im Gutachten gedruckt, z. B. die KBA-Nummer der ABE.</p><p id="sk-number-err" class="form-field__error" data-v-661fb2f8>${(0, server_renderer_exports.ssrInterpolate)(numberError.value)}</p></div><div class="form-field" data-v-661fb2f8><label class="form-field__label" for="sk-date" data-v-661fb2f8>Ausgestellt am <span class="sk-optional" data-v-661fb2f8>(optional)</span></label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: "sk-date",
				modelValue: (0, vue_exports.unref)(state).issuedOn,
				"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(state).issuedOn = $event
			}, null, _parent));
			_push(`</div></div><div class="form-field" data-v-661fb2f8><label class="form-field__label" for="sk-issuer" data-v-661fb2f8>Aussteller <span class="sk-optional" data-v-661fb2f8>(optional)</span></label><input id="sk-issuer"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(state).issuer)} class="input sk-wide" type="text" maxlength="120" placeholder="z. B. TÜV Austria" data-v-661fb2f8></div><details class="sk-more" data-v-661fb2f8><summary class="sk-more__summary" data-v-661fb2f8>Weitere Angaben <span class="sk-optional" data-v-661fb2f8>(optional)</span></summary><div class="sk-more__body" data-v-661fb2f8><div class="form-field" data-v-661fb2f8><label class="form-field__label" for="sk-supplement" data-v-661fb2f8>Nachtrag oder Fassung</label><input id="sk-supplement"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(state).supplement)} class="input sk-wide" type="text" data-v-661fb2f8></div><div class="sk-grid" data-v-661fb2f8><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)([
				"Anlage",
				"Prüfbericht-Nr.",
				"Ausfertigung",
				"Benennungsnummer",
				"Prüfort",
				"Prüfdatum",
				"Gültig ab Fertigungsdatum"
			], (field) => {
				_push(`<div class="form-field" data-v-661fb2f8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `sk-more-${field}`)} data-v-661fb2f8>${(0, server_renderer_exports.ssrInterpolate)(field)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `sk-more-${field}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(state).more[field])} class="input" type="text" data-v-661fb2f8></div>`);
			});
			_push(`<!--]--></div><fieldset class="form-field sk-fieldset" data-v-661fb2f8><legend class="form-field__label" data-v-661fb2f8>Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol an?</legend><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(LI_SOURCES, (option) => {
				_push(`<label class="check" data-v-661fb2f8><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(state).liSource, option.value)) ? " checked" : ""} type="radio" name="sk-li"${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-661fb2f8> ${(0, server_renderer_exports.ssrInterpolate)(option.label)}</label>`);
			});
			_push(`<!--]--><p class="form-field__help" data-v-661fb2f8>Lässt du das offen, fragt Schritt 5 danach – mit einem Vorschlag aus den eingetragenen Reifen.</p></fieldset></div></details></div><div class="sk-actions" data-v-661fb2f8><button class="btn btn--primary" type="button" data-v-661fb2f8> Weiter: Felge `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "arrow-right",
				size: 20
			}, null, _parent));
			_push(`</button></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/StepPaper.vue
var StepPaper_exports = /* @__PURE__ */ __exportAll({ default: () => StepPaper_default });
var _sfc_setup = StepPaper_vue_vue_type_script_setup_true_lang_default.setup;
StepPaper_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/StepPaper.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepPaper_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepPaper_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-661fb2f8"]]);
//#endregion
export { StepPaper_exports as n, StepPaper_default as t };
