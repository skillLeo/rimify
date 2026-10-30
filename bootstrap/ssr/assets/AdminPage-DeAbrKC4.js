import { A as defu, B as tryOnScopeDispose, D as useForwardExpose, F as createEventHook, H as useTimeoutFn, M as useEventListener, P as useVModel, S as Primitive, T as useId, a as DialogOverlay_default, b as DialogClose_default, i as Teleport_default, n as DialogTitle_default, o as DialogDescription_default, r as DialogPortal_default, s as DialogContent_default, t as Dialog_default, w as Presence_default, x as DialogRoot_default, y as DismissableLayer_default, z as refAutoReset } from "./Dialog-BPdFERzS.js";
import { a as DropdownMenuRoot_default, d as PopperRoot_default, i as DropdownMenuContent_default, l as PopperContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default, u as PopperAnchor_default, v as useForwardPropsEmits, y as useForwardProps } from "./DropdownMenuTrigger-lkcRFLT8.js";
import { a as isNavigationVisit, c as VisuallyHidden_default, i as hasMobileShell, n as ListRow_default, o as provideMobileShell, r as BottomSheet_default, s as useMobileShell, t as Toast_default } from "./Toast-C0oiEBxZ.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-GAJuN4lI.js";
import { a as link_default, c as router, i as head_default, n as createContext, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { a as useAdminShortcuts, i as goTargets, n as feedback, r as startFeedback, t as FeedbackDialog_default } from "./FeedbackDialog-Fs1UFcic.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { a as RAIL, c as labelMode, d as toggleHint, f as toggleIntent, i as useAdminShell, l as nextRev, n as provideAdminShell, o as clampWidth, r as useAdmin, s as effectiveRail, t as AdminConfirm_default, u as railSentence } from "./AdminConfirm-CuIy_ILR.js";
import { n as stripSheetState, r as useSheetHistory } from "./useSheetHistory-M_7_WyQG.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { t as Kbd_default } from "./Kbd-IVqF_hft.js";
import { a as toast } from "./toast-Ckkabove.js";
//#region node_modules/reka-ui/dist/shared/useGraceArea.js
function useGraceArea(triggerElement, containerElement) {
	const isPointerInTransit = refAutoReset(false, 300);
	tryOnScopeDispose(() => {
		isPointerInTransit.value = false;
	});
	const pointerGraceArea = (0, vue_exports.ref)(null);
	const pointerExit = createEventHook();
	function handleRemoveGraceArea() {
		pointerGraceArea.value = null;
		isPointerInTransit.value = false;
	}
	function handleCreateGraceArea(event, hoverTarget) {
		if (!hoverTarget) return;
		const currentTarget = event.currentTarget;
		const exitPoint = {
			x: event.clientX,
			y: event.clientY
		};
		const paddedExitPoints = getPaddedExitPoints(exitPoint, getExitSideFromRect(exitPoint, currentTarget.getBoundingClientRect()), 1);
		const hoverTargetPoints = getPointsFromRect(hoverTarget.getBoundingClientRect());
		const graceArea = getHull([...paddedExitPoints, ...hoverTargetPoints]);
		pointerGraceArea.value = graceArea;
		isPointerInTransit.value = true;
	}
	(0, vue_exports.watchEffect)((cleanupFn) => {
		if (triggerElement.value && containerElement.value) {
			const trigger = triggerElement.value;
			const container = containerElement.value;
			const handleTriggerLeave = (event) => handleCreateGraceArea(event, container);
			const handleContentLeave = (event) => handleCreateGraceArea(event, trigger);
			trigger.addEventListener("pointerleave", handleTriggerLeave);
			container.addEventListener("pointerleave", handleContentLeave);
			cleanupFn(() => {
				trigger.removeEventListener("pointerleave", handleTriggerLeave);
				container.removeEventListener("pointerleave", handleContentLeave);
			});
		}
	});
	(0, vue_exports.watchEffect)((cleanupFn) => {
		if (pointerGraceArea.value) {
			const handleTrackPointerGrace = (event) => {
				if (!pointerGraceArea.value || !(event.target instanceof Element)) return;
				const target = event.target;
				const pointerPosition = {
					x: event.clientX,
					y: event.clientY
				};
				const hasEnteredTarget = triggerElement.value?.contains(target) || containerElement.value?.contains(target);
				const isPointerOutsideGraceArea = !isPointInPolygon(pointerPosition, pointerGraceArea.value);
				const isAnotherGraceAreaTrigger = !!target.closest("[data-grace-area-trigger]");
				if (hasEnteredTarget) handleRemoveGraceArea();
				else if (isPointerOutsideGraceArea || isAnotherGraceAreaTrigger) {
					handleRemoveGraceArea();
					pointerExit.trigger();
				}
			};
			const ownerDocument = triggerElement.value?.ownerDocument;
			ownerDocument?.addEventListener("pointermove", handleTrackPointerGrace);
			cleanupFn(() => ownerDocument?.removeEventListener("pointermove", handleTrackPointerGrace));
		}
	});
	return {
		isPointerInTransit,
		onPointerExit: pointerExit.on
	};
}
function getExitSideFromRect(point, rect) {
	const top = Math.abs(rect.top - point.y);
	const bottom = Math.abs(rect.bottom - point.y);
	const right = Math.abs(rect.right - point.x);
	const left = Math.abs(rect.left - point.x);
	switch (Math.min(top, bottom, right, left)) {
		case left: return "left";
		case right: return "right";
		case top: return "top";
		case bottom: return "bottom";
		default: throw new Error("unreachable");
	}
}
function getPaddedExitPoints(exitPoint, exitSide, padding = 5) {
	const paddedExitPoints = [];
	switch (exitSide) {
		case "top":
			paddedExitPoints.push({
				x: exitPoint.x - padding,
				y: exitPoint.y + padding
			}, {
				x: exitPoint.x + padding,
				y: exitPoint.y + padding
			});
			break;
		case "bottom":
			paddedExitPoints.push({
				x: exitPoint.x - padding,
				y: exitPoint.y - padding
			}, {
				x: exitPoint.x + padding,
				y: exitPoint.y - padding
			});
			break;
		case "left":
			paddedExitPoints.push({
				x: exitPoint.x + padding,
				y: exitPoint.y - padding
			}, {
				x: exitPoint.x + padding,
				y: exitPoint.y + padding
			});
			break;
		case "right": paddedExitPoints.push({
			x: exitPoint.x - padding,
			y: exitPoint.y - padding
		}, {
			x: exitPoint.x - padding,
			y: exitPoint.y + padding
		});
	}
	return paddedExitPoints;
}
function getPointsFromRect(rect) {
	const { top, right, bottom, left } = rect;
	return [
		{
			x: left,
			y: top
		},
		{
			x: right,
			y: top
		},
		{
			x: right,
			y: bottom
		},
		{
			x: left,
			y: bottom
		}
	];
}
function isPointInPolygon(point, polygon) {
	const { x, y } = point;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const yi = polygon[i].y;
		const xj = polygon[j].x;
		const yj = polygon[j].y;
		if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}
function getHull(points) {
	const newPoints = points.slice();
	newPoints.sort((a, b) => {
		if (a.x < b.x) return -1;
		else if (a.x > b.x) return 1;
		else if (a.y < b.y) return -1;
		else if (a.y > b.y) return 1;
		else return 0;
	});
	return getHullPresorted(newPoints);
}
function getHullPresorted(points) {
	if (points.length <= 1) return points.slice();
	const upperHull = [];
	for (let i = 0; i < points.length; i++) {
		const p = points[i];
		while (upperHull.length >= 2) {
			const q = upperHull.at(-1);
			const r = upperHull[upperHull.length - 2];
			if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x)) upperHull.pop();
			else break;
		}
		upperHull.push(p);
	}
	upperHull.pop();
	const lowerHull = [];
	for (let i = points.length - 1; i >= 0; i--) {
		const p = points[i];
		while (lowerHull.length >= 2) {
			const q = lowerHull.at(-1);
			const r = lowerHull[lowerHull.length - 2];
			if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x)) lowerHull.pop();
			else break;
		}
		lowerHull.push(p);
	}
	lowerHull.pop();
	if (upperHull.length === 1 && lowerHull.length === 1 && upperHull[0].x === lowerHull[0].x && upperHull[0].y === lowerHull[0].y) return upperHull;
	else return upperHull.concat(lowerHull);
}
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuGroup.js
var [injectMenuGroupContext, provideMenuGroupContext] = /*#__PURE__*/ createContext("MenuGroup");
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuLabel.js
var MenuLabel_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuLabel",
	props: {
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "div"
		}
	},
	setup(__props) {
		const props = __props;
		const groupContext = injectMenuGroupContext({ id: "" });
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(props, { id: (0, vue_exports.unref)(groupContext).id || void 0 }), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["id"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/DropdownMenu/DropdownMenuLabel.js
var DropdownMenuLabel_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuLabel",
	props: {
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		}
	},
	setup(__props) {
		const props = __props;
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuLabel_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)(props)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/TooltipProvider.js
var [injectTooltipProviderContext, provideTooltipProviderContext] = /*#__PURE__*/ createContext("TooltipProvider");
var TooltipProvider_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "TooltipProvider",
	props: {
		delayDuration: {
			type: Number,
			required: false,
			default: 700
		},
		skipDelayDuration: {
			type: Number,
			required: false,
			default: 300
		},
		disableHoverableContent: {
			type: Boolean,
			required: false,
			default: false
		},
		disableClosingTrigger: {
			type: Boolean,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		ignoreNonKeyboardFocus: {
			type: Boolean,
			required: false,
			default: false
		},
		content: {
			type: Object,
			required: false
		}
	},
	setup(__props) {
		const { delayDuration, skipDelayDuration, disableHoverableContent, disableClosingTrigger, ignoreNonKeyboardFocus, disabled, content } = (0, vue_exports.toRefs)(__props);
		useForwardExpose();
		const isOpenDelayed = (0, vue_exports.ref)(true);
		const isPointerInTransitRef = (0, vue_exports.ref)(false);
		const { start: startTimer, stop: clearTimer } = useTimeoutFn(() => {
			isOpenDelayed.value = true;
		}, skipDelayDuration, { immediate: false });
		provideTooltipProviderContext({
			isOpenDelayed,
			delayDuration,
			onOpen() {
				clearTimer();
				isOpenDelayed.value = false;
			},
			onClose() {
				startTimer();
			},
			isPointerInTransitRef,
			disableHoverableContent,
			disableClosingTrigger,
			disabled,
			ignoreNonKeyboardFocus,
			content
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.renderSlot)(_ctx.$slots, "default");
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/utils.js
var TOOLTIP_OPEN = "tooltip.open";
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/TooltipRoot.js
var [injectTooltipRootContext, provideTooltipRootContext] = /*#__PURE__*/ createContext("TooltipRoot");
var TooltipRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TooltipRoot",
	props: {
		defaultOpen: {
			type: Boolean,
			required: false,
			default: false
		},
		open: {
			type: Boolean,
			required: false,
			default: void 0
		},
		delayDuration: {
			type: Number,
			required: false,
			default: void 0
		},
		disableHoverableContent: {
			type: Boolean,
			required: false,
			default: void 0
		},
		disableClosingTrigger: {
			type: Boolean,
			required: false,
			default: void 0
		},
		disabled: {
			type: Boolean,
			required: false,
			default: void 0
		},
		ignoreNonKeyboardFocus: {
			type: Boolean,
			required: false,
			default: void 0
		}
	},
	emits: ["update:open"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		useForwardExpose();
		const providerContext = injectTooltipProviderContext();
		const disableHoverableContent = (0, vue_exports.computed)(() => props.disableHoverableContent ?? providerContext.disableHoverableContent.value);
		const disableClosingTrigger = (0, vue_exports.computed)(() => props.disableClosingTrigger ?? providerContext.disableClosingTrigger.value);
		const disableTooltip = (0, vue_exports.computed)(() => props.disabled ?? providerContext.disabled.value);
		const delayDuration = (0, vue_exports.computed)(() => props.delayDuration ?? providerContext.delayDuration.value);
		const ignoreNonKeyboardFocus = (0, vue_exports.computed)(() => props.ignoreNonKeyboardFocus ?? providerContext.ignoreNonKeyboardFocus.value);
		const open = useVModel(props, "open", emit, {
			defaultValue: props.defaultOpen,
			passive: props.open === void 0
		});
		(0, vue_exports.watch)(open, (isOpen) => {
			if (!providerContext.onClose) return;
			if (isOpen) {
				providerContext.onOpen();
				document.dispatchEvent(new CustomEvent(TOOLTIP_OPEN));
			} else providerContext.onClose();
		});
		const wasOpenDelayedRef = (0, vue_exports.ref)(false);
		const trigger = (0, vue_exports.ref)();
		const stateAttribute = (0, vue_exports.computed)(() => {
			if (!open.value) return "closed";
			return wasOpenDelayedRef.value ? "delayed-open" : "instant-open";
		});
		const { start: startTimer, stop: clearTimer } = useTimeoutFn(() => {
			wasOpenDelayedRef.value = true;
			open.value = true;
		}, delayDuration, { immediate: false });
		function handleOpen() {
			clearTimer();
			wasOpenDelayedRef.value = false;
			open.value = true;
		}
		function handleClose() {
			clearTimer();
			open.value = false;
		}
		function handleDelayedOpen() {
			startTimer();
		}
		provideTooltipRootContext({
			contentId: "",
			open,
			stateAttribute,
			trigger,
			onTriggerChange(el) {
				trigger.value = el;
			},
			onTriggerEnter() {
				if (providerContext.isOpenDelayed.value) handleDelayedOpen();
				else handleOpen();
			},
			onTriggerLeave() {
				if (disableHoverableContent.value) handleClose();
				else clearTimer();
			},
			onOpen: handleOpen,
			onClose: handleClose,
			disableHoverableContent,
			disableClosingTrigger,
			disabled: disableTooltip,
			ignoreNonKeyboardFocus
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopperRoot_default), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { open: (0, vue_exports.unref)(open) })]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/TooltipContentImpl.js
var TooltipContentImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TooltipContentImpl",
	props: {
		ariaLabel: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false,
			default: void 0
		},
		as: {
			type: null,
			required: false
		},
		side: {
			type: null,
			required: false
		},
		sideOffset: {
			type: Number,
			required: false
		},
		align: {
			type: null,
			required: false
		},
		alignOffset: {
			type: Number,
			required: false
		},
		avoidCollisions: {
			type: Boolean,
			required: false,
			default: void 0
		},
		collisionBoundary: {
			type: null,
			required: false
		},
		collisionPadding: {
			type: [Number, Object],
			required: false
		},
		arrowPadding: {
			type: Number,
			required: false
		},
		sticky: {
			type: String,
			required: false
		},
		hideWhenDetached: {
			type: Boolean,
			required: false,
			default: void 0
		},
		positionStrategy: {
			type: String,
			required: false
		},
		updatePositionStrategy: {
			type: String,
			required: false
		}
	},
	emits: ["escapeKeyDown", "pointerDownOutside"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectTooltipRootContext();
		const providerContext = injectTooltipProviderContext();
		const { forwardRef, currentElement } = useForwardExpose();
		const ariaLabel = (0, vue_exports.computed)(() => props.ariaLabel || currentElement.value?.textContent);
		const popperContentProps = (0, vue_exports.computed)(() => {
			const { ariaLabel: _, ...restProps } = props;
			return defu(restProps, providerContext.content.value ?? {}, {
				side: "top",
				sideOffset: 0,
				align: "center",
				avoidCollisions: true,
				collisionBoundary: [],
				collisionPadding: 0,
				arrowPadding: 0,
				sticky: "partial",
				hideWhenDetached: false
			});
		});
		(0, vue_exports.onMounted)(() => {
			useEventListener(window, "scroll", (event) => {
				if (event.target?.contains(rootContext.trigger.value)) rootContext.onClose();
			}, { capture: true });
			useEventListener(document, TOOLTIP_OPEN, rootContext.onClose);
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DismissableLayer_default), {
				"as-child": "",
				"disable-outside-pointer-events": false,
				onEscapeKeyDown: _cache[0] || (_cache[0] = ($event) => emits("escapeKeyDown", $event)),
				onPointerDownOutside: _cache[1] || (_cache[1] = (event) => {
					if ((0, vue_exports.unref)(rootContext).disableClosingTrigger.value && (0, vue_exports.unref)(rootContext).trigger.value?.contains(event.target)) event.preventDefault();
					emits("pointerDownOutside", event);
				}),
				onFocusOutside: _cache[2] || (_cache[2] = (0, vue_exports.withModifiers)(() => {}, ["prevent"])),
				onDismiss: _cache[3] || (_cache[3] = ($event) => (0, vue_exports.unref)(rootContext).onClose())
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopperContent_default), (0, vue_exports.mergeProps)({
					ref: (0, vue_exports.unref)(forwardRef),
					"data-state": (0, vue_exports.unref)(rootContext).stateAttribute.value
				}, {
					..._ctx.$attrs,
					...popperContentProps.value
				}, { style: {
					"--reka-tooltip-content-transform-origin": "var(--reka-popper-transform-origin)",
					"--reka-tooltip-content-available-width": "var(--reka-popper-available-width)",
					"--reka-tooltip-content-available-height": "var(--reka-popper-available-height)",
					"--reka-tooltip-trigger-width": "var(--reka-popper-anchor-width)",
					"--reka-tooltip-trigger-height": "var(--reka-popper-anchor-height)"
				} }), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default"), (0, vue_exports.createVNode)((0, vue_exports.unref)(VisuallyHidden_default), {
						id: (0, vue_exports.unref)(rootContext).contentId,
						role: "tooltip"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(ariaLabel.value), 1)]),
						_: 1
					}, 8, ["id"])]),
					_: 3
				}, 16, ["data-state"])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/TooltipContentHoverable.js
