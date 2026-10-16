import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Gutachten/CountCard.vue?vue&type=script&setup=true&lang.ts
var BAG = "zaehlung";
var CountCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CountCard",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		count: {},
		editable: { type: Boolean },
		pageCount: {},
		rows: {}
	},
	setup(__props) {
		/**
		* The count of a Gutachten's Verwendungsbereich (ADMIN-GEFUNDEN 511): read off the PDF before the rows are entered,
		* each figure with the page it stands on — „6 Auflagen-Codes, Seite 3“. The release compares the entry with it in the
		* sentences D-228 has always used; a count taken after the entry says so here and in the Protokoll.
		*
		* Saved into its own error bag (`zaehlung`): the release dialog on the same page asks other questions.
		*/
		const props = __props;
		useFocusAfter();
		const page = usePage();
		function initial() {
			return {
				codes: props.count?.codes ?? "",
				codes_page: props.count?.codesPage ?? "",
				sizes: props.count?.sizes ?? "",
				sizes_page: props.count?.sizesPage ?? "",
				axle_limit_kg: props.count?.axleLimitKg ?? "",
				axle_limit_page: props.count?.axleLimitPage ?? "",
				abnahme: props.count?.abnahme ?? "",
				abnahme_page: props.count?.abnahmePage ?? ""
			};
		}
		const form = useForm(initial());
		const editing = (0, vue_exports.ref)(props.count === null && props.editable);
		const errors = (0, vue_exports.computed)(() => (page.props.errors ?? {})[BAG] ?? {});
		const abnahmePaged = (0, vue_exports.computed)(() => form.abnahme === "all" || form.abnahme === "some");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "zl" }, _attrs))} data-v-b317b501>`);
			if (!editing.value) {
				_push(`<!--[-->`);
				if (__props.count) {
					_push(`<!--[--><ul class="zl-lines" data-v-b317b501><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.count.lines, (line) => {
						_push(`<li data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
					});
					_push(`<!--]--></ul><p class="adm-note" data-v-b317b501> Gezählt`);
					if (__props.count.by) _push(`<!--[--> von ${(0, server_renderer_exports.ssrInterpolate)(__props.count.by)}<!--]-->`);
					else _push(`<!---->`);
					_push(` am ${(0, server_renderer_exports.ssrInterpolate)(__props.count.at)} – ${(0, server_renderer_exports.ssrInterpolate)(__props.count.beforeEntry ? "bevor die erste Zeile stand." : "als schon Zeilen standen.")} Die Freigabe vergleicht die Zeilen mit dieser Zählung. </p>`);
					if (__props.editable) {
						_push(`<button id="zl-edit" class="btn btn--ghost" type="button" data-v-b317b501>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "edit",
							size: 20
						}, null, _parent));
						_push(` Zählung ändern </button>`);
					} else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<p class="adm-note" data-v-b317b501>Noch nicht gezählt.</p>`);
				_push(`<!--]-->`);
			} else {
				_push(`<form class="zl-form" novalidate aria-labelledby="zl-form-h" data-v-b317b501><p id="zl-form-h" class="form-field__label" data-v-b317b501>Was der Verwendungsbereich druckt</p><p class="form-field__help" data-v-b317b501>`);
				if (__props.rows === 0) _push(`<!--[-->Bevor du Zeilen erfasst: Zähl im PDF, was der Verwendungsbereich für die Fahrzeuge druckt, die du erfassen willst, und schreib zu jeder Zahl die Seite. Die Freigabe vergleicht deine Zeilen später mit dieser Zählung.<!--]-->`);
				else _push(`<!--[-->Zähl im PDF, was der Verwendungsbereich für alle Fahrzeuge druckt, die erfasst sind oder noch erfasst werden, und schreib zu jeder Zahl die Seite. Es stehen schon Zeilen – festgehalten wird, dass erst danach gezählt wurde.<!--]-->`);
				if (__props.count) _push(`<!--[--> Eine Änderung hält das Protokoll mit dem vorherigen Stand fest.<!--]-->`);
				else _push(`<!---->`);
				_push(`</p><div class="zl-pair" data-v-b317b501><div class="form-field" data-v-b317b501><label class="form-field__label" for="zl-codes" data-v-b317b501>Auflagen-Codes</label><input id="zl-codes"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).codes)} class="input" type="number" min="0" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.codes ? "true" : void 0)} aria-describedby="zl-codes-err" data-v-b317b501><p id="zl-codes-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.codes)}</p></div><div class="form-field" data-v-b317b501><label class="form-field__label" for="zl-codes-page" data-v-b317b501>Seite</label><input id="zl-codes-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).codes_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.codes_page ? "true" : void 0)} aria-describedby="zl-codes-page-err" data-v-b317b501><p id="zl-codes-page-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.codes_page)}</p></div></div><div class="zl-pair" data-v-b317b501><div class="form-field" data-v-b317b501><label class="form-field__label" for="zl-sizes" data-v-b317b501>Reifengrößen</label><input id="zl-sizes"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).sizes)} class="input" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sizes ? "true" : void 0)} aria-describedby="zl-sizes-err" data-v-b317b501><p id="zl-sizes-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sizes)}</p></div><div class="form-field" data-v-b317b501><label class="form-field__label" for="zl-sizes-page" data-v-b317b501>Seite</label><input id="zl-sizes-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).sizes_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sizes_page ? "true" : void 0)} aria-describedby="zl-sizes-page-err" data-v-b317b501><p id="zl-sizes-page-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sizes_page)}</p></div></div><div class="zl-pair" data-v-b317b501><div class="form-field" data-v-b317b501><label class="form-field__label" for="zl-axle-limit-kg" data-v-b317b501>Achslastgrenze in kg</label><input id="zl-axle-limit-kg"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_limit_kg)} class="input" type="number" min="200" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_limit_kg ? "true" : void 0)} aria-describedby="zl-axle-limit-help zl-axle-limit-kg-err" data-v-b317b501><p id="zl-axle-limit-help" class="form-field__help" data-v-b317b501>Nur, wenn der Verwendungsbereich eine nennt – etwa „nur für Fahrzeuge mit maximaler Achslast 1160 kg“. Sonst leer lassen.</p><p id="zl-axle-limit-kg-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_limit_kg)}</p></div>`);
				if ((0, vue_exports.unref)(form).axle_limit_kg !== "") _push(`<div class="form-field" data-v-b317b501><label class="form-field__label" for="zl-axle-limit-page" data-v-b317b501>Seite</label><input id="zl-axle-limit-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_limit_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_limit_page ? "true" : void 0)} aria-describedby="zl-axle-limit-page-err" data-v-b317b501><p id="zl-axle-limit-page-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_limit_page)}</p></div>`);
				else _push(`<!---->`);
				_push(`</div><fieldset class="zl-group" data-v-b317b501><legend class="form-field__label" data-v-b317b501>Verlangt der Verwendungsbereich eine Abnahme?</legend><label class="check" data-v-b317b501><input id="zl-abnahme-all"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "all")) ? " checked" : ""} type="radio" name="zl-abnahme" value="all" aria-describedby="zl-abnahme-err" data-v-b317b501><span data-v-b317b501>Ja, bei jeder Kombination</span></label><label class="check" data-v-b317b501><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "some")) ? " checked" : ""} type="radio" name="zl-abnahme" value="some" aria-describedby="zl-abnahme-err" data-v-b317b501><span data-v-b317b501>Ja, bei einigen Kombinationen</span></label><label class="check" data-v-b317b501><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).abnahme, "none")) ? " checked" : ""} type="radio" name="zl-abnahme" value="none" aria-describedby="zl-abnahme-err" data-v-b317b501><span data-v-b317b501>Nein</span></label><p id="zl-abnahme-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.abnahme)}</p></fieldset>`);
				if (abnahmePaged.value) _push(`<div class="form-field zl-page" data-v-b317b501><label class="form-field__label" for="zl-abnahme-page" data-v-b317b501>Seite der Abnahme</label><input id="zl-abnahme-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).abnahme_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.abnahme_page ? "true" : void 0)} aria-describedby="zl-abnahme-page-err" data-v-b317b501><p id="zl-abnahme-page-err" class="form-field__error" data-v-b317b501>${(0, server_renderer_exports.ssrInterpolate)(errors.value.abnahme_page)}</p></div>`);
				else _push(`<!---->`);
				_push(`<div class="zl-actions" data-v-b317b501><button id="zl-save" class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-b317b501>Zählung speichern</button>`);
				if (__props.count) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-b317b501>Abbrechen</button>`);
				else _push(`<!---->`);
				_push(`</div></form>`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/CountCard.vue
var CountCard_exports = /* @__PURE__ */ __exportAll({ default: () => CountCard_default });
var _sfc_setup = CountCard_vue_vue_type_script_setup_true_lang_default.setup;
CountCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/CountCard.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CountCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CountCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b317b501"]]);
//#endregion
export { CountCard_exports as n, CountCard_default as t };
