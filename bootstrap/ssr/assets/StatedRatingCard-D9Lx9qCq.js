import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import "./focusRefused-BCX3fX_F.js";
//#region resources/js/Pages/Admin/Felgen/StatedRatingCard.vue?vue&type=script&setup=true&lang.ts
var StatedRatingCard_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StatedRatingCard",
	__ssrInlineRender: true,
	props: {
		modelId: {},
		stated: {},
		disclosure: {},
		editable: { type: Boolean }
	},
	setup(__props) {
		/**
		* „Sterne von Hand“ on one Felge (the client's #19, D-344, D-345): the stars and their count as the operator has them
		* from elsewhere, and the one sentence that stands beside every rim's typed stars in the shop — with the default agreed
		* on 29.10.2026, which his lawyer may reword. Emptied, the shop shows no typed stars anywhere. Both are saved on their
		* own, beside the Felge's form, as its photographs are: never held back by an unsaved form, never lost to one.
		*
		* Nothing here is a buyer's review: the stars never count towards the buyers' own rating, never read „Geprüfter Kauf“
		* and never go into the data for search engines.
		*/
		const props = __props;
		function fromProps() {
			return {
				rating: props.stated?.rating ?? "",
				count: props.stated?.count ?? ""
			};
		}
		const form = useForm(fromProps());
		const note = useForm({ disclosure: props.disclosure.text });
		const errors = (0, vue_exports.computed)(() => form.errors);
		const noteErrors = (0, vue_exports.computed)(() => note.errors);
		const removing = (0, vue_exports.ref)(false);
		(0, vue_exports.computed)(() => `/admin/felgen/${props.modelId}/sterne`);
		const silent = (0, vue_exports.computed)(() => props.disclosure.text === "");
		(0, vue_exports.watch)(() => JSON.stringify(props.stated), () => {
			form.defaults(fromProps());
			form.reset();
			form.clearErrors();
		});
		(0, vue_exports.watch)(() => props.disclosure.text, (text) => {
			note.defaults({ disclosure: text });
			note.reset();
			note.clearErrors();
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "adm-section fe-stars",
				"aria-labelledby": "fe-h-stars"
			}, _attrs))} data-v-68ef52a3><div class="adm-section__head" data-v-68ef52a3><h2 id="fe-h-stars" class="adm-section__title" data-v-68ef52a3>Sterne von Hand</h2></div><div class="fe-stars__body" data-v-68ef52a3><p class="adm-note" data-v-68ef52a3> Sterne, die du anderswo gesammelt hast – etwa in deinem eBay-Shop. Der Shop zeigt sie unter dem Namen der Felge, in der Felgenliste und auf der Produktseite, immer mit dem Hinweis unten daneben. </p><p class="fe-stars__now" data-stars-now data-v-68ef52a3>`);
			if (__props.stated && !silent.value) _push(`<!--[--><span class="fe-stars__label" data-v-68ef52a3>Im Shop steht:</span><span class="fe-stars__line" data-v-68ef52a3><span class="fe-stars__glyph" aria-hidden="true" data-v-68ef52a3>★</span> <span class="num" data-v-68ef52a3>${(0, server_renderer_exports.ssrInterpolate)(__props.stated.label)}</span>${(0, server_renderer_exports.ssrInterpolate)(" – " + __props.disclosure.text)}</span><!--]-->`);
			else if (__props.stated) _push(`<!--[-->Der Hinweis unten ist leer – deshalb zeigt der Shop diese Sterne nicht.<!--]-->`);
			else _push(`<!--[-->Im Shop stehen keine Sterne von Hand.<!--]-->`);
			_push(`</p>`);
			if (__props.editable) {
				_push(`<form class="fe-stars__form" novalidate data-v-68ef52a3><div class="fe-stars__pair" data-v-68ef52a3><div class="form-field" data-v-68ef52a3><label class="form-field__label" for="fe-stars-rating" data-v-68ef52a3>Sterne</label><input id="fe-stars-rating"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).rating)} class="input num" type="text" inputmode="decimal" maxlength="3" autocomplete="off" placeholder="4,8"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.rating ? "true" : void 0)} aria-describedby="fe-stars-rating-help fe-stars-rating-err" data-v-68ef52a3><p id="fe-stars-rating-help" class="form-field__help" data-v-68ef52a3>Von 1,0 bis 5,0.</p><p id="fe-stars-rating-err" class="form-field__error" data-v-68ef52a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.rating)}</p></div><div class="form-field" data-v-68ef52a3><label class="form-field__label" for="fe-stars-count" data-v-68ef52a3>Anzahl der Bewertungen</label><input id="fe-stars-count"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).count)} class="input num" type="text" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="13"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.count ? "true" : void 0)} aria-describedby="fe-stars-count-err" data-v-68ef52a3><p id="fe-stars-count-err" class="form-field__error" data-v-68ef52a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.count)}</p></div></div><div class="fe-stars__actions" data-v-68ef52a3><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing || removing.value || !(0, vue_exports.unref)(form).isDirty) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-68ef52a3> Sterne speichern </button>`);
				if (__props.stated) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing || removing.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", removing.value ? "true" : void 0)} data-v-68ef52a3> Sterne entfernen </button>`);
				else _push(`<!---->`);
				_push(`</div></form>`);
			} else _push(`<!---->`);
			if (__props.editable) {
				_push(`<form class="fe-stars__form fe-stars__note-form" novalidate data-v-68ef52a3><div class="form-field" data-v-68ef52a3><label class="form-field__label" for="fe-stars-note" data-v-68ef52a3>Hinweis neben den Sternen <span class="fe-stars__all" data-v-68ef52a3>(gilt für alle Felgen)</span></label><input id="fe-stars-note"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(note).disclosure)} class="input" type="text" maxlength="200" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", noteErrors.value.disclosure ? "true" : void 0)} aria-describedby="fe-stars-note-help fe-stars-note-err" data-v-68ef52a3><p id="fe-stars-note-help" class="form-field__help" data-v-68ef52a3> Das Gesetz verlangt, dass neben Bewertungen steht, ob und wie der Shop sie geprüft hat (§ 5b Abs. 3 UWG). Lässt du das Feld leer, zeigt der Shop keine Sterne von Hand mehr. </p><p id="fe-stars-note-err" class="form-field__error" data-v-68ef52a3>${(0, server_renderer_exports.ssrInterpolate)(noteErrors.value.disclosure)}</p></div><div class="fe-stars__actions" data-v-68ef52a3><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(note).processing || !(0, vue_exports.unref)(note).isDirty) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(note).processing ? "true" : void 0)} data-v-68ef52a3>Hinweis speichern</button>`);
				if ((0, vue_exports.unref)(note).disclosure !== __props.disclosure.default) _push(`<button class="btn btn--ghost" type="button" data-v-68ef52a3>Vorgeschlagenen Satz einsetzen</button>`);
				else _push(`<!---->`);
				_push(`</div></form>`);
			} else _push(`<!---->`);
			if (!__props.editable) _push(`<p class="adm-note" data-v-68ef52a3>Sterne von Hand ändern darf, wer Felgen bearbeiten und veröffentlichen darf.</p>`);
			else _push(`<!---->`);
			_push(`</div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Felgen/StatedRatingCard.vue
var StatedRatingCard_exports = /* @__PURE__ */ __exportAll({ default: () => StatedRatingCard_default });
var _sfc_setup = StatedRatingCard_vue_vue_type_script_setup_true_lang_default.setup;
StatedRatingCard_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Felgen/StatedRatingCard.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StatedRatingCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StatedRatingCard_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-68ef52a3"]]);
//#endregion
export { StatedRatingCard_exports as n, StatedRatingCard_default as t };
