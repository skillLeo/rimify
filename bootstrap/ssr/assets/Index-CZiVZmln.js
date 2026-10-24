import { t as AppLayout_default } from "./AppLayout-Bz2_RlPi.js";
import { a as link_default, c as router, i as head_default, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { h as totalNote, u as contactHref } from "./useShopFeedback-w9f5CH_k.js";
import { t as ConditionGroups_default } from "./ConditionGroups-Ce3xN11h.js";
import { t as Icon_default } from "./Icon-GXmbqY1-.js";
import { a as entryLine, i as entryBySize, r as PAPERS_EXEMPT } from "./papers-B4aUsj_q.js";
//#region resources/js/Pages/Bestellung/Index.vue?vue&type=script&setup=true&lang.ts
var FAST_TRIES = 45;
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		order: {},
		lines: {},
		payment: {},
		accountOffer: { type: Boolean },
		invoice: {},
		contact: {},
		demo: { type: Boolean },
		testPurchase: { type: Boolean }
	},
	setup(__props) {
		/**
		* The order confirmation.
		*
		* The verdict shown per line is the FROZEN one from `order_line_fitments`, not a fresh
		* computation. Eleven months from now a customer whose workshop refused the wheels will open this
		* page, and it has to say what they were told on the day — the state, every Auflage in full, the
		* Gutachten number and the revision of the document the answer came from.
		*
		* The order number on the page is the one in the URL: both come from the same row.
		*
		* One page for every width: the positions and the totals stack on a phone and sit side by side
		* from 1200px.
		*
		* A seeded order (`demo`) says so at the top: nobody placed it, and its frozen verdicts are seed
		* data, not a statement about the car it names (ACCURACY.md §3.1 F3). The snapshots themselves
		* are never rewritten (R-12). No carrier is named (D7).
		*
		* It is also where Stripe sends the customer back (Block G), and arriving here pays nothing: only the provider's
		* signed webhook does. Until it has, the page says the payment is being confirmed and asks the server every two
		* seconds — then every fifteen, and says so — and changes its words when the answer changes: paid (the basket is
		* emptied now, not before), declined (back to the Kasse, everything typed still there) or closed.
		*/
		const props = __props;
		const VERDICT_LABEL = {
			PERMITTED: "Freigegeben",
			CONDITIONAL: "Freigegeben mit Auflagen",
			NOT_PERMITTED: "Nicht freigegeben",
			UNKNOWN: "Noch nicht bestätigt"
		};
		const VERDICT_CLASS = {
			PERMITTED: "tag--ok",
			CONDITIONAL: "tag--warn",
			NOT_PERMITTED: "tag--danger",
			UNKNOWN: "tag--unknown"
		};
		function conditionsOf(detail) {
			const raw = detail.conditions;
			if (!Array.isArray(raw)) return [];
			return raw.map((c) => c !== null && typeof c === "object" ? c.textDe : null).filter((text) => typeof text === "string" && text.trim() !== "");
		}
		function documentOf(detail) {
			const doc = detail.document;
			if (doc === null || typeof doc !== "object") return null;
			const number = doc.number;
			return typeof number === "string" && number !== "" ? number : null;
		}
		/** An example document, as the snapshot froze it (D-239): marked here as wherever else it is shown. */
		function exampleOf(detail) {
			const doc = detail.document;
			return doc !== null && typeof doc === "object" && doc.isDemo === true;
		}
		const lines = (0, vue_exports.computed)(() => props.lines.map((line) => ({
			...line,
			conditions: line.verdict ? conditionsOf(line.verdict.detail) : [],
			documentNumber: line.verdict ? documentOf(line.verdict.detail) : null,
			documentExample: line.verdict ? exampleOf(line.verdict.detail) : false
		})));
		const page = usePage();
		const questionHref = (0, vue_exports.computed)(() => props.contact.phone ? `tel:${(props.contact.phoneIntl ?? props.contact.phone).replace(/\s/g, "")}` : contactHref({
			subject: `Bestellung ${props.order.number}`,
			from: page.url
		}));
		const state = (0, vue_exports.computed)(() => props.payment?.state ?? "paid");
		/** Two-second questions for the first ninety seconds, then one every fifteen: the page never stops on its own. */
		const tries = (0, vue_exports.ref)(0);
		const slow = (0, vue_exports.computed)(() => tries.value >= FAST_TRIES);
		let timer = null;
		async function ask() {
			tries.value++;
			try {
				const response = await fetch(`/bestellung/${encodeURIComponent(props.order.number)}/status`, {
					headers: { Accept: "application/json" },
					credentials: "same-origin"
				});
				if (response.ok) {
					const answer = await response.json();
					if (answer.state !== void 0 && answer.state !== state.value) {
						router.reload({ only: ["order", "payment"] });
						return;
					}
				}
			} catch {}
			schedule();
		}
		function schedule() {
			if (props.payment?.poll !== true) return;
			timer = setTimeout(() => void ask(), state.value === "confirming" && !slow.value ? 2e3 : 15e3);
		}
		(0, vue_exports.onMounted)(schedule);
		(0, vue_exports.watch)(state, (now) => {
			if (now !== "paid" || typeof window === "undefined") return;
			try {
				window.sessionStorage.removeItem("rmf.kasse.v1");
			} catch {}
		}, { immediate: true });
		(0, vue_exports.onBeforeUnmount)(() => {
			if (timer !== null) clearTimeout(timer);
		});
		const mailTo = (0, vue_exports.computed)(() => props.payment?.email ?? "deine E-Mail-Adresse");
		const heading = (0, vue_exports.computed)(() => {
			switch (state.value) {
				case "confirming": return "Deine Zahlung wird bestätigt.";
				case "processing": return "Deine Zahlung ist unterwegs.";
				case "failed": return "Die Zahlung hat nicht geklappt.";
				case "closed": return "Diese Bestellung ist nicht mehr offen.";
				default: return "Vielen Dank für deine Bestellung.";
			}
		});
		const lead = (0, vue_exports.computed)(() => {
			switch (state.value) {
				case "confirming": return slow.value ? `Das dauert länger als üblich. Du musst nichts weiter tun: Sobald die Zahlung bestätigt ist, bekommst du eine E-Mail an ${mailTo.value}.` : "Das dauert meist nur ein paar Sekunden – diese Seite aktualisiert sich von selbst. Bezahlt ist deine Bestellung, sobald der Zahlungsdienst sie uns bestätigt.";
				case "processing": return `Bei einer Lastschrift kann die Bestätigung ein paar Tage dauern. Sobald sie da ist, bekommst du eine E-Mail an ${mailTo.value} – erst dann versenden wir.`;
				case "failed": return "Es wurde nichts abgebucht. Deine Angaben und dein Warenkorb sind noch da – versuch es gleich noch einmal, gern auch mit einer anderen Zahlungsart.";
				case "closed": return "Diese Bestellung wurde nicht bezahlt, es wurde nichts abgebucht.";
				default:
					if (props.testPurchase) return props.payment?.mailed ? `Deine Testzahlung ist eingegangen. Die Bestätigung mit AGB und Widerrufsbelehrung haben wir an ${mailTo.value} geschickt – ohne Rechnung, denn es ist ein Testkauf.` : "Deine Testzahlung ist eingegangen. Ein Testkauf bekommt keine Rechnung.";
					return props.payment?.mailed ? `Deine Zahlung ist eingegangen. Die Bestätigung mit Rechnung, AGB und Widerrufsbelehrung haben wir an ${mailTo.value} geschickt. Heb dir die Bestellnummer auf – mit ihr beantworten wir deine Fragen.` : "Heb dir die Bestellnummer auf – mit ihr beantworten wir deine Fragen.";
			}
		});
		const TICK = {
			paid: {
				icon: "check-circle",
				tone: ""
			},
			confirming: {
				icon: "clock",
				tone: "ord__tick--wait"
			},
			processing: {
				icon: "clock",
				tone: "ord__tick--wait"
			},
			failed: {
				icon: "info",
				tone: "ord__tick--bad"
			},
			closed: {
				icon: "info",
				tone: "ord__tick--demo"
			}
		};
		const tick = (0, vue_exports.computed)(() => TICK[state.value] ?? {
			icon: "check-circle",
			tone: ""
		});
		const accountSent = (0, vue_exports.ref)(false);
		const accountBusy = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `Bestellung ${__props.order.number}` }, null, _parent));
			_push(`<section class="section-dense" data-v-75484771><div class="wrap" data-v-75484771>`);
			if (__props.demo && !__props.testPurchase) {
				_push(`<header class="ord__head" data-v-75484771><span class="ord__tick ord__tick--demo" data-v-75484771>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 24
				}, null, _parent));
				_push(`</span><div data-v-75484771><h1 class="t-h1" data-v-75484771>Beispielbestellung</h1><p class="t-lead ord__lead" data-v-75484771><span class="tag tag--unknown ord__demo-tag" data-v-75484771>Demodaten</span> Diese Bestellung stammt aus unseren Beispieldaten – niemand hat sie aufgegeben. Auch die Freigaben unten sind Beispieldaten: Sie sagen nichts darüber aus, ob eine Felge an das genannte Fahrzeug darf. </p></div></header>`);
			} else {
				_push(`<header class="ord__head" data-v-75484771><span class="${(0, server_renderer_exports.ssrRenderClass)([tick.value.tone, "ord__tick"])}" data-v-75484771>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: tick.value.icon,
					size: 24
				}, null, _parent));
				_push(`</span><div role="status" aria-live="polite" class="ord__state" data-v-75484771><h1 class="t-h1" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(heading.value)}</h1><p class="t-lead ord__lead" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(lead.value)}</p>`);
				if (state.value === "failed") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/kasse",
					class: "btn btn--primary ord__retry"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Zurück zur Kasse und noch einmal bezahlen `);
						else return [(0, vue_exports.createTextVNode)(" Zurück zur Kasse und noch einmal bezahlen ")];
					}),
					_: 1
				}, _parent));
				else if (state.value === "closed") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/warenkorb",
					class: "btn btn--secondary ord__retry"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Zum Warenkorb `);
						else return [(0, vue_exports.createTextVNode)(" Zum Warenkorb ")];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				_push(`</div></header>`);
			}
			if (__props.testPurchase) _push(`<p class="ord__lead ord__test-purchase" data-v-75484771><span class="tag tag--unknown ord__demo-tag" data-v-75484771>Demodaten</span> Ein Testkauf mit Beispieldaten: Er bekommt keine Rechnung, zählt in keiner echten Zahl des Shops, und „Zurücksetzen“ nimmt ihn mit allen anderen Beispieldaten wieder heraus. </p>`);
			else _push(`<!---->`);
			_push(`<dl class="ord__facts" data-v-75484771><div data-v-75484771><dt class="micro" data-v-75484771>Bestellnummer</dt><dd class="ord__number" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.number)}</dd></div>`);
			if (__props.order.placedAt) _push(`<div data-v-75484771><dt class="micro" data-v-75484771>Bestellt am</dt><dd class="data" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.placedAt)}</dd></div>`);
			else _push(`<!---->`);
			_push(`<div data-v-75484771><dt class="micro" data-v-75484771>Status</dt><dd data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.statusLabel)}</dd></div>`);
			if (__props.order.vehicleLabel) {
				_push(`<div data-v-75484771><dt class="micro" data-v-75484771>Fahrzeug</dt><dd data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.vehicleLabel)} `);
				if (__props.order.keyNumbers) _push(`<span class="data" data-v-75484771>(${(0, server_renderer_exports.ssrInterpolate)(__props.order.keyNumbers)})</span>`);
				else _push(`<!---->`);
				_push(`</dd></div>`);
			} else _push(`<!---->`);
			_push(`</dl><div class="ord" data-v-75484771><section class="ord__lines" aria-labelledby="ord-lines" data-v-75484771><h2 id="ord-lines" class="t-h2" data-v-75484771>Positionen und Freigaben</h2><p class="t-small quiet ord__frozen" data-v-75484771> Die Freigabe jeder Position ist mit dem Stand vom Bestelltag gespeichert. </p><ul class="ord__list" data-v-75484771><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(lines.value, (line) => {
				_push(`<li class="ord__line" data-v-75484771><div class="ord__line-top" data-v-75484771><div class="ord__line-name" data-v-75484771><p class="ord__kind" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(line.kindLabel)}</p><p class="ord__label" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</p></div><div class="ord__line-price" data-v-75484771><p class="ord__total tabular" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</p><p class="ord__unit tabular" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(line.unitPrice)}</p></div></div>`);
				if (line.verdict) {
					_push(`<div class="ord__verdict" data-v-75484771><p class="ord__verdict-row" data-v-75484771><span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_CLASS[line.verdict.notesOnly ? "PERMITTED" : line.verdict.status] ?? "tag--unknown", "tag"])}" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(VERDICT_LABEL[line.verdict.notesOnly ? "PERMITTED" : line.verdict.status] ?? "Noch nicht bestätigt")}</span><span class="data" data-v-75484771>`);
					if (line.documentNumber) _push(`<!--[-->Gutachten ${(0, server_renderer_exports.ssrInterpolate)(line.documentNumber)} · <!--]-->`);
					else _push(`<!---->`);
					_push(`Fassung ${(0, server_renderer_exports.ssrInterpolate)(line.verdict.documentRevision)}</span>`);
					if (line.documentExample) _push(`<span class="tag tag--unknown" data-v-75484771>Beispieldaten</span>`);
					else _push(`<!---->`);
					_push(`</p>`);
					if ((0, vue_exports.unref)(entryBySize)(line.verdict.conditionGroups?.sizes, line.verdict.papersExempt === true)) _push(`<p class="ord__entry" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(entryBySize)(line.verdict.conditionGroups?.sizes, line.verdict.papersExempt === true))}</p>`);
					else if ((line.verdict.conditionGroups?.entry ?? line.verdict.requiresEntry) && !line.conditions.some((c) => c.includes("Eintragung"))) _push(`<p class="ord__entry" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(entryLine)(true, line.verdict.papersExempt === true))}</p>`);
					else _push(`<!---->`);
					if (line.verdict.papersExempt) _push(`<p class="ord__entry" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PAPERS_EXEMPT))}</p>`);
					else _push(`<!---->`);
					if (line.verdict.rimAloneNote) _push(`<p class="ord__entry" data-rim-alone data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.rimAloneNote)}</p>`);
					else _push(`<!---->`);
					if (line.verdict.conditionGroups && line.conditions.length) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
						class: "ord__groups",
						groups: line.verdict.conditionGroups
					}, null, _parent));
					else if (line.conditions.length) {
						_push(`<ul class="ord__conditions" data-v-75484771><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.conditions, (condition) => {
							_push(`<li data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
						});
						_push(`<!--]--></ul>`);
					} else _push(`<!---->`);
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]--></ul></section><aside class="ord__side" data-v-75484771><div class="card" data-v-75484771><h2 class="t-h3" data-v-75484771>Summe</h2><dl class="sum" data-v-75484771><div class="sum__row" data-v-75484771><dt data-v-75484771>Zwischensumme</dt><dd class="tabular" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.subtotal)}</dd></div><div class="sum__row" data-v-75484771><dt data-v-75484771>Versand</dt><dd class="tabular" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.shipping)}</dd></div><div class="sum__row sum__row--total" data-v-75484771><dt data-v-75484771>Gesamt</dt><dd class="tabular" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.total)}</dd></div></dl><p class="price-legal" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(totalNote)(__props.order.smallBusiness === true, __props.order.tax, false))}</p>`);
			if (__props.invoice) _push(`<a class="ord__invoice"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.invoice.href)} target="_blank" rel="noopener" data-v-75484771> Rechnung ${(0, server_renderer_exports.ssrInterpolate)(__props.invoice.number)} herunterladen </a>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (__props.accountOffer) {
				_push(`<div class="ord__account" data-v-75484771>`);
				if (!accountSent.value) _push(`<!--[--><h2 class="t-h3" data-v-75484771>Konto anlegen?</h2><p class="t-small ord__account-text" data-v-75484771> Wir schicken dir einen Link an ${(0, server_renderer_exports.ssrInterpolate)(__props.payment?.email ?? "deine E-Mail-Adresse")}, mit dem du dein Passwort festlegst – dann siehst du deine Bestellungen, Freigaben und Rechnungen jederzeit. </p><button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(accountBusy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", accountBusy.value ? "true" : void 0)} data-v-75484771> Konto anlegen </button><!--]-->`);
				else _push(`<p class="t-small ord__account-text" role="status" data-v-75484771> Der Link ist unterwegs. Mit ihm legst du dein Passwort fest. </p>`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`<ul class="ord__next" data-v-75484771><li class="ord__next-row" data-v-75484771>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "truck",
				size: 20
			}, null, _parent));
			_push(`<div data-v-75484771><p class="ord__next-title" data-v-75484771>Bestellung verfolgen</p>`);
			if (__props.order.trackingCode) _push(`<p class="ord__next-text" data-v-75484771> Sendungsnummer <span class="data" data-v-75484771>${(0, server_renderer_exports.ssrInterpolate)(__props.order.trackingCode)}</span></p>`);
			else _push(`<p class="ord__next-text" data-v-75484771> Die Sendungsnummer steht hier, sobald dein Paket unterwegs ist. </p>`);
			_push(`</div></li><li data-v-75484771>`);
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(__props.contact.phone ? "a" : (0, vue_exports.unref)(link_default)), {
				class: "ord__next-row ord__next-link",
				href: questionHref.value
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: __props.contact.phone ? "phone" : "mail",
							size: 20
						}, null, _parent, _scopeId));
						_push(`<div data-v-75484771${_scopeId}><p class="ord__next-title" data-v-75484771${_scopeId}>Fragen zur Bestellung</p><p class="ord__next-text" data-v-75484771${_scopeId}>`);
						if (__props.contact.phone) _push(`<span class="tabular" data-v-75484771${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phone)}</span>`);
						else _push(`<span data-v-75484771${_scopeId}>Schreib uns</span>`);
						_push(` · ${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</p></div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "chevron-right",
							size: 20
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)(Icon_default, {
							name: __props.contact.phone ? "phone" : "mail",
							size: 20
						}, null, 8, ["name"]),
						(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("p", { class: "ord__next-title" }, "Fragen zur Bestellung"), (0, vue_exports.createVNode)("p", { class: "ord__next-text" }, [__props.contact.phone ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "tabular"
						}, (0, vue_exports.toDisplayString)(__props.contact.phone), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, "Schreib uns")), (0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(__props.contact.hours), 1)])]),
						(0, vue_exports.createVNode)(Icon_default, {
							name: "chevron-right",
							size: 20
						})
					];
				}),
				_: 1
			}), _parent);
			_push(`</li></ul></aside></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Bestellung/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Bestellung/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-75484771"]]);
//#endregion
export { Index_default as default };