var TooltipContentHoverable_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TooltipContentHoverable",
	props: {
		ariaLabel: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		},
		side: {
			type: null,
			required: false
		},
		sideOffset: {
			type: Number,
			required: false
		},
		align: {
			type: null,
			required: false
		},
		alignOffset: {
			type: Number,
			required: false
		},
		avoidCollisions: {
			type: Boolean,
			required: false
		},
		collisionBoundary: {
			type: null,
			required: false
		},
		collisionPadding: {
			type: [Number, Object],
			required: false
		},
		arrowPadding: {
			type: Number,
			required: false
		},
		sticky: {
			type: String,
			required: false
		},
		hideWhenDetached: {
			type: Boolean,
			required: false
		},
		positionStrategy: {
			type: String,
			required: false
		},
		updatePositionStrategy: {
			type: String,
			required: false
		}
	},
	setup(__props) {
		const forwardedProps = useForwardProps(__props);
		const { forwardRef, currentElement } = useForwardExpose();
		const { trigger, onClose } = injectTooltipRootContext();
		const providerContext = injectTooltipProviderContext();
		const { isPointerInTransit, onPointerExit } = useGraceArea(trigger, currentElement);
		providerContext.isPointerInTransitRef = isPointerInTransit;
		onPointerExit(() => {
			onClose();
		});
		useEventListener(currentElement, "pointermove", (event) => {
			const content = currentElement.value;
			if (!content || event.pointerType === "touch") return;
			if (content.ownerDocument.elementsFromPoint?.(event.clientX, event.clientY).some((el) => {
				if (content.contains(el)) return false;
				const coveredTrigger = el.closest("[data-grace-area-trigger]");
				return !!coveredTrigger && coveredTrigger !== trigger.value;
			})) onClose();
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(TooltipContentImpl_default, (0, vue_exports.mergeProps)({ ref: (0, vue_exports.unref)(forwardRef) }, (0, vue_exports.unref)(forwardedProps)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/TooltipContent.js
var TooltipContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TooltipContent",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		ariaLabel: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		},
		side: {
			type: null,
			required: false
		},
		sideOffset: {
			type: Number,
			required: false
		},
		align: {
			type: null,
			required: false
		},
		alignOffset: {
			type: Number,
			required: false
		},
		avoidCollisions: {
			type: Boolean,
			required: false
		},
		collisionBoundary: {
			type: null,
			required: false
		},
		collisionPadding: {
			type: [Number, Object],
			required: false
		},
		arrowPadding: {
			type: Number,
			required: false
		},
		sticky: {
			type: String,
			required: false
		},
		hideWhenDetached: {
			type: Boolean,
			required: false
		},
		positionStrategy: {
			type: String,
			required: false
		},
		updatePositionStrategy: {
			type: String,
			required: false
		}
	},
	emits: ["escapeKeyDown", "pointerDownOutside"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectTooltipRootContext();
		const forwarded = useForwardPropsEmits(props, emits);
		const { forwardRef } = useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), { present: _ctx.forceMount || (0, vue_exports.unref)(rootContext).open.value }, {
				default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(rootContext).disableHoverableContent.value ? TooltipContentImpl_default : TooltipContentHoverable_default), (0, vue_exports.mergeProps)({ ref: (0, vue_exports.unref)(forwardRef) }, (0, vue_exports.unref)(forwarded)), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16))]),
				_: 3
			}, 8, ["present"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/TooltipPortal.js
var TooltipPortal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TooltipPortal",
	props: {
		to: {
			type: null,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		defer: {
			type: Boolean,
			required: false
		},
		forceMount: {
			type: Boolean,
			required: false
		}
	},
	setup(__props) {
		const props = __props;
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Teleport_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)(props)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tooltip/TooltipTrigger.js
var TooltipTrigger_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TooltipTrigger",
	props: {
		reference: {
			type: null,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "button"
		}
	},
	setup(__props) {
		const props = __props;
		const rootContext = injectTooltipRootContext();
		const providerContext = injectTooltipProviderContext();
		rootContext.contentId ||= useId(void 0, "reka-tooltip-content");
		const { forwardRef, currentElement: triggerElement } = useForwardExpose();
		const isPointerDown = (0, vue_exports.ref)(false);
		const hasPointerMoveOpened = (0, vue_exports.ref)(false);
		const tooltipListeners = (0, vue_exports.computed)(() => {
			if (rootContext.disabled.value) return {};
			return {
				click: handleClick,
				focus: handleFocus,
				pointermove: handlePointerMove,
				pointerleave: handlePointerLeave,
				pointerdown: handlePointerDown,
				blur: handleBlur
			};
		});
		(0, vue_exports.watch)(triggerElement, (el) => {
			rootContext.onTriggerChange(el);
		}, { immediate: true });
		function handlePointerUp() {
			setTimeout(() => {
				isPointerDown.value = false;
			}, 1);
		}
		function handlePointerDown() {
			if (rootContext.open && !rootContext.disableClosingTrigger.value) rootContext.onClose();
			isPointerDown.value = true;
			document.addEventListener("pointerup", handlePointerUp, { once: true });
		}
		function handlePointerMove(event) {
			if (event.pointerType === "touch") return;
			if (!hasPointerMoveOpened.value && !providerContext.isPointerInTransitRef.value) {
				rootContext.onTriggerEnter();
				hasPointerMoveOpened.value = true;
			}
		}
		function handlePointerLeave() {
			rootContext.onTriggerLeave();
			hasPointerMoveOpened.value = false;
		}
		function handleFocus(event) {
			if (isPointerDown.value) return;
			if (rootContext.ignoreNonKeyboardFocus.value && !event.target.matches?.(":focus-visible")) return;
			rootContext.onOpen();
		}
		function handleBlur() {
			rootContext.onClose();
		}
		function handleClick() {
			if (!rootContext.disableClosingTrigger.value) rootContext.onClose();
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopperAnchor_default), {
				"as-child": "",
				reference: _ctx.reference ?? (0, vue_exports.unref)(triggerElement)
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
					ref: (0, vue_exports.unref)(forwardRef),
					"aria-describedby": (0, vue_exports.unref)(rootContext).open.value ? (0, vue_exports.unref)(rootContext).contentId : void 0,
					"data-state": (0, vue_exports.unref)(rootContext).stateAttribute.value,
					as: _ctx.as,
					"as-child": props.asChild,
					"data-grace-area-trigger": ""
				}, (0, vue_exports.toHandlers)(tooltipListeners.value)), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16, [
					"aria-describedby",
					"data-state",
					"as",
					"as-child"
				])]),
				_: 3
			}, 8, ["reference"]);
		};
	}
});
//#endregion
//#region resources/js/composables/admin/useAlertCount.ts
/**
* The bell's unread count when it knows better than the page (docs/admin/rest-build-plan.md, step 1).
*
* Every admin page arrives with `admin.notifications.unread`. Two things make that number stale:
* the bell has just read a fresher one, and Back or Forward restored a page from the browser's
* history, which Inertia does without asking the server — so a count read an hour ago would say
* "3 ungelesen" again after the reader has read them all. The fresher number is kept here, once for
* both bells (topbar and phone app bar), and dropped as soon as a page comes from the server again.
*/
var LATEST_URL = "/admin/benachrichtigungen/neueste";
/** A fresher count than the page's; null means the page's own is the freshest there is. */
var live$1 = (0, vue_exports.ref)(null);
var installed = false;
/** The newest alerts and the unread count, straight from the server. */
async function fetchLatest(signal) {
	try {
		const response = await fetch(LATEST_URL, {
			headers: {
				Accept: "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			credentials: "same-origin",
			signal
		});
		if (response.status === 401 || response.status === 419 || response.redirected && response.url.includes("/admin/anmelden")) return { status: "signed-out" };
		if (!response.ok) return { status: "failed" };
		const body = await response.json();
		return {
			status: "ok",
			unread: typeof body.unread === "number" ? body.unread : 0,
			items: Array.isArray(body.items) ? body.items : []
		};
	} catch {
		return { status: "failed" };
	}
}
async function refresh() {
	const answer = await fetchLatest();
	if (answer.status === "ok") live$1.value = answer.unread;
}
function useAlertCount() {
	if (!installed && typeof window !== "undefined") {
		installed = true;
		router.on("success", () => {
			live$1.value = null;
		});
		window.addEventListener("popstate", () => void refresh());
	}
	return {
		live: live$1,
		remember: (unread) => {
			live$1.value = unread;
		}
	};
}
//#endregion
//#region resources/js/Components/Admin/AdminBell.vue?vue&type=script&setup=true&lang.ts
var CENTRE = "/admin/benachrichtigungen";
var SIGN_IN = "/admin/anmelden";
var AdminBell_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminBell",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The bell: what happened that this person should know about (docs/admin/rest-build-plan.md, step 1).
		*
		* The number comes with every page from the server (`admin.notifications.unread`), so it is right in
		* the first frame and never jumps after hydration; useAlertCount keeps a fresher one when the bell
		* has read it, or when Back restored a page with an old count. The list is fetched when the bell
		* opens — the newest eight, read or not — and a list already shown stays while it is refreshed.
		*
		* Choosing an unread alert marks it read; one with a page then opens that page, as an ordinary visit
		* so an editor with unsaved changes still asks first. A read alert without a page leads to the
		* centre, where the whole history is. The keyboard lands on the newest alert, never on
		* „Alle als gelesen markieren“, which is not offered until the list it would clear is on screen.
		*/
		const admin = useAdmin();
		const count = useAlertCount();
		const open = (0, vue_exports.ref)(false);
		const state = (0, vue_exports.ref)("idle");
		const items = (0, vue_exports.ref)([]);
		/** Opened from the keyboard: the newest alert takes the focus once it is there. */
		let byKeyboard = false;
		let request = null;
		const unread = (0, vue_exports.computed)(() => count.live.value ?? admin.value.notifications.unread);
		/** A role that can receive no alert gets no bell — unless something already sits in it. */
		const shown = (0, vue_exports.computed)(() => admin.value.notifications.offered || (unread.value ?? 0) > 0);
		/** The badge: nothing at zero or when unknown, `99+` past ninety-nine. */
		const badge = (0, vue_exports.computed)(() => {
			const n = unread.value;
			return n === null || n === 0 ? null : n > 99 ? "99+" : String(n);
		});
		const label = (0, vue_exports.computed)(() => {
			const n = unread.value;
			if (n === null || n === 0) return "Benachrichtigungen";
			return n === 1 ? "Benachrichtigungen, 1 ungelesen" : `Benachrichtigungen, ${n > 99 ? "über 99" : n} ungelesen`;
		});
		/** Said aloud when the list settles: the menu's own items are read as they are reached. */
		const announcement = (0, vue_exports.computed)(() => {
			if (!open.value) return "";
			return {
				idle: "",
				loading: "Benachrichtigungen werden geladen.",
				ready: items.value.length === 0 ? "Noch keine Benachrichtigungen." : "",
				failed: "Die Benachrichtigungen konnten nicht geladen werden.",
				"signed-out": "Deine Anmeldung ist abgelaufen."
			}[state.value];
		});
		async function load() {
			request?.abort();
			const mine = new AbortController();
			request = mine;
			if (state.value !== "ready") state.value = "loading";
			const answer = await fetchLatest(mine.signal);
			if (request !== mine) return;
			if (answer.status === "ok") {
				items.value = answer.items;
				count.remember(answer.unread);
				state.value = "ready";
				await focusNewest();
			} else state.value = answer.status;
		}
		async function focusNewest() {
			if (!byKeyboard || !open.value) return;
			await (0, vue_exports.nextTick)();
			document.querySelector("[data-bell-menu] .adm-bellitem")?.focus();
		}
		function onOpen(value) {
			open.value = value;
			if (value) load();
			else {
				request?.abort();
				request = null;
				byKeyboard = false;
			}
		}
		function onTriggerKey(event) {
			if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") byKeyboard = true;
		}
		function choose(item) {
			if (item.read) {
				router.visit(item.href ?? CENTRE);
				return;
			}
			router.post(`${CENTRE}/${item.id}/gelesen`, { bleiben: true }, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					if (item.href !== null) router.visit(item.href);
				}
			});
		}
		function readAll() {
			router.post(`${CENTRE}/gelesen`, {}, {
				preserveScroll: true,
				preserveState: true
			});
		}
		let wide = null;
		const close = () => onOpen(false);
		(0, vue_exports.onMounted)(() => {
			wide = window.matchMedia("(min-width: 768px)");
			wide.addEventListener("change", close);
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			wide?.removeEventListener("change", close);
			request?.abort();
		});
		return (_ctx, _push, _parent, _attrs) => {
			if (shown.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": onOpen
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
							class: "adm-iconbtn adm-bell",
							"aria-label": label.value,
							onKeydown: onTriggerKey,
							onPointerdown: ($event) => (0, vue_exports.isRef)(byKeyboard) ? byKeyboard.value = false : byKeyboard = false
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "bell",
										size: 20
									}, null, _parent, _scopeId));
									if (badge.value) _push(`<span class="adm-bell__count" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(badge.value)}</span>`);
									else _push(`<!---->`);
								} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "bell",
									size: 20
								}), badge.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "adm-bell__count",
									"aria-hidden": "true"
								}, (0, vue_exports.toDisplayString)(badge.value), 1)) : (0, vue_exports.createCommentVNode)("", true)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`<span class="visually-hidden" role="status"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(announcement.value)}</span>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu adm-alerts",
									"data-bell-menu": "",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__head" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push(`<span class="adm-alerts__title"${_scopeId}>Benachrichtigungen</span>`);
														if (badge.value) _push(`<span class="adm-alerts__unread"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(unread.value === 1 ? "1 ungelesen" : `${badge.value} ungelesen`)}</span>`);
														else _push(`<!---->`);
													} else return [(0, vue_exports.createVNode)("span", { class: "adm-alerts__title" }, "Benachrichtigungen"), badge.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 0,
														class: "adm-alerts__unread"
													}, (0, vue_exports.toDisplayString)(unread.value === 1 ? "1 ungelesen" : `${badge.value} ungelesen`), 1)) : (0, vue_exports.createCommentVNode)("", true)];
												}),
												_: 1
											}, _parent, _scopeId));
											if (state.value === "loading" || state.value === "idle") {
												_push(`<div class="adm-alerts__state" aria-hidden="true"${_scopeId}><!--[-->`);
												(0, server_renderer_exports.ssrRenderList)(2, (n) => {
													_push(`<span class="adm-alerts__skel"${_scopeId}><span class="skeleton adm-skel__bar"${_scopeId}></span><span class="skeleton adm-skel__bar adm-skel__bar--sub"${_scopeId}></span></span>`);
												});
												_push(`<!--]--></div>`);
											} else if (state.value === "failed") {
												_push(`<!--[-->`);
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push(`Die Benachrichtigungen konnten nicht geladen werden.`);
														else return [(0, vue_exports.createTextVNode)("Die Benachrichtigungen konnten nicht geladen werden.")];
													}),
													_: 1
												}, _parent, _scopeId));
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													onSelect: load
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push(`Erneut versuchen`);
														else return [(0, vue_exports.createTextVNode)("Erneut versuchen")];
													}),
													_: 1
												}, _parent, _scopeId));
												_push(`<!--]-->`);
											} else if (state.value === "signed-out") {
												_push(`<!--[-->`);
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push(`Deine Anmeldung ist abgelaufen.`);
														else return [(0, vue_exports.createTextVNode)("Deine Anmeldung ist abgelaufen.")];
													}),
													_: 1
												}, _parent, _scopeId));
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", SIGN_IN)} class="adm-menu__item"${_scopeId}>Neu anmelden</a>`);
														else return [(0, vue_exports.createVNode)("a", {
															href: SIGN_IN,
															class: "adm-menu__item"
														}, "Neu anmelden")];
													}),
													_: 1
												}, _parent, _scopeId));
												_push(`<!--]-->`);
											} else if (items.value.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(` Noch nichts. Sobald etwas passiert, das du wissen musst, steht es hier. `);
													else return [(0, vue_exports.createTextVNode)(" Noch nichts. Sobald etwas passiert, das du wissen musst, steht es hier. ")];
												}),
												_: 1
											}, _parent, _scopeId));
											else {
												_push(`<!--[-->`);
												(0, server_renderer_exports.ssrRenderList)(items.value, (item) => {
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: item.id,
														class: ["adm-bellitem", { "adm-bellitem--unread": !item.read }],
														onSelect: ($event) => choose(item)
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push(`<span class="adm-bellitem__dot" aria-hidden="true"${_scopeId}></span><span class="adm-bellitem__body"${_scopeId}><span class="adm-bellitem__title"${_scopeId}>`);
																if (!item.read) _push(`<span class="visually-hidden"${_scopeId}>Ungelesen: </span>`);
																else _push(`<!---->`);
																_push(`${(0, server_renderer_exports.ssrInterpolate)(item.title)}</span>`);
																if (item.detail) _push(`<span class="adm-bellitem__detail"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.detail)}</span>`);
																else _push(`<!---->`);
																_push(`<time class="adm-bellitem__time"${(0, server_renderer_exports.ssrRenderAttr)("datetime", item.iso ?? void 0)}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.dayLabel === "Heute" ? item.time : `${item.dayLabel}, ${item.time}`)}</time></span>`);
															} else return [(0, vue_exports.createVNode)("span", {
																class: "adm-bellitem__dot",
																"aria-hidden": "true"
															}), (0, vue_exports.createVNode)("span", { class: "adm-bellitem__body" }, [
																(0, vue_exports.createVNode)("span", { class: "adm-bellitem__title" }, [!item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
																	key: 0,
																	class: "visually-hidden"
																}, "Ungelesen: ")) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.title), 1)]),
																item.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
																	key: 0,
																	class: "adm-bellitem__detail"
																}, (0, vue_exports.toDisplayString)(item.detail), 1)) : (0, vue_exports.createCommentVNode)("", true),
																(0, vue_exports.createVNode)("time", {
																	class: "adm-bellitem__time",
																	datetime: item.iso ?? void 0
																}, (0, vue_exports.toDisplayString)(item.dayLabel === "Heute" ? item.time : `${item.dayLabel}, ${item.time}`), 9, ["datetime"])
															])];
														}),
														_: 2
													}, _parent, _scopeId));
												});
												_push(`<!--]-->`);
											}
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
											if (unread.value && state.value === "ready" && items.value.length) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: readAll
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "check",
															size: 20
														}, null, _parent, _scopeId));
														_push(` Alle als gelesen markieren `);
													} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "check",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Alle als gelesen markieren ")];
												}),
												_: 1
											}, _parent, _scopeId));
											else _push(`<!---->`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
														href: CENTRE,
														class: "adm-menu__item"
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																	name: "bell",
																	size: 20
																}, null, _parent, _scopeId));
																_push(` Alle Benachrichtigungen `);
															} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "bell",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Alle Benachrichtigungen ")];
														}),
														_: 1
													}, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: CENTRE,
														class: "adm-menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "bell",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Alle Benachrichtigungen ")]),
														_: 1
													})];
												}),
												_: 1
											}, _parent, _scopeId));
										} else return [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__head" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "adm-alerts__title" }, "Benachrichtigungen"), badge.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 0,
													class: "adm-alerts__unread"
												}, (0, vue_exports.toDisplayString)(unread.value === 1 ? "1 ungelesen" : `${badge.value} ungelesen`), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
												_: 1
											}),
											state.value === "loading" || state.value === "idle" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
												key: 0,
												class: "adm-alerts__state",
												"aria-hidden": "true"
											}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(2, (n) => {
												return (0, vue_exports.createVNode)("span", {
													key: n,
													class: "adm-alerts__skel"
												}, [(0, vue_exports.createVNode)("span", { class: "skeleton adm-skel__bar" }), (0, vue_exports.createVNode)("span", { class: "skeleton adm-skel__bar adm-skel__bar--sub" })]);
											}), 64))])) : state.value === "failed" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Die Benachrichtigungen konnten nicht geladen werden.")]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: (0, vue_exports.withModifiers)(load, ["prevent"])
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Erneut versuchen")]),
												_: 1
											})], 64)) : state.value === "signed-out" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Deine Anmeldung ist abgelaufen.")]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
													href: SIGN_IN,
													class: "adm-menu__item"
												}, "Neu anmelden")]),
												_: 1
											})], 64)) : items.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuLabel_default), {
												key: 3,
												class: "adm-alerts__note adm-alerts__state"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Noch nichts. Sobald etwas passiert, das du wissen musst, steht es hier. ")]),
												_: 1
											})) : ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, (0, vue_exports.renderList)(items.value, (item) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: item.id,
													class: ["adm-bellitem", { "adm-bellitem--unread": !item.read }],
													onSelect: ($event) => choose(item)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
														class: "adm-bellitem__dot",
														"aria-hidden": "true"
													}), (0, vue_exports.createVNode)("span", { class: "adm-bellitem__body" }, [
														(0, vue_exports.createVNode)("span", { class: "adm-bellitem__title" }, [!item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
															key: 0,
															class: "visually-hidden"
														}, "Ungelesen: ")) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.title), 1)]),
														item.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
															key: 0,
															class: "adm-bellitem__detail"
														}, (0, vue_exports.toDisplayString)(item.detail), 1)) : (0, vue_exports.createCommentVNode)("", true),
														(0, vue_exports.createVNode)("time", {
															class: "adm-bellitem__time",
															datetime: item.iso ?? void 0
														}, (0, vue_exports.toDisplayString)(item.dayLabel === "Heute" ? item.time : `${item.dayLabel}, ${item.time}`), 9, ["datetime"])
													])]),
													_: 2
												}, 1032, ["class", "onSelect"]);
											}), 128)),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
											unread.value && state.value === "ready" && items.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
												key: 5,
												class: "adm-menu__item",
												onSelect: readAll
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "check",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Alle als gelesen markieren ")]),
												_: 1
											})) : (0, vue_exports.createCommentVNode)("", true),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: CENTRE,
													class: "adm-menu__item"
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "bell",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Alle Benachrichtigungen ")]),
													_: 1
												})]),
												_: 1
											})
										];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu adm-alerts",
									"data-bell-menu": "",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__head" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "adm-alerts__title" }, "Benachrichtigungen"), badge.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "adm-alerts__unread"
											}, (0, vue_exports.toDisplayString)(unread.value === 1 ? "1 ungelesen" : `${badge.value} ungelesen`), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
											_: 1
										}),
										state.value === "loading" || state.value === "idle" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											key: 0,
											class: "adm-alerts__state",
											"aria-hidden": "true"
										}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(2, (n) => {
											return (0, vue_exports.createVNode)("span", {
												key: n,
												class: "adm-alerts__skel"
											}, [(0, vue_exports.createVNode)("span", { class: "skeleton adm-skel__bar" }), (0, vue_exports.createVNode)("span", { class: "skeleton adm-skel__bar adm-skel__bar--sub" })]);
										}), 64))])) : state.value === "failed" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Die Benachrichtigungen konnten nicht geladen werden.")]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item",
											onSelect: (0, vue_exports.withModifiers)(load, ["prevent"])
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Erneut versuchen")]),
											_: 1
										})], 64)) : state.value === "signed-out" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Deine Anmeldung ist abgelaufen.")]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
												href: SIGN_IN,
												class: "adm-menu__item"
											}, "Neu anmelden")]),
											_: 1
										})], 64)) : items.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuLabel_default), {
											key: 3,
											class: "adm-alerts__note adm-alerts__state"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Noch nichts. Sobald etwas passiert, das du wissen musst, steht es hier. ")]),
											_: 1
										})) : ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, (0, vue_exports.renderList)(items.value, (item) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
												key: item.id,
												class: ["adm-bellitem", { "adm-bellitem--unread": !item.read }],
												onSelect: ($event) => choose(item)
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
													class: "adm-bellitem__dot",
													"aria-hidden": "true"
												}), (0, vue_exports.createVNode)("span", { class: "adm-bellitem__body" }, [
													(0, vue_exports.createVNode)("span", { class: "adm-bellitem__title" }, [!item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 0,
														class: "visually-hidden"
													}, "Ungelesen: ")) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.title), 1)]),
													item.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 0,
														class: "adm-bellitem__detail"
													}, (0, vue_exports.toDisplayString)(item.detail), 1)) : (0, vue_exports.createCommentVNode)("", true),
													(0, vue_exports.createVNode)("time", {
														class: "adm-bellitem__time",
														datetime: item.iso ?? void 0
													}, (0, vue_exports.toDisplayString)(item.dayLabel === "Heute" ? item.time : `${item.dayLabel}, ${item.time}`), 9, ["datetime"])
												])]),
												_: 2
											}, 1032, ["class", "onSelect"]);
										}), 128)),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
										unread.value && state.value === "ready" && items.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: 5,
											class: "adm-menu__item",
											onSelect: readAll
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "check",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Alle als gelesen markieren ")]),
											_: 1
										})) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: CENTRE,
												class: "adm-menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "bell",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Alle Benachrichtigungen ")]),
												_: 1
											})]),
											_: 1
										})
									]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
							class: "adm-iconbtn adm-bell",
							"aria-label": label.value,
							onKeydown: onTriggerKey,
							onPointerdown: ($event) => (0, vue_exports.isRef)(byKeyboard) ? byKeyboard.value = false : byKeyboard = false
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "bell",
								size: 20
							}), badge.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "adm-bell__count",
								"aria-hidden": "true"
							}, (0, vue_exports.toDisplayString)(badge.value), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
							_: 1
						}, 8, ["aria-label", "onPointerdown"]),
						(0, vue_exports.createVNode)("span", {
							class: "visually-hidden",
							role: "status"
						}, (0, vue_exports.toDisplayString)(announcement.value), 1),
						(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
								class: "adm-menu adm-alerts",
								"data-bell-menu": "",
								align: "end",
								"side-offset": 8
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__head" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "adm-alerts__title" }, "Benachrichtigungen"), badge.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "adm-alerts__unread"
										}, (0, vue_exports.toDisplayString)(unread.value === 1 ? "1 ungelesen" : `${badge.value} ungelesen`), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
										_: 1
									}),
									state.value === "loading" || state.value === "idle" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "adm-alerts__state",
										"aria-hidden": "true"
									}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(2, (n) => {
										return (0, vue_exports.createVNode)("span", {
											key: n,
											class: "adm-alerts__skel"
										}, [(0, vue_exports.createVNode)("span", { class: "skeleton adm-skel__bar" }), (0, vue_exports.createVNode)("span", { class: "skeleton adm-skel__bar adm-skel__bar--sub" })]);
									}), 64))])) : state.value === "failed" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Die Benachrichtigungen konnten nicht geladen werden.")]),
										_: 1
									}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item",
										onSelect: (0, vue_exports.withModifiers)(load, ["prevent"])
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Erneut versuchen")]),
										_: 1
									})], 64)) : state.value === "signed-out" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-alerts__note adm-alerts__state" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Deine Anmeldung ist abgelaufen.")]),
										_: 1
									}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
											href: SIGN_IN,
											class: "adm-menu__item"
										}, "Neu anmelden")]),
										_: 1
									})], 64)) : items.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuLabel_default), {
										key: 3,
										class: "adm-alerts__note adm-alerts__state"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Noch nichts. Sobald etwas passiert, das du wissen musst, steht es hier. ")]),
										_: 1
									})) : ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, (0, vue_exports.renderList)(items.value, (item) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: item.id,
											class: ["adm-bellitem", { "adm-bellitem--unread": !item.read }],
											onSelect: ($event) => choose(item)
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", {
												class: "adm-bellitem__dot",
												"aria-hidden": "true"
											}), (0, vue_exports.createVNode)("span", { class: "adm-bellitem__body" }, [
												(0, vue_exports.createVNode)("span", { class: "adm-bellitem__title" }, [!item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 0,
													class: "visually-hidden"
												}, "Ungelesen: ")) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.title), 1)]),
												item.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 0,
													class: "adm-bellitem__detail"
												}, (0, vue_exports.toDisplayString)(item.detail), 1)) : (0, vue_exports.createCommentVNode)("", true),
												(0, vue_exports.createVNode)("time", {
													class: "adm-bellitem__time",
													datetime: item.iso ?? void 0
												}, (0, vue_exports.toDisplayString)(item.dayLabel === "Heute" ? item.time : `${item.dayLabel}, ${item.time}`), 9, ["datetime"])
											])]),
											_: 2
										}, 1032, ["class", "onSelect"]);
									}), 128)),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
									unread.value && state.value === "ready" && items.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
										key: 5,
										class: "adm-menu__item",
										onSelect: readAll
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "check",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Alle als gelesen markieren ")]),
										_: 1
									})) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: CENTRE,
											class: "adm-menu__item"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "bell",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Alle Benachrichtigungen ")]),
											_: 1
										})]),
										_: 1
									})
								]),
								_: 1
							})]),
							_: 1
						})
					];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminBell.vue
