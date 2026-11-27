import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BA7BbMo6.js";
import { a as link_default, d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as useDirtyForm } from "./useDirtyForm-CUSvyfaU.js";
import { t as AdminSaveBar_default } from "./AdminSaveBar-BD5_vH_r.js";
//#region resources/js/Pages/Admin/Einstellungen/VerkaeuferVersand.vue?vue&type=script&setup=true&lang.ts
var VerkaeuferVersand_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "VerkaeuferVersand",
	__ssrInlineRender: true,
	props: {
		seller: {},
		sellerSource: {},
		legacyRegister: {},
		sellerMissing: {},
		ownInvoices: {
			type: Boolean,
			default: true
		},
		impressumMissing: {},
		shippingLine: {},
		contactEmail: {},
		stamp: {}
	},
	setup(__props) {
		/**
		* Einstellungen › Verkäufer & Versand (VerkaeuferVersandController): the seller as the law names it — the Impressum,
		* the invoice and the order mail read it here — and what delivery costs and takes — the product page, the basket, the
		* checkout and the mail read that. One save for both.
		*
		* „Platzhalter“ marks values that are not the operator's own yet: they stay on this page and in the Impressum's
		* marked preview, every other surface treats them as not given, and the live shop's preflight refuses them. What a
		* real invoice or order still needs is named under each section, in the preflight's words.
		*
		* The Impressum renders from these fields (D-319): an empty one shows its marker, „[FIRMENNAME]“, and keeps the shop
		* out of search and live payments; one that does not apply is declared „Entfällt“ and left out — a declaration, never
		* an invented value.
		*/
		const props = __props;
		const editor = useDirtyForm({ seller: {
			...props.seller,
			not_applicable: { ...props.seller.not_applicable }
		} }, {
			method: "put",
			url: "/admin/einstellungen/verkaeufer-versand",
			stamp: () => props.stamp
		});
		const form = editor.form;
		const GROUPS = [
			{
				title: "Unternehmen",
				fields: [
					{
						key: "name",
						label: "Name des Unternehmens",
						help: "So, wie er in den Unterlagen des Unternehmens steht, etwa im Handelsregister – nie nur der Markenname.",
						autocomplete: "organization"
					},
					{
						key: "legal_form",
						label: "Rechtsform",
						help: "Etwa GmbH, UG (haftungsbeschränkt) oder Einzelunternehmen."
					},
					{
						key: "managing_director",
						label: "Geschäftsführung",
						help: "Bei einer GmbH die Geschäftsführer mit Vor- und Nachnamen, durch Kommas getrennt.",
						notApplicable: {
							field: "managing_director",
							label: "Entfällt – keine Geschäftsführung"
						}
					}
				]
			},
			{
				title: "Anschrift",
				fields: [
					{
						key: "street",
						label: "Straße und Hausnummer",
						autocomplete: "address-line1"
					},
					{
						key: "zip",
						label: "PLZ",
						autocomplete: "postal-code",
						inputmode: "numeric"
					},
					{
						key: "city",
						label: "Ort",
						autocomplete: "address-level2"
					}
				]
			},
			{
				title: "Register und Steuer",
				fields: [
					{
						key: "register_court",
						label: "Registergericht",
						help: "Das Amtsgericht, bei dem das Unternehmen eingetragen ist."
					},
					{
						key: "register_number",
						label: "Registernummer",
						help: "Abteilung und Nummer, etwa HRB und die Ziffern.",
						notApplicable: {
							field: "register",
							label: "Entfällt – kein Registereintrag"
						}
					},
					{
						key: "vat_id",
						label: "USt-IdNr.",
						help: "DE und neun Ziffern. Hat das Unternehmen keine, reicht für die Rechnung die Steuernummer.",
						notApplicable: {
							field: "vat_id",
							label: "Entfällt – keine USt-IdNr."
						}
					},
					{
						key: "tax_number",
						label: "Steuernummer",
						help: "So, wie sie auf dem Bescheid des Finanzamts steht."
					}
				]
			},
			{
				title: "Kontakt",
				fields: [{
					key: "email",
					label: "E-Mail-Adresse",
					inputmode: "email",
					autocomplete: "email"
				}, {
					key: "phone",
					label: "Telefon",
					help: "Die Nummer, unter der Kunden das Unternehmen anrufen können.",
					inputmode: "tel",
					autocomplete: "tel",
					notApplicable: {
						field: "phone",
						label: "Entfällt – keine Telefonnummer für Kunden"
					}
				}]
			}
		];
		const SOURCES = {
			Einstellungen: "diese Einstellungen",
			".env": "die Werte aus der .env-Datei – hier ist noch nichts gespeichert"
		};
		const context = (0, vue_exports.computed)(() => `In Kraft: ${SOURCES[props.sellerSource]}`);
		function error(key) {
			return form.errors[key];
		}
		const emailHelp = (0, vue_exports.computed)(() => props.contactEmail ? `Leer lassen, dann gilt die Kontaktadresse des Shops (${props.contactEmail}).` : "Die Adresse, unter der Kunden das Unternehmen erreichen.");
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Verkäufer",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form class="adm-form" novalidate data-v-91c3cbd2${_scopeId}><section class="adm-form__group" aria-labelledby="vv-seller" data-v-91c3cbd2${_scopeId}><h2 id="vv-seller" class="adm-form__heading" data-v-91c3cbd2${_scopeId}> Verkäufer `);
						if ((0, vue_exports.unref)(form).seller.placeholder) _push(`<span class="adm-tag adm-tag--warn vv-tag" data-v-91c3cbd2${_scopeId}>Platzhalter</span>`);
						else _push(`<!---->`);
						_push(`</h2><p class="adm-form__note" data-v-91c3cbd2${_scopeId}> So steht der Shop im Impressum, ${(0, server_renderer_exports.ssrInterpolate)(__props.ownInvoices !== false ? "auf jeder Rechnung und " : "")}in der Bestellbestätigung. Trag nur ein, was in den Unterlagen des Unternehmens steht. Bleibt eine Angabe des Impressums leer, steht dort ein Platzhalter, etwa „[FIRMENNAME]“. Trifft eine Angabe auf das Unternehmen nicht zu, setz das Häkchen bei „Entfällt“ – dann lässt das Impressum die Zeile weg. </p>`);
						if (__props.ownInvoices !== false && __props.sellerMissing.length) _push(`<p class="adm-note vv-open" role="status" data-v-91c3cbd2${_scopeId}> Für echte Rechnungen fehlt noch: ${(0, server_renderer_exports.ssrInterpolate)(__props.sellerMissing.join(", "))}. Bis dahin ist jede Rechnung eine Testrechnung. </p>`);
						else _push(`<!---->`);
						if (__props.impressumMissing.length) _push(`<p class="adm-note vv-open vv-impressum" role="status" data-v-91c3cbd2${_scopeId}> Im Impressum fehlt noch: ${(0, server_renderer_exports.ssrInterpolate)(__props.impressumMissing.join(", "))}. Bis dahin sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an. </p>`);
						else _push(`<!---->`);
						if (__props.legacyRegister) _push(`<p class="adm-form__note" data-v-91c3cbd2${_scopeId}>Aus der .env-Datei: Registereintrag „${(0, server_renderer_exports.ssrInterpolate)(__props.legacyRegister)}“. Trag Gericht und Nummer hier getrennt ein.</p>`);
						else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(GROUPS, (group) => {
							_push(`<fieldset class="vv-group" data-v-91c3cbd2${_scopeId}><legend class="vv-legend" data-v-91c3cbd2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.title)}</legend><div class="vv-fields" data-v-91c3cbd2${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(group.fields, (field) => {
								_push(`<div class="form-field" data-v-91c3cbd2${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `vv-${field.key}`)} data-v-91c3cbd2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(field.label)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `vv-${field.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).seller[field.key])} class="input" type="text"${(0, server_renderer_exports.ssrRenderAttr)("inputmode", field.inputmode)}${(0, server_renderer_exports.ssrRenderAttr)("autocomplete", field.autocomplete ?? "off")}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `vv-${field.key}-help vv-${field.key}-error`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", error(`seller.${field.key}`) ? "true" : void 0)} data-v-91c3cbd2${_scopeId}><p${(0, server_renderer_exports.ssrRenderAttr)("id", `vv-${field.key}-help`)} class="form-field__help" data-v-91c3cbd2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(field.key === "email" ? emailHelp.value : field.help)}</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `vv-${field.key}-error`)} class="form-field__error" data-v-91c3cbd2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(error(`seller.${field.key}`))}</p>`);
								if (field.notApplicable) _push(`<label class="check vv-na" data-v-91c3cbd2${_scopeId}><input${(0, server_renderer_exports.ssrRenderAttr)("id", `vv-na-${field.notApplicable.field}`)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).seller.not_applicable[field.notApplicable.field]) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).seller.not_applicable[field.notApplicable.field], null) : (0, vue_exports.unref)(form).seller.not_applicable[field.notApplicable.field]) ? " checked" : ""} type="checkbox" data-v-91c3cbd2${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(field.notApplicable.label)}</label>`);
								else _push(`<!---->`);
								_push(`</div>`);
							});
							_push(`<!--]--></div></fieldset>`);
						});
						_push(`<!--]--><label class="check" data-v-91c3cbd2${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).seller.placeholder) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).seller.placeholder, null) : (0, vue_exports.unref)(form).seller.placeholder) ? " checked" : ""} type="checkbox" aria-describedby="vv-seller-placeholder-help" data-v-91c3cbd2${_scopeId}> Platzhalter – das sind noch nicht die echten Angaben </label><p id="vv-seller-placeholder-help" class="form-field__help" data-v-91c3cbd2${_scopeId}> Nur das Impressum zeigt diese Angaben, dort als Platzhalter gekennzeichnet. Rechnung und Bestellmail behandeln sie als nicht angegeben, und der Live-Shop startet so nicht. </p></section><section class="adm-form__group" aria-labelledby="vv-shipping" data-v-91c3cbd2${_scopeId}><h2 id="vv-shipping" class="adm-form__heading" data-v-91c3cbd2${_scopeId}>Versand</h2><p class="adm-form__note" data-v-91c3cbd2${_scopeId}> Was die Lieferung kostet und wie lange sie dauert, legst du jetzt je Versandart unter `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/einstellungen/versand" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Einstellungen › Versand`);
								else return [(0, vue_exports.createTextVNode)("Einstellungen › Versand")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(` fest. `);
						if (__props.shippingLine) _push(`<!--[--> Auf der Produktseite steht: ${(0, server_renderer_exports.ssrInterpolate)(__props.shippingLine)}.<!--]-->`);
						else _push(`<!---->`);
						_push(`</p></section><p class="adm-form__note" data-v-91c3cbd2${_scopeId}> Die Rechnungsnummern eröffnest du einmal unter `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/einstellungen/zahlung" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Einstellungen › Zahlung`);
								else return [(0, vue_exports.createTextVNode)("Einstellungen › Zahlung")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`. </p></form>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)("form", {
						class: "adm-form",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"])
					}, [
						(0, vue_exports.createVNode)("section", {
							class: "adm-form__group",
							"aria-labelledby": "vv-seller"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "vv-seller",
								class: "adm-form__heading"
							}, [(0, vue_exports.createTextVNode)(" Verkäufer "), (0, vue_exports.unref)(form).seller.placeholder ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "adm-tag adm-tag--warn vv-tag"
							}, "Platzhalter")) : (0, vue_exports.createCommentVNode)("", true)]),
							(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, " So steht der Shop im Impressum, " + (0, vue_exports.toDisplayString)(__props.ownInvoices !== false ? "auf jeder Rechnung und " : "") + "in der Bestellbestätigung. Trag nur ein, was in den Unterlagen des Unternehmens steht. Bleibt eine Angabe des Impressums leer, steht dort ein Platzhalter, etwa „[FIRMENNAME]“. Trifft eine Angabe auf das Unternehmen nicht zu, setz das Häkchen bei „Entfällt“ – dann lässt das Impressum die Zeile weg. ", 1),
							__props.ownInvoices !== false && __props.sellerMissing.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note vv-open",
								role: "status"
							}, " Für echte Rechnungen fehlt noch: " + (0, vue_exports.toDisplayString)(__props.sellerMissing.join(", ")) + ". Bis dahin ist jede Rechnung eine Testrechnung. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.impressumMissing.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note vv-open vv-impressum",
								role: "status"
							}, " Im Impressum fehlt noch: " + (0, vue_exports.toDisplayString)(__props.impressumMissing.join(", ")) + ". Bis dahin sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.legacyRegister ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-form__note"
							}, "Aus der .env-Datei: Registereintrag „" + (0, vue_exports.toDisplayString)(__props.legacyRegister) + "“. Trag Gericht und Nummer hier getrennt ein.", 1)) : (0, vue_exports.createCommentVNode)("", true),
							((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(GROUPS, (group) => {
								return (0, vue_exports.createVNode)("fieldset", {
									key: group.title,
									class: "vv-group"
								}, [(0, vue_exports.createVNode)("legend", { class: "vv-legend" }, (0, vue_exports.toDisplayString)(group.title), 1), (0, vue_exports.createVNode)("div", { class: "vv-fields" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.fields, (field) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: field.key,
										class: "form-field"
									}, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `vv-${field.key}`
										}, (0, vue_exports.toDisplayString)(field.label), 9, ["for"]),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: `vv-${field.key}`,
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).seller[field.key] = $event,
											class: "input",
											type: "text",
											inputmode: field.inputmode,
											autocomplete: field.autocomplete ?? "off",
											"aria-describedby": `vv-${field.key}-help vv-${field.key}-error`,
											"aria-invalid": error(`seller.${field.key}`) ? "true" : void 0
										}, null, 8, [
											"id",
											"onUpdate:modelValue",
											"inputmode",
											"autocomplete",
											"aria-describedby",
											"aria-invalid"
										]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).seller[field.key]]]),
										(0, vue_exports.createVNode)("p", {
											id: `vv-${field.key}-help`,
											class: "form-field__help"
										}, (0, vue_exports.toDisplayString)(field.key === "email" ? emailHelp.value : field.help), 9, ["id"]),
										(0, vue_exports.createVNode)("p", {
											id: `vv-${field.key}-error`,
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(error(`seller.${field.key}`)), 9, ["id"]),
										field.notApplicable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
											key: 0,
											class: "check vv-na"
										}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: `vv-na-${field.notApplicable.field}`,
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).seller.not_applicable[field.notApplicable.field] = $event,
											type: "checkbox"
										}, null, 8, ["id", "onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, (0, vue_exports.unref)(form).seller.not_applicable[field.notApplicable.field]]]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(field.notApplicable.label), 1)])) : (0, vue_exports.createCommentVNode)("", true)
									]);
								}), 128))])]);
							}), 64)),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).seller.placeholder = $event,
								type: "checkbox",
								"aria-describedby": "vv-seller-placeholder-help"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, (0, vue_exports.unref)(form).seller.placeholder]]), (0, vue_exports.createTextVNode)(" Platzhalter – das sind noch nicht die echten Angaben ")]),
							(0, vue_exports.createVNode)("p", {
								id: "vv-seller-placeholder-help",
								class: "form-field__help"
							}, " Nur das Impressum zeigt diese Angaben, dort als Platzhalter gekennzeichnet. Rechnung und Bestellmail behandeln sie als nicht angegeben, und der Live-Shop startet so nicht. ")
						]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-form__group",
							"aria-labelledby": "vv-shipping"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "vv-shipping",
							class: "adm-form__heading"
						}, "Versand"), (0, vue_exports.createVNode)("p", { class: "adm-form__note" }, [
							(0, vue_exports.createTextVNode)(" Was die Lieferung kostet und wie lange sie dauert, legst du jetzt je Versandart unter "),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/einstellungen/versand" }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Einstellungen › Versand")]),
								_: 1
							}),
							(0, vue_exports.createTextVNode)(" fest. "),
							__props.shippingLine ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" Auf der Produktseite steht: " + (0, vue_exports.toDisplayString)(__props.shippingLine) + ".", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
						])]),
						(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, [
							(0, vue_exports.createTextVNode)(" Die Rechnungsnummern eröffnest du einmal unter "),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/einstellungen/zahlung" }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Einstellungen › Zahlung")]),
								_: 1
							}),
							(0, vue_exports.createTextVNode)(". ")
						])
					], 40, ["onSubmit"]), (0, vue_exports.createVNode)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, 8, ["editor"])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Einstellungen/VerkaeuferVersand.vue
var _sfc_setup = VerkaeuferVersand_vue_vue_type_script_setup_true_lang_default.setup;
VerkaeuferVersand_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Einstellungen/VerkaeuferVersand.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var VerkaeuferVersand_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VerkaeuferVersand_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-91c3cbd2"]]);
//#endregion
export { VerkaeuferVersand_default as default };
