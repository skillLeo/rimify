import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
//#region resources/js/Pages/Admin/Bestellungen/FilterFields.vue?vue&type=script&setup=true&lang.ts
var FilterFields_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FilterFields",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		statuses: {},
		payment: {},
		shipping: {},
		idPrefix: {},
		dateError: {}
	}, {
		"form": { required: true },
		"formModifiers": {}
	}),
	emits: ["update:form"],
	setup(__props) {
		/**
		* The Bestellungen filter fields, drawn once and used twice: in a row above the list from 768 px,
		* and in the phone's filter sheet. The page owns the values; this only lays them out.
		*
		* Zahlart and Versandart appear only when some order carries one — a filter whose every option finds
		* nothing is a dead end. Amounts are typed the German way and read by the server.
		*/
		const form = (0, vue_exports.useModel)(__props, "form");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-status`)}>Status</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-status`)} class="input"><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.status) ? (0, server_renderer_exports.ssrLooseContain)(form.value.status, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.status, "")) ? " selected" : ""}>Alle</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.statuses, (status) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", status.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.status) ? (0, server_renderer_exports.ssrLooseContain)(form.value.status, status.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.status, status.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(status.label)} (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(status.count))})</option>`);
			});
			_push(`<!--]--></select></div><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-zeitraum`)}>Zeitraum</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-zeitraum`)} class="input"><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "")) ? " selected" : ""}>Jederzeit</option><option value="heute"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "heute") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "heute")) ? " selected" : ""}>Heute</option><option value="7"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "7") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "7")) ? " selected" : ""}>Letzte 7 Tage</option><option value="30"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "30") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "30")) ? " selected" : ""}>Letzte 30 Tage</option><option value="eigen"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zeitraum) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zeitraum, "eigen") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zeitraum, "eigen")) ? " selected" : ""}>Eigener Zeitraum …</option></select></div>`);
			if (form.value.zeitraum === "eigen") _push(`<!--[--><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-von`)}>Von</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-von`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.von)} class="input" type="text" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.dateError ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${__props.idPrefix}-date-err`)}></div><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-bis`)}>Bis</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-bis`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.bis)} class="input" type="text" inputmode="numeric" placeholder="TT.MM.JJJJ" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.dateError ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${__props.idPrefix}-date-err`)}></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-date-err`)} class="form-field__error ob-date-error">${(0, server_renderer_exports.ssrInterpolate)(__props.dateError)}</p><!--]-->`);
			else _push(`<!---->`);
			if (__props.payment.length) {
				_push(`<div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-zahlart`)}>Zahlart</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-zahlart`)} class="input"><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zahlart) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zahlart, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.zahlart, "")) ? " selected" : ""}>Alle</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.payment, (method) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", method.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.zahlart) ? (0, server_renderer_exports.ssrLooseContain)(form.value.zahlart, method.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.zahlart, method.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(method.label)}</option>`);
				});
				_push(`<!--]--></select></div>`);
			} else _push(`<!---->`);
			if (__props.shipping.length) {
				_push(`<div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-versandart`)}>Versandart</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-versandart`)} class="input"><option value=""${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.versandart) ? (0, server_renderer_exports.ssrLooseContain)(form.value.versandart, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.versandart, "")) ? " selected" : ""}>Alle</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.shipping, (method) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", method.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.versandart) ? (0, server_renderer_exports.ssrLooseContain)(form.value.versandart, method.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.versandart, method.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(method.label)}</option>`);
				});
				_push(`<!--]--></select></div>`);
			} else _push(`<!---->`);
			_push(`<div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-min`)}>Summe ab</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-min`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.min)} class="input" type="text" inputmode="decimal" placeholder="z. B. 500" autocomplete="off"></div><div class="form-field"><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${__props.idPrefix}-max`)}>Summe bis</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.idPrefix}-max`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.max)} class="input" type="text" inputmode="decimal" placeholder="z. B. 2.000" autocomplete="off"></div><label class="check ob-check"><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.auflagen) ? (0, server_renderer_exports.ssrLooseContain)(form.value.auflagen, null) : form.value.auflagen) ? " checked" : ""} type="checkbox"> Nur mit Auflagen </label><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Bestellungen/FilterFields.vue
var FilterFields_exports = /* @__PURE__ */ __exportAll({ default: () => FilterFields_default });
var _sfc_setup = FilterFields_vue_vue_type_script_setup_true_lang_default.setup;
FilterFields_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Bestellungen/FilterFields.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FilterFields_default = FilterFields_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { FilterFields_exports as n, FilterFields_default as t };
