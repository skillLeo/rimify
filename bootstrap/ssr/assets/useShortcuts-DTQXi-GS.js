import { t as Dialog_default } from "./Dialog-BCc6LoyQ.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-xBPJueVr.js";
import { a as link_default, r as defineStore, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { i as isIconName, t as Icon_default } from "./Icon-3RhMd4kb.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { c as hasMobileShell, i as BottomSheet_default, r as ListRow_default } from "./Toast-vSaJvIKJ.js";
import { t as Picture_default } from "./Picture-eMaBRuVL.js";
function useSearch() {
	const result = (0, vue_exports.ref)(null);
	const loading = (0, vue_exports.ref)(false);
	const failed = (0, vue_exports.ref)(false);
	let timer;
	let controller;
	let sequence = 0;
	function clear() {
		if (timer !== void 0) {
			clearTimeout(timer);
			timer = void 0;
		}
		controller?.abort();
		controller = void 0;
		result.value = null;
		loading.value = false;
		failed.value = false;
	}
	async function fetchNow(query) {
		controller?.abort();
		controller = new AbortController();
		const mine = ++sequence;
		loading.value = true;
		failed.value = false;
		try {
			const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
				headers: { Accept: "application/json" },
				credentials: "same-origin",
				signal: controller.signal
			});
			if (mine !== sequence) return;
			if (!response.ok) {
				failed.value = true;
				result.value = null;
				return;
			}
			result.value = await response.json();
		} catch (error) {
			if (error.name === "AbortError" || mine !== sequence) return;
			failed.value = true;
			result.value = null;
		} finally {
			if (mine === sequence) loading.value = false;
		}
	}
	function run(query) {
		const trimmed = query.trim();
		if (timer !== void 0) clearTimeout(timer);
		if (trimmed === "") {
			clear();
			return;
		}
		timer = setTimeout(() => {
			fetchNow(trimmed);
		}, 120);
	}
	(0, vue_exports.onBeforeUnmount)(clear);
	return {
		result,
		loading,
		failed,
		run,
		clear
	};
}
/** The recent searches a visitor made, kept in their own browser only. */
var RECENT_KEY = "rmf.recent-searches";
function readRecent() {
	try {
		const raw = localStorage.getItem(RECENT_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string").slice(0, 5) : [];
	} catch {
		return [];
	}
}
function remember(query) {
	try {
		const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, 5);
		localStorage.setItem(RECENT_KEY, JSON.stringify(next));
	} catch {}
}
//#endregion
//#region resources/js/composables/useShell.ts
/**
* The shell's own state — the palette and the shortcut help — shared between the header, the
* footer and the layout without a global store: whoever opens the palette from the footer link
* opens the same palette the header's search icon opens.
*/
var KEY$1 = Symbol("shell");
function provideShell() {
	let focus = null;
	const store = {
		paletteOpen: (0, vue_exports.ref)(false),
		helpOpen: (0, vue_exports.ref)(false),
		vehicleOpen: (0, vue_exports.ref)(false),
		focusSearch: () => {
			if (focus !== null) {
				focus();
				return;
			}
			store.paletteOpen.value = true;
		},
		registerSearch: (fn) => {
			focus = fn;
		}
	};
	(0, vue_exports.provide)(KEY$1, store);
	return store;
}
function useShell() {
	const store = (0, vue_exports.inject)(KEY$1);
	if (store === void 0) throw new Error("useShell() needs provideShell() in the layout");
	return store;
}
//#endregion
//#region resources/js/composables/useShared.ts
/**
* Typed access to the props every page receives.
*
* `usePage().props` is `any` by default, which is how a renamed controller key becomes a blank
* header nobody notices until a client review. This narrows it once, here.
*/
function useShared() {
	const page = usePage();
	return (0, vue_exports.computed)(() => page.props);
}
function useMenus() {
	const shared = useShared();
	return (0, vue_exports.computed)(() => shared.value.menus ?? {
		header: [],
		footer_pages: [],
		footer_legal: [],
		mobile_bottom: []
	});
}
/**
* `Felgen suchen` goes to the selector with no vehicle and to the listing with one. The rule lives
* in the nav row's `behaviour`, so marketing can move the item without a developer — and so the
* destination is not a branch buried in a component.
*/
function resolveHref(href, behaviour, hasVehicle, listingHref) {
	return behaviour === "vehicle_aware" && hasVehicle ? listingHref : href;
}
//#endregion
//#region resources/js/composables/useConsent.ts
/**
* The cookie notice.
*
* The server reads the cookie and shares the choice in the first response, so the sheet is in the
* server-rendered HTML exactly when it should be. Acknowledging it writes a plain cookie for twelve
* months and mirrors it into this store, so the sheet closes at once. The footer's
* "Cookie-Einstellungen" reopens the settings from anywhere.
*
* There is nothing to consent to: the shop sets only the cookies it needs, and no statistics
* service is configured (docs/phase0/ACCURACY.md D7). So the store records `statistics: false`
* and offers no way to record anything else. A statistics choice comes back together with a real
* service and the consent wording the Kanzlei supplies — never ahead of them.
*/
var CONSENT_COOKIE = "rmf_consent";
var TWELVE_MONTHS_S = 31536e3;
var KEY = Symbol("consent");
function provideConsent(initial) {
	const decided = (0, vue_exports.ref)(initial);
	const settingsOpen = (0, vue_exports.ref)(false);
	function acknowledge() {
		const choice = {
			necessary: true,
			statistics: false,
			decidedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(choice))}; Max-Age=${TWELVE_MONTHS_S}; Path=/; SameSite=Lax${secure}`;
		decided.value = choice;
		settingsOpen.value = false;
	}
	const store = {
		decided,
		settingsOpen,
		acknowledge,
		openSettings: () => {
			settingsOpen.value = true;
		}
	};
	(0, vue_exports.provide)(KEY, store);
	return store;
}
function useConsent() {
	const store = (0, vue_exports.inject)(KEY);
	if (store === void 0) throw new Error("useConsent() needs provideConsent() in the layout");
	return store;
}
//#endregion
//#region resources/js/legal/cookies.ts
var BROWSER = "Oder du löschst die Cookies für diese Seite in deinem Browser.";
var COOKIES = [
	{
		name: "rmf_vehicle",
		category: "Notwendig",
		stores: "Welches Fahrzeug du gewählt hast – nur seine Nummer in unserer Liste.",
		lifetime: "90 Tage",
		clear: `Es wird ersetzt, sobald du ein anderes Fahrzeug wählst. ${BROWSER}`
	},
	{
		name: "rmf_garage",
		category: "Notwendig",
		stores: "Die letzten fünf Fahrzeuge, die du gewählt hast, damit du schnell zurückwechseln kannst.",
		lifetime: "90 Tage",
		clear: BROWSER
	},
	{
		name: "rmf_consent",
		category: "Notwendig",
		stores: "Dass du diesen Hinweis gelesen hast, und wann.",
		lifetime: "12 Monate",
		clear: BROWSER
	},
	{
		name: "Sitzung und XSRF-TOKEN",
		category: "Notwendig",
		stores: "Deinen Warenkorb und den Schutz deiner Eingaben vor fremden Seiten.",
		lifetime: "120 Minuten",
		clear: `Sie verfallen von selbst. ${BROWSER}`
	},
	{
		name: "rmf_papiere",
		category: "Funktional",
		stores: "Die Werte, die du aus deiner Zulassungsbescheinigung einträgst – Achslasten (8.1, 8.2) und Höchstgeschwindigkeit (T) – sowie Karosserieform und Antriebsart, wenn wir danach fragen; für bis zu fünf Fahrzeuge, ohne Namen, Kennzeichen oder Fahrgestellnummer.",
		lifetime: "1 Jahr",
		clear: `Beim Fahrzeug auf „Werte löschen“ tippen. ${BROWSER}`
	},
	{
		name: "rmf_geraet",
		category: "Funktional",
		stores: "Eine zufällige Kennung für diesen Browser und sonst nichts. Unser Schutz vor zu vielen Anfragen zählt nach ihr statt nach deiner IP-Adresse – so wirst du nicht mit anderen im selben Mobilfunknetz verwechselt.",
		lifetime: "1 Jahr",
		clear: `Lösch die Cookies für diese Seite in deinem Browser; beim nächsten Besuch entsteht eine neue, ebenso zufällige Kennung.`
	}
];
//#endregion
//#region resources/js/Components/Chrome/CookieConsent.vue?vue&type=script&setup=true&lang.ts
var CookieConsent_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CookieConsent",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The cookie notice: a small sheet at the bottom edge, never a wall. No scroll lock, no focus
		* theft — the page behind it works as before. Reopened from the footer.
		*
		* The shop sets only the cookies it needs, and no statistics service is configured, so the sheet
		* asks for nothing: it says what is set, links the Datenschutzerklärung, and one button closes it.
		* No "Alle akzeptieren" and no statistics switch for a purpose that does not exist (ACCURACY D7).
		* Any wording beyond this sentence is the Kanzlei's to supply, together with the service.
		*/
		const consent = useConsent();
		/** The functional cookies by name, each with what it stores and how to clear it (Block G). */
		const FUNCTIONAL = COOKIES.filter((cookie) => cookie.category === "Funktional");
		const sheetVisible = (0, vue_exports.computed)(() => consent.decided.value === null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if (sheetVisible.value) _push(`<section class="consent" aria-labelledby="consent-title" data-v-28a5e6c9><h2 id="consent-title" class="h4" data-v-28a5e6c9>Cookies bei RIMIFY</h2><p class="consent__text" data-v-28a5e6c9> Wir verwenden Cookies, die für den Shop nötig sind – für den Warenkorb und dein gewähltes Fahrzeug. <a href="/rechtliches/datenschutz" data-v-28a5e6c9>Mehr in der Datenschutzerklärung</a></p><div class="consent__actions" data-v-28a5e6c9><button class="btn btn--secondary" type="button" data-v-28a5e6c9>Verstanden</button></div></section>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: (0, vue_exports.unref)(consent).settingsOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(consent).settingsOpen.value = $event,
				title: "Cookie-Einstellungen",
				description: "Wir verwenden nur Cookies, die der Shop braucht oder die du selbst anlegst."
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-28a5e6c9${_scopeId}>Verstanden</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => (0, vue_exports.unref)(consent).acknowledge()
					}, "Verstanden", 8, ["onClick"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<ul class="consent__list" data-v-28a5e6c9${_scopeId}><li class="consent__row" data-v-28a5e6c9${_scopeId}><p class="consent__name" data-v-28a5e6c9${_scopeId}>Notwendig</p><span class="small quiet consent__state" data-v-28a5e6c9${_scopeId}>Immer aktiv</span><p class="small muted consent__what" data-v-28a5e6c9${_scopeId}>Warenkorb, gewähltes Fahrzeug, Sitzung und deine Cookie-Auswahl.</p></li><li class="consent__row" data-v-28a5e6c9${_scopeId}><p class="consent__name" data-v-28a5e6c9${_scopeId}>Funktional</p><span class="small quiet consent__state" data-v-28a5e6c9${_scopeId}>Einzeln erklärt</span><dl class="consent__cookies" data-v-28a5e6c9${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(FUNCTIONAL), (cookie) => {
							_push(`<div class="consent__cookie" data-v-28a5e6c9${_scopeId}><dt class="small consent__cookie-name" data-v-28a5e6c9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cookie.name)} <span class="quiet" data-v-28a5e6c9${_scopeId}>· ${(0, server_renderer_exports.ssrInterpolate)(cookie.lifetime)}</span></dt><dd class="small muted" data-v-28a5e6c9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cookie.stores)}</dd><dd class="small muted" data-v-28a5e6c9${_scopeId}><span class="consent__clear" data-v-28a5e6c9${_scopeId}>Löschen:</span> ${(0, server_renderer_exports.ssrInterpolate)(cookie.clear)}</dd></div>`);
						});
						_push(`<!--]--></dl></li></ul><p class="small muted" data-v-28a5e6c9${_scopeId}> Alle Cookies mit Laufzeit stehen in der <a href="/rechtliches/datenschutz#cookies" data-v-28a5e6c9${_scopeId}>Datenschutzerklärung</a>. </p>`);
					} else return [(0, vue_exports.createVNode)("ul", { class: "consent__list" }, [(0, vue_exports.createVNode)("li", { class: "consent__row" }, [
						(0, vue_exports.createVNode)("p", { class: "consent__name" }, "Notwendig"),
						(0, vue_exports.createVNode)("span", { class: "small quiet consent__state" }, "Immer aktiv"),
						(0, vue_exports.createVNode)("p", { class: "small muted consent__what" }, "Warenkorb, gewähltes Fahrzeug, Sitzung und deine Cookie-Auswahl.")
					]), (0, vue_exports.createVNode)("li", { class: "consent__row" }, [
						(0, vue_exports.createVNode)("p", { class: "consent__name" }, "Funktional"),
						(0, vue_exports.createVNode)("span", { class: "small quiet consent__state" }, "Einzeln erklärt"),
						(0, vue_exports.createVNode)("dl", { class: "consent__cookies" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(FUNCTIONAL), (cookie) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: cookie.name,
								class: "consent__cookie"
							}, [
								(0, vue_exports.createVNode)("dt", { class: "small consent__cookie-name" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(cookie.name) + " ", 1), (0, vue_exports.createVNode)("span", { class: "quiet" }, "· " + (0, vue_exports.toDisplayString)(cookie.lifetime), 1)]),
								(0, vue_exports.createVNode)("dd", { class: "small muted" }, (0, vue_exports.toDisplayString)(cookie.stores), 1),
								(0, vue_exports.createVNode)("dd", { class: "small muted" }, [(0, vue_exports.createVNode)("span", { class: "consent__clear" }, "Löschen:"), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(cookie.clear), 1)])
							]);
						}), 128))])
					])]), (0, vue_exports.createVNode)("p", { class: "small muted" }, [
						(0, vue_exports.createTextVNode)(" Alle Cookies mit Laufzeit stehen in der "),
						(0, vue_exports.createVNode)("a", { href: "/rechtliches/datenschutz#cookies" }, "Datenschutzerklärung"),
						(0, vue_exports.createTextVNode)(". ")
					])];
				}),
				_: 1
			}, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/CookieConsent.vue
