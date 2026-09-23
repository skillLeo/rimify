import { a as usePage, c as vue_exports, o as router } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
//#region resources/js/icons/index.ts
/**
* The icon set: one style, drawn for this product.
*
* Every glyph sits on the same 24-unit grid with a 1.5-unit stroke, square caps and mitre joins,
* optically aligned to the cap height of the text beside it — which is what makes a row of them
* read as a set rather than a collection. `currentColor` throughout; the star is the one filled
* mark, because a rating is a mark and not a control.
*
* Nothing is added here without a place in the interface that needs it.
*/
var ICON_NAMES = [
	"search",
	"car",
	"document",
	"check",
	"check-circle",
	"warning",
	"close",
	"chevron-down",
	"chevron-up",
	"chevron-left",
	"chevron-right",
	"arrow-right",
	"arrow-left",
	"cart",
	"user",
	"truck",
	"wrench",
	"phone",
	"mail",
	"clock",
	"map-pin",
	"camera",
	"keyboard",
	"filter",
	"sort",
	"info",
	"plus",
	"minus",
	"compare",
	"heart",
	"menu",
	"home",
	"wheel",
	"star",
	"shield",
	"trash",
	"eye",
	"lock",
	"grid",
	"box",
	"chart",
	"settings",
	"logout",
	"fuel",
	"rain",
	"sound",
	"ruler"
];
var FILLED = /* @__PURE__ */ new Set(["star"]);
var PATHS = {
	search: "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m16 16 4.5 4.5\"/>",
	car: "<path d=\"M3 15.5V12l2.2-4.5h9.6L18 12h3v3.5\"/><path d=\"M3 15.5h18\"/><circle cx=\"7.5\" cy=\"16.5\" r=\"2\"/><circle cx=\"16.5\" cy=\"16.5\" r=\"2\"/><path d=\"M6 12h10\"/>",
	document: "<path d=\"M6 3.5h7.5l5 5v12H6Z\"/><path d=\"M13.5 3.5v5h5\"/><path d=\"M9 13h6.5M9 16.5h6.5\"/>",
	check: "<path d=\"m4.5 12.5 5 5 10-11\"/>",
	"check-circle": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"m8 12.3 2.8 2.7 5.2-5.7\"/>",
	warning: "<path d=\"M12 4 21 19.5H3Z\"/><path d=\"M12 10v4.5\"/><path d=\"M12 17h.01\"/>",
	close: "<path d=\"m6 6 12 12M18 6 6 18\"/>",
	"chevron-down": "<path d=\"m6 9.5 6 6 6-6\"/>",
	"chevron-up": "<path d=\"m6 14.5 6-6 6 6\"/>",
	"chevron-left": "<path d=\"m14.5 6-6 6 6 6\"/>",
	"chevron-right": "<path d=\"m9.5 6 6 6-6 6\"/>",
	"arrow-right": "<path d=\"M4 12h15.5\"/><path d=\"m13.5 6 6 6-6 6\"/>",
	"arrow-left": "<path d=\"M20 12H4.5\"/><path d=\"m10.5 6-6 6 6 6\"/>",
	cart: "<path d=\"M3 4h2.4l2.2 11h10.2l2.2-8H6.4\"/><circle cx=\"9.5\" cy=\"19\" r=\"1.5\"/><circle cx=\"17.5\" cy=\"19\" r=\"1.5\"/>",
	user: "<circle cx=\"12\" cy=\"8.5\" r=\"3.8\"/><path d=\"M4.5 20.5a7.5 7.5 0 0 1 15 0\"/>",
	truck: "<path d=\"M3 6.5h10.5v10H3z\"/><path d=\"M13.5 10h4l3 3.2v3.3h-7z\"/><circle cx=\"7.5\" cy=\"18\" r=\"1.8\"/><circle cx=\"17\" cy=\"18\" r=\"1.8\"/>",
	wrench: "<path d=\"m3.5 20.5 7.6-7.6\"/><path d=\"M11.4 12.6a4.6 4.6 0 0 1 6-6.1l-2.6 2.6 1.6 1.6 2.6-2.6a4.6 4.6 0 0 1-6.1 6\"/>",
	phone: "<path d=\"M6.2 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.4 6.4l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z\"/>",
	mail: "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\"/><path d=\"m3.5 6.5 8.5 6.2 8.5-6.2\"/>",
	clock: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7.5V12l3 2\"/>",
	"map-pin": "<path d=\"M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>",
	camera: "<path d=\"M3.5 8.5h3.8l1.5-2.5h6.4l1.5 2.5h3.8v11h-17z\"/><circle cx=\"12\" cy=\"13.5\" r=\"3.2\"/>",
	keyboard: "<rect x=\"3\" y=\"6.5\" width=\"18\" height=\"11\"/><path d=\"M6.5 10h1M10 10h1M13.5 10h1M17 10h1M6.5 13.5h1M17 13.5h1M10 13.5h4.5\"/>",
	filter: "<path d=\"M3.5 5.5h17l-6.5 7.7v5.1l-4 2.2v-7.3Z\"/>",
	sort: "<path d=\"M4 7h16M7 12h10M10 17h4\"/>",
	info: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 11v5.5\"/><path d=\"M12 7.8h.01\"/>",
	plus: "<path d=\"M12 5v14M5 12h14\"/>",
	minus: "<path d=\"M5 12h14\"/>",
	compare: "<path d=\"M3.5 7h9.5M9.5 3.5 13 7l-3.5 3.5\"/><path d=\"M20.5 17H11M14.5 13.5 11 17l3.5 3.5\"/>",
	heart: "<path d=\"M12 20.5 4.7 13.2a4.4 4.4 0 0 1 6.2-6.2L12 8.1l1.1-1.1a4.4 4.4 0 0 1 6.2 6.2Z\"/>",
	menu: "<path d=\"M4 7h16M4 12h16M4 17h16\"/>",
	home: "<path d=\"M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4Z\"/>",
	wheel: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 3.5v5.5M12 15v5.5M3.5 12H9M15 12h5.5\"/>",
	star: "<path d=\"m12 3.6 2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.9-5.2 2.9 1-6L3.5 9.9l5.9-.8Z\"/>",
	shield: "<path d=\"M12 3.5 19.5 6v5.6c0 4-3 7-7.5 9.2-4.5-2.2-7.5-5.2-7.5-9.2V6Z\"/>",
	trash: "<path d=\"M4.5 6.5h15\"/><path d=\"M9.5 6.5V4h5v2.5\"/><path d=\"M6.5 6.5 7.5 20h9l1-13.5\"/><path d=\"M10.5 10v6M13.5 10v6\"/>",
	eye: "<path d=\"M2.8 12S6.6 5.8 12 5.8 21.2 12 21.2 12 17.4 18.2 12 18.2 2.8 12 2.8 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"2.9\"/>",
	lock: "<rect x=\"4.5\" y=\"10\" width=\"15\" height=\"10.5\"/><path d=\"M8 10V7.8a4 4 0 0 1 8 0V10\"/>",
	grid: "<rect x=\"4\" y=\"4\" width=\"7\" height=\"7\"/><rect x=\"13\" y=\"4\" width=\"7\" height=\"7\"/><rect x=\"4\" y=\"13\" width=\"7\" height=\"7\"/><rect x=\"13\" y=\"13\" width=\"7\" height=\"7\"/>",
	box: "<path d=\"m12 3.5 8 4.2v8.6l-8 4.2-8-4.2V7.7Z\"/><path d=\"m4 7.7 8 4.2 8-4.2M12 11.9V20\"/>",
	chart: "<path d=\"M4 20V4\"/><path d=\"M4 20h16\"/><path d=\"m7 15.5 3.8-4.4 3.2 2.4 5-6\"/>",
	settings: "<circle cx=\"12\" cy=\"12\" r=\"3.1\"/><path d=\"M19.5 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 13h-.3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 3.6v-.3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1Z\"/>",
	logout: "<path d=\"M9.5 20H4.5v-16h5\"/><path d=\"m15 8 4 4-4 4\"/><path d=\"M19 12H9.5\"/>",
	fuel: "<path d=\"M4.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13.5 5v15.5\"/><path d=\"M4.5 10h9\"/><path d=\"M13.5 9H16a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-2.5-2.5\"/><path d=\"M3 20.5h12\"/>",
	rain: "<path d=\"M7 15.5a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5 3.3 3.3 0 0 1-.5 6.5\"/><path d=\"m9 17.5-1 2.5M13 17.5l-1 2.5M17 17.5l-1 2.5\"/>",
	sound: "<path d=\"M4 9.5h3.5L12 5.5v13l-4.5-4H4z\"/><path d=\"M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11\"/>",
	ruler: "<path d=\"M3 15.5 15.5 3 21 8.5 8.5 21z\"/><path d=\"m7 11.5 2 2M10 8.5l2 2M13 5.5l2 2\"/>"
};
/** The inner markup of an icon — for a component that renders its own `<svg>`. */
function iconPaths(name) {
	return PATHS[name];
}
function isFilled(name) {
	return FILLED.has(name);
}
/** A complete `<svg>` string, for the few places that render markup rather than a component. */
function icon(name, options = {}) {
	const size = options.size ?? 20;
	const filled = FILLED.has(name);
	const a11y = options.label ? `role="img" aria-label="${options.label.replace(/"/g, "&quot;")}"` : "aria-hidden=\"true\"";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${filled ? "currentColor" : "none"}" stroke="${filled ? "none" : "currentColor"}" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" ${a11y} focusable="false">${PATHS[name]}</svg>`;
}
function isIconName(value) {
	return value in PATHS;
}
//#endregion
//#region resources/js/Components/Ui/Icon.vue?vue&type=script&setup=true&lang.ts
var Icon_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Icon",
	__ssrInlineRender: true,
	props: {
		name: {},
		size: { default: 20 },
		label: { default: void 0 }
	},
	setup(__props) {
		/**
		* One icon from the set, rendered as an inline `<svg>` with no wrapper element, so it sits on the
		* text baseline like a glyph. Decorative by default; pass `label` only where the icon is the whole
		* control, because an aria-label beside a visible text label reads the name twice.
		*/
		const props = __props;
		const paths = (0, vue_exports.computed)(() => iconPaths(props.name));
		const filled = (0, vue_exports.computed)(() => isFilled(props.name));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<svg${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				width: __props.size,
				height: __props.size,
				fill: filled.value ? "currentColor" : "none",
				stroke: filled.value ? "none" : "currentColor",
				"stroke-width": "1.5",
				"stroke-linecap": "square",
				"stroke-linejoin": "miter",
				role: __props.label ? "img" : void 0,
				"aria-label": __props.label,
				"aria-hidden": __props.label ? void 0 : "true",
				focusable: "false",
				class: "icon"
			}, _attrs))} data-v-9cd8c44c>${paths.value ?? ""}</svg>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Icon.vue
var _sfc_setup$1 = Icon_vue_vue_type_script_setup_true_lang_default.setup;
Icon_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Icon.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var Icon_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Icon_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9cd8c44c"]]);
//#endregion
//#region resources/js/Components/Chrome/toast.ts
/** How long a confirmation stays on screen. Long enough to read three words twice. */
var TOAST_MS = 4e3;
/** A toast with an action stays half as long again: there is a button to find. */
var TOAST_ACTION_MS = TOAST_MS * 1.5;
/** The confirmation a response flashed, or null when it flashed none. */
function toastFrom(props) {
	const flash = props?.flash;
	if (flash === null || typeof flash !== "object") return null;
	const toast = flash.toast;
	return typeof toast === "string" && toast.trim() !== "" ? toast : null;
}
var listeners = /* @__PURE__ */ new Set();
/**
* The client channel (home-overhaul.md §2.3): a component shows a confirmation without a server
* round trip — "zum Vergleich hinzugefügt", with *Rückgängig*. One toast at a time; a new one
* replaces the current. Module state, so a caller needs no injection and no layout.
*/
var toast = {
	show(message) {
		for (const listener of listeners) listener(message);
	},
	subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}
};
//#endregion
//#region resources/js/Components/Chrome/Toast.vue?vue&type=script&setup=true&lang.ts
var Toast_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Toast",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The toast.
		*
		* Confirmations only — never a failure, and never a conflict. Anything the customer needs to act
		* on stays on the page as a row or a panel, because a toast that scrolls away is a message nobody
		* can go back and read. One at a time, four seconds (six with an action), and the clock stops
		* while the pointer rests on it or a child holds focus.
		*
		* It listens for server responses, not for a change in the flashed text. Watching the text missed
		* the second "Zum Warenkorb hinzugefügt." in a row (the same string is not a change), and it
		* replayed an old toast whenever the back button restored a page whose props still carried it.
		* A `success` event fires once per real response and never for a page restored from history.
		*
		* The client channel (`toast.show`) carries the confirmations no server saw — a wheel added to
		* the compare list — with one optional action, *Rückgängig*. F8 moves focus to that action while
		* the toast is up (the shortcut list names it).
		*/
		const page = usePage();
		const message = (0, vue_exports.ref)(null);
		const actionButton = (0, vue_exports.ref)(null);
		let timer;
		let stopListening;
		let stopChannel;
		function arm() {
			if (timer !== void 0) clearTimeout(timer);
			timer = setTimeout(() => {
				message.value = null;
			}, message.value?.action ? TOAST_ACTION_MS : TOAST_MS);
		}
		function show(next) {
			if (next === null) return;
			message.value = typeof next === "string" ? { text: next } : next;
			arm();
		}
		function pause() {
			if (timer !== void 0) {
				clearTimeout(timer);
				timer = void 0;
			}
		}
		function onKeydown(event) {
			if (event.key === "F8" && actionButton.value !== null) {
				event.preventDefault();
				actionButton.value.focus();
			}
		}
		(0, vue_exports.onMounted)(() => {
			if ((performance.getEntriesByType?.("navigation")[0])?.type !== "back_forward") show(toastFrom(page.props));
			stopListening = router.on("success", (event) => {
				show(toastFrom(event.detail.page.props));
			});
			stopChannel = toast.subscribe(show);
			document.addEventListener("keydown", onKeydown);
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			stopListening?.();
			stopChannel?.();
			document.removeEventListener("keydown", onKeydown);
			pause();
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "toast-viewport",
				role: "status",
				"aria-live": "polite"
			}, _attrs))} data-v-78b30b76>`);
			if (message.value) {
				_push(`<div class="toast" data-v-78b30b76>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: message.value.icon ?? "check-circle",
					size: 20
				}, null, _parent));
				_push(`<span class="toast__text" data-v-78b30b76>${(0, server_renderer_exports.ssrInterpolate)(message.value.text)}</span>`);
				if (message.value.action) _push(`<button class="btn btn--outline-light btn--sm toast__action" type="button" data-v-78b30b76>${(0, server_renderer_exports.ssrInterpolate)(message.value.action.label)}</button>`);
				else _push(`<!---->`);
				_push(`<button class="icon-btn toast__close" type="button" aria-label="Schließen" data-v-78b30b76>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "close",
					size: 20
				}, null, _parent));
				_push(`</button></div>`);
			} else _push(`<!---->`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/Toast.vue
var _sfc_setup = Toast_vue_vue_type_script_setup_true_lang_default.setup;
Toast_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/Toast.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Toast_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Toast_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-78b30b76"]]);
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
export { Icon_default as a, isIconName as c, Toast_default as i, useMenus as n, ICON_NAMES as o, useShared as r, icon as s, resolveHref as t };