var _sfc_setup$16 = AdminBell_vue_vue_type_script_setup_true_lang_default.setup;
AdminBell_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminBell.vue");
	return _sfc_setup$16 ? _sfc_setup$16(props, ctx) : void 0;
};
var AdminBell_default = AdminBell_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/EnvironmentBadge.vue?vue&type=script&setup=true&lang.ts
var EnvironmentBadge_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "EnvironmentBadge",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Which copy of the shop this is — said only where the answer is unusual.
		*
		* `Lokal` and `Staging` are copies where work does not count, and the badge exists so nobody
		* changes the real shop's prices believing it is one. Production renders nothing: a warning colour
		* that is on screen every day stops being a warning, and the absence of a badge is the least
		* ambiguous way to say "this is the real shop" (DIRECTION §8a). Decided on the server and present
		* in the first frame; nothing after hydration changes it.
		*
		* Not interactive — no hover, no focus, no menu. The environment is changed by deploying, not by
		* clicking.
		*/
		const admin = useAdmin();
		const label = (0, vue_exports.computed)(() => {
			switch (admin.value.environment) {
				case "local": return "Lokal";
				case "staging": return "Vorschau";
				default: return null;
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			if (label.value) _push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "adm-env" }, _attrs))}><span class="visually-hidden">Umgebung: </span>${(0, server_renderer_exports.ssrInterpolate)(label.value)}</span>`);
			else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/EnvironmentBadge.vue
var _sfc_setup$15 = EnvironmentBadge_vue_vue_type_script_setup_true_lang_default.setup;
EnvironmentBadge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/EnvironmentBadge.vue");
	return _sfc_setup$15 ? _sfc_setup$15(props, ctx) : void 0;
};
var EnvironmentBadge_default = EnvironmentBadge_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminAppBar.vue?vue&type=script&setup=true&lang.ts
var AdminAppBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminAppBar",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The phone's top bar (admin-shell.md §11.1): below 768 px it replaces the topbar.
		*
		* The page's own `<h1>` is the heading, directly beneath. So the bar starts with the wordmark and
		* takes the page's title only once that heading has scrolled away under it — the title is always
		* in view, and never twice. At the right: the environment badge when this is not the live shop, and
		* the bell — on a phone as on a desk, alerts are the one thing that should not wait for the Mehr sheet.
		*
		* No breadcrumbs and no back arrow yet: every admin page today is reached from the bottom bar or
		* the Mehr sheet. The arrow arrives with the first page that is opened from a record list.
		*/
		const admin = useAdmin();
		const page = usePage();
		const title = (0, vue_exports.computed)(() => admin.value.breadcrumbs.at(-1)?.label ?? null);
		const titled = (0, vue_exports.ref)(false);
		let observer = null;
		function observe() {
			observer?.disconnect();
			titled.value = false;
			const heading = document.querySelector(".adm-page__title");
			if (!heading || typeof IntersectionObserver === "undefined") return;
			observer = new IntersectionObserver(([entry]) => {
				titled.value = entry !== void 0 && !entry.isIntersecting && entry.boundingClientRect.bottom <= 56;
			}, { rootMargin: "-56px 0px 0px 0px" });
			observer.observe(heading);
		}
		(0, vue_exports.onMounted)(() => {
			observe();
			(0, vue_exports.watch)(() => page.url.split("?")[0], () => void (0, vue_exports.nextTick)(observe));
		});
		(0, vue_exports.onBeforeUnmount)(() => observer?.disconnect());
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<header${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "adm-appbar",
				"data-titled": titled.value ? "" : void 0
			}, _attrs))}>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/admin",
				class: "adm-wordmark adm-appbar__brand",
				"aria-label": "RIMIFY – zur Übersicht"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`RIMIFY`);
					else return [(0, vue_exports.createTextVNode)("RIMIFY")];
				}),
				_: 1
			}, _parent));
			if (title.value) _push(`<p class="adm-appbar__title" aria-hidden="true">${(0, server_renderer_exports.ssrInterpolate)(title.value)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="adm-appbar__end">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(EnvironmentBadge_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminBell_default, null, null, _parent));
			_push(`</div></header>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminAppBar.vue
var _sfc_setup$14 = AdminAppBar_vue_vue_type_script_setup_true_lang_default.setup;
AdminAppBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminAppBar.vue");
	return _sfc_setup$14 ? _sfc_setup$14(props, ctx) : void 0;
};
var AdminAppBar_default = AdminAppBar_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminDemoBlocked.vue?vue&type=script&setup=true&lang.ts
var AdminDemoBlocked_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminDemoBlocked",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		reason: {},
		resetHref: {}
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
		* „Demodaten entfernen“ while the set cannot go (DemoCatalogue::blockers): said before anyone confirms, not after —
		* the reason in one sentence, and, for the Super-Admin on a test environment, the way that does work: resetting the
		* shop's data as a whole (System › Zurücksetzen). Never an empty promise and never a command to type.
		*/
		const open = (0, vue_exports.useModel)(__props, "open");
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: "Die Demodaten lassen sich gerade nicht entfernen",
				"content-class": "adm-dialog adm-dialog--narrow"
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="btn btn--secondary" type="button"${_scopeId}>Schließen</button>`);
						if (__props.resetHref) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: __props.resetHref,
							class: "btn btn--primary",
							onClick: ($event) => open.value = false
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zum Zurücksetzen`);
								else return [(0, vue_exports.createTextVNode)("Zum Zurücksetzen")];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Schließen", 8, ["onClick"]), __props.resetHref ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
						key: 0,
						href: __props.resetHref,
						class: "btn btn--primary",
						onClick: ($event) => open.value = false
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zum Zurücksetzen")]),
						_: 1
					}, 8, ["href", "onClick"])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-confirm__body"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.reason)}</p>`);
						if (__props.resetHref) _push(`<p class="adm-confirm__body"${_scopeId}>Unter System › Zurücksetzen setzt du stattdessen alle Shopdaten zurück. Vorher wird die ganze Datenbank gesichert, und du kannst es sieben Tage lang rückgängig machen.</p>`);
						else _push(`<p class="adm-confirm__body"${_scopeId}>Alle Shopdaten zurücksetzen kann nur der Super-Admin, unter System › Zurücksetzen.</p>`);
					} else return [(0, vue_exports.createVNode)("p", { class: "adm-confirm__body" }, (0, vue_exports.toDisplayString)(__props.reason), 1), __props.resetHref ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
						key: 0,
						class: "adm-confirm__body"
					}, "Unter System › Zurücksetzen setzt du stattdessen alle Shopdaten zurück. Vorher wird die ganze Datenbank gesichert, und du kannst es sieben Tage lang rückgängig machen.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
						key: 1,
						class: "adm-confirm__body"
					}, "Alle Shopdaten zurücksetzen kann nur der Super-Admin, unter System › Zurücksetzen."))];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminDemoBlocked.vue
