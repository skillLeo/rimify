import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-CY71KcPZ.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
//#region resources/js/Pages/Kasse/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		lines: {},
		totals: {},
		contact: {},
		orderRefusal: {}
	},
	setup(__props) {
		/**
		* Checkout. Guest only — there are no customer accounts in this product.
		*
		* Three steps — Adresse, Optionen & Versand, Zahlung — and only the current one is on screen. The
		* stepper says which, and it never marks a step current while another step's fields are showing.
		* Every value typed survives going back and forth: the fields live in one object, not in the step.
		*
		* „Brauchst du RDKS-Sensoren?" opens the second step, and only when the basket holds a
		* Komplettrad (docs/specs/komplettrad.md §5, D-034). The answer is a server round trip: the
		* server stores it with the price it quoted and re-renders the totals with the sensor line. This
		* page prints the strings it is given — `4 × 49,00 €`, `196,00 €` — and never multiplies cents.
		* Where the make has no price, the `Ja` tile does not exist and the card says why; `Nein` and the
		* order stay open. Without an answer, `Weiter` is refused here and the order is refused on the
		* server, with the same sentence.
		*
		* `Zahlungspflichtig bestellen` is the exact wording of the final button, and it is not a style
		* choice: §312j BGB requires the button to state that the order carries an obligation to pay.
		*
		* The summary sits beside the form from 1200px, sticky, only as wide as it needs. On a phone it
		* comes first, folded to one line with the total, so the figure is known before the typing starts.
		*
		* Nothing binding happens yet (ACCURACY.md D4): every step can be walked, and `orderRefusal` is
		* the sentence the server answers a submission with — a demo line, an unconfigured shipping
		* price, or no payment yet. It is shown above the final button, which stays disabled while it
		* stands. No carrier, no delivery time, no payment provider is named: none is confirmed (D7).
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const STEPS = [
			{
				n: 1,
				label: "Adresse"
			},
			{
				n: 2,
				label: "Optionen & Versand"
			},
			{
				n: 3,
				label: "Zahlung"
			}
		];
		/** The RDKS block of the totals; null in fixtures written before it existed. */
		const tpms = (0, vue_exports.computed)(() => props.totals.tpms ?? null);
		/** The question is asked only of a basket with a Komplettrad (D-034). */
		const tpmsApplicable = (0, vue_exports.computed)(() => tpms.value?.applicable === true);
		/** The server's own sentence for an unanswered question — the same one it refuses the order with. */
		const step = (0, vue_exports.ref)(1);
		const summaryOpen = (0, vue_exports.ref)(false);
		(0, vue_exports.ref)(null);
		const form = (0, vue_exports.reactive)({
			email: "",
			phone: "",
			name: "",
			street: "",
			houseNumber: "",
			zip: "",
			city: "",
			billingSame: true,
			billingName: "",
			billingStreet: "",
			billingHouseNumber: "",
			billingZip: "",
			billingCity: "",
			shipping: "standard"
		});
		const errors = (0, vue_exports.reactive)({});
		/** The server's answer to a submission: why the order was not placed. */
		const serverRefusal = (0, vue_exports.ref)(null);
		/** A line that is sold out, not sellable for the chosen car, or marked by the server stops the checkout here too. */
		const blocked = (0, vue_exports.computed)(() => props.lines.some((line) => !line.inStock || line.verdict !== null && line.verdict !== void 0 && !line.verdict.sellable || (line.blockReasons?.length ?? 0) > 0));
		/** No shipping price has been given yet: it is named, left out of the total, and not guessed. */
		const shippingOpen = (0, vue_exports.computed)(() => props.totals.shippingConfigured !== true);
		const shippingLabel = (0, vue_exports.computed)(() => {
			if (shippingOpen.value) return "wird noch festgelegt";
			return props.totals.freeShipping ? "Kostenlos" : props.totals.shipping;
		});
		/** Abnahme and Eintragung are paid to the Prüfstelle, not to us: the page says so when it applies. */
		const needsEntry = (0, vue_exports.computed)(() => props.lines.some((line) => line.verdict?.requiresEntry === true));
		/** The Eintragung line, unless an Auflage on the line already says it in full. */
		function showsEntry(line) {
			return line.verdict?.requiresEntry === true && !line.verdict.conditions.some((c) => c.includes("Eintragung"));
		}
		const VERDICT_TONE = {
			PERMITTED: "tag--ok",
			CONDITIONAL: "tag--warn",
			NOT_PERMITTED: "tag--danger",
			UNKNOWN: "tag--unknown"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kasse" }, null, _parent));
			_push(`<section class="section-dense" data-v-690087c1><div class="wrap" data-v-690087c1><h1 class="t-h1" data-v-690087c1>Kasse</h1>`);
			if (__props.lines.length === 0) {
				_push(`<div class="state" data-v-690087c1>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "cart",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-690087c1>Dein Warenkorb ist noch leer.</p><p class="t-body" data-v-690087c1>Lege zuerst eine Felge in den Warenkorb – dann geht es hier weiter.</p>`);
				if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Felgen für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)} ansehen `);
						else return [(0, vue_exports.createTextVNode)(" Felgen für " + (0, vue_exports.toDisplayString)(vehicle.value.short) + " ansehen ", 1)];
					}),
					_: 1
				}, _parent));
				else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug wählen`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else if (blocked.value) {
				_push(`<div class="state" data-v-690087c1>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-690087c1>Eine Position im Warenkorb kann so nicht bestellt werden.</p><p class="t-body" data-v-690087c1> Sie ist nicht lieferbar oder für dein Fahrzeug nicht freigegeben. Im Warenkorb siehst du, welche es ist. </p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/warenkorb",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zum Warenkorb`);
						else return [(0, vue_exports.createTextVNode)("Zum Warenkorb")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else {
				_push(`<!--[--><ol class="steps ko__steps" aria-label="Fortschritt" data-v-690087c1><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(STEPS, (item) => {
					_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{
						"steps__item--done": item.n < step.value,
						"steps__item--on": item.n === step.value
					}, "steps__item"])}"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", item.n === step.value ? "step" : void 0)} data-v-690087c1><span class="steps__num" data-v-690087c1>`);
					if (item.n < step.value) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(item.n)}<!--]-->`);
					_push(`</span> ${(0, server_renderer_exports.ssrInterpolate)(item.label)}</li>`);
				});
				_push(`<!--]--></ol><div class="ko" data-v-690087c1><aside class="card ko__sum" aria-labelledby="ko-sum-title" data-v-690087c1><button class="ko__sum-toggle" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", summaryOpen.value)} aria-controls="ko-sum-body" data-v-690087c1><span data-v-690087c1>Bestellung ansehen</span><span class="ko__sum-total tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</span><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "ko__chev--open": summaryOpen.value }, "ko__chev"])}" data-v-690087c1>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "chevron-down",
					size: 20
				}, null, _parent));
				_push(`</span></button><div id="ko-sum-body" class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-open": summaryOpen.value }, "ko__sum-body"])}" data-v-690087c1><h2 id="ko-sum-title" class="t-h3 ko__sum-title" data-v-690087c1>Deine Bestellung</h2><ul class="ko__lines" data-v-690087c1><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
					_push(`<li class="ko__line" data-v-690087c1><div class="ko__line-top" data-v-690087c1><span class="ko__line-name" data-v-690087c1><span class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} ×</span> ${(0, server_renderer_exports.ssrInterpolate)(line.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(line.title)}</span><span class="ko__line-price tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</span></div><p class="ko__line-sub" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(line.subtitle)}`);
					if (line.sizeLabel) _push(`<!--[--> · <span class="data" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(line.sizeLabel)}</span><!--]-->`);
					else _push(`<!---->`);
					_push(`</p>`);
					if (line.verdict || line.demo !== false) {
						_push(`<p class="ko__line-flag" data-v-690087c1>`);
						if (line.demo !== false) _push(`<span class="tag tag--unknown" data-v-690087c1>Beispielsortiment</span>`);
						else _push(`<!---->`);
						if (line.verdict) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_TONE[line.verdict.status] ?? "tag--unknown", "tag"])}" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.label)}</span>`);
						else _push(`<!---->`);
						_push(`</p>`);
					} else _push(`<!---->`);
					if (showsEntry(line)) _push(`<p class="ko__line-entry" data-v-690087c1> Eintragung in die Fahrzeugpapiere erforderlich. </p>`);
					else _push(`<!---->`);
					if (line.verdict && line.verdict.conditions.length) {
						_push(`<ul class="ko__conditions" data-v-690087c1><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.verdict.conditions, (condition) => {
							_push(`<li data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
						});
						_push(`<!--]--></ul>`);
					} else _push(`<!---->`);
					if (line.isSet && line.components && line.components.length > 1) {
						_push(`<dl class="ko__parts" aria-label="Bestandteile des Komplettrads" data-v-690087c1><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.components, (part) => {
							_push(`<div class="ko__part" data-v-690087c1><dt data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(part.label)}</dt><dd class="${(0, server_renderer_exports.ssrRenderClass)({ "ko__part--open": part.open })}" data-v-690087c1><span class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(part.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(part.unitPrice)}</span></dd></div>`);
						});
						_push(`<!--]--></dl>`);
					} else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]-->`);
				if (tpms.value && tpms.value.choice === "ja") _push(`<li class="ko__line ko__line--tpms" data-v-690087c1><div class="ko__line-top" data-v-690087c1><span class="ko__line-name" data-v-690087c1>RDKS-Sensoren (${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)})</span><span class="ko__line-price tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.total)}</span></div></li>`);
				else _push(`<!---->`);
				_push(`</ul><dl class="sum" data-v-690087c1><div class="sum__row" data-v-690087c1><dt data-v-690087c1>Zwischensumme</dt><dd class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.subtotal)}</dd></div><div class="sum__row" data-v-690087c1><dt data-v-690087c1>Versand</dt><dd class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(shippingLabel.value)}</dd></div><div class="sum__row sum__row--total" data-v-690087c1><dt data-v-690087c1>Gesamt</dt><dd class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</dd></div></dl>`);
				if (shippingOpen.value) _push(`<p class="price-legal" data-v-690087c1> inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt. · Versandkosten werden noch festgelegt </p>`);
				else _push(`<p class="price-legal" data-v-690087c1>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt. und Versand</p>`);
				_push(`</div></aside><form class="ko__form" novalidate data-v-690087c1>`);
				if (step.value === 1) {
					_push(`<!--[--><h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title data-v-690087c1>Adresse</h2><fieldset class="ko__group" data-v-690087c1><legend class="t-h3" data-v-690087c1>Kontakt</legend><div class="ko__grid" data-v-690087c1><div class="ko__half" data-v-690087c1><label class="field-label" for="ko-mail" data-v-690087c1> E-Mail <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", form.email)} data-key="email" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.email }, "field"])}" type="email" inputmode="email" autocomplete="email" aria-describedby="ko-mail-help ko-mail-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.email ? "true" : void 0)} data-v-690087c1><p id="ko-mail-help" class="field-help" data-v-690087c1> Hierhin schicken wir dir Infos zu deiner Bestellung. </p><span id="ko-mail-err" class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.email ?? "")}</span></div><div class="ko__half" data-v-690087c1><label class="field-label" for="ko-tel" data-v-690087c1>Telefon</label><input id="ko-tel"${(0, server_renderer_exports.ssrRenderAttr)("value", form.phone)} class="field" type="tel" inputmode="tel" autocomplete="tel" data-v-690087c1></div></div></fieldset><fieldset class="ko__group" data-v-690087c1><legend class="t-h3" data-v-690087c1>Lieferadresse</legend><div class="ko__grid" data-v-690087c1><div class="ko__wide" data-v-690087c1><label class="field-label" for="ko-name" data-v-690087c1> Vollständiger Name <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.name)} data-key="name" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.name }, "field"])}" autocomplete="name" aria-describedby="ko-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.name ? "true" : void 0)} data-v-690087c1><span id="ko-name-err" class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.name ?? "")}</span></div><div class="ko__street" data-v-690087c1><label class="field-label" for="ko-street" data-v-690087c1> Straße <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-street"${(0, server_renderer_exports.ssrRenderAttr)("value", form.street)} data-key="street" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.street }, "field"])}" autocomplete="address-line1" aria-describedby="ko-street-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.street ? "true" : void 0)} data-v-690087c1><span id="ko-street-err" class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.street ?? "")}</span></div><div class="ko__nr" data-v-690087c1><label class="field-label" for="ko-nr" data-v-690087c1> Hausnummer <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-nr"${(0, server_renderer_exports.ssrRenderAttr)("value", form.houseNumber)} data-key="houseNumber" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.houseNumber }, "field"])}" autocomplete="address-line2" aria-describedby="ko-nr-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.houseNumber ? "true" : void 0)} data-v-690087c1><span id="ko-nr-err" class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.houseNumber ?? "")}</span></div><div class="ko__zip" data-v-690087c1><label class="field-label" for="ko-zip" data-v-690087c1> PLZ <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-zip"${(0, server_renderer_exports.ssrRenderAttr)("value", form.zip)} data-key="zip" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.zip }, "field tabular"])}" inputmode="numeric" maxlength="5" autocomplete="postal-code" aria-describedby="ko-zip-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.zip ? "true" : void 0)} data-v-690087c1><span id="ko-zip-err" class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.zip ?? "")}</span></div><div class="ko__city" data-v-690087c1><label class="field-label" for="ko-city" data-v-690087c1> Ort <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-city"${(0, server_renderer_exports.ssrRenderAttr)("value", form.city)} data-key="city" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.city }, "field"])}" autocomplete="address-level2" aria-describedby="ko-city-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.city ? "true" : void 0)} data-v-690087c1><span id="ko-city-err" class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.city ?? "")}</span></div><div class="ko__wide" data-v-690087c1><span class="field-label" data-v-690087c1>Land</span><p class="ko__static" data-v-690087c1>Deutschland</p></div></div></fieldset><fieldset class="ko__group" data-v-690087c1><legend class="t-h3" data-v-690087c1>Rechnungsadresse</legend><label class="ko__check" data-v-690087c1><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.billingSame) ? (0, server_renderer_exports.ssrLooseContain)(form.billingSame, null) : form.billingSame) ? " checked" : ""} type="checkbox" data-v-690087c1><span data-v-690087c1>Rechnungsadresse entspricht der Lieferadresse</span></label>`);
					if (!form.billingSame) _push(`<div class="ko__grid ko__billing" data-v-690087c1><div class="ko__wide" data-v-690087c1><label class="field-label" for="ko-b-name" data-v-690087c1> Vollständiger Name <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-b-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingName)} data-key="billingName" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingName }, "field"])}" autocomplete="billing name"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingName ? "true" : void 0)} data-v-690087c1><span class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.billingName ?? "")}</span></div><div class="ko__street" data-v-690087c1><label class="field-label" for="ko-b-street" data-v-690087c1> Straße <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-b-street"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingStreet)} data-key="billingStreet" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingStreet }, "field"])}" autocomplete="billing address-line1"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingStreet ? "true" : void 0)} data-v-690087c1><span class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.billingStreet ?? "")}</span></div><div class="ko__nr" data-v-690087c1><label class="field-label" for="ko-b-nr" data-v-690087c1> Hausnummer <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-b-nr"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingHouseNumber)} data-key="billingHouseNumber" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingHouseNumber }, "field"])}" autocomplete="billing address-line2"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingHouseNumber ? "true" : void 0)} data-v-690087c1><span class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.billingHouseNumber ?? "")}</span></div><div class="ko__zip" data-v-690087c1><label class="field-label" for="ko-b-zip" data-v-690087c1> PLZ <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-b-zip"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingZip)} data-key="billingZip" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingZip }, "field tabular"])}" inputmode="numeric" maxlength="5" autocomplete="billing postal-code"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingZip ? "true" : void 0)} data-v-690087c1><span class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.billingZip ?? "")}</span></div><div class="ko__city" data-v-690087c1><label class="field-label" for="ko-b-city" data-v-690087c1> Ort <span class="field-label__req" data-v-690087c1>*</span></label><input id="ko-b-city"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingCity)} data-key="billingCity" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingCity }, "field"])}" autocomplete="billing address-level2"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingCity ? "true" : void 0)} data-v-690087c1><span class="field-error" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.billingCity ?? "")}</span></div></div>`);
					else _push(`<!---->`);
					_push(`</fieldset><div class="ko__actions" data-v-690087c1><button class="btn btn--primary btn--lg" type="submit" data-v-690087c1>Weiter zu Optionen &amp; Versand</button></div><!--]-->`);
				} else {
					_push(`<!--[--><dl class="ko__recap" data-v-690087c1><div class="ko__recap-row" data-v-690087c1><dt class="micro" data-v-690087c1>Lieferadresse</dt><dd data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(form.name)}, ${(0, server_renderer_exports.ssrInterpolate)(form.street)} ${(0, server_renderer_exports.ssrInterpolate)(form.houseNumber)}, <span class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(form.zip)}</span> ${(0, server_renderer_exports.ssrInterpolate)(form.city)} <span class="ko__recap-mail" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(form.email)}</span></dd><button class="btn btn--quiet ko__change" type="button" data-v-690087c1> Ändern<span class="visually-hidden" data-v-690087c1> (Adresse)</span></button></div>`);
					if (step.value === 3) {
						_push(`<div class="ko__recap-row" data-v-690087c1><dt class="micro" data-v-690087c1>Optionen &amp; Versand</dt><dd data-v-690087c1> Standardversand · <span class="${(0, server_renderer_exports.ssrRenderClass)({ tabular: !shippingOpen.value })}" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(shippingLabel.value)}</span>`);
						if (tpmsApplicable.value && tpms.value) {
							_push(`<span class="ko__recap-line" data-v-690087c1>`);
							if (tpms.value.choice === "ja") _push(`<!--[--> RDKS-Sensoren · <span class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)}</span><!--]-->`);
							else _push(`<!--[-->Ohne RDKS-Sensoren<!--]-->`);
							_push(`</span>`);
						} else _push(`<!---->`);
						_push(`</dd><button class="btn btn--quiet ko__change" type="button" data-v-690087c1> Ändern<span class="visually-hidden" data-v-690087c1> (Optionen &amp; Versand)</span></button></div>`);
					} else _push(`<!---->`);
					_push(`</dl>`);
					if (step.value === 2) {
						_push(`<!--[--><h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title data-v-690087c1>Optionen &amp; Versand</h2>`);
						if (tpmsApplicable.value && tpms.value) {
							_push(`<fieldset class="ko__group ko__rdks" data-v-690087c1><legend class="t-h3" data-v-690087c1>Reifendruck-Sensoren (RDKS)</legend><p id="ko-rdks-q" class="ko__rdks-q" data-v-690087c1>Brauchst du RDKS-Sensoren?</p><p class="t-small ko__rdks-help" data-v-690087c1> Viele Autos zeigen den Reifendruck im Display an. Dafür sitzt in jedem Rad ein Sensor. Ob dein Auto das hat, steht in der Betriebsanleitung – oder du siehst es daran, ob dein Display dir den Reifendruck anzeigt. </p>`);
							if (!tpms.value.available) _push(`<p class="ko__rdks-notice" role="status" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.notice)} <a${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${__props.contact.email}`)} class="ko__rdks-mail" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</a></p>`);
							else _push(`<!---->`);
							_push(`<div class="opt" role="radiogroup" aria-labelledby="ko-rdks-q" aria-describedby="ko-rdks-err" data-key="rdks" tabindex="-1" data-v-690087c1>`);
							if (tpms.value.available) {
								_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "opt__tile--on": tpms.value.choice === "ja" }, "opt__tile"])}" data-v-690087c1><input class="visually-hidden opt__input" type="radio" name="rdks" value="ja"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(tpms.value.choice === "ja") ? " checked" : ""} data-v-690087c1><span class="opt__name" data-v-690087c1>Ja, bitte mit RDKS-Sensoren</span><span class="opt__price tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)}</span><span class="opt__sub" data-v-690087c1>Wir setzen die Sensoren gleich mit ein.</span><span class="opt__check" aria-hidden="true" data-v-690087c1>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "check",
									size: 20
								}, null, _parent));
								_push(`</span></label>`);
							} else _push(`<!---->`);
							_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "opt__tile--on": tpms.value.choice === "nein" }, "opt__tile"])}" data-v-690087c1><input class="visually-hidden opt__input" type="radio" name="rdks" value="nein"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(tpms.value.choice === "nein") ? " checked" : ""} data-v-690087c1><span class="opt__name" data-v-690087c1>Nein, ich brauche keine</span><span class="opt__price tabular" data-v-690087c1>0,00 €</span><span class="opt__check" aria-hidden="true" data-v-690087c1>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "check",
								size: 20
							}, null, _parent));
							_push(`</span></label></div><span id="ko-rdks-err" class="field-error" role="alert" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(errors.rdks ?? "")}</span></fieldset>`);
						} else _push(`<!---->`);
						_push(`<fieldset class="ko__group" data-v-690087c1><legend class="visually-hidden" data-v-690087c1>Versandart</legend><label class="ko__option" data-v-690087c1><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(form.shipping, "standard")) ? " checked" : ""} type="radio" name="shipping" value="standard" data-v-690087c1><span class="ko__option-text" data-v-690087c1><span class="ko__option-name" data-v-690087c1>Standardversand</span></span><span class="${(0, server_renderer_exports.ssrRenderClass)([{ tabular: !shippingOpen.value }, "ko__option-price"])}" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(shippingLabel.value)}</span></label></fieldset><div class="ko__actions" data-v-690087c1><button class="btn btn--primary btn--lg" type="submit" data-v-690087c1>Weiter zur Zahlung</button><button class="btn btn--secondary btn--lg" type="button" data-v-690087c1>Zurück</button></div><!--]-->`);
					} else {
						_push(`<!--[--><h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title data-v-690087c1>Zahlung</h2>`);
						if (__props.orderRefusal) _push(`<p id="ko-refusal" class="ko__refusal" role="status" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(__props.orderRefusal)}</p>`);
						else _push(`<!---->`);
						_push(`<div class="ko__final" data-v-690087c1><p class="ko__final-total" data-v-690087c1><span data-v-690087c1>Gesamt</span><span class="tabular" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</span></p>`);
						if (shippingOpen.value) _push(`<p class="price-legal" data-v-690087c1> inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt. · Versandkosten werden noch festgelegt </p>`);
						else _push(`<p class="price-legal" data-v-690087c1>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt. und Versand</p>`);
						_push(`<button class="btn btn--primary btn--lg btn--block ko__pay" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Boolean(__props.orderRefusal)) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", __props.orderRefusal ? "ko-refusal" : void 0)} data-v-690087c1> Zahlungspflichtig bestellen </button>`);
						if (serverRefusal.value) _push(`<p class="ko__refusal ko__refusal--after" role="alert" data-v-690087c1>${(0, server_renderer_exports.ssrInterpolate)(serverRefusal.value)}</p>`);
						else _push(`<!---->`);
						if (!shippingOpen.value) _push(`<p class="t-small quiet ko__final-note" data-v-690087c1> Von uns kommen keine weiteren Kosten dazu. </p>`);
						else _push(`<!---->`);
						if (needsEntry.value) _push(`<p class="t-small quiet ko__final-note" data-v-690087c1> Für Abnahme und Eintragung berechnet die Prüfstelle eigene Gebühren. </p>`);
						else _push(`<!---->`);
						_push(`<p class="t-small ko__legal-links" data-v-690087c1>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/agb" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`AGB`);
								else return [(0, vue_exports.createTextVNode)("AGB")];
							}),
							_: 1
						}, _parent));
						_push(`<span aria-hidden="true" data-v-690087c1>·</span>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/widerrufsbelehrung" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Widerrufsbelehrung`);
								else return [(0, vue_exports.createTextVNode)("Widerrufsbelehrung")];
							}),
							_: 1
						}, _parent));
						_push(`</p></div><div class="ko__actions" data-v-690087c1><button class="btn btn--secondary" type="button" data-v-690087c1>Zurück</button></div><!--]-->`);
					}
					_push(`<!--]-->`);
				}
				_push(`</form></div><!--]-->`);
			}
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kasse/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kasse/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-690087c1"]]);
//#endregion
export { Index_default as default };
