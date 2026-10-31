import { T as useShared, c as contactHref, f as priceTerms, p as totalNote } from "./useShopFeedback-kwWPjrW3.js";
import { a as link_default, c as router, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ConditionGroups_default } from "./ConditionGroups-hTR45EJ5.js";
import { t as AppLayout_default } from "./AppLayout-Dgveskj-.js";
import { t as Icon_default } from "./Icon-GXmbqY1-.js";
import { a as entryLine } from "./papers-B4aUsj_q.js";
import { t as VerdictBadge_default } from "./VerdictBadge-Bpw_FqPS.js";
//#region resources/js/composables/useStripe.ts
var STRIPE_JS = "https://js.stripe.com/v3/";
var loading = null;
/** Resolves with Stripe's factory once js.stripe.com has answered; rejects when it is blocked or offline. */
function loadStripe() {
	if (typeof window === "undefined") return Promise.reject(/* @__PURE__ */ new Error("Stripe.js runs in the browser only."));
	if (window.Stripe) return Promise.resolve(window.Stripe);
	loading ??= new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = STRIPE_JS;
		script.async = true;
		script.onload = () => window.Stripe ? resolve(window.Stripe) : reject(/* @__PURE__ */ new Error("Stripe.js did not load."));
		script.onerror = () => {
			loading = null;
			script.remove();
			reject(/* @__PURE__ */ new Error("Stripe.js could not be reached."));
		};
		document.head.appendChild(script);
	});
	return loading;
}
/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the payment endpoint checks. */
function xsrfToken() {
	const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(typeof document === "undefined" ? "" : document.cookie);
	return match?.[1] ? decodeURIComponent(match[1]) : "";
}
/** The design tokens, as the concrete values Stripe's Appearance API needs (it cannot read CSS variables). */
function stripeAppearance() {
	const css = getComputedStyle(document.documentElement);
	const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
	return {
		theme: "stripe",
		variables: {
			colorPrimary: token("--blue", "#1f4fd1"),
			colorText: token("--ink", "#14171c"),
			colorTextSecondary: token("--ink2", "#4a525e"),
			colorDanger: token("--danger", "#b3261e"),
			colorBackground: token("--surface", "#ffffff"),
			fontFamily: token("--sans", "system-ui, sans-serif"),
			borderRadius: token("--radius-sm", "4px"),
			spacingUnit: "4px"
		}
	};
}
//#endregion
//#region resources/js/Pages/Kasse/Index.vue?vue&type=script&setup=true&lang.ts
var TPMS_UNANSWERED = "Bitte sag uns noch, ob du RDKS-Sensoren brauchst.";
var ZIP_ERROR = "Eine deutsche PLZ hat fünf Ziffern.";
/** One field's error, or null — the same sentences the server answers with (PlaceOrderRequest). */
var STORAGE_KEY = "rmf.kasse.v1";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		lines: {},
		totals: {},
		contact: {},
		orderRefusal: {},
		sandbox: { type: Boolean },
		payment: {},
		shown: {},
		deliveryTime: {}
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
		* `orderRefusal` is the sentence the server answers a submission with — a demo line, an
		* unconfigured shipping price or delivery time, or no payment yet. It is shown above the final
		* button, which stays disabled while it stands. No carrier is named: none is confirmed (D7).
		*
		* Paying (Block G). With Stripe in force the third step mounts Stripe's Express Checkout (Apple Pay,
		* Google Pay — its place is reserved at the top) and the Payment Element; Stripe.js is fetched from
		* js.stripe.com only here. „Zahlungspflichtig bestellen“ checks the element, asks the server — which
		* decides everything again, writes the order and creates the payment at its own total — and then
		* confirms in the browser. A decline is answered on this page, everything typed still here; the order
		* is paid only when Stripe's signed webhook says so, and the basket is emptied only then.
		*
		* What was typed is kept in this tab (sessionStorage) until the order is paid, so a reload, a 3-D
		* Secure detour or a declined card never loses it. Fields are checked when they are left, never
		* while typing. The PLZ offers its Ort (GeoNames); nothing typed is ever overwritten.
		*/
		const props = __props;
		const shared = useShared();
		const terms = (0, vue_exports.computed)(() => priceTerms(shared.value.smallBusiness === true));
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
		const formEl = (0, vue_exports.ref)(null);
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
		/** „Rechnung an eine andere Adresse“ — an unchecked box; the server still speaks of `billingSame`. */
		const billingOther = (0, vue_exports.computed)({
			get: () => !form.billingSame,
			set: (other) => {
				form.billingSame = !other;
			}
		});
		const REQUIRED = [
			["email", "Bitte gib deine E-Mail-Adresse an."],
			["name", "Bitte gib deinen Vor- und Nachnamen an."],
			["street", "Bitte gib die Straße an."],
			["houseNumber", "Bitte gib die Hausnummer an."],
			["zip", "Bitte gib die PLZ an."],
			["city", "Bitte gib den Ort an."]
		];
		const BILLING_REQUIRED = [
			["billingName", "Bitte gib den Namen für die Rechnung an."],
			["billingStreet", "Bitte gib die Straße an."],
			["billingHouseNumber", "Bitte gib die Hausnummer an."],
			["billingZip", "Bitte gib die PLZ an."],
			["billingCity", "Bitte gib den Ort an."]
		];
		function fieldError(key) {
			const rule = [...REQUIRED, ...BILLING_REQUIRED].find(([k]) => k === key);
			const value = String(form[key]).trim();
			if (rule && value === "") return rule[1];
			if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(value)) return "Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.";
			if ((key === "zip" || key === "billingZip") && !/^\d{5}$/.test(value)) return ZIP_ERROR;
			return null;
		}
		function splitHouseNumber(key) {
			const numberKey = key === "street" ? "houseNumber" : "billingHouseNumber";
			const match = /^(.*\D)\s+(\d+\s?[a-zA-Z]?(?:\s?[-/]\s?\d+\s?[a-zA-Z]?)?)$/.exec(form[key].trim());
			if (match?.[1] && match[2] && form[numberKey].trim() === "") {
				form[key] = match[1].trim();
				form[numberKey] = match[2].replace(/\s+/g, "");
				delete errors[numberKey];
			}
		}
		/** Checks the address step. Errors name the fix, and the first broken field takes the focus. */
		function validateAddress() {
			for (const key of Object.keys(errors)) delete errors[key];
			splitHouseNumber("street");
			if (!form.billingSame) splitHouseNumber("billingStreet");
			const rules = form.billingSame ? REQUIRED : [...REQUIRED, ...BILLING_REQUIRED];
			for (const [key] of rules) {
				const message = fieldError(key);
				if (message !== null) errors[key] = message;
			}
			const first = Object.keys(errors)[0];
			if (first !== void 0) {
				(0, vue_exports.nextTick)(() => formEl.value?.querySelector(`[data-key="${first}"]`)?.focus());
				return false;
			}
			return true;
		}
		function goTo(target) {
			step.value = target;
			(0, vue_exports.nextTick)(() => formEl.value?.querySelector("[data-step-title]")?.focus());
		}
		/** Refuses the step without an RDKS answer, in the server's words, and puts the question in focus. */
		function validateOptions() {
			delete errors.rdks;
			if (tpmsApplicable.value && tpms.value?.choice === null) {
				errors.rdks = TPMS_UNANSWERED;
				(0, vue_exports.nextTick)(() => formEl.value?.querySelector("[data-key=\"rdks\"]")?.focus());
				return false;
			}
			return true;
		}
		/** The server's answer to a submission: why the order was not placed. */
		const serverRefusal = (0, vue_exports.ref)(null);
		/** A press is on its way: the button waits, and a second press does nothing (the server reuses the order too). */
		const paying = (0, vue_exports.ref)(false);
		/** Stripe's own sentence for a declined or unfinished payment, in German (the Elements' locale). */
		const payError = (0, vue_exports.ref)(null);
		/** The form as the server takes it. The RDKS answer travels only where the question was asked (§5.3). */
		function payload() {
			return tpmsApplicable.value ? {
				...form,
				rdks: tpms.value?.choice ?? null
			} : { ...form };
		}
		/** The whole checkout, checked one last time before anything leaves the page. */
		function readyToOrder() {
			if (!validateAddress()) {
				goTo(1);
				return false;
			}
			if (!validateOptions()) {
				goTo(2);
				return false;
			}
			return !props.orderRefusal;
		}
		/** A server's refusal on the page: the sentence above the button, form errors on their fields. */
		function showRefusal(failed) {
			serverRefusal.value = failed.order ?? null;
			for (const [key, message] of Object.entries(failed)) if (key !== "order") errors[key] = message;
			if (failed.rdks) goTo(2);
			else if (Object.keys(failed).some((key) => key !== "order")) goTo(1);
		}
		const expressEl = (0, vue_exports.ref)(null);
		const paymentEl = (0, vue_exports.ref)(null);
		const stripeReady = (0, vue_exports.ref)(false);
		/** Express Checkout offers nothing on this device: its reserved place folds away. */
		const expressEmpty = (0, vue_exports.ref)(false);
		const stripeFailed = (0, vue_exports.ref)(false);
		let stripe = null;
		let elements = null;
		let mounted = [];
		/** Asks the server for the order and its payment; the answer is a client secret, or a sentence why not. */
		async function startPayment() {
			const response = await fetch("/kasse/zahlung", {
				method: "POST",
				credentials: "same-origin",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-Requested-With": "XMLHttpRequest",
					"X-XSRF-TOKEN": xsrfToken()
				},
				body: JSON.stringify({
					...payload(),
					shown: props.shown ?? ""
				})
			});
			const body = await response.json().catch(() => ({}));
			if (response.ok && typeof body.clientSecret === "string" && typeof body.returnUrl === "string") return {
				clientSecret: body.clientSecret,
				returnUrl: body.returnUrl
			};
			if (response.status === 422 && body.errors && typeof body.errors === "object") {
				const failed = {};
				for (const [key, messages] of Object.entries(body.errors)) failed[key] = Array.isArray(messages) ? String(messages[0]) : String(messages);
				showRefusal(failed);
				return null;
			}
			serverRefusal.value = typeof body.refusal === "string" ? body.refusal : "Bezahlen ist gerade nicht möglich. Es wurde nichts abgebucht. Versuch es bitte in ein paar Minuten noch einmal.";
			if (body.reload === true) router.reload({ only: [
				"lines",
				"totals",
				"orderRefusal",
				"shown",
				"deliveryTime"
			] });
			return null;
		}
		async function confirm(clientSecret, returnUrl) {
			if (!stripe || !elements) return;
			const { error } = await stripe.confirmPayment({
				elements,
				clientSecret,
				confirmParams: { return_url: new URL(returnUrl, window.location.origin).href }
			});
			payError.value = error?.message ?? "Die Zahlung wurde nicht abgeschlossen. Es wurde nichts abgebucht. Versuch es noch einmal oder wähle eine andere Zahlungsart.";
		}
		async function mountStripe() {
			if (!props.payment || elements !== null || !paymentEl.value) return;
			try {
				stripe ??= (await loadStripe())(props.payment.publishableKey, { locale: "de" });
				stripeFailed.value = false;
			} catch {
				stripeFailed.value = true;
				return;
			}
			if (step.value !== 3 || !paymentEl.value || elements !== null) return;
			elements = stripe.elements({
				mode: "payment",
				amount: props.totals.totalCents,
				currency: "eur",
				locale: "de",
				appearance: stripeAppearance()
			});
			const paymentElement = elements.create("payment", { layout: {
				type: "accordion",
				defaultCollapsed: false
			} });
			paymentElement.on("ready", () => {
				stripeReady.value = true;
			});
			paymentElement.mount(paymentEl.value);
			mounted.push(paymentElement);
			if (expressEl.value) {
				const express = elements.create("expressCheckout", {
					buttonHeight: 48,
					buttonType: {
						applePay: "buy",
						googlePay: "buy"
					}
				});
				express.on("ready", (event) => {
					const methods = event.availablePaymentMethods;
					expressEmpty.value = !methods || !Object.values(methods).some(Boolean);
				});
				express.on("click", (event) => {
					if (readyToOrder()) event.resolve();
				});
				express.on("confirm", (event) => {
					(async () => {
						paying.value = true;
						payError.value = null;
						try {
							const started = (elements ? await elements.submit() : { error: { message: void 0 } }).error ? null : await startPayment();
							if (started) await confirm(started.clientSecret, started.returnUrl);
							else event.paymentFailed({ reason: "fail" });
						} finally {
							paying.value = false;
						}
					})();
				});
				express.mount(expressEl.value);
				mounted.push(express);
			}
		}
		(0, vue_exports.watch)(() => props.totals.totalCents, (amount) => elements?.update({ amount }));
		function unmountStripe() {
			for (const element of mounted) element.destroy();
			mounted = [];
			elements = null;
			stripeReady.value = false;
			expressEmpty.value = false;
		}
		(0, vue_exports.watch)(step, (now) => {
			if (now === 3 && props.payment && !props.orderRefusal) (0, vue_exports.nextTick)(() => void mountStripe());
			else unmountStripe();
		});
		(0, vue_exports.onBeforeUnmount)(unmountStripe);
		(0, vue_exports.onMounted)(() => {
			try {
				const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
				if (saved && typeof saved === "object") {
					for (const key of Object.keys(form)) if (typeof saved[key] === typeof form[key]) Object.assign(form, { [key]: saved[key] });
				}
			} catch {}
		});
		(0, vue_exports.watch)(form, () => {
			try {
				window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
			} catch {}
		}, { deep: true });
		const places = (0, vue_exports.reactive)({
			zip: [],
			billingZip: []
		});
		async function lookUp(zipKey) {
			const cityKey = zipKey === "zip" ? "city" : "billingCity";
			const plz = form[zipKey].trim();
			places[zipKey] = [];
			if (!/^\d{5}$/.test(plz)) return;
			try {
				const response = await fetch(`/api/v1/plz/${plz}`, { headers: { Accept: "application/json" } });
				const found = response.ok ? (await response.json()).places ?? [] : [];
				if (form[zipKey].trim() !== plz) return;
				const typing = document.activeElement?.id === (zipKey === "zip" ? "ko-city" : "ko-b-city");
				if (found.length === 1 && form[cityKey].trim() === "" && !typing) {
					form[cityKey] = found[0] ?? "";
					delete errors[cityKey];
				} else if (found.length > 1 && !found.includes(form[cityKey].trim())) places[zipKey] = found.slice(0, 6);
			} catch {}
		}
		(0, vue_exports.watch)(() => form.zip, () => void lookUp("zip"));
		(0, vue_exports.watch)(() => form.billingZip, () => void lookUp("billingZip"));
		const letters = (0, vue_exports.reactive)({
			houseNumber: false,
			billingHouseNumber: false
		});
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
		/** The server's sentence; a page rendered before it existed falls back to the label and the Eintragung. */
		function verdictSentence(line) {
			const verdict = line.verdict;
			if (!verdict) return "";
			const entry = entryLine(verdict.requiresEntry, verdict.papersExempt === true);
			return verdict.sentence ?? `${verdict.label}.${entry ? ` ${entry}` : ""}`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kasse" }, null, _parent));
			_push(`<section class="section-dense" data-v-8c945a67><div class="wrap" data-v-8c945a67><h1 class="t-h1" data-v-8c945a67>Kasse</h1>`);
			if (__props.payment?.testMode) _push(`<p class="ko__testmode" role="note" data-v-8c945a67>Testmodus – es wird kein Geld abgebucht.</p>`);
			else _push(`<!---->`);
			if (__props.lines.length === 0) {
				_push(`<div class="state" data-v-8c945a67>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "cart",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-8c945a67>Dein Warenkorb ist noch leer.</p><p class="t-body" data-v-8c945a67>Wähle dein Fahrzeug und lege eine Felge in den Warenkorb – dann geht es hier weiter.</p>`);
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
				_push(`<div class="state" data-v-8c945a67>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-8c945a67>Eine Position im Warenkorb kann so nicht bestellt werden.</p><p class="t-body" data-v-8c945a67> Im Warenkorb siehst du, welche es ist und warum. </p>`);
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
				_push(`<!--[--><ol class="steps ko__steps" aria-label="Fortschritt" data-v-8c945a67><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(STEPS, (item) => {
					_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{
						"steps__item--done": item.n < step.value,
						"steps__item--on": item.n === step.value
					}, "steps__item"])}"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", item.n === step.value ? "step" : void 0)} data-v-8c945a67><span class="steps__num" data-v-8c945a67>`);
					if (item.n < step.value) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "check",
						size: 20
					}, null, _parent));
					else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(item.n)}<!--]-->`);
					_push(`</span> ${(0, server_renderer_exports.ssrInterpolate)(item.label)}</li>`);
				});
				_push(`<!--]--></ol><div class="ko" data-v-8c945a67><aside class="card ko__sum" aria-labelledby="ko-sum-title" data-v-8c945a67><button class="ko__sum-toggle" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", summaryOpen.value)} aria-controls="ko-sum-body" data-v-8c945a67><span data-v-8c945a67>Bestellung ansehen</span><span class="ko__sum-total tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</span><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "ko__chev--open": summaryOpen.value }, "ko__chev"])}" data-v-8c945a67>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "chevron-down",
					size: 20
				}, null, _parent));
				_push(`</span></button><div id="ko-sum-body" class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-open": summaryOpen.value }, "ko__sum-body"])}" data-v-8c945a67><h2 id="ko-sum-title" class="t-h3 ko__sum-title" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(step.value === 3 ? "Summe" : "Deine Bestellung")}</h2>`);
				if (vehicle.value) _push(`<p class="t-small ko__sum-car" data-v-8c945a67>Geprüft für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)} <span class="data" data-v-8c945a67>(${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? vehicle.value.keyNumbers)})</span></p>`);
				else _push(`<!---->`);
				if (step.value < 3) {
					_push(`<ul class="ko__lines" data-v-8c945a67><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
						_push(`<li class="ko__line" data-v-8c945a67><div class="ko__line-top" data-v-8c945a67><span class="ko__line-name" data-v-8c945a67><span class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} ×</span> ${(0, server_renderer_exports.ssrInterpolate)(line.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(line.title)}</span><span class="ko__line-price tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</span></div><p class="ko__line-sub" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.subtitle)}`);
						if (line.sizeLabel) _push(`<!--[--> · <span class="data" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.sizeLabel)}</span><!--]-->`);
						else _push(`<!---->`);
						_push(`</p>`);
						if (line.demo !== false) _push(`<p class="ko__line-flag" data-v-8c945a67><span class="tag tag--unknown" data-v-8c945a67>Beispielsortiment</span></p>`);
						else _push(`<!---->`);
						if (line.verdict) {
							_push(`<!--[--><p class="ko__verdict" data-v-8c945a67>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
								status: line.verdict.status,
								"notes-only": line.verdict.notesOnly === true
							}, null, _parent));
							_push(` <span data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(verdictSentence(line))}</span></p>`);
							if (line.verdict.rimAloneNote) _push(`<p class="ko__rim" data-rim-alone data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.rimAloneNote)}</p>`);
							else _push(`<!---->`);
							if (line.verdict.conditions.length) {
								_push(`<details class="ko__auflagen" data-v-8c945a67><summary data-v-8c945a67>Auflagen lesen</summary>`);
								if (line.verdict.conditionGroups) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
									class: "ko__groups",
									groups: line.verdict.conditionGroups
								}, null, _parent));
								else {
									_push(`<ul class="ko__conditions" data-v-8c945a67><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(line.verdict.conditions, (condition) => {
										_push(`<li data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
									});
									_push(`<!--]--></ul>`);
								}
								_push(`</details>`);
							} else _push(`<!---->`);
							_push(`<!--]-->`);
						} else _push(`<!---->`);
						if (line.isSet && line.components && line.components.length > 1) {
							_push(`<dl class="ko__parts" aria-label="Bestandteile des Komplettrads" data-v-8c945a67><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(line.components, (part) => {
								_push(`<div class="ko__part" data-v-8c945a67><dt data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(part.label)}</dt><dd class="${(0, server_renderer_exports.ssrRenderClass)({ "ko__part--open": part.open })}" data-v-8c945a67><span class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(part.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(part.unitPrice)}</span></dd></div>`);
							});
							_push(`<!--]--></dl>`);
						} else _push(`<!---->`);
						_push(`</li>`);
					});
					_push(`<!--]-->`);
					if (tpms.value && tpms.value.choice === "ja") _push(`<li class="ko__line ko__line--tpms" data-v-8c945a67><div class="ko__line-top" data-v-8c945a67><span class="ko__line-name" data-v-8c945a67>RDKS-Sensoren (${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)})</span><span class="ko__line-price tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.total)}</span></div></li>`);
					else _push(`<!---->`);
					_push(`</ul>`);
				} else _push(`<!---->`);
				_push(`<dl class="sum" data-v-8c945a67><div class="sum__row" data-v-8c945a67><dt data-v-8c945a67>Zwischensumme</dt><dd class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.subtotal)}</dd></div><div class="sum__row" data-v-8c945a67><dt data-v-8c945a67>Versand</dt><dd class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(shippingLabel.value)}</dd></div><div class="sum__row sum__row--total" data-v-8c945a67><dt data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(shippingOpen.value ? "Summe ohne Versand" : "Gesamt")}</dt><dd class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</dd></div></dl><p class="price-legal" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(totalNote)(terms.value.smallBusiness, __props.totals.tax, shippingOpen.value))}</p></div></aside><form class="ko__form" novalidate data-v-8c945a67>`);
				if (step.value === 1) {
					_push(`<!--[--><h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title data-v-8c945a67>Adresse</h2><p class="field-help" data-v-8c945a67><span class="field-label__req" data-v-8c945a67>*</span> Pflichtfeld</p><fieldset class="ko__group" data-v-8c945a67><legend class="t-h3" data-v-8c945a67>Kontakt</legend><div class="ko__grid" data-v-8c945a67><div class="ko__half" data-v-8c945a67><label class="field-label" for="ko-mail" data-v-8c945a67> E-Mail <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", form.email)} data-key="email" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.email }, "field"])}" type="email" inputmode="email" autocomplete="email" aria-describedby="ko-mail-help ko-mail-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.email ? "true" : void 0)} data-v-8c945a67><p id="ko-mail-help" class="field-help" data-v-8c945a67> An diese Adresse schicken wir dir die Bestellbestätigung. </p><span id="ko-mail-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.email ?? "")}</span></div><div class="ko__half" data-v-8c945a67><label class="field-label" for="ko-tel" data-v-8c945a67>Telefon</label><input id="ko-tel"${(0, server_renderer_exports.ssrRenderAttr)("value", form.phone)} class="field" type="tel" inputmode="tel" autocomplete="tel" aria-describedby="ko-tel-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.phone ? "true" : void 0)} data-v-8c945a67><span id="ko-tel-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.phone ?? "")}</span></div></div></fieldset><fieldset class="ko__group" data-v-8c945a67><legend class="t-h3" data-v-8c945a67>Lieferadresse</legend><div class="ko__grid" data-v-8c945a67><div class="ko__wide" data-v-8c945a67><label class="field-label" for="ko-name" data-v-8c945a67> Vor- und Nachname <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.name)} data-key="name" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.name }, "field"])}" autocomplete="shipping name" aria-describedby="ko-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.name ? "true" : void 0)} data-v-8c945a67><span id="ko-name-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.name ?? "")}</span></div><div class="ko__street" data-v-8c945a67><label class="field-label" for="ko-street" data-v-8c945a67> Straße <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-street"${(0, server_renderer_exports.ssrRenderAttr)("value", form.street)} data-key="street" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.street }, "field"])}" autocomplete="shipping address-line1" aria-describedby="ko-street-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.street ? "true" : void 0)} data-v-8c945a67><span id="ko-street-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.street ?? "")}</span></div><div class="ko__nr" data-v-8c945a67><label class="field-label" for="ko-nr" data-v-8c945a67> Hausnummer <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-nr"${(0, server_renderer_exports.ssrRenderAttr)("value", form.houseNumber)} data-key="houseNumber" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.houseNumber }, "field"])}"${(0, server_renderer_exports.ssrRenderAttr)("inputmode", letters.houseNumber ? "text" : "numeric")} autocomplete="off" aria-describedby="ko-nr-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.houseNumber ? "true" : void 0)} data-v-8c945a67>`);
					if (!letters.houseNumber) _push(`<button class="ko__letters" type="button" data-v-8c945a67> Buchstaben eingeben, z. B. 12a </button>`);
					else _push(`<!---->`);
					_push(`<span id="ko-nr-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.houseNumber ?? "")}</span></div><div class="ko__zip" data-v-8c945a67><label class="field-label" for="ko-zip" data-v-8c945a67> PLZ <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-zip"${(0, server_renderer_exports.ssrRenderAttr)("value", form.zip)} data-key="zip" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.zip }, "field tabular"])}" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="shipping postal-code" aria-describedby="ko-zip-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.zip ? "true" : void 0)} data-v-8c945a67><span id="ko-zip-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.zip ?? "")}</span></div><div class="ko__city" data-v-8c945a67><label class="field-label" for="ko-city" data-v-8c945a67> Ort <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-city"${(0, server_renderer_exports.ssrRenderAttr)("value", form.city)} data-key="city" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.city }, "field"])}" autocomplete="shipping address-level2" aria-describedby="ko-city-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.city ? "true" : void 0)} data-v-8c945a67>`);
					if (places.zip.length) {
						_push(`<div class="ko__places" role="group" aria-label="Orte zu dieser PLZ" data-v-8c945a67><span class="label ko__places-lead" data-v-8c945a67>Zu ${(0, server_renderer_exports.ssrInterpolate)(form.zip)} gehören:</span><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(places.zip, (place) => {
							_push(`<button class="ko__place" type="button" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(place)}</button>`);
						});
						_push(`<!--]--><span class="ko__source" data-v-8c945a67>Orte nach GeoNames (CC BY 4.0)</span></div>`);
					} else _push(`<!---->`);
					_push(`<span id="ko-city-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.city ?? "")}</span></div><div class="ko__wide" data-v-8c945a67><span class="field-label" data-v-8c945a67>Land</span><p class="ko__static" data-v-8c945a67>Deutschland</p></div></div></fieldset><fieldset class="ko__group" data-v-8c945a67><legend class="t-h3" data-v-8c945a67>Rechnungsadresse</legend><label class="ko__check" data-v-8c945a67><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(billingOther.value) ? (0, server_renderer_exports.ssrLooseContain)(billingOther.value, null) : billingOther.value) ? " checked" : ""} type="checkbox" data-v-8c945a67><span data-v-8c945a67>Andere Rechnungsadresse</span></label>`);
					if (billingOther.value) {
						_push(`<div class="ko__grid ko__billing" data-v-8c945a67><div class="ko__wide" data-v-8c945a67><label class="field-label" for="ko-b-name" data-v-8c945a67> Vor- und Nachname <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-b-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingName)} data-key="billingName" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingName }, "field"])}" autocomplete="billing name"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingName ? "true" : void 0)} aria-describedby="ko-b-name-err" data-v-8c945a67><span id="ko-b-name-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.billingName ?? "")}</span></div><div class="ko__street" data-v-8c945a67><label class="field-label" for="ko-b-street" data-v-8c945a67> Straße <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-b-street"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingStreet)} data-key="billingStreet" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingStreet }, "field"])}" autocomplete="billing address-line1"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingStreet ? "true" : void 0)} aria-describedby="ko-b-street-err" data-v-8c945a67><span id="ko-b-street-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.billingStreet ?? "")}</span></div><div class="ko__nr" data-v-8c945a67><label class="field-label" for="ko-b-nr" data-v-8c945a67> Hausnummer <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-b-nr"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingHouseNumber)} data-key="billingHouseNumber" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingHouseNumber }, "field"])}"${(0, server_renderer_exports.ssrRenderAttr)("inputmode", letters.billingHouseNumber ? "text" : "numeric")} autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingHouseNumber ? "true" : void 0)} aria-describedby="ko-b-nr-err" data-v-8c945a67>`);
						if (!letters.billingHouseNumber) _push(`<button class="ko__letters" type="button" data-v-8c945a67> Buchstaben eingeben, z. B. 12a </button>`);
						else _push(`<!---->`);
						_push(`<span id="ko-b-nr-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.billingHouseNumber ?? "")}</span></div><div class="ko__zip" data-v-8c945a67><label class="field-label" for="ko-b-zip" data-v-8c945a67> PLZ <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-b-zip"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingZip)} data-key="billingZip" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingZip }, "field tabular"])}" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="billing postal-code"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingZip ? "true" : void 0)} aria-describedby="ko-b-zip-err" data-v-8c945a67><span id="ko-b-zip-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.billingZip ?? "")}</span></div><div class="ko__city" data-v-8c945a67><label class="field-label" for="ko-b-city" data-v-8c945a67> Ort <span class="field-label__req" data-v-8c945a67>*</span></label><input id="ko-b-city"${(0, server_renderer_exports.ssrRenderAttr)("value", form.billingCity)} data-key="billingCity" class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.billingCity }, "field"])}" autocomplete="billing address-level2"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.billingCity ? "true" : void 0)} aria-describedby="ko-b-city-err" data-v-8c945a67>`);
						if (places.billingZip.length) {
							_push(`<div class="ko__places" role="group" aria-label="Orte zu dieser PLZ" data-v-8c945a67><span class="label ko__places-lead" data-v-8c945a67>Zu ${(0, server_renderer_exports.ssrInterpolate)(form.billingZip)} gehören:</span><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(places.billingZip, (place) => {
								_push(`<button class="ko__place" type="button" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(place)}</button>`);
							});
							_push(`<!--]--><span class="ko__source" data-v-8c945a67>Orte nach GeoNames (CC BY 4.0)</span></div>`);
						} else _push(`<!---->`);
						_push(`<span id="ko-b-city-err" class="field-error" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.billingCity ?? "")}</span></div></div>`);
					} else _push(`<!---->`);
					_push(`</fieldset><div class="ko__actions" data-v-8c945a67><button class="btn btn--primary btn--lg" type="submit" data-v-8c945a67>Weiter zu Optionen &amp; Versand</button></div><!--]-->`);
				} else {
					_push(`<!--[--><dl class="ko__recap" data-v-8c945a67><div class="ko__recap-row" data-v-8c945a67><dt class="micro" data-v-8c945a67>Lieferadresse</dt><dd data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(form.name)}, ${(0, server_renderer_exports.ssrInterpolate)(form.street)} ${(0, server_renderer_exports.ssrInterpolate)(form.houseNumber)}, <span class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(form.zip)}</span> ${(0, server_renderer_exports.ssrInterpolate)(form.city)} <span class="ko__recap-mail" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(form.email)}</span>`);
					if (billingOther.value) _push(`<span class="ko__recap-mail" data-v-8c945a67> Rechnung: ${(0, server_renderer_exports.ssrInterpolate)(form.billingName)}, ${(0, server_renderer_exports.ssrInterpolate)(form.billingStreet)} ${(0, server_renderer_exports.ssrInterpolate)(form.billingHouseNumber)}, <span class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(form.billingZip)}</span> ${(0, server_renderer_exports.ssrInterpolate)(form.billingCity)}</span>`);
					else _push(`<!---->`);
					_push(`</dd><button class="btn btn--quiet ko__change" type="button" data-v-8c945a67> Ändern<span class="visually-hidden" data-v-8c945a67> (Adresse)</span></button></div>`);
					if (step.value === 3) {
						_push(`<div class="ko__recap-row" data-v-8c945a67><dt class="micro" data-v-8c945a67>Optionen &amp; Versand</dt><dd data-v-8c945a67> Standardversand · <span class="${(0, server_renderer_exports.ssrRenderClass)({ tabular: !shippingOpen.value })}" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(shippingLabel.value)}</span>`);
						if (tpmsApplicable.value && tpms.value) {
							_push(`<span class="ko__recap-line" data-v-8c945a67>`);
							if (tpms.value.choice === "ja") _push(`<!--[--> RDKS-Sensoren · <span class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)}</span><!--]-->`);
							else _push(`<!--[-->Ohne RDKS-Sensoren<!--]-->`);
							_push(`</span>`);
						} else _push(`<!---->`);
						_push(`</dd><button class="btn btn--quiet ko__change" type="button" data-v-8c945a67> Ändern<span class="visually-hidden" data-v-8c945a67> (Optionen &amp; Versand)</span></button></div>`);
					} else _push(`<!---->`);
					_push(`</dl>`);
					if (step.value === 2) {
						_push(`<!--[--><h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title data-v-8c945a67>Optionen &amp; Versand</h2>`);
						if (tpmsApplicable.value && tpms.value) {
							_push(`<fieldset class="ko__group ko__rdks" data-v-8c945a67><legend class="t-h3" data-v-8c945a67>Reifendruck-Sensoren (RDKS)</legend><p id="ko-rdks-q" class="ko__rdks-q" data-v-8c945a67>Brauchst du RDKS-Sensoren?</p><p class="t-small ko__rdks-help" data-v-8c945a67> Misst dein Auto den Reifendruck mit Sensoren in den Rädern, brauchen auch die neuen Räder Sensoren. Ob das so ist, steht in der Betriebsanleitung. Manche Autos warnen ganz ohne Sensoren im Rad – dann brauchst du keine. </p>`);
							if (!tpms.value.available) _push(`<p class="ko__rdks-notice" role="status" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.notice)} <a${(0, server_renderer_exports.ssrRenderAttr)("href", (0, vue_exports.unref)(contactHref)({
								subject: "Preis für RDKS-Sensoren",
								from: "/kasse"
							}))} class="ko__rdks-mail" target="_blank" rel="noopener" data-v-8c945a67> Zum Kontaktformular<span class="visually-hidden" data-v-8c945a67> (öffnet in einem neuen Tab)</span></a></p>`);
							else _push(`<!---->`);
							_push(`<div class="opt" role="radiogroup" aria-labelledby="ko-rdks-q" aria-describedby="ko-rdks-err" data-key="rdks" tabindex="-1" data-v-8c945a67>`);
							if (tpms.value.available) {
								_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "opt__tile--on": tpms.value.choice === "ja" }, "opt__tile"])}" data-v-8c945a67><input class="visually-hidden opt__input" type="radio" name="rdks" value="ja"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(tpms.value.choice === "ja") ? " checked" : ""} data-v-8c945a67><span class="opt__name" data-v-8c945a67>Ja, bitte mit RDKS-Sensoren</span><span class="opt__price tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)}</span><span class="opt__sub" data-v-8c945a67>Wir setzen die Sensoren gleich mit ein.</span><span class="opt__check" aria-hidden="true" data-v-8c945a67>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "check",
									size: 20
								}, null, _parent));
								_push(`</span></label>`);
							} else _push(`<!---->`);
							_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "opt__tile--on": tpms.value.choice === "nein" }, "opt__tile"])}" data-v-8c945a67><input class="visually-hidden opt__input" type="radio" name="rdks" value="nein"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(tpms.value.choice === "nein") ? " checked" : ""} data-v-8c945a67><span class="opt__name" data-v-8c945a67>Nein, ich brauche keine</span><span class="opt__price tabular" data-v-8c945a67>0,00 €</span><span class="opt__check" aria-hidden="true" data-v-8c945a67>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "check",
								size: 20
							}, null, _parent));
							_push(`</span></label></div><span id="ko-rdks-err" class="field-error" role="alert" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(errors.rdks ?? "")}</span></fieldset>`);
						} else _push(`<!---->`);
						_push(`<fieldset class="ko__group" data-v-8c945a67><legend class="visually-hidden" data-v-8c945a67>Versandart</legend><label class="ko__option" data-v-8c945a67><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(form.shipping, "standard")) ? " checked" : ""} type="radio" name="shipping" value="standard" data-v-8c945a67><span class="ko__option-text" data-v-8c945a67><span class="ko__option-name" data-v-8c945a67>Standardversand</span></span><span class="${(0, server_renderer_exports.ssrRenderClass)([{ tabular: !shippingOpen.value }, "ko__option-price"])}" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(shippingLabel.value)}</span></label></fieldset><div class="ko__actions" data-v-8c945a67><button class="btn btn--primary btn--lg" type="submit" data-v-8c945a67>Weiter zur Zahlung</button><button class="btn btn--secondary btn--lg" type="button" data-v-8c945a67>Zurück</button></div><!--]-->`);
					} else {
						_push(`<!--[--><h2 class="t-h2 ko__step-title" tabindex="-1" data-step-title data-v-8c945a67>Zahlung</h2>`);
						if (__props.orderRefusal) _push(`<p id="ko-refusal" class="ko__refusal" role="status" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(__props.orderRefusal)}</p>`);
						else if (__props.sandbox) _push(`<p id="ko-sandbox" class="tag tag--unknown ko__sandbox" data-v-8c945a67> Testbestellung – im nächsten Schritt wählst du, wie die Testzahlung ausgeht. Es wird kein Geld bewegt. </p>`);
						else _push(`<!---->`);
						if (__props.payment && !__props.orderRefusal) {
							_push(`<div class="ko__pay-methods" data-v-8c945a67><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "ko__express--empty": expressEmpty.value }, "ko__express"])}" role="group" aria-label="Express-Zahlung" data-v-8c945a67></div>`);
							if (!expressEmpty.value && stripeReady.value) _push(`<p class="ko__or" aria-hidden="true" data-v-8c945a67><span data-v-8c945a67>oder</span></p>`);
							else _push(`<!---->`);
							_push(`<div class="ko__payment" data-v-8c945a67></div>`);
							if (!stripeReady.value && !stripeFailed.value) _push(`<p class="t-small quiet ko__loading" role="status" data-v-8c945a67> Zahlungsarten werden geladen … </p>`);
							else _push(`<!---->`);
							if (stripeFailed.value) _push(`<div class="ko__refusal" role="alert" data-v-8c945a67><p data-v-8c945a67> Die Zahlungsarten ließen sich nicht laden. Prüf deine Internetverbindung. Wenn du einen Werbeblocker nutzt, schalte ihn für diese Seite aus – deine Angaben bleiben erhalten. </p><button class="btn btn--secondary ko__retry" type="button" data-v-8c945a67> Noch einmal laden </button></div>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						_push(`<section class="ko__final" aria-labelledby="ko-final-title" data-v-8c945a67><h3 id="ko-final-title" class="t-h3" data-v-8c945a67>Deine Bestellung</h3><ul class="ko__essentials" data-v-8c945a67><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
							_push(`<li class="ko__essential" data-v-8c945a67><p class="ko__essential-top" data-v-8c945a67><span class="ko__essential-name" data-v-8c945a67><span class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} ×</span> ${(0, server_renderer_exports.ssrInterpolate)(line.mixed ? line.setLabel : line.isSet ? "Komplettrad" : "Felge")} ${(0, server_renderer_exports.ssrInterpolate)(line.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(line.title)}</span><span class="ko__essential-price tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</span></p><p class="ko__essential-spec" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.subtitle)}`);
							if (line.sizeLabel) _push(`<!--[--> · <span class="data" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.sizeLabel)}</span><!--]-->`);
							else _push(`<!---->`);
							if (line.isSet && line.tyre) _push(`<!--[--> · mit ${(0, server_renderer_exports.ssrInterpolate)(line.tyre.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(line.tyre.name)} <span class="data" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.tyre.sizeLabel)}</span><!--]-->`);
							else _push(`<!---->`);
							_push(`</p>`);
							if (line.verdict) {
								_push(`<!--[--><p class="ko__verdict" data-v-8c945a67>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
									status: line.verdict.status,
									"notes-only": line.verdict.notesOnly === true
								}, null, _parent));
								_push(` <span data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(verdictSentence(line))}</span></p>`);
								if (line.verdict.rimAloneNote) _push(`<p class="ko__rim" data-rim-alone data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.rimAloneNote)}</p>`);
								else _push(`<!---->`);
								if (line.verdict.conditions.length) {
									_push(`<details class="ko__auflagen" data-v-8c945a67><summary data-v-8c945a67>Auflagen lesen</summary>`);
									if (line.verdict.conditionGroups) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
										class: "ko__groups",
										groups: line.verdict.conditionGroups
									}, null, _parent));
									else {
										_push(`<ul class="ko__conditions" data-v-8c945a67><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(line.verdict.conditions, (condition) => {
											_push(`<li data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
										});
										_push(`<!--]--></ul>`);
									}
									_push(`</details>`);
								} else _push(`<!---->`);
								_push(`<!--]-->`);
							} else _push(`<!---->`);
							_push(`</li>`);
						});
						_push(`<!--]-->`);
						if (tpms.value && tpms.value.choice === "ja") _push(`<li class="ko__essential" data-v-8c945a67><p class="ko__essential-top" data-v-8c945a67><span class="ko__essential-name" data-v-8c945a67>RDKS-Sensoren (${(0, server_renderer_exports.ssrInterpolate)(tpms.value.line)})</span><span class="ko__essential-price tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(tpms.value.total)}</span></p></li>`);
						else _push(`<!---->`);
						_push(`</ul><dl class="ko__terms" data-v-8c945a67><div class="ko__term" data-v-8c945a67><dt data-v-8c945a67>Versand</dt><dd class="${(0, server_renderer_exports.ssrRenderClass)({ tabular: !shippingOpen.value })}" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(shippingLabel.value)}</dd></div><div class="ko__term" data-v-8c945a67><dt data-v-8c945a67>Lieferzeit</dt><dd data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(__props.deliveryTime ?? "wird noch festgelegt")}</dd></div><div class="ko__term ko__term--total" data-v-8c945a67><dt data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(shippingOpen.value ? "Summe ohne Versand" : "Gesamt")}</dt><dd class="tabular" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</dd></div></dl><p class="price-legal" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(totalNote)(terms.value.smallBusiness, __props.totals.tax, shippingOpen.value))}</p>`);
						if (payError.value) _push(`<p class="ko__refusal ko__refusal--bad" role="alert" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(payError.value)}</p>`);
						else _push(`<!---->`);
						_push(`<button class="btn btn--primary btn--lg btn--block ko__pay" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Boolean(__props.orderRefusal) || paying.value || Boolean(__props.payment) && !stripeReady.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", paying.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", __props.orderRefusal ? "ko-refusal" : void 0)} data-v-8c945a67> Zahlungspflichtig bestellen </button>`);
						if (serverRefusal.value) _push(`<p class="ko__refusal ko__refusal--after" role="alert" data-v-8c945a67>${(0, server_renderer_exports.ssrInterpolate)(serverRefusal.value)}</p>`);
						else _push(`<!---->`);
						if (!shippingOpen.value) _push(`<p class="t-small quiet ko__final-note" data-v-8c945a67> Von uns kommen keine weiteren Kosten dazu. </p>`);
						else _push(`<!---->`);
						if (needsEntry.value) _push(`<p class="t-small quiet ko__final-note" data-v-8c945a67> Die Gebühren für die Abnahme und, wo nötig, die Eintragung sind nicht im Preis enthalten – sie berechnen Prüfstelle und Zulassungsstelle. </p>`);
						else _push(`<!---->`);
						_push(`<p class="t-small ko__legal-links" data-v-8c945a67> Es gelten unsere `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/agb" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`AGB`);
								else return [(0, vue_exports.createTextVNode)("AGB")];
							}),
							_: 1
						}, _parent));
						_push(`; zu deinem Widerrufsrecht die `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/widerrufsbelehrung" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Widerrufsbelehrung`);
								else return [(0, vue_exports.createTextVNode)("Widerrufsbelehrung")];
							}),
							_: 1
						}, _parent));
						_push(` mit dem `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/widerrufsformular" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Muster-Widerrufsformular`);
								else return [(0, vue_exports.createTextVNode)("Muster-Widerrufsformular")];
							}),
							_: 1
						}, _parent));
						_push(`, zu deinen Daten die `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/datenschutz" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Datenschutzerklärung`);
								else return [(0, vue_exports.createTextVNode)("Datenschutzerklärung")];
							}),
							_: 1
						}, _parent));
						_push(`. </p></section><div class="ko__actions" data-v-8c945a67><button class="btn btn--secondary" type="button" data-v-8c945a67>Zurück</button></div><!--]-->`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8c945a67"]]);
//#endregion
export { Index_default as default };