var _sfc_setup$13 = AdminDemoBlocked_vue_vue_type_script_setup_true_lang_default.setup;
AdminDemoBlocked_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminDemoBlocked.vue");
	return _sfc_setup$13 ? _sfc_setup$13(props, ctx) : void 0;
};
var AdminDemoBlocked_default = AdminDemoBlocked_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/composables/admin/useDemoStrip.ts
/**
* „Demodaten entfernen · 4.416 Datensätze“ — the rail's foot on a desk, the Mehr sheet on a phone (M1-10): while
* demo rows exist, whoever opens the admin is told what the figures are made of, and who may (DemoDataPolicy) can
* take them away after one question. The button says what it does and nothing more: only the example data goes, never
* the team's own wheels, Gutachten and orders (the line beneath it says so). When the set cannot go now, the question
* is replaced by the reason (AdminDemoBlocked) — before anything is pressed, not after. One source for both places.
*/
function useDemoStrip() {
	const admin = useAdmin();
	const demo = (0, vue_exports.computed)(() => admin.value.demo);
	const rows = (0, vue_exports.computed)(() => demo.value ? `${formatNumber(demo.value.rows)}\u00A0${demo.value.rows === 1 ? "Datensatz" : "Datensätze"}` : "");
	/** The promise under the button, word for word what it keeps. */
	const note = "Entfernt nur die Beispieldaten, nicht deine eigenen Felgen, Gutachten und Bestellungen.";
	const body = (0, vue_exports.computed)(() => `${demo.value?.rows === 1 ? "Der letzte Datensatz der Beispieldaten wird" : `Die ${rows.value} der Beispieldaten werden`} gelöscht – die Demo-Bestellungen, das Demo-Team und der Beispielkatalog mit seinen Gutachten. Deine eigenen Felgen, Gutachten und Bestellungen bleiben, und das Protokoll hält fest, wer die Beispieldaten entfernt hat.`);
	const blocked = (0, vue_exports.computed)(() => demo.value?.blocked ?? null);
	const confirming = (0, vue_exports.ref)(false);
	const purging = (0, vue_exports.ref)(false);
	/**
	* Safari does not focus a clicked button, so the dialog would remember `<body>` as its opener and
	* hand the focus back there on „Abbrechen“ (M1-16). Focusing it first gives the focus a way home.
	*/
	function ask(event) {
		event.currentTarget.focus();
		confirming.value = true;
	}
	function purge() {
		if (purging.value) return;
		purging.value = true;
		router.post("/admin/demodaten/entfernen", {}, {
			preserveScroll: true,
			onSuccess: () => confirming.value = false,
			onFinish: () => purging.value = false
		});
	}
	return {
		demo,
		rows,
		note,
		body,
		blocked,
		confirming,
		purging,
		ask,
		purge
	};
}
//#endregion
//#region resources/js/composables/admin/monogram.ts
/**
* The letters on a person's avatar tile when there is no photo: the first letter of the first and
* the last word of the name — „Sabine Roth“ → SR, „Dr. Mirjam Halbach“ → MH (a title is not a name),
* „Lea“ → L. Uppercase, German letters kept (Ö stays Ö).
*/
var TITLES = /* @__PURE__ */ new Set([
	"dr.",
	"prof.",
	"dipl.-ing.",
	"ing."
]);
function monogram(name) {
	const words = (name ?? "").trim().split(/\s+/).filter((w) => w !== "" && !TITLES.has(w.toLowerCase()));
	if (words.length === 0) return "?";
	return (words[0].charAt(0) + (words.length > 1 ? words[words.length - 1].charAt(0) : "")).toLocaleUpperCase("de-DE");
}
//#endregion
//#region resources/js/composables/admin/useHealth.ts
/**
* The shop's health line, kept current (the rail's foot, the phone's Mehr sheet).
*
* Every admin page arrives with `admin.health` from the server, so the line is right in the first
* frame. After that it is asked for again every 60 seconds, silently: no spinner, no flicker — the
* sentence simply changes when the answer does. A poll that fails keeps the last answer rather than
* inventing a new one. One timer for the whole panel, however many places show the line.
*/
var PULSE_URL = "/admin/system/puls";
var PULSE_MS = 6e4;
var live = (0, vue_exports.ref)(null);
var users = 0;
var timer = null;
async function pulse() {
	if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
	try {
		const response = await fetch(PULSE_URL, {
			headers: {
				Accept: "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			credentials: "same-origin"
		});
		if (!response.ok) return;
		const body = await response.json();
		if ((body.state === "ok" || body.state === "warn" || body.state === "bad") && typeof body.sentence === "string") live.value = {
			state: body.state,
			sentence: body.sentence,
			label: typeof body.label === "string" ? body.label : body.sentence,
			count: typeof body.count === "string" ? body.count : null
		};
	} catch {}
}
var listening = false;
function useHealth() {
	const admin = useAdmin();
	if (!listening && typeof window !== "undefined") {
		listening = true;
		router.on("success", (event) => {
			live.value = null;
			if (event.detail.page.props.admin?.health?.banner?.key !== snoozedBanner.value) snoozedBanner.value = null;
		});
	}
	(0, vue_exports.onMounted)(() => {
		users += 1;
		if (timer === null) timer = setInterval(() => void pulse(), PULSE_MS);
	});
	(0, vue_exports.onBeforeUnmount)(() => {
		users -= 1;
		if (users <= 0 && timer !== null) {
			clearInterval(timer);
			timer = null;
			users = 0;
		}
	});
	return (0, vue_exports.computed)(() => {
		const base = admin.value.health;
		if (base === null) return null;
		return live.value === null ? base : {
			...base,
			...live.value
		};
	});
}
var snoozedBanner = (0, vue_exports.ref)(null);
/** The urgent problem's banner as the page shows it now: null when there is none, or it was put off. */
function useHealthBanner() {
	const admin = useAdmin();
	return (0, vue_exports.computed)(() => {
		const banner = admin.value.health?.banner ?? null;
		return banner !== null && banner.key !== snoozedBanner.value ? banner : null;
	});
}
//#endregion
//#region resources/js/Components/Admin/AdminMoreSheet.vue?vue&type=script&setup=true&lang.ts
var AdminMoreSheet_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminMoreSheet",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({ exclude: {} }, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: ["update:open"],
	setup(__props) {
		/**
		* Mehr (admin-shell.md §11.3): the shop's health, every group the bottom bar does not reach whole — no slot, or a
		* slot that opens only the first of its pages (D-365) —, „Neu“, then the account — on a phone, the rail's foot lives here.
		*
		* A group of one page is that page's row, the group named beneath it. A group of several opens a
		* second sheet with its pages — never an accordion inside a sheet, where a long group pushes the
		* account out of reach.
		* Both sheets are the product's one BottomSheet, so back, swipe and Esc close them the same way.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const admin = useAdmin();
		const account = (0, vue_exports.computed)(() => admin.value.account);
		const actions = (0, vue_exports.computed)(() => admin.value.quickActions);
		const initials = (0, vue_exports.computed)(() => monogram(account.value?.name));
		const health = useHealth();
		const banner = useHealthBanner();
		const { demo, rows: demoRows, note: purgeNote, body: purgeBody, blocked: purgeBlocked, confirming: confirmingPurge, purging, ask: askPurge, purge: purgeDemo } = useDemoStrip();
		const groups = (0, vue_exports.computed)(() => admin.value.nav.filter((g) => g.key !== "uebersicht" && !props.exclude.includes(g.key)));
		function total(group) {
			const value = group.pages.reduce((sum, p) => sum + (p.count ?? 0), 0);
			return value > 0 ? String(value) : void 0;
		}
		function pageCount(page) {
			return page.count ? String(page.count) : void 0;
		}
		function giveFeedback() {
			open.value = false;
			window.setTimeout(() => void startFeedback(), 320);
		}
		const group = (0, vue_exports.ref)(null);
		const shownGroup = (0, vue_exports.ref)(null);
		(0, vue_exports.watch)(group, (value) => {
			if (value !== null) shownGroup.value = value;
		});
		const groupOpen = (0, vue_exports.computed)({
			get: () => group.value !== null,
			set: (value) => {
				if (!value) group.value = null;
			}
		});
		const signingOut = (0, vue_exports.ref)(false);
		function signOut() {
			if (signingOut.value) return;
			signingOut.value = true;
			router.post("/admin/abmelden", {}, { onFinish: () => signingOut.value = false });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
				id: "admin-mehr",
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: "Mehr"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="adm-more"${_scopeId}>`);
						if ((0, vue_exports.unref)(health) && (0, vue_exports.unref)(health).state !== "ok" && !(0, vue_exports.unref)(banner)) (0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(health).href ? (0, vue_exports.unref)(link_default) : "p"), {
							href: (0, vue_exports.unref)(health).href ?? void 0,
							class: "adm-foot__health adm-more__health",
							"aria-label": (0, vue_exports.unref)(health).sentence
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-health__dot--${(0, vue_exports.unref)(health).state}`, "adm-health__dot"])}" aria-hidden="true"${_scopeId}></span><span class="adm-foot__label" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(health).label)}</span>`);
									if ((0, vue_exports.unref)(health).count) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-foot__count--${(0, vue_exports.unref)(health).state}`, "adm-foot__count"])}" aria-hidden="true"${_scopeId}>· ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(health).count)}</span>`);
									else _push(`<!---->`);
								} else return [
									(0, vue_exports.createVNode)("span", {
										class: ["adm-health__dot", `adm-health__dot--${(0, vue_exports.unref)(health).state}`],
										"aria-hidden": "true"
									}, null, 2),
									(0, vue_exports.createVNode)("span", {
										class: "adm-foot__label",
										"aria-hidden": "true"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).label), 1),
									(0, vue_exports.unref)(health).count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: ["adm-foot__count", `adm-foot__count--${(0, vue_exports.unref)(health).state}`],
										"aria-hidden": "true"
									}, "· " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).count), 3)) : (0, vue_exports.createCommentVNode)("", true)
								];
							}),
							_: 1
						}), _parent, _scopeId);
						else _push(`<!---->`);
						if ((0, vue_exports.unref)(demo)) {
							_push(`<p class="adm-foot__demo adm-more__demo"${_scopeId}><span class="adm-foot__demo-dot" aria-hidden="true"${_scopeId}></span><span class="adm-foot__demo-text"${_scopeId}>`);
							if ((0, vue_exports.unref)(demo).canPurge) _push(`<!--[--><button class="adm-foot__demo-purge" type="button" aria-describedby="adm-more-demo-note"${_scopeId}>Demodaten entfernen</button> · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(demoRows))} <span id="adm-more-demo-note" class="adm-foot__demo-note"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(purgeNote))}</span><!--]-->`);
							else _push(`<!--[-->Demodaten aktiv · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(demoRows))}<!--]-->`);
							_push(`</span></p>`);
						} else _push(`<!---->`);
						if ((0, vue_exports.unref)(demo)?.canPurge && !(0, vue_exports.unref)(purgeBlocked)) _push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: (0, vue_exports.unref)(confirmingPurge),
							"onUpdate:open": ($event) => (0, vue_exports.isRef)(confirmingPurge) ? confirmingPurge.value = $event : null,
							title: "Demodaten entfernen",
							body: (0, vue_exports.unref)(purgeBody),
							"confirm-label": "Entfernen",
							busy: (0, vue_exports.unref)(purging),
							onConfirm: (0, vue_exports.unref)(purgeDemo)
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if ((0, vue_exports.unref)(demo)?.canPurge && (0, vue_exports.unref)(purgeBlocked)) _push((0, server_renderer_exports.ssrRenderComponent)(AdminDemoBlocked_default, {
							open: (0, vue_exports.unref)(confirmingPurge),
							"onUpdate:open": ($event) => (0, vue_exports.isRef)(confirmingPurge) ? confirmingPurge.value = $event : null,
							reason: (0, vue_exports.unref)(purgeBlocked),
							"reset-href": (0, vue_exports.unref)(demo).resetHref
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if ((0, vue_exports.unref)(admin).review) _push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							title: "Rückmeldung geben",
							sub: "Mit Bildschirmfoto an das Team",
							onActivate: giveFeedback
						}, {
							leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "feedback",
									size: 24
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "feedback",
									size: 24
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(groups.value, (item) => {
							_push(`<!--[-->`);
							if (item.pages.length === 1) _push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
								title: item.pages[0]?.label ?? item.label,
								sub: item.pages[0]?.label === item.label ? void 0 : item.label,
								meta: total(item),
								href: item.pages[0]?.href
							}, {
								leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: item.pages[0]?.icon ?? item.icon,
										size: 24
									}, null, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: item.pages[0]?.icon ?? item.icon,
										size: 24
									}, null, 8, ["name"])];
								}),
								_: 2
							}, _parent, _scopeId));
							else _push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
								title: item.label,
								meta: total(item),
								chevron: "",
								onActivate: ($event) => group.value = item
							}, {
								leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: item.icon,
										size: 24
									}, null, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: item.icon,
										size: 24
									}, null, 8, ["name"])];
								}),
								_: 2
							}, _parent, _scopeId));
							_push(`<!--]-->`);
						});
						_push(`<!--]-->`);
						if (actions.value.length) {
							_push(`<!--[--><p class="adm-more__caption"${_scopeId}>Neu anlegen</p><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(actions.value, (action) => {
								_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
									key: action.key,
									title: action.label,
									href: action.href
								}, {
									leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: action.icon,
											size: 24
										}, null, _parent, _scopeId));
										else return [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: action.icon,
											size: 24
										}, null, 8, ["name"])];
									}),
									_: 2
								}, _parent, _scopeId));
							});
							_push(`<!--]--><!--]-->`);
						} else _push(`<!---->`);
						if (account.value) _push(`<div class="adm-more__account"${_scopeId}><span class="adm-avatar" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(initials.value)}</span><span${_scopeId}><span class="adm-more__name"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.value.name)}</span><span class="adm-more__role"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.value.role ?? account.value.email)}</span></span></div>`);
						else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							title: "Profil",
							href: "/admin/profil"
						}, {
							leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "users",
									size: 24
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "users",
									size: 24
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							title: "Benachrichtigungen",
							href: "/admin/benachrichtigungen"
						}, {
							leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "bell",
									size: 24
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "bell",
									size: 24
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							title: "Passwort ändern",
							href: "/admin/profil#passwort"
						}, {
							leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "shield",
									size: 24
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "shield",
									size: 24
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
							class: "adm-more__signout",
							title: signingOut.value ? "Wird abgemeldet …" : "Abmelden",
							chevron: false,
							disabled: signingOut.value,
							onActivate: signOut
						}, {
							leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "logout",
									size: 24
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "logout",
									size: 24
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "adm-more" }, [
						(0, vue_exports.unref)(health) && (0, vue_exports.unref)(health).state !== "ok" && !(0, vue_exports.unref)(banner) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(health).href ? (0, vue_exports.unref)(link_default) : "p"), {
							key: 0,
							href: (0, vue_exports.unref)(health).href ?? void 0,
							class: "adm-foot__health adm-more__health",
							"aria-label": (0, vue_exports.unref)(health).sentence
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("span", {
									class: ["adm-health__dot", `adm-health__dot--${(0, vue_exports.unref)(health).state}`],
									"aria-hidden": "true"
								}, null, 2),
								(0, vue_exports.createVNode)("span", {
									class: "adm-foot__label",
									"aria-hidden": "true"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).label), 1),
								(0, vue_exports.unref)(health).count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: ["adm-foot__count", `adm-foot__count--${(0, vue_exports.unref)(health).state}`],
									"aria-hidden": "true"
								}, "· " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).count), 3)) : (0, vue_exports.createCommentVNode)("", true)
							]),
							_: 1
						}, 8, ["href", "aria-label"])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.unref)(demo) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-foot__demo adm-more__demo"
						}, [(0, vue_exports.createVNode)("span", {
							class: "adm-foot__demo-dot",
							"aria-hidden": "true"
						}), (0, vue_exports.createVNode)("span", { class: "adm-foot__demo-text" }, [(0, vue_exports.unref)(demo).canPurge ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
							(0, vue_exports.createVNode)("button", {
								class: "adm-foot__demo-purge",
								type: "button",
								"aria-describedby": "adm-more-demo-note",
								onClick: (0, vue_exports.unref)(askPurge)
							}, "Demodaten entfernen", 8, ["onClick"]),
							(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)) + " ", 1),
							(0, vue_exports.createVNode)("span", {
								id: "adm-more-demo-note",
								class: "adm-foot__demo-note"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(purgeNote)), 1)
						], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Demodaten aktiv · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)), 1)], 64))])])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.unref)(demo)?.canPurge && !(0, vue_exports.unref)(purgeBlocked) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminConfirm_default, {
							key: 2,
							open: (0, vue_exports.unref)(confirmingPurge),
							"onUpdate:open": ($event) => (0, vue_exports.isRef)(confirmingPurge) ? confirmingPurge.value = $event : null,
							title: "Demodaten entfernen",
							body: (0, vue_exports.unref)(purgeBody),
							"confirm-label": "Entfernen",
							busy: (0, vue_exports.unref)(purging),
							onConfirm: (0, vue_exports.unref)(purgeDemo)
						}, null, 8, [
							"open",
							"onUpdate:open",
							"body",
							"busy",
							"onConfirm"
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.unref)(demo)?.canPurge && (0, vue_exports.unref)(purgeBlocked) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminDemoBlocked_default, {
							key: 3,
							open: (0, vue_exports.unref)(confirmingPurge),
							"onUpdate:open": ($event) => (0, vue_exports.isRef)(confirmingPurge) ? confirmingPurge.value = $event : null,
							reason: (0, vue_exports.unref)(purgeBlocked),
							"reset-href": (0, vue_exports.unref)(demo).resetHref
						}, null, 8, [
							"open",
							"onUpdate:open",
							"reason",
							"reset-href"
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.unref)(admin).review ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
							key: 4,
							title: "Rückmeldung geben",
							sub: "Mit Bildschirmfoto an das Team",
							onActivate: giveFeedback
						}, {
							leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "feedback",
								size: 24
							})]),
							_: 1
						})) : (0, vue_exports.createCommentVNode)("", true),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (item) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: item.key }, [item.pages.length === 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
								key: 0,
								title: item.pages[0]?.label ?? item.label,
								sub: item.pages[0]?.label === item.label ? void 0 : item.label,
								meta: total(item),
								href: item.pages[0]?.href
							}, {
								leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: item.pages[0]?.icon ?? item.icon,
									size: 24
								}, null, 8, ["name"])]),
								_: 2
							}, 1032, [
								"title",
								"sub",
								"meta",
								"href"
							])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
								key: 1,
								title: item.label,
								meta: total(item),
								chevron: "",
								onActivate: ($event) => group.value = item
							}, {
								leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: item.icon,
									size: 24
								}, null, 8, ["name"])]),
								_: 2
							}, 1032, [
								"title",
								"meta",
								"onActivate"
							]))], 64);
						}), 128)),
						actions.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 5 }, [(0, vue_exports.createVNode)("p", { class: "adm-more__caption" }, "Neu anlegen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(actions.value, (action) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
								key: action.key,
								title: action.label,
								href: action.href
							}, {
								leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: action.icon,
									size: 24
								}, null, 8, ["name"])]),
								_: 2
							}, 1032, ["title", "href"]);
						}), 128))], 64)) : (0, vue_exports.createCommentVNode)("", true),
						account.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 6,
							class: "adm-more__account"
						}, [(0, vue_exports.createVNode)("span", {
							class: "adm-avatar",
							"aria-hidden": "true"
						}, (0, vue_exports.toDisplayString)(initials.value), 1), (0, vue_exports.createVNode)("span", null, [(0, vue_exports.createVNode)("span", { class: "adm-more__name" }, (0, vue_exports.toDisplayString)(account.value.name), 1), (0, vue_exports.createVNode)("span", { class: "adm-more__role" }, (0, vue_exports.toDisplayString)(account.value.role ?? account.value.email), 1)])])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)(ListRow_default, {
							title: "Profil",
							href: "/admin/profil"
						}, {
							leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "users",
								size: 24
							})]),
							_: 1
						}),
						(0, vue_exports.createVNode)(ListRow_default, {
							title: "Benachrichtigungen",
							href: "/admin/benachrichtigungen"
						}, {
							leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "bell",
								size: 24
							})]),
							_: 1
						}),
						(0, vue_exports.createVNode)(ListRow_default, {
							title: "Passwort ändern",
							href: "/admin/profil#passwort"
						}, {
							leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "shield",
								size: 24
							})]),
							_: 1
						}),
						(0, vue_exports.createVNode)(ListRow_default, {
							class: "adm-more__signout",
							title: signingOut.value ? "Wird abgemeldet …" : "Abmelden",
							chevron: false,
							disabled: signingOut.value,
							onActivate: signOut
						}, {
							leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "logout",
								size: 24
							})]),
							_: 1
						}, 8, ["title", "disabled"])
					])];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
				id: "admin-mehr-gruppe",
				open: groupOpen.value,
				"onUpdate:open": ($event) => groupOpen.value = $event,
				title: shownGroup.value?.label ?? ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="adm-more"${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(shownGroup.value?.pages ?? [], (page) => {
							_push((0, server_renderer_exports.ssrRenderComponent)(ListRow_default, {
								key: page.href,
								title: page.label,
								meta: pageCount(page),
								href: page.href
							}, {
								leading: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: page.icon,
										size: 24
									}, null, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: page.icon,
										size: 24
									}, null, 8, ["name"])];
								}),
								_: 2
							}, _parent, _scopeId));
						});
						_push(`<!--]--></div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "adm-more" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(shownGroup.value?.pages ?? [], (page) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ListRow_default, {
							key: page.href,
							title: page.label,
							meta: pageCount(page),
							href: page.href
						}, {
							leading: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: page.icon,
								size: 24
							}, null, 8, ["name"])]),
							_: 2
						}, 1032, [
							"title",
							"meta",
							"href"
						]);
					}), 128))])];
				}),
				_: 1
			}, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminMoreSheet.vue
var _sfc_setup$12 = AdminMoreSheet_vue_vue_type_script_setup_true_lang_default.setup;
AdminMoreSheet_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminMoreSheet.vue");
	return _sfc_setup$12 ? _sfc_setup$12(props, ctx) : void 0;
};
var AdminMoreSheet_default = AdminMoreSheet_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/composables/admin/currentPage.ts
/**
* Whether a rail page is where the reader is. A page is current on its own path and on every record
* beneath it — /admin/seiten/7 is still Seiten — so the rail, the tab bar and the palette keep their
* place while one record is open. Übersicht is /admin itself and nothing below it, or it would be
* current everywhere.
*/
function isCurrentPage(href, path, others = []) {
	if (href === "/admin") return path === "/admin" || BENEATH_UEBERSICHT.includes(path);
	if (!(href === path || path.startsWith(`${href}/`))) return false;
	return !others.some((other) => other !== href && other.startsWith(`${href}/`) && (other === path || path.startsWith(`${other}/`)));
}
/**
* Pages beneath the Übersicht that are not on the rail (AdminNavigation::BENEATH_UEBERSICHT): while
* one is open, the Übersicht is where the reader is — its crumb says „Übersicht › Nachfrage“ too.
*/
var BENEATH_UEBERSICHT = ["/admin/nachfrage"];
//#endregion
//#region resources/js/Components/Admin/AdminBottomBar.vue?vue&type=script&setup=true&lang.ts
var AdminBottomBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminBottomBar",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The phone's bottom bar (admin-shell.md §11.2, shell-build-plan.md): Übersicht, the first two
		* groups this role has a built page in — in the rail's order — then Suche and Mehr. So the bar
		* always has five, and Bestellungen takes the second slot by itself once its page exists.
		*
		* Suche opens the same palette as ⌘K, as a full-screen sheet. Mehr holds everything else, and the
		* account. The bar never hides on scroll; it steps aside only for the on-screen keyboard.
		*/
		const admin = useAdmin();
		useAdminShell();
		const page = usePage();
		const path = (0, vue_exports.computed)(() => {
			const url = page.url.replace(/[?#].*$/, "");
			return url.length > 1 ? url.replace(/\/$/, "") : url;
		});
		/** The groups that get a slot of their own; everything else is in Mehr. */
		const slots = (0, vue_exports.computed)(() => admin.value.nav.filter((g) => g.key !== "uebersicht").slice(0, 2));
		function count(group) {
			const value = group.pages.reduce((sum, p) => sum + (p.count ?? 0), 0);
			return value > 0 ? {
				value,
				bad: group.pages.some((p) => p.count && p.countTone === "bad")
			} : null;
		}
		function inGroup(group) {
			return group.pages.some((p) => isCurrentPage(p.href, path.value));
		}
		const moreOpen = (0, vue_exports.ref)(false);
		/** Pages reached from the app bar rather than from Mehr: being on one is not being in Mehr. */
		const OUTSIDE_MORE = [
			"/admin",
			...BENEATH_UEBERSICHT,
			"/admin/benachrichtigungen"
		];
		/** Mehr is where you are when the page is one of its own. */
		const inMore = (0, vue_exports.computed)(() => !OUTSIDE_MORE.includes(path.value) && !slots.value.some(inGroup));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><nav class="adm-tabbar" aria-label="Hauptnavigation">`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/admin",
				class: "adm-tabbar__item",
				"aria-current": path.value === "/admin" ? "page" : void 0
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "overview",
							size: 24
						}, null, _parent, _scopeId));
						_push(`<span class="adm-tabbar__label"${_scopeId}>Übersicht</span>`);
					} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "overview",
						size: 24
					}), (0, vue_exports.createVNode)("span", { class: "adm-tabbar__label" }, "Übersicht")];
				}),
				_: 1
			}, _parent));
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(slots.value, (group) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: group.key,
					href: group.pages[0]?.href ?? "/admin",
					class: "adm-tabbar__item",
					"aria-current": inGroup(group) ? "page" : void 0,
					"aria-label": count(group) ? `${group.label}, ${count(group)?.value} offen` : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<span class="adm-tabbar__icon"${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: group.icon,
								size: 24
							}, null, _parent, _scopeId));
							if (count(group)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-tabbar__badge--bad": count(group)?.bad }, "adm-tabbar__badge"])}" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((count(group)?.value ?? 0) > 99 ? "99+" : count(group)?.value)}</span>`);
							else _push(`<!---->`);
							_push(`</span><span class="adm-tabbar__label"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</span>`);
						} else return [(0, vue_exports.createVNode)("span", { class: "adm-tabbar__icon" }, [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: group.icon,
							size: 24
						}, null, 8, ["name"]), count(group) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: ["adm-tabbar__badge", { "adm-tabbar__badge--bad": count(group)?.bad }],
							"aria-hidden": "true"
						}, (0, vue_exports.toDisplayString)((count(group)?.value ?? 0) > 99 ? "99+" : count(group)?.value), 3)) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("span", { class: "adm-tabbar__label" }, (0, vue_exports.toDisplayString)(group.label), 1)];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--><button class="adm-tabbar__item" type="button">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "search",
				size: 24
			}, null, _parent));
			_push(`<span class="adm-tabbar__label">Suche</span></button><button class="adm-tabbar__item" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", inMore.value ? "page" : void 0)} aria-haspopup="dialog">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "menu",
				size: 24
			}, null, _parent));
			_push(`<span class="adm-tabbar__label">Mehr</span></button></nav>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminMoreSheet_default, {
				open: moreOpen.value,
				"onUpdate:open": ($event) => moreOpen.value = $event,
				exclude: slots.value.filter((g) => g.pages.length === 1).map((g) => g.key)
			}, null, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminBottomBar.vue
var _sfc_setup$11 = AdminBottomBar_vue_vue_type_script_setup_true_lang_default.setup;
AdminBottomBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminBottomBar.vue");
	return _sfc_setup$11 ? _sfc_setup$11(props, ctx) : void 0;
};
var AdminBottomBar_default = AdminBottomBar_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminHealthBanner.vue?vue&type=script&setup=true&lang.ts
var AdminHealthBanner_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminHealthBanner",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The one system problem worth a banner across the top of every page, not only the rail's quiet line:
		* the shop in maintenance mode, a queue that has not moved for an hour, or a scheduler silent for an hour —
		* unpaid orders then keep their stock for good (SystemHealth::urgent).
		*
		* It cannot be dismissed — a problem hidden for good is how a dead queue goes unnoticed. „Später
		* erinnern“ keeps it away for 8 hours, saved on the account so it does not flash up on the next page
		* (the server leaves it out of the first frame). While it shows, the rail's line about the same
		* problem stays away; put off, the line comes back and reminds (useHealthBanner). The link leads to
		* System › Zustand, which explains it and retries.
		*/
		const admin = useAdmin();
		const banner = useHealthBanner();
		const href = (0, vue_exports.computed)(() => admin.value.health?.href ?? null);
		const tone = (0, vue_exports.computed)(() => banner.value?.key === "maintenance" ? "bad" : "warn");
		return (_ctx, _push, _parent, _attrs) => {
			if ((0, vue_exports.unref)(banner)) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: ["adm-banner", `adm-banner--${tone.value}`],
					role: "alert"
				}, _attrs))}><span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-health__dot--${tone.value}`, "adm-health__dot"])}" aria-hidden="true"></span><p class="adm-banner__text">${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(banner).sentence)}</p><span class="adm-banner__actions">`);
				if (href.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: href.value,
					class: "btn btn--secondary btn--sm"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zum Systemzustand`);
						else return [(0, vue_exports.createTextVNode)("Zum Systemzustand")];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				_push(`<button class="btn btn--ghost btn--sm" type="button">Später erinnern</button></span></div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminHealthBanner.vue
var _sfc_setup$10 = AdminHealthBanner_vue_vue_type_script_setup_true_lang_default.setup;
AdminHealthBanner_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminHealthBanner.vue");
	return _sfc_setup$10 ? _sfc_setup$10(props, ctx) : void 0;
};
var AdminHealthBanner_default = AdminHealthBanner_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/sectionTabs.ts
/**
* Einstellungen › Zubehörpreise: what the extras on a Komplettrad cost. The page's `<h1>` is the
* rail item's name; the tabs name only what differs, so the heading is never said twice.
*/
var ZUBEHOER_TABS = [{
	label: "Wuchtgewichte",
	href: "/admin/zubehoerpreise/wuchtgewichte"
}, {
	label: "RDKS-Sensoren",
	href: "/admin/zubehoerpreise/rdks"
}];
/** The tabs behind each rail item that has them, by the item's href — so the palette finds each tab. */
var SECTION_TABS = { "/admin/zubehoerpreise": ZUBEHOER_TABS };
//#endregion
//#region resources/js/composables/admin/palette.ts
/**
* What the admin palette can find, and how it finds it — kept apart from the component so the rules
* can be tested without a dialog.
*
* Today that is the viewer's pages and a handful of actions, drawn from the tree the server already
* sent. Record groups (Bestellungen, Kunden, Felgen …) arrive with the pages that open a record:
* a result that leads nowhere is the dead link the brief forbids, only slower (shell-build-plan.md).
*/
var GROUP_LABEL = {
	recent: "Zuletzt geöffnet",
	goto: "Gehe zu",
	actions: "Aktionen"
};
/** Pages that are not in the rail but are the viewer's own, so they can be found and remembered. */
var OWN_PAGES = [{
	label: "Profil",
	href: "/admin/profil",
	icon: "users",
	keywords: "konto account"
}, {
	label: "Benachrichtigungen",
	href: "/admin/benachrichtigungen",
	icon: "bell",
	keywords: "glocke hinweise meldungen ungelesen"
}];
/** Lowercase, accents dropped, ß as ss — what a query is reduced to. */
function normalise(value) {
	return value.toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/\p{M}/gu, "");
}
/**
* Both ways a German word gets typed without its umlaut: `Übersicht` answers to `übersicht`,
* `ubersicht` and `uebersicht` alike, because a text is searched in both spellings.
*/
function spellings(value) {
	const spelled = value.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");
	return [normalise(value), normalise(spelled)];
}
/**
* Every page the viewer may open, with the group it sits in as its sub line. `shortcuts` maps an
* href to the second key of its `g` sequence, so a page that has one says so.
*/
function pageEntries(nav, shortcuts = {}) {
	const entries = [];
	for (const group of nav) for (const page of group.pages) {
		const key = shortcuts[page.href];
		entries.push({
			id: `goto:${page.href}`,
			group: "goto",
			label: page.label,
			sub: page.label === group.label ? null : group.label,
			keys: key ? ["G", key.toUpperCase()] : null,
			icon: page.icon,
			href: page.href
		});
		for (const tab of SECTION_TABS[page.href] ?? []) entries.push({
			id: `goto:${tab.href}`,
			group: "goto",
			label: tab.label,
			sub: `${group.label} › ${page.label}`,
			keys: null,
			icon: page.icon,
			href: tab.href,
			keywords: page.label
		});
	}
	for (const page of OWN_PAGES) entries.push({
		id: `goto:${page.href}`,
		group: "goto",
		label: page.label,
		sub: null,
		keys: null,
		icon: page.icon,
		href: page.href,
		keywords: page.keywords
	});
	return entries;
}
/**
* The entries matching a query, best first. Every word typed must appear somewhere in the entry;
* a label that starts with the query outranks one that merely contains it.
*/
function search(entries, query) {
	const words = normalise(query).split(/\s+/).filter(Boolean);
	if (words.length === 0) return entries;
	const scored = [];
	entries.forEach((entry, index) => {
		const labels = spellings(entry.label);
		const haystack = spellings(`${entry.label} ${entry.sub ?? ""} ${entry.keywords ?? ""}`).join(" ");
		if (!words.every((word) => haystack.includes(word))) return;
		const first = words[0] ?? "";
		const score = labels.some((l) => l.startsWith(first)) ? 0 : labels.some((l) => l.split(/[\s-]+/).some((part) => part.startsWith(first))) ? 1 : 2;
		scored.push({
			entry,
			score,
			index
		});
	});
	return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((s) => s.entry);
}
var RECENT_KEY = "rmf_admin_recent";
/**
* The storage key for one person's recent pages. Keyed by account, so two people who share a browser
* never see where the other has been; without an account the shared key is used.
*/
function recentKey(account) {
	return account ? `${RECENT_KEY}:${account.toLowerCase()}` : RECENT_KEY;
}
function readRecent(key = RECENT_KEY) {
	try {
		const raw = JSON.parse(window.localStorage.getItem(key) ?? "[]");
		if (!Array.isArray(raw)) return [];
		return raw.filter((r) => typeof r === "object" && r !== null && typeof r.href === "string" && typeof r.label === "string").slice(0, 5);
	} catch {
		return [];
	}
}
/** Puts a page at the front, once. */
function rememberRecent(page, key = RECENT_KEY) {
	const next = [page, ...readRecent(key).filter((r) => r.href !== page.href)].slice(0, 5);
	try {
		window.localStorage.setItem(key, JSON.stringify(next));
	} catch {}
}
/**
* The recent pages as entries — only those the viewer can still open (a page a role lost, or one
* removed, is dropped silently), and never the page they are on.
*/
function recentEntries(recent, pages, currentHref) {
	const byHref = new Map(pages.map((p) => [p.href, p]));
	const entries = [];
	for (const item of recent) {
		const page = byHref.get(item.href);
		if (!page || item.href === currentHref) continue;
		entries.push({
			...page,
			id: `recent:${item.href}`,
			group: "recent",
			keys: null
		});
	}
	return entries;
}
//#endregion
//#region resources/js/Components/Admin/AdminPalette.vue?vue&type=script&setup=true&lang.ts
/** Empty field: where you were, then what you can do. Typing: the pages that match, then actions. */
var AdminPalette_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminPalette",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The admin's one search (admin-shell.md §7): ⌘K, `/`, the topbar field and the phone's Suche tab
		* all open this.
		*
		* It finds the viewer's pages and a few actions, from the tree the server already sent — nothing is
		* fetched, so there is no loading state and no error state to design yet. Records join as groups
		* when the pages that open them exist; until then the copy says what is searched rather than
		* promising order numbers it cannot find.
		*
		* Focus stays in the field the whole time. The active row is pointed at with
		* `aria-activedescendant`, so a screen reader hears every move and the caret never leaves the query.
		*/
		const admin = useAdmin();
		const shell = useAdminShell();
		const { paletteOpen } = shell;
		const page = usePage();
		const query = (0, vue_exports.ref)("");
		const active = (0, vue_exports.ref)(0);
		const recent = (0, vue_exports.ref)([]);
		const wide = (0, vue_exports.ref)(true);
		/** A keyboard to press shortcuts on; a phone has none, so it is offered neither the list nor the chips. */
		const keyboard = (0, vue_exports.ref)(true);
		const path = (0, vue_exports.computed)(() => {
			const url = page.url.replace(/[?#].*$/, "");
			return url.length > 1 ? url.replace(/\/$/, "") : url;
		});
		/** Recent pages are the signed-in person's own: two people sharing a browser do not see each other's. */
		const accountKey = (0, vue_exports.computed)(() => recentKey(admin.value.account?.email ?? null));
		const pages = (0, vue_exports.computed)(() => pageEntries(admin.value.nav, Object.fromEntries(goTargets(admin.value.nav).map((t) => [t.href, t.key]))));
		function signOut() {
			router.post("/admin/abmelden");
		}
		/** Only what works today (shell-build-plan.md). The rail toggle only where the rail can be toggled. */
		const actions = (0, vue_exports.computed)(() => {
			const collapsed = shell.railCollapsed.value;
			const list = admin.value.quickActions.map((action) => ({
				id: `action:new:${action.key}`,
				group: "actions",
				label: action.label,
				sub: "Neu",
				keys: null,
				icon: action.icon,
				href: action.href,
				keywords: "neu anlegen erstellen"
			}));
			if (wide.value) list.push({
				id: "action:rail",
				group: "actions",
				label: collapsed ? "Seitenleiste ausklappen" : "Seitenleiste einklappen",
				sub: null,
				keys: ["["],
				icon: collapsed ? "chevron-right" : "chevron-left",
				run: shell.toggleRail,
				keywords: "navigation menue"
			});
			if (keyboard.value) list.push({
				id: "action:keys",
				group: "actions",
				label: "Tastenkürzel anzeigen",
				sub: null,
				keys: ["?"],
				icon: "keyboard",
				run: () => shell.shortcutsOpen.value = true,
				keywords: "tastatur hilfe"
			});
			list.push({
				id: "action:password",
				group: "actions",
				label: "Passwort ändern",
				sub: "Profil",
				keys: null,
				icon: "shield",
				href: "/admin/profil#passwort",
				keywords: "kennwort"
			}, {
				id: "action:logout",
				group: "actions",
				label: "Abmelden",
				sub: null,
				keys: null,
				icon: "logout",
				run: signOut,
				keywords: "ausloggen"
			});
			return list;
		});
		const sections = (0, vue_exports.computed)(() => {
			const q = query.value.trim();
			return (q ? [{
				group: "goto",
				entries: search(pages.value, q)
			}, {
				group: "actions",
				entries: search(actions.value, q)
			}] : [{
				group: "recent",
				entries: recentEntries(recent.value, pages.value, path.value)
			}, {
				group: "actions",
				entries: actions.value
			}]).filter((s) => s.entries.length > 0);
		});
		/** One flat index across every group — the arrows move through it and wrap at the ends. */
		const flat = (0, vue_exports.computed)(() => sections.value.flatMap((s) => s.entries));
		const indexOf = (0, vue_exports.computed)(() => new Map(flat.value.map((entry, index) => [entry.id, index])));
		function optionId(index) {
			return `adm-pal-${index}`;
		}
		(0, vue_exports.watch)(query, () => active.value = 0);
		(0, vue_exports.watch)(active, async (index) => {
			await (0, vue_exports.nextTick)();
			document.getElementById(optionId(index))?.scrollIntoView({ block: "nearest" });
		});
		let closedByHistory = false;
		let tookHistory = false;
		const history = useSheetHistory("admin-palette", () => {
			closedByHistory = true;
			paletteOpen.value = false;
		});
		const unregister = hasMobileShell() ? useMobileShell().registerSheet(() => {
			if (paletteOpen.value) {
				closedByHistory = true;
				paletteOpen.value = false;
			}
		}) : () => void 0;
		(0, vue_exports.onBeforeUnmount)(unregister);
		(0, vue_exports.watch)(paletteOpen, (open) => {
			if (open) {
				query.value = "";
				active.value = 0;
				recent.value = readRecent(accountKey.value);
				wide.value = window.matchMedia("(min-width: 1024px)").matches;
				keyboard.value = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
				tookHistory = window.matchMedia("(max-width: 767px)").matches;
				if (tookHistory) history.open();
				return;
			}
			if (closedByHistory || !tookHistory) {
				closedByHistory = false;
				return;
			}
			history.close();
		});
		function choose(entry, newTab = false) {
			if (entry.href && newTab) {
				window.open(entry.href, "_blank", "noopener");
				return;
			}
			if (entry.href) {
				closedByHistory = true;
				paletteOpen.value = false;
				router.visit(entry.href);
				return;
			}
			paletteOpen.value = false;
			(0, vue_exports.nextTick)(() => entry.run?.());
		}
		function onKeydown(event) {
			const count = flat.value.length;
			if (count === 0) return;
			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					active.value = (active.value + 1) % count;
					break;
				case "ArrowUp":
					event.preventDefault();
					active.value = (active.value - 1 + count) % count;
					break;
				case "Home":
					event.preventDefault();
					active.value = 0;
					break;
				case "End":
					event.preventDefault();
					active.value = count - 1;
					break;
				case "Enter": {
					event.preventDefault();
					const entry = flat.value[active.value];
					if (entry) choose(entry, event.metaKey || event.ctrlKey);
					break;
				}
			}
		}
		function remember() {
			const entry = pages.value.find((p) => p.href === path.value);
			if (entry?.href) rememberRecent({
				href: entry.href,
				label: entry.label
			}, accountKey.value);
		}
		(0, vue_exports.onMounted)(() => {
			remember();
			(0, vue_exports.watch)(path, remember);
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogRoot_default), (0, vue_exports.mergeProps)({
				open: (0, vue_exports.unref)(paletteOpen),
				"onUpdate:open": ($event) => (0, vue_exports.isRef)(paletteOpen) ? paletteOpen.value = $event : null
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay adm-palette__scrim" }, null, _parent, _scopeId));
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogContent_default), { class: "adm-palette" }, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`Suche`);
													else return [(0, vue_exports.createTextVNode)("Suche")];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogDescription_default), { class: "visually-hidden" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(` Seiten und Aktionen durchsuchen. Mit den Pfeiltasten wählen, mit Enter öffnen. `);
													else return [(0, vue_exports.createTextVNode)(" Seiten und Aktionen durchsuchen. Mit den Pfeiltasten wählen, mit Enter öffnen. ")];
												}),
												_: 1
											}, _parent, _scopeId));
											_push(`<div class="adm-palette__field"${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "search",
												size: 20
											}, null, _parent, _scopeId));
											_push(`<input${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="adm-palette__input" type="text" role="combobox" aria-label="Suchbegriff" aria-autocomplete="list"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", flat.value.length ? "true" : "false")}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", flat.value.length ? "adm-palette-list" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-activedescendant", flat.value.length ? optionId(active.value) : void 0)} placeholder="Seite oder Aktion suchen" autocomplete="off" spellcheck="false" enterkeyhint="go"${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogClose_default), { class: "adm-palette__cancel" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`Abbrechen`);
													else return [(0, vue_exports.createTextVNode)("Abbrechen")];
												}),
												_: 1
											}, _parent, _scopeId));
											_push(`</div>`);
											if (flat.value.length) {
												_push(`<div id="adm-palette-list" class="adm-palette__results" role="listbox" aria-label="Ergebnisse"${_scopeId}><!--[-->`);
												(0, server_renderer_exports.ssrRenderList)(sections.value, (section) => {
													_push(`<div class="adm-palette__group" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `adm-pal-h-${section.group}`)}${_scopeId}><p${(0, server_renderer_exports.ssrRenderAttr)("id", `adm-pal-h-${section.group}`)} class="adm-palette__heading" role="presentation"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(GROUP_LABEL)[section.group])}</p><!--[-->`);
													(0, server_renderer_exports.ssrRenderList)(section.entries, (entry) => {
														_push(`<div${(0, server_renderer_exports.ssrRenderAttr)("id", optionId(indexOf.value.get(entry.id) ?? 0))} class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-palette__row--two": entry.sub }, "adm-palette__row"])}" role="option"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", indexOf.value.get(entry.id) === active.value ? "true" : "false")}${_scopeId}>`);
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: entry.icon,
															size: 20
														}, null, _parent, _scopeId));
														_push(`<span class="adm-palette__text"${_scopeId}><span class="adm-palette__key"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</span>`);
														if (entry.sub) _push(`<span class="adm-palette__sub"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.sub)}</span>`);
														else _push(`<!---->`);
														_push(`</span>`);
														if (entry.keys && keyboard.value) {
															_push(`<span class="adm-palette__meta"${_scopeId}>`);
															_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: entry.keys }, null, _parent, _scopeId));
															_push(`</span>`);
														} else _push(`<!---->`);
														_push(`</div>`);
													});
													_push(`<!--]--></div>`);
												});
												_push(`<!--]--></div>`);
											} else _push(`<div class="adm-palette__results adm-palette__none" role="status"${_scopeId}><p class="adm-palette__none-title"${_scopeId}>Keine Treffer für „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“.</p><p class="adm-palette__none-hint"${_scopeId}>Gesucht wird in allen Seiten und Aktionen, die du öffnen darfst.</p></div>`);
											_push(`<div class="adm-palette__foot" aria-hidden="true"${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↑", "↓"] }, null, _parent, _scopeId));
											_push(` wählen · `);
											_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["Enter"] }, null, _parent, _scopeId));
											_push(` öffnen · `);
											_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["Esc"] }, null, _parent, _scopeId));
											_push(` schließen </div>`);
										} else return [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Suche")]),
												_: 1
											}),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogDescription_default), { class: "visually-hidden" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Seiten und Aktionen durchsuchen. Mit den Pfeiltasten wählen, mit Enter öffnen. ")]),
												_: 1
											}),
											(0, vue_exports.createVNode)("div", { class: "adm-palette__field" }, [
												(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "search",
													size: 20
												}),
												(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
													"onUpdate:modelValue": ($event) => query.value = $event,
													class: "adm-palette__input",
													type: "text",
													role: "combobox",
													"aria-label": "Suchbegriff",
													"aria-autocomplete": "list",
													"aria-expanded": flat.value.length ? "true" : "false",
													"aria-controls": flat.value.length ? "adm-palette-list" : void 0,
													"aria-activedescendant": flat.value.length ? optionId(active.value) : void 0,
													placeholder: "Seite oder Aktion suchen",
													autocomplete: "off",
													spellcheck: "false",
													enterkeyhint: "go",
													onKeydown
												}, null, 40, [
													"onUpdate:modelValue",
													"aria-expanded",
													"aria-controls",
													"aria-activedescendant"
												]), [[vue_exports.vModelText, query.value]]),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), { class: "adm-palette__cancel" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Abbrechen")]),
													_: 1
												})
											]),
											flat.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
												key: 0,
												id: "adm-palette-list",
												class: "adm-palette__results",
												role: "listbox",
												"aria-label": "Ergebnisse"
											}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sections.value, (section) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
													key: section.group,
													class: "adm-palette__group",
													role: "group",
													"aria-labelledby": `adm-pal-h-${section.group}`
												}, [(0, vue_exports.createVNode)("p", {
													id: `adm-pal-h-${section.group}`,
													class: "adm-palette__heading",
													role: "presentation"
												}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(GROUP_LABEL)[section.group]), 9, ["id"]), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(section.entries, (entry) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
														id: optionId(indexOf.value.get(entry.id) ?? 0),
														key: entry.id,
														class: ["adm-palette__row", { "adm-palette__row--two": entry.sub }],
														role: "option",
														"aria-selected": indexOf.value.get(entry.id) === active.value ? "true" : "false",
														onClick: ($event) => choose(entry, $event.metaKey || $event.ctrlKey)
													}, [
														(0, vue_exports.createVNode)(AdminIcon_default, {
															name: entry.icon,
															size: 20
														}, null, 8, ["name"]),
														(0, vue_exports.createVNode)("span", { class: "adm-palette__text" }, [(0, vue_exports.createVNode)("span", { class: "adm-palette__key" }, (0, vue_exports.toDisplayString)(entry.label), 1), entry.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
															key: 0,
															class: "adm-palette__sub"
														}, (0, vue_exports.toDisplayString)(entry.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
														entry.keys && keyboard.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
															key: 0,
															class: "adm-palette__meta"
														}, [(0, vue_exports.createVNode)(Kbd_default, { keys: entry.keys }, null, 8, ["keys"])])) : (0, vue_exports.createCommentVNode)("", true)
													], 10, [
														"id",
														"aria-selected",
														"onClick"
													]);
												}), 128))], 8, ["aria-labelledby"]);
											}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
												key: 1,
												class: "adm-palette__results adm-palette__none",
												role: "status"
											}, [(0, vue_exports.createVNode)("p", { class: "adm-palette__none-title" }, "Keine Treffer für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“.", 1), (0, vue_exports.createVNode)("p", { class: "adm-palette__none-hint" }, "Gesucht wird in allen Seiten und Aktionen, die du öffnen darfst.")])),
											(0, vue_exports.createVNode)("div", {
												class: "adm-palette__foot",
												"aria-hidden": "true"
											}, [
												(0, vue_exports.createVNode)(Kbd_default, { keys: ["↑", "↓"] }),
												(0, vue_exports.createTextVNode)(" wählen · "),
												(0, vue_exports.createVNode)(Kbd_default, { keys: ["Enter"] }),
												(0, vue_exports.createTextVNode)(" öffnen · "),
												(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] }),
												(0, vue_exports.createTextVNode)(" schließen ")
											])
										];
									}),
									_: 1
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay adm-palette__scrim" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), { class: "adm-palette" }, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Suche")]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogDescription_default), { class: "visually-hidden" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Seiten und Aktionen durchsuchen. Mit den Pfeiltasten wählen, mit Enter öffnen. ")]),
										_: 1
									}),
									(0, vue_exports.createVNode)("div", { class: "adm-palette__field" }, [
										(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "search",
											size: 20
										}),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => query.value = $event,
											class: "adm-palette__input",
											type: "text",
											role: "combobox",
											"aria-label": "Suchbegriff",
											"aria-autocomplete": "list",
											"aria-expanded": flat.value.length ? "true" : "false",
											"aria-controls": flat.value.length ? "adm-palette-list" : void 0,
											"aria-activedescendant": flat.value.length ? optionId(active.value) : void 0,
											placeholder: "Seite oder Aktion suchen",
											autocomplete: "off",
											spellcheck: "false",
											enterkeyhint: "go",
											onKeydown
										}, null, 40, [
											"onUpdate:modelValue",
											"aria-expanded",
											"aria-controls",
											"aria-activedescendant"
										]), [[vue_exports.vModelText, query.value]]),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), { class: "adm-palette__cancel" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Abbrechen")]),
											_: 1
										})
									]),
									flat.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										id: "adm-palette-list",
										class: "adm-palette__results",
										role: "listbox",
										"aria-label": "Ergebnisse"
									}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sections.value, (section) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											key: section.group,
											class: "adm-palette__group",
											role: "group",
											"aria-labelledby": `adm-pal-h-${section.group}`
										}, [(0, vue_exports.createVNode)("p", {
											id: `adm-pal-h-${section.group}`,
											class: "adm-palette__heading",
											role: "presentation"
										}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(GROUP_LABEL)[section.group]), 9, ["id"]), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(section.entries, (entry) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
												id: optionId(indexOf.value.get(entry.id) ?? 0),
												key: entry.id,
												class: ["adm-palette__row", { "adm-palette__row--two": entry.sub }],
												role: "option",
												"aria-selected": indexOf.value.get(entry.id) === active.value ? "true" : "false",
												onClick: ($event) => choose(entry, $event.metaKey || $event.ctrlKey)
											}, [
												(0, vue_exports.createVNode)(AdminIcon_default, {
													name: entry.icon,
													size: 20
												}, null, 8, ["name"]),
												(0, vue_exports.createVNode)("span", { class: "adm-palette__text" }, [(0, vue_exports.createVNode)("span", { class: "adm-palette__key" }, (0, vue_exports.toDisplayString)(entry.label), 1), entry.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 0,
													class: "adm-palette__sub"
												}, (0, vue_exports.toDisplayString)(entry.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
												entry.keys && keyboard.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 0,
													class: "adm-palette__meta"
												}, [(0, vue_exports.createVNode)(Kbd_default, { keys: entry.keys }, null, 8, ["keys"])])) : (0, vue_exports.createCommentVNode)("", true)
											], 10, [
												"id",
												"aria-selected",
												"onClick"
											]);
										}), 128))], 8, ["aria-labelledby"]);
									}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 1,
										class: "adm-palette__results adm-palette__none",
										role: "status"
									}, [(0, vue_exports.createVNode)("p", { class: "adm-palette__none-title" }, "Keine Treffer für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“.", 1), (0, vue_exports.createVNode)("p", { class: "adm-palette__none-hint" }, "Gesucht wird in allen Seiten und Aktionen, die du öffnen darfst.")])),
									(0, vue_exports.createVNode)("div", {
										class: "adm-palette__foot",
										"aria-hidden": "true"
									}, [
										(0, vue_exports.createVNode)(Kbd_default, { keys: ["↑", "↓"] }),
										(0, vue_exports.createTextVNode)(" wählen · "),
										(0, vue_exports.createVNode)(Kbd_default, { keys: ["Enter"] }),
										(0, vue_exports.createTextVNode)(" öffnen · "),
										(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] }),
										(0, vue_exports.createTextVNode)(" schließen ")
									])
								]),
								_: 1
							})];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay adm-palette__scrim" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), { class: "adm-palette" }, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "visually-hidden" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Suche")]),
									_: 1
								}),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogDescription_default), { class: "visually-hidden" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Seiten und Aktionen durchsuchen. Mit den Pfeiltasten wählen, mit Enter öffnen. ")]),
									_: 1
								}),
								(0, vue_exports.createVNode)("div", { class: "adm-palette__field" }, [
									(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "search",
										size: 20
									}),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										"onUpdate:modelValue": ($event) => query.value = $event,
										class: "adm-palette__input",
										type: "text",
										role: "combobox",
										"aria-label": "Suchbegriff",
										"aria-autocomplete": "list",
										"aria-expanded": flat.value.length ? "true" : "false",
										"aria-controls": flat.value.length ? "adm-palette-list" : void 0,
										"aria-activedescendant": flat.value.length ? optionId(active.value) : void 0,
										placeholder: "Seite oder Aktion suchen",
										autocomplete: "off",
										spellcheck: "false",
										enterkeyhint: "go",
										onKeydown
									}, null, 40, [
										"onUpdate:modelValue",
										"aria-expanded",
										"aria-controls",
										"aria-activedescendant"
									]), [[vue_exports.vModelText, query.value]]),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), { class: "adm-palette__cancel" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Abbrechen")]),
										_: 1
									})
								]),
								flat.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									id: "adm-palette-list",
									class: "adm-palette__results",
									role: "listbox",
									"aria-label": "Ergebnisse"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sections.value, (section) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: section.group,
										class: "adm-palette__group",
										role: "group",
										"aria-labelledby": `adm-pal-h-${section.group}`
									}, [(0, vue_exports.createVNode)("p", {
										id: `adm-pal-h-${section.group}`,
										class: "adm-palette__heading",
										role: "presentation"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(GROUP_LABEL)[section.group]), 9, ["id"]), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(section.entries, (entry) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											id: optionId(indexOf.value.get(entry.id) ?? 0),
											key: entry.id,
											class: ["adm-palette__row", { "adm-palette__row--two": entry.sub }],
											role: "option",
											"aria-selected": indexOf.value.get(entry.id) === active.value ? "true" : "false",
											onClick: ($event) => choose(entry, $event.metaKey || $event.ctrlKey)
										}, [
											(0, vue_exports.createVNode)(AdminIcon_default, {
												name: entry.icon,
												size: 20
											}, null, 8, ["name"]),
											(0, vue_exports.createVNode)("span", { class: "adm-palette__text" }, [(0, vue_exports.createVNode)("span", { class: "adm-palette__key" }, (0, vue_exports.toDisplayString)(entry.label), 1), entry.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "adm-palette__sub"
											}, (0, vue_exports.toDisplayString)(entry.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
											entry.keys && keyboard.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "adm-palette__meta"
											}, [(0, vue_exports.createVNode)(Kbd_default, { keys: entry.keys }, null, 8, ["keys"])])) : (0, vue_exports.createCommentVNode)("", true)
										], 10, [
											"id",
											"aria-selected",
											"onClick"
										]);
									}), 128))], 8, ["aria-labelledby"]);
								}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "adm-palette__results adm-palette__none",
									role: "status"
								}, [(0, vue_exports.createVNode)("p", { class: "adm-palette__none-title" }, "Keine Treffer für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“.", 1), (0, vue_exports.createVNode)("p", { class: "adm-palette__none-hint" }, "Gesucht wird in allen Seiten und Aktionen, die du öffnen darfst.")])),
								(0, vue_exports.createVNode)("div", {
									class: "adm-palette__foot",
									"aria-hidden": "true"
								}, [
									(0, vue_exports.createVNode)(Kbd_default, { keys: ["↑", "↓"] }),
									(0, vue_exports.createTextVNode)(" wählen · "),
									(0, vue_exports.createVNode)(Kbd_default, { keys: ["Enter"] }),
									(0, vue_exports.createTextVNode)(" öffnen · "),
									(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] }),
									(0, vue_exports.createTextVNode)(" schließen ")
								])
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
//#region resources/js/Components/Admin/AdminPalette.vue
var _sfc_setup$9 = AdminPalette_vue_vue_type_script_setup_true_lang_default.setup;
AdminPalette_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminPalette.vue");
	return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var AdminPalette_default = AdminPalette_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminMenuTip.vue?vue&type=script&setup=true&lang.ts
var AdminMenuTip_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminMenuTip",
	__ssrInlineRender: true,
	props: {
		text: {},
		disabled: { type: Boolean }
	},
	setup(__props) {
		/**
		* A tooltip for a control that also opens a menu — „Neu“ and the account row in the rail's foot.
		*
		* reka's tooltip and menu both anchor through the nearest popper: one element that is the trigger of
		* both hands the menu's anchor to the tooltip, and the menu opens nowhere (off the screen, never
		* positioned). So the tooltip's trigger is a box-less wrapper (`display: contents`) around the menu's
		* own trigger, positioned on the control inside it (`reference`), and opened by the pointer as any
		* tooltip is — and by focus reaching the control, since a wrapper is never focused itself.
		*/
		const props = __props;
		const open = (0, vue_exports.ref)(false);
		const wrapper = (0, vue_exports.ref)(null);
		const control = (0, vue_exports.computed)(() => (wrapper.value?.$el)?.firstElementChild ?? void 0);
		(0, vue_exports.watch)(() => props.disabled, (disabled) => {
			if (disabled) open.value = false;
		});
		function onFocusIn(event) {
			open.value = !props.disabled && event.target.matches(":focus-visible");
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipRoot_default), (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				disabled: __props.disabled
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipTrigger_default), {
							ref_key: "wrapper",
							ref: wrapper,
							as: "span",
							class: "adm-menutip",
							reference: control.value,
							onFocusin: onFocusIn,
							onFocusout: ($event) => open.value = false
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) (0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent, _scopeId);
								else return [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, void 0, true)];
							}),
							_: 3
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.text)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.text), 1)];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.text), 1)]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), {
						ref_key: "wrapper",
						ref: wrapper,
						as: "span",
						class: "adm-menutip",
						reference: control.value,
						onFocusin: onFocusIn,
						onFocusout: ($event) => open.value = false
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, void 0, true)]),
						_: 3
					}, 8, ["reference", "onFocusout"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
							class: "adm-tooltip",
							side: "right",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.text), 1)]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 3
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminMenuTip.vue
var _sfc_setup$8 = AdminMenuTip_vue_vue_type_script_setup_true_lang_default.setup;
AdminMenuTip_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminMenuTip.vue");
	return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var AdminMenuTip_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AdminMenuTip_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-192a6579"]]);
//#endregion
//#region resources/js/Components/Admin/AdminRailFoot.vue?vue&type=script&setup=true&lang.ts
var AdminRailFoot_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminRailFoot",
	__ssrInlineRender: true,
	props: { collapsed: { type: Boolean } },
	setup(__props) {
		/**
		* The rail's foot: how the shop is, what you can make, and who you are — fixed at the bottom of the
		* rail under a hairline, never scrolling with the navigation above it.
		*
		*   0. Demodaten — only while demo rows exist (DemoTables), in the warning colour, so whoever opens
		*      the admin next knows what the figures are made of. Who may take them away (DemoDataPolicy)
		*      reads „Demodaten entfernen · 1.412 Datensätze“ and, beneath it, that only the example data
		*      goes; it asks first (AdminConfirm), then takes exactly the demo rows away, recorded in the
		*      Protokoll — or, when they cannot go now, says why instead (AdminDemoBlocked). Everyone else
		*      reads „Demodaten aktiv · 1.412 Datensätze“.
		*   1. Systemzustand — only when something is wrong: an empty foot is the healthy state. One quiet
		*      line of 32 px: the dot carries the colour, then a short label and a count in it („Warteschlange
		*      stockt · 12 Std“), the whole sentence in the tooltip. No way to dismiss it — a problem hidden
		*      is how a dead queue goes unnoticed — and it opens System › Zustand, which explains and retries.
		*      Collapsed, it is the dot alone, named by its tooltip. Polled every minute.
		*   2. „Neu“ — the quick actions (QuickActions, the same list the palette offers), and the palette's
		*      shortcut beside it.
		*   3. The profile — monogram, name, role; its menu opens upward: Profil, Benachrichtigungen,
		*      Tastenkürzel, and Abmelden last, in the failure colour, behind a hairline.
		*
		* Every menu is reka's: arrows move, Esc closes, focus returns to the row that opened it.
		*/
		const admin = useAdmin();
		const shell = useAdminShell();
		const health = useHealth();
		const banner = useHealthBanner();
		const account = (0, vue_exports.computed)(() => admin.value.account);
		const actions = (0, vue_exports.computed)(() => admin.value.quickActions);
		const initials = (0, vue_exports.computed)(() => monogram(account.value?.name));
		const whoCut = (0, vue_exports.ref)(false);
		function measureWho(event) {
			const lines = event.currentTarget.querySelectorAll(".adm-foot__name, .adm-foot__role");
			whoCut.value = [...lines].some((line) => line.scrollWidth > line.clientWidth);
		}
		const { demo, rows: demoRows, note: purgeNote, body: purgeBody, blocked: purgeBlocked, confirming: confirmingPurge, purging, ask: askPurge, purge: purgeDemo } = useDemoStrip();
		const signingOut = (0, vue_exports.ref)(false);
		/** A post, not a link, and not twice: while it is in flight the row says so and refuses again. */
		function signOut(event) {
			event.preventDefault();
			if (signingOut.value) return;
			signingOut.value = true;
			router.post("/admin/abmelden", {}, { onFinish: () => signingOut.value = false });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "adm-foot" }, _attrs))}>`);
			if ((0, vue_exports.unref)(demo)) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipRoot_default), { disabled: !__props.collapsed }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<p class="adm-foot__demo"${(0, server_renderer_exports.ssrRenderAttr)("tabindex", __props.collapsed ? 0 : void 0)}${_scopeId}><span class="adm-foot__demo-dot" aria-hidden="true"${_scopeId}></span><span class="adm-foot__demo-text"${_scopeId}>`);
									if ((0, vue_exports.unref)(demo).canPurge) _push(`<!--[--><button class="adm-foot__demo-purge" type="button" aria-describedby="adm-foot-demo-note"${_scopeId}>Demodaten entfernen</button> · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(demoRows))} <span id="adm-foot-demo-note" class="adm-foot__demo-note"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(purgeNote))}</span><!--]-->`);
									else _push(`<!--[-->Demodaten aktiv · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(demoRows))}<!--]-->`);
									_push(`</span></p>`);
								} else return [(0, vue_exports.createVNode)("p", {
									class: "adm-foot__demo",
									tabindex: __props.collapsed ? 0 : void 0
								}, [(0, vue_exports.createVNode)("span", {
									class: "adm-foot__demo-dot",
									"aria-hidden": "true"
								}), (0, vue_exports.createVNode)("span", { class: "adm-foot__demo-text" }, [(0, vue_exports.unref)(demo).canPurge ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
									(0, vue_exports.createVNode)("button", {
										class: "adm-foot__demo-purge",
										type: "button",
										"aria-describedby": "adm-foot-demo-note",
										onClick: (0, vue_exports.unref)(askPurge)
									}, "Demodaten entfernen", 8, ["onClick"]),
									(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)) + " ", 1),
									(0, vue_exports.createVNode)("span", {
										id: "adm-foot-demo-note",
										class: "adm-foot__demo-note"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(purgeNote)), 1)
								], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Demodaten aktiv · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)), 1)], 64))])], 8, ["tabindex"])];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`Demodaten aktiv · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(demoRows))}`);
										else return [(0, vue_exports.createTextVNode)("Demodaten aktiv · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)), 1)];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Demodaten aktiv · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)), 1)]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("p", {
							class: "adm-foot__demo",
							tabindex: __props.collapsed ? 0 : void 0
						}, [(0, vue_exports.createVNode)("span", {
							class: "adm-foot__demo-dot",
							"aria-hidden": "true"
						}), (0, vue_exports.createVNode)("span", { class: "adm-foot__demo-text" }, [(0, vue_exports.unref)(demo).canPurge ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
							(0, vue_exports.createVNode)("button", {
								class: "adm-foot__demo-purge",
								type: "button",
								"aria-describedby": "adm-foot-demo-note",
								onClick: (0, vue_exports.unref)(askPurge)
							}, "Demodaten entfernen", 8, ["onClick"]),
							(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)) + " ", 1),
							(0, vue_exports.createVNode)("span", {
								id: "adm-foot-demo-note",
								class: "adm-foot__demo-note"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(purgeNote)), 1)
						], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Demodaten aktiv · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)), 1)], 64))])], 8, ["tabindex"])]),
						_: 1
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
							class: "adm-tooltip",
							side: "right",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Demodaten aktiv · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(demoRows)), 1)]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(demo)?.canPurge && !(0, vue_exports.unref)(purgeBlocked)) _push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: (0, vue_exports.unref)(confirmingPurge),
				"onUpdate:open": ($event) => (0, vue_exports.isRef)(confirmingPurge) ? confirmingPurge.value = $event : null,
				title: "Demodaten entfernen",
				body: (0, vue_exports.unref)(purgeBody),
				"confirm-label": "Entfernen",
				busy: (0, vue_exports.unref)(purging),
				onConfirm: (0, vue_exports.unref)(purgeDemo)
			}, null, _parent));
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(demo)?.canPurge && (0, vue_exports.unref)(purgeBlocked)) _push((0, server_renderer_exports.ssrRenderComponent)(AdminDemoBlocked_default, {
				open: (0, vue_exports.unref)(confirmingPurge),
				"onUpdate:open": ($event) => (0, vue_exports.isRef)(confirmingPurge) ? confirmingPurge.value = $event : null,
				reason: (0, vue_exports.unref)(purgeBlocked),
				"reset-href": (0, vue_exports.unref)(demo).resetHref
			}, null, _parent));
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(health) && (0, vue_exports.unref)(health).state !== "ok" && !(0, vue_exports.unref)(banner)) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipRoot_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) (0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(health).href ? (0, vue_exports.unref)(link_default) : "p"), {
									href: (0, vue_exports.unref)(health).href ?? void 0,
									class: "adm-foot__health",
									"aria-label": (0, vue_exports.unref)(health).sentence
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-health__dot--${(0, vue_exports.unref)(health).state}`, "adm-health__dot"])}" aria-hidden="true"${_scopeId}></span><span class="adm-foot__label" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(health).label)}</span>`);
											if ((0, vue_exports.unref)(health).count) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-foot__count--${(0, vue_exports.unref)(health).state}`, "adm-foot__count"])}" aria-hidden="true"${_scopeId}> · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(health).count)}</span>`);
											else _push(`<!---->`);
										} else return [
											(0, vue_exports.createVNode)("span", {
												class: ["adm-health__dot", `adm-health__dot--${(0, vue_exports.unref)(health).state}`],
												"aria-hidden": "true"
											}, null, 2),
											(0, vue_exports.createVNode)("span", {
												class: "adm-foot__label",
												"aria-hidden": "true"
											}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).label), 1),
											(0, vue_exports.unref)(health).count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: ["adm-foot__count", `adm-foot__count--${(0, vue_exports.unref)(health).state}`],
												"aria-hidden": "true"
											}, " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).count), 3)) : (0, vue_exports.createCommentVNode)("", true)
										];
									}),
									_: 1
								}), _parent, _scopeId);
								else return [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(health).href ? (0, vue_exports.unref)(link_default) : "p"), {
									href: (0, vue_exports.unref)(health).href ?? void 0,
									class: "adm-foot__health",
									"aria-label": (0, vue_exports.unref)(health).sentence
								}, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)("span", {
											class: ["adm-health__dot", `adm-health__dot--${(0, vue_exports.unref)(health).state}`],
											"aria-hidden": "true"
										}, null, 2),
										(0, vue_exports.createVNode)("span", {
											class: "adm-foot__label",
											"aria-hidden": "true"
										}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).label), 1),
										(0, vue_exports.unref)(health).count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: ["adm-foot__count", `adm-foot__count--${(0, vue_exports.unref)(health).state}`],
											"aria-hidden": "true"
										}, " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).count), 3)) : (0, vue_exports.createCommentVNode)("", true)
									]),
									_: 1
								}, 8, ["href", "aria-label"]))];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.collapsed ? `${(0, vue_exports.unref)(health).label}${(0, vue_exports.unref)(health).count ? ` · ${(0, vue_exports.unref)(health).count}` : ""}` : (0, vue_exports.unref)(health).sentence)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.collapsed ? `${(0, vue_exports.unref)(health).label}${(0, vue_exports.unref)(health).count ? ` · ${(0, vue_exports.unref)(health).count}` : ""}` : (0, vue_exports.unref)(health).sentence), 1)];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.collapsed ? `${(0, vue_exports.unref)(health).label}${(0, vue_exports.unref)(health).count ? ` · ${(0, vue_exports.unref)(health).count}` : ""}` : (0, vue_exports.unref)(health).sentence), 1)]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
						default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(health).href ? (0, vue_exports.unref)(link_default) : "p"), {
							href: (0, vue_exports.unref)(health).href ?? void 0,
							class: "adm-foot__health",
							"aria-label": (0, vue_exports.unref)(health).sentence
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("span", {
									class: ["adm-health__dot", `adm-health__dot--${(0, vue_exports.unref)(health).state}`],
									"aria-hidden": "true"
								}, null, 2),
								(0, vue_exports.createVNode)("span", {
									class: "adm-foot__label",
									"aria-hidden": "true"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).label), 1),
								(0, vue_exports.unref)(health).count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: ["adm-foot__count", `adm-foot__count--${(0, vue_exports.unref)(health).state}`],
									"aria-hidden": "true"
								}, " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(health).count), 3)) : (0, vue_exports.createCommentVNode)("", true)
							]),
							_: 1
						}, 8, ["href", "aria-label"]))]),
						_: 1
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
							class: "adm-tooltip",
							side: "right",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.collapsed ? `${(0, vue_exports.unref)(health).label}${(0, vue_exports.unref)(health).count ? ` · ${(0, vue_exports.unref)(health).count}` : ""}` : (0, vue_exports.unref)(health).sentence), 1)]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`<span class="visually-hidden" role="status">${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(health) && (0, vue_exports.unref)(health).state !== "ok" ? (0, vue_exports.unref)(health).sentence : "")}</span>`);
			if ((0, vue_exports.unref)(admin).review) _push((0, server_renderer_exports.ssrRenderComponent)(AdminMenuTip_default, {
				text: "Rückmeldung geben (R)",
				disabled: !__props.collapsed
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="adm-foot__feedback" type="button" aria-keyshortcuts="R"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(feedback).capturing ? "true" : void 0)} data-feedback-skip${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "feedback",
							size: 20
						}, null, _parent, _scopeId));
						_push(`<span class="adm-foot__feedback-label"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(feedback).capturing ? "Bildschirmfoto …" : "Rückmeldung geben")}</span></button>`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: "adm-foot__feedback",
						type: "button",
						"aria-keyshortcuts": "R",
						"aria-busy": (0, vue_exports.unref)(feedback).capturing ? "true" : void 0,
						"data-feedback-skip": "",
						onClick: (0, vue_exports.unref)(startFeedback)
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "feedback",
						size: 20
					}), (0, vue_exports.createVNode)("span", { class: "adm-foot__feedback-label" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(feedback).capturing ? "Bildschirmfoto …" : "Rückmeldung geben"), 1)], 8, ["aria-busy", "onClick"])];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`<div class="adm-foot__actions">`);
			if (actions.value.length) _push((0, server_renderer_exports.ssrRenderComponent)(AdminMenuTip_default, {
				text: "Neu anlegen",
				disabled: !__props.collapsed
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary adm-foot__new" }, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "plus",
												size: 20
											}, null, _parent, _scopeId));
											_push(`<span class="adm-foot__new-label"${_scopeId}>Neu</span>`);
										} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "plus",
											size: 20
										}), (0, vue_exports.createVNode)("span", { class: "adm-foot__new-label" }, "Neu")];
									}),
									_: 1
								}, _parent, _scopeId));
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu",
											side: __props.collapsed ? "right" : "top",
											align: "start",
											"side-offset": 8
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push(`Neu anlegen`);
															else return [(0, vue_exports.createTextVNode)("Neu anlegen")];
														}),
														_: 1
													}, _parent, _scopeId));
													_push(`<!--[-->`);
													(0, server_renderer_exports.ssrRenderList)(actions.value, (action) => {
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: action.key,
															"as-child": ""
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																	href: action.href,
																	class: "adm-menu__item"
																}, {
																	default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																		if (_push) {
																			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																				name: action.icon,
																				size: 20
																			}, null, _parent, _scopeId));
																			_push(` ${(0, server_renderer_exports.ssrInterpolate)(action.label)}`);
																		} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: action.icon,
																			size: 20
																		}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)];
																	}),
																	_: 2
																}, _parent, _scopeId));
																else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																	href: action.href,
																	class: "adm-menu__item"
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: action.icon,
																		size: 20
																	}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
																	_: 2
																}, 1032, ["href"])];
															}),
															_: 2
														}, _parent, _scopeId));
													});
													_push(`<!--]-->`);
												} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neu anlegen")]),
													_: 1
												}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(actions.value, (action) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: action.key,
														"as-child": ""
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: action.href,
															class: "adm-menu__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: action.icon,
																size: 20
															}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
															_: 2
														}, 1032, ["href"])]),
														_: 2
													}, 1024);
												}), 128))];
											}),
											_: 1
										}, _parent, _scopeId));
										else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu",
											side: __props.collapsed ? "right" : "top",
											align: "start",
											"side-offset": 8
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neu anlegen")]),
												_: 1
											}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(actions.value, (action) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: action.key,
													"as-child": ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: action.href,
														class: "adm-menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: action.icon,
															size: 20
														}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
														_: 2
													}, 1032, ["href"])]),
													_: 2
												}, 1024);
											}), 128))]),
											_: 1
										}, 8, ["side"])];
									}),
									_: 1
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary adm-foot__new" }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createVNode)("span", { class: "adm-foot__new-label" }, "Neu")]),
								_: 1
							}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									side: __props.collapsed ? "right" : "top",
									align: "start",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neu anlegen")]),
										_: 1
									}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(actions.value, (action) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: action.key,
											"as-child": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: action.href,
												class: "adm-menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: action.icon,
													size: 20
												}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
												_: 2
											}, 1032, ["href"])]),
											_: 2
										}, 1024);
									}), 128))]),
									_: 1
								}, 8, ["side"])]),
								_: 1
							})];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary adm-foot__new" }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "plus",
								size: 20
							}), (0, vue_exports.createVNode)("span", { class: "adm-foot__new-label" }, "Neu")]),
							_: 1
						}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
								class: "adm-menu",
								side: __props.collapsed ? "right" : "top",
								align: "start",
								"side-offset": 8
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neu anlegen")]),
									_: 1
								}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(actions.value, (action) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
										key: action.key,
										"as-child": ""
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: action.href,
											class: "adm-menu__item"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: action.icon,
												size: 20
											}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
											_: 2
										}, 1032, ["href"])]),
										_: 2
									}, 1024);
								}), 128))]),
								_: 1
							}, 8, ["side"])]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`<button class="adm-foot__kbd" type="button" aria-label="Suche öffnen" aria-keyshortcuts="Control+K Meta+K">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, {
				keys: ["K"],
				modifier: ""
			}, null, _parent));
			_push(`</button></div>`);
			if (account.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminMenuTip_default, {
				text: `${account.value.name} · ${account.value.role ?? account.value.email}`,
				disabled: !__props.collapsed && !whoCut.value
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
									class: "adm-foot__profile",
									"aria-label": `Konto: ${account.value.name}${account.value.role ? `, ${account.value.role}` : ""}`,
									onPointerenter: measureWho,
									onFocus: measureWho
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`<span class="adm-avatar" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(initials.value)}</span><span class="adm-foot__who"${_scopeId}><span class="adm-foot__name"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.value.name)}</span><span class="adm-foot__role"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.value.role ?? account.value.email)}</span></span>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												class: "adm-foot__chevron",
												name: "chevron-up",
												size: 16
											}, null, _parent, _scopeId));
										} else return [
											(0, vue_exports.createVNode)("span", {
												class: "adm-avatar",
												"aria-hidden": "true"
											}, (0, vue_exports.toDisplayString)(initials.value), 1),
											(0, vue_exports.createVNode)("span", { class: "adm-foot__who" }, [(0, vue_exports.createVNode)("span", { class: "adm-foot__name" }, (0, vue_exports.toDisplayString)(account.value.name), 1), (0, vue_exports.createVNode)("span", { class: "adm-foot__role" }, (0, vue_exports.toDisplayString)(account.value.role ?? account.value.email), 1)]),
											(0, vue_exports.createVNode)(AdminIcon_default, {
												class: "adm-foot__chevron",
												name: "chevron-up",
												size: 16
											})
										];
									}),
									_: 1
								}, _parent, _scopeId));
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu adm-foot__menu",
											side: __props.collapsed ? "right" : "top",
											align: "start",
											"side-offset": 8
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push(`<div class="adm-menu__head"${_scopeId}>`);
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__name" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(account.value.name)}`);
															else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.name), 1)];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__meta" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(account.value.email)}`);
															else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.email), 1)];
														}),
														_: 1
													}, _parent, _scopeId));
													_push(`</div>`);
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																href: "/admin/profil",
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "users",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` Profil `);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "users",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Profil ")];
																}),
																_: 1
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																href: "/admin/profil",
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "users",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Profil ")]),
																_: 1
															})];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																href: "/admin/benachrichtigungen",
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "bell",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` Benachrichtigungen `);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "bell",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Benachrichtigungen ")];
																}),
																_: 1
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																href: "/admin/benachrichtigungen",
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "bell",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Benachrichtigungen ")]),
																_: 1
															})];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																href: "/admin/profil#passwort",
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "shield",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` Passwort ändern `);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "shield",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Passwort ändern ")];
																}),
																_: 1
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																href: "/admin/profil#passwort",
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "shield",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Passwort ändern ")]),
																_: 1
															})];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																	name: "keyboard",
																	size: 20
																}, null, _parent, _scopeId));
																_push(` Tastenkürzel `);
															} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "keyboard",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														disabled: signingOut.value,
														"aria-busy": signingOut.value ? "true" : void 0,
														onSelect: signOut
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																	name: "logout",
																	size: 20
																}, null, _parent, _scopeId));
																_push(` ${(0, server_renderer_exports.ssrInterpolate)(signingOut.value ? "Wird abgemeldet …" : "Abmelden")}`);
															} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "logout",
																size: 20
															}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(signingOut.value ? "Wird abgemeldet …" : "Abmelden"), 1)];
														}),
														_: 1
													}, _parent, _scopeId));
												} else return [
													(0, vue_exports.createVNode)("div", { class: "adm-menu__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__name" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.name), 1)]),
														_: 1
													}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__meta" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.email), 1)]),
														_: 1
													})]),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: "/admin/profil",
															class: "adm-menu__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "users",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Profil ")]),
															_: 1
														})]),
														_: 1
													}),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: "/admin/benachrichtigungen",
															class: "adm-menu__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "bell",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Benachrichtigungen ")]),
															_: 1
														})]),
														_: 1
													}),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: "/admin/profil#passwort",
															class: "adm-menu__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "shield",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Passwort ändern ")]),
															_: 1
														})]),
														_: 1
													}),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "keyboard",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")]),
														_: 1
													}, 8, ["onSelect"]),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														disabled: signingOut.value,
														"aria-busy": signingOut.value ? "true" : void 0,
														onSelect: signOut
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "logout",
															size: 20
														}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(signingOut.value ? "Wird abgemeldet …" : "Abmelden"), 1)]),
														_: 1
													}, 8, ["disabled", "aria-busy"])
												];
											}),
											_: 1
										}, _parent, _scopeId));
										else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu adm-foot__menu",
											side: __props.collapsed ? "right" : "top",
											align: "start",
											"side-offset": 8
										}, {
											default: (0, vue_exports.withCtx)(() => [
												(0, vue_exports.createVNode)("div", { class: "adm-menu__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__name" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.name), 1)]),
													_: 1
												}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__meta" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.email), 1)]),
													_: 1
												})]),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: "/admin/profil",
														class: "adm-menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "users",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Profil ")]),
														_: 1
													})]),
													_: 1
												}),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: "/admin/benachrichtigungen",
														class: "adm-menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "bell",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Benachrichtigungen ")]),
														_: 1
													})]),
													_: 1
												}),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: "/admin/profil#passwort",
														class: "adm-menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "shield",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Passwort ändern ")]),
														_: 1
													})]),
													_: 1
												}),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "keyboard",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")]),
													_: 1
												}, 8, ["onSelect"]),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													disabled: signingOut.value,
													"aria-busy": signingOut.value ? "true" : void 0,
													onSelect: signOut
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "logout",
														size: 20
													}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(signingOut.value ? "Wird abgemeldet …" : "Abmelden"), 1)]),
													_: 1
												}, 8, ["disabled", "aria-busy"])
											]),
											_: 1
										}, 8, ["side"])];
									}),
									_: 1
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
								class: "adm-foot__profile",
								"aria-label": `Konto: ${account.value.name}${account.value.role ? `, ${account.value.role}` : ""}`,
								onPointerenter: measureWho,
								onFocus: measureWho
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)("span", {
										class: "adm-avatar",
										"aria-hidden": "true"
									}, (0, vue_exports.toDisplayString)(initials.value), 1),
									(0, vue_exports.createVNode)("span", { class: "adm-foot__who" }, [(0, vue_exports.createVNode)("span", { class: "adm-foot__name" }, (0, vue_exports.toDisplayString)(account.value.name), 1), (0, vue_exports.createVNode)("span", { class: "adm-foot__role" }, (0, vue_exports.toDisplayString)(account.value.role ?? account.value.email), 1)]),
									(0, vue_exports.createVNode)(AdminIcon_default, {
										class: "adm-foot__chevron",
										name: "chevron-up",
										size: 16
									})
								]),
								_: 1
							}, 8, ["aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu adm-foot__menu",
									side: __props.collapsed ? "right" : "top",
									align: "start",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)("div", { class: "adm-menu__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__name" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.name), 1)]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__meta" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.email), 1)]),
											_: 1
										})]),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: "/admin/profil",
												class: "adm-menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "users",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Profil ")]),
												_: 1
											})]),
											_: 1
										}),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: "/admin/benachrichtigungen",
												class: "adm-menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "bell",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Benachrichtigungen ")]),
												_: 1
											})]),
											_: 1
										}),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: "/admin/profil#passwort",
												class: "adm-menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "shield",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Passwort ändern ")]),
												_: 1
											})]),
											_: 1
										}),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item",
											onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "keyboard",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")]),
											_: 1
										}, 8, ["onSelect"]),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item adm-menu__item--danger",
											disabled: signingOut.value,
											"aria-busy": signingOut.value ? "true" : void 0,
											onSelect: signOut
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "logout",
												size: 20
											}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(signingOut.value ? "Wird abgemeldet …" : "Abmelden"), 1)]),
											_: 1
										}, 8, ["disabled", "aria-busy"])
									]),
									_: 1
								}, 8, ["side"])]),
								_: 1
							})];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
							class: "adm-foot__profile",
							"aria-label": `Konto: ${account.value.name}${account.value.role ? `, ${account.value.role}` : ""}`,
							onPointerenter: measureWho,
							onFocus: measureWho
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("span", {
									class: "adm-avatar",
									"aria-hidden": "true"
								}, (0, vue_exports.toDisplayString)(initials.value), 1),
								(0, vue_exports.createVNode)("span", { class: "adm-foot__who" }, [(0, vue_exports.createVNode)("span", { class: "adm-foot__name" }, (0, vue_exports.toDisplayString)(account.value.name), 1), (0, vue_exports.createVNode)("span", { class: "adm-foot__role" }, (0, vue_exports.toDisplayString)(account.value.role ?? account.value.email), 1)]),
								(0, vue_exports.createVNode)(AdminIcon_default, {
									class: "adm-foot__chevron",
									name: "chevron-up",
									size: 16
								})
							]),
							_: 1
						}, 8, ["aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
								class: "adm-menu adm-foot__menu",
								side: __props.collapsed ? "right" : "top",
								align: "start",
								"side-offset": 8
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)("div", { class: "adm-menu__head" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__name" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.name), 1)]),
										_: 1
									}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__meta" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.value.email), 1)]),
										_: 1
									})]),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: "/admin/profil",
											class: "adm-menu__item"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "users",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Profil ")]),
											_: 1
										})]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: "/admin/benachrichtigungen",
											class: "adm-menu__item"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "bell",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Benachrichtigungen ")]),
											_: 1
										})]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: "/admin/profil#passwort",
											class: "adm-menu__item"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "shield",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Passwort ändern ")]),
											_: 1
										})]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item",
										onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "keyboard",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")]),
										_: 1
									}, 8, ["onSelect"]),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item adm-menu__item--danger",
										disabled: signingOut.value,
										"aria-busy": signingOut.value ? "true" : void 0,
										onSelect: signOut
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "logout",
											size: 20
										}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(signingOut.value ? "Wird abgemeldet …" : "Abmelden"), 1)]),
										_: 1
									}, 8, ["disabled", "aria-busy"])
								]),
								_: 1
							}, 8, ["side"])]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminRailFoot.vue
