import { c as vue_exports, o as router, r as link_default, t as defineStore } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, r as useShared } from "./useShared-B1ZdimaV.js";
import { a as DialogOverlay_default, n as DialogTitle_default, o as DialogDescription_default, r as DialogPortal_default, s as DialogContent_default, t as Dialog_default, v as DialogClose_default, y as DialogRoot_default } from "./Dialog-DGnwH3Iu.js";
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
var KEY$2 = Symbol("shell");
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
	(0, vue_exports.provide)(KEY$2, store);
	return store;
}
function useShell() {
	const store = (0, vue_exports.inject)(KEY$2);
	if (store === void 0) throw new Error("useShell() needs provideShell() in the layout");
	return store;
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
var KEY$1 = Symbol("consent");
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
	(0, vue_exports.provide)(KEY$1, store);
	return store;
}
function useConsent() {
	const store = (0, vue_exports.inject)(KEY$1);
	if (store === void 0) throw new Error("useConsent() needs provideConsent() in the layout");
	return store;
}
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
		const sheetVisible = (0, vue_exports.computed)(() => consent.decided.value === null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if (sheetVisible.value) _push(`<section class="consent" aria-labelledby="consent-title" data-v-ec5d1a8b><h2 id="consent-title" class="h4" data-v-ec5d1a8b>Cookies bei RIMIFY</h2><p class="consent__text" data-v-ec5d1a8b> Wir verwenden Cookies, die für den Shop nötig sind – für den Warenkorb und dein gewähltes Fahrzeug. <a href="/rechtliches/datenschutz" data-v-ec5d1a8b>Mehr in der Datenschutzerklärung</a></p><div class="consent__actions" data-v-ec5d1a8b><button class="btn btn--secondary" type="button" data-v-ec5d1a8b>Verstanden</button></div></section>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: (0, vue_exports.unref)(consent).settingsOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(consent).settingsOpen.value = $event,
				title: "Cookie-Einstellungen",
				description: "Wir verwenden nur Cookies, die für den Shop nötig sind."
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-ec5d1a8b${_scopeId}>Verstanden</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => (0, vue_exports.unref)(consent).acknowledge()
					}, "Verstanden", 8, ["onClick"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<ul class="consent__list" data-v-ec5d1a8b${_scopeId}><li class="consent__row" data-v-ec5d1a8b${_scopeId}><div data-v-ec5d1a8b${_scopeId}><p class="consent__name" data-v-ec5d1a8b${_scopeId}>Notwendig</p><p class="small muted" data-v-ec5d1a8b${_scopeId}>Warenkorb, gewähltes Fahrzeug, Sitzung, deine Cookie-Auswahl.</p></div><span class="small quiet consent__state" data-v-ec5d1a8b${_scopeId}>Immer aktiv</span></li></ul>`);
					else return [(0, vue_exports.createVNode)("ul", { class: "consent__list" }, [(0, vue_exports.createVNode)("li", { class: "consent__row" }, [(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("p", { class: "consent__name" }, "Notwendig"), (0, vue_exports.createVNode)("p", { class: "small muted" }, "Warenkorb, gewähltes Fahrzeug, Sitzung, deine Cookie-Auswahl.")]), (0, vue_exports.createVNode)("span", { class: "small quiet consent__state" }, "Immer aktiv")])])];
				}),
				_: 1
			}, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/CookieConsent.vue
