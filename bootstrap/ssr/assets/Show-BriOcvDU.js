import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BSZH2tn1.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-BcxlY_q2.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as ConditionGroups_default } from "./ConditionGroups-DPIzVLfb.js";
//#region resources/js/lib/mailto.ts
/**
* A `mailto:` link to an address somebody typed (finding 102's sibling, D-218). An e-mail address may contain `?` and
* `&`; written into the link as it is, `x?bcc=jemand@example.org` would open a mail with a recipient nobody in the
* shop chose. Encoded, the whole of it is the address.
*/
function mailtoHref(address) {
	return `mailto:${encodeURIComponent(address.trim()).replace(/%40/g, "@")}`;
}
//#endregion
//#region resources/js/Pages/Admin/Bestellungen/Show.vue?vue&type=script&setup=true&lang.ts
var Show_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Show",
	__ssrInlineRender: true,
	props: {
		order: {},
		customer: {},
		delivery: {},
		billing: {},
		sameAddress: { type: Boolean },
		lines: {},
		money: {},
		canFulfil: { type: Boolean }
	},
	setup(__props) {
		/**
		* Verkauf › Bestellungen › one order (the review release §4.4): what was bought, by whom and where it
		* goes — and, under every wheel line, the verdict as the customer was shown it when they bought,
		* restored from its frozen snapshot and never computed again (R-12). If the Gutachten has changed
		* since, the line says so; the order is explained by what it said then.
		*/
		const props = __props;
		const tracking = (0, vue_exports.ref)(props.order.tracking ?? "");
		const shipping = (0, vue_exports.ref)(false);
		const delivering = (0, vue_exports.ref)(false);
		function ship() {
			shipping.value = true;
			router.post(`/admin/bestellungen/${props.order.id}/versendet`, { tracking: tracking.value }, {
				preserveScroll: true,
				onFinish: () => shipping.value = false
			});
		}
		function deliver() {
			delivering.value = true;
			router.post(`/admin/bestellungen/${props.order.id}/zugestellt`, {}, {
				preserveScroll: true,
				onFinish: () => delivering.value = false
			});
		}
		const page = usePage();
		const refundErrors = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		const refundAmount = (0, vue_exports.ref)(props.money?.refundableInput ?? "");
		const refundReason = (0, vue_exports.ref)("");
		const refundLocal = (0, vue_exports.ref)(null);
		const refundOpen = (0, vue_exports.ref)(false);
		const refunding = (0, vue_exports.ref)(false);
		/** „1.234,56“ or „1234,5“ → cents, as the server reads it (Money::fromGerman); null when it is no amount. */
		function parseAmount(text) {
			const clean = text.trim().replace(/\s|€/g, "");
			if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(clean)) return null;
			const [whole, fraction = ""] = clean.replace(/\./g, "").split(",");
			return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
		}
		const refundCents = (0, vue_exports.computed)(() => parseAmount(refundAmount.value));
		function askRefund() {
			const cents = refundCents.value;
			refundLocal.value = null;
			if (cents === null || cents < 1) {
				refundLocal.value = "Gib den Betrag in Euro an, zum Beispiel 399,00.";
				return;
			}
			if (props.money && cents > props.money.refundable) {
				refundLocal.value = `Höchstens ${formatMoney(props.money.refundable)} lassen sich noch erstatten.`;
				return;
			}
			if (refundReason.value.trim().length < 3) {
				refundLocal.value = "Schreib dazu, wofür erstattet wird – es steht auf der Gutschrift.";
				return;
			}
			refundOpen.value = true;
		}
		const DRAFT = `rmf.refund.${props.order.id}`;
		(0, vue_exports.onMounted)(() => {
			try {
				const saved = JSON.parse(window.sessionStorage.getItem(DRAFT) ?? "null");
				if (saved && typeof saved.amount === "string" && typeof saved.reason === "string") {
					refundAmount.value = saved.amount;
					refundReason.value = saved.reason;
				}
			} catch {}
		});
		function keepDraft(keep) {
			try {
				if (keep) window.sessionStorage.setItem(DRAFT, JSON.stringify({
					amount: refundAmount.value,
					reason: refundReason.value
				}));
				else window.sessionStorage.removeItem(DRAFT);
			} catch {}
		}
		function refund() {
			keepDraft(true);
			refunding.value = true;
			router.post(`/admin/bestellungen/${props.order.id}/erstattung`, {
				amount: refundAmount.value,
				reason: refundReason.value
			}, {
				preserveScroll: true,
				onSuccess: () => {
					if (!refundErrors.value.refund && !refundErrors.value.amountCents && !refundErrors.value.reason) {
						keepDraft(false);
						refundReason.value = "";
						refundAmount.value = props.money?.refundableInput ?? "";
					}
				},
				onFinish: () => {
					refunding.value = false;
					refundOpen.value = false;
				}
			});
		}
		const context = (0, vue_exports.computed)(() => [props.order.statusLabel, props.order.placedAt ? `bestellt am ${props.order.placedAt}` : "noch nicht abgeschickt"].join(" · "));
		const TONE = {
			PERMITTED: null,
			CONDITIONAL: "adm-tag adm-tag--warn",
			NOT_PERMITTED: "adm-tag adm-tag--bad",
			UNKNOWN: "adm-tag adm-tag--neutral"
		};
		function tagClass(state) {
			return state.tone === "plain" ? null : `adm-tag adm-tag--${state.tone}`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: `Bestellung ${__props.order.number}`,
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.order.demo) _push(`<p class="bs-demo" role="note" data-v-c30f233b${_scopeId}>Diese Bestellung gehört zu den Demodaten. Niemand hat sie aufgegeben; es wird nichts versandt.</p>`);
						else if (__props.order.test) _push(`<p class="bs-demo" role="note" data-v-c30f233b${_scopeId}>Testbestellung über die Testzahlung – dabei fließt kein Geld, was auch immer der Status sagt.</p>`);
						else _push(`<!---->`);
						_push(`<div class="bs-top" data-v-c30f233b${_scopeId}><section class="adm-section bs-block" aria-labelledby="bs-state-h" data-v-c30f233b${_scopeId}><h2 id="bs-state-h" class="adm-section__title" data-v-c30f233b${_scopeId}>Stand</h2><dl class="adm-facts" data-v-c30f233b${_scopeId}><div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Zahlung</dt><dd data-v-c30f233b${_scopeId}>`);
						if (tagClass(__props.order.payment)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(tagClass(__props.order.payment))}" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.payment.label)}</span>`);
						else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.order.payment.label)}<!--]-->`);
						if (__props.order.paymentMethod) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(__props.order.paymentMethod)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div><div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Versand</dt><dd data-v-c30f233b${_scopeId}>`);
						if (tagClass(__props.order.fulfilment)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(tagClass(__props.order.fulfilment))}" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.fulfilment.label)}</span>`);
						else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.order.fulfilment.label)}<!--]-->`);
						if (__props.order.shippingMethod) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(__props.order.shippingMethod)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div>`);
						if (__props.order.paidAt) _push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Bezahlt am</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.paidAt)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.order.shippedAt) _push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Versandt am</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.shippedAt)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.order.tracking) _push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Sendungsnummer</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.tracking)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.order.deliveredAt) _push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Zugestellt am</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.deliveredAt)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.order.deliveredAt) _push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Bewertung</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.reviewInvitedAt ? `Einladung verschickt am ${__props.order.reviewInvitedAt}` : "Einladung geht einige Tage nach der Zustellung raus")}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Fahrzeug</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.vehicle ?? "–")}`);
						if (__props.order.keys) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(__props.order.keys)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div></dl>`);
						if (__props.canFulfil && __props.order.canShip) _push(`<form class="bs-ship" novalidate data-v-c30f233b${_scopeId}><div class="form-field" data-v-c30f233b${_scopeId}><label class="form-field__label" for="bs-tracking" data-v-c30f233b${_scopeId}>Sendungsnummer (freiwillig)</label><input id="bs-tracking"${(0, server_renderer_exports.ssrRenderAttr)("value", tracking.value)} class="input" maxlength="64" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", refundErrors.value.tracking ? "true" : void 0)} aria-describedby="bs-tracking-err" data-v-c30f233b${_scopeId}><p id="bs-tracking-err" class="form-field__error" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(refundErrors.value.tracking)}</p></div><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(shipping.value) ? " disabled" : ""} data-v-c30f233b${_scopeId}>Als versendet markieren</button></form>`);
						else if (__props.canFulfil && __props.order.canDeliver) _push(`<div class="bs-ship" data-v-c30f233b${_scopeId}><p class="bs-ship__note" data-v-c30f233b${_scopeId}>Ist die Sendung angekommen? Danach lädt der Shop einmal zur Bewertung ein.</p><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(delivering.value) ? " disabled" : ""} data-v-c30f233b${_scopeId}>Als zugestellt markieren</button></div>`);
						else _push(`<!---->`);
						_push(`</section><section class="adm-section bs-block" aria-labelledby="bs-customer-h" data-v-c30f233b${_scopeId}><h2 id="bs-customer-h" class="adm-section__title" data-v-c30f233b${_scopeId}>Kundendaten</h2><dl class="adm-facts" data-v-c30f233b${_scopeId}><div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Name</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.customer.name ?? "–")}</dd></div><div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>E-Mail</dt><dd data-v-c30f233b${_scopeId}>`);
						if (__props.customer.email) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", (0, vue_exports.unref)(mailtoHref)(__props.customer.email))} data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.customer.email)}</a>`);
						else _push(`<!--[-->–<!--]-->`);
						_push(`</dd></div>`);
						if (__props.customer.phone) _push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Telefon</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.customer.phone)}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.sameAddress ? "Liefer- und Rechnungsadresse" : "Lieferadresse")}</dt><dd data-v-c30f233b${_scopeId}>`);
						if (__props.delivery) {
							_push(`<address class="bs-address" data-v-c30f233b${_scopeId}><span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.name)}</span>`);
							if (__props.delivery.company) _push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.company)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.street)}</span>`);
							if (__props.delivery.extra) _push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.extra)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.city)}</span>`);
							if (__props.delivery.country) _push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.country)}</span>`);
							else _push(`<!---->`);
							_push(`</address>`);
						} else _push(`<!--[-->–<!--]-->`);
						_push(`</dd></div>`);
						if (!__props.sameAddress && __props.billing) {
							_push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Rechnungsadresse</dt><dd data-v-c30f233b${_scopeId}><address class="bs-address" data-v-c30f233b${_scopeId}><span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.name)}</span>`);
							if (__props.billing.company) _push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.company)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.street)}</span>`);
							if (__props.billing.extra) _push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.extra)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.city)}</span>`);
							if (__props.billing.country) _push(`<span data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.country)}</span>`);
							else _push(`<!---->`);
							_push(`</address></dd></div>`);
						} else _push(`<!---->`);
						_push(`</dl></section></div><section class="adm-section bs-positions" aria-labelledby="bs-lines-h" data-v-c30f233b${_scopeId}><div class="adm-section__head" data-v-c30f233b${_scopeId}><h2 id="bs-lines-h" class="adm-section__title" data-v-c30f233b${_scopeId}>Positionen</h2></div><ol class="bs-lines" data-v-c30f233b${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
							_push(`<li class="bs-line" data-v-c30f233b${_scopeId}><div class="bs-line__head" data-v-c30f233b${_scopeId}><span class="bs-line__label" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</span><span class="bs-line__qty" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(line.quantity, 0))} × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(line.unit))}</span><span class="bs-line__total" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(line.total))}</span></div>`);
							if (line.snapshot) {
								_push(`<div class="bs-proof" data-v-c30f233b${_scopeId}><p class="bs-proof__title" data-v-c30f233b${_scopeId}> Prüfnachweis vom ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.computedAt ?? "–")} `);
								if (line.snapshot.readable && line.snapshot.status && !line.snapshot.notesOnly && TONE[line.snapshot.status]) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(TONE[line.snapshot.status])}" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.statusLabel)}</span>`);
								else if (line.snapshot.readable) _push(`<span class="bs-proof__ok" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.statusLabel)}</span>`);
								else _push(`<!---->`);
								_push(`</p>`);
								if (line.snapshot.readable) {
									_push(`<!--[-->`);
									if (line.snapshot.vehicle) _push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}>Für ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.vehicle)}</p>`);
									else _push(`<!---->`);
									if (line.snapshot.document) {
										_push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}> Laut `);
										if (line.snapshot.documentHref) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: line.snapshot.documentHref }, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.document)}`);
												else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.document), 1)];
											}),
											_: 2
										}, _parent, _scopeId));
										else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.document)}<!--]-->`);
										_push(`, Fassung ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.revision)}`);
										if (line.snapshot.issuer) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.issuer)})<!--]-->`);
										else _push(`<!---->`);
										if (line.snapshot.sourcePage) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.sourcePage)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									if (line.snapshot.front && line.snapshot.front.length) {
										_push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}> Reifen: ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.front.join(", "))}`);
										if (line.snapshot.rear && line.snapshot.rear.length && line.snapshot.rear.join() !== line.snapshot.front.join()) _push(`<!--[--> · hinten ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.rear.join(", "))}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									if (line.snapshot.entryLine) {
										_push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.entryLine)}`);
										if (line.snapshot.entryNote) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.entryNote)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									if (line.snapshot.papersLine) _push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.papersLine)}</p>`);
									else _push(`<!---->`);
									if (line.snapshot.rimAloneNote) _push(`<p class="bs-proof__line" data-rim-alone data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.rimAloneNote)}</p>`);
									else _push(`<!---->`);
									if (line.snapshot.conditionGroups && (line.snapshot.conditions ?? []).length) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
										class: "bs-proof__groups",
										groups: line.snapshot.conditionGroups
									}, null, _parent, _scopeId));
									else _push(`<!---->`);
									_push(`<!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(line.snapshot.conditionGroups ? [] : line.snapshot.conditions ?? [], (sentence) => {
										_push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</p>`);
									});
									_push(`<!--]-->`);
									if (line.snapshot.tyre) {
										_push(`<!--[--><p class="bs-proof__line" data-v-c30f233b${_scopeId}>Reifen: ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.tyre.statusLabel)}`);
										if (line.snapshot.tyre.summary) _push(`<!--[--> – ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.tyre.summary)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
										if (line.snapshot.tyre.basis) _push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.tyre.basis)}</p>`);
										else _push(`<!---->`);
										if (line.snapshot.tyre.fromPapers) _push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}>Mit den Werten aus den Fahrzeugpapieren des Kunden gerechnet; sie haben die Antwort strenger gemacht.</p>`);
										else _push(`<!---->`);
										if (line.snapshot.tyre.lines.length) {
											_push(`<ol class="bs-proof__sum" data-v-c30f233b${_scopeId}><!--[-->`);
											(0, server_renderer_exports.ssrRenderList)(line.snapshot.tyre.lines, (sentence) => {
												_push(`<li data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</li>`);
											});
											_push(`<!--]--></ol>`);
										} else _push(`<!---->`);
										_push(`<!--]-->`);
									} else _push(`<!---->`);
									_push(`<!--]-->`);
								} else _push(`<p class="bs-proof__line" data-v-c30f233b${_scopeId}>Dieser Prüfnachweis lässt sich nicht lesen. Er bleibt unverändert gespeichert.</p>`);
								if (line.snapshot.documentToday) _push(`<p class="bs-proof__note" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.documentToday)} Maßgeblich für diese Bestellung bleibt der Stand oben.</p>`);
								else _push(`<!---->`);
								_push(`<p class="bs-proof__meta" data-v-c30f233b${_scopeId}>Prüfung ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.engine)}`);
								if (line.snapshot.pdfSha) _push(`<!--[--> · PDF-Prüfsumme ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.pdfSha)}…<!--]-->`);
								else _push(`<!---->`);
								_push(`</p></div>`);
							} else _push(`<!---->`);
							_push(`</li>`);
						});
						_push(`<!--]--></ol><dl class="bs-sums" data-v-c30f233b${_scopeId}><div class="bs-sums__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Zwischensumme</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.subtotal))}</dd></div><div class="bs-sums__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Versand</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.shipping))}</dd></div><div class="bs-sums__row bs-sums__row--total" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Summe</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.total))}</dd></div>`);
						if (__props.order.smallBusiness) _push(`<div class="bs-sums__row bs-sums__row--tax" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>MwSt.</dt><dd data-v-c30f233b${_scopeId}>keine (§ 19 UStG)</dd></div>`);
						else _push(`<div class="bs-sums__row bs-sums__row--tax" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>darin enthaltene MwSt.</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.tax))}</dd></div>`);
						_push(`</dl></section>`);
						if (__props.money) {
							_push(`<section class="adm-section bs-money" aria-labelledby="bs-money-h" data-v-c30f233b${_scopeId}><h2 id="bs-money-h" class="adm-section__title" data-v-c30f233b${_scopeId}>Zahlung und Erstattung</h2>`);
							if (__props.money.flag) _push(`<p class="adm-alert" role="alert" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.money.flag)}</p>`);
							else if (__props.money.error) _push(`<p class="bs-money__error" data-v-c30f233b${_scopeId}>Letzte Meldung des Zahlungsdienstes: ${(0, server_renderer_exports.ssrInterpolate)(__props.money.error)}</p>`);
							else _push(`<!---->`);
							_push(`<dl class="adm-facts" data-v-c30f233b${_scopeId}><div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Bezahlt</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.money.paid))}</dd></div><div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Erstattet</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.money.refunded))}</dd></div>`);
							if (__props.money.paid > 0) _push(`<div class="adm-facts__row" data-v-c30f233b${_scopeId}><dt data-v-c30f233b${_scopeId}>Noch erstattbar</dt><dd data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.money.refundable))}</dd></div>`);
							else _push(`<!---->`);
							_push(`</dl>`);
							if (__props.money.papers.length) {
								_push(`<ul class="bs-papers" aria-label="Rechnung und Gutschriften" data-v-c30f233b${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.money.papers, (paper) => {
									_push(`<li data-v-c30f233b${_scopeId}><a${(0, server_renderer_exports.ssrRenderAttr)("href", paper.href)} target="_blank" rel="noopener" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(paper.kind)} ${(0, server_renderer_exports.ssrInterpolate)(paper.number)}</a><span class="bs-papers__meta" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(paper.issuedAt)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(paper.gross))}</span></li>`);
								});
								_push(`<!--]--></ul>`);
							} else _push(`<!---->`);
							if (__props.money.refunds.length) {
								_push(`<ol class="bs-refunds" aria-label="Erstattungen" data-v-c30f233b${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.money.refunds, (item, i) => {
									_push(`<li data-v-c30f233b${_scopeId}><span class="bs-refunds__amount" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(item.amount))}</span> · ${(0, server_renderer_exports.ssrInterpolate)(item.status)} · ${(0, server_renderer_exports.ssrInterpolate)(item.at)}`);
									if (item.by) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(item.by)}<!--]-->`);
									else _push(`<!---->`);
									_push(`<span class="bs-refunds__reason" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.reason)}</span></li>`);
								});
								_push(`<!--]--></ol>`);
							} else _push(`<!---->`);
							if (__props.money.canRefund) _push(`<form class="bs-refund" novalidate data-v-c30f233b${_scopeId}><div class="form-field" data-v-c30f233b${_scopeId}><label class="form-field__label" for="bs-refund-amount" data-v-c30f233b${_scopeId}>Betrag</label><span class="input-group bs-refund__amount" data-v-c30f233b${_scopeId}><input id="bs-refund-amount"${(0, server_renderer_exports.ssrRenderAttr)("value", refundAmount.value)} class="input bs-refund__input" type="text" inputmode="decimal" autocomplete="off" aria-describedby="bs-refund-help bs-refund-err" data-v-c30f233b${_scopeId}><span class="input-group__suffix" aria-hidden="true" data-v-c30f233b${_scopeId}>€</span></span><p id="bs-refund-help" class="form-field__help" data-v-c30f233b${_scopeId}>In Euro, höchstens ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.money.refundable))}. Das Geld geht über Stripe auf dem Weg zurück, auf dem bezahlt wurde.</p></div><div class="form-field" data-v-c30f233b${_scopeId}><label class="form-field__label" for="bs-refund-reason" data-v-c30f233b${_scopeId}>Grund</label><input id="bs-refund-reason"${(0, server_renderer_exports.ssrRenderAttr)("value", refundReason.value)} class="input" type="text" maxlength="300" autocomplete="off" aria-describedby="bs-refund-reason-help bs-refund-err" data-v-c30f233b${_scopeId}><p id="bs-refund-reason-help" class="form-field__help" data-v-c30f233b${_scopeId}>Steht auf der Gutschrift, die die Kundin oder der Kunde bekommt – etwa „Eine Felge zurückgeschickt“.</p></div><p id="bs-refund-err" class="form-field__error" role="alert" data-v-c30f233b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(refundLocal.value ?? refundErrors.value.refund ?? refundErrors.value.amountCents ?? refundErrors.value.reason ?? "")}</p><div class="adm-fields__actions" data-v-c30f233b${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(refunding.value) ? " disabled" : ""} data-v-c30f233b${_scopeId}>Erstatten …</button></div></form>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`<p class="bs-back" data-v-c30f233b${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/bestellungen" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zurück zu den Bestellungen`);
								else return [(0, vue_exports.createTextVNode)("Zurück zu den Bestellungen")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: refundOpen.value,
							"onUpdate:open": ($event) => refundOpen.value = $event,
							title: `${(0, vue_exports.unref)(formatMoney)(refundCents.value ?? 0)} erstatten?`,
							body: `Das Geld geht über Stripe an ${__props.customer.name ?? "die Kundin oder den Kunden"} zurück; eine Gutschrift wird ausgestellt. Eine Erstattung lässt sich nicht zurücknehmen.`,
							"confirm-label": `${(0, vue_exports.unref)(formatMoney)(refundCents.value ?? 0)} erstatten`,
							busy: refunding.value,
							onConfirm: refund
						}, null, _parent, _scopeId));
					} else return [
						__props.order.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "bs-demo",
							role: "note"
						}, "Diese Bestellung gehört zu den Demodaten. Niemand hat sie aufgegeben; es wird nichts versandt.")) : __props.order.test ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "bs-demo",
							role: "note"
						}, "Testbestellung über die Testzahlung – dabei fließt kein Geld, was auch immer der Status sagt.")) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("div", { class: "bs-top" }, [(0, vue_exports.createVNode)("section", {
							class: "adm-section bs-block",
							"aria-labelledby": "bs-state-h"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "bs-state-h",
								class: "adm-section__title"
							}, "Stand"),
							(0, vue_exports.createVNode)("dl", { class: "adm-facts" }, [
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Zahlung"), (0, vue_exports.createVNode)("dd", null, [tagClass(__props.order.payment) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: tagClass(__props.order.payment)
								}, (0, vue_exports.toDisplayString)(__props.order.payment.label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.order.payment.label), 1)], 64)), __props.order.paymentMethod ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(__props.order.paymentMethod), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Versand"), (0, vue_exports.createVNode)("dd", null, [tagClass(__props.order.fulfilment) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: tagClass(__props.order.fulfilment)
								}, (0, vue_exports.toDisplayString)(__props.order.fulfilment.label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.order.fulfilment.label), 1)], 64)), __props.order.shippingMethod ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(__props.order.shippingMethod), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
								__props.order.paidAt ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Bezahlt am"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.order.paidAt), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								__props.order.shippedAt ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Versandt am"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.order.shippedAt), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								__props.order.tracking ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 2,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Sendungsnummer"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.order.tracking), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								__props.order.deliveredAt ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 3,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Zugestellt am"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.order.deliveredAt), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								__props.order.deliveredAt ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 4,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Bewertung"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.order.reviewInvitedAt ? `Einladung verschickt am ${__props.order.reviewInvitedAt}` : "Einladung geht einige Tage nach der Zustellung raus"), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Fahrzeug"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.order.vehicle ?? "–"), 1), __props.order.keys ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(__props.order.keys), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])])
							]),
							__props.canFulfil && __props.order.canShip ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
								key: 0,
								class: "bs-ship",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(ship, ["prevent"])
							}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "bs-tracking"
								}, "Sendungsnummer (freiwillig)"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "bs-tracking",
									"onUpdate:modelValue": ($event) => tracking.value = $event,
									class: "input",
									maxlength: "64",
									autocomplete: "off",
									"aria-invalid": refundErrors.value.tracking ? "true" : void 0,
									"aria-describedby": "bs-tracking-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, tracking.value]]),
								(0, vue_exports.createVNode)("p", {
									id: "bs-tracking-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(refundErrors.value.tracking), 1)
							]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit",
								disabled: shipping.value
							}, "Als versendet markieren", 8, ["disabled"])], 32)) : __props.canFulfil && __props.order.canDeliver ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "bs-ship"
							}, [(0, vue_exports.createVNode)("p", { class: "bs-ship__note" }, "Ist die Sendung angekommen? Danach lädt der Shop einmal zur Bewertung ein."), (0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								disabled: delivering.value,
								onClick: deliver
							}, "Als zugestellt markieren", 8, ["disabled"])])) : (0, vue_exports.createCommentVNode)("", true)
						]), (0, vue_exports.createVNode)("section", {
							class: "adm-section bs-block",
							"aria-labelledby": "bs-customer-h"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "bs-customer-h",
							class: "adm-section__title"
						}, "Kundendaten"), (0, vue_exports.createVNode)("dl", { class: "adm-facts" }, [
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Name"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.customer.name ?? "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "E-Mail"), (0, vue_exports.createVNode)("dd", null, [__props.customer.email ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
								key: 0,
								href: (0, vue_exports.unref)(mailtoHref)(__props.customer.email)
							}, (0, vue_exports.toDisplayString)(__props.customer.email), 9, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("–")], 64))])]),
							__props.customer.phone ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Telefon"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.customer.phone), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(__props.sameAddress ? "Liefer- und Rechnungsadresse" : "Lieferadresse"), 1), (0, vue_exports.createVNode)("dd", null, [__props.delivery ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("address", {
								key: 0,
								class: "bs-address"
							}, [
								(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(__props.delivery.name), 1),
								__props.delivery.company ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, (0, vue_exports.toDisplayString)(__props.delivery.company), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(__props.delivery.street), 1),
								__props.delivery.extra ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, (0, vue_exports.toDisplayString)(__props.delivery.extra), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(__props.delivery.city), 1),
								__props.delivery.country ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 2 }, (0, vue_exports.toDisplayString)(__props.delivery.country), 1)) : (0, vue_exports.createCommentVNode)("", true)
							])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("–")], 64))])]),
							!__props.sameAddress && __props.billing ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Rechnungsadresse"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createVNode)("address", { class: "bs-address" }, [
								(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(__props.billing.name), 1),
								__props.billing.company ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, (0, vue_exports.toDisplayString)(__props.billing.company), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(__props.billing.street), 1),
								__props.billing.extra ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, (0, vue_exports.toDisplayString)(__props.billing.extra), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(__props.billing.city), 1),
								__props.billing.country ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 2 }, (0, vue_exports.toDisplayString)(__props.billing.country), 1)) : (0, vue_exports.createCommentVNode)("", true)
							])])])) : (0, vue_exports.createCommentVNode)("", true)
						])])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section bs-positions",
							"aria-labelledby": "bs-lines-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "bs-lines-h",
								class: "adm-section__title"
							}, "Positionen")]),
							(0, vue_exports.createVNode)("ol", { class: "bs-lines" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.lines, (line) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: line.id,
									class: "bs-line"
								}, [(0, vue_exports.createVNode)("div", { class: "bs-line__head" }, [
									(0, vue_exports.createVNode)("span", { class: "bs-line__label" }, (0, vue_exports.toDisplayString)(line.label), 1),
									(0, vue_exports.createVNode)("span", { class: "bs-line__qty" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(line.quantity, 0)) + " × " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(line.unit)), 1),
									(0, vue_exports.createVNode)("span", { class: "bs-line__total" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(line.total)), 1)
								]), line.snapshot ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "bs-proof"
								}, [
									(0, vue_exports.createVNode)("p", { class: "bs-proof__title" }, [(0, vue_exports.createTextVNode)(" Prüfnachweis vom " + (0, vue_exports.toDisplayString)(line.snapshot.computedAt ?? "–") + " ", 1), line.snapshot.readable && line.snapshot.status && !line.snapshot.notesOnly && TONE[line.snapshot.status] ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: TONE[line.snapshot.status]
									}, (0, vue_exports.toDisplayString)(line.snapshot.statusLabel), 3)) : line.snapshot.readable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "bs-proof__ok"
									}, (0, vue_exports.toDisplayString)(line.snapshot.statusLabel), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
									line.snapshot.readable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
										line.snapshot.vehicle ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 0,
											class: "bs-proof__line"
										}, "Für " + (0, vue_exports.toDisplayString)(line.snapshot.vehicle), 1)) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.document ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 1,
											class: "bs-proof__line"
										}, [
											(0, vue_exports.createTextVNode)(" Laut "),
											line.snapshot.documentHref ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
												key: 0,
												href: line.snapshot.documentHref
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.document), 1)]),
												_: 2
											}, 1032, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.document), 1)], 64)),
											(0, vue_exports.createTextVNode)(", Fassung " + (0, vue_exports.toDisplayString)(line.snapshot.revision), 1),
											line.snapshot.issuer ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)(" (" + (0, vue_exports.toDisplayString)(line.snapshot.issuer) + ")", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
											line.snapshot.sourcePage ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createTextVNode)(", Seite " + (0, vue_exports.toDisplayString)(line.snapshot.sourcePage), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
										])) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.front && line.snapshot.front.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 2,
											class: "bs-proof__line"
										}, [(0, vue_exports.createTextVNode)(" Reifen: " + (0, vue_exports.toDisplayString)(line.snapshot.front.join(", ")), 1), line.snapshot.rear && line.snapshot.rear.length && line.snapshot.rear.join() !== line.snapshot.front.join() ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · hinten " + (0, vue_exports.toDisplayString)(line.snapshot.rear.join(", ")), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.entryLine ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 3,
											class: "bs-proof__line"
										}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.entryLine), 1), line.snapshot.entryNote ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.entryNote), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.papersLine ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 4,
											class: "bs-proof__line"
										}, (0, vue_exports.toDisplayString)(line.snapshot.papersLine), 1)) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.rimAloneNote ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 5,
											class: "bs-proof__line",
											"data-rim-alone": ""
										}, (0, vue_exports.toDisplayString)(line.snapshot.rimAloneNote), 1)) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.conditionGroups && (line.snapshot.conditions ?? []).length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ConditionGroups_default, {
											key: 6,
											class: "bs-proof__groups",
											groups: line.snapshot.conditionGroups
										}, null, 8, ["groups"])) : (0, vue_exports.createCommentVNode)("", true),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(line.snapshot.conditionGroups ? [] : line.snapshot.conditions ?? [], (sentence) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
												key: sentence,
												class: "bs-proof__line"
											}, (0, vue_exports.toDisplayString)(sentence), 1);
										}), 128)),
										line.snapshot.tyre ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 7 }, [
											(0, vue_exports.createVNode)("p", { class: "bs-proof__line" }, [(0, vue_exports.createTextVNode)("Reifen: " + (0, vue_exports.toDisplayString)(line.snapshot.tyre.statusLabel), 1), line.snapshot.tyre.summary ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" – " + (0, vue_exports.toDisplayString)(line.snapshot.tyre.summary), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
											line.snapshot.tyre.basis ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
												key: 0,
												class: "bs-proof__line"
											}, (0, vue_exports.toDisplayString)(line.snapshot.tyre.basis), 1)) : (0, vue_exports.createCommentVNode)("", true),
											line.snapshot.tyre.fromPapers ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
												key: 1,
												class: "bs-proof__line"
											}, "Mit den Werten aus den Fahrzeugpapieren des Kunden gerechnet; sie haben die Antwort strenger gemacht.")) : (0, vue_exports.createCommentVNode)("", true),
											line.snapshot.tyre.lines.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
												key: 2,
												class: "bs-proof__sum"
											}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(line.snapshot.tyre.lines, (sentence) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: sentence }, (0, vue_exports.toDisplayString)(sentence), 1);
											}), 128))])) : (0, vue_exports.createCommentVNode)("", true)
										], 64)) : (0, vue_exports.createCommentVNode)("", true)
									], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 1,
										class: "bs-proof__line"
									}, "Dieser Prüfnachweis lässt sich nicht lesen. Er bleibt unverändert gespeichert.")),
									line.snapshot.documentToday ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 2,
										class: "bs-proof__note"
									}, (0, vue_exports.toDisplayString)(line.snapshot.documentToday) + " Maßgeblich für diese Bestellung bleibt der Stand oben.", 1)) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("p", { class: "bs-proof__meta" }, [(0, vue_exports.createTextVNode)("Prüfung " + (0, vue_exports.toDisplayString)(line.snapshot.engine), 1), line.snapshot.pdfSha ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · PDF-Prüfsumme " + (0, vue_exports.toDisplayString)(line.snapshot.pdfSha) + "…", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])
								])) : (0, vue_exports.createCommentVNode)("", true)]);
							}), 128))]),
							(0, vue_exports.createVNode)("dl", { class: "bs-sums" }, [
								(0, vue_exports.createVNode)("div", { class: "bs-sums__row" }, [(0, vue_exports.createVNode)("dt", null, "Zwischensumme"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.order.subtotal)), 1)]),
								(0, vue_exports.createVNode)("div", { class: "bs-sums__row" }, [(0, vue_exports.createVNode)("dt", null, "Versand"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.order.shipping)), 1)]),
								(0, vue_exports.createVNode)("div", { class: "bs-sums__row bs-sums__row--total" }, [(0, vue_exports.createVNode)("dt", null, "Summe"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.order.total)), 1)]),
								__props.order.smallBusiness ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "bs-sums__row bs-sums__row--tax"
								}, [(0, vue_exports.createVNode)("dt", null, "MwSt."), (0, vue_exports.createVNode)("dd", null, "keine (§\xA019 UStG)")])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "bs-sums__row bs-sums__row--tax"
								}, [(0, vue_exports.createVNode)("dt", null, "darin enthaltene MwSt."), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.order.tax)), 1)]))
							])
						]),
						__props.money ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 2,
							class: "adm-section bs-money",
							"aria-labelledby": "bs-money-h"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "bs-money-h",
								class: "adm-section__title"
							}, "Zahlung und Erstattung"),
							__props.money.flag ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(__props.money.flag), 1)) : __props.money.error ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "bs-money__error"
							}, "Letzte Meldung des Zahlungsdienstes: " + (0, vue_exports.toDisplayString)(__props.money.error), 1)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("dl", { class: "adm-facts" }, [
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Bezahlt"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.money.paid)), 1)]),
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Erstattet"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.money.refunded)), 1)]),
								__props.money.paid > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Noch erstattbar"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.money.refundable)), 1)])) : (0, vue_exports.createCommentVNode)("", true)
							]),
							__props.money.papers.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
								key: 2,
								class: "bs-papers",
								"aria-label": "Rechnung und Gutschriften"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.money.papers, (paper) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: paper.number }, [(0, vue_exports.createVNode)("a", {
									href: paper.href,
									target: "_blank",
									rel: "noopener"
								}, (0, vue_exports.toDisplayString)(paper.kind) + " " + (0, vue_exports.toDisplayString)(paper.number), 9, ["href"]), (0, vue_exports.createVNode)("span", { class: "bs-papers__meta" }, (0, vue_exports.toDisplayString)(paper.issuedAt) + " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(paper.gross)), 1)]);
							}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
							__props.money.refunds.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
								key: 3,
								class: "bs-refunds",
								"aria-label": "Erstattungen"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.money.refunds, (item, i) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: i }, [
									(0, vue_exports.createVNode)("span", { class: "bs-refunds__amount" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(item.amount)), 1),
									(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(item.status) + " · " + (0, vue_exports.toDisplayString)(item.at), 1),
									item.by ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(item.by), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("span", { class: "bs-refunds__reason" }, (0, vue_exports.toDisplayString)(item.reason), 1)
								]);
							}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
							__props.money.canRefund ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
								key: 4,
								class: "bs-refund",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(askRefund, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "bs-refund-amount"
									}, "Betrag"),
									(0, vue_exports.createVNode)("span", { class: "input-group bs-refund__amount" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "bs-refund-amount",
										"onUpdate:modelValue": ($event) => refundAmount.value = $event,
										class: "input bs-refund__input",
										type: "text",
										inputmode: "decimal",
										autocomplete: "off",
										"aria-describedby": "bs-refund-help bs-refund-err"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, refundAmount.value]]), (0, vue_exports.createVNode)("span", {
										class: "input-group__suffix",
										"aria-hidden": "true"
									}, "€")]),
									(0, vue_exports.createVNode)("p", {
										id: "bs-refund-help",
										class: "form-field__help"
									}, "In Euro, höchstens " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.money.refundable)) + ". Das Geld geht über Stripe auf dem Weg zurück, auf dem bezahlt wurde.", 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "bs-refund-reason"
									}, "Grund"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "bs-refund-reason",
										"onUpdate:modelValue": ($event) => refundReason.value = $event,
										class: "input",
										type: "text",
										maxlength: "300",
										autocomplete: "off",
										"aria-describedby": "bs-refund-reason-help bs-refund-err"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, refundReason.value]]),
									(0, vue_exports.createVNode)("p", {
										id: "bs-refund-reason-help",
										class: "form-field__help"
									}, "Steht auf der Gutschrift, die die Kundin oder der Kunde bekommt – etwa „Eine Felge zurückgeschickt“.")
								]),
								(0, vue_exports.createVNode)("p", {
									id: "bs-refund-err",
									class: "form-field__error",
									role: "alert"
								}, (0, vue_exports.toDisplayString)(refundLocal.value ?? refundErrors.value.refund ?? refundErrors.value.amountCents ?? refundErrors.value.reason ?? ""), 1),
								(0, vue_exports.createVNode)("div", { class: "adm-fields__actions" }, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "submit",
									disabled: refunding.value
								}, "Erstatten …", 8, ["disabled"])])
							], 32)) : (0, vue_exports.createCommentVNode)("", true)
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("p", { class: "bs-back" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/bestellungen" }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zurück zu den Bestellungen")]),
							_: 1
						})]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: refundOpen.value,
							"onUpdate:open": ($event) => refundOpen.value = $event,
							title: `${(0, vue_exports.unref)(formatMoney)(refundCents.value ?? 0)} erstatten?`,
							body: `Das Geld geht über Stripe an ${__props.customer.name ?? "die Kundin oder den Kunden"} zurück; eine Gutschrift wird ausgestellt. Eine Erstattung lässt sich nicht zurücknehmen.`,
							"confirm-label": `${(0, vue_exports.unref)(formatMoney)(refundCents.value ?? 0)} erstatten`,
							busy: refunding.value,
							onConfirm: refund
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"confirm-label",
							"busy"
						])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Bestellungen/Show.vue
var _sfc_setup = Show_vue_vue_type_script_setup_true_lang_default.setup;
Show_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Bestellungen/Show.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Show_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Show_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c30f233b"]]);
//#endregion
export { Show_default as default };
