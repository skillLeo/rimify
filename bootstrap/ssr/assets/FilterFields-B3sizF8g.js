import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
//#region resources/js/Pages/Admin/Protokoll/FilterFields.vue?vue&type=script&setup=true&lang.ts
var FilterFields_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FilterFields",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		people: {},
		areas: {},
		idPrefix: {},
		dateError: {}
	}, {
		"form": { required: true },
		"formModifiers": {}
	}),
	emits: ["update:form"],
	setup(__props) {
		/**
		* The Protokoll's filter fields, drawn once and used twice: in a row above the list from 768 px, and
		* in the phone's filter sheet. The page owns the values; this only lays them out.
		*/
		const form = (0, vue_exports.useModel)(__props, "form");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-person`)}>Person</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-person`)} class="input"><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.person) ? (0, server_renderer_exports.ssrLooseContain)(form.value.person, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.person, "")) ? " selected" : ""}>Alle Personen</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.people, (person) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", person.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.person) ? (0, server_renderer_exports.ssrLooseContain)(form.value.person, person.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.person, person.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(person.label)}</option>`);
			});
			_push(`<!--]--></select></div><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-bereich`)}>Bereich</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-bereich`)} class="input"><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.bereich) ? (0, server_renderer_exports.ssrLooseContain)(form.value.bereich, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.bereich, "")) ? " selected" : ""}>Alle Bereiche</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.areas, (area) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", area.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.bereich) ? (0, server_renderer_exports.ssrLooseContain)(form.value.bereich, area.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.bereich, area.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(area.label)}</option>`);
			});
			_push(`<!--]--></select></div><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-zeitraum`)}>Zeitraum</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-zeitraum`)} class="input"><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "")) ? " selected" : ""}>Jederzeit</option><option value="heute"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "heute") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "heute")) ? " selected" : ""}>Heute</option><option value="7"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "7") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "7")) ? " selected" : ""}>Letzte 7 Tage</option><option value="30"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "30") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "30")) ? " selected" : ""}>Letzte 30 Tage</option><option value="eigen"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "eigen") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "eigen")) ? " selected" : ""}>Eigener Zeitraum …</option></select></div>`);
			if (form.value.zeitraum === "eigen") _push(`<!--[--><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-von`)}>Von</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-von`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.von)} class="input" type="text" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.dateError ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${__props.idPrefix}-date-err`)}></div><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-bis`)}>Bis</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-bis`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.bis)} class="input" type="text" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.dateError ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${__props.idPrefix}-date-err`)}></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-date-err`)} class="form-field__error pk-date-error">${(0, server_renderer_exports.ssrInterpolate)(__props.dateError)}</p><!--]-->`);
			else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Protokoll/FilterFields.vue
var FilterFields_exports = /* @__PURE__ */ __exportAll({ default: () => FilterFields_default });
var _sfc_setup = FilterFields_vue_vue_type_script_setup_true_lang_default.setup;
FilterFields_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Protokoll/FilterFields.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FilterFields_default = FilterFields_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { FilterFields_exports as n, FilterFields_default as t };
