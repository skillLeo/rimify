import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import "./useDirtyForm-jjlNVm-n.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Gutachten/CombinationsCard.vue?vue&type=script&setup=true&lang.ts
var BAG = "kombinationen";
var CombinationsCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CombinationsCard",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		combinations: {},
		editable: { type: Boolean },
		pageCount: {},
		stamp: {}
	},
	setup(__props) {
		/**
		* The document's own „Bereifungskombinationen“ (D-256; the client's item 8) — typed as the PDF prints them: each with
		* its number, the size on the front axle and the size on the rear (`225/40 R18`). Once there are any, the shop offers
		* no tyres on this document but these: a mixed set only as a listed pair, four of a kind only where a combination
		* names the same size on both axles.
		*
		* Saved whole, into its own error bag (`kombinationen`).
		*/
		const props = __props;
		useFocusAfter();
		const page = usePage();
		const form = useForm({
			source_page: props.combinations.sourcePage ?? "",
			combinations: props.combinations.entries.map((entry) => ({
				number: entry.number,
				front: entry.front,
				rear: entry.rear
			}))
		});
		const editing = (0, vue_exports.ref)(false);
		const empty = (0, vue_exports.computed)(() => props.combinations.entries.length === 0);
		const errors = (0, vue_exports.computed)(() => (page.props.errors ?? {})[BAG] ?? {});
		function fieldError(i, field) {
			return errors.value[`combinations.${i}.${field}`] ?? "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "kb" }, _attrs))} data-v-07e75fa8><p class="adm-note" data-v-07e75fa8> Nennt das Gutachten Bereifungskombinationen, trag sie hier ein – mit ihrer Nummer, so wie es sie druckt. Dann bietet der Shop zu diesem Gutachten nur diese an: vier gleiche Reifen nur, wo eine Kombination vorne und hinten dieselbe Größe nennt. Die Liste gilt für alle Fahrzeuge dieses Gutachtens. Druckt jede Anlage ihre eigenen Kombinationen, leg jede Anlage als eigenes Gutachten an, mit ihrem Namen im Feld „Anlage“. </p>`);
			if (!editing.value) {
				_push(`<!--[-->`);
				if (empty.value) _push(`<p class="adm-note" data-v-07e75fa8>Zu diesem Gutachten sind keine Bereifungskombinationen hinterlegt.</p>`);
				else {
					_push(`<div class="kb-scroll" data-v-07e75fa8><table class="adm-table kb-table" data-v-07e75fa8><caption class="visually-hidden" data-v-07e75fa8>Bereifungskombinationen</caption><thead data-v-07e75fa8><tr data-v-07e75fa8><th scope="col" class="num" data-v-07e75fa8>Nr.</th><th scope="col" data-v-07e75fa8>Vorderachse</th><th scope="col" data-v-07e75fa8>Hinterachse</th></tr></thead><tbody data-v-07e75fa8><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.combinations.entries, (entry, i) => {
						_push(`<tr data-v-07e75fa8><th scope="row" class="num kb-nr" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(entry.number)}</th><td class="num" data-label="Vorderachse" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(entry.front)}</td><td class="num" data-label="Hinterachse" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(entry.rear)}</td></tr>`);
					});
					_push(`<!--]--></tbody></table></div>`);
				}
				if (!empty.value && __props.combinations.sourcePage) _push(`<p class="adm-note" data-v-07e75fa8>Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.combinations.sourcePage)} im Gutachten.</p>`);
				else _push(`<!---->`);
				if (__props.editable) {
					_push(`<button id="kb-edit" class="btn btn--ghost" type="button" data-v-07e75fa8>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: empty.value ? "plus" : "edit",
						size: 20
					}, null, _parent));
					_push(` ${(0, server_renderer_exports.ssrInterpolate)(empty.value ? "Kombinationen eintragen" : "Kombinationen ändern")}</button>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			} else {
				_push(`<form class="kb-form" novalidate aria-labelledby="kb-form-h" data-v-07e75fa8>`);
				if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
				else _push(`<!---->`);
				_push(`<p id="kb-form-h" class="form-field__label" data-v-07e75fa8>Bereifungskombinationen aus dem Gutachten</p><p class="form-field__help" data-v-07e75fa8>Je Kombination die Nummer und die beiden Größen, so wie das Gutachten sie druckt, etwa 225/40 R18. Lastindex und Geschwindigkeitssymbol lässt du weg.</p><div class="form-field kb-page" data-v-07e75fa8><label class="form-field__label" for="kb-page" data-v-07e75fa8>Seite im Gutachten</label><input id="kb-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).source_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.source_page ? "true" : void 0)} aria-describedby="kb-page-err" data-v-07e75fa8><p id="kb-page-err" class="form-field__error" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(errors.value.source_page)}</p></div><div class="kb-scroll" data-v-07e75fa8><table class="kb-grid" data-v-07e75fa8><thead data-v-07e75fa8><tr data-v-07e75fa8><th scope="col" data-v-07e75fa8>Nr.</th><th scope="col" data-v-07e75fa8>Vorderachse</th><th scope="col" data-v-07e75fa8>Hinterachse</th><th scope="col" data-v-07e75fa8><span class="visually-hidden" data-v-07e75fa8>Kombination entfernen</span></th></tr></thead><tbody data-v-07e75fa8><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(form).combinations, (entry, i) => {
					_push(`<tr data-v-07e75fa8><td data-v-07e75fa8><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `kb-number-${i}`)} data-v-07e75fa8>Nummer der Kombination in Zeile ${(0, server_renderer_exports.ssrInterpolate)(i + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-number-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", entry.number)} class="input kb-number" type="number" min="1" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", fieldError(i, "number") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kb-number-${i}-err`)} data-v-07e75fa8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-number-${i}-err`)} class="form-field__error" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(fieldError(i, "number"))}</p></td><td data-v-07e75fa8><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `kb-front-${i}`)} data-v-07e75fa8>Kombination ${(0, server_renderer_exports.ssrInterpolate)(entry.number || i + 1)}, Vorderachse</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-front-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", entry.front)} class="input kb-size" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="225/40 R18"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", fieldError(i, "front") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kb-front-${i}-err`)} data-v-07e75fa8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-front-${i}-err`)} class="form-field__error" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(fieldError(i, "front"))}</p></td><td data-v-07e75fa8><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `kb-rear-${i}`)} data-v-07e75fa8>Kombination ${(0, server_renderer_exports.ssrInterpolate)(entry.number || i + 1)}, Hinterachse</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-rear-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", entry.rear)} class="input kb-size" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="245/35 R18"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", fieldError(i, "rear") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kb-rear-${i}-err`)} data-v-07e75fa8><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kb-rear-${i}-err`)} class="form-field__error" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(fieldError(i, "rear"))}</p></td><td data-v-07e75fa8><button class="btn btn--ghost btn--icon" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Kombination ${entry.number || i + 1} entfernen`)} data-v-07e75fa8>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "close",
						size: 20
					}, null, _parent));
					_push(`</button></td></tr>`);
				});
				_push(`<!--]--></tbody></table></div><div class="kb-actions" data-v-07e75fa8><button id="kb-add-row" class="btn btn--ghost" type="button" data-v-07e75fa8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Kombination hinzufügen </button></div>`);
				if (errors.value.combinations) _push(`<p id="kb-list-err" class="form-field__error" role="alert" data-v-07e75fa8>${(0, server_renderer_exports.ssrInterpolate)(errors.value.combinations)}</p>`);
				else _push(`<!---->`);
				_push(`<div class="kb-actions" data-v-07e75fa8><button id="kb-save" class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", errors.value.combinations ? "kb-list-err" : void 0)} data-v-07e75fa8> Kombinationen speichern </button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-07e75fa8>Abbrechen</button></div></form>`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/CombinationsCard.vue
var CombinationsCard_exports = /* @__PURE__ */ __exportAll({ default: () => CombinationsCard_default });
var _sfc_setup = CombinationsCard_vue_vue_type_script_setup_true_lang_default.setup;
CombinationsCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/CombinationsCard.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CombinationsCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CombinationsCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-07e75fa8"]]);
//#endregion
export { CombinationsCard_exports as n, CombinationsCard_default as t };
