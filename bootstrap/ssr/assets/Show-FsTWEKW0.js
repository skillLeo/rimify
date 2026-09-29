import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-DdF--v2u.js";
import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { t as decimal } from "./format-BSciVE2Q.js";
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
		lines: {}
	},
	setup(__props) {
		/**
		* Verkauf › Bestellungen › one order (the review release §4.4): what was bought, by whom and where it
		* goes — and, under every wheel line, the verdict as the customer was shown it when they bought,
		* restored from its frozen snapshot and never computed again (R-12). If the Gutachten has changed
		* since, the line says so; the order is explained by what it said then.
		*/
		const props = __props;
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
						if (__props.order.demo) _push(`<p class="bs-demo" role="note" data-v-190de3a9${_scopeId}>Diese Bestellung gehört zu den Demodaten. Niemand hat sie aufgegeben; es wird nichts versandt.</p>`);
						else if (__props.order.test) _push(`<p class="bs-demo" role="note" data-v-190de3a9${_scopeId}>Testbestellung über die Testzahlung – dabei fließt kein Geld, was auch immer der Status sagt.</p>`);
						else _push(`<!---->`);
						_push(`<div class="bs-top" data-v-190de3a9${_scopeId}><section class="adm-section bs-block" aria-labelledby="bs-state-h" data-v-190de3a9${_scopeId}><h2 id="bs-state-h" class="adm-section__title" data-v-190de3a9${_scopeId}>Stand</h2><dl class="adm-facts" data-v-190de3a9${_scopeId}><div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Zahlung</dt><dd data-v-190de3a9${_scopeId}>`);
						if (tagClass(__props.order.payment)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(tagClass(__props.order.payment))}" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.payment.label)}</span>`);
						else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.order.payment.label)}<!--]-->`);
						if (__props.order.paymentMethod) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(__props.order.paymentMethod)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div><div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Versand</dt><dd data-v-190de3a9${_scopeId}>`);
						if (tagClass(__props.order.fulfilment)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(tagClass(__props.order.fulfilment))}" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.fulfilment.label)}</span>`);
						else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.order.fulfilment.label)}<!--]-->`);
						if (__props.order.shippingMethod) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(__props.order.shippingMethod)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div>`);
						if (__props.order.paidAt) _push(`<div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Bezahlt am</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.paidAt)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.order.shippedAt) _push(`<div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Versandt am</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.shippedAt)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.order.tracking) _push(`<div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Sendungsnummer</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.tracking)}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Fahrzeug</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.order.vehicle ?? "–")}`);
						if (__props.order.keys) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(__props.order.keys)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div></dl></section><section class="adm-section bs-block" aria-labelledby="bs-customer-h" data-v-190de3a9${_scopeId}><h2 id="bs-customer-h" class="adm-section__title" data-v-190de3a9${_scopeId}>Kundendaten</h2><dl class="adm-facts" data-v-190de3a9${_scopeId}><div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Name</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.customer.name ?? "–")}</dd></div><div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>E-Mail</dt><dd data-v-190de3a9${_scopeId}>`);
						if (__props.customer.email) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${__props.customer.email}`)} data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.customer.email)}</a>`);
						else _push(`<!--[-->–<!--]-->`);
						_push(`</dd></div>`);
						if (__props.customer.phone) _push(`<div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Telefon</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.customer.phone)}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.sameAddress ? "Liefer- und Rechnungsadresse" : "Lieferadresse")}</dt><dd data-v-190de3a9${_scopeId}>`);
						if (__props.delivery) {
							_push(`<address class="bs-address" data-v-190de3a9${_scopeId}><span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.name)}</span>`);
							if (__props.delivery.company) _push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.company)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.street)}</span>`);
							if (__props.delivery.extra) _push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.extra)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.city)}</span>`);
							if (__props.delivery.country) _push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.delivery.country)}</span>`);
							else _push(`<!---->`);
							_push(`</address>`);
						} else _push(`<!--[-->–<!--]-->`);
						_push(`</dd></div>`);
						if (!__props.sameAddress && __props.billing) {
							_push(`<div class="adm-facts__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Rechnungsadresse</dt><dd data-v-190de3a9${_scopeId}><address class="bs-address" data-v-190de3a9${_scopeId}><span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.name)}</span>`);
							if (__props.billing.company) _push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.company)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.street)}</span>`);
							if (__props.billing.extra) _push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.extra)}</span>`);
							else _push(`<!---->`);
							_push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.city)}</span>`);
							if (__props.billing.country) _push(`<span data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.billing.country)}</span>`);
							else _push(`<!---->`);
							_push(`</address></dd></div>`);
						} else _push(`<!---->`);
						_push(`</dl></section></div><section class="adm-section bs-positions" aria-labelledby="bs-lines-h" data-v-190de3a9${_scopeId}><div class="adm-section__head" data-v-190de3a9${_scopeId}><h2 id="bs-lines-h" class="adm-section__title" data-v-190de3a9${_scopeId}>Positionen</h2></div><ol class="bs-lines" data-v-190de3a9${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
							_push(`<li class="bs-line" data-v-190de3a9${_scopeId}><div class="bs-line__head" data-v-190de3a9${_scopeId}><span class="bs-line__label" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</span><span class="bs-line__qty" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(line.quantity, 0))} × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(line.unit))}</span><span class="bs-line__total" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(line.total))}</span></div>`);
							if (line.snapshot) {
								_push(`<div class="bs-proof" data-v-190de3a9${_scopeId}><p class="bs-proof__title" data-v-190de3a9${_scopeId}> Prüfnachweis vom ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.computedAt ?? "–")} `);
								if (line.snapshot.readable && line.snapshot.status && TONE[line.snapshot.status]) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(TONE[line.snapshot.status])}" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.statusLabel)}</span>`);
								else if (line.snapshot.readable) _push(`<span class="bs-proof__ok" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.statusLabel)}</span>`);
								else _push(`<!---->`);
								_push(`</p>`);
								if (line.snapshot.readable) {
									_push(`<!--[-->`);
									if (line.snapshot.vehicle) _push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}>Für ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.vehicle)}</p>`);
									else _push(`<!---->`);
									if (line.snapshot.document) {
										_push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}> Laut `);
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: line.snapshot.documentHref }, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.document)}`);
												else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.document), 1)];
											}),
											_: 2
										}, _parent, _scopeId));
										_push(`, Fassung ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.revision)}`);
										if (line.snapshot.issuer) _push(`<!--[--> (${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.issuer)})<!--]-->`);
										else _push(`<!---->`);
										if (line.snapshot.sourcePage) _push(`<!--[-->, Seite ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.sourcePage)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									if (line.snapshot.front && line.snapshot.front.length) {
										_push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}> Reifen: ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.front.join(", "))}`);
										if (line.snapshot.rear && line.snapshot.rear.length && line.snapshot.rear.join() !== line.snapshot.front.join()) _push(`<!--[--> · hinten ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.rear.join(", "))}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									if (line.snapshot.requiresEntry) {
										_push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}>Eintragung in die Fahrzeugpapiere erforderlich.`);
										if (line.snapshot.entryNote) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.entryNote)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
									} else _push(`<!---->`);
									_push(`<!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(line.snapshot.conditions ?? [], (sentence) => {
										_push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</p>`);
									});
									_push(`<!--]-->`);
									if (line.snapshot.tyre) {
										_push(`<!--[--><p class="bs-proof__line" data-v-190de3a9${_scopeId}>Reifen: ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.tyre.statusLabel)}`);
										if (line.snapshot.tyre.summary) _push(`<!--[--> – ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.tyre.summary)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</p>`);
										if (line.snapshot.tyre.basis) _push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.tyre.basis)}</p>`);
										else _push(`<!---->`);
										if (line.snapshot.tyre.fromPapers) _push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}>Mit den Werten aus den Fahrzeugpapieren des Kunden gerechnet; sie haben die Antwort strenger gemacht.</p>`);
										else _push(`<!---->`);
										if (line.snapshot.tyre.lines.length) {
											_push(`<ol class="bs-proof__sum" data-v-190de3a9${_scopeId}><!--[-->`);
											(0, server_renderer_exports.ssrRenderList)(line.snapshot.tyre.lines, (sentence) => {
												_push(`<li data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</li>`);
											});
											_push(`<!--]--></ol>`);
										} else _push(`<!---->`);
										_push(`<!--]-->`);
									} else _push(`<!---->`);
									_push(`<!--]-->`);
								} else _push(`<p class="bs-proof__line" data-v-190de3a9${_scopeId}>Dieser Prüfnachweis lässt sich nicht lesen. Er bleibt unverändert gespeichert.</p>`);
								if (line.snapshot.documentToday) _push(`<p class="bs-proof__note" data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.documentToday)} Maßgeblich für diese Bestellung bleibt der Stand oben.</p>`);
								else _push(`<!---->`);
								_push(`<p class="bs-proof__meta" data-v-190de3a9${_scopeId}>Prüfung ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.engine)}`);
								if (line.snapshot.pdfSha) _push(`<!--[--> · PDF-Prüfsumme ${(0, server_renderer_exports.ssrInterpolate)(line.snapshot.pdfSha)}…<!--]-->`);
								else _push(`<!---->`);
								_push(`</p></div>`);
							} else _push(`<!---->`);
							_push(`</li>`);
						});
						_push(`<!--]--></ol><dl class="bs-sums" data-v-190de3a9${_scopeId}><div class="bs-sums__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Zwischensumme</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.subtotal))}</dd></div><div class="bs-sums__row" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Versand</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.shipping))}</dd></div><div class="bs-sums__row bs-sums__row--total" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>Summe</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.total))}</dd></div><div class="bs-sums__row bs-sums__row--tax" data-v-190de3a9${_scopeId}><dt data-v-190de3a9${_scopeId}>darin enthaltene MwSt.</dt><dd data-v-190de3a9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.order.tax))}</dd></div></dl></section><p class="bs-back" data-v-190de3a9${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/bestellungen" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zurück zu den Bestellungen`);
								else return [(0, vue_exports.createTextVNode)("Zurück zu den Bestellungen")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</p>`);
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
						}, [(0, vue_exports.createVNode)("h2", {
							id: "bs-state-h",
							class: "adm-section__title"
						}, "Stand"), (0, vue_exports.createVNode)("dl", { class: "adm-facts" }, [
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
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Fahrzeug"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.order.vehicle ?? "–"), 1), __props.order.keys ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(__props.order.keys), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])])
						])]), (0, vue_exports.createVNode)("section", {
							class: "adm-section bs-block",
							"aria-labelledby": "bs-customer-h"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "bs-customer-h",
							class: "adm-section__title"
						}, "Kundendaten"), (0, vue_exports.createVNode)("dl", { class: "adm-facts" }, [
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Name"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.customer.name ?? "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "E-Mail"), (0, vue_exports.createVNode)("dd", null, [__props.customer.email ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
								key: 0,
								href: `mailto:${__props.customer.email}`
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
									(0, vue_exports.createVNode)("p", { class: "bs-proof__title" }, [(0, vue_exports.createTextVNode)(" Prüfnachweis vom " + (0, vue_exports.toDisplayString)(line.snapshot.computedAt ?? "–") + " ", 1), line.snapshot.readable && line.snapshot.status && TONE[line.snapshot.status] ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
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
											(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: line.snapshot.documentHref }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.document), 1)]),
												_: 2
											}, 1032, ["href"]),
											(0, vue_exports.createTextVNode)(", Fassung " + (0, vue_exports.toDisplayString)(line.snapshot.revision), 1),
											line.snapshot.issuer ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" (" + (0, vue_exports.toDisplayString)(line.snapshot.issuer) + ")", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
											line.snapshot.sourcePage ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)(", Seite " + (0, vue_exports.toDisplayString)(line.snapshot.sourcePage), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
										])) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.front && line.snapshot.front.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 2,
											class: "bs-proof__line"
										}, [(0, vue_exports.createTextVNode)(" Reifen: " + (0, vue_exports.toDisplayString)(line.snapshot.front.join(", ")), 1), line.snapshot.rear && line.snapshot.rear.length && line.snapshot.rear.join() !== line.snapshot.front.join() ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · hinten " + (0, vue_exports.toDisplayString)(line.snapshot.rear.join(", ")), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
										line.snapshot.requiresEntry ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 3,
											class: "bs-proof__line"
										}, [(0, vue_exports.createTextVNode)("Eintragung in die Fahrzeugpapiere erforderlich."), line.snapshot.entryNote ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.snapshot.entryNote), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(line.snapshot.conditions ?? [], (sentence) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
												key: sentence,
												class: "bs-proof__line"
											}, (0, vue_exports.toDisplayString)(sentence), 1);
										}), 128)),
										line.snapshot.tyre ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, [
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
								(0, vue_exports.createVNode)("div", { class: "bs-sums__row bs-sums__row--tax" }, [(0, vue_exports.createVNode)("dt", null, "darin enthaltene MwSt."), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.order.tax)), 1)])
							])
						]),
						(0, vue_exports.createVNode)("p", { class: "bs-back" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/bestellungen" }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zurück zu den Bestellungen")]),
							_: 1
						})])
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
var Show_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Show_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-190de3a9"]]);
//#endregion
export { Show_default as default };