var _sfc_setup$6 = CookieConsent_vue_vue_type_script_setup_true_lang_default.setup;
CookieConsent_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CookieConsent.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var CookieConsent_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CookieConsent_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ec5d1a8b"]]);
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
var _sfc_setup$5 = DemoBadge_vue_vue_type_script_setup_true_lang_default.setup;
DemoBadge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/DemoBadge.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var DemoBadge_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DemoBadge_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f0da4095"]]);
/** Pure: the keyboard inset from the two heights and the visual viewport's offset. */
function measure(innerHeight, visualHeight, visualOffsetTop) {
	const inset = Math.max(0, Math.round(innerHeight - visualHeight - visualOffsetTop));
	return {
		height: Math.round(visualHeight),
		keyboardInset: inset,
		keyboardOpen: inset > 150
	};
}
var height = (0, vue_exports.ref)(0);
var keyboardInset = (0, vue_exports.ref)(0);
var keyboardOpen = (0, vue_exports.ref)(false);
var subscribers = 0;
var detach = null;
function apply(m) {
	height.value = m.height;
	keyboardInset.value = m.keyboardInset;
	keyboardOpen.value = m.keyboardOpen;
	const root = document.documentElement;
	root.style.setProperty("--vv-h", `${m.height}px`);
	root.style.setProperty("--kb-inset", `${m.keyboardInset}px`);
	root.classList.toggle("is-keyboard", m.keyboardOpen);
}
function attach() {
	const vv = window.visualViewport;
	const update = () => {
		if (vv) apply(measure(window.innerHeight, vv.height, vv.offsetTop));
		else apply(measure(window.innerHeight, window.innerHeight, 0));
	};
	update();
	if (vv) {
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
	}
	window.addEventListener("resize", update);
	return () => {
		if (vv) {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
		}
		window.removeEventListener("resize", update);
		document.documentElement.style.removeProperty("--vv-h");
		document.documentElement.style.removeProperty("--kb-inset");
		document.documentElement.classList.remove("is-keyboard");
	};
}
function useVisualViewport() {
	(0, vue_exports.onMounted)(() => {
		if (subscribers++ === 0) detach = attach();
	});
	(0, vue_exports.onBeforeUnmount)(() => {
		if (--subscribers === 0 && detach) {
			detach();
			detach = null;
		}
	});
	return {
		height: (0, vue_exports.readonly)(height),
		keyboardInset: (0, vue_exports.readonly)(keyboardInset),
		keyboardOpen: (0, vue_exports.readonly)(keyboardOpen)
	};
}
//#endregion
//#region resources/js/composables/mobile/useMobileShell.ts
/**
* The phone shell's own state, provided by MobileLayout and read by its parts: which overlay is
* open, whether a sticky action bar has taken the tab bar's place, whether the page runs as an
* installed app. Every open sheet registers a closer here, so one call closes them all before a
* navigation.
*/
var KEY = Symbol("mobile-shell");
function provideMobileShell(options) {
	const viewport = useVisualViewport();
	const closers = /* @__PURE__ */ new Set();
	const store = {
		searchOpen: (0, vue_exports.ref)(false),
		vehicleOpen: (0, vue_exports.ref)(false),
		stickyBar: (0, vue_exports.ref)(false),
		keyboardOpen: viewport.keyboardOpen,
		standalone: (0, vue_exports.ref)(false),
		tabBarVisible: (0, vue_exports.computed)(() => options.tabBar.value && !store.stickyBar.value && !viewport.keyboardOpen.value),
		haptic: () => {
			if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(8);
		},
		registerSheet: (close) => {
			closers.add(close);
			return () => closers.delete(close);
		},
		closeSheets: () => {
			store.searchOpen.value = false;
			store.vehicleOpen.value = false;
			for (const close of closers) close();
		}
	};
	(0, vue_exports.provide)(KEY, store);
	return store;
}
/**
* Whether an Inertia `before` event announces a real navigation. A prefetch (fired on a row's
* `pointerdown`) and a partial reload go through the same event, and neither may close a sheet:
* a sheet that closes on the press swallows the click that was meant for its row.
*/
function isNavigationVisit(visit) {
	if (visit.prefetch) return false;
	return (visit.only?.length ?? 0) === 0 && (visit.except?.length ?? 0) === 0;
}
/**
* Whether the phone shell is providing — i.e. the page renders under `MobileLayout`. A shared
* component chooses its phone anatomy by this, not by the device flag: a phone UA on a page that
* still uses the desktop layout has no sheet to open. Setup-time only (it injects).
*/
function hasMobileShell() {
	return (0, vue_exports.inject)(KEY, null) !== null;
}
function useMobileShell() {
	const store = (0, vue_exports.inject)(KEY);
	if (store === void 0) throw new Error("useMobileShell() needs provideMobileShell() in MobileLayout");
	return store;
}
//#endregion
//#region resources/js/composables/mobile/useSheetHistory.ts
/**
* Android back and browser back close an open bottom sheet instead of leaving the page.
*
* Opening a sheet pushes one history entry that copies the current Inertia state and adds a
* marker. Inertia handles `popstate` in the bubble phase on `window`; this module listens in the
* capture phase, which the DOM fires first even at the target, and swallows the event with
* `stopImmediatePropagation()` while a sheet is open — so Inertia never sees the pop and never
* re-renders the page. The page keeps its state; only the sheet closes.
*
* Closing a sheet by any other means (handle, backdrop, button) pops that entry again, so the
* history never carries a dead entry. A navigation while a sheet is open strips the marker in
* place instead (`stripSheetState()`), because a `history.back()` racing Inertia's own push is
* exactly the kind of thing that cannot be made reliable.
*
* Bookkeeping, not the marker, decides whether an entry was pushed: Inertia rewrites the current
* entry on every scroll (to save the position) and drops the marker with it.
*/
var SHEET_STATE_KEY = "rmfSheet";
var stack = [];
var pending = null;
var installed = false;
function onPopstate(event) {
	const top = stack[stack.length - 1];
	if (top === void 0) return;
	event.stopImmediatePropagation();
	stack.pop();
	if (pending && pending.id === top.id) {
		clearTimeout(pending.timer);
		pending.resolve();
		pending = null;
		return;
	}
	top.onBack();
}
function install() {
	if (installed || typeof window === "undefined") return;
	window.addEventListener("popstate", onPopstate, true);
	installed = true;
}
function useSheetHistory(id, onBack) {
	install();
	function owns() {
		const top = stack[stack.length - 1];
		return top !== void 0 && top.id === id;
	}
	function open() {
		if (typeof window === "undefined" || owns()) return;
		const base = window.history.state ?? {};
		window.history.pushState({
			...base,
			[SHEET_STATE_KEY]: id
		}, "", window.location.href);
		stack.push({
			id,
			onBack
		});
	}
	function close() {
		if (typeof window === "undefined" || !owns()) return Promise.resolve();
		return new Promise((resolve) => {
			pending = {
				id,
				resolve,
				timer: setTimeout(() => {
					if (pending && pending.id === id) {
						pending = null;
						const index = stack.findIndex((e) => e.id === id);
						if (index !== -1) stack.splice(index, 1);
						resolve();
					}
				}, 400)
			};
			window.history.back();
		});
	}
	return {
		open,
		close,
		owns
	};
}
/** Before a navigation: forget every open sheet and remove the marker from the current entry. */
function stripSheetState() {
	if (typeof window === "undefined") return;
	stack.length = 0;
	if (pending) {
		clearTimeout(pending.timer);
		pending.resolve();
		pending = null;
	}
	const state = window.history.state;
	if (state && "rmfSheet" in state) {
		const { [SHEET_STATE_KEY]: _marker, ...rest } = state;
		window.history.replaceState(rest, "", window.location.href);
	}
}
//#endregion
//#region resources/js/Components/Mobile/BottomSheet.vue?vue&type=script&setup=true&lang.ts
var CLOSE_VELOCITY_PX_PER_MS = .6;
var CLOSE_FRACTION = .3;
var EXPAND_DISTANCE_PX = 60;
var START_DISTANCE_PX = 8;
var BottomSheet_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BottomSheet",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		id: {},
		title: {},
		description: { default: void 0 },
		snap: { default: "content" },
		hideTitle: {
			type: Boolean,
			default: false
		}
	}, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: ["update:open"],
	setup(__props) {
		/**
		* The bottom sheet: the phone's answer to every modal and every dropdown.
		*
		* Focus trap, scroll lock, Esc, backdrop tap and focus return come from the Reka dialog. On top
		* of it: a 36 × 4 handle; swipe down to close, which begins only when the content is scrolled
		* to the top and closes on velocity or on distance; snap points at 50 % and 92 % of the
		* viewport when a sheet asks for them (`snap="half"`); `overscroll-behavior: contain`; and one
		* history entry, so Android back and browser back close the sheet instead of leaving the page.
		*
		* Only `transform` moves. A half sheet is a full-height sheet resting 42 dvh lower, so the snap
		* between the two points is a transform, never a height.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const shell = useMobileShell();
		let closedByHistory = false;
		const history = useSheetHistory(props.id, () => {
			closedByHistory = true;
			open.value = false;
		});
		const unregister = shell.registerSheet(() => {
			if (open.value) {
				closedByHistory = true;
				open.value = false;
			}
		});
		(0, vue_exports.watch)(open, (isOpen) => {
			if (isOpen) {
				expanded.value = false;
				offset.value = 0;
				history.open();
				return;
			}
			if (closedByHistory) {
				closedByHistory = false;
				return;
			}
			history.close();
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			unregister();
			if (open.value) history.close();
		});
		const content = (0, vue_exports.ref)(null);
		const body = (0, vue_exports.ref)(null);
		const offset = (0, vue_exports.ref)(0);
		const dragging = (0, vue_exports.ref)(false);
		const expanded = (0, vue_exports.ref)(false);
		let startY = 0;
		let startTime = 0;
		let lastY = 0;
		let lastTime = 0;
		let fromBody = false;
		const style = (0, vue_exports.computed)(() => offset.value !== 0 ? { transform: `translateY(${offset.value}px)` } : void 0);
		function atTop() {
			return (body.value?.scrollTop ?? 0) <= 0;
		}
		function onTouchStart(event) {
			const touch = event.touches[0];
			if (!touch) return;
			startY = lastY = touch.clientY;
			startTime = lastTime = event.timeStamp;
			fromBody = body.value !== null && body.value.contains(event.target);
			dragging.value = false;
		}
		function onTouchMove(event) {
			const touch = event.touches[0];
			if (!touch) return;
			const dy = touch.clientY - startY;
			if (!dragging.value) {
				if (!(Math.abs(dy) > START_DISTANCE_PX && (!fromBody || atTop() && dy > 0 || props.snap === "half" && !expanded.value && dy < 0))) return;
				dragging.value = true;
			}
			event.preventDefault();
			const rest = restingOffset();
			offset.value = Math.max(-rest, dy);
			lastY = touch.clientY;
			lastTime = event.timeStamp;
		}
		function restingOffset() {
			if (props.snap !== "half" || expanded.value || content.value === null) return 0;
			return content.value.getBoundingClientRect().height * (42 / 92);
		}
		function onTouchEnd() {
			if (!dragging.value) return;
			dragging.value = false;
			const height = content.value?.getBoundingClientRect().height ?? 1;
			const elapsed = Math.max(1, lastTime - startTime);
			const velocity = (lastY - startY) / elapsed;
			const moved = offset.value;
			if (velocity > CLOSE_VELOCITY_PX_PER_MS || moved > height * CLOSE_FRACTION) {
				offset.value = 0;
				open.value = false;
				return;
			}
			if (props.snap === "half" && !expanded.value && (moved < -60 || velocity < -.6)) expanded.value = true;
			else if (props.snap === "half" && expanded.value && moved > EXPAND_DISTANCE_PX) expanded.value = false;
			offset.value = 0;
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
									ref_key: "content",
									ref: content,
									class: ["msheet", {
										"msheet--half": __props.snap === "half",
										"msheet--expanded": expanded.value,
										"msheet--dragging": dragging.value
									}],
									style: style.value,
									"aria-describedby": __props.description ? void 0 : "",
									onTouchstart: onTouchStart,
									onTouchmove: onTouchMove,
									onTouchend: onTouchEnd,
									onTouchcancel: onTouchEnd
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`<div class="msheet__handle" aria-hidden="true"${_scopeId}><span${_scopeId}></span></div><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "visually-hidden": __props.hideTitle }, "msheet__head"])}"${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogTitle_default), { class: "h4" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.title)}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogClose_default), {
												class: "icon-btn m-press msheet__close",
												"aria-label": "Schließen"
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
														name: "close",
														size: 24
													}, null, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)(Icon_default, {
														name: "close",
														size: 24
													})];
												}),
												_: 1
											}, _parent, _scopeId));
											_push(`</div><div class="msheet__body"${_scopeId}>`);
											if (__props.description) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogDescription_default), { class: "muted msheet__description" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.description)}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											else _push(`<!---->`);
											(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent, _scopeId);
											_push(`</div>`);
											if (_ctx.$slots.actions) {
												_push(`<div class="msheet__actions"${_scopeId}>`);
												(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "actions", {}, null, _push, _parent, _scopeId);
												_push(`</div>`);
											} else _push(`<!---->`);
										} else return [
											(0, vue_exports.createVNode)("div", {
												class: "msheet__handle",
												"aria-hidden": "true"
											}, [(0, vue_exports.createVNode)("span")]),
											(0, vue_exports.createVNode)("div", { class: ["msheet__head", { "visually-hidden": __props.hideTitle }] }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "h4" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
												class: "icon-btn m-press msheet__close",
												"aria-label": "Schließen"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
													name: "close",
													size: 24
												})]),
												_: 1
											})], 2),
											(0, vue_exports.createVNode)("div", {
												ref_key: "body",
												ref: body,
												class: "msheet__body"
											}, [__props.description ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DialogDescription_default), {
												key: 0,
												class: "muted msheet__description"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)]),
												_: 1
											})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.renderSlot)(_ctx.$slots, "default")], 512),
											_ctx.$slots.actions ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
												key: 0,
												class: "msheet__actions"
											}, [(0, vue_exports.renderSlot)(_ctx.$slots, "actions")])) : (0, vue_exports.createCommentVNode)("", true)
										];
									}),
									_: 3
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
								ref_key: "content",
								ref: content,
								class: ["msheet", {
									"msheet--half": __props.snap === "half",
									"msheet--expanded": expanded.value,
									"msheet--dragging": dragging.value
								}],
								style: style.value,
								"aria-describedby": __props.description ? void 0 : "",
								onTouchstartPassive: onTouchStart,
								onTouchmove: onTouchMove,
								onTouchend: onTouchEnd,
								onTouchcancel: onTouchEnd
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)("div", {
										class: "msheet__handle",
										"aria-hidden": "true"
									}, [(0, vue_exports.createVNode)("span")]),
									(0, vue_exports.createVNode)("div", { class: ["msheet__head", { "visually-hidden": __props.hideTitle }] }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "h4" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)]),
										_: 1
									}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
										class: "icon-btn m-press msheet__close",
										"aria-label": "Schließen"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
											name: "close",
											size: 24
										})]),
										_: 1
									})], 2),
									(0, vue_exports.createVNode)("div", {
										ref_key: "body",
										ref: body,
										class: "msheet__body"
									}, [__props.description ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DialogDescription_default), {
										key: 0,
										class: "muted msheet__description"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)]),
										_: 1
									})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.renderSlot)(_ctx.$slots, "default")], 512),
									_ctx.$slots.actions ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "msheet__actions"
									}, [(0, vue_exports.renderSlot)(_ctx.$slots, "actions")])) : (0, vue_exports.createCommentVNode)("", true)
								]),
								_: 3
							}, 8, [
								"class",
								"style",
								"aria-describedby"
							])];
						}),
						_: 3
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
							ref_key: "content",
							ref: content,
							class: ["msheet", {
								"msheet--half": __props.snap === "half",
								"msheet--expanded": expanded.value,
								"msheet--dragging": dragging.value
							}],
							style: style.value,
							"aria-describedby": __props.description ? void 0 : "",
							onTouchstartPassive: onTouchStart,
							onTouchmove: onTouchMove,
							onTouchend: onTouchEnd,
							onTouchcancel: onTouchEnd
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("div", {
									class: "msheet__handle",
									"aria-hidden": "true"
								}, [(0, vue_exports.createVNode)("span")]),
								(0, vue_exports.createVNode)("div", { class: ["msheet__head", { "visually-hidden": __props.hideTitle }] }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "h4" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
									class: "icon-btn m-press msheet__close",
									"aria-label": "Schließen"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
										name: "close",
										size: 24
									})]),
									_: 1
								})], 2),
								(0, vue_exports.createVNode)("div", {
									ref_key: "body",
									ref: body,
									class: "msheet__body"
								}, [__props.description ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DialogDescription_default), {
									key: 0,
									class: "muted msheet__description"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)]),
									_: 1
								})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.renderSlot)(_ctx.$slots, "default")], 512),
								_ctx.$slots.actions ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "msheet__actions"
								}, [(0, vue_exports.renderSlot)(_ctx.$slots, "actions")])) : (0, vue_exports.createCommentVNode)("", true)
							]),
							_: 3
						}, 8, [
							"class",
							"style",
							"aria-describedby"
						])]),
						_: 3
					})];
				}),
				_: 3
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/BottomSheet.vue
var _sfc_setup$4 = BottomSheet_vue_vue_type_script_setup_true_lang_default.setup;
BottomSheet_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/BottomSheet.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var BottomSheet_default = BottomSheet_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Mobile/ListRow.vue?vue&type=script&setup=true&lang.ts
var ListRow_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ListRow",
	__ssrInlineRender: true,
	props: {
		title: { default: void 0 },
		sub: { default: void 0 },
		meta: { default: void 0 },
		icon: { default: void 0 },
		href: { default: void 0 },
		external: {
			type: Boolean,
			default: false
		},
		chevron: {
			type: Boolean,
			default: void 0
		},
		static: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		manual: {
			type: Boolean,
			default: false
		}
	},
	emits: ["activate"],
	setup(__props, { emit: __emit }) {
		/**
		* One row of a list: at least 56 px, the page margin at the sides, an inset divider, a chevron
		* when it navigates, and the whole row is the target. A row with an `href` is a real link (a
		* right-click or a long press still offers the URL); the navigation itself goes through the
		* router so the direction and any open sheet are handled first.
		*/
		const props = __props;
		const emit = __emit;
		const tag = (0, vue_exports.computed)(() => props.href ? "a" : props.static ? "div" : "button");
		const showChevron = (0, vue_exports.computed)(() => props.chevron ?? (props.href !== void 0 && !props.external));
		function onClick(event) {
			if (props.disabled) {
				event.preventDefault();
				return;
			}
			if (props.href === void 0) {
				emit("activate", void 0);
				return;
			}
			if (props.external || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			event.preventDefault();
			emit("activate", props.href);
			if (!props.manual) router.visit(props.href);
		}
		function onPress() {
			if (props.href && !props.external && !props.disabled) router.prefetch(props.href, { method: "get" }, { cacheFor: 3e4 });
		}
		return (_ctx, _push, _parent, _attrs) => {
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(tag.value), (0, vue_exports.mergeProps)({
				class: ["mrow", {
					"m-press": !__props.static,
					"mrow--disabled": __props.disabled
				}],
				href: __props.href,
				type: tag.value === "button" ? "button" : void 0,
				rel: __props.external ? "noopener" : void 0,
				"aria-disabled": __props.disabled ? "true" : void 0,
				onPointerdown: onPress,
				onClick
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.icon || _ctx.$slots.leading) {
							_push(`<span class="mrow__lead" data-v-7b6a60f0${_scopeId}>`);
							(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "leading", {}, () => {
								if (__props.icon) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: __props.icon,
									size: 24
								}, null, _parent, _scopeId));
								else _push(`<!---->`);
							}, _push, _parent, _scopeId);
							_push(`</span>`);
						} else _push(`<!---->`);
						_push(`<span class="mrow__body" data-v-7b6a60f0${_scopeId}><span class="mrow__text" data-v-7b6a60f0${_scopeId}><span class="mrow__title" data-v-7b6a60f0${_scopeId}>`);
						(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, () => {
							_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.title)}`);
						}, _push, _parent, _scopeId);
						_push(`</span>`);
						if (__props.sub || _ctx.$slots.sub) {
							_push(`<span class="mrow__sub small muted" data-v-7b6a60f0${_scopeId}>`);
							(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "sub", {}, () => {
								_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.sub)}`);
							}, _push, _parent, _scopeId);
							_push(`</span>`);
						} else _push(`<!---->`);
						_push(`</span>`);
						if (__props.meta || _ctx.$slots.trailing) {
							_push(`<span class="mrow__meta small num muted" data-v-7b6a60f0${_scopeId}>`);
							(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "trailing", {}, () => {
								_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.meta)}`);
							}, _push, _parent, _scopeId);
							_push(`</span>`);
						} else _push(`<!---->`);
						if (showChevron.value) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "chevron-right",
							size: 20,
							class: "mrow__chev"
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						_push(`</span>`);
					} else return [__props.icon || _ctx.$slots.leading ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
						key: 0,
						class: "mrow__lead"
					}, [(0, vue_exports.renderSlot)(_ctx.$slots, "leading", {}, () => [__props.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Icon_default, {
						key: 0,
						name: __props.icon,
						size: 24
					}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true)], true)])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("span", { class: "mrow__body" }, [
						(0, vue_exports.createVNode)("span", { class: "mrow__text" }, [(0, vue_exports.createVNode)("span", { class: "mrow__title" }, [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, () => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)], true)]), __props.sub || _ctx.$slots.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "mrow__sub small muted"
						}, [(0, vue_exports.renderSlot)(_ctx.$slots, "sub", {}, () => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.sub), 1)], true)])) : (0, vue_exports.createCommentVNode)("", true)]),
						__props.meta || _ctx.$slots.trailing ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "mrow__meta small num muted"
						}, [(0, vue_exports.renderSlot)(_ctx.$slots, "trailing", {}, () => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.meta), 1)], true)])) : (0, vue_exports.createCommentVNode)("", true),
						showChevron.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Icon_default, {
							key: 1,
							name: "chevron-right",
							size: 20,
							class: "mrow__chev"
						})) : (0, vue_exports.createCommentVNode)("", true)
					])];
				}),
				_: 3
			}), _parent);
		};
	}
});
//#endregion
//#region resources/js/Components/Mobile/ListRow.vue
var _sfc_setup$3 = ListRow_vue_vue_type_script_setup_true_lang_default.setup;
ListRow_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/ListRow.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var ListRow_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ListRow_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7b6a60f0"]]);
//#endregion
//#region resources/js/Components/Ui/Picture.vue?vue&type=script&setup=true&lang.ts
var Picture_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Picture",
	__ssrInlineRender: true,
	props: {
		image: {},
		alt: {},
		sizes: { default: "100vw" },
		eager: {
			type: Boolean,
			default: false
		}
	},
	emits: ["loaded"],
	setup(__props, { emit: __emit }) {
		/**
		* A photograph from the image pipeline (scripts/images.mjs): AVIF, then WebP, then JPEG, at the
		* widths the manifest lists, with the frame's own dimensions so nothing shifts, and the 24 px
		* placeholder behind it until the real file has painted. The hero passes `eager`; everything
		* below the fold is lazy.
		*/
		const props = __props;
		const loaded = (0, vue_exports.ref)(false);
		const srcset = (ext) => props.image.widths.map((w) => `${props.image.base}-${w}.${ext} ${w}w`).join(", ");
		const fallbackExt = (0, vue_exports.computed)(() => props.image.fallback ?? "jpg");
		const fallback = (0, vue_exports.computed)(() => `${props.image.base}-${props.image.widths[props.image.widths.length - 1]}.${fallbackExt.value}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<picture${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["picture", { "picture--loaded": loaded.value }],
				style: fallbackExt.value === "png" ? void 0 : { backgroundImage: `url(${__props.image.placeholder})` }
			}, _attrs))} data-v-77a35bcf><source type="image/avif"${(0, server_renderer_exports.ssrRenderAttr)("srcset", srcset("avif"))}${(0, server_renderer_exports.ssrRenderAttr)("sizes", __props.sizes)} data-v-77a35bcf><source type="image/webp"${(0, server_renderer_exports.ssrRenderAttr)("srcset", srcset("webp"))}${(0, server_renderer_exports.ssrRenderAttr)("sizes", __props.sizes)} data-v-77a35bcf><img${(0, server_renderer_exports.ssrRenderAttr)("src", fallback.value)}${(0, server_renderer_exports.ssrRenderAttr)("srcset", srcset(fallbackExt.value))}${(0, server_renderer_exports.ssrRenderAttr)("sizes", __props.sizes)}${(0, server_renderer_exports.ssrRenderAttr)("alt", __props.alt)}${(0, server_renderer_exports.ssrRenderAttr)("width", __props.image.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", __props.image.height)}${(0, server_renderer_exports.ssrRenderAttr)("loading", __props.eager ? "eager" : "lazy")}${(0, server_renderer_exports.ssrRenderAttr)("fetchpriority", __props.eager ? "high" : void 0)} decoding="async" data-v-77a35bcf></picture>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Picture.vue
var _sfc_setup$2 = Picture_vue_vue_type_script_setup_true_lang_default.setup;
Picture_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Picture.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var Picture_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Picture_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-77a35bcf"]]);
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
	props: {
		hidden: {
			type: Boolean,
			default: false
		},
		bottomNav: {
			type: Boolean,
			default: true
		}
	},
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
				_push(`<section class="${(0, server_renderer_exports.ssrRenderClass)([{
					"tray--flush": !__props.bottomNav,
					"tray--phone": phone.value
				}, "tray"])}" role="region" aria-label="Vergleich"><div class="container tray__row">`);
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
export { provideShell as _, Picture_default as a, remember as b, stripSheetState as c, provideMobileShell as d, useMobileShell as f, useConsent as g, provideConsent as h, WheelOutline_default as i, useSheetHistory as l, CookieConsent_default as m, CompareTray_default as n, ListRow_default as o, DemoBadge_default as p, useCompare as r, BottomSheet_default as s, useShortcuts as t, isNavigationVisit as u, useShell as v, useSearch as x, readRecent as y };