var _sfc_setup$4 = CookieConsent_vue_vue_type_script_setup_true_lang_default.setup;
CookieConsent_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CookieConsent.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var CookieConsent_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CookieConsent_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-28a5e6c9"]]);
//#endregion
//#region resources/js/composables/usePriceTerms.ts
/**
* How every price on the site is qualified, in one place — so the seller's Kleinunternehmer flag (§ 19 UStG, shared
* as `smallBusiness`) changes them all together, with the invoice and the order summaries (App\Support\Seller).
*
* Standard: the prices contain 19 % VAT, and the summaries name the VAT in them. A Kleinunternehmer charges none:
* the prices are final, no summary has a VAT line, and the notes say why.
*
* A component mounted without an Inertia page (a unit test, a story) reads the standard terms.
*/
var STANDARD_TERMS = {
	smallBusiness: false,
	note: "inkl. MwSt., zzgl. Versand",
	footer: "Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten."
};
var SMALL_BUSINESS_TERMS = {
	smallBusiness: true,
	note: "zzgl. Versand, keine MwSt. nach §\xA019 UStG",
	footer: "Alle Preise zzgl. Versandkosten. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
};
function priceTerms(smallBusiness) {
	return smallBusiness ? SMALL_BUSINESS_TERMS : STANDARD_TERMS;
}
/**
* The line under a total: the VAT it contains and the shipping — or, for a Kleinunternehmer, no VAT at all.
* `shippingOpen` while the client has not named the shipping price.
*/
function totalNote(smallBusiness, tax, shippingOpen) {
	if (smallBusiness) return shippingOpen ? "Versandkosten werden noch festgelegt · keine MwSt. nach §\xA019 UStG" : "inkl. Versand, keine MwSt. nach §\xA019 UStG";
	return shippingOpen ? `inkl. ${tax} MwSt. · Versandkosten werden noch festgelegt` : `inkl. ${tax} MwSt. und Versand`;
}
function usePriceTerms() {
	let page = null;
	try {
		page = usePage();
	} catch {
		page = null;
	}
	return (0, vue_exports.computed)(() => priceTerms(page?.props?.smallBusiness === true));
}
//#endregion
//#region resources/js/Components/Chrome/DemoBadge.vue?vue&type=script&setup=true&lang.ts
var DemoBadge_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DemoBadge",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The site-wide *Demodaten* badge (docs/phase0/ACCURACY.md D4).
		*
		* While any published wheel model is a demonstration row, the server shares `demoBadge` and every
		* header carries this badge: the desktop utility strip, the phone header row and the phone app
		* bar. It is decided on the server and in the first frame (R-08), so it never appears a beat late.
		*
		* It is small, it sits in the flow of its row and it never shrinks the row's controls: it takes
		* only the width of its word, and where a title shares the row the title gives way first.
		*/
		const shared = useShared();
		const demo = (0, vue_exports.computed)(() => shared.value.demoBadge === true);
		return (_ctx, _push, _parent, _attrs) => {
			if (demo.value) _push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "demo-badge",
				title: "Der Shop zeigt Beispieldaten."
			}, _attrs))} data-v-f0da4095>Demodaten</span>`);
			else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/DemoBadge.vue
var _sfc_setup$3 = DemoBadge_vue_vue_type_script_setup_true_lang_default.setup;
DemoBadge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/DemoBadge.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var DemoBadge_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DemoBadge_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f0da4095"]]);
//#endregion
//#region resources/js/Components/Chrome/MainMenu.vue?vue&type=script&setup=true&lang.ts
var MainMenu_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "MainMenu",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The phone's navigation, in the corner of the header.
		*
		* It replaces the bottom bar both documents used to carry. A shop is not an app: a fixed bar at
		* the bottom of every page costs a row of content, sits where the browser's own chrome already
		* is, and reads as a native app rather than a shop. The destinations are the same ones the admin
		* maintains — the phone list first, in its own order, then anything the header menu has that the
		* phone list does not, so a page can never be reachable on a desktop and missing here.
		*
		* The basket lives in it like every other destination, and its count rides the button, because a
		* phone bar that also carries a basket icon runs out of room at 390 px — five targets and a
		* wordmark do not fit, and the ones that fall off the end are the ones nobody finds. The current
		* page is marked rather than hidden, so the menu always shows where you are.
		*/
		const shared = useShared();
		const menus = useMenus();
		/**
		* The admin gives the phone list its icons; the header list has none, because a desktop menu shows
		* words. Rather than draw a chevron beside a word, the known storefront routes fall back to the
		* icon they already wear elsewhere in the shop.
		*/
		const ROUTE_ICONS = {
			startseite: "home",
			"felgen.index": "wheel",
			"felgen.suchen": "car",
			"check.index": "check-circle",
			"warenkorb.index": "cart",
			kontakt: "mail",
			faq: "info",
			ratgeber: "document",
			rechtliches: "document"
		};
		function iconFor(item) {
			if (item.icon !== null && isIconName(item.icon)) return item.icon;
			return (item.routeName !== null ? ROUTE_ICONS[item.routeName] : void 0) ?? "chevron-right";
		}
		const items = (0, vue_exports.computed)(() => {
			const phone = menus.value.mobile_bottom;
			const known = new Set(phone.map((item) => item.href));
			const rest = menus.value.header.filter((item) => !known.has(item.href));
			return [...phone, ...rest].map((item) => ({
				...item,
				iconName: iconFor(item),
				current: item.routeName !== null && item.routeName === shared.value.routeName,
				isCart: item.routeName === "warenkorb.index"
			}));
		});
		const cartCount = (0, vue_exports.computed)(() => shared.value.cartCount);
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), _attrs, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), (0, vue_exports.mergeProps)(_ctx.$attrs, {
							class: "icon-btn m-press mainmenu__trigger",
							"aria-label": cartCount.value > 0 ? `Menü, ${cartCount.value} Artikel im Warenkorb` : "Menü"
						}), {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
										name: "menu",
										size: 24
									}, null, _parent, _scopeId));
									if (cartCount.value > 0) _push(`<span class="badge badge--count mainmenu__badge" aria-hidden="true" data-v-42822520${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cartCount.value)}</span>`);
									else _push(`<!---->`);
								} else return [(0, vue_exports.createVNode)(Icon_default, {
									name: "menu",
									size: 24
								}), cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "badge badge--count mainmenu__badge",
									"aria-hidden": "true"
								}, (0, vue_exports.toDisplayString)(cartCount.value), 1)) : (0, vue_exports.createCommentVNode)("", true)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "popover mainmenu",
									align: "end",
									"side-offset": 8,
									"aria-label": "Hauptnavigation"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`<!--[-->`);
											(0, server_renderer_exports.ssrRenderList)(items.value, (item) => {
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: item.href,
													"as-child": ""
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
															href: item.href,
															class: "menu__item mainmenu__item",
															"aria-current": item.current ? "page" : void 0,
															prefetch: ""
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
																		name: item.iconName,
																		size: 20
																	}, null, _parent, _scopeId));
																	_push(`<span class="mainmenu__label" data-v-42822520${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</span>`);
																	if (item.isCart && cartCount.value > 0) _push(`<span class="badge badge--count mainmenu__count" data-v-42822520${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cartCount.value)}</span>`);
																	else _push(`<!---->`);
																} else return [
																	(0, vue_exports.createVNode)(Icon_default, {
																		name: item.iconName,
																		size: 20
																	}, null, 8, ["name"]),
																	(0, vue_exports.createVNode)("span", { class: "mainmenu__label" }, (0, vue_exports.toDisplayString)(item.label), 1),
																	item.isCart && cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
																		key: 0,
																		class: "badge badge--count mainmenu__count"
																	}, (0, vue_exports.toDisplayString)(cartCount.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
																];
															}),
															_: 2
														}, _parent, _scopeId));
														else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: item.href,
															class: "menu__item mainmenu__item",
															"aria-current": item.current ? "page" : void 0,
															prefetch: ""
														}, {
															default: (0, vue_exports.withCtx)(() => [
																(0, vue_exports.createVNode)(Icon_default, {
																	name: item.iconName,
																	size: 20
																}, null, 8, ["name"]),
																(0, vue_exports.createVNode)("span", { class: "mainmenu__label" }, (0, vue_exports.toDisplayString)(item.label), 1),
																item.isCart && cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
																	key: 0,
																	class: "badge badge--count mainmenu__count"
																}, (0, vue_exports.toDisplayString)(cartCount.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
															]),
															_: 2
														}, 1032, ["href", "aria-current"])];
													}),
													_: 2
												}, _parent, _scopeId));
											});
											_push(`<!--]-->`);
										} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(items.value, (item) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
												key: item.href,
												"as-child": ""
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: item.href,
													class: "menu__item mainmenu__item",
													"aria-current": item.current ? "page" : void 0,
													prefetch: ""
												}, {
													default: (0, vue_exports.withCtx)(() => [
														(0, vue_exports.createVNode)(Icon_default, {
															name: item.iconName,
															size: 20
														}, null, 8, ["name"]),
														(0, vue_exports.createVNode)("span", { class: "mainmenu__label" }, (0, vue_exports.toDisplayString)(item.label), 1),
														item.isCart && cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
															key: 0,
															class: "badge badge--count mainmenu__count"
														}, (0, vue_exports.toDisplayString)(cartCount.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
													]),
													_: 2
												}, 1032, ["href", "aria-current"])]),
												_: 2
											}, 1024);
										}), 128))];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "popover mainmenu",
									align: "end",
									"side-offset": 8,
									"aria-label": "Hauptnavigation"
								}, {
									default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(items.value, (item) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: item.href,
											"as-child": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: item.href,
												class: "menu__item mainmenu__item",
												"aria-current": item.current ? "page" : void 0,
												prefetch: ""
											}, {
												default: (0, vue_exports.withCtx)(() => [
													(0, vue_exports.createVNode)(Icon_default, {
														name: item.iconName,
														size: 20
													}, null, 8, ["name"]),
													(0, vue_exports.createVNode)("span", { class: "mainmenu__label" }, (0, vue_exports.toDisplayString)(item.label), 1),
													item.isCart && cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 0,
														class: "badge badge--count mainmenu__count"
													}, (0, vue_exports.toDisplayString)(cartCount.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
												]),
												_: 2
											}, 1032, ["href", "aria-current"])]),
											_: 2
										}, 1024);
									}), 128))]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), (0, vue_exports.mergeProps)(_ctx.$attrs, {
						class: "icon-btn m-press mainmenu__trigger",
						"aria-label": cartCount.value > 0 ? `Menü, ${cartCount.value} Artikel im Warenkorb` : "Menü"
					}), {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
							name: "menu",
							size: 24
						}), cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "badge badge--count mainmenu__badge",
							"aria-hidden": "true"
						}, (0, vue_exports.toDisplayString)(cartCount.value), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
						_: 1
					}, 16, ["aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
							class: "popover mainmenu",
							align: "end",
							"side-offset": 8,
							"aria-label": "Hauptnavigation"
						}, {
							default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(items.value, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
									key: item.href,
									"as-child": ""
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: item.href,
										class: "menu__item mainmenu__item",
										"aria-current": item.current ? "page" : void 0,
										prefetch: ""
									}, {
										default: (0, vue_exports.withCtx)(() => [
											(0, vue_exports.createVNode)(Icon_default, {
												name: item.iconName,
												size: 20
											}, null, 8, ["name"]),
											(0, vue_exports.createVNode)("span", { class: "mainmenu__label" }, (0, vue_exports.toDisplayString)(item.label), 1),
											item.isCart && cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "badge badge--count mainmenu__count"
											}, (0, vue_exports.toDisplayString)(cartCount.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
										]),
										_: 2
									}, 1032, ["href", "aria-current"])]),
									_: 2
								}, 1024);
							}), 128))]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/MainMenu.vue
var _sfc_setup$2 = MainMenu_vue_vue_type_script_setup_true_lang_default.setup;
MainMenu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/MainMenu.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var MainMenu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(MainMenu_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-42822520"]]);
//#endregion
//#region resources/js/Components/Ui/WheelOutline.vue?vue&type=script&setup=true&lang.ts
var WheelOutline_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "WheelOutline",
	__ssrInlineRender: true,
	props: {
		spokes: { default: 5 },
		bolts: { default: 5 },
		size: { default: "70%" }
	},
	setup(__props) {
		/**
		* The honest stand-in for a photograph that has not arrived: a flat technical drawing of the
		* wheel — rim, spokes, hub and bolt pattern in one stroke weight, nothing shaded, nothing that
		* could be mistaken for a photo. It renders only when a real image is missing or failed to load.
		*/
		const props = __props;
		const spokeAngles = (0, vue_exports.computed)(() => Array.from({ length: props.spokes }, (_, i) => 360 / props.spokes * i));
		const boltAngles = (0, vue_exports.computed)(() => Array.from({ length: props.bolts }, (_, i) => 360 / props.bolts * i - 90));
		function boltAt(angle) {
			const rad = angle * Math.PI / 180;
			return {
				cx: 100 + 34 * Math.cos(rad),
				cy: 100 + 34 * Math.sin(rad)
			};
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<svg${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				viewBox: "0 0 200 200",
				class: "outline",
				style: {
					width: __props.size,
					height: __props.size
				},
				"aria-hidden": "true",
				focusable: "false"
			}, _attrs))} data-v-b8b8afae><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" data-v-b8b8afae><circle cx="100" cy="100" r="94" data-v-b8b8afae></circle><circle cx="100" cy="100" r="82" data-v-b8b8afae></circle><circle cx="100" cy="100" r="20" data-v-b8b8afae></circle><circle cx="100" cy="100" r="8" data-v-b8b8afae></circle><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(spokeAngles.value, (angle) => {
				_push(`<path d="M 92 -16 L 86 -78 M 108 -16 L 114 -78 M 86 -78 L 114 -78"${(0, server_renderer_exports.ssrRenderAttr)("transform", `translate(100 100) rotate(${angle}) translate(-100 -100) translate(0 100)`)} data-v-b8b8afae></path>`);
			});
			_push(`<!--]--><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(boltAngles.value, (angle) => {
				_push(`<circle${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ key: `b${angle}` }, { ref_for: true }, boltAt(angle), { r: "4.5" }))} data-v-b8b8afae></circle>`);
			});
			_push(`<!--]--></g></svg>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/WheelOutline.vue
var _sfc_setup$1 = WheelOutline_vue_vue_type_script_setup_true_lang_default.setup;
WheelOutline_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/WheelOutline.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var WheelOutline_default = /*#__PURE__*/ _plugin_vue_export_helper_default(WheelOutline_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b8b8afae"]]);
/** The storage key; the version inside the payload lets a later shape drop an older one. */
var COMPARE_STORAGE_KEY = "rmf_compare";
var STORAGE_VERSION = 1;
function compareKey(entry) {
	return `${entry.modelId}:${entry.finishId}`;
}
/** What one stored entry must look like to be trusted; a malformed one is dropped, never repaired. */
function isEntry(value) {
	if (value === null || typeof value !== "object") return false;
	const v = value;
	return Number.isInteger(v.modelId) && Number.isInteger(v.finishId) && typeof v.slug === "string" && typeof v.brandName === "string" && typeof v.modelName === "string" && typeof v.finishName === "string" && typeof v.fromPriceCents === "number" && (v.image === null || typeof v.image === "object" && v.image !== null);
}
/** The stored payload, read defensively: anything unexpected is an empty list. */
function parseStored(raw) {
	if (raw === null || raw === "") return [];
	try {
		const parsed = JSON.parse(raw);
		if (parsed === null || typeof parsed !== "object" || parsed.v !== STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
		const seen = /* @__PURE__ */ new Set();
		const out = [];
		for (const item of parsed.items) {
			if (!isEntry(item) || seen.has(compareKey(item))) continue;
			seen.add(compareKey(item));
			out.push(item);
			if (out.length === 4) break;
		}
		return out;
	} catch {
		return [];
	}
}
function serialise(items) {
	return JSON.stringify({
		v: STORAGE_VERSION,
		items
	});
}
var useCompare = defineStore("compare", () => {
	const items = (0, vue_exports.ref)([]);
	/** True once storage has been read on the client; nothing is written before that. */
	const hydrated = (0, vue_exports.ref)(false);
	let listening = false;
	const keys = (0, vue_exports.computed)(() => items.value.map(compareKey));
	const count = (0, vue_exports.computed)(() => items.value.length);
	const isFull = (0, vue_exports.computed)(() => items.value.length >= 4);
	const canCompare = (0, vue_exports.computed)(() => items.value.length >= 2);
	/** The query string `/vergleich` takes. */
	const query = (0, vue_exports.computed)(() => keys.value.join(","));
	function has(key) {
		return keys.value.includes(key);
	}
	function persist() {
		if (!hydrated.value || typeof window === "undefined") return;
		try {
			window.localStorage.setItem(COMPARE_STORAGE_KEY, serialise(items.value));
		} catch {}
	}
	function add(entry) {
		if (has(compareKey(entry))) return "present";
		if (isFull.value) return "full";
		items.value = [...items.value, entry];
		persist();
		return "added";
	}
	function remove(key) {
		if (!has(key)) return;
		items.value = items.value.filter((item) => compareKey(item) !== key);
		persist();
	}
	function clear() {
		if (items.value.length === 0) return;
		items.value = [];
		persist();
	}
	/** Tick or untick: the card's checkbox. Returns what `add` would, or `'removed'`. */
	function toggle(entry) {
		if (has(compareKey(entry))) {
			remove(compareKey(entry));
			return "removed";
		}
		return add(entry);
	}
	/** The page's own list wins: a shared link and the tray must agree. */
	function replace(entries) {
		const seen = /* @__PURE__ */ new Set();
		const next = [];
		for (const entry of entries) {
			if (!seen.has(compareKey(entry))) {
				seen.add(compareKey(entry));
				next.push(entry);
			}
			if (next.length === 4) break;
		}
		items.value = next;
		persist();
	}
	function readStorage() {
		try {
			items.value = parseStored(window.localStorage.getItem(COMPARE_STORAGE_KEY));
		} catch {
			items.value = [];
		}
	}
	/**
	* Read the list the browser kept, and keep listening for the other tabs. Client only, from
	* `onMounted`: the server renders an empty tray and the client's first frame is the same.
	* Once: a second caller (a page mounting beside the tray) changes nothing.
	*/
	function hydrate() {
		if (typeof window === "undefined" || hydrated.value) return;
		readStorage();
		hydrated.value = true;
		if (!listening) {
			listening = true;
			window.addEventListener("storage", (event) => {
				if (event.key === "rmf_compare" || event.key === null) readStorage();
			});
		}
	}
	return {
		items,
		keys,
		count,
		isFull,
		canCompare,
		query,
		hydrated,
		has,
		add,
		remove,
		clear,
		toggle,
		replace,
		hydrate
	};
});
//#endregion
//#region resources/js/Components/Compare/CompareTray.vue?vue&type=script&setup=true&lang.ts
var CompareTray_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CompareTray",
	__ssrInlineRender: true,
	props: { hidden: {
		type: Boolean,
		default: false
	} },
	setup(__props) {
		/**
		* The compare tray (docs/design/sections/home-overhaul.md §2.4): the sticky bottom bar that holds
		* the wheels ticked for comparison — thumbnails, the count, *Alle entfernen* and *Vergleichen (n)*,
		* which opens `/vergleich` with the keys in the query so the comparison is a link.
		*
		* Rendered by both layouts, once. It shows whenever the list is non-empty, except on the routes
		* that are the tray (`/vergleich`) or must keep the bottom edge (`/warenkorb`, `/kasse`), and
		* never while a sticky action bar owns that edge. Everything hugs the left, so the cookie card
		* in the right corner never covers the primary button.
		*
		* The server renders no tray: the list lives in the browser and is read in `onMounted`, so the
		* first frame the client hydrates to is the frame the server sent. On the phone document one
		* button of thumbnails opens a sheet with the rows; on the desktop document the rows are the bar.
		*/
		const props = __props;
		/** Routes where the tray would be in the way, or is the page itself. */
		const HIDDEN_ROUTES = /* @__PURE__ */ new Set([
			"vergleich.index",
			"warenkorb.index",
			"kasse.index"
		]);
		const store = useCompare();
		const shared = useShared();
		const underMobileShell = hasMobileShell();
		const phone = (0, vue_exports.computed)(() => underMobileShell);
		const visible = (0, vue_exports.computed)(() => store.hydrated && store.count > 0 && !props.hidden && !HIDDEN_ROUTES.has(shared.value.routeName ?? ""));
		const href = (0, vue_exports.computed)(() => `/vergleich?f=${store.query}`);
		const sheetOpen = (0, vue_exports.ref)(false);
		const name = (item) => `${item.brandName} ${item.modelName}`;
		(0, vue_exports.onMounted)(() => {
			store.hydrate();
		});
		(0, vue_exports.watch)(visible, (on) => {
			if (typeof document === "undefined") return;
			if (on) document.documentElement.dataset.tray = "open";
			else delete document.documentElement.dataset.tray;
		});
		(0, vue_exports.watch)(() => store.count, (count) => {
			if (count === 0) sheetOpen.value = false;
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			if (typeof document !== "undefined") delete document.documentElement.dataset.tray;
		});
		function remove(item) {
			store.remove(compareKey(item));
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if (visible.value) {
				_push(`<section class="${(0, server_renderer_exports.ssrRenderClass)([{ "tray--phone": phone.value }, "tray"])}" role="region" aria-label="Vergleich"><div class="container tray__row">`);
				if (!phone.value) {
					_push(`<!--[--><ul class="tray__thumbs" aria-label="Felgen im Vergleich"><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).items, (item) => {
						_push(`<li class="tray__thumb"><span class="tray__img">`);
						if (item.image) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
							image: item.image,
							alt: `${name(item)} in ${item.finishName}`,
							sizes: "48px"
						}, null, _parent));
						else _push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, null, null, _parent));
						_push(`</span><button class="icon-btn tray__remove" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${name(item)} aus dem Vergleich entfernen`)}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "close",
							size: 16
						}, null, _parent));
						_push(`</button></li>`);
					});
					_push(`<!--]--></ul><div class="tray__count"><span class="small num muted">${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(4))}</span>`);
					if (!(0, vue_exports.unref)(store).canCompare) _push(`<span class="small muted">Wähle mindestens 2 Felgen.</span>`);
					else _push(`<!---->`);
					_push(`</div><div class="tray__actions"><button class="btn btn--ghost btn--sm tray__clear" type="button" aria-label="Alle entfernen"><span class="tray__clear-icon" aria-hidden="true">`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "trash",
						size: 20
					}, null, _parent));
					_push(`</span><span class="tray__clear-label">Alle entfernen</span></button>`);
					if ((0, vue_exports.unref)(store).canCompare) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: href.value,
						class: "btn btn--primary tray__go"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Vergleichen (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)})`);
							else return [(0, vue_exports.createTextVNode)("Vergleichen (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(store).count) + ")", 1)];
						}),
						_: 1
					}, _parent));
					else _push(`<button class="btn btn--primary tray__go" type="button" aria-disabled="true">Vergleichen (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)})</button>`);
					_push(`</div><!--]-->`);
				} else {
					_push(`<!--[--><button class="tray__thumbs-btn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Deinen Vergleich anzeigen, ${(0, vue_exports.unref)(store).count} von ${(0, vue_exports.unref)(4)}`)}><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).items, (item) => {
						_push(`<span class="tray__img tray__thumb">`);
						if (item.image) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
							image: item.image,
							alt: "",
							sizes: "36px"
						}, null, _parent));
						else _push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, null, null, _parent));
						_push(`</span>`);
					});
					_push(`<!--]--></button><span class="tray__count small num muted">${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(4))}</span>`);
					if ((0, vue_exports.unref)(store).canCompare) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: href.value,
						class: "btn btn--primary btn--sm tray__go"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Vergleichen (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)})`);
							else return [(0, vue_exports.createTextVNode)("Vergleichen (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(store).count) + ")", 1)];
						}),
						_: 1
					}, _parent));
					else _push(`<button class="btn btn--primary btn--sm tray__go" type="button" aria-disabled="true">Vergleichen (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)})</button>`);
					_push(`<!--]-->`);
				}
				_push(`</div></section>`);
			} else _push(`<!---->`);
			if (phone.value && (0, vue_exports.unref)(store).count > 0) _push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
				id: "vergleich",
				open: sheetOpen.value,
				"onUpdate:open": ($event) => sheetOpen.value = $event,
				snap: "half",
				title: `Dein Vergleich (${(0, vue_exports.unref)(store).count} von ${(0, vue_exports.unref)(4)})`
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="tray__sheet-rows"${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).items, (item) => {
							_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
								key: (0, vue_exports.unref)(compareKey)(item),
								static: "",
								title: name(item),
								sub: item.finishName
							}, {
								leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<span class="tray__img"${_scopeId}>`);
										if (item.image) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
											image: item.image,
											alt: "",
											sizes: "48px"
										}, null, _parent, _scopeId));
										else _push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, null, null, _parent, _scopeId));
										_push(`</span>`);
									} else return [(0, vue_exports.createVNode)("span", { class: "tray__img" }, [item.image ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
										key: 0,
										image: item.image,
										alt: "",
										sizes: "48px"
									}, null, 8, ["image"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(WheelOutline_default, { key: 1 }))])];
								}),
								trailing: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<button class="icon-btn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${name(item)} entfernen`)}${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
											name: "trash",
											size: 20
										}, null, _parent, _scopeId));
										_push(`</button>`);
									} else return [(0, vue_exports.createVNode)("button", {
										class: "icon-btn",
										type: "button",
										"aria-label": `${name(item)} entfernen`,
										onClick: ($event) => remove(item)
									}, [(0, vue_exports.createVNode)(Icon_default, {
										name: "trash",
										size: 20
									})], 8, ["aria-label", "onClick"])];
								}),
								_: 2
							}, _parent, _scopeId));
						});
						_push(`<!--]--></div><div class="tray__sheet-foot"${_scopeId}>`);
						if (!(0, vue_exports.unref)(store).canCompare) _push(`<p class="small muted"${_scopeId}>Wähle mindestens 2 Felgen.</p>`);
						else _push(`<!---->`);
						_push(`<button class="btn btn--ghost btn--block" type="button"${_scopeId}>Alle entfernen</button>`);
						if ((0, vue_exports.unref)(store).canCompare) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: href.value,
							class: "btn btn--primary btn--block"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Vergleichen (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)})`);
								else return [(0, vue_exports.createTextVNode)("Vergleichen (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(store).count) + ")", 1)];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<button class="btn btn--primary btn--block" type="button" aria-disabled="true"${_scopeId}>Vergleichen (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).count)})</button>`);
						_push(`</div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "tray__sheet-rows" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(store).items, (item) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
							key: (0, vue_exports.unref)(compareKey)(item),
							static: "",
							title: name(item),
							sub: item.finishName
						}, {
							leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "tray__img" }, [item.image ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
								key: 0,
								image: item.image,
								alt: "",
								sizes: "48px"
							}, null, 8, ["image"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(WheelOutline_default, { key: 1 }))])]),
							trailing: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "icon-btn",
								type: "button",
								"aria-label": `${name(item)} entfernen`,
								onClick: ($event) => remove(item)
							}, [(0, vue_exports.createVNode)(Icon_default, {
								name: "trash",
								size: 20
							})], 8, ["aria-label", "onClick"])]),
							_: 2
						}, 1032, ["title", "sub"]);
					}), 128))]), (0, vue_exports.createVNode)("div", { class: "tray__sheet-foot" }, [
						!(0, vue_exports.unref)(store).canCompare ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "small muted"
						}, "Wähle mindestens 2 Felgen.")) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("button", {
							class: "btn btn--ghost btn--block",
							type: "button",
							onClick: ($event) => (0, vue_exports.unref)(store).clear()
						}, "Alle entfernen", 8, ["onClick"]),
						(0, vue_exports.unref)(store).canCompare ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
							key: 1,
							href: href.value,
							class: "btn btn--primary btn--block"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Vergleichen (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(store).count) + ")", 1)]),
							_: 1
						}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
							key: 2,
							class: "btn btn--primary btn--block",
							type: "button",
							"aria-disabled": "true"
						}, "Vergleichen (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(store).count) + ")", 1))
					])];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Compare/CompareTray.vue
var _sfc_setup = CompareTray_vue_vue_type_script_setup_true_lang_default.setup;
CompareTray_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Compare/CompareTray.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CompareTray_default = CompareTray_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/composables/useShortcuts.ts
/**
* The keyboard shortcuts of the shell: `/` focuses the search, Ctrl/⌘+K opens the palette, `?`
* opens the help. None of them fires while the visitor is typing in a field, and none fires
* while a dialog is open — Esc belongs to the dialog then.
*/
/** True when the key event came from something that takes typing. */
function isTyping(target) {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
/** Which handler, if any, a key event maps to. Exposed for the unit test. */
function shortcutFor(event) {
	if (isTyping(event.target)) return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" ? "onPalette" : null;
	if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") return "onPalette";
	if (event.ctrlKey || event.metaKey || event.altKey) return null;
	if (event.key === "/") return "onSearch";
	if (event.key === "?") return "onHelp";
	return null;
}
function useShortcuts(handlers) {
	function onKeydown(event) {
		if (document.querySelector("[role=\"dialog\"][data-state=\"open\"]") !== null && !(event.ctrlKey || event.metaKey)) return;
		const handler = shortcutFor(event);
		if (handler === null) return;
		event.preventDefault();
		handlers[handler]();
	}
	(0, vue_exports.onMounted)(() => document.addEventListener("keydown", onKeydown));
	(0, vue_exports.onBeforeUnmount)(() => document.removeEventListener("keydown", onKeydown));
}
//#endregion
export { provideShell as _, MainMenu_default as a, remember as b, totalNote as c, COOKIES as d, provideConsent as f, useShared as g, useMenus as h, WheelOutline_default as i, usePriceTerms as l, resolveHref as m, CompareTray_default as n, DemoBadge_default as o, useConsent as p, useCompare as r, priceTerms as s, useShortcuts as t, CookieConsent_default as u, useShell as v, useSearch as x, readRecent as y };