var _sfc_setup$7 = AdminRailFoot_vue_vue_type_script_setup_true_lang_default.setup;
AdminRailFoot_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminRailFoot.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var AdminRailFoot_default = AdminRailFoot_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminRailTooltip.vue?vue&type=script&setup=true&lang.ts
var AdminRailTooltip_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminRailTooltip",
	__ssrInlineRender: true,
	props: {
		enabled: { type: Boolean },
		disabled: { type: Boolean }
	},
	setup(__props) {
		/**
		* A rail item's tooltip, from hydration on (D-272).
		*
		* Until the page has hydrated a tooltip cannot open — nothing listens for the pointer yet — so the server renders the
		* item alone. reka-ui's tooltip is some ten components per item; for the rail's thirty items they were 60 % of the time
		* the server took to render an admin page (a CPU profile of the renderer, 17.10.2026). Once the browser is idle after
		* mounting, the item is drawn again inside its tooltip, with the same markup — not inside the task that hydrates the
		* page, where they cost it about 150 ms (D-276).
		*/
		return (_ctx, _push, _parent, _attrs) => {
			if (__props.enabled) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipRoot_default), (0, vue_exports.mergeProps)({ disabled: __props.disabled }, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) (0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent, _scopeId);
								else return [(0, vue_exports.renderSlot)(_ctx.$slots, "default")];
							}),
							_: 3
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) (0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "content", {}, null, _push, _parent, _scopeId);
										else return [(0, vue_exports.renderSlot)(_ctx.$slots, "content")];
									}),
									_: 3
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
									class: "adm-tooltip",
									side: "right",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "content")]),
									_: 3
								})];
							}),
							_: 3
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
						_: 3
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
							class: "adm-tooltip",
							side: "right",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "content")]),
							_: 3
						})]),
						_: 3
					})];
				}),
				_: 3
			}, _parent));
			else (0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminRailTooltip.vue
var _sfc_setup$6 = AdminRailTooltip_vue_vue_type_script_setup_true_lang_default.setup;
AdminRailTooltip_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminRailTooltip.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var AdminRailTooltip_default = AdminRailTooltip_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/composables/useWhenIdle.ts
/**
* True once the browser has a moment to spare after the component mounted — for work the first frame does not need
* (D-276). False on the server and through hydration, so the server's HTML and the hydrating client agree; then the
* work happens in the browser's next idle period, at the latest after `timeout` ms, outside the task that hydrates the
* page. The rail's thirty item tooltips cost about 150 ms of that task; nobody can point at one before then anyway.
*/
function useWhenIdle(timeout = 1e3) {
	const ready = (0, vue_exports.ref)(false);
	let cancel = null;
	(0, vue_exports.onMounted)(() => {
		const go = () => {
			cancel = null;
			ready.value = true;
		};
		if (typeof window.requestIdleCallback === "function") {
			const id = window.requestIdleCallback(go, { timeout });
			cancel = () => window.cancelIdleCallback(id);
		} else {
			const id = window.setTimeout(go, 1);
			cancel = () => window.clearTimeout(id);
		}
	});
	(0, vue_exports.onBeforeUnmount)(() => cancel?.());
	return ready;
}
//#endregion
//#region resources/js/Components/Admin/AdminRail.vue?vue&type=script&setup=true&lang.ts
var AdminRail_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminRail",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The rail — where everything in the panel is, grouped the way the client's team works.
		*
		* The tree comes from the server whole (AdminNavigation): it already leaves out every page a role
		* may not open and every page not built yet, so this component filters nothing and can never offer
		* a dead link. It draws the client's rail (DIRECTION §8a): light, labelled groups, 36 px items, the
		* tint and 2 px indicator where you are, counts as quiet figures that disappear at zero.
		*
		* Its foot (AdminRailFoot) stays put under a hairline while the navigation scrolls above it: the
		* shop's health, „Neu“, and the account with its way out.
		*
		* Collapsed it is icons with tooltips. That happens by choice from 1024 px, remembered on the
		* account so the first frame is already right, and by force at 768–1023, where there is no room to
		* honour a choice to open it — so the toggle is not offered there at all.
		*/
		const admin = useAdmin();
		const shell = useAdminShell();
		const page = usePage();
		/** The current path, without the query: a filtered list is still the same page in the rail. */
		const path = (0, vue_exports.computed)(() => {
			const url = page.url.replace(/[?#].*$/, "");
			return url.length > 1 ? url.replace(/\/$/, "") : url;
		});
		/** Every rail address, so a page nested in another's address is the only one current on it. */
		const hrefs = (0, vue_exports.computed)(() => admin.value.nav.flatMap((group) => group.pages.map((p) => p.href)));
		function current(item) {
			return isCurrentPage(item.href, path.value, hrefs.value);
		}
		/** A group of one page is that page: no label saying "Übersicht" above an item saying the same. */
		function labelled(group) {
			return !(group.pages.length === 1 && group.pages[0]?.label === group.label);
		}
		function countName(item) {
			return item.countTone === "bad" ? `${item.count} fehlgeschlagen` : `${item.count} offen`;
		}
		const narrow = (0, vue_exports.ref)(false);
		let media = null;
		function onMedia() {
			narrow.value = media?.matches ?? false;
		}
		const hydrated = useWhenIdle();
		(0, vue_exports.onMounted)(() => {
			media = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
			onMedia();
			media.addEventListener("change", onMedia);
		});
		(0, vue_exports.onBeforeUnmount)(() => media?.removeEventListener("change", onMedia));
		const collapsed = (0, vue_exports.computed)(() => (shell.rail?.shown.value ?? shell.railCollapsed.value) || narrow.value);
		const railClosed = (0, vue_exports.computed)(() => shell.rail?.shown.value ?? shell.railCollapsed.value);
		const hint = (0, vue_exports.computed)(() => shell.rail?.hint?.value ?? (railClosed.value ? "Seitenleiste ausklappen" : null));
		const cut = (0, vue_exports.reactive)(/* @__PURE__ */ new Set());
		function measure(event, item) {
			const text = event.currentTarget.querySelector(".adm-rail__text");
			if (text && text.scrollWidth > text.clientWidth) cut.add(item.href);
			else cut.delete(item.href);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipProvider_default), (0, vue_exports.mergeProps)({
				"delay-duration": 150,
				"disable-hoverable-content": ""
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<aside class="adm-rail"${_scopeId}><div class="adm-rail__brand"${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/admin",
							class: "adm-wordmark adm-wordmark--full"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`RIMIFY`);
								else return [(0, vue_exports.createTextVNode)("RIMIFY")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/admin",
							class: "adm-iconbtn adm-wordmark adm-wordmark--mark",
							"aria-label": "RIMIFY – zur Übersicht"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<span aria-hidden="true"${_scopeId}>R</span>`);
								else return [(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, "R")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(EnvironmentBadge_default, null, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipRoot_default), { disabled: !hint.value }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push(`<button class="adm-iconbtn adm-rail__toggle" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", railClosed.value ? "false" : "true")} aria-controls="adm-nav" aria-keyshortcuts="["${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", (0, vue_exports.unref)(shell).rail?.forced.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", railClosed.value ? "Seitenleiste ausklappen" : "Seitenleiste einklappen")}${_scopeId}>`);
												_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
													name: railClosed.value ? "chevron-right" : "chevron-left",
													size: 16
												}, null, _parent, _scopeId));
												_push(`</button>`);
											} else return [(0, vue_exports.createVNode)("button", {
												class: "adm-iconbtn adm-rail__toggle",
												type: "button",
												"aria-expanded": railClosed.value ? "false" : "true",
												"aria-controls": "adm-nav",
												"aria-keyshortcuts": "[",
												"aria-disabled": (0, vue_exports.unref)(shell).rail?.forced.value ? "true" : void 0,
												"aria-label": railClosed.value ? "Seitenleiste ausklappen" : "Seitenleiste einklappen",
												onClick: (0, vue_exports.unref)(shell).toggleRail
											}, [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: railClosed.value ? "chevron-right" : "chevron-left",
												size: 16
											}, null, 8, ["name"])], 8, [
												"aria-expanded",
												"aria-disabled",
												"aria-label",
												"onClick"
											])];
										}),
										_: 1
									}, _parent, _scopeId));
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipPortal_default), null, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TooltipContent_default), {
												class: "adm-tooltip",
												side: "right",
												"side-offset": 8
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(hint.value)}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(hint.value), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
												class: "adm-tooltip",
												side: "right",
												"side-offset": 8
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(hint.value), 1)]),
												_: 1
											})];
										}),
										_: 1
									}, _parent, _scopeId));
								} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
										class: "adm-iconbtn adm-rail__toggle",
										type: "button",
										"aria-expanded": railClosed.value ? "false" : "true",
										"aria-controls": "adm-nav",
										"aria-keyshortcuts": "[",
										"aria-disabled": (0, vue_exports.unref)(shell).rail?.forced.value ? "true" : void 0,
										"aria-label": railClosed.value ? "Seitenleiste ausklappen" : "Seitenleiste einklappen",
										onClick: (0, vue_exports.unref)(shell).toggleRail
									}, [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: railClosed.value ? "chevron-right" : "chevron-left",
										size: 16
									}, null, 8, ["name"])], 8, [
										"aria-expanded",
										"aria-disabled",
										"aria-label",
										"onClick"
									])]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
										class: "adm-tooltip",
										side: "right",
										"side-offset": 8
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(hint.value), 1)]),
										_: 1
									})]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</div><nav id="adm-nav" class="adm-rail__nav" aria-label="Hauptnavigation"${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(admin).nav, (group) => {
							_push(`<section class="adm-rail__group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", labelled(group) ? `adm-group-${group.key}` : void 0)}${_scopeId}>`);
							if (labelled(group)) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `adm-group-${group.key}`)} class="adm-rail__label"${_scopeId}><span class="adm-rail__label-full"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</span><span class="adm-rail__label-short" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.short || group.label)}</span></p>`);
							else _push(`<!---->`);
							_push(`<ul class="adm-rail__list"${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(group.pages, (item) => {
								_push(`<li${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminRailTooltip_default, {
									enabled: (0, vue_exports.unref)(hydrated),
									disabled: !collapsed.value && !cut.has(item.href)
								}, {
									content: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
											if (item.count) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(countName(item))}<!--]-->`);
											else _push(`<!---->`);
										} else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1), item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(countName(item)), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)];
									}),
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
											href: item.href,
											class: "adm-rail__item",
											"aria-current": current(item) ? "page" : void 0,
											"aria-label": item.count ? `${item.label}, ${countName(item)}` : void 0,
											onPointerenter: ($event) => measure($event, item),
											onFocus: ($event) => measure($event, item)
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
														name: item.icon,
														size: 20
													}, null, _parent, _scopeId));
													_push(`<span class="adm-rail__text"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</span>`);
													if (item.count) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-rail__count--bad": item.countTone === "bad" }, "adm-rail__count"])}" aria-hidden="true"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.count > 99 ? "99+" : item.count)}</span>`);
													else _push(`<!---->`);
													if (item.count) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-rail__dot--bad": item.countTone === "bad" }, "adm-rail__dot"])}" aria-hidden="true"${_scopeId}></span>`);
													else _push(`<!---->`);
												} else return [
													(0, vue_exports.createVNode)(AdminIcon_default, {
														name: item.icon,
														size: 20
													}, null, 8, ["name"]),
													(0, vue_exports.createVNode)("span", { class: "adm-rail__text" }, (0, vue_exports.toDisplayString)(item.label), 1),
													item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 0,
														class: ["adm-rail__count", { "adm-rail__count--bad": item.countTone === "bad" }],
														"aria-hidden": "true"
													}, (0, vue_exports.toDisplayString)(item.count > 99 ? "99+" : item.count), 3)) : (0, vue_exports.createCommentVNode)("", true),
													item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
														key: 1,
														class: ["adm-rail__dot", { "adm-rail__dot--bad": item.countTone === "bad" }],
														"aria-hidden": "true"
													}, null, 2)) : (0, vue_exports.createCommentVNode)("", true)
												];
											}),
											_: 2
										}, _parent, _scopeId));
										else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: item.href,
											class: "adm-rail__item",
											"aria-current": current(item) ? "page" : void 0,
											"aria-label": item.count ? `${item.label}, ${countName(item)}` : void 0,
											onPointerenter: ($event) => measure($event, item),
											onFocus: ($event) => measure($event, item)
										}, {
											default: (0, vue_exports.withCtx)(() => [
												(0, vue_exports.createVNode)(AdminIcon_default, {
													name: item.icon,
													size: 20
												}, null, 8, ["name"]),
												(0, vue_exports.createVNode)("span", { class: "adm-rail__text" }, (0, vue_exports.toDisplayString)(item.label), 1),
												item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 0,
													class: ["adm-rail__count", { "adm-rail__count--bad": item.countTone === "bad" }],
													"aria-hidden": "true"
												}, (0, vue_exports.toDisplayString)(item.count > 99 ? "99+" : item.count), 3)) : (0, vue_exports.createCommentVNode)("", true),
												item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 1,
													class: ["adm-rail__dot", { "adm-rail__dot--bad": item.countTone === "bad" }],
													"aria-hidden": "true"
												}, null, 2)) : (0, vue_exports.createCommentVNode)("", true)
											]),
											_: 2
										}, 1032, [
											"href",
											"aria-current",
											"aria-label",
											"onPointerenter",
											"onFocus"
										])];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</li>`);
							});
							_push(`<!--]--></ul></section>`);
						});
						_push(`<!--]--></nav>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminRailFoot_default, { collapsed: collapsed.value }, null, _parent, _scopeId));
						_push(`</aside>`);
					} else return [(0, vue_exports.createVNode)("aside", { class: "adm-rail" }, [
						(0, vue_exports.createVNode)("div", { class: "adm-rail__brand" }, [
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								href: "/admin",
								class: "adm-wordmark adm-wordmark--full"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("RIMIFY")]),
								_: 1
							}),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								href: "/admin",
								class: "adm-iconbtn adm-wordmark adm-wordmark--mark",
								"aria-label": "RIMIFY – zur Übersicht"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, "R")]),
								_: 1
							}),
							(0, vue_exports.createVNode)(EnvironmentBadge_default),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipRoot_default), { disabled: !hint.value }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipTrigger_default), { "as-child": "" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
										class: "adm-iconbtn adm-rail__toggle",
										type: "button",
										"aria-expanded": railClosed.value ? "false" : "true",
										"aria-controls": "adm-nav",
										"aria-keyshortcuts": "[",
										"aria-disabled": (0, vue_exports.unref)(shell).rail?.forced.value ? "true" : void 0,
										"aria-label": railClosed.value ? "Seitenleiste ausklappen" : "Seitenleiste einklappen",
										onClick: (0, vue_exports.unref)(shell).toggleRail
									}, [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: railClosed.value ? "chevron-right" : "chevron-left",
										size: 16
									}, null, 8, ["name"])], 8, [
										"aria-expanded",
										"aria-disabled",
										"aria-label",
										"onClick"
									])]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipPortal_default), null, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(TooltipContent_default), {
										class: "adm-tooltip",
										side: "right",
										"side-offset": 8
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(hint.value), 1)]),
										_: 1
									})]),
									_: 1
								})]),
								_: 1
							}, 8, ["disabled"])
						]),
						(0, vue_exports.createVNode)("nav", {
							id: "adm-nav",
							class: "adm-rail__nav",
							"aria-label": "Hauptnavigation"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(admin).nav, (group) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: group.key,
								class: "adm-rail__group",
								"aria-labelledby": labelled(group) ? `adm-group-${group.key}` : void 0
							}, [labelled(group) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								id: `adm-group-${group.key}`,
								class: "adm-rail__label"
							}, [(0, vue_exports.createVNode)("span", { class: "adm-rail__label-full" }, (0, vue_exports.toDisplayString)(group.label), 1), (0, vue_exports.createVNode)("span", {
								class: "adm-rail__label-short",
								"aria-hidden": "true"
							}, (0, vue_exports.toDisplayString)(group.short || group.label), 1)], 8, ["id"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("ul", { class: "adm-rail__list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.pages, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: item.href }, [(0, vue_exports.createVNode)(AdminRailTooltip_default, {
									enabled: (0, vue_exports.unref)(hydrated),
									disabled: !collapsed.value && !cut.has(item.href)
								}, {
									content: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1), item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(countName(item)), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: item.href,
										class: "adm-rail__item",
										"aria-current": current(item) ? "page" : void 0,
										"aria-label": item.count ? `${item.label}, ${countName(item)}` : void 0,
										onPointerenter: ($event) => measure($event, item),
										onFocus: ($event) => measure($event, item)
									}, {
										default: (0, vue_exports.withCtx)(() => [
											(0, vue_exports.createVNode)(AdminIcon_default, {
												name: item.icon,
												size: 20
											}, null, 8, ["name"]),
											(0, vue_exports.createVNode)("span", { class: "adm-rail__text" }, (0, vue_exports.toDisplayString)(item.label), 1),
											item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: ["adm-rail__count", { "adm-rail__count--bad": item.countTone === "bad" }],
												"aria-hidden": "true"
											}, (0, vue_exports.toDisplayString)(item.count > 99 ? "99+" : item.count), 3)) : (0, vue_exports.createCommentVNode)("", true),
											item.count ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 1,
												class: ["adm-rail__dot", { "adm-rail__dot--bad": item.countTone === "bad" }],
												"aria-hidden": "true"
											}, null, 2)) : (0, vue_exports.createCommentVNode)("", true)
										]),
										_: 2
									}, 1032, [
										"href",
										"aria-current",
										"aria-label",
										"onPointerenter",
										"onFocus"
									])]),
									_: 2
								}, 1032, ["enabled", "disabled"])]);
							}), 128))])], 8, ["aria-labelledby"]);
						}), 128))]),
						(0, vue_exports.createVNode)(AdminRailFoot_default, { collapsed: collapsed.value }, null, 8, ["collapsed"])
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminRail.vue
var _sfc_setup$5 = AdminRail_vue_vue_type_script_setup_true_lang_default.setup;
AdminRail_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminRail.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var AdminRail_default = AdminRail_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminRailHandle.vue?vue&type=script&setup=true&lang.ts
var AdminRailHandle_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminRailHandle",
	__ssrInlineRender: true,
	setup(__props) {
		const rail = useAdminShell().rail;
		(0, vue_exports.ref)(null);
		const said = (0, vue_exports.ref)("");
		const state = (0, vue_exports.computed)(() => ({
			collapsed: rail?.shown.value ?? false,
			width: rail?.width.value ?? RAIL.default
		}));
		let frame = 0;
		let sayTimer;
		(0, vue_exports.onBeforeUnmount)(() => {
			cancelAnimationFrame(frame);
			clearTimeout(sayTimer);
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if ((0, vue_exports.unref)(rail)) _push(`<div class="adm-handle" role="separator" aria-orientation="vertical" aria-controls="adm-nav" aria-label="Seitenleistenbreite"${(0, server_renderer_exports.ssrRenderAttr)("aria-valuemin", (0, vue_exports.unref)(RAIL).min)}${(0, server_renderer_exports.ssrRenderAttr)("aria-valuemax", (0, vue_exports.unref)(rail).max?.value ?? (0, vue_exports.unref)(RAIL).max)}${(0, server_renderer_exports.ssrRenderAttr)("aria-valuenow", state.value.width)}${(0, server_renderer_exports.ssrRenderAttr)("aria-valuetext", (0, vue_exports.unref)(railSentence)(state.value))} tabindex="0"></div>`);
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(rail)) _push(`<span class="visually-hidden" role="status">${(0, server_renderer_exports.ssrInterpolate)(said.value)}</span>`);
			else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminRailHandle.vue
var _sfc_setup$4 = AdminRailHandle_vue_vue_type_script_setup_true_lang_default.setup;
AdminRailHandle_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminRailHandle.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var AdminRailHandle_default = AdminRailHandle_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminTopbar.vue?vue&type=script&setup=true&lang.ts
var AdminTopbar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminTopbar",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The topbar: where you are, the way to anything, what happened, and help — nothing else. The
		* account lives at the foot of the rail (AdminRailFoot), where the navigation ends.
		*
		* Breadcrumbs on the left come from the server (a slug is not a label); the group is a label and
		* the current page is not a link, so nothing here goes nowhere. The search is a button that looks
		* like a field and opens the one palette that ⌘K, `/` and the phone's Suche tab also open — two
		* search affordances is how a panel ends up with two different result lists.
		*
		* The bell sits left of Hilfe: what happened that this person should know about (AdminBell).
		*/
		const admin = useAdmin();
		const shell = useAdminShell();
		const crumbs = (0, vue_exports.computed)(() => admin.value.breadcrumbs);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<header${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "adm-topbar" }, _attrs))}><div class="adm-topbar__start">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(EnvironmentBadge_default, null, null, _parent));
			if (crumbs.value.length) {
				_push(`<nav class="adm-crumbs" aria-label="Brotkrumen"><ol><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(crumbs.value, (crumb, index) => {
					_push(`<li>`);
					if (index > 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						class: "adm-crumbs__sep",
						name: "chevron-right",
						size: 16
					}, null, _parent));
					else _push(`<!---->`);
					if (index === crumbs.value.length - 1) _push(`<span aria-current="page">${(0, server_renderer_exports.ssrInterpolate)(crumb.label)}</span>`);
					else if (crumb.href) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: crumb.href }, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(crumb.label)}`);
							else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(crumb.label), 1)];
						}),
						_: 2
					}, _parent));
					else _push(`<span>${(0, server_renderer_exports.ssrInterpolate)(crumb.label)}</span>`);
					_push(`</li>`);
				});
				_push(`<!--]--></ol></nav>`);
			} else _push(`<!---->`);
			_push(`</div><button class="adm-search adm-search--field" type="button" aria-label="Suche öffnen" aria-keyshortcuts="Control+K Meta+K">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "search",
				size: 16
			}, null, _parent));
			_push(`<span class="adm-search__label">Suchen</span><span class="adm-search__kbd">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, {
				keys: ["K"],
				modifier: ""
			}, null, _parent));
			_push(`</span></button><div class="adm-topbar__end"><button class="adm-iconbtn adm-search--icon" type="button" aria-label="Suche öffnen" aria-keyshortcuts="Control+K Meta+K">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`</button>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminBell_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
							class: "adm-iconbtn",
							"aria-label": "Hilfe"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "help",
									size: 20
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "help",
									size: 20
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "keyboard",
															size: 20
														}, null, _parent, _scopeId));
														_push(` Tastenkürzel `);
													} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "keyboard",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")];
												}),
												_: 1
											}, _parent, _scopeId));
											if ((0, vue_exports.unref)(admin).supportEmail) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push(`<a class="adm-menu__item"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${(0, vue_exports.unref)(admin).supportEmail}`)}${_scopeId}>`);
														_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "emails",
															size: 20
														}, null, _parent, _scopeId));
														_push(` Hilfe per E-Mail </a>`);
													} else return [(0, vue_exports.createVNode)("a", {
														class: "adm-menu__item",
														href: `mailto:${(0, vue_exports.unref)(admin).supportEmail}`
													}, [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "emails",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Hilfe per E-Mail ")], 8, ["href"])];
												}),
												_: 1
											}, _parent, _scopeId));
											else _push(`<!---->`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`Zahlen im Menü sind so aktuell wie die Seite.`);
													else return [(0, vue_exports.createTextVNode)("Zahlen im Menü sind so aktuell wie die Seite.")];
												}),
												_: 1
											}, _parent, _scopeId));
										} else return [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "keyboard",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")]),
												_: 1
											}, 8, ["onSelect"]),
											(0, vue_exports.unref)(admin).supportEmail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
												key: 0,
												"as-child": ""
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
													class: "adm-menu__item",
													href: `mailto:${(0, vue_exports.unref)(admin).supportEmail}`
												}, [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "emails",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Hilfe per E-Mail ")], 8, ["href"])]),
												_: 1
											})) : (0, vue_exports.createCommentVNode)("", true),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zahlen im Menü sind so aktuell wie die Seite.")]),
												_: 1
											})
										];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item",
											onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "keyboard",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")]),
											_: 1
										}, 8, ["onSelect"]),
										(0, vue_exports.unref)(admin).supportEmail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: 0,
											"as-child": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
												class: "adm-menu__item",
												href: `mailto:${(0, vue_exports.unref)(admin).supportEmail}`
											}, [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "emails",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Hilfe per E-Mail ")], 8, ["href"])]),
											_: 1
										})) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zahlen im Menü sind so aktuell wie die Seite.")]),
											_: 1
										})
									]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
						class: "adm-iconbtn",
						"aria-label": "Hilfe"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "help",
							size: 20
						})]),
						_: 1
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
							class: "adm-menu",
							align: "end",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
									class: "adm-menu__item",
									onSelect: ($event) => (0, vue_exports.unref)(shell).shortcutsOpen.value = true
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "keyboard",
										size: 20
									}), (0, vue_exports.createTextVNode)(" Tastenkürzel ")]),
									_: 1
								}, 8, ["onSelect"]),
								(0, vue_exports.unref)(admin).supportEmail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
									key: 0,
									"as-child": ""
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
										class: "adm-menu__item",
										href: `mailto:${(0, vue_exports.unref)(admin).supportEmail}`
									}, [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "emails",
										size: 20
									}), (0, vue_exports.createTextVNode)(" Hilfe per E-Mail ")], 8, ["href"])]),
									_: 1
								})) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuLabel_default), { class: "adm-menu__caption" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zahlen im Menü sind so aktuell wie die Seite.")]),
									_: 1
								})
							]),
							_: 1
						})]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			_push(`</div></header>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminTopbar.vue
