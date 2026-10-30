import { S as Primitive, a as DialogOverlay_default, b as DialogClose_default, n as DialogTitle_default, o as DialogDescription_default, r as DialogPortal_default, s as DialogContent_default, x as DialogRoot_default } from "./Dialog-CAlgTJaP.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { r as useSheetHistory } from "./useSheetHistory-M_7_WyQG.js";
import { a as toast, i as firstLoad, n as TOAST_MS, o as toastFrom, r as addedFrom, t as TOAST_ACTION_MS } from "./toast-Ckkabove.js";
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/VisuallyHidden/VisuallyHidden.js
var VisuallyHidden_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "VisuallyHidden",
	props: {
		feature: {
			type: String,
			required: false,
			default: "focusable"
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "span"
		}
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				as: _ctx.as,
				"as-child": _ctx.asChild,
				"aria-hidden": _ctx.feature === "focusable" || _ctx.feature === "fully-hidden" ? "true" : void 0,
				"data-hidden": _ctx.feature === "fully-hidden" ? "" : void 0,
				tabindex: _ctx.feature === "fully-hidden" ? "-1" : void 0,
				style: {
					position: "absolute",
					border: 0,
					width: "1px",
					height: "1px",
					padding: 0,
					margin: "-1px",
					overflow: "hidden",
					clip: "rect(0, 0, 0, 0)",
					clipPath: "inset(50%)",
					whiteSpace: "nowrap",
					wordWrap: "normal",
					top: "-1px",
					left: "-1px"
				}
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"as",
				"as-child",
				"aria-hidden",
				"data-hidden",
				"tabindex"
			]);
		};
	}
});
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
* open, whether a page has put a sticky action bar on the bottom edge, whether the page runs as an
* installed app. Every open sheet registers a closer here, so one call closes them all before a
* navigation.
*/
var KEY = Symbol("mobile-shell");
function provideMobileShell() {
	const viewport = useVisualViewport();
	const closers = /* @__PURE__ */ new Set();
	const store = {
		searchOpen: (0, vue_exports.ref)(false),
		vehicleOpen: (0, vue_exports.ref)(false),
		stickyBar: (0, vue_exports.ref)(false),
		keyboardOpen: viewport.keyboardOpen,
		standalone: (0, vue_exports.ref)(false),
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
var _sfc_setup$2 = BottomSheet_vue_vue_type_script_setup_true_lang_default.setup;
BottomSheet_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/BottomSheet.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
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
			if (props.href && !props.external && !props.disabled) router.prefetch(props.href, { method: "get" }, {});
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
							_push(`<span class="mrow__lead" data-v-6614c8c2${_scopeId}>`);
							(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "leading", {}, () => {
								if (__props.icon) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: __props.icon,
									size: 24
								}, null, _parent, _scopeId));
								else _push(`<!---->`);
							}, _push, _parent, _scopeId);
							_push(`</span>`);
						} else _push(`<!---->`);
						_push(`<span class="mrow__body" data-v-6614c8c2${_scopeId}><span class="mrow__text" data-v-6614c8c2${_scopeId}><span class="mrow__title" data-v-6614c8c2${_scopeId}>`);
						(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, () => {
							_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.title)}`);
						}, _push, _parent, _scopeId);
						_push(`</span>`);
						if (__props.sub || _ctx.$slots.sub) {
							_push(`<span class="mrow__sub small muted" data-v-6614c8c2${_scopeId}>`);
							(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "sub", {}, () => {
								_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.sub)}`);
							}, _push, _parent, _scopeId);
							_push(`</span>`);
						} else _push(`<!---->`);
						_push(`</span>`);
						if (__props.meta || _ctx.$slots.trailing) {
							_push(`<span class="mrow__meta small num muted" data-v-6614c8c2${_scopeId}>`);
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
var _sfc_setup$1 = ListRow_vue_vue_type_script_setup_true_lang_default.setup;
ListRow_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Mobile/ListRow.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var ListRow_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ListRow_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6614c8c2"]]);
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
		function fromResponse(props) {
			return addedFrom(props) !== null ? null : toastFrom(props);
		}
		function onKeydown(event) {
			if (event.key === "F8" && actionButton.value !== null) {
				event.preventDefault();
				actionButton.value.focus();
			}
		}
		(0, vue_exports.onMounted)(() => {
			const entry = performance.getEntriesByType?.("navigation")[0];
			if (firstLoad("toast") && entry?.type !== "back_forward") show(fromResponse(page.props));
			stopListening = router.on("success", (event) => {
				show(fromResponse(event.detail.page.props));
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
			}, _attrs))} data-v-8d3ee2c3>`);
			if (message.value) {
				_push(`<div class="toast" data-v-8d3ee2c3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: message.value.icon ?? "check-circle",
					size: 20
				}, null, _parent));
				_push(`<span class="toast__text" data-v-8d3ee2c3>${(0, server_renderer_exports.ssrInterpolate)(message.value.text)}</span>`);
				if (message.value.action) _push(`<button class="btn btn--outline-light btn--sm toast__action" type="button" data-v-8d3ee2c3>${(0, server_renderer_exports.ssrInterpolate)(message.value.action.label)}</button>`);
				else _push(`<!---->`);
				_push(`<button class="icon-btn toast__close" type="button" aria-label="Schließen" data-v-8d3ee2c3>`);
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
var Toast_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Toast_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8d3ee2c3"]]);
//#endregion
export { isNavigationVisit as a, VisuallyHidden_default as c, hasMobileShell as i, ListRow_default as n, provideMobileShell as o, BottomSheet_default as r, useMobileShell as s, Toast_default as t };
