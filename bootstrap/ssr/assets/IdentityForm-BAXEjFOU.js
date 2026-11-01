import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import "./useDirtyForm-Dq1y6dPH.js";
import "./focusRefused-BCX3fX_F.js";
//#region resources/js/Pages/Admin/Fahrzeuge/IdentityForm.vue?vue&type=script&setup=true&lang.ts
var IdentityForm_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "IdentityForm",
	__ssrInlineRender: true,
	props: {
		vehicleId: {},
		values: {},
		bodyForms: {},
		drives: {},
		stamp: {}
	},
	emits: ["done", "cancel"],
	setup(__props, { emit: __emit }) {
		/**
		* „Angaben korrigieren“ on a vehicle typed by hand that nothing refers to yet (the admin audit's F-17): the papers' own
		* details, each under the number it stands under in the Zulassungsbescheinigung, as „Neues Fahrzeug“ asks for them.
		* The axle loads and the top speed have their own form on the page. A save made from a page opened before another
		* change is refused (EditStamp), and what was typed stays.
		*/
		const props = __props;
		const form = useForm({
			make: props.values.make ?? "",
			model: props.values.model ?? "",
			variant: props.values.variant ?? "",
			type_designation: props.values.type_designation ?? "",
			hsn: props.values.hsn ?? "",
			tsn: props.values.tsn ?? "",
			eg_number: props.values.eg_number ?? "",
			power_kw: props.values.power_kw ?? "",
			build_from: props.values.build_from ?? "",
			build_to: props.values.build_to ?? "",
			body_form: props.values.body_form ?? "",
			drive_axle: props.values.drive_axle ?? ""
		});
		const errors = (0, vue_exports.computed)(() => form.errors);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<form${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "adm-form fk-form",
				novalidate: ""
			}, _attrs))} data-v-69db8a67>`);
			if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
			else _push(`<!---->`);
			if (errors.value._vehicle) _push(`<p class="adm-alert" role="alert" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value._vehicle)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="fk-grid" data-v-69db8a67><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-make" data-v-69db8a67>Hersteller <span class="fk-field" data-v-69db8a67>(Feld D.1)</span></label><input id="fk-make"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).make)} class="input" type="text" maxlength="60"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.make ? "true" : void 0)} aria-describedby="fk-make-err" data-v-69db8a67><p id="fk-make-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.make)}</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-model" data-v-69db8a67>Handelsbezeichnung <span class="fk-field" data-v-69db8a67>(Feld D.3)</span></label><input id="fk-model"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).model)} class="input" type="text" maxlength="80"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.model ? "true" : void 0)} aria-describedby="fk-model-err" data-v-69db8a67><p id="fk-model-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.model)}</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-variant" data-v-69db8a67>Variante</label><input id="fk-variant"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).variant)} class="input" type="text" maxlength="80"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.variant ? "true" : void 0)} aria-describedby="fk-variant-err" data-v-69db8a67><p id="fk-variant-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.variant)}</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-type" data-v-69db8a67>Fahrzeugtyp <span class="fk-field" data-v-69db8a67>(Feld D.2, optional)</span></label><input id="fk-type"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).type_designation)} class="input fk-mid" type="text" maxlength="32" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.type_designation ? "true" : void 0)} aria-describedby="fk-type-err" data-v-69db8a67><p id="fk-type-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.type_designation)}</p></div><div class="fk-pair" data-v-69db8a67><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-hsn" data-v-69db8a67>HSN <span class="fk-field" data-v-69db8a67>(Feld 2.1)</span></label><input id="fk-hsn"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).hsn)} class="input input--code" type="text" inputmode="numeric" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.hsn ? "true" : void 0)} aria-describedby="fk-hsn-err" data-v-69db8a67><p id="fk-hsn-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.hsn)}</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-tsn" data-v-69db8a67>TSN <span class="fk-field" data-v-69db8a67>(Feld 2.2)</span></label><input id="fk-tsn"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).tsn)} class="input input--code" type="text" spellcheck="false" autocomplete="off" autocapitalize="characters"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.tsn ? "true" : void 0)} aria-describedby="fk-tsn-help fk-tsn-err" data-v-69db8a67><p id="fk-tsn-help" class="form-field__help" data-v-69db8a67>Die ersten drei Zeichen aus Feld 2.2.</p><p id="fk-tsn-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.tsn)}</p></div></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-eg" data-v-69db8a67>EG-Typgenehmigungsnummer <span class="fk-field" data-v-69db8a67>(Feld K)</span></label><input id="fk-eg"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).eg_number)} class="input num" type="text" maxlength="64" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.eg_number ? "true" : void 0)} aria-describedby="fk-eg-err" data-v-69db8a67><p id="fk-eg-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.eg_number)}</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-kw" data-v-69db8a67>Leistung in kW <span class="fk-field" data-v-69db8a67>(Feld P.2)</span></label><input id="fk-kw"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).power_kw)} class="input fk-short num" type="text" inputmode="numeric" maxlength="4" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.power_kw ? "true" : void 0)} aria-describedby="fk-kw-help fk-kw-err" data-v-69db8a67><p id="fk-kw-help" class="form-field__help" data-v-69db8a67>Die erste Zahl in Feld P.2.</p><p id="fk-kw-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.power_kw)}</p></div><div class="fk-window" data-v-69db8a67><div class="fk-pair" data-v-69db8a67><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-from" data-v-69db8a67>Gebaut ab</label><input id="fk-from"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).build_from)} class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.build_from ? "true" : void 0)} aria-describedby="fk-window-help fk-from-err" data-v-69db8a67><p id="fk-from-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.build_from)}</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-to" data-v-69db8a67>Gebaut bis <span class="fk-optional" data-v-69db8a67>(optional)</span></label><input id="fk-to"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).build_to)} class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.build_to ? "true" : void 0)} aria-describedby="fk-window-help fk-to-err" data-v-69db8a67><p id="fk-to-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.build_to)}</p></div></div><p id="fk-window-help" class="form-field__help" data-v-69db8a67>Monat und Jahr, von wann bis wann das Fahrzeug in dieser Variante gebaut wird – nicht die Erstzulassung aus Feld B. „Gebaut bis“ bleibt leer, wenn es noch gebaut wird.</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-body" data-v-69db8a67>Karosserie <span class="fk-optional" data-v-69db8a67>(optional)</span></label><select id="fk-body" class="input fk-mid"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.body_form ? "true" : void 0)} aria-describedby="fk-body-err" data-v-69db8a67><option value="" data-v-69db8a67${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).body_form) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).body_form, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).body_form, "")) ? " selected" : ""}>Nicht angegeben</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.bodyForms, (body) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", body)} data-v-69db8a67${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).body_form) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).body_form, body) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).body_form, body)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(body)}</option>`);
			});
			_push(`<!--]--></select><p id="fk-body-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.body_form)}</p></div><div class="form-field" data-v-69db8a67><label class="form-field__label" for="fk-drive" data-v-69db8a67>Antrieb <span class="fk-optional" data-v-69db8a67>(optional)</span></label><select id="fk-drive" class="input fk-mid"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.drive_axle ? "true" : void 0)} aria-describedby="fk-drive-err" data-v-69db8a67><option value="" data-v-69db8a67${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive_axle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive_axle, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive_axle, "")) ? " selected" : ""}>Nicht angegeben</option><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.drives, (drive) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", drive)} data-v-69db8a67${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive_axle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive_axle, drive) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive_axle, drive)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(drive)}</option>`);
			});
			_push(`<!--]--></select><p id="fk-drive-err" class="form-field__error" data-v-69db8a67>${(0, server_renderer_exports.ssrInterpolate)(errors.value.drive_axle)}</p></div></div><div class="fk-actions" data-v-69db8a67><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing || !(0, vue_exports.unref)(form).isDirty) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-69db8a67>Korrektur speichern</button><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-69db8a67>Abbrechen</button></div></form>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Fahrzeuge/IdentityForm.vue
var IdentityForm_exports = /* @__PURE__ */ __exportAll({ default: () => IdentityForm_default });
var _sfc_setup = IdentityForm_vue_vue_type_script_setup_true_lang_default.setup;
IdentityForm_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Fahrzeuge/IdentityForm.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var IdentityForm_default = /*#__PURE__*/ _plugin_vue_export_helper_default(IdentityForm_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-69db8a67"]]);
//#endregion
export { IdentityForm_exports as n, IdentityForm_default as t };
