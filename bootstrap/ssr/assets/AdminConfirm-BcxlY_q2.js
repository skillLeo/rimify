import { t as Dialog_default } from "./Dialog-DrPiANpu.js";
import { s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
//#region resources/js/composables/admin/railResize.ts
/**
* The rail — pure rules, no DOM, so every threshold is tested (railResize.test.ts) and the layout, the
* handle and the end-to-end specs all use the same ones.
*
* Two states, never one:
*   - The intent (`RailIntent`): the width and whether this person collapsed it. Stored on the
*     account, and changed only by a gesture — the toggle, `[`, Enter or Space on the handle, a drag,
*     the double-click reset.
*   - The effective rail (`effectiveRail`): what this window shows for that intent. Derived on every
*     layout and never stored. A narrow window, a resize in the middle of a drag, a rotated tablet
*     change only this.
*
* The rules:
*   - Free between 232 and 400 px; two magnets, 260 (the default) and 320 (comfortable). A magnet
*     catches the rail within 8 px and holds it until the pointer is more than 12 px away — distance,
*     not time, so it feels the same at any frame rate, and the rail never flickers on and off it.
*   - Below 200 px the drag collapses it to the 64 px icon rail — a state, not a width: the width it
*     had is kept. Pulled out past 120 px it opens again at that width, and holds there until the
*     pointer reaches it (so the rail does not collapse again under a pointer still at 130 px).
*   - The content keeps 960 px of the page (the window less its scrollbar): where the stored width
*     does not fit, the rail is shown at the widest that does; with no room even for 232 px it is
*     collapsed by the window, and the toggle says why instead of opening.
*   - Below 248 px the group labels switch to their short form (AdminNavigation's `short`).
*/
var RAIL = {
	min: 232,
	max: 400,
	default: 260,
	comfortable: 320,
	/** The icon rail (--adm-rail-w-min). */
	collapsed: 64,
	collapseBelow: 200,
	expandPast: 120,
	/** A magnet catches the rail this close to it … */
	snap: 8,
	/** … and lets go only once the pointer is further away than this (hysteresis). */
	release: 12,
	shortBelow: 248,
	/** The content area's minimum: the rail collapses before the content shrinks under it. */
	contentMin: 960,
	step: 16,
	bigStep: 48,
	saveEveryMs: 1e3,
	/** The keys have stopped: this long without a key down or up. Then the width is saved and said. */
	keyQuietMs: 250,
	/** No resizing below this: a forced icon rail on a tablet, the bottom bar on a phone. */
	resizableFrom: 1024
};
RAIL.default, RAIL.comfortable;
/** A stored width, or the default when it is none: whole pixels, inside the range. */
function clampWidth(raw) {
	return typeof raw === "number" && Number.isInteger(raw) && raw >= RAIL.min && raw <= RAIL.max ? raw : RAIL.default;
}
/** The widest the rail may be on a page this wide, leaving the content its 960 px (at most 400). */
function maxFit(page) {
	return Math.min(RAIL.max, page - RAIL.contentMin);
}
/** The width a stored width is shown at on a page this wide: its own, or the widest that fits. */
function fitWidth(width, page) {
	return Math.max(RAIL.min, Math.min(width, maxFit(page)));
}
/**
* The rail this window shows for an intent. `page` is null where nothing is known or nothing is
* resized — on the server, and below 1024 px, where the stylesheet decides — and the intent is then
* shown as it is.
*/
function effectiveRail(intent, page) {
	if (page === null) return {
		collapsed: intent.collapsed,
		width: intent.width,
		forced: false,
		clamped: false,
		max: RAIL.max
	};
	const max = maxFit(page);
	if (max < RAIL.min) return {
		collapsed: true,
		width: intent.width,
		forced: true,
		clamped: false,
		max: RAIL.min
	};
	const width = fitWidth(intent.width, page);
	return {
		collapsed: intent.collapsed,
		width,
		forced: false,
		clamped: width < intent.width,
		max
	};
}
/**
* The toggle — the one function the toggle button, `[`, and Enter or Space on the handle all call.
* It flips whether the person collapsed it and keeps their width (opened on a narrow page, it shows
* at the widest that fits). Null where the window collapsed it: there is nothing to open, and
* nothing may be stored.
*/
function toggleIntent(intent, page) {
	return effectiveRail(intent, page).forced ? null : {
		collapsed: !intent.collapsed,
		width: intent.width
	};
}
/** What the toggle's tooltip says when it will do less than its name: why, and what it will do. */
function toggleHint(intent, page) {
	const shown = effectiveRail(intent, page);
	if (shown.forced) return "Fenster zu schmal für die Seitenleiste";
	return intent.collapsed && shown.clamped ? `Fenster zu schmal für ${intent.width} px, öffnet mit ${shown.width} px` : null;
}
/**
* The revision of a save: the clock, and never below the last one plus one, so it only grows — the
* server drops a save older than the one it holds (AdminUser::rememberRail).
*/
function nextRev(last, now) {
	return Math.max(Math.floor(now), last + 1);
}
/** Below 248 px the group labels take their short form — a word of its own, never cut mid-word. */
function labelMode(width) {
	return width < RAIL.shortBelow ? "short" : "full";
}
/** What a screen reader hears once the rail stops moving: the result, not the pixels on the way. */
function railSentence(state) {
	return state.collapsed ? "Seitenleiste eingeklappt" : `Seitenleiste ${state.width} Pixel breit`;
}
//#endregion
//#region resources/js/composables/admin/useAdmin.ts
/**
* The admin shell's props and state, in one place.
*
* `usePage().props.admin` arrives untyped (SharedProps keeps an index signature for the storefront),
* so it is narrowed once here, with the default every reader would otherwise invent on its own. The
* narrowing is defensive on purpose: a prop the server stops sending must render an empty rail, not
* throw inside the layout that every admin page shares.
*
* The shell's own state — whether the palette or the shortcuts dialog is open, whether the rail is
* collapsed — is provided by the layout and injected by the pieces, so the topbar's search button,
* the ⌘K shortcut and the phone's Suche tab all open the one palette.
*/
var EMPTY = {
	can: {},
	account: null,
	nav: [],
	environment: null,
	preferences: {
		railCollapsed: false,
		railWidth: RAIL.default,
		railRev: 0
	},
	csrfToken: null,
	breadcrumbs: [],
	supportEmail: null,
	notifications: {
		unread: null,
		offered: false
	},
	health: null,
	quickActions: [],
	demo: null,
	review: false
};
/** The urgent problem's banner, only in the shape the panel knows (maintenance, a dead queue). */
function banner(raw) {
	if (raw === null || typeof raw !== "object") return null;
	const { key, sentence } = raw;
	return (key === "maintenance" || key === "queue") && typeof sentence === "string" ? {
		key,
		sentence
	} : null;
}
function useAdmin() {
	const page = usePage();
	return (0, vue_exports.computed)(() => {
		const raw = page.props.admin;
		if (raw === null || typeof raw !== "object") return EMPTY;
		const admin = raw;
		return {
			can: admin.can ?? EMPTY.can,
			account: admin.account ?? null,
			nav: Array.isArray(admin.nav) ? admin.nav : [],
			environment: admin.environment === "local" || admin.environment === "staging" ? admin.environment : null,
			preferences: {
				railCollapsed: admin.preferences?.railCollapsed === true,
				railWidth: clampWidth(admin.preferences?.railWidth),
				railRev: typeof admin.preferences?.railRev === "number" && admin.preferences.railRev > 0 ? admin.preferences.railRev : 0
			},
			csrfToken: typeof admin.csrfToken === "string" && admin.csrfToken !== "" ? admin.csrfToken : null,
			breadcrumbs: Array.isArray(admin.breadcrumbs) ? admin.breadcrumbs : [],
			supportEmail: typeof admin.supportEmail === "string" ? admin.supportEmail : null,
			notifications: {
				unread: typeof admin.notifications?.unread === "number" && admin.notifications.unread >= 0 ? admin.notifications.unread : null,
				offered: admin.notifications?.offered === true
			},
			health: admin.health && (admin.health.state === "ok" || admin.health.state === "warn" || admin.health.state === "bad") && typeof admin.health.sentence === "string" ? {
				state: admin.health.state,
				sentence: admin.health.sentence,
				label: typeof admin.health.label === "string" ? admin.health.label : admin.health.sentence,
				count: typeof admin.health.count === "string" ? admin.health.count : null,
				href: typeof admin.health.href === "string" ? admin.health.href : null,
				banner: banner(admin.health.banner)
			} : null,
			quickActions: Array.isArray(admin.quickActions) ? admin.quickActions : [],
			demo: admin.demo && typeof admin.demo.rows === "number" && admin.demo.rows > 0 ? {
				rows: admin.demo.rows,
				canPurge: admin.demo.canPurge === true,
				blocked: typeof admin.demo.blocked === "string" && admin.demo.blocked !== "" ? admin.demo.blocked : null,
				resetHref: typeof admin.demo.resetHref === "string" && admin.demo.resetHref.startsWith("/admin/") ? admin.demo.resetHref : null
			} : null,
			review: admin.review === true
		};
	});
}
var SHELL = Symbol("admin-shell");
function provideAdminShell(shell) {
	(0, vue_exports.provide)(SHELL, shell);
}
/**
* The shell as the layout provided it. Outside the layout — a component test mounting one piece —
* it falls back to inert state rather than throwing, so a part can be tested on its own.
*/
function useAdminShell() {
	return (0, vue_exports.inject)(SHELL, null) ?? {
		paletteOpen: (0, vue_exports.ref)(false),
		shortcutsOpen: (0, vue_exports.ref)(false),
		railCollapsed: (0, vue_exports.ref)(false),
		toggleRail: () => void 0
	};
}
//#endregion
//#region resources/js/Components/Admin/AdminConfirm.vue?vue&type=script&setup=true&lang.ts
var AdminConfirm_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminConfirm",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		title: {},
		body: {},
		confirmLabel: { default: "Löschen" },
		busy: {
			type: Boolean,
			default: false
		},
		confirmWord: { default: void 0 }
	}, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["confirm"], ["update:open"]),
	setup(__props, { emit: __emit }) {
		/**
		* The question before something that cannot be undone (admin-shell.md §8.4).
		*
		* It names the object in the title, and on the live shop it says so first — `Das wirkt sofort im
		* Live-Shop.` — because the same button in a copy of the shop is a rehearsal. A count in the body is
		* real or the body does not mention one; that is the caller's sentence to write.
		*
		* With `confirmWord`, the action waits until that exact word is typed: for the few things whose
		* consequences reach past this screen (BRIEF-2 §2). The safe answer is always one Esc away.
		*/
		const props = __props;
		const emit = __emit;
		const open = (0, vue_exports.useModel)(__props, "open");
		const admin = useAdmin();
		/** The environment badge is absent exactly when this is the live shop. */
		const live = (0, vue_exports.computed)(() => admin.value.environment === null);
		const typed = (0, vue_exports.ref)("");
		(0, vue_exports.watch)(open, (value) => {
			if (value) typed.value = "";
		});
		const ready = (0, vue_exports.computed)(() => !props.confirmWord || typed.value.trim() === props.confirmWord);
		function confirm() {
			if (ready.value && !props.busy) emit("confirm");
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: __props.title,
				"content-class": "adm-dialog adm-dialog--narrow"
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button"${_scopeId}>Abbrechen</button><button class="btn btn--secondary adm-btn--danger" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", ready.value ? void 0 : "true")}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", __props.busy ? "true" : void 0)}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.confirmLabel)}</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary adm-btn--danger",
						type: "button",
						"aria-disabled": ready.value ? void 0 : "true",
						"aria-busy": __props.busy ? "true" : void 0,
						onClick: confirm
					}, (0, vue_exports.toDisplayString)(__props.confirmLabel), 9, ["aria-disabled", "aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-confirm__body"${_scopeId}>`);
						if (live.value) _push(`<!--[-->Das wirkt sofort im Live-Shop. <!--]-->`);
						else _push(`<!---->`);
						_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.body)}</p>`);
						if (__props.confirmWord) _push(`<div class="form-field adm-confirm__word"${_scopeId}><label class="form-field__label" for="adm-confirm-word"${_scopeId}>Tippe „${(0, server_renderer_exports.ssrInterpolate)(__props.confirmWord)}“, um zu bestätigen.</label><input id="adm-confirm-word"${(0, server_renderer_exports.ssrRenderAttr)("value", typed.value)} class="input" type="text" autocomplete="off" spellcheck="false"${_scopeId}></div>`);
						else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)("p", { class: "adm-confirm__body" }, [live.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Das wirkt sofort im Live-Shop. ")], 64)) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.body), 1)]), __props.confirmWord ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
						key: 0,
						class: "form-field adm-confirm__word"
					}, [(0, vue_exports.createVNode)("label", {
						class: "form-field__label",
						for: "adm-confirm-word"
					}, "Tippe „" + (0, vue_exports.toDisplayString)(__props.confirmWord) + "“, um zu bestätigen.", 1), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
						id: "adm-confirm-word",
						"onUpdate:modelValue": ($event) => typed.value = $event,
						class: "input",
						type: "text",
						autocomplete: "off",
						spellcheck: "false",
						onKeydown: (0, vue_exports.withKeys)((0, vue_exports.withModifiers)(confirm, ["prevent"]), ["enter"])
					}, null, 40, ["onUpdate:modelValue", "onKeydown"]), [[vue_exports.vModelText, typed.value]])])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminConfirm.vue
var _sfc_setup = AdminConfirm_vue_vue_type_script_setup_true_lang_default.setup;
AdminConfirm_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminConfirm.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminConfirm_default = AdminConfirm_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { RAIL as a, labelMode as c, toggleHint as d, toggleIntent as f, useAdminShell as i, nextRev as l, provideAdminShell as n, clampWidth as o, useAdmin as r, effectiveRail as s, AdminConfirm_default as t, railSentence as u };
