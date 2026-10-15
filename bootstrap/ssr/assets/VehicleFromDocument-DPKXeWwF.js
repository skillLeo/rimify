import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Gutachten/VehicleFromDocument.vue?vue&type=script&setup=true&lang.ts
var VehicleFromDocument_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VehicleFromDocument",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		pageCount: {},
		bodyForms: {},
		drives: {}
	},
	emits: ["created"],
	setup(__props, { emit: __emit }) {
		/**
		* „Fahrzeug aus diesem Gutachten anlegen“ (Block C, item 7): the car exactly as the document names it —
		* maker, trade name, the maker's Fahrzeugtyp, the EG type-approval number as printed, body style and drive
		* where the document says them, and the page. The document names no HSN or TSN, and none is made up: the
		* car stands without them until a vehicle dataset brings them (docs/specs/vehicles-and-tyres.md).
		*
		* Its axle loads and top speed are not in the document either: the car is saved „zur Prüfung“, and the
		* shop's tyre answer stays open until the customer's papers give them (R-03).
		*
		* Sent as JSON to the document's own endpoint; the new car comes back ready to tick in the list above.
		*/
		const props = __props;
		useFocusAfter();
		const open = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const failed = (0, vue_exports.ref)("");
		const errors = (0, vue_exports.ref)({});
		const blank = () => ({
			make: "",
			model: "",
			variant: "",
			type_designation: "",
			eg_number: "",
			body_form: "",
			drive_axle: "",
			source_page: ""
		});
		const form = (0, vue_exports.reactive)(blank());
		const DRIVE_AXLES = (0, vue_exports.computed)(() => props.drives.filter((d) => d !== "Allradlenkung"));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "vfd" }, _attrs))} data-v-609f8449>`);
			if (!open.value) {
				_push(`<button id="vfd-open" class="btn btn--ghost" type="button" data-v-609f8449>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Fahrzeug aus diesem Gutachten anlegen </button>`);
			} else {
				_push(`<form class="vfd-form" novalidate aria-labelledby="vfd-h" data-v-609f8449><p id="vfd-h" class="vfd-title" data-v-609f8449>Fahrzeug aus diesem Gutachten</p><p class="form-field__help" data-v-609f8449>So, wie das Gutachten es nennt. HSN, TSN, Achslasten und Höchstgeschwindigkeit bleiben hier leer – sie stehen in der Zulassungsbescheinigung, und das Fahrzeug kommt „zur Prüfung“.</p><div class="vfd-grid" data-v-609f8449><div class="form-field" data-v-609f8449><label class="form-field__label" for="vfd-make" data-v-609f8449>Hersteller</label><input id="vfd-make"${(0, server_renderer_exports.ssrRenderAttr)("value", form.make)} class="input" type="text" maxlength="60" placeholder="BMW"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.make ? "true" : void 0)} aria-describedby="vfd-make-err" data-v-609f8449><p id="vfd-make-err" class="form-field__error" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(errors.value.make)}</p></div><div class="form-field" data-v-609f8449><label class="form-field__label" for="vfd-model" data-v-609f8449>Handelsbezeichnung</label><input id="vfd-model"${(0, server_renderer_exports.ssrRenderAttr)("value", form.model)} class="input" type="text" maxlength="80" placeholder="4er Coupé"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.model ? "true" : void 0)} aria-describedby="vfd-model-err" data-v-609f8449><p id="vfd-model-err" class="form-field__error" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(errors.value.model)}</p></div><div class="form-field" data-v-609f8449><label class="form-field__label" for="vfd-type-designation" data-v-609f8449>Fahrzeugtyp</label><input id="vfd-type-designation"${(0, server_renderer_exports.ssrRenderAttr)("value", form.type_designation)} class="input" type="text" maxlength="32" spellcheck="false" placeholder="3C"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.type_designation ? "true" : void 0)} aria-describedby="vfd-type-designation-err" data-v-609f8449><p id="vfd-type-designation-err" class="form-field__error" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(errors.value.type_designation)}</p></div><div class="form-field vfd-wide" data-v-609f8449><label class="form-field__label" for="vfd-eg-number" data-v-609f8449>EG-Typgenehmigungsnummer</label><input id="vfd-eg-number"${(0, server_renderer_exports.ssrRenderAttr)("value", form.eg_number)} class="input" type="text" maxlength="64" spellcheck="false" placeholder="e1*2007/46*0316*.."${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.eg_number ? "true" : void 0)} aria-describedby="vfd-eg-number-help vfd-eg-number-err" data-v-609f8449><p id="vfd-eg-number-help" class="form-field__help" data-v-609f8449>Mit der Erweiterung, so wie gedruckt – auch als Bereich: e1*2001/116*0287*00-09 oder …*04-... Über sie findet der spätere Fahrzeugdaten-Import dieses Fahrzeug wieder.</p><p id="vfd-eg-number-err" class="form-field__error" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(errors.value.eg_number)}</p></div><div class="form-field" data-v-609f8449><label class="form-field__label" for="vfd-variant" data-v-609f8449>Variante <span class="vfd-optional" data-v-609f8449>(optional)</span></label><input id="vfd-variant"${(0, server_renderer_exports.ssrRenderAttr)("value", form.variant)} class="input" type="text" maxlength="80" placeholder="leer: wie der Fahrzeugtyp" data-v-609f8449></div><div class="form-field" data-v-609f8449><label class="form-field__label" for="vfd-body-form" data-v-609f8449>Karosserie <span class="vfd-optional" data-v-609f8449>(optional)</span></label><select id="vfd-body-form" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.body_form ? "true" : void 0)} aria-describedby="vfd-body-form-err" data-v-609f8449><option value="" data-v-609f8449${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.body_form) ? (0, server_renderer_exports.ssrLooseContain)(form.body_form, "") : (0, server_renderer_exports.ssrLooseEqual)(form.body_form, "")) ? " selected" : ""}>Nennt das Gutachten nicht</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.bodyForms, (b) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", b)} data-v-609f8449${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.body_form) ? (0, server_renderer_exports.ssrLooseContain)(form.body_form, b) : (0, server_renderer_exports.ssrLooseEqual)(form.body_form, b)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(b)}</option>`);
				});
				_push(`<!--]--></select><p id="vfd-body-form-err" class="form-field__error" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(errors.value.body_form)}</p></div><div class="form-field" data-v-609f8449><label class="form-field__label" for="vfd-drive-axle" data-v-609f8449>Antrieb <span class="vfd-optional" data-v-609f8449>(optional)</span></label><select id="vfd-drive-axle" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.drive_axle ? "true" : void 0)} aria-describedby="vfd-drive-axle-err" data-v-609f8449><option value="" data-v-609f8449${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.drive_axle) ? (0, server_renderer_exports.ssrLooseContain)(form.drive_axle, "") : (0, server_renderer_exports.ssrLooseEqual)(form.drive_axle, "")) ? " selected" : ""}>Nennt das Gutachten nicht</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(DRIVE_AXLES.value, (d) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", d)} data-v-609f8449${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.drive_axle) ? (0, server_renderer_exports.ssrLooseContain)(form.drive_axle, d) : (0, server_renderer_exports.ssrLooseEqual)(form.drive_axle, d)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(d)}</option>`);
				});
				_push(`<!--]--></select><p id="vfd-drive-axle-err" class="form-field__error" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(errors.value.drive_axle)}</p></div><div class="form-field" data-v-609f8449><label class="form-field__label" for="vfd-source-page" data-v-609f8449>Seite im Gutachten</label><input id="vfd-source-page"${(0, server_renderer_exports.ssrRenderAttr)("value", form.source_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.source_page ? "true" : void 0)} aria-describedby="vfd-source-page-err" data-v-609f8449><p id="vfd-source-page-err" class="form-field__error" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(errors.value.source_page)}</p></div></div>`);
				if (failed.value) _push(`<p class="adm-alert" role="alert" data-v-609f8449>${(0, server_renderer_exports.ssrInterpolate)(failed.value)}</p>`);
				else _push(`<!---->`);
				_push(`<div class="vfd-actions" data-v-609f8449><button id="vfd-save" class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-609f8449>Fahrzeug anlegen</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-609f8449>Abbrechen</button></div></form>`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/VehicleFromDocument.vue
var VehicleFromDocument_exports = /* @__PURE__ */ __exportAll({ default: () => VehicleFromDocument_default });
var _sfc_setup = VehicleFromDocument_vue_vue_type_script_setup_true_lang_default.setup;
VehicleFromDocument_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/VehicleFromDocument.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var VehicleFromDocument_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehicleFromDocument_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-609f8449"]]);
//#endregion
export { VehicleFromDocument_exports as n, VehicleFromDocument_default as t };
