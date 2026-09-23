import { c as vue_exports, o as router, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, i as Toast_default, n as useMenus, r as useShared } from "./useShared-CY71KcPZ.js";
import { a as DialogOverlay_default, n as DialogTitle_default, r as DialogPortal_default, s as DialogContent_default, y as DialogRoot_default } from "./Dialog-D0E0ckTw.js";
import { S as useSearch, _ as useConsent, b as readRecent, c as stripSheetState, d as provideMobileShell, f as useMobileShell, g as provideConsent, h as CookieConsent_default, l as useSheetHistory, m as DemoBadge_default, n as CompareTray_default, o as ListRow_default, p as MainMenu_default, s as BottomSheet_default, t as useShortcuts, u as isNavigationVisit, v as provideShell, x as remember } from "./useShortcuts-XJHE0tId.js";
import { t as Skeleton_default } from "./Skeleton-CJiktMEO.js";
//#region resources/js/composables/mobile/useNavigationDirection.ts
/**
* Which way a navigation goes, decided before Inertia swaps the page, so the view transition
* can slide the right way.
*
*   forward  a drill-down: the new screen slides in from the right, the old one shifts left
*   tab      a bottom-bar switch: a short cross-fade, no sliding
*   back     never animated — the platform already animates the swipe-back gesture
*
* The direction lands on `<html data-nav="…">`, the CSS in MobileLayout keys on it, and Inertia
* is asked for a view transition on every plain GET visit (`visit.viewTransition` is mutable in
* the `before` event). Popstate visits never get one: Inertia restores those quietly.
*
* The same module keeps a depth counter, so a back arrow knows whether there is anything to go
* back to inside this session. `history.length` cannot say that.
*/
var DEPTH_KEY = "rmf.nav.depth";
var pendingDirection = null;
var popped = false;
var installed = false;
function readDepth() {
	try {
		return Number(sessionStorage.getItem(DEPTH_KEY) ?? "0") || 0;
	} catch {
		return 0;
	}
}
function writeDepth(value) {
	try {
		sessionStorage.setItem(DEPTH_KEY, String(Math.max(0, value)));
	} catch {}
}
function reducedMotion() {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/** Announce the direction of the very next visit (a navigation calls this before it moves). */
function markNext(direction) {
	pendingDirection = direction;
}
function setDirection(direction) {
	document.documentElement.dataset.nav = direction;
}
/** Installed once by the mobile layout. Returns the teardown. */
function installNavigationDirection() {
	if (installed || typeof window === "undefined") return () => void 0;
	installed = true;
	const onPop = () => {
		popped = true;
		setDirection("back");
	};
	window.addEventListener("popstate", onPop);
	const offBefore = router.on("before", (event) => {
		const visit = event.detail.visit;
		if (visit.prefetch || visit.async || visit.method !== "get" || visit.only.length > 0 || visit.except.length > 0) return;
		const direction = pendingDirection ?? "forward";
		pendingDirection = null;
		setDirection(direction);
		if (!reducedMotion() && "startViewTransition" in document) visit.viewTransition = true;
	});
	const offNavigate = router.on("navigate", () => {
		if (popped) {
			popped = false;
			writeDepth(readDepth() - 1);
			return;
		}
		writeDepth(readDepth() + 1);
	});
	return () => {
		window.removeEventListener("popstate", onPop);
		offBefore();
		offNavigate();
		installed = false;
	};
}
//#endregion
//#region resources/js/Components/Mobile/AppBar.vue?vue&type=script&setup=true&lang.ts
var AppBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AppBar",
	__ssrInlineRender: true,
	props: {
		top: {
			type: Boolean,
			default: false
		},
		title: { default: void 0 },
		large: {
			type: Boolean,
			default: false
		},
		back: { default: "/" }
	},
	setup(__props) {
		/**
		* The top app bar: 56 px plus the status-bar inset, sticky, never changing height.
		*
		* On a top-level page it carries the wordmark (the homepage) or nothing on the left, and the
		* search, the vehicle and the menu on the right — three targets, which is what fits beside the
		* wordmark at 390 px. On an inner page: the back arrow (44 px), a truncated title, the page's own
		* actions, and the menu — which is where the destinations and the basket live now that no bar
		* crosses the bottom of the screen. A page may ask for a large title: 28 px under the bar, in the
		* flow, which collapses into the bar as it scrolls under it — scroll-driven where the browser
		* can, an IntersectionObserver everywhere else.
		*
		* The bar gains `--e-1` once the page has scrolled under it, and nothing else.
		*
		* While the shop shows demonstration rows, the *Demodaten* badge sits after the wordmark or the
		* title (ACCURACY D4). The title is the one element that shrinks, so the badge never covers it
		* and never pushes an action off the row.
		*/
		const props = __props;
		const shared = useShared();
		useMobileShell();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const showBrand = (0, vue_exports.computed)(() => props.top && !props.title);
		const sentinel = (0, vue_exports.ref)(null);
		const largeTitle = (0, vue_exports.ref)(null);
		const scrolled = (0, vue_exports.ref)(false);
		const collapsed = (0, vue_exports.ref)(false);
		let scrollObserver;
		let titleObserver;
		(0, vue_exports.onMounted)(() => {
			if (sentinel.value) {
				scrollObserver = new IntersectionObserver(([entry]) => {
					scrolled.value = entry ? !entry.isIntersecting : false;
				});
				scrollObserver.observe(sentinel.value);
			}
			if (largeTitle.value) {
				titleObserver = new IntersectionObserver(([entry]) => {
					collapsed.value = entry ? !entry.isIntersecting : false;
				}, {
					rootMargin: `-${largeTitle.value.offsetTop + 1}px 0px 0px 0px`,
					threshold: .5
				});
				titleObserver.observe(largeTitle.value);
			}
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			scrollObserver?.disconnect();
			titleObserver?.disconnect();
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><div class="mbar__sentinel" aria-hidden="true" data-v-b89dae05></div><header class="${(0, server_renderer_exports.ssrRenderClass)([{
				"mbar--scrolled": scrolled.value,
				"mbar--collapsed": collapsed.value,
				"mbar--large": __props.large && __props.title
			}, "mbar"])}" data-v-b89dae05><div class="mbar__row" data-v-b89dae05>`);
			if (__props.top) {
				_push(`<!--[-->`);
				if (showBrand.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/",
					class: "mbar__brand",
					"aria-label": "RIMIFY – Startseite"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`RIMIFY`);
						else return [(0, vue_exports.createTextVNode)("RIMIFY")];
					}),
					_: 1
				}, _parent));
				else _push(`<p class="mbar__title"${(0, server_renderer_exports.ssrRenderAttr)("aria-hidden", __props.large ? "true" : void 0)} data-v-b89dae05>${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DemoBadge_default, null, null, _parent));
				_push(`<div class="mbar__tools" data-v-b89dae05><button class="icon-btn m-press" type="button" aria-label="Suche" data-v-b89dae05>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "search",
					size: 24
				}, null, _parent));
				_push(`</button>`);
				if (vehicle.value) {
					_push(`<button class="icon-btn m-press mbar__vicon" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Dein Fahrzeug: ${vehicle.value.label}`)} data-v-b89dae05>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "car",
						size: 24
					}, null, _parent));
					_push(`<span class="mbar__dot" aria-hidden="true" data-v-b89dae05></span></button>`);
				} else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "icon-btn m-press",
					"aria-label": "Fahrzeug wählen"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "car",
							size: 24
						}, null, _parent, _scopeId));
						else return [(0, vue_exports.createVNode)(Icon_default, {
							name: "car",
							size: 24
						})];
					}),
					_: 1
				}, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)(MainMenu_default, null, null, _parent));
				_push(`</div><!--]-->`);
			} else {
				_push(`<!--[-->`);
				if (__props.back !== null) {
					_push(`<button class="icon-btn m-press mbar__back" type="button" aria-label="Zurück" data-v-b89dae05>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "arrow-left",
						size: 24
					}, null, _parent));
					_push(`</button>`);
				} else _push(`<!---->`);
				_push(`<p class="mbar__title"${(0, server_renderer_exports.ssrRenderAttr)("aria-hidden", __props.large ? "true" : void 0)} data-v-b89dae05>${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(DemoBadge_default, null, null, _parent));
				_push(`<div class="mbar__tools" data-v-b89dae05>`);
				(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "actions", {}, null, _push, _parent);
				_push((0, server_renderer_exports.ssrRenderComponent)(MainMenu_default, null, null, _parent));
				_push(`</div><!--]-->`);
			}
			_push(`</div></header>`);
			if (__props.large && __props.title) _push(`<h1 class="mbar__large h2" data-v-b89dae05>${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</h1>`);
			else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/AppBar.vue
var _sfc_setup$3 = AppBar_vue_vue_type_script_setup_true_lang_default.setup;
AppBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/AppBar.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var AppBar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AppBar_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b89dae05"]]);
//#endregion
//#region resources/js/Components/Mobile/MobileFooter.vue?vue&type=script&setup=true&lang.ts
var MobileFooter_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "MobileFooter",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The phone's footer: short, because the header's menu already holds the destinations. Service and
		* legal links as rows, the cookie settings, the price note the law wants next to every price
		* list, and the copyright. It sits on the band, not the dark tone — the page's one dark band
		* belongs to the content (DIRECTION §2).
		*/
		const menus = useMenus();
		const consent = useConsent();
		const service = (0, vue_exports.computed)(() => menus.value.footer_service ?? []);
		const legal = (0, vue_exports.computed)(() => menus.value.footer_legal ?? []);
		const year = (/* @__PURE__ */ new Date()).getFullYear();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<footer${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "mfoot" }, _attrs))} data-v-fc8e68df><p class="mfoot__claim" data-v-fc8e68df>Felgen, deren Gutachten dein Fahrzeug nennt.</p><nav aria-label="Service" data-v-fc8e68df><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(service.value, (item) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
					key: item.label,
					title: item.label,
					href: item.href
				}, null, _parent));
			});
			_push(`<!--]--></nav><nav aria-label="Rechtliches" data-v-fc8e68df><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(legal.value, (item) => {
				_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
					key: item.label,
					title: item.label,
					href: item.href
				}, null, _parent));
			});
			_push(`<!--]-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
				title: "Cookie-Einstellungen",
				onActivate: ($event) => (0, vue_exports.unref)(consent).openSettings()
			}, null, _parent));
			_push(`</nav><p class="mfoot__legal small muted" data-v-fc8e68df>Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten.</p><p class="mfoot__legal small quiet num" data-v-fc8e68df>© ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(year))} RIMIFY</p></footer>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/MobileFooter.vue
var _sfc_setup$2 = MobileFooter_vue_vue_type_script_setup_true_lang_default.setup;
MobileFooter_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/MobileFooter.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var MobileFooter_default = /*#__PURE__*/ _plugin_vue_export_helper_default(MobileFooter_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fc8e68df"]]);
//#endregion
//#region resources/js/Components/Mobile/SearchSheet.vue?vue&type=script&setup=true&lang.ts
var SearchSheet_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SearchSheet",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Search as a full-screen sheet: the field at the top with the keyboard's focus, "Abbrechen"
		* beside it, and under it the recent searches, then the grouped results as the visitor types —
		* everything reachable with one thumb. The sheet is as tall as the visual viewport, so the last
		* result is never under the keyboard. Back closes it.
		*/
		const shared = useShared();
		const shell = useMobileShell();
		const search = useSearch();
		const open = (0, vue_exports.computed)({
			get: () => shell.searchOpen.value,
			set: (value) => {
				shell.searchOpen.value = value;
			}
		});
		const query = (0, vue_exports.ref)("");
		const input = (0, vue_exports.ref)(null);
		const recent = (0, vue_exports.ref)([]);
		let closedByHistory = false;
		const history = useSheetHistory("search", () => {
			closedByHistory = true;
			open.value = false;
		});
		(0, vue_exports.watch)(open, async (isOpen) => {
			if (isOpen) {
				query.value = "";
				search.clear();
				recent.value = readRecent();
				history.open();
				await (0, vue_exports.nextTick)();
				input.value?.focus();
				return;
			}
			if (closedByHistory) {
				closedByHistory = false;
				return;
			}
			history.close();
		});
		(0, vue_exports.watch)(query, (value) => search.run(value));
		const ICONS = {
			felgen: "wheel",
			marken: "grid",
			groessen: "ruler",
			seiten: "document"
		};
		const groups = (0, vue_exports.computed)(() => (search.result.value?.groups ?? []).map((group) => ({
			...group,
			icon: ICONS[group.key] ?? "search"
		})));
		const quick = (0, vue_exports.computed)(() => {
			const vehicle = shared.value.vehicle;
			const list = [];
			if (vehicle) {
				list.push({
					label: `Passende Felgen für ${vehicle.short}`,
					sub: vehicle.label,
					href: "/felgen",
					icon: "wheel"
				});
				list.push({
					label: "Fahrzeug ändern",
					sub: null,
					href: "/felgen-suchen",
					icon: "car"
				});
			} else list.push({
				label: "Fahrzeug wählen",
				sub: "Marke und Modell oder HSN/TSN",
				href: "/felgen-suchen",
				icon: "car"
			});
			list.push({
				label: "RIMIFY-Check",
				sub: "Passt eine Felge an mein Auto?",
				href: "/rimify-check",
				icon: "check-circle"
			});
			list.push({
				label: "Warenkorb",
				sub: shared.value.cartCount > 0 ? `${shared.value.cartCount} Artikel` : null,
				href: "/warenkorb",
				icon: "cart"
			});
			return list;
		});
		const nothingFound = (0, vue_exports.computed)(() => query.value.trim() !== "" && search.result.value !== null && search.result.value.total === 0);
		/** Close first, then go, so the sheet's history entry is gone before Inertia pushes its own. */
		async function go(href) {
			if (href === void 0) return;
			if (query.value.trim() !== "") remember(query.value.trim());
			closedByHistory = true;
			open.value = false;
			await history.close();
			router.visit(href);
		}
		function submit() {
			const first = groups.value[0]?.items[0];
			if (first) go(first.href);
		}
		function useSuggestion() {
			if (search.result.value?.suggestion) query.value = search.result.value.suggestion;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogRoot_default), (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }, null, _parent, _scopeId));
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogContent_default), {
									class: "msearch",
									"aria-describedby": ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`Suche`);
													else return [(0, vue_exports.createTextVNode)("Suche")];
												}),
												_: 1
											}, _parent, _scopeId));
											_push(`<form class="msearch__bar" role="search"${_scopeId}><div class="input-group msearch__field"${_scopeId}><span class="input-group__icon"${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
												name: "search",
												size: 20
											}, null, _parent, _scopeId));
											_push(`</span><input${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" name="q" aria-label="Suche" placeholder="Felge, Marke oder Größe" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="search" enterkeyhint="search"${_scopeId}></div><button class="btn btn--ghost msearch__cancel" type="button"${_scopeId}>Abbrechen</button></form><div class="msearch__list"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(search).loading.value ? "true" : void 0)}${_scopeId}>`);
											if (query.value.trim() === "") {
												_push(`<!--[-->`);
												if (recent.value.length) {
													_push(`<!--[--><p class="menu__label"${_scopeId}>Zuletzt gesucht</p><!--[-->`);
													(0, server_renderer_exports.ssrRenderList)(recent.value, (term) => {
														_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
															key: term,
															icon: "clock",
															title: term,
															onActivate: ($event) => query.value = term
														}, null, _parent, _scopeId));
													});
													_push(`<!--]--><!--]-->`);
												} else _push(`<!---->`);
												_push(`<p class="menu__label"${_scopeId}>Direkt zu</p><!--[-->`);
												(0, server_renderer_exports.ssrRenderList)(quick.value, (item) => {
													_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
														key: item.href,
														icon: item.icon,
														title: item.label,
														sub: item.sub ?? void 0,
														href: item.href,
														manual: "",
														onActivate: go
													}, null, _parent, _scopeId));
												});
												_push(`<!--]--><!--]-->`);
											} else {
												_push(`<!--[-->`);
												if ((0, vue_exports.unref)(search).loading.value && groups.value.length === 0) {
													_push(`<!--[-->`);
													(0, server_renderer_exports.ssrRenderList)(4, (n) => {
														_push(`<div class="msearch__skeleton" aria-hidden="true"${_scopeId}>`);
														_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
															width: "24px",
															height: "24px"
														}, null, _parent, _scopeId));
														_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
															width: "62%",
															height: "var(--lh-body)"
														}, null, _parent, _scopeId));
														_push(`</div>`);
													});
													_push(`<!--]-->`);
												} else _push(`<!---->`);
												_push(`<!--[-->`);
												(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
													_push(`<!--[--><p class="menu__label"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p><!--[-->`);
													(0, server_renderer_exports.ssrRenderList)(group.items, (item) => {
														_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
															key: item.href,
															icon: group.icon,
															title: item.label,
															sub: item.sub ?? void 0,
															href: item.href,
															manual: "",
															onActivate: go
														}, null, _parent, _scopeId));
													});
													_push(`<!--]--><!--]-->`);
												});
												_push(`<!--]-->`);
												if (nothingFound.value) {
													_push(`<div class="msearch__empty"${_scopeId}><p${_scopeId}>Nichts gefunden für „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“.</p>`);
													if ((0, vue_exports.unref)(search).result.value?.suggestion) _push(`<button class="link" type="button"${_scopeId}> Meintest du „${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(search).result.value.suggestion)}“? </button>`);
													else _push(`<p class="small muted"${_scopeId}>Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“.</p>`);
													_push(`</div>`);
												} else _push(`<!---->`);
												if ((0, vue_exports.unref)(search).failed.value) _push(`<p class="msearch__empty"${_scopeId}>Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.</p>`);
												else _push(`<!---->`);
												_push(`<!--]-->`);
											}
											_push(`</div>`);
										} else return [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Suche")]),
												_: 1
											}),
											(0, vue_exports.createVNode)("form", {
												class: "msearch__bar",
												role: "search",
												onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
											}, [(0, vue_exports.createVNode)("div", { class: "input-group msearch__field" }, [(0, vue_exports.createVNode)("span", { class: "input-group__icon" }, [(0, vue_exports.createVNode)(Icon_default, {
												name: "search",
												size: 20
											})]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
												ref_key: "input",
												ref: input,
												"onUpdate:modelValue": ($event) => query.value = $event,
												class: "input",
												type: "search",
												name: "q",
												"aria-label": "Suche",
												placeholder: "Felge, Marke oder Größe",
												autocomplete: "off",
												autocapitalize: "off",
												autocorrect: "off",
												spellcheck: "false",
												inputmode: "search",
												enterkeyhint: "search"
											}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, query.value]])]), (0, vue_exports.createVNode)("button", {
												class: "btn btn--ghost msearch__cancel",
												type: "button",
												onClick: ($event) => open.value = false
											}, "Abbrechen", 8, ["onClick"])], 32),
											(0, vue_exports.createVNode)("div", {
												class: "msearch__list",
												"aria-busy": (0, vue_exports.unref)(search).loading.value ? "true" : void 0
											}, [query.value.trim() === "" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
												recent.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("p", { class: "menu__label" }, "Zuletzt gesucht"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(recent.value, (term) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
														key: term,
														icon: "clock",
														title: term,
														onActivate: ($event) => query.value = term
													}, null, 8, ["title", "onActivate"]);
												}), 128))], 64)) : (0, vue_exports.createCommentVNode)("", true),
												(0, vue_exports.createVNode)("p", { class: "menu__label" }, "Direkt zu"),
												((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(quick.value, (item) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
														key: item.href,
														icon: item.icon,
														title: item.label,
														sub: item.sub ?? void 0,
														href: item.href,
														manual: "",
														onActivate: go
													}, null, 8, [
														"icon",
														"title",
														"sub",
														"href"
													]);
												}), 128))
											], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
												(0, vue_exports.unref)(search).loading.value && groups.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, (0, vue_exports.renderList)(4, (n) => {
													return (0, vue_exports.createVNode)("div", {
														key: n,
														class: "msearch__skeleton",
														"aria-hidden": "true"
													}, [(0, vue_exports.createVNode)(Skeleton_default, {
														width: "24px",
														height: "24px"
													}), (0, vue_exports.createVNode)(Skeleton_default, {
														width: "62%",
														height: "var(--lh-body)"
													})]);
												}), 64)) : (0, vue_exports.createCommentVNode)("", true),
												((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (group) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: group.key }, [(0, vue_exports.createVNode)("p", { class: "menu__label" }, (0, vue_exports.toDisplayString)(group.label), 1), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.items, (item) => {
														return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
															key: item.href,
															icon: group.icon,
															title: item.label,
															sub: item.sub ?? void 0,
															href: item.href,
															manual: "",
															onActivate: go
														}, null, 8, [
															"icon",
															"title",
															"sub",
															"href"
														]);
													}), 128))], 64);
												}), 128)),
												nothingFound.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
													key: 1,
													class: "msearch__empty"
												}, [(0, vue_exports.createVNode)("p", null, "Nichts gefunden für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“.", 1), (0, vue_exports.unref)(search).result.value?.suggestion ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
													key: 0,
													class: "link",
													type: "button",
													onClick: useSuggestion
												}, " Meintest du „" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(search).result.value.suggestion) + "“? ", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
													key: 1,
													class: "small muted"
												}, "Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“."))])) : (0, vue_exports.createCommentVNode)("", true),
												(0, vue_exports.unref)(search).failed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
													key: 2,
													class: "msearch__empty"
												}, "Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.")) : (0, vue_exports.createCommentVNode)("", true)
											], 64))], 8, ["aria-busy"])
										];
									}),
									_: 1
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
								class: "msearch",
								"aria-describedby": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Suche")]),
										_: 1
									}),
									(0, vue_exports.createVNode)("form", {
										class: "msearch__bar",
										role: "search",
										onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
									}, [(0, vue_exports.createVNode)("div", { class: "input-group msearch__field" }, [(0, vue_exports.createVNode)("span", { class: "input-group__icon" }, [(0, vue_exports.createVNode)(Icon_default, {
										name: "search",
										size: 20
									})]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										ref_key: "input",
										ref: input,
										"onUpdate:modelValue": ($event) => query.value = $event,
										class: "input",
										type: "search",
										name: "q",
										"aria-label": "Suche",
										placeholder: "Felge, Marke oder Größe",
										autocomplete: "off",
										autocapitalize: "off",
										autocorrect: "off",
										spellcheck: "false",
										inputmode: "search",
										enterkeyhint: "search"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, query.value]])]), (0, vue_exports.createVNode)("button", {
										class: "btn btn--ghost msearch__cancel",
										type: "button",
										onClick: ($event) => open.value = false
									}, "Abbrechen", 8, ["onClick"])], 32),
									(0, vue_exports.createVNode)("div", {
										class: "msearch__list",
										"aria-busy": (0, vue_exports.unref)(search).loading.value ? "true" : void 0
									}, [query.value.trim() === "" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
										recent.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("p", { class: "menu__label" }, "Zuletzt gesucht"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(recent.value, (term) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
												key: term,
												icon: "clock",
												title: term,
												onActivate: ($event) => query.value = term
											}, null, 8, ["title", "onActivate"]);
										}), 128))], 64)) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)("p", { class: "menu__label" }, "Direkt zu"),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(quick.value, (item) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
												key: item.href,
												icon: item.icon,
												title: item.label,
												sub: item.sub ?? void 0,
												href: item.href,
												manual: "",
												onActivate: go
											}, null, 8, [
												"icon",
												"title",
												"sub",
												"href"
											]);
										}), 128))
									], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
										(0, vue_exports.unref)(search).loading.value && groups.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, (0, vue_exports.renderList)(4, (n) => {
											return (0, vue_exports.createVNode)("div", {
												key: n,
												class: "msearch__skeleton",
												"aria-hidden": "true"
											}, [(0, vue_exports.createVNode)(Skeleton_default, {
												width: "24px",
												height: "24px"
											}), (0, vue_exports.createVNode)(Skeleton_default, {
												width: "62%",
												height: "var(--lh-body)"
											})]);
										}), 64)) : (0, vue_exports.createCommentVNode)("", true),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (group) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: group.key }, [(0, vue_exports.createVNode)("p", { class: "menu__label" }, (0, vue_exports.toDisplayString)(group.label), 1), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.items, (item) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
													key: item.href,
													icon: group.icon,
													title: item.label,
													sub: item.sub ?? void 0,
													href: item.href,
													manual: "",
													onActivate: go
												}, null, 8, [
													"icon",
													"title",
													"sub",
													"href"
												]);
											}), 128))], 64);
										}), 128)),
										nothingFound.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											key: 1,
											class: "msearch__empty"
										}, [(0, vue_exports.createVNode)("p", null, "Nichts gefunden für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“.", 1), (0, vue_exports.unref)(search).result.value?.suggestion ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
											key: 0,
											class: "link",
											type: "button",
											onClick: useSuggestion
										}, " Meintest du „" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(search).result.value.suggestion) + "“? ", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 1,
											class: "small muted"
										}, "Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“."))])) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.unref)(search).failed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 2,
											class: "msearch__empty"
										}, "Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.")) : (0, vue_exports.createCommentVNode)("", true)
									], 64))], 8, ["aria-busy"])
								]),
								_: 1
							})];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
							class: "msearch",
							"aria-describedby": ""
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Suche")]),
									_: 1
								}),
								(0, vue_exports.createVNode)("form", {
									class: "msearch__bar",
									role: "search",
									onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
								}, [(0, vue_exports.createVNode)("div", { class: "input-group msearch__field" }, [(0, vue_exports.createVNode)("span", { class: "input-group__icon" }, [(0, vue_exports.createVNode)(Icon_default, {
									name: "search",
									size: 20
								})]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									ref_key: "input",
									ref: input,
									"onUpdate:modelValue": ($event) => query.value = $event,
									class: "input",
									type: "search",
									name: "q",
									"aria-label": "Suche",
									placeholder: "Felge, Marke oder Größe",
									autocomplete: "off",
									autocapitalize: "off",
									autocorrect: "off",
									spellcheck: "false",
									inputmode: "search",
									enterkeyhint: "search"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, query.value]])]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--ghost msearch__cancel",
									type: "button",
									onClick: ($event) => open.value = false
								}, "Abbrechen", 8, ["onClick"])], 32),
								(0, vue_exports.createVNode)("div", {
									class: "msearch__list",
									"aria-busy": (0, vue_exports.unref)(search).loading.value ? "true" : void 0
								}, [query.value.trim() === "" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
									recent.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("p", { class: "menu__label" }, "Zuletzt gesucht"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(recent.value, (term) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
											key: term,
											icon: "clock",
											title: term,
											onActivate: ($event) => query.value = term
										}, null, 8, ["title", "onActivate"]);
									}), 128))], 64)) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("p", { class: "menu__label" }, "Direkt zu"),
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(quick.value, (item) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
											key: item.href,
											icon: item.icon,
											title: item.label,
											sub: item.sub ?? void 0,
											href: item.href,
											manual: "",
											onActivate: go
										}, null, 8, [
											"icon",
											"title",
											"sub",
											"href"
										]);
									}), 128))
								], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
									(0, vue_exports.unref)(search).loading.value && groups.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, (0, vue_exports.renderList)(4, (n) => {
										return (0, vue_exports.createVNode)("div", {
											key: n,
											class: "msearch__skeleton",
											"aria-hidden": "true"
										}, [(0, vue_exports.createVNode)(Skeleton_default, {
											width: "24px",
											height: "24px"
										}), (0, vue_exports.createVNode)(Skeleton_default, {
											width: "62%",
											height: "var(--lh-body)"
										})]);
									}), 64)) : (0, vue_exports.createCommentVNode)("", true),
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (group) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: group.key }, [(0, vue_exports.createVNode)("p", { class: "menu__label" }, (0, vue_exports.toDisplayString)(group.label), 1), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.items, (item) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
												key: item.href,
												icon: group.icon,
												title: item.label,
												sub: item.sub ?? void 0,
												href: item.href,
												manual: "",
												onActivate: go
											}, null, 8, [
												"icon",
												"title",
												"sub",
												"href"
											]);
										}), 128))], 64);
									}), 128)),
									nothingFound.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 1,
										class: "msearch__empty"
									}, [(0, vue_exports.createVNode)("p", null, "Nichts gefunden für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“.", 1), (0, vue_exports.unref)(search).result.value?.suggestion ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
										key: 0,
										class: "link",
										type: "button",
										onClick: useSuggestion
									}, " Meintest du „" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(search).result.value.suggestion) + "“? ", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 1,
										class: "small muted"
									}, "Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“."))])) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.unref)(search).failed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 2,
										class: "msearch__empty"
									}, "Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.")) : (0, vue_exports.createCommentVNode)("", true)
								], 64))], 8, ["aria-busy"])
							]),
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
//#region resources/js/Components/Mobile/SearchSheet.vue
var _sfc_setup$1 = SearchSheet_vue_vue_type_script_setup_true_lang_default.setup;
SearchSheet_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/SearchSheet.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var SearchSheet_default = SearchSheet_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Layouts/MobileLayout.vue?vue&type=script&setup=true&lang.ts
var MobileLayout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "MobileLayout",
	__ssrInlineRender: true,
	props: {
		title: { default: void 0 },
		large: {
			type: Boolean,
			default: false
		},
		back: { default: "/" },
		footer: {
			type: Boolean,
			default: true
		}
	},
	setup(__props) {
		/**
		* The phone frame: app bar, page, footer, and the overlays the shell owns — the vehicle sheet,
		* the search sheet, the cookie choice, the toast. The destinations live in the app bar's menu;
		* nothing crosses the bottom of the screen but a page's own sticky action bar.
		*
		* A page applies it with `defineOptions({ layout: MobileLayout })` and, when it needs the bar to
		* say something, passes props through the layout function:
		*
		*     defineOptions({ layout: (h, page) => h(MobileLayout, { title: 'Warenkorb', large: true }, () => page) })
		*
		* The props arrive before anything renders, so the server's first frame already carries the
		* right bar. Nothing here consults `window` outside `onMounted`.
		*
		* Navigation: every plain GET visit gets a view transition whose direction was decided before
		* the visit (`useNavigationDirection`); back is never animated; every open sheet closes and
		* gives its history entry back before Inertia pushes its own.
		*/
		const props = __props;
		/** Routes whose screens are tabs: no back arrow, search and vehicle in the bar. */
		const TOP_LEVEL = /* @__PURE__ */ new Set([
			"startseite",
			"felgen.index",
			"check.index",
			"warenkorb.index"
		]);
		/** What the bar says on an inner route that passes no title of its own. */
		const ROUTE_TITLES = {
			"felgen.suchen": "Fahrzeug wählen",
			"felgen.show": "Felge",
			"check.ergebnis": "Ergebnis",
			"kasse.index": "Kasse",
			"bestellung.show": "Bestellung",
			faq: "Fragen und Antworten",
			kontakt: "Kontakt",
			rechtliches: "Rechtliches"
		};
		const shared = useShared();
		provideShell();
		provideConsent(shared.value.consent ?? null);
		const shell = provideMobileShell();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const bar = (0, vue_exports.computed)(() => {
			const name = shared.value.routeName ?? "";
			const top = TOP_LEVEL.has(name);
			return {
				top,
				title: props.title ?? (top ? void 0 : ROUTE_TITLES[name] ?? "RIMIFY"),
				large: props.large,
				back: props.back
			};
		});
		const vehicleSheet = (0, vue_exports.computed)({
			get: () => shell.vehicleOpen.value && vehicle.value !== null,
			set: (open) => {
				shell.vehicleOpen.value = open;
			}
		});
		useShortcuts({
			onSearch: () => {
				shell.searchOpen.value = true;
			},
			onPalette: () => {
				shell.searchOpen.value = !shell.searchOpen.value;
			},
			onHelp: () => void 0
		});
		let teardown = [];
		(0, vue_exports.onMounted)(() => {
			teardown.push(installNavigationDirection());
			teardown.push(router.on("before", (event) => {
				if (!isNavigationVisit(event.detail.visit)) return;
				shell.closeSheets();
				stripSheetState();
			}));
			const standalone = window.matchMedia("(display-mode: standalone)");
			const apply = () => {
				const on = standalone.matches || navigator.standalone === true;
				shell.standalone.value = on;
				document.documentElement.classList.toggle("is-standalone", on);
			};
			apply();
			standalone.addEventListener("change", apply);
			teardown.push(() => standalone.removeEventListener("change", apply));
			if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) navigator.serviceWorker.register("/sw.js").catch(() => void 0);
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			for (const stop of teardown) stop();
			teardown = [];
		});
		function removeVehicle() {
			shell.vehicleOpen.value = false;
			router.delete("/fahrzeug", { preserveScroll: true });
		}
		function fromVehicleSheet(href) {
			if (href) {
				markNext("forward");
				router.visit(href);
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["mshell", { "mshell--sticky": (0, vue_exports.unref)(shell).stickyBar.value }] }, _attrs))} data-v-09bd9728><a class="skip-link" href="#inhalt" data-v-09bd9728>Zum Inhalt springen</a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AppBar_default, {
				top: bar.value.top,
				title: bar.value.title,
				large: bar.value.large,
				back: bar.value.back
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) (0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "bar-actions", {}, null, _push, _parent, _scopeId);
					else return [(0, vue_exports.renderSlot)(_ctx.$slots, "bar-actions", {}, void 0, true)];
				}),
				_: 3
			}, _parent));
			_push(`<main id="inhalt" class="mshell__main" data-v-09bd9728>`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</main>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CompareTray_default, { hidden: (0, vue_exports.unref)(shell).stickyBar.value }, null, _parent));
			if (__props.footer) _push((0, server_renderer_exports.ssrRenderComponent)(MobileFooter_default, null, null, _parent));
			else _push(`<!---->`);
			if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
				id: "fahrzeug",
				open: vehicleSheet.value,
				"onUpdate:open": ($event) => vehicleSheet.value = $event,
				title: "Dein Fahrzeug"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="h4" data-v-09bd9728${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="small muted num" data-v-09bd9728${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</p><div class="mshell__vehicle-rows" data-v-09bd9728${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							icon: "wheel",
							title: "Passende Felgen anzeigen",
							href: "/felgen",
							manual: "",
							onActivate: fromVehicleSheet
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							icon: "car",
							title: "Fahrzeug ändern",
							href: "/felgen-suchen",
							manual: "",
							onActivate: fromVehicleSheet
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							icon: "close",
							title: "Fahrzeug entfernen",
							chevron: false,
							onActivate: removeVehicle
						}, null, _parent, _scopeId));
						_push(`</div>`);
					} else return [
						(0, vue_exports.createVNode)("p", { class: "h4" }, (0, vue_exports.toDisplayString)(vehicle.value.label), 1),
						(0, vue_exports.createVNode)("p", { class: "small muted num" }, (0, vue_exports.toDisplayString)(vehicle.value.buildWindow) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.keyNumbers), 1),
						(0, vue_exports.createVNode)("div", { class: "mshell__vehicle-rows" }, [
							(0, vue_exports.createVNode)(ListRow_default, {
								icon: "wheel",
								title: "Passende Felgen anzeigen",
								href: "/felgen",
								manual: "",
								onActivate: fromVehicleSheet
							}),
							(0, vue_exports.createVNode)(ListRow_default, {
								icon: "car",
								title: "Fahrzeug ändern",
								href: "/felgen-suchen",
								manual: "",
								onActivate: fromVehicleSheet
							}),
							(0, vue_exports.createVNode)(ListRow_default, {
								icon: "close",
								title: "Fahrzeug entfernen",
								chevron: false,
								onActivate: removeVehicle
							})
						])
					];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SearchSheet_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(CookieConsent_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Toast_default, null, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Layouts/MobileLayout.vue
var _sfc_setup = MobileLayout_vue_vue_type_script_setup_true_lang_default.setup;
MobileLayout_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/MobileLayout.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var MobileLayout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(MobileLayout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-09bd9728"]]);
//#endregion
export { MobileLayout_default as t };