var _sfc_setup$3 = AdminTopbar_vue_vue_type_script_setup_true_lang_default.setup;
AdminTopbar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminTopbar.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var AdminTopbar_default = AdminTopbar_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/ShortcutsDialog.vue?vue&type=script&setup=true&lang.ts
var ShortcutsDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ShortcutsDialog",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Every shortcut the panel answers to, and only those — the list is drawn from the same table the
		* keyboard handler reads, so it cannot promise a key that does nothing.
		*
		* The `g` rows are this viewer's own: a role without Verkauf gets no "g dann b", because that
		* sequence is not bound for them either. `[` is listed only where it works, from 1024 px; below that
		* the rail is collapsed by the width, not by choice.
		*/
		const admin = useAdmin();
		const { shortcutsOpen } = useAdminShell();
		const targets = (0, vue_exports.computed)(() => goTargets(admin.value.nav));
		const wide = (0, vue_exports.ref)(true);
		(0, vue_exports.watch)(shortcutsOpen, (open) => {
			if (open) wide.value = window.matchMedia("(min-width: 1024px)").matches;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: (0, vue_exports.unref)(shortcutsOpen),
				"onUpdate:open": ($event) => (0, vue_exports.isRef)(shortcutsOpen) ? shortcutsOpen.value = $event : null,
				title: "Tastenkürzel",
				"content-class": "adm-dialog"
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<section class="adm-keys" aria-labelledby="adm-keys-general"${_scopeId}><h3 id="adm-keys-general" class="adm-keys__title"${_scopeId}>Überall</h3><dl class="adm-keys__list"${_scopeId}><div class="adm-keys__row"${_scopeId}><dt${_scopeId}>Suche öffnen</dt><dd${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, {
							keys: ["K"],
							modifier: ""
						}, null, _parent, _scopeId));
						_push(` <span class="adm-keys__or"${_scopeId}>oder</span> `);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["/"] }, null, _parent, _scopeId));
						_push(`</dd></div>`);
						if (wide.value) {
							_push(`<div class="adm-keys__row"${_scopeId}><dt${_scopeId}>Seitenleiste ein- oder ausklappen</dt><dd${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["["] }, null, _parent, _scopeId));
							_push(`</dd></div>`);
						} else _push(`<!---->`);
						_push(`<div class="adm-keys__row"${_scopeId}><dt${_scopeId}>Diese Übersicht zeigen</dt><dd${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["?"] }, null, _parent, _scopeId));
						_push(`</dd></div><div class="adm-keys__row"${_scopeId}><dt${_scopeId}>Fenster oder Menü schließen</dt><dd${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["Esc"] }, null, _parent, _scopeId));
						_push(`</dd></div></dl></section>`);
						if (targets.value.length) {
							_push(`<section class="adm-keys" aria-labelledby="adm-keys-go"${_scopeId}><h3 id="adm-keys-go" class="adm-keys__title"${_scopeId}>Gehe zu</h3><dl class="adm-keys__list"${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(targets.value, (target) => {
								_push(`<div class="adm-keys__row"${_scopeId}><dt${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(target.label)}</dt><dd${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["G"] }, null, _parent, _scopeId));
								_push(` <span class="adm-keys__or"${_scopeId}>dann</span>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: [target.key.toUpperCase()] }, null, _parent, _scopeId));
								_push(`</dd></div>`);
							});
							_push(`<!--]--></dl></section>`);
						} else _push(`<!---->`);
						_push(`<p class="adm-keys__note"${_scopeId}>Die Kürzel ohne Strg oder ⌘ wirken nicht, solange du in ein Feld schreibst.</p>`);
					} else return [
						(0, vue_exports.createVNode)("section", {
							class: "adm-keys",
							"aria-labelledby": "adm-keys-general"
						}, [(0, vue_exports.createVNode)("h3", {
							id: "adm-keys-general",
							class: "adm-keys__title"
						}, "Überall"), (0, vue_exports.createVNode)("dl", { class: "adm-keys__list" }, [
							(0, vue_exports.createVNode)("div", { class: "adm-keys__row" }, [(0, vue_exports.createVNode)("dt", null, "Suche öffnen"), (0, vue_exports.createVNode)("dd", null, [
								(0, vue_exports.createVNode)(Kbd_default, {
									keys: ["K"],
									modifier: ""
								}),
								(0, vue_exports.createTextVNode)(),
								(0, vue_exports.createVNode)("span", { class: "adm-keys__or" }, "oder"),
								(0, vue_exports.createTextVNode)(),
								(0, vue_exports.createVNode)(Kbd_default, { keys: ["/"] })
							])]),
							wide.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "adm-keys__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Seitenleiste ein- oder ausklappen"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["["] })])])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "adm-keys__row" }, [(0, vue_exports.createVNode)("dt", null, "Diese Übersicht zeigen"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["?"] })])]),
							(0, vue_exports.createVNode)("div", { class: "adm-keys__row" }, [(0, vue_exports.createVNode)("dt", null, "Fenster oder Menü schließen"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] })])])
						])]),
						targets.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "adm-keys",
							"aria-labelledby": "adm-keys-go"
						}, [(0, vue_exports.createVNode)("h3", {
							id: "adm-keys-go",
							class: "adm-keys__title"
						}, "Gehe zu"), (0, vue_exports.createVNode)("dl", { class: "adm-keys__list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(targets.value, (target) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: target.key,
								class: "adm-keys__row"
							}, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(target.label), 1), (0, vue_exports.createVNode)("dd", null, [
								(0, vue_exports.createVNode)(Kbd_default, { keys: ["G"] }),
								(0, vue_exports.createTextVNode)(),
								(0, vue_exports.createVNode)("span", { class: "adm-keys__or" }, "dann"),
								(0, vue_exports.createVNode)(Kbd_default, { keys: [target.key.toUpperCase()] }, null, 8, ["keys"])
							])]);
						}), 128))])])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("p", { class: "adm-keys__note" }, "Die Kürzel ohne Strg oder ⌘ wirken nicht, solange du in ein Feld schreibst.")
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/ShortcutsDialog.vue
var _sfc_setup$2 = ShortcutsDialog_vue_vue_type_script_setup_true_lang_default.setup;
ShortcutsDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/ShortcutsDialog.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var ShortcutsDialog_default = ShortcutsDialog_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/composables/admin/railResizing.ts
/**
* Whether the rail is being dragged right now — one flag for the whole panel. While it is, charts do
* not re-measure on every frame the content area changes width (useWidth): they measure once, when
* the drag ends.
*/
var railResizing = (0, vue_exports.ref)(false);
//#endregion
//#region resources/js/Layouts/AdminLayout.vue?vue&type=script&setup=true&lang.ts
/** Whether the intent has changed since it was last sent. */
var OFFLINE_WRITE = "Keine Verbindung zum Server. Es wurde nichts gespeichert, deine Eingaben sind noch da. Prüf die Verbindung und versuch es noch einmal.";
var OFFLINE_READ = "Keine Verbindung zum Server. Prüf die Verbindung und versuch es noch einmal.";
var FALLBACK_WRITE = "Das hat nicht geklappt. Es wurde nichts gespeichert, deine Eingaben sind noch da. Versuch es gleich noch einmal.";
var FALLBACK_READ = "Die Seite konnte nicht geladen werden. Versuch es gleich noch einmal.";
var AdminLayout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminLayout",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The admin frame: the rail, the topbar, and the page — the one layout every admin screen shares.
		*
		* Everything that decides what the frame shows is decided on the server and present in the first
		* frame (R-08 in spirit): the tree the rail draws, the breadcrumbs, whether the rail is collapsed,
		* which environment this is. Nothing here fetches, and nothing after hydration changes the frame's
		* shape except the viewer's own toggle.
		*
		* Items a role cannot reach are not in the tree at all; the server refuses the route regardless
		* (R-11). This is presentation, never enforcement.
		*
		* The frame is light, and only light (DIRECTION §8a): the dark rail, its white wordmark and the
		* dark-mode toggle are gone, and the account moved from the rail to the topbar's user menu.
		*/
		const admin = useAdmin();
		const page = usePage();
		const mobile = provideMobileShell();
		const paletteOpen = (0, vue_exports.ref)(false);
		const shortcutsOpen = (0, vue_exports.ref)(false);
		const railCollapsed = (0, vue_exports.ref)(admin.value.preferences.railCollapsed);
		const railWidth = (0, vue_exports.ref)(clampWidth(admin.value.preferences.railWidth));
		let railRev = admin.value.preferences.railRev;
		(0, vue_exports.watch)(() => admin.value.preferences, (stored) => {
			if (stored.railRev > railRev && !railResizing.value) {
				railRev = stored.railRev;
				railCollapsed.value = stored.railCollapsed;
				railWidth.value = stored.railWidth;
			}
		});
		function measurePage() {
			if (!window.matchMedia(`(min-width: ${RAIL.resizableFrom}px)`).matches) return null;
			return document.querySelector(".adm")?.clientWidth || document.documentElement.clientWidth;
		}
		const railPage = (0, vue_exports.ref)(typeof window === "undefined" ? null : measurePage());
		const railIntent = (0, vue_exports.computed)(() => ({
			collapsed: railCollapsed.value,
			width: railWidth.value
		}));
		const railEffective = (0, vue_exports.computed)(() => effectiveRail(railIntent.value, railPage.value));
		const railForced = (0, vue_exports.computed)(() => railEffective.value.forced);
		const railShown = (0, vue_exports.computed)(() => railEffective.value.collapsed);
		const railShownWidth = (0, vue_exports.computed)(() => railEffective.value.width);
		const railMax = (0, vue_exports.computed)(() => railEffective.value.max);
		const railHint = (0, vue_exports.computed)(() => toggleHint(railIntent.value, railPage.value));
		let viewportFrame = 0;
		function onViewport() {
			if (viewportFrame === 0) viewportFrame = requestAnimationFrame(() => {
				viewportFrame = 0;
				railPage.value = measurePage();
			});
		}
		/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the request is checked against. */
		function xsrfToken() {
			const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie);
			return match?.[1] ? decodeURIComponent(match[1]) : "";
		}
		/**
		* The rail moves at once; the intent is saved behind it with a plain background request, not an
		* Inertia visit — nothing on the page re-renders, so neither a stale toast nor a late answer to an
		* earlier click can come back. A failure costs the preference, never the page.
		*
		* Every save carries a revision that only grows (nextRev), and the server keeps the highest: a save
		* overtaken on its way by a later one is dropped there rather than written over it.
		*/
		let unsent = false;
		function nextSave() {
			unsent = false;
			railRev = nextRev(railRev, Date.now());
			return {
				rail: railCollapsed.value ? "collapsed" : "open",
				width: railWidth.value,
				rev: railRev
			};
		}
		function postRail(save) {
			fetch("/admin/ansicht", {
				method: "PATCH",
				credentials: "same-origin",
				keepalive: true,
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-Requested-With": "XMLHttpRequest",
					"X-XSRF-TOKEN": xsrfToken()
				},
				body: JSON.stringify(save)
			}).catch(() => void 0);
		}
		let saveTimer;
		let savePending = false;
		function saveRail(now) {
			unsent = true;
			if (now) {
				clearTimeout(saveTimer);
				saveTimer = void 0;
				savePending = false;
				postRail(nextSave());
				return;
			}
			if (saveTimer !== void 0) {
				savePending = true;
				return;
			}
			postRail(nextSave());
			saveTimer = setTimeout(() => {
				saveTimer = void 0;
				if (savePending) {
					savePending = false;
					saveRail(false);
				}
			}, RAIL.saveEveryMs);
		}
		function flushRail() {
			if (!unsent) return;
			clearTimeout(saveTimer);
			saveTimer = void 0;
			savePending = false;
			const save = nextSave();
			const token = admin.value.csrfToken;
			const form = new URLSearchParams({
				_method: "PATCH",
				_token: token ?? "",
				rail: save.rail,
				width: String(save.width),
				rev: String(save.rev)
			});
			if (!(token !== null && typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/admin/ansicht", form))) postRail(save);
		}
		function onVisibility() {
			if (document.visibilityState === "hidden") flushRail();
		}
		const work = (0, vue_exports.ref)(null);
		/** While the content slides, the handle's line waits: it is at the rail's new edge already. */
		const sliding = (0, vue_exports.ref)(false);
		function slide(apply) {
			const el = work.value;
			if (el === null || typeof el.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				apply();
				return;
			}
			const before = el.getBoundingClientRect().left;
			apply();
			(0, vue_exports.nextTick)(() => {
				const delta = before - el.getBoundingClientRect().left;
				if (Math.abs(delta) < 1) return;
				const style = getComputedStyle(document.documentElement);
				const duration = Number.parseFloat(style.getPropertyValue("--adm-d-rail")) || 180;
				sliding.value = true;
				el.animate([{ transform: `translateX(${delta}px)` }, { transform: "none" }], {
					duration,
					easing: style.getPropertyValue("--ease-out").trim() || "ease-out"
				}).finished.then(() => sliding.value = false, () => sliding.value = false);
			});
		}
		function setRail(state, options = {}) {
			if (railForced.value) return;
			const apply = () => {
				railCollapsed.value = state.collapsed;
				railWidth.value = state.width;
			};
			if (options.animate) slide(apply);
			else apply();
			if (options.save) saveRail(options.save === "now");
		}
		/**
		* The toggle — the button, `[`, and Enter or Space on the handle all come here (toggleIntent): the
		* width stays the person's own, and opened on a narrow page it shows at the widest that fits. Where
		* the window collapsed the rail it does nothing, and its tooltip says why.
		*/
		function toggleRail() {
			const next = toggleIntent(railIntent.value, railPage.value);
			if (next !== null) setRail(next, {
				animate: true,
				save: "now"
			});
		}
		const shell = {
			paletteOpen,
			shortcutsOpen,
			railCollapsed,
			toggleRail,
			rail: {
				width: railShownWidth,
				max: railMax,
				shown: railShown,
				forced: railForced,
				hint: railHint,
				resizing: railResizing,
				set: setRail
			}
		};
		provideAdminShell(shell);
		useAdminShortcuts(shell, (0, vue_exports.computed)(() => admin.value.nav));
		const busy = (0, vue_exports.ref)(false);
		let busyTimer;
		const unbind = [];
		function refuseStrayFile(event) {
			if (event.defaultPrevented || !Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
			event.preventDefault();
			if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
		}
		(0, vue_exports.onMounted)(() => {
			window.addEventListener("resize", onViewport);
			window.addEventListener("pagehide", flushRail);
			window.addEventListener("dragover", refuseStrayFile);
			window.addEventListener("drop", refuseStrayFile);
			document.addEventListener("visibilitychange", onVisibility);
			const shellObserver = typeof ResizeObserver === "function" ? new ResizeObserver(onViewport) : null;
			const shellEl = document.querySelector(".adm");
			if (shellObserver && shellEl) shellObserver.observe(shellEl);
			onViewport();
			unbind.push(() => window.removeEventListener("resize", onViewport), () => window.removeEventListener("pagehide", flushRail), () => window.removeEventListener("dragover", refuseStrayFile), () => window.removeEventListener("drop", refuseStrayFile), () => document.removeEventListener("visibilitychange", onVisibility), () => shellObserver?.disconnect(), router.on("before", (event) => {
				if (isNavigationVisit(event.detail.visit)) {
					mobile.closeSheets();
					stripSheetState();
				}
			}), router.on("start", (event) => {
				const visit = event.detail.visit;
				if (visit.async || !visit.showProgress) return;
				clearTimeout(busyTimer);
				busyTimer = setTimeout(() => busy.value = true, 300);
			}), router.on("finish", (event) => {
				if (event.detail.visit.async) return;
				clearTimeout(busyTimer);
				busy.value = false;
			}), router.on("start", (event) => {
				lastWrite = event.detail.visit.method !== "get";
				lastAsync = event.detail.visit.async === true;
			}), router.on("httpException", (event) => {
				const headers = event.detail.response.headers;
				const answer = event.detail.response.data;
				if (headers["x-inertia"]) {
					if (lastAsync && typeof answer?.component === "string" && answer.component !== page.component) {
						event.preventDefault();
						toast.show({
							text: failureMessage(void 0),
							icon: "info"
						});
					}
					return;
				}
				event.preventDefault();
				toast.show({
					text: failureMessage(event.detail.response.data),
					icon: "info"
				});
			}), router.on("networkError", (event) => {
				event.preventDefault();
				toast.show({
					text: lastWrite ? OFFLINE_WRITE : OFFLINE_READ,
					icon: "info"
				});
			}));
		});
		/** Whether the last visit wrote something: its failure then says nothing was saved. */
		let lastWrite = false;
		/** Whether the last visit was a background reload (deferred props, polling) rather than a navigation. */
		let lastAsync = false;
		function failureMessage(data) {
			const fallback = lastWrite ? FALLBACK_WRITE : FALLBACK_READ;
			if (typeof data === "string") try {
				data = JSON.parse(data);
			} catch {
				return fallback;
			}
			const message = data !== null && typeof data === "object" ? data.message : void 0;
			return typeof message === "string" && message !== "" ? message : fallback;
		}
		(0, vue_exports.onBeforeUnmount)(() => {
			clearTimeout(busyTimer);
			cancelAnimationFrame(viewportFrame);
			unbind.forEach((off) => off());
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><a class="adm-skip" href="#inhalt">Zum Inhalt springen</a><div class="adm"${(0, server_renderer_exports.ssrRenderAttr)("data-rail", railShown.value ? "collapsed" : "open")}${(0, server_renderer_exports.ssrRenderAttr)("data-rail-forced", railForced.value ? "" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("data-labels", (0, vue_exports.unref)(labelMode)(railShownWidth.value))}${(0, server_renderer_exports.ssrRenderAttr)("data-resizing", (0, vue_exports.unref)(railResizing) ? "" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("data-sliding", sliding.value ? "" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("data-busy", busy.value ? "" : void 0)} style="${(0, server_renderer_exports.ssrRenderStyle)({ "--rail-w": `${railShownWidth.value}px` })}">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminRail_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminRailHandle_default, null, null, _parent));
			_push(`<div class="adm-work">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminAppBar_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminTopbar_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminHealthBanner_default, null, null, _parent));
			if ((0, vue_exports.unref)(admin).paymentsTestMode) _push(`<p class="adm-testmode" role="note">Testmodus – es wird kein Geld abgebucht.</p>`);
			else _push(`<!---->`);
			_push(`<main id="inhalt" class="adm-page" tabindex="-1">`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			if ((0, vue_exports.unref)(page).props.release) _push(`<p class="adm-release num" data-release>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(page).props.release)}</p>`);
			else _push(`<!---->`);
			_push(`</main></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminBottomBar_default, null, null, _parent));
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPalette_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(ShortcutsDialog_default, null, null, _parent));
			if ((0, vue_exports.unref)(admin).review) _push((0, server_renderer_exports.ssrRenderComponent)(FeedbackDialog_default, null, null, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Toast_default, null, null, _parent));
			_push(`<span id="seitenende" hidden></span><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Layouts/AdminLayout.vue
var _sfc_setup$1 = AdminLayout_vue_vue_type_script_setup_true_lang_default.setup;
AdminLayout_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/AdminLayout.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var AdminLayout_default = AdminLayout_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Admin/AdminPage.vue?vue&type=script&setup=true&lang.ts
var AdminPage_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AdminPage",
	__ssrInlineRender: true,
	props: {
		title: {},
		context: {},
		more: { default: () => [] },
		readOnly: {
			type: Boolean,
			default: false
		},
		dashboard: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* Every admin page, without exception: a header, a body, and — on a form — the save bar
		* (admin-shell.md §8).
		*
		* The header answers "what is this, and what can I make here": the page's one `<h1>`, one line of
		* context that states a fact about this page (a count, a state, a scope — never what the page is
		* for), exactly one primary action, and everything else behind *Weitere Aktionen*, destructive
		* items last, behind a hairline. Filters belong to the list in the body, never to the header.
		*/
		const props = __props;
		const safe = (0, vue_exports.computed)(() => props.more.filter((a) => !a.danger));
		const danger = (0, vue_exports.computed)(() => props.more.filter((a) => a.danger));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: __props.title }, null, _parent));
			_push(`<header class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-page__part--dash": __props.dashboard }, "adm-page__head"])}"><div class="adm-page__titles"><h1 class="adm-page__title" tabindex="-1">${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</h1><p class="adm-page__context">${(0, server_renderer_exports.ssrInterpolate)(__props.context)}</p></div>`);
			if (_ctx.$slots.primary || __props.more.length) {
				_push(`<div class="adm-page__actions">`);
				if (__props.more.length) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary adm-page__more" }, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(` Weitere Aktionen `);
										_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: "chevron-down",
											size: 16
										}, null, _parent, _scopeId));
									} else return [(0, vue_exports.createTextVNode)(" Weitere Aktionen "), (0, vue_exports.createVNode)(AdminIcon_default, {
										name: "chevron-down",
										size: 16
									})];
								}),
								_: 1
							}, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
										class: "adm-menu",
										align: "end",
										"side-offset": 8
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push(`<!--[-->`);
												(0, server_renderer_exports.ssrRenderList)(safe.value, (action) => {
													_push(`<!--[-->`);
													if (action.href && action.external) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", action.href)} class="adm-menu__item" target="_blank" rel="noopener"${_scopeId}>`);
																if (action.icon) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																	name: action.icon,
																	size: 20
																}, null, _parent, _scopeId));
																else _push(`<!---->`);
																_push(` ${(0, server_renderer_exports.ssrInterpolate)(action.label)}</a>`);
															} else return [(0, vue_exports.createVNode)("a", {
																href: action.href,
																class: "adm-menu__item",
																target: "_blank",
																rel: "noopener"
															}, [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
																key: 0,
																name: action.icon,
																size: 20
															}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)], 8, ["href"])];
														}),
														_: 2
													}, _parent, _scopeId));
													else if (action.href) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																href: action.href,
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		if (action.icon) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: action.icon,
																			size: 20
																		}, null, _parent, _scopeId));
																		else _push(`<!---->`);
																		_push(` ${(0, server_renderer_exports.ssrInterpolate)(action.label)}`);
																	} else return [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
																		key: 0,
																		name: action.icon,
																		size: 20
																	}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)];
																}),
																_: 2
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																href: action.href,
																class: "adm-menu__item"
															}, {
																default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
																	key: 0,
																	name: action.icon,
																	size: 20
																}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
																_: 2
															}, 1032, ["href"])];
														}),
														_: 2
													}, _parent, _scopeId));
													else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => action.run?.()
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																if (action.icon) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																	name: action.icon,
																	size: 20
																}, null, _parent, _scopeId));
																else _push(`<!---->`);
																_push(` ${(0, server_renderer_exports.ssrInterpolate)(action.label)}`);
															} else return [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
																key: 0,
																name: action.icon,
																size: 20
															}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)];
														}),
														_: 2
													}, _parent, _scopeId));
													_push(`<!--]-->`);
												});
												_push(`<!--]-->`);
												if (safe.value.length && danger.value.length) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
												else _push(`<!---->`);
												_push(`<!--[-->`);
												(0, server_renderer_exports.ssrRenderList)(danger.value, (action) => {
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: action.label,
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => action.run?.()
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																if (action.icon) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																	name: action.icon,
																	size: 20
																}, null, _parent, _scopeId));
																else _push(`<!---->`);
																_push(` ${(0, server_renderer_exports.ssrInterpolate)(action.label)}`);
															} else return [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
																key: 0,
																name: action.icon,
																size: 20
															}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)];
														}),
														_: 2
													}, _parent, _scopeId));
												});
												_push(`<!--]-->`);
											} else return [
												((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(safe.value, (action) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: action.label }, [action.href && action.external ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 0,
														"as-child": ""
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
															href: action.href,
															class: "adm-menu__item",
															target: "_blank",
															rel: "noopener"
														}, [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
															key: 0,
															name: action.icon,
															size: 20
														}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)], 8, ["href"])]),
														_: 2
													}, 1024)) : action.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 1,
														"as-child": ""
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: action.href,
															class: "adm-menu__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
																key: 0,
																name: action.icon,
																size: 20
															}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
															_: 2
														}, 1032, ["href"])]),
														_: 2
													}, 1024)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 2,
														class: "adm-menu__item",
														onSelect: ($event) => action.run?.()
													}, {
														default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
															key: 0,
															name: action.icon,
															size: 20
														}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
														_: 2
													}, 1032, ["onSelect"]))], 64);
												}), 128)),
												safe.value.length && danger.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuSeparator_default), {
													key: 0,
													class: "adm-menu__sep"
												})) : (0, vue_exports.createCommentVNode)("", true),
												((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(danger.value, (action) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: action.label,
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => action.run?.()
													}, {
														default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
															key: 0,
															name: action.icon,
															size: 20
														}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
														_: 2
													}, 1032, ["onSelect"]);
												}), 128))
											];
										}),
										_: 1
									}, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
										class: "adm-menu",
										align: "end",
										"side-offset": 8
									}, {
										default: (0, vue_exports.withCtx)(() => [
											((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(safe.value, (action) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: action.label }, [action.href && action.external ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 0,
													"as-child": ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
														href: action.href,
														class: "adm-menu__item",
														target: "_blank",
														rel: "noopener"
													}, [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
														key: 0,
														name: action.icon,
														size: 20
													}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)], 8, ["href"])]),
													_: 2
												}, 1024)) : action.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 1,
													"as-child": ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: action.href,
														class: "adm-menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
															key: 0,
															name: action.icon,
															size: 20
														}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
														_: 2
													}, 1032, ["href"])]),
													_: 2
												}, 1024)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 2,
													class: "adm-menu__item",
													onSelect: ($event) => action.run?.()
												}, {
													default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
														key: 0,
														name: action.icon,
														size: 20
													}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
													_: 2
												}, 1032, ["onSelect"]))], 64);
											}), 128)),
											safe.value.length && danger.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuSeparator_default), {
												key: 0,
												class: "adm-menu__sep"
											})) : (0, vue_exports.createCommentVNode)("", true),
											((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(danger.value, (action) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: action.label,
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => action.run?.()
												}, {
													default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
														key: 0,
														name: action.icon,
														size: 20
													}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
													_: 2
												}, 1032, ["onSelect"]);
											}), 128))
										]),
										_: 1
									})];
								}),
								_: 1
							}, _parent, _scopeId));
						} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary adm-page__more" }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Weitere Aktionen "), (0, vue_exports.createVNode)(AdminIcon_default, {
								name: "chevron-down",
								size: 16
							})]),
							_: 1
						}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
								class: "adm-menu",
								align: "end",
								"side-offset": 8
							}, {
								default: (0, vue_exports.withCtx)(() => [
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(safe.value, (action) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: action.label }, [action.href && action.external ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: 0,
											"as-child": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
												href: action.href,
												class: "adm-menu__item",
												target: "_blank",
												rel: "noopener"
											}, [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
												key: 0,
												name: action.icon,
												size: 20
											}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)], 8, ["href"])]),
											_: 2
										}, 1024)) : action.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: 1,
											"as-child": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: action.href,
												class: "adm-menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
													key: 0,
													name: action.icon,
													size: 20
												}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
												_: 2
											}, 1032, ["href"])]),
											_: 2
										}, 1024)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: 2,
											class: "adm-menu__item",
											onSelect: ($event) => action.run?.()
										}, {
											default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
												key: 0,
												name: action.icon,
												size: 20
											}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
											_: 2
										}, 1032, ["onSelect"]))], 64);
									}), 128)),
									safe.value.length && danger.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuSeparator_default), {
										key: 0,
										class: "adm-menu__sep"
									})) : (0, vue_exports.createCommentVNode)("", true),
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(danger.value, (action) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
											key: action.label,
											class: "adm-menu__item adm-menu__item--danger",
											onSelect: ($event) => action.run?.()
										}, {
											default: (0, vue_exports.withCtx)(() => [action.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
												key: 0,
												name: action.icon,
												size: 20
											}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(action.label), 1)]),
											_: 2
										}, 1032, ["onSelect"]);
									}), 128))
								]),
								_: 1
							})]),
							_: 1
						})];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "primary", {}, null, _push, _parent);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</header>`);
			if (__props.readOnly) {
				_push(`<p class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-page__part--dash": __props.dashboard }, "adm-page__readonly"])}">`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "eye",
					size: 16
				}, null, _parent));
				_push(` Du kannst diese Seite ansehen, aber nicht ändern. </p>`);
			} else _push(`<!---->`);
			_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-page__part--dash": __props.dashboard }, "adm-page__body"])}">`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Admin/AdminPage.vue
var _sfc_setup = AdminPage_vue_vue_type_script_setup_true_lang_default.setup;
AdminPage_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Admin/AdminPage.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AdminPage_default = AdminPage_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { useHealth as a, TooltipContent_default as c, DropdownMenuLabel_default as d, ZUBEHOER_TABS as i, TooltipRoot_default as l, AdminLayout_default as n, TooltipTrigger_default as o, railResizing as r, TooltipPortal_default as s, AdminPage_default as t, TooltipProvider_default as u };
