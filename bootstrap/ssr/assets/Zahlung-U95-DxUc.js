import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-DOqx1LBl.js";
import { c as router, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as AdminSaveBar_default, t as useDirtyForm } from "./useDirtyForm-D_oy2Apt.js";
//#region resources/js/Pages/Admin/Einstellungen/Zahlung.vue?vue&type=script&setup=true&lang.ts
var Zahlung_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Zahlung",
	__ssrInlineRender: true,
	props: {
		form: {},
		publishableMasked: {},
		secretMasked: {},
		webhookMasked: {},
		inForce: {},
		driver: {},
		production: { type: Boolean },
		test: {},
		testedAt: {},
		webhookUrl: {},
		invoiceSeries: {}
	},
	setup(__props) {
		/**
		* Einstellungen › Zahlung: the Stripe keys the shop takes money with (ZahlungController).
		*
		* The keys are write-only, as the bucket's: the page only ever gets their last four characters, masked, and a key
		* stays as stored until „Neuen Schlüssel eintragen“ opens an empty field. The mode says which kind of key the
		* shop takes — Testmodus only test keys, Livemodus only live keys, and a live key only on the live shop (the
		* server refuses the rest in a sentence). „Verbindung testen“ asks Stripe for the account behind the keys: its
		* name, country, currency and payment methods, or Stripe's own error, word for word.
		*
		* „Rechnungsnummern“ opens the real invoice numbers once, at the numbers the client's accounting has reached
		* (InvoiceSeries): until then every invoice is a test invoice. The form shows the first number as the invoice will
		* print it, and asks for the check against the accounting — it cannot be undone. Opened, it names when and by whom.
		*/
		const props = __props;
		const editor = useDirtyForm({
			mode: props.form.mode,
			publishable_key: "",
			secret_key: "",
			webhook_secret: ""
		}, {
			method: "put",
			url: "/admin/einstellungen/zahlung"
		});
		const form = editor.form;
		const open = (0, vue_exports.ref)({
			publishable_key: props.publishableMasked === null,
			secret_key: props.secretMasked === null,
			webhook_secret: props.webhookMasked === null
		});
		function replace(field) {
			open.value[field] = true;
			form[field] = "";
		}
		const KEYS = [
			{
				field: "publishable_key",
				id: "za-publishable",
				label: "Öffentlicher Schlüssel",
				masked: props.publishableMasked,
				help: "Beginnt mit pk_test_ oder pk_live_ – Stripe-Dashboard › Entwickler › API-Schlüssel.",
				secret: false
			},
			{
				field: "secret_key",
				id: "za-secret",
				label: "Geheimer Schlüssel",
				masked: props.secretMasked,
				help: "Beginnt mit sk_test_ oder sk_live_ – am selben Ort. Er verlässt diesen Server nie.",
				secret: true
			},
			{
				field: "webhook_secret",
				id: "za-webhook",
				label: "Webhook-Signaturschlüssel",
				masked: props.webhookMasked,
				help: "Beginnt mit whsec_ – Stripe-Dashboard › Entwickler › Webhooks › der Endpunkt unten › Signaturschlüssel.",
				secret: true
			}
		];
		const SOURCES = {
			Einstellungen: "diese Einstellungen",
			".env": "die Werte aus der .env-Datei – hier ist noch nichts gespeichert",
			keine: "keine Schlüssel"
		};
		const context = (0, vue_exports.computed)(() => `In Kraft: ${SOURCES[props.inForce.source]} · ${props.inForce.mode === "live" ? "Livemodus" : "Testmodus"}`);
		const testing = (0, vue_exports.ref)(false);
		function testConnection() {
			if (testing.value) return;
			testing.value = true;
			router.post("/admin/einstellungen/zahlung/test", {}, {
				preserveScroll: true,
				onFinish: () => testing.value = false
			});
		}
		const COUNTRIES = {
			DE: "Deutschland",
			AT: "Österreich",
			CH: "Schweiz",
			NL: "Niederlande"
		};
		const series = useForm({
			first_invoice: "",
			first_credit_note: "",
			confirmed: false
		});
		const seriesOpen = (0, vue_exports.computed)(() => props.invoiceSeries.invoice !== null && props.invoiceSeries.credit_note !== null);
		/** `RE-001043` — the number as the invoice prints it, or null while the field holds no whole number. */
		function preview(prefix, raw) {
			return /^[1-9]\d{0,8}$/.test(raw.trim()) ? `${prefix}-${raw.trim().padStart(6, "0")}` : null;
		}
		function openSeries() {
			if (series.processing) return;
			series.post("/admin/einstellungen/zahlung/rechnungsnummern", { preserveScroll: true });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Zahlung",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.driver !== "stripe") _push(`<p class="adm-note" role="status" data-v-66132a1d${_scopeId}> Der Shop nimmt noch keine Zahlungen über Stripe an (Zahlungsart in Kraft: ${(0, server_renderer_exports.ssrInterpolate)(__props.driver === "sandbox" ? "Testzahlung der Vorschau" : "keine")}). Die Schlüssel kannst du trotzdem schon eintragen und prüfen. </p>`);
						else _push(`<!---->`);
						_push(`<form class="adm-form" novalidate data-v-66132a1d${_scopeId}><fieldset class="adm-form__group" data-v-66132a1d${_scopeId}><legend class="adm-form__heading" data-v-66132a1d${_scopeId}>Modus</legend><label class="check" data-v-66132a1d${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).mode, "test")) ? " checked" : ""} type="radio" name="za-mode" value="test" data-v-66132a1d${_scopeId}> Testmodus – nur Testschlüssel, es fließt kein Geld </label><label class="check" data-v-66132a1d${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).mode, "live")) ? " checked" : ""} type="radio" name="za-mode" value="live"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.production) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", __props.production ? void 0 : "za-live-help")} data-v-66132a1d${_scopeId}> Livemodus – nur Live-Schlüssel, echte Zahlungen </label>`);
						if (!__props.production) _push(`<p id="za-live-help" class="form-field__help" data-v-66132a1d${_scopeId}>Livemodus gibt es nur im Live-Shop. Live-Schlüssel werden dort eingetragen – nie hier.</p>`);
						else _push(`<!---->`);
						_push(`<p class="form-field__error" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.mode)}</p></fieldset><section class="adm-form__group" aria-labelledby="za-keys" data-v-66132a1d${_scopeId}><h2 id="za-keys" class="adm-form__heading" data-v-66132a1d${_scopeId}>Schlüssel</h2><p class="adm-form__note" data-v-66132a1d${_scopeId}>Die Schlüssel werden verschlüsselt gespeichert und nie wieder angezeigt – nur ihre letzten vier Zeichen.</p><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(KEYS, (key) => {
							_push(`<div class="form-field" data-v-66132a1d${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", key.id)} data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(key.label)}</label>`);
							if (!open.value[key.field]) _push(`<div class="za-masked" data-v-66132a1d${_scopeId}><output${(0, server_renderer_exports.ssrRenderAttr)("id", key.id)} class="za-masked__value"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Gespeicherter ${key.label}, nur die letzten vier Zeichen`)} data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(key.masked)}</output><button class="btn btn--secondary btn--sm" type="button" data-v-66132a1d${_scopeId}>Neuen Schlüssel eintragen</button></div>`);
							else _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", key.id)}${(0, server_renderer_exports.ssrRenderDynamicModel)(key.secret ? "password" : "text", (0, vue_exports.unref)(form)[key.field], null)} class="input za-key"${(0, server_renderer_exports.ssrRenderAttr)("type", key.secret ? "password" : "text")}${(0, server_renderer_exports.ssrRenderAttr)("autocomplete", key.secret ? "new-password" : "off")} spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${key.id}-help ${key.id}-error`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors[key.field] ? "true" : void 0)} data-v-66132a1d${_scopeId}>`);
							_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${key.id}-help`)} class="form-field__help" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(key.help)}`);
							if (open.value[key.field] && key.masked) _push(`<!--[--> Leer lassen behält den gespeicherten.<!--]-->`);
							else _push(`<!---->`);
							_push(`</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${key.id}-error`)} class="form-field__error" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors[key.field])}</p></div>`);
						});
						_push(`<!--]--><div class="form-field" data-v-66132a1d${_scopeId}><span class="form-field__label" data-v-66132a1d${_scopeId}>Webhook-Adresse für Stripe</span><code class="za-url" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.webhookUrl)}</code><p class="form-field__help" data-v-66132a1d${_scopeId}>Im Stripe-Dashboard als Endpunkt eintragen – mit den Ereignissen payment_intent.*, charge.refunded und charge.dispute.*. Bezahlt ist eine Bestellung erst, wenn Stripe es hierher meldet.</p></div></section><section class="adm-form__group" aria-labelledby="za-test" data-v-66132a1d${_scopeId}><h2 id="za-test" class="adm-form__heading" data-v-66132a1d${_scopeId}>Verbindung</h2><p class="adm-form__note" data-v-66132a1d${_scopeId}>Fragt Stripe mit den Schlüsseln in Kraft nach dem Konto dahinter. Es wird nichts gebucht.</p><div data-v-66132a1d${_scopeId}><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", testing.value ? "true" : void 0)} data-v-66132a1d${_scopeId}>Verbindung testen</button></div>`);
						if (__props.test?.ok) _push(`<dl class="za-account" aria-label="Ergebnis der letzten Prüfung" data-v-66132a1d${_scopeId}><div data-v-66132a1d${_scopeId}><dt data-v-66132a1d${_scopeId}>Konto</dt><dd data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.test.name)}</dd></div><div data-v-66132a1d${_scopeId}><dt data-v-66132a1d${_scopeId}>Land</dt><dd data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(COUNTRIES[__props.test.country ?? ""] ?? __props.test.country)}</dd></div><div data-v-66132a1d${_scopeId}><dt data-v-66132a1d${_scopeId}>Währung</dt><dd data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.test.currency)}</dd></div><div data-v-66132a1d${_scopeId}><dt data-v-66132a1d${_scopeId}>Zahlungsarten</dt><dd data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.test.methods.length ? __props.test.methods.join(", ") : "keine aktiv")}</dd></div><div data-v-66132a1d${_scopeId}><dt data-v-66132a1d${_scopeId}>Schlüssel</dt><dd data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.test.live ? "Live" : "Test")}</dd></div></dl>`);
						else if (__props.test) _push(`<div class="za-error" role="alert" data-v-66132a1d${_scopeId}><p class="za-error__lead" data-v-66132a1d${_scopeId}>Stripe hat abgelehnt:</p><code class="za-error__raw" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.test.error)}</code></div>`);
						else _push(`<!---->`);
						_push(`</section></form>`);
						if (seriesOpen.value && __props.invoiceSeries.invoice && __props.invoiceSeries.credit_note) _push(`<section class="adm-form za-series" aria-labelledby="za-series" data-v-66132a1d${_scopeId}><h2 id="za-series" class="adm-form__heading" data-v-66132a1d${_scopeId}>Rechnungsnummern</h2><p class="adm-form__note" data-v-66132a1d${_scopeId}> Eröffnet am ${(0, server_renderer_exports.ssrInterpolate)(__props.invoiceSeries.invoice.openedAt)} von ${(0, server_renderer_exports.ssrInterpolate)(__props.invoiceSeries.invoice.openedBy)}. Der Shop zählt lückenlos weiter. Das lässt sich nicht rückgängig machen. </p><dl class="za-account" data-v-66132a1d${_scopeId}><div data-v-66132a1d${_scopeId}><dt data-v-66132a1d${_scopeId}>Rechnungen</dt><dd data-v-66132a1d${_scopeId}>ab <span class="num" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.invoiceSeries.invoice.first)}</span>, nächste <span class="num" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.invoiceSeries.invoice.next)}</span></dd></div><div data-v-66132a1d${_scopeId}><dt data-v-66132a1d${_scopeId}>Gutschriften</dt><dd data-v-66132a1d${_scopeId}>ab <span class="num" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.invoiceSeries.credit_note.first)}</span>, nächste <span class="num" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.invoiceSeries.credit_note.next)}</span></dd></div></dl></section>`);
						else {
							_push(`<form class="adm-form za-series" novalidate aria-labelledby="za-series" data-v-66132a1d${_scopeId}><h2 id="za-series" class="adm-form__heading" data-v-66132a1d${_scopeId}>Rechnungsnummern</h2><p class="adm-form__note" data-v-66132a1d${_scopeId}> Die Rechnungsnummern sind noch nicht eröffnet. Bis dahin bekommt jede Bestellung eine Testrechnung. Trag die nächsten freien Nummern aus der Buchhaltung ein. Ab da zählt der Shop lückenlos weiter. Eröffnen kannst du sie nur einmal. </p><div class="form-field" data-v-66132a1d${_scopeId}><label class="form-field__label" for="za-first-invoice" data-v-66132a1d${_scopeId}>Erste Rechnungsnummer</label><input id="za-first-invoice"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(series).first_invoice)} class="input za-number" type="text" inputmode="numeric" autocomplete="off" aria-describedby="za-first-invoice-help za-first-invoice-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(series).errors.first_invoice ? "true" : void 0)} data-v-66132a1d${_scopeId}><p id="za-first-invoice-help" class="form-field__help" data-v-66132a1d${_scopeId}>`);
							if (preview("RE", (0, vue_exports.unref)(series).first_invoice)) _push(`<!--[-->Die erste echte Rechnung trägt die Nummer <span class="num" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(preview("RE", (0, vue_exports.unref)(series).first_invoice))}</span>.<!--]-->`);
							else _push(`<!--[-->Die nächste freie Nummer aus der Buchhaltung – nur die Zahl, ohne „RE-“.<!--]-->`);
							_push(`</p><p id="za-first-invoice-error" class="form-field__error" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(series).errors.first_invoice)}</p></div><div class="form-field" data-v-66132a1d${_scopeId}><label class="form-field__label" for="za-first-credit" data-v-66132a1d${_scopeId}>Erste Gutschriftnummer</label><input id="za-first-credit"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(series).first_credit_note)} class="input za-number" type="text" inputmode="numeric" autocomplete="off" aria-describedby="za-first-credit-help za-first-credit-error"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(series).errors.first_credit_note ? "true" : void 0)} data-v-66132a1d${_scopeId}><p id="za-first-credit-help" class="form-field__help" data-v-66132a1d${_scopeId}>`);
							if (preview("GS", (0, vue_exports.unref)(series).first_credit_note)) _push(`<!--[-->Die erste echte Gutschrift trägt die Nummer <span class="num" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(preview("GS", (0, vue_exports.unref)(series).first_credit_note))}</span>.<!--]-->`);
							else _push(`<!--[-->1, wenn es noch keine Gutschrift gab.<!--]-->`);
							_push(`</p><p id="za-first-credit-error" class="form-field__error" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(series).errors.first_credit_note)}</p></div><label class="check" data-v-66132a1d${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(series).confirmed) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(series).confirmed, null) : (0, vue_exports.unref)(series).confirmed) ? " checked" : ""} type="checkbox" aria-describedby="za-confirmed-error" data-v-66132a1d${_scopeId}> Ich habe beide Nummern mit der Buchhaltung abgeglichen. </label><p id="za-confirmed-error" class="form-field__error" data-v-66132a1d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(series).errors.confirmed)}</p><div data-v-66132a1d${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(series).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(series).processing ? "true" : void 0)} data-v-66132a1d${_scopeId}>Rechnungsnummern eröffnen</button></div></form>`);
						}
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
					} else return [
						__props.driver !== "stripe" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note",
							role: "status"
						}, " Der Shop nimmt noch keine Zahlungen über Stripe an (Zahlungsart in Kraft: " + (0, vue_exports.toDisplayString)(__props.driver === "sandbox" ? "Testzahlung der Vorschau" : "keine") + "). Die Schlüssel kannst du trotzdem schon eintragen und prüfen. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "adm-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("fieldset", { class: "adm-form__group" }, [
								(0, vue_exports.createVNode)("legend", { class: "adm-form__heading" }, "Modus"),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).mode = $event,
									type: "radio",
									name: "za-mode",
									value: "test"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).mode]]), (0, vue_exports.createTextVNode)(" Testmodus – nur Testschlüssel, es fließt kein Geld ")]),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).mode = $event,
									type: "radio",
									name: "za-mode",
									value: "live",
									disabled: !__props.production,
									"aria-describedby": __props.production ? void 0 : "za-live-help"
								}, null, 8, [
									"onUpdate:modelValue",
									"disabled",
									"aria-describedby"
								]), [[vue_exports.vModelRadio, (0, vue_exports.unref)(form).mode]]), (0, vue_exports.createTextVNode)(" Livemodus – nur Live-Schlüssel, echte Zahlungen ")]),
								!__props.production ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									id: "za-live-help",
									class: "form-field__help"
								}, "Livemodus gibt es nur im Live-Shop. Live-Schlüssel werden dort eingetragen – nie hier.")) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.mode), 1)
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "za-keys"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "za-keys",
									class: "adm-form__heading"
								}, "Schlüssel"),
								(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Die Schlüssel werden verschlüsselt gespeichert und nie wieder angezeigt – nur ihre letzten vier Zeichen."),
								((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(KEYS, (key) => {
									return (0, vue_exports.createVNode)("div", {
										key: key.field,
										class: "form-field"
									}, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: key.id
										}, (0, vue_exports.toDisplayString)(key.label), 9, ["for"]),
										!open.value[key.field] ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											key: 0,
											class: "za-masked"
										}, [(0, vue_exports.createVNode)("output", {
											id: key.id,
											class: "za-masked__value",
											"aria-label": `Gespeicherter ${key.label}, nur die letzten vier Zeichen`
										}, (0, vue_exports.toDisplayString)(key.masked), 9, ["id", "aria-label"]), (0, vue_exports.createVNode)("button", {
											class: "btn btn--secondary btn--sm",
											type: "button",
											onClick: ($event) => replace(key.field)
										}, "Neuen Schlüssel eintragen", 8, ["onClick"])])) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("input", {
											key: 1,
											id: key.id,
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form)[key.field] = $event,
											class: "input za-key",
											type: key.secret ? "password" : "text",
											autocomplete: key.secret ? "new-password" : "off",
											spellcheck: "false",
											"aria-describedby": `${key.id}-help ${key.id}-error`,
											"aria-invalid": (0, vue_exports.unref)(form).errors[key.field] ? "true" : void 0
										}, null, 8, [
											"id",
											"onUpdate:modelValue",
											"type",
											"autocomplete",
											"aria-describedby",
											"aria-invalid"
										])), [[vue_exports.vModelDynamic, (0, vue_exports.unref)(form)[key.field]]]),
										(0, vue_exports.createVNode)("p", {
											id: `${key.id}-help`,
											class: "form-field__help"
										}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(key.help), 1), open.value[key.field] && key.masked ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" Leer lassen behält den gespeicherten.")], 64)) : (0, vue_exports.createCommentVNode)("", true)], 8, ["id"]),
										(0, vue_exports.createVNode)("p", {
											id: `${key.id}-error`,
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors[key.field]), 9, ["id"])
									]);
								}), 64)),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("span", { class: "form-field__label" }, "Webhook-Adresse für Stripe"),
									(0, vue_exports.createVNode)("code", { class: "za-url" }, (0, vue_exports.toDisplayString)(__props.webhookUrl), 1),
									(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Im Stripe-Dashboard als Endpunkt eintragen – mit den Ereignissen payment_intent.*, charge.refunded und charge.dispute.*. Bezahlt ist eine Bestellung erst, wenn Stripe es hierher meldet.")
								])
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-form__group",
								"aria-labelledby": "za-test"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "za-test",
									class: "adm-form__heading"
								}, "Verbindung"),
								(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Fragt Stripe mit den Schlüsseln in Kraft nach dem Konto dahinter. Es wird nichts gebucht."),
								(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									"aria-busy": testing.value ? "true" : void 0,
									onClick: testConnection
								}, "Verbindung testen", 8, ["aria-busy"])]),
								__props.test?.ok ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("dl", {
									key: 0,
									class: "za-account",
									"aria-label": "Ergebnis der letzten Prüfung"
								}, [
									(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Konto"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.test.name), 1)]),
									(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Land"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(COUNTRIES[__props.test.country ?? ""] ?? __props.test.country), 1)]),
									(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Währung"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.test.currency), 1)]),
									(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Zahlungsarten"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.test.methods.length ? __props.test.methods.join(", ") : "keine aktiv"), 1)]),
									(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Schlüssel"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.test.live ? "Live" : "Test"), 1)])
								])) : __props.test ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "za-error",
									role: "alert"
								}, [(0, vue_exports.createVNode)("p", { class: "za-error__lead" }, "Stripe hat abgelehnt:"), (0, vue_exports.createVNode)("code", { class: "za-error__raw" }, (0, vue_exports.toDisplayString)(__props.test.error), 1)])) : (0, vue_exports.createCommentVNode)("", true)
							])
						], 40, ["onSubmit"]),
						seriesOpen.value && __props.invoiceSeries.invoice && __props.invoiceSeries.credit_note ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "adm-form za-series",
							"aria-labelledby": "za-series"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "za-series",
								class: "adm-form__heading"
							}, "Rechnungsnummern"),
							(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, " Eröffnet am " + (0, vue_exports.toDisplayString)(__props.invoiceSeries.invoice.openedAt) + " von " + (0, vue_exports.toDisplayString)(__props.invoiceSeries.invoice.openedBy) + ". Der Shop zählt lückenlos weiter. Das lässt sich nicht rückgängig machen. ", 1),
							(0, vue_exports.createVNode)("dl", { class: "za-account" }, [(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Rechnungen"), (0, vue_exports.createVNode)("dd", null, [
								(0, vue_exports.createTextVNode)("ab "),
								(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(__props.invoiceSeries.invoice.first), 1),
								(0, vue_exports.createTextVNode)(", nächste "),
								(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(__props.invoiceSeries.invoice.next), 1)
							])]), (0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Gutschriften"), (0, vue_exports.createVNode)("dd", null, [
								(0, vue_exports.createTextVNode)("ab "),
								(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(__props.invoiceSeries.credit_note.first), 1),
								(0, vue_exports.createTextVNode)(", nächste "),
								(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(__props.invoiceSeries.credit_note.next), 1)
							])])])
						])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
							key: 2,
							class: "adm-form za-series",
							novalidate: "",
							"aria-labelledby": "za-series",
							onSubmit: (0, vue_exports.withModifiers)(openSeries, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "za-series",
								class: "adm-form__heading"
							}, "Rechnungsnummern"),
							(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, " Die Rechnungsnummern sind noch nicht eröffnet. Bis dahin bekommt jede Bestellung eine Testrechnung. Trag die nächsten freien Nummern aus der Buchhaltung ein. Ab da zählt der Shop lückenlos weiter. Eröffnen kannst du sie nur einmal. "),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "za-first-invoice"
								}, "Erste Rechnungsnummer"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "za-first-invoice",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(series).first_invoice = $event,
									class: "input za-number",
									type: "text",
									inputmode: "numeric",
									autocomplete: "off",
									"aria-describedby": "za-first-invoice-help za-first-invoice-error",
									"aria-invalid": (0, vue_exports.unref)(series).errors.first_invoice ? "true" : void 0
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(series).first_invoice]]),
								(0, vue_exports.createVNode)("p", {
									id: "za-first-invoice-help",
									class: "form-field__help"
								}, [preview("RE", (0, vue_exports.unref)(series).first_invoice) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
									(0, vue_exports.createTextVNode)("Die erste echte Rechnung trägt die Nummer "),
									(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(preview("RE", (0, vue_exports.unref)(series).first_invoice)), 1),
									(0, vue_exports.createTextVNode)(".")
								], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Die nächste freie Nummer aus der Buchhaltung – nur die Zahl, ohne „RE-“.")], 64))]),
								(0, vue_exports.createVNode)("p", {
									id: "za-first-invoice-error",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(series).errors.first_invoice), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "za-first-credit"
								}, "Erste Gutschriftnummer"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "za-first-credit",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(series).first_credit_note = $event,
									class: "input za-number",
									type: "text",
									inputmode: "numeric",
									autocomplete: "off",
									"aria-describedby": "za-first-credit-help za-first-credit-error",
									"aria-invalid": (0, vue_exports.unref)(series).errors.first_credit_note ? "true" : void 0
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(series).first_credit_note]]),
								(0, vue_exports.createVNode)("p", {
									id: "za-first-credit-help",
									class: "form-field__help"
								}, [preview("GS", (0, vue_exports.unref)(series).first_credit_note) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
									(0, vue_exports.createTextVNode)("Die erste echte Gutschrift trägt die Nummer "),
									(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(preview("GS", (0, vue_exports.unref)(series).first_credit_note)), 1),
									(0, vue_exports.createTextVNode)(".")
								], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("1, wenn es noch keine Gutschrift gab.")], 64))]),
								(0, vue_exports.createVNode)("p", {
									id: "za-first-credit-error",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(series).errors.first_credit_note), 1)
							]),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(series).confirmed = $event,
								type: "checkbox",
								"aria-describedby": "za-confirmed-error"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, (0, vue_exports.unref)(series).confirmed]]), (0, vue_exports.createTextVNode)(" Ich habe beide Nummern mit der Buchhaltung abgeglichen. ")]),
							(0, vue_exports.createVNode)("p", {
								id: "za-confirmed-error",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(series).errors.confirmed), 1),
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit",
								disabled: (0, vue_exports.unref)(series).processing,
								"aria-busy": (0, vue_exports.unref)(series).processing ? "true" : void 0
							}, "Rechnungsnummern eröffnen", 8, ["disabled", "aria-busy"])])
						], 32)),
						(0, vue_exports.createVNode)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, 8, ["editor"])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Einstellungen/Zahlung.vue
var _sfc_setup = Zahlung_vue_vue_type_script_setup_true_lang_default.setup;
Zahlung_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Einstellungen/Zahlung.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Zahlung_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Zahlung_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-66132a1d"]]);
//#endregion
export { Zahlung_default as default };
