import { c as vue_exports, l as __exportAll, o as router, r as link_default, u as __reExport } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, i as Toast_default, l as isIconName, n as useMenus, r as useShared, t as resolveHref } from "./useShared-B1ZdimaV.js";
import { A as useEventListener$1, C as useId, D as useBodyScrollLock, E as useEmitAsProps, F as isClient$1, H as createContext, I as reactiveOmit, L as refAutoReset, M as useVModel, P as createSharedComposable, R as useDebounceFn, S as Presence_default, T as useForwardExpose, V as getActiveElement, _ as DismissableLayer_default, b as Primitive, c as FIRST_LAST_KEYS, d as SELECTION_KEYS, f as focusFirst$1, g as FocusScope_default, h as isPointerInGraceArea, i as Teleport_default, j as useResizeObserver, k as unrefElement$1, l as ITEM_SELECT, m as isMouseEvent, p as getOpenState$1, t as Dialog_default, u as LAST_KEYS, w as useHideOthers } from "./Dialog-DGnwH3Iu.js";
import { t as useArrowNavigation } from "./useArrowNavigation-CG8Juen5.js";
import { t as useDirection } from "./useDirection-CU7rFtRo.js";
import { o as useCollection, t as RovingFocusGroup_default } from "./RovingFocusGroup-HJTJn8ZA.js";
import { _ as provideShell, b as remember, g as useConsent, h as provideConsent, m as CookieConsent_default, n as CompareTray_default, p as DemoBadge_default, t as useShortcuts, v as useShell, x as useSearch, y as readRecent } from "./useShortcuts-DQyB2dUf.js";
//#region node_modules/reka-ui/dist/shared/useFocusGuards.js
/** Number of components which have requested interest to have focus guards */
var count = 0;
/**
* Injects a pair of focus guards at the edges of the whole DOM tree
* to ensure `focusin` & `focusout` events can be caught consistently.
*/
function useFocusGuards() {
	(0, vue_exports.watchEffect)((cleanupFn) => {
		if (!isClient$1) return;
		const edgeGuards = document.querySelectorAll("[data-reka-focus-guard]");
		document.body.insertAdjacentElement("afterbegin", edgeGuards[0] ?? createFocusGuard());
		document.body.insertAdjacentElement("beforeend", edgeGuards[1] ?? createFocusGuard());
		count++;
		cleanupFn(() => {
			if (count === 1) document.querySelectorAll("[data-reka-focus-guard]").forEach((node) => node.remove());
			count--;
		});
	});
}
function createFocusGuard() {
	const element = document.createElement("span");
	element.setAttribute("data-reka-focus-guard", "");
	element.tabIndex = 0;
	element.style.outline = "none";
	element.style.opacity = "0";
	element.style.position = "fixed";
	element.style.pointerEvents = "none";
	return element;
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useForwardProps.js
/**
* The `useForwardProps` function in TypeScript takes in a set of props and returns a computed value
* that combines default props with assigned props from the current instance.
* @param {T} props - The `props` parameter is an object that represents the props passed to a
* component.
* @returns computed value that combines the default props, preserved props, and assigned props.
*/
function useForwardProps(props) {
	const vm = (0, vue_exports.getCurrentInstance)();
	const defaultProps = Object.keys(vm?.type.props ?? {}).reduce((prev, curr) => {
		const defaultValue = (vm?.type.props[curr]).default;
		if (defaultValue !== void 0) prev[curr] = defaultValue;
		return prev;
	}, {});
	const refProps = (0, vue_exports.toRef)(props);
	return (0, vue_exports.computed)(() => {
		const preservedProps = {};
		const assignedProps = vm?.vnode.props ?? {};
		Object.keys(assignedProps).forEach((key) => {
			preservedProps[(0, vue_exports.camelize)(key)] = assignedProps[key];
		});
		return Object.keys({
			...defaultProps,
			...preservedProps
		}).reduce((prev, curr) => {
			if (refProps.value[curr] !== void 0) prev[curr] = refProps.value[curr];
			return prev;
		}, {});
	});
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useForwardPropsEmits.js
function useForwardPropsEmits(props, emit) {
	const parsedProps = useForwardProps(props);
	const emitsAsProps = emit ? useEmitAsProps(emit) : {};
	return (0, vue_exports.computed)(() => ({
		...parsedProps.value,
		...emitsAsProps
	}));
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useSize.js
function useSize(element) {
	const size = (0, vue_exports.ref)();
	const width = (0, vue_exports.computed)(() => size.value?.width ?? 0);
	const height = (0, vue_exports.computed)(() => size.value?.height ?? 0);
	let resizeObserver;
	(0, vue_exports.onMounted)(() => {
		const el = unrefElement$1(element);
		if (el) {
			size.value = {
				width: el.offsetWidth,
				height: el.offsetHeight
			};
			resizeObserver = new ResizeObserver((entries) => {
				if (!Array.isArray(entries)) return;
				if (!entries.length) return;
				const entry = entries[0];
				let width$1;
				let height$1;
				if ("borderBoxSize" in entry) {
					const borderSizeEntry = entry.borderBoxSize;
					const borderSize = Array.isArray(borderSizeEntry) ? borderSizeEntry[0] : borderSizeEntry;
					width$1 = borderSize.inlineSize;
					height$1 = borderSize.blockSize;
				} else {
					width$1 = el.offsetWidth;
					height$1 = el.offsetHeight;
				}
				size.value = {
					width: width$1,
					height: height$1
				};
			});
			resizeObserver.observe(el, { box: "border-box" });
		} else size.value = void 0;
	});
	(0, vue_exports.onUnmounted)(() => {
		resizeObserver?.disconnect();
		resizeObserver = void 0;
	});
	return {
		width,
		height
	};
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useTypeahead.js
function useTypeahead(callback) {
	const search = refAutoReset("", 1e3);
	const handleTypeaheadSearch = (key, items) => {
		search.value = search.value + key;
		if (callback) callback(key);
		else {
			const currentItem = getActiveElement();
			const itemsWithTextValue = items.map((item) => ({
				...item,
				textValue: item.value?.textValue ?? item.ref.textContent?.trim() ?? ""
			}));
			const currentMatch = itemsWithTextValue.find((item) => item.ref === currentItem);
			const nextMatch = getNextMatch(itemsWithTextValue.map((item) => item.textValue), search.value, currentMatch?.textValue);
			const newItem = itemsWithTextValue.find((item) => item.textValue === nextMatch);
			if (newItem) newItem.ref.focus();
			return newItem?.ref;
		}
	};
	const resetTypeahead = () => {
		search.value = "";
	};
	return {
		search,
		handleTypeaheadSearch,
		resetTypeahead
	};
}
/**
* Wraps an array around itself at a given start index
* Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
*/
function wrapArray(array, startIndex) {
	return array.map((_, index) => array[(startIndex + index) % array.length]);
}
/**
* This is the "meat" of the typeahead matching logic. It takes in all the values,
* the search and the current match, and returns the next match (or `undefined`).
*
* We normalize the search because if a user has repeatedly pressed a character,
* we want the exact same behavior as if we only had that one character
* (ie. cycle through options starting with that character)
*
* We also reorder the values by wrapping the array around the current match.
* This is so we always look forward from the current match, and picking the first
* match will always be the correct one.
*
* Finally, if the normalized search is exactly one character, we exclude the
* current match from the values because otherwise it would be the first to match always
* and focus would never move. This is as opposed to the regular case, where we
* don't want focus to move if the current match still matches.
*/
function getNextMatch(values, search, currentMatch) {
	const normalizedSearch = search.length > 1 && Array.from(search).every((char) => char === search[0]) ? search[0] : search;
	const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
	let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
	if (normalizedSearch.length === 1) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
	const nextMatch = wrappedValues.find((value) => value.toLowerCase().startsWith(normalizedSearch.toLowerCase()));
	return nextMatch !== currentMatch ? nextMatch : void 0;
}
//#endregion
//#region node_modules/reka-ui/dist/VisuallyHidden/VisuallyHidden.js
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
//#endregion
//#region node_modules/reka-ui/dist/Popper/PopperRoot.js
var [injectPopperRootContext, providePopperRootContext] = /*#__PURE__*/ createContext("PopperRoot");
var PopperRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "PopperRoot",
	setup(__props) {
		const anchor = (0, vue_exports.ref)();
		providePopperRootContext({
			anchor,
			onAnchorChange: (element) => anchor.value = element
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.renderSlot)(_ctx.$slots, "default");
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popper/PopperAnchor.js
var PopperAnchor_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopperAnchor",
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
			required: false
		}
	},
	setup(__props) {
		const props = __props;
		const { forwardRef, currentElement } = useForwardExpose();
		const rootContext = injectPopperRootContext();
		(0, vue_exports.watchPostEffect)(() => {
			rootContext.onAnchorChange(props.reference ?? currentElement.value);
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				ref: (0, vue_exports.unref)(forwardRef),
				as: _ctx.as,
				"as-child": _ctx.asChild
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, ["as", "as-child"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popper/utils.js
function isNotNull(value) {
	return value !== null;
}
function transformOrigin(options) {
	return {
		name: "transformOrigin",
		options,
		fn(data) {
			const { placement, rects, middlewareData } = data;
			const isArrowHidden = middlewareData.arrow?.centerOffset !== 0;
			const arrowWidth = isArrowHidden ? 0 : options.arrowWidth;
			const arrowHeight = isArrowHidden ? 0 : options.arrowHeight;
			const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
			const noArrowAlignX = {
				start: options.dir === "rtl" ? "100%" : "0%",
				center: "50%",
				end: options.dir === "rtl" ? "0%" : "100%"
			}[placedAlign];
			const noArrowAlignY = {
				start: "0%",
				center: "50%",
				end: "100%"
			}[placedAlign];
			const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2;
			const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2;
			let x = "";
			let y = "";
			if (placedSide === "bottom") {
				x = isArrowHidden ? noArrowAlignX : `${arrowXCenter}px`;
				y = `${-arrowHeight}px`;
			} else if (placedSide === "top") {
				x = isArrowHidden ? noArrowAlignX : `${arrowXCenter}px`;
				y = `${rects.floating.height + arrowHeight}px`;
			} else if (placedSide === "right") {
				x = `${-arrowHeight}px`;
				y = isArrowHidden ? noArrowAlignY : `${arrowYCenter}px`;
			} else if (placedSide === "left") {
				x = `${rects.floating.width + arrowHeight}px`;
				y = isArrowHidden ? noArrowAlignY : `${arrowYCenter}px`;
			}
			return { data: {
				x,
				y
			} };
		}
	};
}
function getSideAndAlignFromPlacement(placement) {
	const [side, align = "center"] = placement.split("-");
	return [side, align];
}
//#endregion
//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
/**
* Custom positioning reference element.
* @see https://floating-ui.com/docs/virtual-elements
*/
var sides = [
	"top",
	"right",
	"bottom",
	"left"
];
var min = Math.min;
var max = Math.max;
var round = Math.round;
var floor = Math.floor;
var createCoords = (v) => ({
	x: v,
	y: v
});
var oppositeSideMap = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function clamp(start, value, end) {
	return max(start, min(value, end));
}
function evaluate(value, param) {
	return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
	return placement.split("-")[0];
}
function getAlignment(placement) {
	return placement.split("-")[1];
}
function getOppositeAxis(axis) {
	return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
	return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
	const firstChar = placement[0];
	return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
function getAlignmentAxis(placement) {
	return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
	if (rtl === void 0) rtl = false;
	const alignment = getAlignment(placement);
	const alignmentAxis = getAlignmentAxis(placement);
	const length = getAxisLength(alignmentAxis);
	let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
	if (rects.reference[length] > rects.floating[length]) mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
	return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
	const oppositePlacement = getOppositePlacement(placement);
	return [
		getOppositeAlignmentPlacement(placement),
		oppositePlacement,
		getOppositeAlignmentPlacement(oppositePlacement)
	];
}
function getOppositeAlignmentPlacement(placement) {
	return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
	switch (side) {
		case "top":
		case "bottom":
			if (rtl) return isStart ? rlPlacement : lrPlacement;
			return isStart ? lrPlacement : rlPlacement;
		case "left":
		case "right": return isStart ? tbPlacement : btPlacement;
		default: return [];
	}
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
	const alignment = getAlignment(placement);
	let list = getSideList(getSide(placement), direction === "start", rtl);
	if (alignment) {
		list = list.map((side) => side + "-" + alignment);
		if (flipAlignment) list = list.concat(list.map(getOppositeAlignmentPlacement));
	}
	return list;
}
function getOppositePlacement(placement) {
	const side = getSide(placement);
	return oppositeSideMap[side] + placement.slice(side.length);
}
function expandPaddingObject(padding) {
	var _padding$top, _padding$right, _padding$bottom, _padding$left;
	return {
		top: (_padding$top = padding.top) != null ? _padding$top : 0,
		right: (_padding$right = padding.right) != null ? _padding$right : 0,
		bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
		left: (_padding$left = padding.left) != null ? _padding$left : 0
	};
}
function getPaddingObject(padding) {
	return typeof padding !== "number" ? expandPaddingObject(padding) : {
		top: padding,
		right: padding,
		bottom: padding,
		left: padding
	};
}
function rectToClientRect(rect) {
	const { x, y, width, height } = rect;
	return {
		width,
		height,
		top: y,
		left: x,
		right: x + width,
		bottom: y + height,
		x,
		y
	};
}
//#endregion
//#region node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
	let { reference, floating } = _ref;
	const sideAxis = getSideAxis(placement);
	const alignmentAxis = getAlignmentAxis(placement);
	const alignLength = getAxisLength(alignmentAxis);
	const side = getSide(placement);
	const isVertical = sideAxis === "y";
	const commonX = reference.x + reference.width / 2 - floating.width / 2;
	const commonY = reference.y + reference.height / 2 - floating.height / 2;
	const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
	let coords;
	switch (side) {
		case "top":
			coords = {
				x: commonX,
				y: reference.y - floating.height
			};
			break;
		case "bottom":
			coords = {
				x: commonX,
				y: reference.y + reference.height
			};
			break;
		case "right":
			coords = {
				x: reference.x + reference.width,
				y: commonY
			};
			break;
		case "left":
			coords = {
				x: reference.x - floating.width,
				y: commonY
			};
			break;
		default: coords = {
			x: reference.x,
			y: reference.y
		};
	}
	const alignment = getAlignment(placement);
	if (alignment) coords[alignmentAxis] += commonAlign * (alignment === "end" ? 1 : -1) * (rtl && isVertical ? -1 : 1);
	return coords;
}
/**
* Resolves with an object of overflow side offsets that determine how much the
* element is overflowing a given clipping boundary on each side.
* - positive = overflowing the boundary by that number of pixels
* - negative = how many pixels left before it will overflow
* - 0 = lies flush with the boundary
* @see https://floating-ui.com/docs/detectOverflow
*/
async function detectOverflow(state, options) {
	var _await$platform$isEle;
	if (options === void 0) options = {};
	const { x, y, platform, rects, elements, strategy } = state;
	const { boundary = "clippingAncestors", rootBoundary = "viewport", elementContext = "floating", altBoundary = false, padding = 0 } = evaluate(options, state);
	const paddingObject = getPaddingObject(padding);
	const element = elements[altBoundary ? elementContext === "floating" ? "reference" : "floating" : elementContext];
	const clippingClientRect = rectToClientRect(await platform.getClippingRect({
		element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating)),
		boundary,
		rootBoundary,
		strategy
	}));
	const rect = elementContext === "floating" ? {
		x,
		y,
		width: rects.floating.width,
		height: rects.floating.height
	} : rects.reference;
	const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
	const offsetScale = await (platform.isElement == null ? void 0 : platform.isElement(offsetParent)) && await (platform.getScale == null ? void 0 : platform.getScale(offsetParent)) || {
		x: 1,
		y: 1
	};
	const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements,
		rect,
		offsetParent,
		strategy
	}) : rect);
	return {
		top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
		bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
		left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
		right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
	};
}
var MAX_RESET_COUNT = 50;
/**
* Computes the `x` and `y` coordinates that will place the floating element
* next to a given reference element.
*
* This export does not have any `platform` interface logic. You will need to
* write one for the platform you are using Floating UI with.
*/
var computePosition$1 = async (reference, floating, config) => {
	const { placement = "bottom", strategy = "absolute", middleware = [], platform } = config;
	const platformWithDetectOverflow = platform.detectOverflow ? platform : {
		...platform,
		detectOverflow
	};
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
	let rects = await platform.getElementRects({
		reference,
		floating,
		strategy
	});
	let { x, y } = computeCoordsFromPlacement(rects, placement, rtl);
	let statefulPlacement = placement;
	let resetCount = 0;
	const middlewareData = {};
	for (let i = 0; i < middleware.length; i++) {
		const currentMiddleware = middleware[i];
		if (!currentMiddleware) continue;
		const { name, fn } = currentMiddleware;
		const { x: nextX, y: nextY, data, reset } = await fn({
			x,
			y,
			initialPlacement: placement,
			placement: statefulPlacement,
			strategy,
			middlewareData,
			rects,
			platform: platformWithDetectOverflow,
			elements: {
				reference,
				floating
			}
		});
		x = nextX != null ? nextX : x;
		y = nextY != null ? nextY : y;
		middlewareData[name] = {
			...middlewareData[name],
			...data
		};
		if (reset && resetCount < MAX_RESET_COUNT) {
			resetCount++;
			if (typeof reset === "object") {
				if (reset.placement) statefulPlacement = reset.placement;
				if (reset.rects) rects = reset.rects === true ? await platform.getElementRects({
					reference,
					floating,
					strategy
				}) : reset.rects;
				({x, y} = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
			}
			i = -1;
		}
	}
	return {
		x,
		y,
		placement: statefulPlacement,
		strategy,
		middlewareData
	};
};
/**
* Provides data to position an inner element of the floating element so that it
* appears centered to the reference element.
* @see https://floating-ui.com/docs/arrow
*/
var arrow$2 = (options) => ({
	name: "arrow",
	options,
	async fn(state) {
		const { x, y, placement, rects, platform, elements, middlewareData } = state;
		const { element, padding = 0 } = evaluate(options, state) || {};
		if (element == null) return {};
		const paddingObject = getPaddingObject(padding);
		const coords = {
			x,
			y
		};
		const axis = getAlignmentAxis(placement);
		const length = getAxisLength(axis);
		const arrowDimensions = await platform.getDimensions(element);
		const isYAxis = axis === "y";
		const minProp = isYAxis ? "top" : "left";
		const maxProp = isYAxis ? "bottom" : "right";
		const clientProp = isYAxis ? "clientHeight" : "clientWidth";
		const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
		const startDiff = coords[axis] - rects.reference[axis];
		const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
		let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
		if (!clientSize || !await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent))) clientSize = elements.floating[clientProp] || rects.floating[length];
		const centerToReference = endDiff / 2 - startDiff / 2;
		const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
		const minPadding = min(paddingObject[minProp], largestPossiblePadding);
		const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);
		const max = clientSize - arrowDimensions[length] - maxPadding;
		const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
		const offset = clamp(minPadding, center, max);
		const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset && rects.reference[length] / 2 - (center < minPadding ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
		const alignmentOffset = shouldAddOffset ? center < minPadding ? center - minPadding : center - max : 0;
		return {
			[axis]: coords[axis] + alignmentOffset,
			data: {
				[axis]: offset,
				centerOffset: center - offset - alignmentOffset,
				...shouldAddOffset && { alignmentOffset }
			},
			reset: shouldAddOffset
		};
	}
});
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip$1 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "flip",
		options,
		async fn(state) {
			var _middlewareData$arrow, _middlewareData$flip;
			const { placement, middlewareData, rects, initialPlacement, platform, elements } = state;
			const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = true, fallbackPlacements: specifiedFallbackPlacements, fallbackStrategy = "bestFit", fallbackAxisSideDirection = "none", flipAlignment = true, ...detectOverflowOptions } = evaluate(options, state);
			if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
			const side = getSide(placement);
			const initialSideAxis = getSideAxis(initialPlacement);
			const isBasePlacement = getSide(initialPlacement) === initialPlacement;
			const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
			const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
			const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
			if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
			const placements = [initialPlacement, ...fallbackPlacements];
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const overflows = [];
			let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
			if (checkMainAxis) overflows.push(overflow[side]);
			if (checkCrossAxis) {
				const sides = getAlignmentSides(placement, rects, rtl);
				overflows.push(overflow[sides[0]], overflow[sides[1]]);
			}
			overflowsData = [...overflowsData, {
				placement,
				overflows
			}];
			if (!overflows.every((side) => side <= 0)) {
				var _middlewareData$flip2, _overflowsData$filter;
				const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
				const nextPlacement = placements[nextIndex];
				if (nextPlacement) {
					if (!(checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false) || overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) return {
						data: {
							index: nextIndex,
							overflows: overflowsData
						},
						reset: { placement: nextPlacement }
					};
				}
				let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
				if (!resetPlacement) switch (fallbackStrategy) {
					case "bestFit": {
						var _overflowsData$filter2;
						const placement = (_overflowsData$filter2 = overflowsData.filter((d) => {
							if (hasFallbackAxisSideDirection) {
								const currentSideAxis = getSideAxis(d.placement);
								return currentSideAxis === initialSideAxis || currentSideAxis === "y";
							}
							return true;
						}).map((d) => [d.placement, d.overflows.filter((overflow) => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
						if (placement) resetPlacement = placement;
						break;
					}
					case "initialPlacement": resetPlacement = initialPlacement;
				}
				if (placement !== resetPlacement) return { reset: { placement: resetPlacement } };
			}
			return {};
		}
	};
};
function getSideOffsets(overflow, rect) {
	return {
		top: overflow.top - rect.height,
		right: overflow.right - rect.width,
		bottom: overflow.bottom - rect.height,
		left: overflow.left - rect.width
	};
}
function isAnySideFullyClipped(overflow) {
	return sides.some((side) => overflow[side] >= 0);
}
/**
* Provides data to hide the floating element in applicable situations, such as
* when it is not in the same clipping context as the reference element.
* @see https://floating-ui.com/docs/hide
*/
var hide$1 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "hide",
		options,
		async fn(state) {
			const { rects, platform } = state;
			const { strategy = "referenceHidden", ...detectOverflowOptions } = evaluate(options, state);
			switch (strategy) {
				case "referenceHidden": {
					const offsets = getSideOffsets(await platform.detectOverflow(state, {
						...detectOverflowOptions,
						elementContext: "reference"
					}), rects.reference);
					return { data: {
						referenceHiddenOffsets: offsets,
						referenceHidden: isAnySideFullyClipped(offsets)
					} };
				}
				case "escaped": {
					const offsets = getSideOffsets(await platform.detectOverflow(state, {
						...detectOverflowOptions,
						altBoundary: true
					}), rects.floating);
					return { data: {
						escapedOffsets: offsets,
						escaped: isAnySideFullyClipped(offsets)
					} };
				}
				default: return {};
			}
		}
	};
};
var originSides = /*#__PURE__*/ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
	const { placement, platform, elements } = state;
	const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
	const side = getSide(placement);
	const alignment = getAlignment(placement);
	const isVertical = getSideAxis(placement) === "y";
	const mainAxisMulti = originSides.has(side) ? -1 : 1;
	const crossAxisMulti = rtl && isVertical ? -1 : 1;
	const rawValue = evaluate(options, state);
	let { mainAxis, crossAxis, alignmentAxis } = typeof rawValue === "number" ? {
		mainAxis: rawValue,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: rawValue.mainAxis || 0,
		crossAxis: rawValue.crossAxis || 0,
		alignmentAxis: rawValue.alignmentAxis
	};
	if (alignment && typeof alignmentAxis === "number") crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
	return isVertical ? {
		x: crossAxis * crossAxisMulti,
		y: mainAxis * mainAxisMulti
	} : {
		x: mainAxis * mainAxisMulti,
		y: crossAxis * crossAxisMulti
	};
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset$1 = function(options) {
	if (options === void 0) options = 0;
	return {
		name: "offset",
		options,
		async fn(state) {
			var _middlewareData$offse, _middlewareData$arrow;
			const { x, y, placement, middlewareData } = state;
			const diffCoords = await convertValueToCoords(state, options);
			if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
			return {
				x: x + diffCoords.x,
				y: y + diffCoords.y,
				data: {
					...diffCoords,
					placement
				}
			};
		}
	};
};
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift$1 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "shift",
		options,
		async fn(state) {
			const { x, y, placement, platform } = state;
			const { mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = false, limiter = { fn: (_ref) => {
				let { x, y } = _ref;
				return {
					x,
					y
				};
			} }, ...detectOverflowOptions } = evaluate(options, state);
			const coords = {
				x,
				y
			};
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const crossAxis = getSideAxis(placement);
			const mainAxis = getOppositeAxis(crossAxis);
			let mainAxisCoord = coords[mainAxis];
			let crossAxisCoord = coords[crossAxis];
			const clampCoord = (axis, coord) => clamp(coord + overflow[axis === "y" ? "top" : "left"], coord, coord - overflow[axis === "y" ? "bottom" : "right"]);
			if (checkMainAxis) mainAxisCoord = clampCoord(mainAxis, mainAxisCoord);
			if (checkCrossAxis) crossAxisCoord = clampCoord(crossAxis, crossAxisCoord);
			const limitedCoords = limiter.fn({
				...state,
				[mainAxis]: mainAxisCoord,
				[crossAxis]: crossAxisCoord
			});
			return {
				...limitedCoords,
				data: {
					x: limitedCoords.x - x,
					y: limitedCoords.y - y,
					enabled: {
						[mainAxis]: checkMainAxis,
						[crossAxis]: checkCrossAxis
					}
				}
			};
		}
	};
};
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift$1 = function(options) {
	if (options === void 0) options = {};
	return {
		options,
		fn(state) {
			var _rawOffset$mainAxis, _rawOffset$crossAxis;
			const { x, y, placement, rects, middlewareData } = state;
			const { offset = 0, mainAxis: checkMainAxis = true, crossAxis: checkCrossAxis = true } = evaluate(options, state);
			const coords = {
				x,
				y
			};
			const crossAxis = getSideAxis(placement);
			const mainAxis = getOppositeAxis(crossAxis);
			let mainAxisCoord = coords[mainAxis];
			let crossAxisCoord = coords[crossAxis];
			const rawOffset = evaluate(offset, state);
			const computedOffset = typeof rawOffset === "number" ? {
				mainAxis: rawOffset,
				crossAxis: 0
			} : {
				mainAxis: (_rawOffset$mainAxis = rawOffset.mainAxis) != null ? _rawOffset$mainAxis : 0,
				crossAxis: (_rawOffset$crossAxis = rawOffset.crossAxis) != null ? _rawOffset$crossAxis : 0
			};
			if (checkMainAxis) {
				const len = mainAxis === "y" ? "height" : "width";
				const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
				const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
				if (mainAxisCoord < limitMin) mainAxisCoord = limitMin;
				else if (mainAxisCoord > limitMax) mainAxisCoord = limitMax;
			}
			if (checkCrossAxis) {
				var _middlewareData$offse, _middlewareData$offse2;
				const len = mainAxis === "y" ? "width" : "height";
				const isOriginSide = originSides.has(getSide(placement));
				const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
				const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
				if (crossAxisCoord < limitMin) crossAxisCoord = limitMin;
				else if (crossAxisCoord > limitMax) crossAxisCoord = limitMax;
			}
			return {
				[mainAxis]: mainAxisCoord,
				[crossAxis]: crossAxisCoord
			};
		}
	};
};
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size$1 = function(options) {
	if (options === void 0) options = {};
	return {
		name: "size",
		options,
		async fn(state) {
			const { placement, rects, platform, elements } = state;
			const { apply = () => {}, ...detectOverflowOptions } = evaluate(options, state);
			const overflow = await platform.detectOverflow(state, detectOverflowOptions);
			const side = getSide(placement);
			const alignment = getAlignment(placement);
			const isYAxis = getSideAxis(placement) === "y";
			const { width, height } = rects.floating;
			let heightSide;
			let widthSide;
			if (side === "top" || side === "bottom") {
				heightSide = side;
				widthSide = alignment === (await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
			} else {
				widthSide = side;
				heightSide = alignment === "end" ? "top" : "bottom";
			}
			const maximumClippingHeight = height - overflow.top - overflow.bottom;
			const maximumClippingWidth = width - overflow.left - overflow.right;
			const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
			const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
			const shiftData = state.middlewareData.shift;
			const noShift = !shiftData;
			let availableHeight = overflowAvailableHeight;
			let availableWidth = overflowAvailableWidth;
			if (shiftData != null && shiftData.enabled.x) availableWidth = maximumClippingWidth;
			if (shiftData != null && shiftData.enabled.y) availableHeight = maximumClippingHeight;
			if (noShift && !alignment) {
				if (isYAxis) availableWidth = width - 2 * max(overflow.left, overflow.right);
				else availableHeight = height - 2 * max(overflow.top, overflow.bottom);
			}
			await apply({
				...state,
				availableWidth,
				availableHeight
			});
			const nextDimensions = await platform.getDimensions(elements.floating);
			if (width !== nextDimensions.width || height !== nextDimensions.height) return { reset: { rects: true } };
			return {};
		}
	};
};
//#endregion
//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
	return typeof window !== "undefined";
}
function getNodeName(node) {
	if (isNode(node)) return (node.nodeName || "").toLowerCase();
	return "#document";
}
function getWindow(node) {
	var _node$ownerDocument;
	return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
	var _ref;
	return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
	if (!hasWindow()) return false;
	return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
	if (!hasWindow()) return false;
	return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
	if (!hasWindow()) return false;
	return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
	if (!hasWindow() || typeof ShadowRoot === "undefined") return false;
	return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
	const { overflow, overflowX, overflowY, display } = getComputedStyle$1(element);
	return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
}
function isTableElement(element) {
	return /^(table|td|th)$/.test(getNodeName(element));
}
function isTopLayer(element) {
	try {
		if (element.matches(":popover-open")) return true;
	} catch (_e) {}
	try {
		return element.matches(":modal");
	} catch (_e) {
		return false;
	}
}
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
var containRe = /paint|layout|strict|content/;
var isNotNone = (value) => !!value && value !== "none";
var isWebKitValue;
function isContainingBlock(elementOrCss) {
	const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss;
	return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
}
function getContainingBlock(element) {
	let currentNode = getParentNode(element);
	while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
		if (isContainingBlock(currentNode)) return currentNode;
		else if (isTopLayer(currentNode)) return null;
		currentNode = getParentNode(currentNode);
	}
	return null;
}
function isWebKit() {
	if (isWebKitValue == null) isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
	return isWebKitValue;
}
function isLastTraversableNode(node) {
	return /^(html|body|#document)$/.test(getNodeName(node));
}
function getComputedStyle$1(element) {
	return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
	if (isElement(element)) return {
		scrollLeft: element.scrollLeft,
		scrollTop: element.scrollTop
	};
	return {
		scrollLeft: element.scrollX,
		scrollTop: element.scrollY
	};
}
function getParentNode(node) {
	if (getNodeName(node) === "html") return node;
	const result = node.assignedSlot || node.parentNode || isShadowRoot(node) && node.host || getDocumentElement(node);
	return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
	const parentNode = getParentNode(node);
	if (isLastTraversableNode(parentNode)) return (node.ownerDocument || node).body;
	if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) return parentNode;
	return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
	var _node$ownerDocument2;
	if (list === void 0) list = [];
	if (traverseIframes === void 0) traverseIframes = true;
	const scrollableAncestor = getNearestOverflowAncestor(node);
	const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
	const win = getWindow(scrollableAncestor);
	if (isBody) {
		const frameElement = getFrameElement(win);
		return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
	} else return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function getFrameElement(win) {
	return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}
//#endregion
//#region node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
	const css = getComputedStyle$1(element);
	let width = parseFloat(css.width) || 0;
	let height = parseFloat(css.height) || 0;
	const hasOffset = isHTMLElement(element);
	const offsetWidth = hasOffset ? element.offsetWidth : width;
	const offsetHeight = hasOffset ? element.offsetHeight : height;
	const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
	if (shouldFallback) {
		width = offsetWidth;
		height = offsetHeight;
	}
	return {
		width,
		height,
		$: shouldFallback
	};
}
function unwrapElement$1(element) {
	return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
	const domElement = unwrapElement$1(element);
	if (!isHTMLElement(domElement)) return createCoords(1);
	const rect = domElement.getBoundingClientRect();
	const { width, height, $ } = getCssDimensions(domElement);
	let x = ($ ? round(rect.width) : rect.width) / width;
	let y = ($ ? round(rect.height) : rect.height) / height;
	if (!x || !Number.isFinite(x)) x = 1;
	if (!y || !Number.isFinite(y)) y = 1;
	return {
		x,
		y
	};
}
var noOffsets = /*#__PURE__*/ createCoords(0);
function getVisualOffsets(element) {
	const win = getWindow(element);
	if (!isWebKit() || !win.visualViewport) return noOffsets;
	return {
		x: win.visualViewport.offsetLeft,
		y: win.visualViewport.offsetTop
	};
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
	if (isFixed === void 0) isFixed = false;
	return !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow(element);
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
	if (includeScale === void 0) includeScale = false;
	if (isFixedStrategy === void 0) isFixedStrategy = false;
	const clientRect = element.getBoundingClientRect();
	const domElement = unwrapElement$1(element);
	let scale = createCoords(1);
	if (includeScale) {
		if (offsetParent) {
			if (isElement(offsetParent)) scale = getScale(offsetParent);
		} else scale = getScale(element);
	}
	const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
	let x = (clientRect.left + visualOffsets.x) / scale.x;
	let y = (clientRect.top + visualOffsets.y) / scale.y;
	let width = clientRect.width / scale.x;
	let height = clientRect.height / scale.y;
	if (domElement && offsetParent) {
		const win = getWindow(domElement);
		const offsetWin = isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
		let currentWin = win;
		let currentIFrame = getFrameElement(currentWin);
		while (currentIFrame && offsetWin !== currentWin) {
			const iframeScale = getScale(currentIFrame);
			const iframeRect = currentIFrame.getBoundingClientRect();
			const css = getComputedStyle$1(currentIFrame);
			const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
			const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
			x *= iframeScale.x;
			y *= iframeScale.y;
			width *= iframeScale.x;
			height *= iframeScale.y;
			x += left;
			y += top;
			currentWin = getWindow(currentIFrame);
			currentIFrame = getFrameElement(currentWin);
		}
	}
	return rectToClientRect({
		width,
		height,
		x,
		y
	});
}
function getWindowScrollBarX(element, rect) {
	const leftScroll = getNodeScroll(element).scrollLeft;
	if (!rect) return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
	return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
	const htmlRect = documentElement.getBoundingClientRect();
	return {
		x: htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect),
		y: htmlRect.top + scroll.scrollTop
	};
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
	let { elements, rect, offsetParent, strategy } = _ref;
	const isFixed = strategy === "fixed";
	const documentElement = getDocumentElement(offsetParent);
	const topLayer = elements ? isTopLayer(elements.floating) : false;
	if (offsetParent === documentElement || topLayer && isFixed) return rect;
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0
	};
	let scale = createCoords(1);
	const offsets = createCoords(0);
	const isOffsetParentAnElement = isHTMLElement(offsetParent);
	if (isOffsetParentAnElement || !isFixed) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
		if (isOffsetParentAnElement) {
			const offsetRect = getBoundingClientRect(offsetParent);
			scale = getScale(offsetParent);
			offsets.x = offsetRect.x + offsetParent.clientLeft;
			offsets.y = offsetRect.y + offsetParent.clientTop;
		}
	}
	const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
	return {
		width: rect.width * scale.x,
		height: rect.height * scale.y,
		x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
		y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
	};
}
function getClientRects(element) {
	return element.getClientRects ? Array.from(element.getClientRects()) : [];
}
function getDocumentRect(html) {
	const scroll = getNodeScroll(html);
	const body = html.ownerDocument.body;
	const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
	const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
	let x = -scroll.scrollLeft + getWindowScrollBarX(html);
	const y = -scroll.scrollTop;
	if (getComputedStyle$1(body).direction === "rtl") x += max(html.clientWidth, body.clientWidth) - width;
	return {
		width,
		height,
		x,
		y
	};
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy, rootBoundary) {
	if (rootBoundary === void 0) rootBoundary = "viewport";
	const isLayoutViewport = rootBoundary === "layoutViewport";
	const win = getWindow(element);
	const html = getDocumentElement(element);
	const visualViewport = win.visualViewport;
	let width = html.clientWidth;
	let height = html.clientHeight;
	let x = 0;
	let y = 0;
	if (visualViewport) {
		const layoutRelativeClientCoords = !isWebKit() || strategy === "fixed";
		if (isLayoutViewport) {
			if (!layoutRelativeClientCoords) {
				x = -visualViewport.offsetLeft;
				y = -visualViewport.offsetTop;
			}
		} else {
			width = visualViewport.width;
			height = visualViewport.height;
			if (layoutRelativeClientCoords) {
				x = visualViewport.offsetLeft;
				y = visualViewport.offsetTop;
			}
		}
	}
	if (getWindowScrollBarX(html) <= 0) {
		const doc = html.ownerDocument;
		const body = doc.body;
		const bodyStyles = getComputedStyle(body);
		const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
		const reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
		const gutter = getComputedStyle(html).scrollbarGutter === "stable both-edges" ? reservedWidth / 2 : reservedWidth;
		if (gutter <= SCROLLBAR_MAX) width -= gutter;
	}
	return {
		width,
		height,
		x,
		y
	};
}
function getInnerBoundingClientRect(element, strategy) {
	const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
	const top = clientRect.top + element.clientTop;
	const left = clientRect.left + element.clientLeft;
	const scale = getScale(element);
	return {
		width: element.clientWidth * scale.x,
		height: element.clientHeight * scale.y,
		x: left * scale.x,
		y: top * scale.y
	};
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
	let rect;
	if (clippingAncestor === "viewport" || clippingAncestor === "layoutViewport") rect = getViewportRect(element, strategy, clippingAncestor);
	else if (clippingAncestor === "document") rect = getDocumentRect(getDocumentElement(element));
	else if (isElement(clippingAncestor)) rect = getInnerBoundingClientRect(clippingAncestor, strategy);
	else {
		const visualOffsets = getVisualOffsets(element);
		rect = {
			x: clippingAncestor.x - visualOffsets.x,
			y: clippingAncestor.y - visualOffsets.y,
			width: clippingAncestor.width,
			height: clippingAncestor.height
		};
	}
	return rectToClientRect(rect);
}
function getClippingElementAncestors(element, cache) {
	const cachedResult = cache.get(element);
	if (cachedResult) return cachedResult;
	let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
	let lastKeptComputedStyle = null;
	const elementIsFixed = getComputedStyle$1(element).position === "fixed";
	let currentNode = elementIsFixed ? getParentNode(element) : element;
	while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
		const computedStyle = getComputedStyle$1(currentNode);
		const currentNodeIsContaining = isContainingBlock(currentNode);
		const lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? "fixed" : "";
		if (!currentNodeIsContaining && (lastPosition === "fixed" || lastPosition === "absolute" && computedStyle.position === "static")) result = result.filter((ancestor) => ancestor !== currentNode);
		else lastKeptComputedStyle = computedStyle;
		currentNode = getParentNode(currentNode);
	}
	cache.set(element, result);
	return result;
}
function getClippingRect(_ref) {
	let { element, boundary, rootBoundary, strategy } = _ref;
	const clippingAncestors = [...boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary), rootBoundary];
	const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
	let top = firstRect.top;
	let right = firstRect.right;
	let bottom = firstRect.bottom;
	let left = firstRect.left;
	for (let i = 1; i < clippingAncestors.length; i++) {
		const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
		top = max(rect.top, top);
		right = min(rect.right, right);
		bottom = min(rect.bottom, bottom);
		left = max(rect.left, left);
	}
	return {
		width: right - left,
		height: bottom - top,
		x: left,
		y: top
	};
}
function getDimensions(element) {
	const { width, height } = getCssDimensions(element);
	return {
		width,
		height
	};
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
	const isOffsetParentAnElement = isHTMLElement(offsetParent);
	const documentElement = getDocumentElement(offsetParent);
	const isFixed = strategy === "fixed";
	const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
	let scroll = {
		scrollLeft: 0,
		scrollTop: 0
	};
	const offsets = createCoords(0);
	if (isOffsetParentAnElement || !isFixed) {
		if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) scroll = getNodeScroll(offsetParent);
		if (isOffsetParentAnElement) {
			const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
			offsets.x = offsetRect.x + offsetParent.clientLeft;
			offsets.y = offsetRect.y + offsetParent.clientTop;
		}
	}
	if (!isOffsetParentAnElement && documentElement) offsets.x = getWindowScrollBarX(documentElement);
	const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
	return {
		x: rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x,
		y: rect.top + scroll.scrollTop - offsets.y - htmlOffset.y,
		width: rect.width,
		height: rect.height
	};
}
function isStaticPositioned(element) {
	return getComputedStyle$1(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
	if (!isHTMLElement(element) || getComputedStyle$1(element).position === "fixed") return null;
	if (polyfill) return polyfill(element);
	let rawOffsetParent = element.offsetParent;
	if (getDocumentElement(element) === rawOffsetParent) rawOffsetParent = rawOffsetParent.ownerDocument.body;
	return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
	const win = getWindow(element);
	if (isTopLayer(element)) return win;
	if (!isHTMLElement(element)) {
		let svgOffsetParent = getParentNode(element);
		while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
			if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) return svgOffsetParent;
			svgOffsetParent = getParentNode(svgOffsetParent);
		}
		return win;
	}
	let offsetParent = getTrueOffsetParent(element, polyfill);
	while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) offsetParent = getTrueOffsetParent(offsetParent, polyfill);
	if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) return win;
	return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
	const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
	const getDimensionsFn = this.getDimensions;
	const floatingDimensions = await getDimensionsFn(data.floating);
	return {
		reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
		floating: {
			x: 0,
			y: 0,
			width: floatingDimensions.width,
			height: floatingDimensions.height
		}
	};
};
function isRTL(element) {
	return getComputedStyle$1(element).direction === "rtl";
}
var platform = {
	convertOffsetParentRelativeRectToViewportRelativeRect,
	getDocumentElement,
	getClippingRect,
	getOffsetParent,
	getElementRects,
	getClientRects,
	getDimensions,
	getScale,
	isElement,
	isRTL
};
function rectsAreEqual(a, b) {
	return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function observeMove(element, onMove, ancestorResize) {
	let io = null;
	let timeoutId;
	const root = getDocumentElement(element);
	function cleanup() {
		var _io;
		clearTimeout(timeoutId);
		(_io = io) == null || _io.disconnect();
		io = null;
	}
	function refresh(skip, threshold) {
		if (skip === void 0) skip = false;
		if (threshold === void 0) threshold = 1;
		cleanup();
		const elementRectForRootMargin = element.getBoundingClientRect();
		const { left, top, width, height } = elementRectForRootMargin;
		if (!skip) onMove();
		if (!width || !height) return;
		const insetTop = floor(top);
		const insetRight = floor(root.clientWidth - (left + width));
		const insetBottom = floor(root.clientHeight - (top + height));
		const insetLeft = floor(left);
		const options = {
			rootMargin: -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px",
			threshold: max(0, min(1, threshold)) || 1
		};
		let isFirstUpdate = true;
		function handleObserve(entries) {
			const ratio = entries[0].intersectionRatio;
			if (!rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) return refresh();
			if (ratio !== threshold) {
				if (!isFirstUpdate) return refresh();
				if (!ratio) timeoutId = setTimeout(() => {
					refresh(false, 1e-7);
				}, 1e3);
				else refresh(false, ratio);
			}
			isFirstUpdate = false;
		}
		try {
			io = new IntersectionObserver(handleObserve, {
				...options,
				root: root.ownerDocument
			});
		} catch (_e) {
			io = new IntersectionObserver(handleObserve, options);
		}
		io.observe(element);
	}
	const win = getWindow(element);
	const handleResize = () => refresh(ancestorResize);
	win.addEventListener("resize", handleResize);
	refresh(true);
	return () => {
		win.removeEventListener("resize", handleResize);
		cleanup();
	};
}
/**
* Automatically updates the position of the floating element when necessary.
* Should only be called when the floating element is mounted on the DOM or
* visible on the screen.
* @returns cleanup function that should be invoked when the floating element is
* removed from the DOM or hidden from the screen.
* @see https://floating-ui.com/docs/autoUpdate
*/
function autoUpdate(reference, floating, update, options) {
	if (options === void 0) options = {};
	const { ancestorScroll = true, ancestorResize = true, elementResize = typeof ResizeObserver === "function", layoutShift = typeof IntersectionObserver === "function", animationFrame = false } = options;
	const referenceEl = unwrapElement$1(reference);
	const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
	ancestors.forEach((ancestor) => {
		ancestorScroll && ancestor.addEventListener("scroll", update);
		ancestorResize && ancestor.addEventListener("resize", update);
	});
	const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update, ancestorResize) : null;
	let reobserveFrame = -1;
	let resizeObserver = null;
	if (elementResize) {
		resizeObserver = new ResizeObserver((_ref) => {
			let [firstEntry] = _ref;
			if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
				resizeObserver.unobserve(floating);
				cancelAnimationFrame(reobserveFrame);
				reobserveFrame = requestAnimationFrame(() => {
					var _resizeObserver;
					(_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
				});
			}
			update();
		});
		if (referenceEl && !animationFrame) resizeObserver.observe(referenceEl);
		if (floating) resizeObserver.observe(floating);
	}
	let frameId;
	let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
	if (animationFrame) frameLoop();
	function frameLoop() {
		const nextRefRect = getBoundingClientRect(reference);
		if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) update();
		prevRefRect = nextRefRect;
		frameId = requestAnimationFrame(frameLoop);
	}
	update();
	return () => {
		var _resizeObserver2;
		ancestors.forEach((ancestor) => {
			ancestorScroll && ancestor.removeEventListener("scroll", update);
			ancestorResize && ancestor.removeEventListener("resize", update);
		});
		cleanupIo?.();
		(_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
		resizeObserver = null;
		if (animationFrame) cancelAnimationFrame(frameId);
	};
}
/**
* Modifies the placement by translating the floating element along the
* specified axes.
* A number (shorthand for `mainAxis` or distance), or an axes configuration
* object may be passed.
* @see https://floating-ui.com/docs/offset
*/
var offset = offset$1;
/**
* Optimizes the visibility of the floating element by shifting it in order to
* keep it in view when it will overflow the clipping boundary.
* @see https://floating-ui.com/docs/shift
*/
var shift = shift$1;
/**
* Optimizes the visibility of the floating element by flipping the `placement`
* in order to keep it in view when the preferred placement(s) will overflow the
* clipping boundary. Alternative to `autoPlacement`.
* @see https://floating-ui.com/docs/flip
*/
var flip = flip$1;
/**
* Provides data that allows you to change the size of the floating element —
* for instance, prevent it from overflowing the clipping boundary or match the
* width of the reference element.
* @see https://floating-ui.com/docs/size
*/
var size = size$1;
/**
* Provides data to hide the floating element in applicable situations, such as
* when it is not in the same clipping context as the reference element.
* @see https://floating-ui.com/docs/hide
*/
var hide = hide$1;
/**
* Provides data to position an inner element of the floating element so that it
* appears centered to the reference element.
* @see https://floating-ui.com/docs/arrow
*/
var arrow$1 = arrow$2;
/**
* Built-in `limiter` that will stop `shift()` at a certain point.
*/
var limitShift = limitShift$1;
/**
* Computes the `x` and `y` coordinates that will place the floating element
* next to a given reference element.
*/
var computePosition = (reference, floating, options) => {
	const cache = /* @__PURE__ */ new Map();
	const mergedOptions = options != null ? options : {};
	const platformWithCache = {
		...platform,
		...mergedOptions.platform,
		_c: cache
	};
	return computePosition$1(reference, floating, {
		...mergedOptions,
		platform: platformWithCache
	});
};
//#endregion
//#region node_modules/@floating-ui/vue/node_modules/vue-demi/lib/index.mjs
var lib_exports = /* @__PURE__ */ __exportAll({
	Vue: () => vue_exports,
	Vue2: () => void 0,
	del: () => del,
	install: () => install,
	isVue2: () => false,
	isVue3: () => true,
	set: () => set
});
__reExport(lib_exports, vue_exports);
function install() {}
function set(target, key, val) {
	if (Array.isArray(target)) {
		target.length = Math.max(target.length, key);
		target.splice(key, 1, val);
		return val;
	}
	target[key] = val;
	return val;
}
function del(target, key) {
	if (Array.isArray(target)) {
		target.splice(key, 1);
		return;
	}
	delete target[key];
}
//#endregion
//#region node_modules/@floating-ui/vue/dist/floating-ui.vue.mjs
function isComponentPublicInstance(target) {
	return target != null && typeof target === "object" && "$el" in target;
}
function unwrapElement(target) {
	if (isComponentPublicInstance(target)) {
		const element = target.$el;
		return isNode(element) && getNodeName(element) === "#comment" ? null : element;
	}
	return target;
}
function toValue$2(source) {
	return typeof source === "function" ? source() : (0, lib_exports.unref)(source);
}
/**
* Positions an inner element of the floating element such that it is centered to the reference element.
* @param options The arrow options.
* @see https://floating-ui.com/docs/arrow
*/
function arrow(options) {
	return {
		name: "arrow",
		options,
		fn(args) {
			const element = unwrapElement(toValue$2(options.element));
			if (element == null) return {};
			return arrow$1({
				element,
				padding: options.padding
			}).fn(args);
		}
	};
}
function getDPR(element) {
	if (typeof window === "undefined") return 1;
	return (element.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function roundByDPR(element, value) {
	const dpr = getDPR(element);
	return Math.round(value * dpr) / dpr;
}
/**
* Computes the `x` and `y` coordinates that will place the floating element next to a reference element when it is given a certain CSS positioning strategy.
* @param reference The reference template ref.
* @param floating The floating template ref.
* @param options The floating options.
* @see https://floating-ui.com/docs/vue
*/
function useFloating(reference, floating, options) {
	if (options === void 0) options = {};
	const whileElementsMountedOption = options.whileElementsMounted;
	const openOption = (0, lib_exports.computed)(() => {
		var _toValue;
		return (_toValue = toValue$2(options.open)) != null ? _toValue : true;
	});
	const middlewareOption = (0, lib_exports.computed)(() => toValue$2(options.middleware));
	const placementOption = (0, lib_exports.computed)(() => {
		var _toValue2;
		return (_toValue2 = toValue$2(options.placement)) != null ? _toValue2 : "bottom";
	});
	const strategyOption = (0, lib_exports.computed)(() => {
		var _toValue3;
		return (_toValue3 = toValue$2(options.strategy)) != null ? _toValue3 : "absolute";
	});
	const transformOption = (0, lib_exports.computed)(() => {
		var _toValue4;
		return (_toValue4 = toValue$2(options.transform)) != null ? _toValue4 : true;
	});
	const referenceElement = (0, lib_exports.computed)(() => unwrapElement(reference.value));
	const floatingElement = (0, lib_exports.computed)(() => unwrapElement(floating.value));
	const x = (0, lib_exports.ref)(0);
	const y = (0, lib_exports.ref)(0);
	const strategy = (0, lib_exports.ref)(strategyOption.value);
	const placement = (0, lib_exports.ref)(placementOption.value);
	const middlewareData = (0, lib_exports.shallowRef)({});
	const isPositioned = (0, lib_exports.ref)(false);
	const floatingStyles = (0, lib_exports.computed)(() => {
		const initialStyles = {
			position: strategy.value,
			left: "0",
			top: "0"
		};
		if (!floatingElement.value) return initialStyles;
		const xVal = roundByDPR(floatingElement.value, x.value);
		const yVal = roundByDPR(floatingElement.value, y.value);
		if (transformOption.value) return {
			...initialStyles,
			transform: "translate(" + xVal + "px, " + yVal + "px)",
			...getDPR(floatingElement.value) >= 1.5 && { willChange: "transform" }
		};
		return {
			position: strategy.value,
			left: xVal + "px",
			top: yVal + "px"
		};
	});
	let whileElementsMountedCleanup;
	function update() {
		if (referenceElement.value == null || floatingElement.value == null) return;
		const open = openOption.value;
		computePosition(referenceElement.value, floatingElement.value, {
			middleware: middlewareOption.value,
			placement: placementOption.value,
			strategy: strategyOption.value
		}).then((position) => {
			x.value = position.x;
			y.value = position.y;
			strategy.value = position.strategy;
			placement.value = position.placement;
			middlewareData.value = position.middlewareData;
			/**
			* The floating element's position may be recomputed while it's closed
			* but still mounted (such as when transitioning out). To ensure
			* `isPositioned` will be `false` initially on the next open, avoid
			* setting it to `true` when `open === false` (must be specified).
			*/
			isPositioned.value = open !== false;
		});
	}
	function cleanup() {
		if (typeof whileElementsMountedCleanup === "function") {
			whileElementsMountedCleanup();
			whileElementsMountedCleanup = void 0;
		}
	}
	function attach() {
		cleanup();
		if (whileElementsMountedOption === void 0) {
			update();
			return;
		}
		if (referenceElement.value != null && floatingElement.value != null) {
			whileElementsMountedCleanup = whileElementsMountedOption(referenceElement.value, floatingElement.value, update);
			return;
		}
	}
	function reset() {
		if (!openOption.value) isPositioned.value = false;
	}
	(0, lib_exports.watch)([
		middlewareOption,
		placementOption,
		strategyOption,
		openOption
	], update, { flush: "sync" });
	(0, lib_exports.watch)([referenceElement, floatingElement], attach, { flush: "sync" });
	(0, lib_exports.watch)(openOption, reset, { flush: "sync" });
	if ((0, lib_exports.getCurrentScope)()) (0, lib_exports.onScopeDispose)(cleanup);
	return {
		x: (0, lib_exports.shallowReadonly)(x),
		y: (0, lib_exports.shallowReadonly)(y),
		strategy: (0, lib_exports.shallowReadonly)(strategy),
		placement: (0, lib_exports.shallowReadonly)(placement),
		middlewareData: (0, lib_exports.shallowReadonly)(middlewareData),
		isPositioned: (0, lib_exports.shallowReadonly)(isPositioned),
		floatingStyles,
		update
	};
}
//#endregion
//#region node_modules/reka-ui/dist/Popper/PopperContent.js
var _hoisted_1$1 = ["dir"];
var PopperContentPropsDefaultValue = {
	side: "bottom",
	sideOffset: 0,
	sideFlip: true,
	align: "center",
	alignOffset: 0,
	alignFlip: true,
	arrowPadding: 0,
	hideShiftedArrow: true,
	avoidCollisions: true,
	collisionBoundary: () => [],
	collisionPadding: 0,
	sticky: "partial",
	hideWhenDetached: false,
	positionStrategy: "fixed",
	updatePositionStrategy: "optimized",
	prioritizePosition: false
};
var [injectPopperContentContext, providePopperContentContext] = /*#__PURE__*/ createContext("PopperContent");
var PopperContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "PopperContent",
	props: /* @__PURE__ */ (0, vue_exports.mergeDefaults)({
		memoDependencies: {
			type: Array,
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
		sideFlip: {
			type: Boolean,
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
		alignFlip: {
			type: Boolean,
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
		hideShiftedArrow: {
			type: Boolean,
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
		},
		disableUpdateOnLayoutShift: {
			type: Boolean,
			required: false
		},
		prioritizePosition: {
			type: Boolean,
			required: false
		},
		reference: {
			type: null,
			required: false
		},
		dir: {
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
		}
	}, { ...PopperContentPropsDefaultValue }),
	emits: ["placed"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectPopperRootContext();
		const { forwardRef, currentElement: contentElement } = useForwardExpose();
		const dir = useDirection((0, vue_exports.computed)(() => props.dir));
		const floatingRef = (0, vue_exports.ref)();
		const arrow$1 = (0, vue_exports.ref)();
		const { width: arrowWidth, height: arrowHeight } = useSize(arrow$1);
		const desiredPlacement = (0, vue_exports.computed)(() => props.side + (props.align !== "center" ? `-${props.align}` : ""));
		const collisionPadding = (0, vue_exports.computed)(() => {
			return typeof props.collisionPadding === "number" ? props.collisionPadding : {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
				...props.collisionPadding
			};
		});
		const boundary = (0, vue_exports.computed)(() => {
			return Array.isArray(props.collisionBoundary) ? props.collisionBoundary : [props.collisionBoundary];
		});
		const detectOverflowOptions = (0, vue_exports.computed)(() => {
			return {
				padding: collisionPadding.value,
				boundary: boundary.value.filter(isNotNull),
				altBoundary: boundary.value.length > 0
			};
		});
		const flipOptions = (0, vue_exports.computed)(() => {
			return {
				mainAxis: props.sideFlip,
				crossAxis: props.alignFlip
			};
		});
		const computedMiddleware = (0, vue_exports.computed)(() => {
			return [
				offset({
					mainAxis: props.sideOffset + arrowHeight.value,
					alignmentAxis: props.alignOffset
				}),
				props.prioritizePosition && props.avoidCollisions && flip({
					...detectOverflowOptions.value,
					...flipOptions.value
				}),
				props.avoidCollisions && shift({
					mainAxis: true,
					crossAxis: !!props.prioritizePosition,
					limiter: props.sticky === "partial" ? limitShift() : void 0,
					...detectOverflowOptions.value
				}),
				!props.prioritizePosition && props.avoidCollisions && flip({
					...detectOverflowOptions.value,
					...flipOptions.value
				}),
				size({
					...detectOverflowOptions.value,
					apply: ({ elements, rects, availableWidth, availableHeight }) => {
						const { width: anchorWidth, height: anchorHeight } = rects.reference;
						const contentStyle = elements.floating.style;
						contentStyle.setProperty("--reka-popper-available-width", `${availableWidth}px`);
						contentStyle.setProperty("--reka-popper-available-height", `${availableHeight}px`);
						contentStyle.setProperty("--reka-popper-anchor-width", `${anchorWidth}px`);
						contentStyle.setProperty("--reka-popper-anchor-height", `${anchorHeight}px`);
					}
				}),
				arrow$1.value && arrow({
					element: arrow$1.value,
					padding: props.arrowPadding
				}),
				transformOrigin({
					arrowWidth: arrowWidth.value,
					arrowHeight: arrowHeight.value,
					dir: dir.value
				}),
				props.hideWhenDetached && hide({
					strategy: "referenceHidden",
					...detectOverflowOptions.value
				})
			];
		});
		const { floatingStyles, placement, isPositioned, middlewareData, update } = useFloating((0, vue_exports.computed)(() => props.reference ?? rootContext.anchor.value), floatingRef, {
			strategy: props.positionStrategy,
			placement: desiredPlacement,
			whileElementsMounted: (...args) => {
				return autoUpdate(...args, {
					layoutShift: !props.disableUpdateOnLayoutShift,
					animationFrame: props.updatePositionStrategy === "always"
				});
			},
			middleware: computedMiddleware
		});
		const placedSide = (0, vue_exports.computed)(() => getSideAndAlignFromPlacement(placement.value)[0]);
		const placedAlign = (0, vue_exports.computed)(() => getSideAndAlignFromPlacement(placement.value)[1]);
		(0, vue_exports.watchPostEffect)(() => {
			if (isPositioned.value) emits("placed");
		});
		const shouldHideArrow = (0, vue_exports.computed)(() => {
			const cannotCenterArrow = middlewareData.value.arrow?.centerOffset !== 0;
			return props.hideShiftedArrow && cannotCenterArrow;
		});
		const contentZIndex = (0, vue_exports.ref)("");
		(0, vue_exports.watchEffect)(() => {
			if (contentElement.value) contentZIndex.value = window.getComputedStyle(contentElement.value).zIndex;
		});
		providePopperContentContext({
			placedSide,
			onArrowChange: (element) => arrow$1.value = element,
			arrowX: (0, vue_exports.computed)(() => middlewareData.value.arrow?.x ?? 0),
			arrowY: (0, vue_exports.computed)(() => middlewareData.value.arrow?.y ?? 0),
			shouldHideArrow
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)("div", {
				ref_key: "floatingRef",
				ref: floatingRef,
				"data-reka-popper-content-wrapper": "",
				dir: (0, vue_exports.unref)(dir),
				style: (0, vue_exports.normalizeStyle)({
					...(0, vue_exports.unref)(floatingStyles),
					transform: (0, vue_exports.unref)(isPositioned) ? (0, vue_exports.unref)(floatingStyles).transform : "translate(0, -200%)",
					minWidth: "max-content",
					zIndex: contentZIndex.value,
					["--reka-popper-transform-origin"]: [(0, vue_exports.unref)(middlewareData).transformOrigin?.x, (0, vue_exports.unref)(middlewareData).transformOrigin?.y].join(" "),
					...(0, vue_exports.unref)(middlewareData).hide?.referenceHidden && {
						visibility: "hidden",
						pointerEvents: "none"
					}
				})
			}, [props.memoDependencies ? (0, vue_exports.withMemo)([
				props.asChild,
				props.as,
				placedSide.value,
				placedAlign.value,
				(0, vue_exports.unref)(isPositioned),
				...Object.values(_ctx.$attrs),
				...props.memoDependencies
			], () => ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
				key: 0,
				ref: (0, vue_exports.unref)(forwardRef)
			}, _ctx.$attrs, {
				"as-child": props.asChild,
				as: props.as,
				"data-side": placedSide.value,
				"data-align": placedAlign.value,
				style: { animation: !(0, vue_exports.unref)(isPositioned) ? "none" : void 0 }
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, [
				"as-child",
				"as",
				"data-side",
				"data-align",
				"style"
			])), _cache, 0) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
				key: 1,
				ref: (0, vue_exports.unref)(forwardRef)
			}, _ctx.$attrs, {
				"as-child": props.asChild,
				as: props.as,
				"data-side": placedSide.value,
				"data-align": placedAlign.value,
				dir: (0, vue_exports.unref)(dir),
				style: { animation: !(0, vue_exports.unref)(isPositioned) ? "none" : void 0 }
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, [
				"as-child",
				"as",
				"data-side",
				"data-align",
				"dir",
				"style"
			]))], 12, _hoisted_1$1);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuAnchor.js
var MenuAnchor_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuAnchor",
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
			required: false
		}
	},
	setup(__props) {
		const props = __props;
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopperAnchor_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)(props)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/shared/useIsUsingKeyboard.js
function useIsUsingKeyboardImpl() {
	const isUsingKeyboard = (0, vue_exports.ref)(false);
	(0, vue_exports.onMounted)(() => {
		useEventListener$1("keydown", () => {
			isUsingKeyboard.value = true;
		}, {
			capture: true,
			passive: true
		});
		useEventListener$1(["pointerdown", "pointermove"], () => {
			isUsingKeyboard.value = false;
		}, {
			capture: true,
			passive: true
		});
	});
	return isUsingKeyboard;
}
var useIsUsingKeyboard = createSharedComposable(useIsUsingKeyboardImpl);
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuRoot.js
var [injectMenuContext, provideMenuContext] = /*#__PURE__*/ createContext(["MenuRoot", "MenuSub"], "MenuContext");
var [injectMenuRootContext, provideMenuRootContext] = /*#__PURE__*/ createContext("MenuRoot");
var MenuRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuRoot",
	props: {
		open: {
			type: Boolean,
			required: false,
			default: false
		},
		dir: {
			type: String,
			required: false
		},
		modal: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	emits: ["update:open"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { modal, dir: propDir } = (0, vue_exports.toRefs)(props);
		const dir = useDirection(propDir);
		const open = useVModel(props, "open", emits);
		const content = (0, vue_exports.ref)();
		const isUsingKeyboardRef = useIsUsingKeyboard();
		provideMenuContext({
			open,
			onOpenChange: (value) => {
				open.value = value;
			},
			content,
			onContentChange: (element) => {
				content.value = element;
			}
		});
		provideMenuRootContext({
			onClose: () => {
				open.value = false;
			},
			isUsingKeyboardRef,
			dir,
			modal
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopperRoot_default), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuContentImpl.js
var [injectMenuContentContext, provideMenuContentContext] = /*#__PURE__*/ createContext("MenuContent");
var MenuContentImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuContentImpl",
	props: /* @__PURE__ */ (0, vue_exports.mergeDefaults)({
		loop: {
			type: Boolean,
			required: false
		},
		disableOutsidePointerEvents: {
			type: Boolean,
			required: false
		},
		disableOutsideScroll: {
			type: Boolean,
			required: false
		},
		trapFocus: {
			type: Boolean,
			required: false
		},
		memoDependencies: {
			type: Array,
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
		sideFlip: {
			type: Boolean,
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
		alignFlip: {
			type: Boolean,
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
		hideShiftedArrow: {
			type: Boolean,
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
		},
		disableUpdateOnLayoutShift: {
			type: Boolean,
			required: false
		},
		prioritizePosition: {
			type: Boolean,
			required: false
		},
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
			required: false
		}
	}, { ...PopperContentPropsDefaultValue }),
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"entryFocus",
		"openAutoFocus",
		"closeAutoFocus",
		"dismiss"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const menuContext = injectMenuContext();
		const rootContext = injectMenuRootContext();
		const { trapFocus, disableOutsidePointerEvents, loop } = (0, vue_exports.toRefs)(props);
		useFocusGuards();
		useBodyScrollLock(disableOutsidePointerEvents.value);
		const searchRef = (0, vue_exports.ref)("");
		const timerRef = (0, vue_exports.ref)(0);
		const pointerGraceTimerRef = (0, vue_exports.ref)(0);
		const pointerGraceIntentRef = (0, vue_exports.ref)(null);
		const pointerDirRef = (0, vue_exports.ref)("right");
		const lastPointerXRef = (0, vue_exports.ref)(0);
		const currentItemId = (0, vue_exports.ref)(null);
		const rovingFocusGroupRef = (0, vue_exports.ref)();
		const { forwardRef, currentElement: contentElement } = useForwardExpose();
		const { handleTypeaheadSearch } = useTypeahead();
		const highlightedElement = (0, vue_exports.ref)();
		function onKeydownNavigation(event) {
			const el = useArrowNavigation(event, highlightedElement.value || getActiveElement(), contentElement.value, {
				loop: loop.value,
				arrowKeyOptions: "vertical",
				dir: rootContext?.dir.value,
				focus: false,
				attributeName: "[data-reka-collection-item]:not([data-disabled])"
			});
			if (el) {
				highlightedElement.value = el;
				el.scrollIntoView({ block: "nearest" });
			}
		}
		function onKeydownEnter() {
			if (highlightedElement.value) highlightedElement.value.click();
		}
		const filterElement = (0, vue_exports.ref)();
		const activeSubmenuContext = (0, vue_exports.ref)();
		(0, vue_exports.watch)(highlightedElement, (el) => {
			if (activeSubmenuContext.value && (el === void 0 || el !== activeSubmenuContext.value.trigger.value)) {
				if (el === void 0) return;
				activeSubmenuContext.value.onOpenChange(false);
				activeSubmenuContext.value = void 0;
			}
		});
		(0, vue_exports.watch)(contentElement, (el) => {
			menuContext.onContentChange(el);
		});
		(0, vue_exports.onUnmounted)(() => {
			window.clearTimeout(timerRef.value);
		});
		function isPointerMovingToSubmenu(event) {
			return pointerDirRef.value === pointerGraceIntentRef.value?.side && isPointerInGraceArea(event, pointerGraceIntentRef.value?.area);
		}
		async function handleMountAutoFocus(event) {
			emits("openAutoFocus", event);
			if (event.defaultPrevented) return;
			event.preventDefault();
			contentElement.value?.focus({ preventScroll: true });
		}
		function handleKeyDown(event) {
			if (event.defaultPrevented) return;
			const target = event.target;
			const isKeyDownInside = target.closest("[data-reka-menu-content]") === event.currentTarget;
			const isKeyDownInTextField = ["input", "textarea"].includes(target.tagName.toLowerCase());
			const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
			const isCharacterKey = event.key.length === 1;
			const el = useArrowNavigation(event, getActiveElement(), contentElement.value, {
				loop: loop.value,
				arrowKeyOptions: "vertical",
				dir: rootContext?.dir.value,
				focus: true,
				attributeName: "[data-reka-collection-item]:not([data-disabled])"
			});
			if (el) return el?.focus();
			if (event.code === "Space") return;
			const collectionItems = rovingFocusGroupRef.value?.getItems() ?? [];
			if (isKeyDownInside) {
				if (event.key === "Tab" && rootContext.modal.value) event.preventDefault();
				if (!isModifierKey && isCharacterKey && !isKeyDownInTextField) handleTypeaheadSearch(event.key, collectionItems);
			}
			if (event.target !== contentElement.value) return;
			if (!FIRST_LAST_KEYS.includes(event.key)) return;
			event.preventDefault();
			const candidateNodes = [...collectionItems.map((item) => item.ref)];
			if (LAST_KEYS.includes(event.key)) candidateNodes.reverse();
			focusFirst$1(candidateNodes);
		}
		function handleBlur(event) {
			if (!event?.currentTarget?.contains?.(event.target)) {
				window.clearTimeout(timerRef.value);
				searchRef.value = "";
			}
		}
		function handlePointerMove(event) {
			if (!isMouseEvent(event)) return;
			const target = event.target;
			const pointerXHasChanged = lastPointerXRef.value !== event.clientX;
			if ((event?.currentTarget)?.contains(target) && pointerXHasChanged) {
				const newDir = event.clientX > lastPointerXRef.value ? "right" : "left";
				pointerDirRef.value = newDir;
				lastPointerXRef.value = event.clientX;
			}
		}
		function handlePointerEnter(event) {
			if (!isMouseEvent(event)) return;
			if (filterElement.value) filterElement.value.focus();
		}
		provideMenuContentContext({
			onItemEnter: (event) => {
				if (isPointerMovingToSubmenu(event)) return true;
				else return false;
			},
			onItemLeave: (event) => {
				if (isPointerMovingToSubmenu(event)) return true;
				if (!["INPUT", "TEXTAREA"].includes(getActiveElement()?.tagName || "")) contentElement.value?.focus();
				currentItemId.value = null;
				return false;
			},
			onTriggerLeave: (event) => {
				if (isPointerMovingToSubmenu(event)) return true;
				else return false;
			},
			searchRef,
			highlightedElement,
			onKeydownNavigation,
			onKeydownEnter,
			filterElement,
			onFilterElementChange: (el) => {
				filterElement.value = el;
			},
			activeSubmenuContext,
			pointerGraceTimerRef,
			onPointerGraceIntentChange: (intent) => {
				pointerGraceIntentRef.value = intent;
			}
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(FocusScope_default), {
				"as-child": "",
				trapped: (0, vue_exports.unref)(trapFocus),
				onMountAutoFocus: handleMountAutoFocus,
				onUnmountAutoFocus: _cache[7] || (_cache[7] = ($event) => emits("closeAutoFocus", $event))
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DismissableLayer_default), {
					"as-child": "",
					"disable-outside-pointer-events": (0, vue_exports.unref)(disableOutsidePointerEvents),
					onEscapeKeyDown: _cache[2] || (_cache[2] = ($event) => emits("escapeKeyDown", $event)),
					onPointerDownOutside: _cache[3] || (_cache[3] = ($event) => emits("pointerDownOutside", $event)),
					onFocusOutside: _cache[4] || (_cache[4] = ($event) => emits("focusOutside", $event)),
					onInteractOutside: _cache[5] || (_cache[5] = ($event) => emits("interactOutside", $event)),
					onDismiss: _cache[6] || (_cache[6] = ($event) => emits("dismiss"))
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(RovingFocusGroup_default), {
						ref_key: "rovingFocusGroupRef",
						ref: rovingFocusGroupRef,
						"current-tab-stop-id": currentItemId.value,
						"onUpdate:currentTabStopId": _cache[0] || (_cache[0] = ($event) => currentItemId.value = $event),
						"as-child": "",
						orientation: "vertical",
						dir: (0, vue_exports.unref)(rootContext).dir.value,
						loop: (0, vue_exports.unref)(loop),
						onEntryFocus: _cache[1] || (_cache[1] = (event) => {
							emits("entryFocus", event);
							if (!(0, vue_exports.unref)(rootContext).isUsingKeyboardRef.value) event.preventDefault();
						})
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopperContent_default), {
							ref: (0, vue_exports.unref)(forwardRef),
							role: "menu",
							as: _ctx.as,
							"as-child": _ctx.asChild,
							"aria-orientation": "vertical",
							"data-reka-menu-content": "",
							"data-state": (0, vue_exports.unref)(getOpenState$1)((0, vue_exports.unref)(menuContext).open.value),
							dir: (0, vue_exports.unref)(rootContext).dir.value,
							side: _ctx.side,
							"side-offset": _ctx.sideOffset,
							align: _ctx.align,
							"align-offset": _ctx.alignOffset,
							"avoid-collisions": _ctx.avoidCollisions,
							"collision-boundary": _ctx.collisionBoundary,
							"collision-padding": _ctx.collisionPadding,
							"arrow-padding": _ctx.arrowPadding,
							"prioritize-position": _ctx.prioritizePosition,
							"position-strategy": _ctx.positionStrategy,
							"update-position-strategy": _ctx.updatePositionStrategy,
							sticky: _ctx.sticky,
							"hide-when-detached": _ctx.hideWhenDetached,
							reference: _ctx.reference,
							onKeydown: handleKeyDown,
							onBlur: handleBlur,
							onPointermove: handlePointerMove,
							onPointerenter: handlePointerEnter
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
							_: 3
						}, 8, [
							"as",
							"as-child",
							"data-state",
							"dir",
							"side",
							"side-offset",
							"align",
							"align-offset",
							"avoid-collisions",
							"collision-boundary",
							"collision-padding",
							"arrow-padding",
							"prioritize-position",
							"position-strategy",
							"update-position-strategy",
							"sticky",
							"hide-when-detached",
							"reference"
						])]),
						_: 3
					}, 8, [
						"current-tab-stop-id",
						"dir",
						"loop"
					])]),
					_: 3
				}, 8, ["disable-outside-pointer-events"])]),
				_: 3
			}, 8, ["trapped"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuItemImpl.js
var MenuItemImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "MenuItemImpl",
	props: {
		disabled: {
			type: Boolean,
			required: false
		},
		textValue: {
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
		}
	},
	setup(__props) {
		const props = __props;
		const contentContext = injectMenuContentContext();
		const { forwardRef, currentElement } = useForwardExpose();
		const { CollectionItem } = useCollection();
		const isFocused = (0, vue_exports.ref)(false);
		const isHighlighted = (0, vue_exports.computed)(() => isFocused.value || currentElement.value != null && contentContext.highlightedElement.value === currentElement.value);
		async function handlePointerMove(event) {
			if (event.defaultPrevented || !isMouseEvent(event)) return;
			if (props.disabled) contentContext.onItemLeave(event);
			else if (!contentContext.onItemEnter(event)) {
				const item = event.currentTarget;
				contentContext.highlightedElement.value = item;
				if (!["INPUT", "TEXTAREA"].includes(getActiveElement()?.tagName || "")) item.focus({ preventScroll: true });
			}
		}
		async function handlePointerLeave(event) {
			await (0, vue_exports.nextTick)();
			if (event.defaultPrevented) return;
			if (!isMouseEvent(event)) return;
			if (contentContext.highlightedElement.value !== currentElement.value) return;
			if (!contentContext.onItemLeave(event) && contentContext.highlightedElement.value === currentElement.value) contentContext.highlightedElement.value = void 0;
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollectionItem), { value: { textValue: _ctx.textValue } }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
					ref: (0, vue_exports.unref)(forwardRef),
					role: "menuitem",
					tabindex: "-1"
				}, _ctx.$attrs, {
					as: _ctx.as,
					"as-child": _ctx.asChild,
					"aria-disabled": _ctx.disabled || void 0,
					"data-disabled": _ctx.disabled ? "" : void 0,
					"data-highlighted": isHighlighted.value ? "" : void 0,
					onPointermove: handlePointerMove,
					onPointerleave: handlePointerLeave,
					onFocus: _cache[0] || (_cache[0] = async (event) => {
						const item = event.currentTarget;
						await (0, vue_exports.nextTick)();
						if (event.defaultPrevented || _ctx.disabled) return;
						isFocused.value = true;
						(0, vue_exports.unref)(contentContext).highlightedElement.value = item;
					}),
					onBlur: _cache[1] || (_cache[1] = async (event) => {
						await (0, vue_exports.nextTick)();
						if (event.defaultPrevented) return;
						isFocused.value = false;
					})
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16, [
					"as",
					"as-child",
					"aria-disabled",
					"data-disabled",
					"data-highlighted"
				])]),
				_: 3
			}, 8, ["value"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuItem.js
var MenuItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuItem",
	props: {
		disabled: {
			type: Boolean,
			required: false
		},
		textValue: {
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
		}
	},
	emits: ["select"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { forwardRef, currentElement } = useForwardExpose();
		const rootContext = injectMenuRootContext();
		const contentContext = injectMenuContentContext();
		const isPointerDownRef = (0, vue_exports.ref)(false);
		async function handleSelect() {
			const menuItem = currentElement.value;
			if (!props.disabled && menuItem) {
				const itemSelectEvent = new CustomEvent(ITEM_SELECT, {
					bubbles: true,
					cancelable: true
				});
				emits("select", itemSelectEvent);
				await (0, vue_exports.nextTick)();
				if (itemSelectEvent.defaultPrevented) isPointerDownRef.value = false;
				else rootContext.onClose();
			}
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(MenuItemImpl_default, (0, vue_exports.mergeProps)(props, {
				ref: (0, vue_exports.unref)(forwardRef),
				onClick: handleSelect,
				onPointerdown: _cache[0] || (_cache[0] = () => {
					isPointerDownRef.value = true;
				}),
				onPointerup: _cache[1] || (_cache[1] = async (event) => {
					await (0, vue_exports.nextTick)();
					if (event.defaultPrevented) return;
					if (!isPointerDownRef.value) event.currentTarget?.click();
				}),
				onKeydown: _cache[2] || (_cache[2] = async (event) => {
					const isTypingAhead = (0, vue_exports.unref)(contentContext).searchRef.value !== "";
					if (_ctx.disabled || isTypingAhead && event.key === " ") return;
					if ((0, vue_exports.unref)(SELECTION_KEYS).includes(event.key)) {
						event.currentTarget?.click();
						/**
						* We prevent default browser behaviour for selection keys as they should trigger
						* a selection only:
						* - prevents space from scrolling the page.
						* - if keydown causes focus to move, prevents keydown from firing on the new target.
						*/
						event.preventDefault();
					}
				})
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuRootContentModal.js
var MenuRootContentModal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuRootContentModal",
	props: {
		loop: {
			type: Boolean,
			required: false
		},
		memoDependencies: {
			type: Array,
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
		sideFlip: {
			type: Boolean,
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
		alignFlip: {
			type: Boolean,
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
		hideShiftedArrow: {
			type: Boolean,
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
		},
		disableUpdateOnLayoutShift: {
			type: Boolean,
			required: false
		},
		prioritizePosition: {
			type: Boolean,
			required: false
		},
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
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"entryFocus",
		"openAutoFocus",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const forwarded = useForwardPropsEmits(props, emits);
		const menuContext = injectMenuContext();
		const { forwardRef, currentElement } = useForwardExpose();
		useHideOthers(currentElement);
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(MenuContentImpl_default, (0, vue_exports.mergeProps)((0, vue_exports.unref)(forwarded), {
				ref: (0, vue_exports.unref)(forwardRef),
				"trap-focus": (0, vue_exports.unref)(menuContext).open.value,
				"disable-outside-pointer-events": (0, vue_exports.unref)(menuContext).open.value,
				"disable-outside-scroll": true,
				onDismiss: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(menuContext).onOpenChange(false)),
				onFocusOutside: _cache[1] || (_cache[1] = (0, vue_exports.withModifiers)(($event) => emits("focusOutside", $event), ["prevent"]))
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["trap-focus", "disable-outside-pointer-events"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuRootContentNonModal.js
var MenuRootContentNonModal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuRootContentNonModal",
	props: {
		loop: {
			type: Boolean,
			required: false
		},
		memoDependencies: {
			type: Array,
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
		sideFlip: {
			type: Boolean,
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
		alignFlip: {
			type: Boolean,
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
		hideShiftedArrow: {
			type: Boolean,
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
		},
		disableUpdateOnLayoutShift: {
			type: Boolean,
			required: false
		},
		prioritizePosition: {
			type: Boolean,
			required: false
		},
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
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"entryFocus",
		"openAutoFocus",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const forwarded = useForwardPropsEmits(__props, __emit);
		const menuContext = injectMenuContext();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(MenuContentImpl_default, (0, vue_exports.mergeProps)((0, vue_exports.unref)(forwarded), {
				"trap-focus": false,
				"disable-outside-pointer-events": false,
				"disable-outside-scroll": false,
				onDismiss: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(menuContext).onOpenChange(false))
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuContent.js
var MenuContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuContent",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		loop: {
			type: Boolean,
			required: false
		},
		memoDependencies: {
			type: Array,
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
		sideFlip: {
			type: Boolean,
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
		alignFlip: {
			type: Boolean,
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
		hideShiftedArrow: {
			type: Boolean,
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
		},
		disableUpdateOnLayoutShift: {
			type: Boolean,
			required: false
		},
		prioritizePosition: {
			type: Boolean,
			required: false
		},
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
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"entryFocus",
		"openAutoFocus",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const forwarded = useForwardPropsEmits(__props, __emit);
		const menuContext = injectMenuContext();
		const rootContext = injectMenuRootContext();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), { present: _ctx.forceMount || (0, vue_exports.unref)(menuContext).open.value }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.unref)(rootContext).modal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(MenuRootContentModal_default, (0, vue_exports.normalizeProps)((0, vue_exports.mergeProps)({ key: 0 }, {
					..._ctx.$attrs,
					...(0, vue_exports.unref)(forwarded)
				})), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(MenuRootContentNonModal_default, (0, vue_exports.normalizeProps)((0, vue_exports.mergeProps)({ key: 1 }, {
					..._ctx.$attrs,
					...(0, vue_exports.unref)(forwarded)
				})), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16))]),
				_: 3
			}, 8, ["present"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Menu/MenuPortal.js
var MenuPortal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuPortal",
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
//#region node_modules/reka-ui/dist/Menu/MenuSeparator.js
var MenuSeparator_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "MenuSeparator",
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
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(props, {
				role: "separator",
				"aria-orientation": "horizontal"
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/DropdownMenu/DropdownMenuRoot.js
var [injectDropdownMenuRootContext, provideDropdownMenuRootContext] = /*#__PURE__*/ createContext("DropdownMenuRoot");
var DropdownMenuRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuRoot",
	props: {
		defaultOpen: {
			type: Boolean,
			required: false
		},
		open: {
			type: Boolean,
			required: false,
			default: void 0
		},
		dir: {
			type: String,
			required: false
		},
		modal: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	emits: ["update:open"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		useForwardExpose();
		const open = useVModel(props, "open", emit, {
			defaultValue: props.defaultOpen,
			passive: props.open === void 0
		});
		const triggerElement = (0, vue_exports.ref)();
		const { modal, dir: propDir } = (0, vue_exports.toRefs)(props);
		const dir = useDirection(propDir);
		provideDropdownMenuRootContext({
			open,
			onOpenChange: (value) => {
				open.value = value;
			},
			onOpenToggle: () => {
				open.value = !open.value;
			},
			triggerId: "",
			triggerElement,
			contentId: "",
			modal,
			dir
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuRoot_default), {
				open: (0, vue_exports.unref)(open),
				"onUpdate:open": _cache[0] || (_cache[0] = ($event) => (0, vue_exports.isRef)(open) ? open.value = $event : null),
				dir: (0, vue_exports.unref)(dir),
				modal: (0, vue_exports.unref)(modal)
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { open: (0, vue_exports.unref)(open) })]),
				_: 3
			}, 8, [
				"open",
				"dir",
				"modal"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/DropdownMenu/DropdownMenuContent.js
var DropdownMenuContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuContent",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		loop: {
			type: Boolean,
			required: false
		},
		memoDependencies: {
			type: Array,
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
		sideFlip: {
			type: Boolean,
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
		alignFlip: {
			type: Boolean,
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
		hideShiftedArrow: {
			type: Boolean,
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
		},
		disableUpdateOnLayoutShift: {
			type: Boolean,
			required: false
		},
		prioritizePosition: {
			type: Boolean,
			required: false
		},
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
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const forwarded = useForwardPropsEmits(__props, __emit);
		useForwardExpose();
		const rootContext = injectDropdownMenuRootContext();
		const hasInteractedOutsideRef = (0, vue_exports.ref)(false);
		function handleCloseAutoFocus(event) {
			if (event.defaultPrevented) return;
			if (!hasInteractedOutsideRef.value) setTimeout(() => {
				rootContext.triggerElement.value?.focus();
			}, 0);
			hasInteractedOutsideRef.value = false;
			event.preventDefault();
		}
		rootContext.contentId ||= useId(void 0, "reka-dropdown-menu-content");
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuContent_default), (0, vue_exports.mergeProps)((0, vue_exports.unref)(forwarded), {
				id: (0, vue_exports.unref)(rootContext).contentId,
				"aria-labelledby": (0, vue_exports.unref)(rootContext)?.triggerId,
				style: {
					"--reka-dropdown-menu-content-transform-origin": "var(--reka-popper-transform-origin)",
					"--reka-dropdown-menu-content-available-width": "var(--reka-popper-available-width)",
					"--reka-dropdown-menu-content-available-height": "var(--reka-popper-available-height)",
					"--reka-dropdown-menu-trigger-width": "var(--reka-popper-anchor-width)",
					"--reka-dropdown-menu-trigger-height": "var(--reka-popper-anchor-height)"
				},
				onCloseAutoFocus: handleCloseAutoFocus,
				onInteractOutside: _cache[0] || (_cache[0] = (event) => {
					if (event.defaultPrevented) return;
					const originalEvent = event.detail.originalEvent;
					const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
					const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
					if (!(0, vue_exports.unref)(rootContext).modal.value || isRightClick) hasInteractedOutsideRef.value = true;
					if ((0, vue_exports.unref)(rootContext).triggerElement.value?.contains(event.target)) event.preventDefault();
				})
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["id", "aria-labelledby"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/DropdownMenu/DropdownMenuItem.js
var DropdownMenuItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuItem",
	props: {
		disabled: {
			type: Boolean,
			required: false
		},
		textValue: {
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
		}
	},
	emits: ["select"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emitsAsProps = useEmitAsProps(__emit);
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuItem_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)({
				...props,
				...(0, vue_exports.unref)(emitsAsProps)
			})), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/DropdownMenu/DropdownMenuPortal.js
var DropdownMenuPortal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuPortal",
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
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuPortal_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)(props)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/DropdownMenu/DropdownMenuSeparator.js
var DropdownMenuSeparator_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuSeparator",
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
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuSeparator_default), (0, vue_exports.normalizeProps)((0, vue_exports.guardReactiveProps)(props)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/DropdownMenu/DropdownMenuTrigger.js
var DropdownMenuTrigger_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DropdownMenuTrigger",
	props: {
		disabled: {
			type: Boolean,
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
		const rootContext = injectDropdownMenuRootContext();
		const { forwardRef, currentElement: triggerElement } = useForwardExpose();
		(0, vue_exports.onMounted)(() => {
			rootContext.triggerElement = triggerElement;
		});
		rootContext.triggerId ||= useId(void 0, "reka-dropdown-menu-trigger");
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(MenuAnchor_default), { "as-child": "" }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					id: (0, vue_exports.unref)(rootContext).triggerId,
					ref: (0, vue_exports.unref)(forwardRef),
					type: _ctx.as === "button" ? "button" : void 0,
					"as-child": props.asChild,
					as: _ctx.as,
					"aria-haspopup": "menu",
					"aria-expanded": (0, vue_exports.unref)(rootContext).open.value,
					"aria-controls": (0, vue_exports.unref)(rootContext).open.value ? (0, vue_exports.unref)(rootContext).contentId : void 0,
					"data-disabled": _ctx.disabled ? "" : void 0,
					disabled: _ctx.disabled,
					"data-state": (0, vue_exports.unref)(rootContext).open.value ? "open" : "closed",
					onClick: _cache[0] || (_cache[0] = async (event) => {
						if (!_ctx.disabled && event.button === 0 && event.ctrlKey === false) {
							(0, vue_exports.unref)(rootContext)?.onOpenToggle();
							await (0, vue_exports.nextTick)();
							if ((0, vue_exports.unref)(rootContext).open.value) event.preventDefault();
						}
					}),
					onKeydown: _cache[1] || (_cache[1] = (0, vue_exports.withKeys)((event) => {
						if (_ctx.disabled) return;
						if (["Enter", " "].includes(event.key)) (0, vue_exports.unref)(rootContext).onOpenToggle();
						if (event.key === "ArrowDown") (0, vue_exports.unref)(rootContext).onOpenChange(true);
						if ([
							"Enter",
							" ",
							"ArrowDown"
						].includes(event.key)) event.preventDefault();
					}, [
						"enter",
						"space",
						"arrow-down"
					]))
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"id",
					"type",
					"as-child",
					"as",
					"aria-expanded",
					"aria-controls",
					"data-disabled",
					"disabled",
					"data-state"
				])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/utils.js
function getOpenState(open) {
	return open ? "open" : "closed";
}
function makeTriggerId(baseId, value) {
	return `${baseId}-trigger-${value}`;
}
function makeContentId(baseId, value) {
	return `${baseId}-content-${value}`;
}
var LINK_SELECT = "navigationMenu.linkSelect";
var EVENT_ROOT_CONTENT_DISMISS = "navigationMenu.rootContentDismiss";
/**
* Returns a list of potential tabbable candidates.
*
* NOTE: This is only a close approximation. For example it doesn't take into account cases like when
* elements are not visible. This cannot be worked out easily by just reading a property, but rather
* necessitate runtime knowledge (computed styles, etc). We deal with these cases separately.
*
* See: https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
* Credit: https://github.com/discord/focus-layers/blob/master/src/util/wrapFocus.tsx#L1
*/
function getTabbableCandidates(container) {
	const nodes = [];
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, { acceptNode: (node) => {
		const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
		if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
		return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	} });
	while (walker.nextNode()) nodes.push(walker.currentNode);
	return nodes;
}
function focusFirst(candidates) {
	const previouslyFocusedElement = getActiveElement();
	return candidates.some((candidate) => {
		if (candidate === previouslyFocusedElement) return true;
		candidate.focus();
		return getActiveElement() !== previouslyFocusedElement;
	});
}
function removeFromTabOrder(candidates) {
	candidates.forEach((candidate) => {
		candidate.dataset.tabindex = candidate.getAttribute("tabindex") || "";
		candidate.setAttribute("tabindex", "-1");
	});
	return () => {
		candidates.forEach((candidate) => {
			const prevTabIndex = candidate.dataset.tabindex;
			candidate.setAttribute("tabindex", prevTabIndex);
		});
	};
}
function whenMouse(handler) {
	return (event) => event.pointerType === "mouse" ? handler(event) : void 0;
}
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuRoot.js
var [injectNavigationMenuContext, provideNavigationMenuContext] = /*#__PURE__*/ createContext(["NavigationMenuRoot", "NavigationMenuSub"], "NavigationMenuContext");
var NavigationMenuRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "NavigationMenuRoot",
	props: {
		modelValue: {
			type: String,
			required: false,
			default: void 0
		},
		defaultValue: {
			type: String,
			required: false
		},
		dir: {
			type: String,
			required: false
		},
		orientation: {
			type: String,
			required: false,
			default: "horizontal"
		},
		delayDuration: {
			type: Number,
			required: false,
			default: 200
		},
		skipDelayDuration: {
			type: Number,
			required: false,
			default: 300
		},
		disableClickTrigger: {
			type: Boolean,
			required: false,
			default: false
		},
		disableHoverTrigger: {
			type: Boolean,
			required: false,
			default: false
		},
		disablePointerLeaveClose: {
			type: Boolean,
			required: false
		},
		unmountOnHide: {
			type: Boolean,
			required: false,
			default: true
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "nav"
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const modelValue = useVModel(props, "modelValue", __emit, {
			defaultValue: props.defaultValue ?? "",
			passive: props.modelValue === void 0
		});
		const previousValue = (0, vue_exports.ref)("");
		const { forwardRef, currentElement: rootNavigationMenu } = useForwardExpose();
		const indicatorTrack = (0, vue_exports.ref)();
		const viewport = (0, vue_exports.ref)();
		const activeTrigger = (0, vue_exports.ref)();
		const { getItems, CollectionSlot } = useCollection({
			key: "NavigationMenu",
			isProvider: true
		});
		const { delayDuration, skipDelayDuration, dir: propDir, disableClickTrigger, disableHoverTrigger, unmountOnHide } = (0, vue_exports.toRefs)(props);
		const dir = useDirection(propDir);
		const isDelaySkipped = refAutoReset(false, skipDelayDuration);
		const skipNextClose = (0, vue_exports.ref)(false);
		const computedDelay = (0, vue_exports.computed)(() => {
			if (modelValue.value !== "" || isDelaySkipped.value) return 150;
			else return delayDuration.value;
		});
		const debouncedFn = useDebounceFn((val) => {
			if (typeof val === "string") {
				if (val === "" && skipNextClose.value) {
					skipNextClose.value = false;
					return;
				}
				previousValue.value = modelValue.value;
				modelValue.value = val;
				if (val === "") isDelaySkipped.value = true;
			}
		}, computedDelay);
		(0, vue_exports.watchEffect)(() => {
			if (!modelValue.value) return;
			const items = getItems().map((i) => i.ref);
			activeTrigger.value = items.find((item) => item.id.includes(modelValue.value));
		});
		useEventListener$1(rootNavigationMenu, EVENT_ROOT_CONTENT_DISMISS, onItemDismiss);
		provideNavigationMenuContext({
			isRootMenu: true,
			modelValue,
			previousValue,
			baseId: useId(void 0, "reka-navigation-menu"),
			disableClickTrigger,
			disableHoverTrigger,
			dir,
			unmountOnHide,
			orientation: props.orientation,
			rootNavigationMenu,
			indicatorTrack,
			activeTrigger,
			onIndicatorTrackChange: (val) => {
				indicatorTrack.value = val;
			},
			viewport,
			onViewportChange: (val) => {
				viewport.value = val;
			},
			onTriggerEnter: (val) => {
				if (modelValue.value !== "") {
					skipNextClose.value = true;
					previousValue.value = modelValue.value;
					modelValue.value = val;
				} else debouncedFn(val);
			},
			onTriggerLeave: () => {
				skipNextClose.value = false;
				debouncedFn("");
			},
			onContentEnter: () => {
				debouncedFn();
			},
			onContentLeave: () => {
				if (!props.disablePointerLeaveClose) {
					skipNextClose.value = false;
					debouncedFn("");
				}
			},
			onItemSelect: (val) => {
				previousValue.value = modelValue.value;
				modelValue.value = val;
			},
			onItemDismiss
		});
		function onItemDismiss() {
			previousValue.value = modelValue.value;
			modelValue.value = "";
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollectionSlot), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					ref: (0, vue_exports.unref)(forwardRef),
					as: _ctx.as,
					"as-child": _ctx.asChild,
					"data-orientation": _ctx.orientation,
					dir: (0, vue_exports.unref)(dir),
					"data-reka-navigation-menu": ""
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { modelValue: (0, vue_exports.unref)(modelValue) })]),
					_: 3
				}, 8, [
					"as",
					"as-child",
					"data-orientation",
					"dir"
				])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuItem.js
var [injectNavigationMenuItemContext, provideNavigationMenuItemContext] = /*#__PURE__*/ createContext("NavigationMenuItem");
var NavigationMenuItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "NavigationMenuItem",
	props: {
		value: {
			type: String,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "li"
		}
	},
	setup(__props) {
		const props = __props;
		useForwardExpose();
		const { getItems } = useCollection({ key: "NavigationMenu" });
		const context = injectNavigationMenuContext();
		const value = useId(props.value);
		const triggerRef$1 = (0, vue_exports.ref)();
		const focusProxyRef = (0, vue_exports.ref)();
		const contentId = makeContentId(context.baseId, value);
		let restoreContentTabOrderRef = () => ({});
		const wasEscapeCloseRef = (0, vue_exports.ref)(false);
		async function handleContentEntry(side = "start") {
			const el = document.getElementById(contentId);
			if (el) {
				restoreContentTabOrderRef();
				const candidates = getTabbableCandidates(el);
				if (candidates.length) focusFirst(side === "start" ? candidates : candidates.reverse());
			}
		}
		function handleContentExit() {
			const el = document.getElementById(contentId);
			if (el) {
				const candidates = getTabbableCandidates(el);
				if (candidates.length) restoreContentTabOrderRef = removeFromTabOrder(candidates);
			}
		}
		provideNavigationMenuItemContext({
			value,
			contentId,
			triggerRef: triggerRef$1,
			focusProxyRef,
			wasEscapeCloseRef,
			onEntryKeyDown: handleContentEntry,
			onFocusProxyEnter: handleContentEntry,
			onContentFocusOutside: handleContentExit,
			onRootContentClose: handleContentExit
		});
		function handleClose() {
			context.onItemDismiss();
			triggerRef$1.value?.focus();
		}
		function handleKeydown(ev) {
			const currentFocus = getActiveElement();
			if (ev.keyCode === 32 || ev.key === "Enter") if (context.modelValue.value === value) {
				handleClose();
				ev.preventDefault();
				return;
			} else {
				ev.target.click();
				ev.preventDefault();
				return;
			}
			const itemsArray = getItems().filter((i) => i.ref.parentElement?.hasAttribute("data-menu-item")).map((i) => i.ref);
			if (!itemsArray.includes(currentFocus)) return;
			const newSelectedElement = useArrowNavigation(ev, currentFocus, void 0, {
				itemsArray,
				loop: false
			});
			if (newSelectedElement) newSelectedElement?.focus();
			ev.preventDefault();
			ev.stopPropagation();
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				"as-child": _ctx.asChild,
				as: _ctx.as,
				"data-menu-item": "",
				onKeydown: (0, vue_exports.withKeys)(handleKeydown, [
					"up",
					"down",
					"left",
					"right",
					"home",
					"end",
					"space"
				])
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, ["as-child", "as"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuContentImpl.js
var NavigationMenuContentImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "NavigationMenuContentImpl",
	props: {
		disableOutsidePointerEvents: {
			type: Boolean,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { getItems } = useCollection({ key: "NavigationMenu" });
		const { forwardRef, currentElement } = useForwardExpose();
		const menuContext = injectNavigationMenuContext();
		const itemContext = injectNavigationMenuItemContext();
		const triggerId = makeTriggerId(menuContext.baseId, itemContext.value);
		const contentId = makeContentId(menuContext.baseId, itemContext.value);
		const prevMotionAttributeRef = (0, vue_exports.ref)(null);
		const motionAttribute = (0, vue_exports.computed)(() => {
			const values = getItems().map((i) => i.ref.id.split("trigger-")[1]);
			if (menuContext.dir.value === "rtl") values.reverse();
			const index = values.indexOf(menuContext.modelValue.value);
			const prevIndex = values.indexOf(menuContext.previousValue.value);
			const isSelected = itemContext.value === menuContext.modelValue.value;
			const wasSelected = prevIndex === values.indexOf(itemContext.value);
			if (!isSelected && !wasSelected) return prevMotionAttributeRef.value;
			const attribute = (() => {
				if (index !== prevIndex) {
					if (isSelected && prevIndex !== -1) return index > prevIndex ? "from-end" : "from-start";
					if (wasSelected && index !== -1) return index > prevIndex ? "to-start" : "to-end";
				}
				return null;
			})();
			prevMotionAttributeRef.value = attribute;
			return attribute;
		});
		function handleFocusOutside(ev) {
			emits("focusOutside", ev);
			emits("interactOutside", ev);
			if (ev.detail.originalEvent.target.hasAttribute("data-navigation-menu-trigger")) ev.preventDefault();
			if (!ev.defaultPrevented) {
				itemContext.onContentFocusOutside();
				const target$1 = ev.target;
				if (menuContext.rootNavigationMenu?.value?.contains(target$1)) ev.preventDefault();
			}
		}
		function handlePointerDownOutside(ev) {
			emits("pointerDownOutside", ev);
			if (!ev.defaultPrevented) {
				const target = ev.target;
				const isTrigger = getItems().some((i) => i.ref.contains(target));
				const isRootViewport = menuContext.isRootMenu && menuContext.viewport.value?.contains(target);
				if (isTrigger || isRootViewport || !menuContext.isRootMenu) ev.preventDefault();
			}
		}
		(0, vue_exports.watchEffect)((cleanupFn) => {
			const content = currentElement.value;
			if (menuContext.isRootMenu && content) {
				const handleClose = () => {
					menuContext.onItemDismiss();
					itemContext.onRootContentClose();
					if (content.contains(getActiveElement())) itemContext.triggerRef.value?.focus();
				};
				content.addEventListener(EVENT_ROOT_CONTENT_DISMISS, handleClose);
				cleanupFn(() => content.removeEventListener(EVENT_ROOT_CONTENT_DISMISS, handleClose));
			}
		});
		function handleEscapeKeyDown(ev) {
			emits("escapeKeyDown", ev);
			if (!ev.defaultPrevented) {
				menuContext.onItemDismiss();
				itemContext.triggerRef?.value?.focus();
				itemContext.wasEscapeCloseRef.value = true;
			}
		}
		function handleKeydown(ev) {
			if (ev.target.closest("[data-reka-navigation-menu]") !== menuContext.rootNavigationMenu.value) return;
			const isMetaKey = ev.altKey || ev.ctrlKey || ev.metaKey;
			const isTabKey = ev.key === "Tab" && !isMetaKey;
			const candidates = getTabbableCandidates(ev.currentTarget);
			if (isTabKey) {
				const focusedElement = getActiveElement();
				const index = candidates.findIndex((candidate) => candidate === focusedElement);
				if (focusFirst(ev.shiftKey ? candidates.slice(0, index).reverse() : candidates.slice(index + 1, candidates.length))) ev.preventDefault();
				else {
					itemContext.focusProxyRef.value?.focus();
					return;
				}
			}
			useArrowNavigation(ev, getActiveElement(), void 0, {
				itemsArray: candidates,
				loop: false,
				enableIgnoredElement: true
			})?.focus();
		}
		function handleDismiss() {
			if (menuContext.modelValue.value !== itemContext.value) return;
			const rootContentDismissEvent = new Event(EVENT_ROOT_CONTENT_DISMISS, {
				bubbles: true,
				cancelable: true
			});
			currentElement.value?.dispatchEvent(rootContentDismissEvent);
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DismissableLayer_default), (0, vue_exports.mergeProps)({
				id: (0, vue_exports.unref)(contentId),
				ref: (0, vue_exports.unref)(forwardRef),
				"aria-labelledby": (0, vue_exports.unref)(triggerId),
				"data-motion": motionAttribute.value,
				"data-state": (0, vue_exports.unref)(getOpenState)((0, vue_exports.unref)(menuContext).modelValue.value === (0, vue_exports.unref)(itemContext).value),
				"data-orientation": (0, vue_exports.unref)(menuContext).orientation
			}, props, {
				onKeydown: handleKeydown,
				onEscapeKeyDown: handleEscapeKeyDown,
				onPointerDownOutside: handlePointerDownOutside,
				onFocusOutside: handleFocusOutside,
				onDismiss: handleDismiss
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, [
				"id",
				"aria-labelledby",
				"data-motion",
				"data-state",
				"data-orientation"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuContent.js
var NavigationMenuContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "NavigationMenuContent",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		disableOutsidePointerEvents: {
			type: Boolean,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const forwarded = useForwardPropsEmits(reactiveOmit(props, "forceMount"), emits);
		const { forwardRef } = useForwardExpose();
		const menuContext = injectNavigationMenuContext();
		const itemContext = injectNavigationMenuItemContext();
		const open = (0, vue_exports.computed)(() => itemContext.value === menuContext.modelValue.value);
		const isLastActiveValue = (0, vue_exports.computed)(() => {
			if (menuContext.viewport.value) {
				if (!menuContext.modelValue.value && menuContext.previousValue.value) return menuContext.previousValue.value === itemContext.value;
			}
			return false;
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Teleport, {
				to: (0, vue_exports.unref)(isClient$1) && (0, vue_exports.unref)(menuContext).viewport.value ? (0, vue_exports.unref)(menuContext).viewport.value : "body",
				disabled: (0, vue_exports.unref)(isClient$1) && (0, vue_exports.unref)(menuContext).viewport.value ? !(0, vue_exports.unref)(menuContext).viewport.value : true
			}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(Presence_default), {
				present: _ctx.forceMount || open.value || isLastActiveValue.value,
				"force-mount": !(0, vue_exports.unref)(menuContext).unmountOnHide.value
			}, {
				default: (0, vue_exports.withCtx)(({ present }) => [(0, vue_exports.createVNode)(NavigationMenuContentImpl_default, (0, vue_exports.mergeProps)({
					ref: (0, vue_exports.unref)(forwardRef),
					"data-state": (0, vue_exports.unref)(getOpenState)(open.value),
					style: { pointerEvents: !open.value && (0, vue_exports.unref)(menuContext).isRootMenu ? "none" : void 0 }
				}, {
					..._ctx.$attrs,
					...(0, vue_exports.unref)(forwarded)
				}, {
					hidden: !present,
					onPointerenter: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(menuContext).onContentEnter((0, vue_exports.unref)(itemContext).value)),
					onPointerleave: _cache[1] || (_cache[1] = ($event) => (0, vue_exports.unref)(whenMouse)(() => (0, vue_exports.unref)(menuContext).onContentLeave())($event)),
					onPointerDownOutside: _cache[2] || (_cache[2] = ($event) => emits("pointerDownOutside", $event)),
					onFocusOutside: _cache[3] || (_cache[3] = ($event) => emits("focusOutside", $event)),
					onInteractOutside: _cache[4] || (_cache[4] = ($event) => emits("interactOutside", $event))
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 2
				}, 1040, [
					"data-state",
					"style",
					"hidden"
				])]),
				_: 3
			}, 8, ["present", "force-mount"])], 8, ["to", "disabled"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuLink.js
var NavigationMenuLink_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "NavigationMenuLink",
	props: {
		active: {
			type: Boolean,
			required: false
		},
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "a"
		}
	},
	emits: ["select"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { CollectionItem } = useCollection({ key: "NavigationMenu" });
		useForwardExpose();
		async function handleClick(ev) {
			const linkSelectEvent = new CustomEvent(LINK_SELECT, {
				bubbles: true,
				cancelable: true,
				detail: { originalEvent: ev }
			});
			emits("select", linkSelectEvent);
			if (!linkSelectEvent.defaultPrevented && !ev.metaKey) {
				const rootContentDismissEvent = new CustomEvent(EVENT_ROOT_CONTENT_DISMISS, {
					bubbles: true,
					cancelable: true
				});
				ev.target?.dispatchEvent(rootContentDismissEvent);
			}
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollectionItem), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					as: _ctx.as,
					"data-active": _ctx.active ? "" : void 0,
					"aria-current": _ctx.active ? "page" : void 0,
					"as-child": props.asChild,
					onClick: handleClick
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"as",
					"data-active",
					"aria-current",
					"as-child"
				])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuList.js
var NavigationMenuList_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "NavigationMenuList",
	props: {
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "ul"
		}
	},
	setup(__props) {
		const props = __props;
		const menuContext = injectNavigationMenuContext();
		const { forwardRef, currentElement } = useForwardExpose();
		(0, vue_exports.onMounted)(() => {
			menuContext.onIndicatorTrackChange(currentElement.value);
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				ref: (0, vue_exports.unref)(forwardRef),
				style: { "position": "relative" }
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(_ctx.$attrs, {
					"as-child": props.asChild,
					as: _ctx.as,
					"data-orientation": (0, vue_exports.unref)(menuContext).orientation
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16, [
					"as-child",
					"as",
					"data-orientation"
				])]),
				_: 3
			}, 512);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuTrigger.js
var _hoisted_1 = ["aria-owns"];
var NavigationMenuTrigger_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "NavigationMenuTrigger",
	props: {
		disabled: {
			type: Boolean,
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
		const menuContext = injectNavigationMenuContext();
		const itemContext = injectNavigationMenuItemContext();
		const { CollectionItem } = useCollection({ key: "NavigationMenu" });
		const { forwardRef, currentElement: triggerElement } = useForwardExpose();
		const triggerId = (0, vue_exports.ref)("");
		const contentId = (0, vue_exports.ref)("");
		const hasPointerMoveOpenedRef = refAutoReset(false, 300);
		const wasClickCloseRef = (0, vue_exports.ref)(false);
		const open = (0, vue_exports.computed)(() => itemContext.value === menuContext.modelValue.value);
		(0, vue_exports.onMounted)(() => {
			itemContext.triggerRef = triggerElement;
			triggerId.value = makeTriggerId(menuContext.baseId, itemContext.value);
			contentId.value = makeContentId(menuContext.baseId, itemContext.value);
		});
		function handlePointerEnter() {
			if (menuContext.disableHoverTrigger.value) return;
			wasClickCloseRef.value = false;
			itemContext.wasEscapeCloseRef.value = false;
		}
		function handlePointerMove(ev) {
			if (menuContext.disableHoverTrigger.value) return;
			if (ev.pointerType === "mouse") {
				if (props.disabled || wasClickCloseRef.value || itemContext.wasEscapeCloseRef.value || hasPointerMoveOpenedRef.value) return;
				menuContext.onTriggerEnter(itemContext.value);
				hasPointerMoveOpenedRef.value = true;
			}
		}
		function handlePointerLeave(ev) {
			if (menuContext.disableHoverTrigger.value) return;
			if (ev.pointerType === "mouse") {
				if (props.disabled) return;
				menuContext.onTriggerLeave();
				hasPointerMoveOpenedRef.value = false;
			}
		}
		function handleClick(event) {
			if ((!("pointerType" in event) || event.pointerType === "mouse") && menuContext.disableClickTrigger.value) return;
			if (hasPointerMoveOpenedRef.value) return;
			if (open.value) menuContext.onItemSelect("");
			else menuContext.onItemSelect(itemContext.value);
			wasClickCloseRef.value = open.value;
		}
		function handleKeydown(ev) {
			const entryKey = {
				horizontal: "ArrowDown",
				vertical: menuContext.dir.value === "rtl" ? "ArrowLeft" : "ArrowRight"
			}[menuContext.orientation];
			if (open.value && ev.key === entryKey) {
				itemContext.onEntryKeyDown();
				ev.preventDefault();
				ev.stopPropagation();
			}
		}
		function setFocusProxyRef(node) {
			if (!node) return void 0;
			itemContext.focusProxyRef.value = unrefElement$1(node);
		}
		function handleVisuallyHiddenFocus(ev) {
			const content = document.getElementById(itemContext.contentId);
			const prevFocusedElement = ev.relatedTarget;
			const wasTriggerFocused = prevFocusedElement === triggerElement.value;
			const wasFocusFromContent = content?.contains(prevFocusedElement);
			if (wasTriggerFocused || !wasFocusFromContent) itemContext.onFocusProxyEnter(wasTriggerFocused ? "start" : "end");
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)(vue_exports.Fragment, null, [(0, vue_exports.createVNode)((0, vue_exports.unref)(CollectionItem), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
					id: triggerId.value,
					ref: (0, vue_exports.unref)(forwardRef),
					disabled: _ctx.disabled,
					"data-disabled": _ctx.disabled ? "" : void 0,
					"data-state": (0, vue_exports.unref)(getOpenState)(open.value),
					"data-navigation-menu-trigger": "",
					"aria-expanded": open.value,
					"aria-controls": contentId.value,
					"as-child": props.asChild,
					as: _ctx.as
				}, _ctx.$attrs, {
					onPointerenter: handlePointerEnter,
					onPointermove: handlePointerMove,
					onPointerleave: handlePointerLeave,
					onClick: handleClick,
					onKeydown: handleKeydown
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16, [
					"id",
					"disabled",
					"data-disabled",
					"data-state",
					"aria-expanded",
					"aria-controls",
					"as-child",
					"as"
				])]),
				_: 3
			}), open.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(VisuallyHidden_default), {
				ref: setFocusProxyRef,
				"aria-hidden": "true",
				tabindex: 0,
				onFocus: handleVisuallyHiddenFocus
			}), (0, vue_exports.unref)(menuContext).viewport ? ((0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)("span", {
				key: 0,
				"aria-owns": contentId.value
			}, null, 8, _hoisted_1)) : (0, vue_exports.createCommentVNode)("v-if", true)], 64)) : (0, vue_exports.createCommentVNode)("v-if", true)], 64);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/NavigationMenu/NavigationMenuViewport.js
var NavigationMenuViewport_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "NavigationMenuViewport",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		align: {
			type: String,
			required: false,
			default: "center"
		},
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
		const { forwardRef, currentElement } = useForwardExpose();
		const menuContext = injectNavigationMenuContext();
		const { activeTrigger, rootNavigationMenu, modelValue } = menuContext;
		const size = (0, vue_exports.ref)();
		const position = (0, vue_exports.ref)();
		const open = (0, vue_exports.computed)(() => !!menuContext.modelValue.value);
		(0, vue_exports.watch)(currentElement, () => {
			menuContext.onViewportChange(currentElement.value);
		});
		const content = (0, vue_exports.ref)();
		(0, vue_exports.watch)([modelValue, open], () => {
			(0, vue_exports.nextTick)(() => {
				if (!currentElement.value) return;
				requestAnimationFrame(() => {
					const el = currentElement.value?.querySelector("[data-state=open]");
					content.value = el;
				});
			});
		}, { immediate: true });
		function updatePosition() {
			if (content.value && activeTrigger.value && rootNavigationMenu.value) {
				const bodyWidth = document.documentElement.offsetWidth;
				const bodyHeight = document.documentElement.offsetHeight;
				const rootRect = rootNavigationMenu.value.getBoundingClientRect();
				const rect = activeTrigger.value.getBoundingClientRect();
				const { offsetWidth, offsetHeight } = content.value;
				const startPositionLeft = rect.left - rootRect.left;
				const startPositionTop = rect.top - rootRect.top;
				let posLeft = null;
				let posTop = null;
				switch (props.align) {
					case "start":
						posLeft = startPositionLeft;
						posTop = startPositionTop;
						break;
					case "end":
						posLeft = startPositionLeft - offsetWidth + rect.width;
						posTop = startPositionTop - offsetHeight + rect.height;
						break;
					default:
						posLeft = startPositionLeft - offsetWidth / 2 + rect.width / 2;
						posTop = startPositionTop - offsetHeight / 2 + rect.height / 2;
				}
				const screenOffset = 10;
				if (posLeft + rootRect.left < screenOffset) posLeft = screenOffset - rootRect.left;
				const rightOffset = posLeft + rootRect.left + offsetWidth;
				if (rightOffset > bodyWidth - screenOffset) {
					posLeft -= rightOffset - bodyWidth + screenOffset;
					if (posLeft < screenOffset - rootRect.left) posLeft = screenOffset - rootRect.left;
				}
				if (posTop + rootRect.top < screenOffset) posTop = screenOffset - rootRect.top;
				const bottomOffset = posTop + rootRect.top + offsetHeight;
				if (bottomOffset > bodyHeight - screenOffset) {
					posTop -= bottomOffset - bodyHeight + screenOffset;
					if (posTop < screenOffset - rootRect.top) posTop = screenOffset - rootRect.top;
				}
				posLeft = Math.round(posLeft);
				posTop = Math.round(posTop);
				position.value = {
					left: posLeft,
					top: posTop
				};
			}
		}
		useResizeObserver(content, () => {
			if (content.value) {
				size.value = {
					width: content.value.offsetWidth,
					height: content.value.offsetHeight
				};
				updatePosition();
			}
		});
		useResizeObserver([globalThis.document?.body, rootNavigationMenu], () => {
			updatePosition();
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), {
				present: _ctx.forceMount || open.value,
				"force-mount": !(0, vue_exports.unref)(menuContext).unmountOnHide.value,
				onAfterLeave: _cache[2] || (_cache[2] = () => {
					size.value = void 0;
					position.value = void 0;
				})
			}, {
				default: (0, vue_exports.withCtx)(({ present }) => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(_ctx.$attrs, {
					ref: (0, vue_exports.unref)(forwardRef),
					as: _ctx.as,
					"as-child": _ctx.asChild,
					"data-state": (0, vue_exports.unref)(getOpenState)(open.value),
					"data-orientation": (0, vue_exports.unref)(menuContext).orientation,
					style: {
						pointerEvents: !open.value && (0, vue_exports.unref)(menuContext).isRootMenu ? "none" : void 0,
						["--reka-navigation-menu-viewport-width"]: size.value ? `${size.value?.width}px` : void 0,
						["--reka-navigation-menu-viewport-height"]: size.value ? `${size.value?.height}px` : void 0,
						["--reka-navigation-menu-viewport-left"]: position.value ? `${position.value?.left}px` : void 0,
						["--reka-navigation-menu-viewport-top"]: position.value ? `${position.value?.top}px` : void 0
					},
					hidden: !present,
					onPointerenter: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(menuContext).onContentEnter((0, vue_exports.unref)(menuContext).modelValue.value)),
					onPointerleave: _cache[1] || (_cache[1] = ($event) => (0, vue_exports.unref)(whenMouse)(() => (0, vue_exports.unref)(menuContext).onContentLeave())($event))
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 2
				}, 1040, [
					"as",
					"as-child",
					"data-state",
					"data-orientation",
					"style",
					"hidden"
				])]),
				_: 3
			}, 8, ["present", "force-mount"]);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/BottomNav.vue?vue&type=script&setup=true&lang.ts
var BottomNav_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BottomNav",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The phone's bottom bar: five destinations, always in reach, never hidden on scroll. The basket
		* carries its count. It sits above the safe area, and the page keeps room for it at the bottom so
		* nothing ends underneath.
		*/
		const shared = useShared();
		const menus = useMenus();
		const items = (0, vue_exports.computed)(() => menus.value.mobile_bottom.map((item) => ({
			...item,
			iconName: item.icon && isIconName(item.icon) ? item.icon : "home",
			current: shared.value.routeName === item.routeName,
			isCart: item.routeName === "warenkorb.index"
		})));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<nav${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "bnav until-lg",
				"aria-label": "Hauptnavigation"
			}, _attrs))} data-v-ed9ff026><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(items.value, (item) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: item.label,
					href: item.href,
					class: "bnav__item",
					"aria-current": item.current ? "page" : void 0,
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<span class="bnav__icon" data-v-ed9ff026${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: item.iconName,
								size: 24
							}, null, _parent, _scopeId));
							if (item.isCart && (0, vue_exports.unref)(shared).cartCount > 0) _push(`<span class="badge badge--count bnav__badge" aria-hidden="true" data-v-ed9ff026${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).cartCount)}</span>`);
							else _push(`<!---->`);
							_push(`</span><span class="bnav__label" data-v-ed9ff026${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</span>`);
							if (item.isCart && (0, vue_exports.unref)(shared).cartCount > 0) _push(`<span class="visually-hidden" data-v-ed9ff026${_scopeId}>, ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).cartCount)} Artikel</span>`);
							else _push(`<!---->`);
						} else return [
							(0, vue_exports.createVNode)("span", { class: "bnav__icon" }, [(0, vue_exports.createVNode)(Icon_default, {
								name: item.iconName,
								size: 24
							}, null, 8, ["name"]), item.isCart && (0, vue_exports.unref)(shared).cartCount > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "badge badge--count bnav__badge",
								"aria-hidden": "true"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(shared).cartCount), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
							(0, vue_exports.createVNode)("span", { class: "bnav__label" }, (0, vue_exports.toDisplayString)(item.label), 1),
							item.isCart && (0, vue_exports.unref)(shared).cartCount > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "visually-hidden"
							}, ", " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(shared).cartCount) + " Artikel", 1)) : (0, vue_exports.createCommentVNode)("", true)
						];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--></nav>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/BottomNav.vue
var _sfc_setup$9 = BottomNav_vue_vue_type_script_setup_true_lang_default.setup;
BottomNav_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/BottomNav.vue");
	return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var BottomNav_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BottomNav_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ed9ff026"]]);
//#endregion
//#region resources/js/Components/Ui/Kbd.vue?vue&type=script&setup=true&lang.ts
var Kbd_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Kbd",
	__ssrInlineRender: true,
	props: {
		keys: {},
		modifier: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* A keyboard hint. The modifier is written the way the visitor's keyboard writes it: ⌘ on a Mac,
		* Strg everywhere else — decided after mount, so the server and the client agree on the first
		* frame and only the label changes.
		*/
		const props = __props;
		const mod = (0, vue_exports.ref)("Strg");
		(0, vue_exports.onMounted)(() => {
			if (/Mac|iPhone|iPad/.test(navigator.platform)) mod.value = "⌘";
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<span${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "kbd-group" }, _attrs))} data-v-8ddf4b70>`);
			if (props.modifier) _push(`<kbd class="kbd" data-v-8ddf4b70>${(0, server_renderer_exports.ssrInterpolate)(mod.value)}</kbd>`);
			else _push(`<!---->`);
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(props.keys, (key) => {
				_push(`<kbd class="kbd" data-v-8ddf4b70>${(0, server_renderer_exports.ssrInterpolate)(key)}</kbd>`);
			});
			_push(`<!--]--></span>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Kbd.vue
var _sfc_setup$8 = Kbd_vue_vue_type_script_setup_true_lang_default.setup;
Kbd_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Kbd.vue");
	return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var Kbd_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Kbd_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8ddf4b70"]]);
//#endregion
//#region resources/js/Components/Chrome/CommandPalette.vue?vue&type=script&setup=true&lang.ts
var CommandPalette_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CommandPalette",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The command palette: Ctrl/⌘+K anywhere, or the search icon on a phone. One field, and under it
		* the instant search's groups plus the handful of actions people reach for by keyboard — the
		* vehicle, the basket, the check, the contact, the shortcut list. Arrow keys move, Enter goes,
		* Esc closes; the field keeps focus throughout (aria-activedescendant), so a screen reader hears
		* every move.
		*/
		const shell = useShell();
		const shared = useShared();
		const search = useSearch();
		const query = (0, vue_exports.ref)("");
		const active = (0, vue_exports.ref)(0);
		const input = (0, vue_exports.ref)(null);
		const recent = (0, vue_exports.ref)([]);
		const actions = (0, vue_exports.computed)(() => {
			const vehicle = shared.value.vehicle;
			const list = [];
			if (vehicle) {
				list.push({
					id: "a-felgen",
					group: "Aktionen",
					label: `Passende Felgen für ${vehicle.short}`,
					sub: null,
					href: "/felgen",
					icon: "wheel"
				});
				list.push({
					id: "a-change",
					group: "Aktionen",
					label: "Fahrzeug ändern",
					sub: vehicle.label,
					href: "/felgen-suchen",
					icon: "car"
				});
			} else list.push({
				id: "a-choose",
				group: "Aktionen",
				label: "Fahrzeug wählen",
				sub: "Marke und Modell oder HSN/TSN",
				href: "/felgen-suchen",
				icon: "car"
			});
			list.push({
				id: "a-cart",
				group: "Aktionen",
				label: "Warenkorb öffnen",
				sub: shared.value.cartCount > 0 ? `${shared.value.cartCount} Artikel` : null,
				href: "/warenkorb",
				icon: "cart"
			});
			list.push({
				id: "a-check",
				group: "Aktionen",
				label: "RIMIFY-Check",
				sub: "Passt eine Felge an mein Auto?",
				href: "/rimify-check",
				icon: "check-circle"
			});
			const phone = shared.value.contact.phone;
			list.push({
				id: "a-contact",
				group: "Aktionen",
				label: "Kontakt",
				sub: phone ?? shared.value.contact.email,
				href: "/kontakt",
				icon: phone ? "phone" : "mail"
			});
			list.push({
				id: "a-help",
				group: "Aktionen",
				label: "Tastenkürzel",
				sub: null,
				href: "#",
				icon: "keyboard",
				action: () => {
					shell.paletteOpen.value = false;
					shell.helpOpen.value = true;
				}
			});
			return list;
		});
		const ICONS = {
			felgen: "wheel",
			marken: "grid",
			groessen: "ruler",
			seiten: "document"
		};
		const entries = (0, vue_exports.computed)(() => {
			const result = search.result.value;
			const found = [];
			if (result) for (const group of result.groups) for (const [i, item] of group.items.entries()) found.push({
				id: `${group.key}-${i}`,
				group: group.label,
				label: item.label,
				sub: item.sub,
				href: item.href,
				icon: ICONS[group.key] ?? "search"
			});
			const needle = query.value.trim().toLowerCase();
			const matching = needle === "" ? actions.value : actions.value.filter((a) => a.label.toLowerCase().includes(needle));
			return [...found, ...matching];
		});
		const groups = (0, vue_exports.computed)(() => {
			const out = [];
			for (const entry of entries.value) {
				const last = out[out.length - 1];
				if (last && last.label === entry.group) last.entries.push(entry);
				else out.push({
					label: entry.group,
					entries: [entry]
				});
			}
			return out;
		});
		const activeId = (0, vue_exports.computed)(() => entries.value[active.value]?.id ?? void 0);
		(0, vue_exports.watch)(query, (value) => {
			active.value = 0;
			search.run(value);
		});
		(0, vue_exports.watch)(() => shell.paletteOpen.value, async (open) => {
			if (open) {
				query.value = "";
				active.value = 0;
				search.clear();
				recent.value = readRecent();
				await (0, vue_exports.nextTick)();
				input.value?.focus();
			}
		});
		function go(entry) {
			if (entry.action) {
				entry.action();
				return;
			}
			if (query.value.trim() !== "") remember(query.value.trim());
			shell.paletteOpen.value = false;
			router.visit(entry.href);
		}
		function onKeydown(event) {
			const count = entries.value.length;
			if (event.key === "ArrowDown") {
				event.preventDefault();
				active.value = count === 0 ? 0 : (active.value + 1) % count;
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				active.value = count === 0 ? 0 : (active.value - 1 + count) % count;
			} else if (event.key === "Enter") {
				const entry = entries.value[active.value];
				if (entry) {
					event.preventDefault();
					go(entry);
				}
			}
		}
		function useSuggestion() {
			if (search.result.value?.suggestion) query.value = search.result.value.suggestion;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: (0, vue_exports.unref)(shell).paletteOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(shell).paletteOpen.value = $event,
				title: "Suche und Befehle",
				"hide-title": "",
				class: "palette"
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="palette__field input-group" data-v-f1779d76${_scopeId}><span class="input-group__icon" data-v-f1779d76${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "search",
							size: 20
						}, null, _parent, _scopeId));
						_push(`</span><input${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input palette__input" type="text" role="combobox" aria-label="Suche und Befehle" aria-autocomplete="list" aria-controls="palette-list"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", entries.value.length > 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-activedescendant", activeId.value)} placeholder="Felge, Marke, Größe oder Seite" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" data-v-f1779d76${_scopeId}></div><div id="palette-list" class="palette__list" role="listbox" aria-label="Ergebnisse"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(search).loading.value ? "true" : void 0)} data-v-f1779d76${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
							_push(`<!--[--><p class="menu__label" role="presentation" data-v-f1779d76${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(group.entries, (entry) => {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									id: entry.id,
									key: entry.id,
									href: entry.href,
									role: "option",
									"aria-selected": entry.id === activeId.value,
									class: ["menu__item palette__item", { "palette__item--active": entry.id === activeId.value }],
									tabindex: "-1",
									onClick: ($event) => go(entry),
									onMousemove: ($event) => active.value = entries.value.indexOf(entry)
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
												name: entry.icon,
												size: 20
											}, null, _parent, _scopeId));
											_push(`<span class="palette__text" data-v-f1779d76${_scopeId}><span data-v-f1779d76${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</span>`);
											if (entry.sub) _push(`<span class="small quiet" data-v-f1779d76${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.sub)}</span>`);
											else _push(`<!---->`);
											_push(`</span>`);
										} else return [(0, vue_exports.createVNode)(Icon_default, {
											name: entry.icon,
											size: 20
										}, null, 8, ["name"]), (0, vue_exports.createVNode)("span", { class: "palette__text" }, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(entry.label), 1), entry.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "small quiet"
										}, (0, vue_exports.toDisplayString)(entry.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)])];
									}),
									_: 2
								}, _parent, _scopeId));
							});
							_push(`<!--]--><!--]-->`);
						});
						_push(`<!--]-->`);
						if ((0, vue_exports.unref)(search).loading.value && entries.value.length === 0) _push(`<p class="palette__empty" data-v-f1779d76${_scopeId}>Suche läuft …</p>`);
						else if (query.value.trim() !== "" && (0, vue_exports.unref)(search).result.value && (0, vue_exports.unref)(search).result.value.total === 0) {
							_push(`<p class="palette__empty" data-v-f1779d76${_scopeId}> Nichts gefunden für „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“. `);
							if ((0, vue_exports.unref)(search).result.value.suggestion) _push(`<button class="link" type="button" data-v-f1779d76${_scopeId}> Meintest du „${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(search).result.value.suggestion)}“? </button>`);
							else _push(`<!--[-->Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“.<!--]-->`);
							_push(`</p>`);
						} else _push(`<!---->`);
						if ((0, vue_exports.unref)(search).failed.value) _push(`<p class="palette__empty" data-v-f1779d76${_scopeId}>Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.</p>`);
						else _push(`<!---->`);
						if (query.value.trim() === "" && recent.value.length) {
							_push(`<!--[--><p class="menu__label" role="presentation" data-v-f1779d76${_scopeId}>Zuletzt gesucht</p><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(recent.value, (term) => {
								_push(`<button class="menu__item palette__item" type="button" tabindex="-1" data-v-f1779d76${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "clock",
									size: 20
								}, null, _parent, _scopeId));
								_push(`<span data-v-f1779d76${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(term)}</span></button>`);
							});
							_push(`<!--]--><!--]-->`);
						} else _push(`<!---->`);
						_push(`</div><p class="palette__hints small quiet" data-v-f1779d76${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↑", "↓"] }, null, _parent, _scopeId));
						_push(` wählen `);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↵"] }, null, _parent, _scopeId));
						_push(` öffnen `);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["Esc"] }, null, _parent, _scopeId));
						_push(` schließen </p>`);
					} else return [
						(0, vue_exports.createVNode)("div", { class: "palette__field input-group" }, [(0, vue_exports.createVNode)("span", { class: "input-group__icon" }, [(0, vue_exports.createVNode)(Icon_default, {
							name: "search",
							size: 20
						})]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
							ref_key: "input",
							ref: input,
							"onUpdate:modelValue": ($event) => query.value = $event,
							class: "input palette__input",
							type: "text",
							role: "combobox",
							"aria-label": "Suche und Befehle",
							"aria-autocomplete": "list",
							"aria-controls": "palette-list",
							"aria-expanded": entries.value.length > 0,
							"aria-activedescendant": activeId.value,
							placeholder: "Felge, Marke, Größe oder Seite",
							autocomplete: "off",
							autocapitalize: "off",
							spellcheck: "false",
							enterkeyhint: "go",
							onKeydown
						}, null, 40, [
							"onUpdate:modelValue",
							"aria-expanded",
							"aria-activedescendant"
						]), [[vue_exports.vModelText, query.value]])]),
						(0, vue_exports.createVNode)("div", {
							id: "palette-list",
							class: "palette__list",
							role: "listbox",
							"aria-label": "Ergebnisse",
							"aria-busy": (0, vue_exports.unref)(search).loading.value ? "true" : void 0
						}, [
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (group) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: group.label }, [(0, vue_exports.createVNode)("p", {
									class: "menu__label",
									role: "presentation"
								}, (0, vue_exports.toDisplayString)(group.label), 1), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.entries, (entry) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
										id: entry.id,
										key: entry.id,
										href: entry.href,
										role: "option",
										"aria-selected": entry.id === activeId.value,
										class: ["menu__item palette__item", { "palette__item--active": entry.id === activeId.value }],
										tabindex: "-1",
										onClick: (0, vue_exports.withModifiers)(($event) => go(entry), ["prevent"]),
										onMousemove: ($event) => active.value = entries.value.indexOf(entry)
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
											name: entry.icon,
											size: 20
										}, null, 8, ["name"]), (0, vue_exports.createVNode)("span", { class: "palette__text" }, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(entry.label), 1), entry.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "small quiet"
										}, (0, vue_exports.toDisplayString)(entry.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)])]),
										_: 2
									}, 1032, [
										"id",
										"href",
										"aria-selected",
										"class",
										"onClick",
										"onMousemove"
									]);
								}), 128))], 64);
							}), 128)),
							(0, vue_exports.unref)(search).loading.value && entries.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "palette__empty"
							}, "Suche läuft …")) : query.value.trim() !== "" && (0, vue_exports.unref)(search).result.value && (0, vue_exports.unref)(search).result.value.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "palette__empty"
							}, [(0, vue_exports.createTextVNode)(" Nichts gefunden für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“. ", 1), (0, vue_exports.unref)(search).result.value.suggestion ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "link",
								type: "button",
								onClick: useSuggestion
							}, " Meintest du „" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(search).result.value.suggestion) + "“? ", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“.")], 64))])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.unref)(search).failed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "palette__empty"
							}, "Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.")) : (0, vue_exports.createCommentVNode)("", true),
							query.value.trim() === "" && recent.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)("p", {
								class: "menu__label",
								role: "presentation"
							}, "Zuletzt gesucht"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(recent.value, (term) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: term,
									class: "menu__item palette__item",
									type: "button",
									tabindex: "-1",
									onClick: ($event) => query.value = term
								}, [(0, vue_exports.createVNode)(Icon_default, {
									name: "clock",
									size: 20
								}), (0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(term), 1)], 8, ["onClick"]);
							}), 128))], 64)) : (0, vue_exports.createCommentVNode)("", true)
						], 8, ["aria-busy"]),
						(0, vue_exports.createVNode)("p", { class: "palette__hints small quiet" }, [
							(0, vue_exports.createVNode)(Kbd_default, { keys: ["↑", "↓"] }),
							(0, vue_exports.createTextVNode)(" wählen "),
							(0, vue_exports.createVNode)(Kbd_default, { keys: ["↵"] }),
							(0, vue_exports.createTextVNode)(" öffnen "),
							(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] }),
							(0, vue_exports.createTextVNode)(" schließen ")
						])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/CommandPalette.vue
var _sfc_setup$7 = CommandPalette_vue_vue_type_script_setup_true_lang_default.setup;
CommandPalette_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CommandPalette.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var CommandPalette_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CommandPalette_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f1779d76"]]);
//#endregion
//#region resources/js/Components/Chrome/ShortcutsDialog.vue?vue&type=script&setup=true&lang.ts
var ShortcutsDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ShortcutsDialog",
	__ssrInlineRender: true,
	setup(__props) {
		/** The shortcut list: opened with `?` or from the footer. */
		const shell = useShell();
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: (0, vue_exports.unref)(shell).helpOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(shell).helpOpen.value = $event,
				title: "Tastenkürzel",
				description: "Die Kürzel gelten überall, außer wenn du gerade in ein Feld schreibst."
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<dl class="shortcuts" data-v-533b9687${_scopeId}><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["/"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Suche fokussieren</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, {
							keys: ["K"],
							modifier: ""
						}, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Suche und Befehle öffnen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["?"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Diese Liste</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["Esc"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Dialog oder Menü schließen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↑", "↓"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>In Listen bewegen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↵"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Auswahl öffnen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["F8"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Letzte Meldung</dd></dl>`);
					} else return [(0, vue_exports.createVNode)("dl", { class: "shortcuts" }, [
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["/"] })]),
						(0, vue_exports.createVNode)("dd", null, "Suche fokussieren"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, {
							keys: ["K"],
							modifier: ""
						})]),
						(0, vue_exports.createVNode)("dd", null, "Suche und Befehle öffnen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["?"] })]),
						(0, vue_exports.createVNode)("dd", null, "Diese Liste"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] })]),
						(0, vue_exports.createVNode)("dd", null, "Dialog oder Menü schließen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["↑", "↓"] })]),
						(0, vue_exports.createVNode)("dd", null, "In Listen bewegen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["↵"] })]),
						(0, vue_exports.createVNode)("dd", null, "Auswahl öffnen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["F8"] })]),
						(0, vue_exports.createVNode)("dd", null, "Letzte Meldung")
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/ShortcutsDialog.vue
var _sfc_setup$6 = ShortcutsDialog_vue_vue_type_script_setup_true_lang_default.setup;
ShortcutsDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/ShortcutsDialog.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var ShortcutsDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ShortcutsDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-533b9687"]]);
//#endregion
//#region resources/js/Components/Chrome/SiteFooter.vue?vue&type=script&setup=true&lang.ts
var SiteFooter_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SiteFooter",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The footer: how to reach a person, where the shop's pages are, and the legal lines a German
		* shop owes its customers. Payment and shipping marks appear here the day they are configured;
		* until then, none are drawn.
		*/
		const shared = useShared();
		const menus = useMenus();
		useConsent();
		useShell();
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? "").replace(/\s/g, "")}`);
		const waHref = (0, vue_exports.computed)(() => `https://wa.me/${(contact.value.whatsapp ?? "").replace(/[^\d]/g, "")}`);
		const year = (/* @__PURE__ */ new Date()).getFullYear();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<footer${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "footer dark" }, _attrs))} data-v-e49ab442><div class="container" data-v-e49ab442><div class="footer__grid" data-v-e49ab442><div class="footer__brand" data-v-e49ab442><span class="brand" data-v-e49ab442>RIMIFY</span><p class="footer__claim" data-v-e49ab442>Felgen, deren Gutachten dein Fahrzeug nennt.</p><ul class="footer__contact" data-v-e49ab442>`);
			if (contact.value.phone) {
				_push(`<li data-v-e49ab442><a${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} class="footer__contact-link num" data-v-e49ab442>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a></li>`);
			} else _push(`<!---->`);
			if (contact.value.whatsapp) _push(`<li data-v-e49ab442><a${(0, server_renderer_exports.ssrRenderAttr)("href", waHref.value)} class="footer__contact-link num" rel="noopener" target="_blank" data-v-e49ab442><span class="footer__icon-slot" aria-hidden="true" data-v-e49ab442></span>WhatsApp ${(0, server_renderer_exports.ssrInterpolate)(contact.value.whatsapp)}</a></li>`);
			else _push(`<!---->`);
			_push(`<li data-v-e49ab442><a${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value.email}`)} class="footer__contact-link" data-v-e49ab442>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20
			}, null, _parent));
			_push(`${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a></li><li class="footer__hours" data-v-e49ab442>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "clock",
				size: 20
			}, null, _parent));
			_push(`${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</li></ul></div><nav class="footer__col" aria-labelledby="ftr-shop" data-v-e49ab442><p id="ftr-shop" class="footer__title" data-v-e49ab442>Shop</p><ul data-v-e49ab442><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_shop, (item) => {
				_push(`<li data-v-e49ab442>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: item.href,
					class: "footer__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--></ul></nav><nav class="footer__col" aria-labelledby="ftr-service" data-v-e49ab442><p id="ftr-service" class="footer__title" data-v-e49ab442>Service</p><ul data-v-e49ab442><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_service, (item) => {
				_push(`<li data-v-e49ab442>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: item.href,
					class: "footer__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--><li data-v-e49ab442><button class="footer__link footer__button" type="button" data-v-e49ab442>Tastenkürzel</button></li></ul></nav><nav class="footer__col" aria-labelledby="ftr-legal" data-v-e49ab442><p id="ftr-legal" class="footer__title" data-v-e49ab442>Rechtliches</p><ul data-v-e49ab442><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_legal, (item) => {
				_push(`<li data-v-e49ab442>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: item.href,
					class: "footer__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--><li data-v-e49ab442><button class="footer__link footer__button" type="button" data-v-e49ab442>Cookie-Einstellungen</button></li></ul></nav></div><div class="footer__base" data-v-e49ab442><span data-v-e49ab442>Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten.</span><span class="num" data-v-e49ab442>© RIMIFY ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(year))}</span></div></div></footer>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/SiteFooter.vue
var _sfc_setup$5 = SiteFooter_vue_vue_type_script_setup_true_lang_default.setup;
SiteFooter_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SiteFooter.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var SiteFooter_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SiteFooter_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e49ab442"]]);
//#endregion
//#region resources/js/Components/Chrome/MegaMenu.vue?vue&type=script&setup=true&lang.ts
var MegaMenu_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "MegaMenu",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The desktop navigation. Felgen opens a panel across the full width under the header — by
		* brand, by size, by make, and four wheels people buy — on hover intent or on click and Enter;
		* it closes on Esc or after the pointer has left. Every other item is a plain link. Every entry
		* in the panel leads to a real listing; a brand or size with nothing behind it is not listed.
		*/
		const shared = useShared();
		const menus = useMenus();
		const items = (0, vue_exports.computed)(() => menus.value.header.map((item) => ({
			...item,
			target: resolveHref(item.href, item.behaviour, shared.value.vehicle !== null, "/felgen"),
			current: shared.value.routeName === item.routeName,
			mega: item.routeName === "felgen.index"
		})));
		const mega = (0, vue_exports.computed)(() => shared.value.mega);
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuRoot_default), (0, vue_exports.mergeProps)({
				class: "nav",
				"delay-duration": 150,
				"skip-delay-duration": 300
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuList_default), { class: "nav__list" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(items.value, (item) => {
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuItem_default), { key: item.label }, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													if (item.mega) {
														_push(`<!--[-->`);
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuTrigger_default), { class: ["nav__link nav__trigger", { "nav__link--current": item.current }] }, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	_push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)} `);
																	_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
																		name: "chevron-down",
																		size: 16,
																		class: "nav__chevron"
																	}, null, _parent, _scopeId));
																} else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label) + " ", 1), (0, vue_exports.createVNode)(Icon_default, {
																	name: "chevron-down",
																	size: 16,
																	class: "nav__chevron"
																})];
															}),
															_: 2
														}, _parent, _scopeId));
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuContent_default), { class: "mega" }, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	_push(`<div class="container mega__grid"${_scopeId}><div class="mega__col"${_scopeId}><p class="label"${_scopeId}>Nach Marke</p><ul${_scopeId}><!--[-->`);
																	(0, server_renderer_exports.ssrRenderList)(mega.value.brands, (brand) => {
																		_push(`<li${_scopeId}>`);
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																					href: brand.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(brand.label)}`);
																						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(brand.label), 1)];
																					}),
																					_: 2
																				}, _parent, _scopeId));
																				else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																					href: brand.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(brand.label), 1)]),
																					_: 2
																				}, 1032, ["href"])];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push(`</li>`);
																	});
																	_push(`<!--]--></ul></div><div class="mega__col"${_scopeId}><p class="label"${_scopeId}>Nach Größe</p><ul${_scopeId}><!--[-->`);
																	(0, server_renderer_exports.ssrRenderList)(mega.value.sizes, (size) => {
																		_push(`<li${_scopeId}>`);
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																					href: size.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																						if (_push) _push(`<span class="num"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</span><span class="small quiet num"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.count)} ${(0, server_renderer_exports.ssrInterpolate)(size.count === 1 ? "Modell" : "Modelle")}</span>`);
																						else return [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(size.count) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)];
																					}),
																					_: 2
																				}, _parent, _scopeId));
																				else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																					href: size.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(size.count) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
																					_: 2
																				}, 1032, ["href"])];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push(`</li>`);
																	});
																	_push(`<!--]--></ul></div><div class="mega__col"${_scopeId}><p class="label"${_scopeId}>Nach Fahrzeug</p><ul${_scopeId}><!--[-->`);
																	(0, server_renderer_exports.ssrRenderList)(mega.value.makes, (make) => {
																		_push(`<li${_scopeId}>`);
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																					href: make.href,
																					class: "mega__link"
																				}, {
																					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(make.label)}`);
																						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(make.label), 1)];
																					}),
																					_: 2
																				}, _parent, _scopeId));
																				else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																					href: make.href,
																					class: "mega__link"
																				}, {
																					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(make.label), 1)]),
																					_: 2
																				}, 1032, ["href"])];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push(`</li>`);
																	});
																	_push(`<!--]--></ul></div><div class="mega__col"${_scopeId}><p class="label"${_scopeId}>Beliebt</p><ul${_scopeId}><!--[-->`);
																	(0, server_renderer_exports.ssrRenderList)(mega.value.popular, (wheel) => {
																		_push(`<li${_scopeId}>`);
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																					href: wheel.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																						if (_push) _push(`<span${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.label)}</span><span class="small quiet"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.sub)}</span>`);
																						else return [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(wheel.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet" }, (0, vue_exports.toDisplayString)(wheel.sub), 1)];
																					}),
																					_: 2
																				}, _parent, _scopeId));
																				else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																					href: wheel.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(wheel.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet" }, (0, vue_exports.toDisplayString)(wheel.sub), 1)]),
																					_: 2
																				}, 1032, ["href"])];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push(`</li>`);
																	});
																	_push(`<!--]--></ul>`);
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																				href: "/felgen",
																				class: "mega__all",
																				prefetch: ""
																			}, {
																				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																					if (_push) {
																						_push(`Alle Felgen ansehen `);
																						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
																							name: "arrow-right",
																							size: 16
																						}, null, _parent, _scopeId));
																					} else return [(0, vue_exports.createTextVNode)("Alle Felgen ansehen "), (0, vue_exports.createVNode)(Icon_default, {
																						name: "arrow-right",
																						size: 16
																					})];
																				}),
																				_: 2
																			}, _parent, _scopeId));
																			else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																				href: "/felgen",
																				class: "mega__all",
																				prefetch: ""
																			}, {
																				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Alle Felgen ansehen "), (0, vue_exports.createVNode)(Icon_default, {
																					name: "arrow-right",
																					size: 16
																				})]),
																				_: 1
																			})];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	_push(`</div></div>`);
																} else return [(0, vue_exports.createVNode)("div", { class: "container mega__grid" }, [
																	(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Marke"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.brands, (brand) => {
																		return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: brand.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																				href: brand.href,
																				class: "mega__link",
																				prefetch: ""
																			}, {
																				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(brand.label), 1)]),
																				_: 2
																			}, 1032, ["href"])]),
																			_: 2
																		}, 1024)]);
																	}), 128))])]),
																	(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Größe"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.sizes, (size) => {
																		return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: size.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																				href: size.href,
																				class: "mega__link",
																				prefetch: ""
																			}, {
																				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(size.count) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
																				_: 2
																			}, 1032, ["href"])]),
																			_: 2
																		}, 1024)]);
																	}), 128))])]),
																	(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Fahrzeug"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.makes, (make) => {
																		return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: make.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																				href: make.href,
																				class: "mega__link"
																			}, {
																				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(make.label), 1)]),
																				_: 2
																			}, 1032, ["href"])]),
																			_: 2
																		}, 1024)]);
																	}), 128))])]),
																	(0, vue_exports.createVNode)("div", { class: "mega__col" }, [
																		(0, vue_exports.createVNode)("p", { class: "label" }, "Beliebt"),
																		(0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.popular, (wheel) => {
																			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: wheel.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																					href: wheel.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(wheel.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet" }, (0, vue_exports.toDisplayString)(wheel.sub), 1)]),
																					_: 2
																				}, 1032, ["href"])]),
																				_: 2
																			}, 1024)]);
																		}), 128))]),
																		(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																				href: "/felgen",
																				class: "mega__all",
																				prefetch: ""
																			}, {
																				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Alle Felgen ansehen "), (0, vue_exports.createVNode)(Icon_default, {
																					name: "arrow-right",
																					size: 16
																				})]),
																				_: 1
																			})]),
																			_: 1
																		})
																	])
																])];
															}),
															_: 2
														}, _parent, _scopeId));
														_push(`<!--]-->`);
													} else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																href: item.target,
																class: "nav__link",
																"aria-current": item.current ? "page" : void 0,
																prefetch: ""
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
																	else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
																}),
																_: 2
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																href: item.target,
																class: "nav__link",
																"aria-current": item.current ? "page" : void 0,
																prefetch: ""
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)]),
																_: 2
															}, 1032, ["href", "aria-current"])];
														}),
														_: 2
													}, _parent, _scopeId));
												} else return [item.mega ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuTrigger_default), { class: ["nav__link nav__trigger", { "nav__link--current": item.current }] }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label) + " ", 1), (0, vue_exports.createVNode)(Icon_default, {
														name: "chevron-down",
														size: 16,
														class: "nav__chevron"
													})]),
													_: 2
												}, 1032, ["class"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuContent_default), { class: "mega" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "container mega__grid" }, [
														(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Marke"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.brands, (brand) => {
															return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: brand.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																	href: brand.href,
																	class: "mega__link",
																	prefetch: ""
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(brand.label), 1)]),
																	_: 2
																}, 1032, ["href"])]),
																_: 2
															}, 1024)]);
														}), 128))])]),
														(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Größe"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.sizes, (size) => {
															return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: size.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																	href: size.href,
																	class: "mega__link",
																	prefetch: ""
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(size.count) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
																	_: 2
																}, 1032, ["href"])]),
																_: 2
															}, 1024)]);
														}), 128))])]),
														(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Fahrzeug"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.makes, (make) => {
															return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: make.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																	href: make.href,
																	class: "mega__link"
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(make.label), 1)]),
																	_: 2
																}, 1032, ["href"])]),
																_: 2
															}, 1024)]);
														}), 128))])]),
														(0, vue_exports.createVNode)("div", { class: "mega__col" }, [
															(0, vue_exports.createVNode)("p", { class: "label" }, "Beliebt"),
															(0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.popular, (wheel) => {
																return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: wheel.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																		href: wheel.href,
																		class: "mega__link",
																		prefetch: ""
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(wheel.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet" }, (0, vue_exports.toDisplayString)(wheel.sub), 1)]),
																		_: 2
																	}, 1032, ["href"])]),
																	_: 2
																}, 1024)]);
															}), 128))]),
															(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																	href: "/felgen",
																	class: "mega__all",
																	prefetch: ""
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Alle Felgen ansehen "), (0, vue_exports.createVNode)(Icon_default, {
																		name: "arrow-right",
																		size: 16
																	})]),
																	_: 1
																})]),
																_: 1
															})
														])
													])]),
													_: 1
												})], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(NavigationMenuLink_default), {
													key: 1,
													"as-child": ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: item.target,
														class: "nav__link",
														"aria-current": item.current ? "page" : void 0,
														prefetch: ""
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)]),
														_: 2
													}, 1032, ["href", "aria-current"])]),
													_: 2
												}, 1024))];
											}),
											_: 2
										}, _parent, _scopeId));
									});
									_push(`<!--]-->`);
								} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(items.value, (item) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(NavigationMenuItem_default), { key: item.label }, {
										default: (0, vue_exports.withCtx)(() => [item.mega ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuTrigger_default), { class: ["nav__link nav__trigger", { "nav__link--current": item.current }] }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label) + " ", 1), (0, vue_exports.createVNode)(Icon_default, {
												name: "chevron-down",
												size: 16,
												class: "nav__chevron"
											})]),
											_: 2
										}, 1032, ["class"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuContent_default), { class: "mega" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "container mega__grid" }, [
												(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Marke"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.brands, (brand) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: brand.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: brand.href,
															class: "mega__link",
															prefetch: ""
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(brand.label), 1)]),
															_: 2
														}, 1032, ["href"])]),
														_: 2
													}, 1024)]);
												}), 128))])]),
												(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Größe"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.sizes, (size) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: size.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: size.href,
															class: "mega__link",
															prefetch: ""
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(size.count) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
															_: 2
														}, 1032, ["href"])]),
														_: 2
													}, 1024)]);
												}), 128))])]),
												(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Fahrzeug"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.makes, (make) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: make.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: make.href,
															class: "mega__link"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(make.label), 1)]),
															_: 2
														}, 1032, ["href"])]),
														_: 2
													}, 1024)]);
												}), 128))])]),
												(0, vue_exports.createVNode)("div", { class: "mega__col" }, [
													(0, vue_exports.createVNode)("p", { class: "label" }, "Beliebt"),
													(0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.popular, (wheel) => {
														return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: wheel.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																href: wheel.href,
																class: "mega__link",
																prefetch: ""
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(wheel.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet" }, (0, vue_exports.toDisplayString)(wheel.sub), 1)]),
																_: 2
															}, 1032, ["href"])]),
															_: 2
														}, 1024)]);
													}), 128))]),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: "/felgen",
															class: "mega__all",
															prefetch: ""
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Alle Felgen ansehen "), (0, vue_exports.createVNode)(Icon_default, {
																name: "arrow-right",
																size: 16
															})]),
															_: 1
														})]),
														_: 1
													})
												])
											])]),
											_: 1
										})], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(NavigationMenuLink_default), {
											key: 1,
											"as-child": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: item.target,
												class: "nav__link",
												"aria-current": item.current ? "page" : void 0,
												prefetch: ""
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)]),
												_: 2
											}, 1032, ["href", "aria-current"])]),
											_: 2
										}, 1024))]),
										_: 2
									}, 1024);
								}), 128))];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`<div class="nav__viewport-wrap"${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(NavigationMenuViewport_default), { class: "nav__viewport" }, null, _parent, _scopeId));
						_push(`</div>`);
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuList_default), { class: "nav__list" }, {
						default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(items.value, (item) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(NavigationMenuItem_default), { key: item.label }, {
								default: (0, vue_exports.withCtx)(() => [item.mega ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuTrigger_default), { class: ["nav__link nav__trigger", { "nav__link--current": item.current }] }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label) + " ", 1), (0, vue_exports.createVNode)(Icon_default, {
										name: "chevron-down",
										size: 16,
										class: "nav__chevron"
									})]),
									_: 2
								}, 1032, ["class"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuContent_default), { class: "mega" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "container mega__grid" }, [
										(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Marke"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.brands, (brand) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: brand.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: brand.href,
													class: "mega__link",
													prefetch: ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(brand.label), 1)]),
													_: 2
												}, 1032, ["href"])]),
												_: 2
											}, 1024)]);
										}), 128))])]),
										(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Größe"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.sizes, (size) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: size.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: size.href,
													class: "mega__link",
													prefetch: ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(size.count) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
													_: 2
												}, 1032, ["href"])]),
												_: 2
											}, 1024)]);
										}), 128))])]),
										(0, vue_exports.createVNode)("div", { class: "mega__col" }, [(0, vue_exports.createVNode)("p", { class: "label" }, "Nach Fahrzeug"), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.makes, (make) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: make.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: make.href,
													class: "mega__link"
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(make.label), 1)]),
													_: 2
												}, 1032, ["href"])]),
												_: 2
											}, 1024)]);
										}), 128))])]),
										(0, vue_exports.createVNode)("div", { class: "mega__col" }, [
											(0, vue_exports.createVNode)("p", { class: "label" }, "Beliebt"),
											(0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(mega.value.popular, (wheel) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: wheel.href }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: wheel.href,
														class: "mega__link",
														prefetch: ""
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(wheel.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet" }, (0, vue_exports.toDisplayString)(wheel.sub), 1)]),
														_: 2
													}, 1032, ["href"])]),
													_: 2
												}, 1024)]);
											}), 128))]),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuLink_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: "/felgen",
													class: "mega__all",
													prefetch: ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Alle Felgen ansehen "), (0, vue_exports.createVNode)(Icon_default, {
														name: "arrow-right",
														size: 16
													})]),
													_: 1
												})]),
												_: 1
											})
										])
									])]),
									_: 1
								})], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(NavigationMenuLink_default), {
									key: 1,
									"as-child": ""
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: item.target,
										class: "nav__link",
										"aria-current": item.current ? "page" : void 0,
										prefetch: ""
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)]),
										_: 2
									}, 1032, ["href", "aria-current"])]),
									_: 2
								}, 1024))]),
								_: 2
							}, 1024);
						}), 128))]),
						_: 1
					}), (0, vue_exports.createVNode)("div", { class: "nav__viewport-wrap" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(NavigationMenuViewport_default), { class: "nav__viewport" })])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/MegaMenu.vue
var _sfc_setup$4 = MegaMenu_vue_vue_type_script_setup_true_lang_default.setup;
MegaMenu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/MegaMenu.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var MegaMenu_default = MegaMenu_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region node_modules/@vueuse/shared/dist/index.js
var isClient = typeof window !== "undefined" && typeof document !== "undefined";
typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope;
var toString = Object.prototype.toString;
var isObject = (val) => toString.call(val) === "[object Object]";
var noop = () => {};
var isIOS = /* #__PURE__ */ getIsIOS();
function getIsIOS() {
	var _window, _window2, _window3;
	return isClient && !!((_window = window) === null || _window === void 0 || (_window = _window.navigator) === null || _window === void 0 ? void 0 : _window.userAgent) && (/iP(?:ad|hone|od)/.test(window.navigator.userAgent) || ((_window2 = window) === null || _window2 === void 0 || (_window2 = _window2.navigator) === null || _window2 === void 0 ? void 0 : _window2.maxTouchPoints) > 2 && /iPad|Macintosh/.test((_window3 = window) === null || _window3 === void 0 ? void 0 : _window3.navigator.userAgent));
}
function toArray(value) {
	return Array.isArray(value) ? value : [value];
}
/**
* Shorthand for watching value with {immediate: true}
*
* @see https://vueuse.org/watchImmediate
*/
function watchImmediate(source, cb, options) {
	return (0, vue_exports.watch)(source, cb, {
		...options,
		immediate: true
	});
}
//#endregion
//#region node_modules/@vueuse/core/dist/index.js
var defaultWindow = isClient ? window : void 0;
isClient && window.document;
isClient && window.navigator;
isClient && window.location;
/**
* Get the dom element of a ref of element or Vue component instance
*
* @param elRef
*/
function unrefElement(elRef) {
	var _$el;
	const plain = (0, vue_exports.toValue)(elRef);
	return (_$el = plain === null || plain === void 0 ? void 0 : plain.$el) !== null && _$el !== void 0 ? _$el : plain;
}
function useEventListener(...args) {
	const register = (el, event, listener, options) => {
		el.addEventListener(event, listener, options);
		return () => el.removeEventListener(event, listener, options);
	};
	const firstParamTargets = (0, vue_exports.computed)(() => {
		const test = toArray((0, vue_exports.toValue)(args[0])).filter((e) => e != null);
		return test.every((e) => typeof e !== "string") ? test : void 0;
	});
	return watchImmediate(() => {
		var _firstParamTargets$va, _firstParamTargets$va2;
		return [
			(_firstParamTargets$va = (_firstParamTargets$va2 = firstParamTargets.value) === null || _firstParamTargets$va2 === void 0 ? void 0 : _firstParamTargets$va2.map((e) => unrefElement(e))) !== null && _firstParamTargets$va !== void 0 ? _firstParamTargets$va : [defaultWindow].filter((e) => e != null),
			toArray((0, vue_exports.toValue)(firstParamTargets.value ? args[1] : args[0])),
			toArray((0, vue_exports.unref)(firstParamTargets.value ? args[2] : args[1])),
			(0, vue_exports.toValue)(firstParamTargets.value ? args[3] : args[2])
		];
	}, ([raw_targets, raw_events, raw_listeners, raw_options], _, onCleanup) => {
		if (!(raw_targets === null || raw_targets === void 0 ? void 0 : raw_targets.length) || !(raw_events === null || raw_events === void 0 ? void 0 : raw_events.length) || !(raw_listeners === null || raw_listeners === void 0 ? void 0 : raw_listeners.length)) return;
		const optionsClone = isObject(raw_options) ? { ...raw_options } : raw_options;
		const cleanups = raw_targets.flatMap((el) => raw_events.flatMap((event) => raw_listeners.map((listener) => register(el, event, listener, optionsClone))));
		onCleanup(() => {
			cleanups.forEach((fn) => fn());
		});
	}, { flush: "post" });
}
var _iOSWorkaround = false;
function onClickOutside(target, handler, options = {}) {
	const { window = defaultWindow, ignore = [], capture = true, detectIframe = false, controls = false } = options;
	if (!window) return controls ? {
		stop: noop,
		cancel: noop,
		trigger: noop
	} : noop;
	if (isIOS && !_iOSWorkaround) {
		_iOSWorkaround = true;
		const listenerOptions = { passive: true };
		Array.from(window.document.body.children).forEach((el) => el.addEventListener("click", noop, listenerOptions));
		window.document.documentElement.addEventListener("click", noop, listenerOptions);
	}
	let shouldListen = true;
	const shouldIgnore = (event) => {
		return (0, vue_exports.toValue)(ignore).some((target) => {
			if (typeof target === "string") return Array.from(window.document.querySelectorAll(target)).some((el) => el === event.target || event.composedPath().includes(el));
			else {
				const el = unrefElement(target);
				return el && (event.target === el || event.composedPath().includes(el));
			}
		});
	};
	/**
	* Determines if the given target has multiple root elements.
	* Referenced from: https://github.com/vuejs/test-utils/blob/ccb460be55f9f6be05ab708500a41ec8adf6f4bc/src/vue-wrapper.ts#L21
	*/
	function hasMultipleRoots(target) {
		const vm = (0, vue_exports.toValue)(target);
		return vm && vm.$.subTree.shapeFlag === 16;
	}
	function checkMultipleRoots(target, event) {
		const vm = (0, vue_exports.toValue)(target);
		const children = vm.$.subTree && vm.$.subTree.children;
		if (children == null || !Array.isArray(children)) return false;
		return children.some((child) => child.el === event.target || event.composedPath().includes(child.el));
	}
	const listener = (event) => {
		const el = unrefElement(target);
		if (event.target == null) return;
		if (!(el instanceof Element) && hasMultipleRoots(target) && checkMultipleRoots(target, event)) return;
		if (!el || el === event.target || event.composedPath().includes(el)) return;
		if ("detail" in event && event.detail === 0) shouldListen = !shouldIgnore(event);
		if (!shouldListen) {
			shouldListen = true;
			return;
		}
		handler(event);
	};
	let isProcessingClick = false;
	const cleanup = [
		useEventListener(window, "click", (event) => {
			if (!isProcessingClick) {
				isProcessingClick = true;
				setTimeout(() => {
					isProcessingClick = false;
				}, 0);
				listener(event);
			}
		}, {
			passive: true,
			capture
		}),
		useEventListener(window, "pointerdown", (e) => {
			const el = unrefElement(target);
			shouldListen = !shouldIgnore(e) && !!(el && !e.composedPath().includes(el));
		}, { passive: true }),
		detectIframe && useEventListener(window, "blur", (event) => {
			setTimeout(() => {
				const el = unrefElement(target);
				let activeEl = window.document.activeElement;
				while (activeEl === null || activeEl === void 0 ? void 0 : activeEl.shadowRoot) activeEl = activeEl.shadowRoot.activeElement;
				if ((activeEl === null || activeEl === void 0 ? void 0 : activeEl.tagName) === "IFRAME" && !(el === null || el === void 0 ? void 0 : el.contains(window.document.activeElement))) handler(event);
			}, 0);
		}, { passive: true })
	].filter(Boolean);
	const stop = () => cleanup.forEach((fn) => fn());
	if (controls) return {
		stop,
		cancel: () => {
			shouldListen = false;
		},
		trigger: (event) => {
			shouldListen = true;
			listener(event);
			shouldListen = false;
		}
	};
	return stop;
}
//#endregion
//#region resources/js/Components/Chrome/SearchBox.vue?vue&type=script&setup=true&lang.ts
var SearchBox_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SearchBox",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The header's search field: type, and the answer appears beneath it in four groups — Felgen,
		* Marken, Größen, Seiten. `/` from anywhere lands here. Arrow keys move through the list while the
		* field keeps focus; Enter opens the highlighted entry; Esc clears. When nothing matches, the
		* nearest name is offered — "Meintest du „BBS“?" — instead of an empty box.
		*/
		const shell = useShell();
		const search = useSearch();
		const root = (0, vue_exports.ref)(null);
		const input = (0, vue_exports.ref)(null);
		const query = (0, vue_exports.ref)("");
		const open = (0, vue_exports.ref)(false);
		const active = (0, vue_exports.ref)(-1);
		const recent = (0, vue_exports.ref)([]);
		const rows = (0, vue_exports.computed)(() => {
			const out = [];
			for (const group of search.result.value?.groups ?? []) for (const [i, item] of group.items.entries()) out.push({
				...item,
				id: `sb-${group.key}-${i}`,
				group: group.label
			});
			return out;
		});
		const grouped = (0, vue_exports.computed)(() => {
			const out = [];
			for (const row of rows.value) {
				const last = out[out.length - 1];
				if (last && last.label === row.group) last.rows.push(row);
				else out.push({
					label: row.group,
					rows: [row]
				});
			}
			return out;
		});
		const showRecent = (0, vue_exports.computed)(() => query.value.trim() === "" && recent.value.length > 0);
		const empty = (0, vue_exports.computed)(() => query.value.trim() !== "" && search.result.value !== null && search.result.value.total === 0);
		const listVisible = (0, vue_exports.computed)(() => open.value && (rows.value.length > 0 || showRecent.value || empty.value || search.failed.value));
		const activeId = (0, vue_exports.computed)(() => active.value >= 0 ? rows.value[active.value]?.id : void 0);
		(0, vue_exports.watch)(query, (value) => {
			active.value = -1;
			open.value = true;
			search.run(value);
		});
		onClickOutside(root, () => {
			open.value = false;
		});
		(0, vue_exports.onMounted)(() => {
			shell.registerSearch(() => {
				input.value?.focus();
				input.value?.select();
			});
		});
		/** The typed characters, marked inside a label so the eye finds the match. */
		function parts(label) {
			const needle = query.value.trim().toLowerCase();
			const at = needle === "" ? -1 : label.toLowerCase().indexOf(needle);
			if (at < 0) return [{
				text: label,
				hit: false
			}];
			return [
				{
					text: label.slice(0, at),
					hit: false
				},
				{
					text: label.slice(at, at + needle.length),
					hit: true
				},
				{
					text: label.slice(at + needle.length),
					hit: false
				}
			].filter((p) => p.text !== "");
		}
		function go(row) {
			remember(query.value.trim());
			open.value = false;
			router.visit(row.href);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<form${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "root",
				ref: root,
				class: "sbox",
				role: "search"
			}, _attrs))} data-v-80b894d6><div class="input-group" data-v-80b894d6><span class="input-group__icon" data-v-80b894d6>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`</span><input${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input sbox__input" type="search" role="combobox" aria-label="Suche" aria-autocomplete="list" aria-controls="sbox-list"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", listVisible.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-activedescendant", activeId.value)} placeholder="Felge, Marke oder Größe" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" data-v-80b894d6>`);
			if (query.value === "") _push(`<kbd class="kbd sbox__hint" aria-hidden="true" data-v-80b894d6>/</kbd>`);
			else _push(`<!---->`);
			_push(`</div><div id="sbox-list" class="popover sbox__list" role="listbox" aria-label="Vorschläge" style="${(0, server_renderer_exports.ssrRenderStyle)(listVisible.value ? null : { display: "none" })}" data-v-80b894d6><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(grouped.value, (group) => {
				_push(`<!--[--><p class="menu__label" role="presentation" data-v-80b894d6>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(group.rows, (row) => {
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						id: row.id,
						key: row.id,
						href: row.href,
						role: "option",
						"aria-selected": row.id === activeId.value,
						class: ["menu__item sbox__item", { "sbox__item--active": row.id === activeId.value }],
						tabindex: "-1",
						onClick: ($event) => go(row),
						onMousemove: ($event) => active.value = rows.value.indexOf(row)
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<span class="sbox__label" data-v-80b894d6${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(parts(row.label), (part, i) => {
									_push(`<!--[-->`);
									if (part.hit) _push(`<mark class="sbox__hit" data-v-80b894d6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(part.text)}</mark>`);
									else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(part.text)}<!--]-->`);
									_push(`<!--]-->`);
								});
								_push(`<!--]--></span>`);
								if (row.sub) _push(`<span class="small quiet" data-v-80b894d6${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.sub)}</span>`);
								else _push(`<!---->`);
							} else return [(0, vue_exports.createVNode)("span", { class: "sbox__label" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(parts(row.label), (part, i) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: i }, [part.hit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("mark", {
									key: 0,
									class: "sbox__hit"
								}, (0, vue_exports.toDisplayString)(part.text), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(part.text), 1)], 64))], 64);
							}), 128))]), row.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "small quiet"
							}, (0, vue_exports.toDisplayString)(row.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)];
						}),
						_: 2
					}, _parent));
				});
				_push(`<!--]--><!--]-->`);
			});
			_push(`<!--]-->`);
			if (showRecent.value) {
				_push(`<!--[--><p class="menu__label" role="presentation" data-v-80b894d6>Zuletzt gesucht</p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(recent.value, (term) => {
					_push(`<button class="menu__item" type="button" tabindex="-1" data-v-80b894d6>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "clock",
						size: 20
					}, null, _parent));
					_push(` ${(0, server_renderer_exports.ssrInterpolate)(term)}</button>`);
				});
				_push(`<!--]--><!--]-->`);
			} else _push(`<!---->`);
			if (empty.value) {
				_push(`<p class="sbox__empty" data-v-80b894d6> Nichts gefunden für „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“. `);
				if ((0, vue_exports.unref)(search).result.value?.suggestion) _push(`<button class="link" type="button" data-v-80b894d6> Meintest du „${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(search).result.value?.suggestion)}“? </button>`);
				else _push(`<!--[-->Versuch es mit einer Marke oder einer Größe, zum Beispiel „MOTEC“ oder „19 Zoll“.<!--]-->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			if ((0, vue_exports.unref)(search).failed.value) _push(`<p class="sbox__empty" data-v-80b894d6>Die Suche ist gerade nicht erreichbar.</p>`);
			else _push(`<!---->`);
			_push(`</div></form>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/SearchBox.vue
var _sfc_setup$3 = SearchBox_vue_vue_type_script_setup_true_lang_default.setup;
SearchBox_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SearchBox.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var SearchBox_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SearchBox_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-80b894d6"]]);
//#endregion
//#region resources/js/Components/Chrome/VehicleBar.vue?vue&type=script&setup=true&lang.ts
var VehicleBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VehicleBar",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The vehicle bar: one slim band under the header that names the chosen car, in one place, on
		* every route where the server says it shows. `headerMode` arrives in the first response (R-08):
		* inside the buying process the bar names the car; outside it, once the listing has been seen,
		* it also offers the way back to the matching wheels; at the checkout it is not there at all.
		*/
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const mode = (0, vue_exports.computed)(() => shared.value.headerMode);
		const shown = (0, vue_exports.computed)(() => vehicle.value !== null && (mode.value === "WHITE_BOX" || mode.value === "BLUE_BAR"));
		return (_ctx, _push, _parent, _attrs) => {
			if (shown.value && vehicle.value) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "vbar" }, _attrs))} data-v-b86c2c0d><div class="container vbar__row" data-v-b86c2c0d>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "car",
					size: 20
				}, null, _parent));
				_push(`<p class="vbar__text" data-v-b86c2c0d><span class="vbar__lead" data-v-b86c2c0d>Dein Fahrzeug:</span><span class="vbar__name" data-v-b86c2c0d>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</span><span class="vbar__meta num" data-v-b86c2c0d>· ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</span></p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "vbar__link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Ändern`);
						else return [(0, vue_exports.createTextVNode)("Ändern")];
					}),
					_: 1
				}, _parent));
				if (mode.value === "BLUE_BAR") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "vbar__link vbar__link--cta",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Passende Felgen anzeigen`);
						else return [(0, vue_exports.createTextVNode)("Passende Felgen anzeigen")];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				_push(`</div></div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/VehicleBar.vue
var _sfc_setup$2 = VehicleBar_vue_vue_type_script_setup_true_lang_default.setup;
VehicleBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/VehicleBar.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var VehicleBar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehicleBar_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b86c2c0d"]]);
//#endregion
//#region resources/js/Components/Chrome/SiteHeader.vue?vue&type=script&setup=true&lang.ts
var SiteHeader_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SiteHeader",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The header. Above it, on a desktop, a utility line that scrolls away; the header itself is 64px,
		* sticky, and never changes height — once the page has scrolled under it, it gains a hairline and
		* nothing else. On a phone it is 56px: the wordmark, the search, the vehicle, and the bottom bar
		* carries the rest.
		*
		* Two rules it never breaks: the navigation is never removed, and the chosen vehicle is one
		* element in one place on every route (the vehicle bar beneath, decided by the server — R-08).
		*
		* While the shop shows demonstration rows, the *Demodaten* badge (ACCURACY D4) opens the utility
		* line on a desktop and follows the wordmark below 1024 px, where that line is gone. Both sit in
		* the flow of their row, so neither can cover content at any width.
		*/
		const shared = useShared();
		useShell();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? "").replace(/\s/g, "")}`);
		const sentinel = (0, vue_exports.ref)(null);
		const scrolled = (0, vue_exports.ref)(false);
		let observer;
		(0, vue_exports.onMounted)(() => {
			if (sentinel.value === null) return;
			observer = new IntersectionObserver(([entry]) => {
				scrolled.value = entry ? !entry.isIntersecting : false;
			});
			observer.observe(sentinel.value);
		});
		(0, vue_exports.onBeforeUnmount)(() => observer?.disconnect());
		function removeVehicle() {
			router.delete("/fahrzeug", { preserveScroll: true });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><div class="utility from-lg" data-v-5cca1769><div class="container utility__row" data-v-5cca1769>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DemoBadge_default, null, null, _parent));
			_push(`<span data-v-5cca1769>Versand aus Deutschland</span><span data-v-5cca1769>Gutachten zu jeder Felge</span><span class="utility__help" data-v-5cca1769> Hilfe: `);
			if (contact.value.phone) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} class="utility__contact num" data-v-5cca1769>${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a>`);
			else _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value.email}`)} class="utility__contact" data-v-5cca1769>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a>`);
			_push(`<span class="quiet" data-v-5cca1769> · ${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</span></span></div></div><div class="sh-sentinel" aria-hidden="true" data-v-5cca1769></div><header class="${(0, server_renderer_exports.ssrRenderClass)([{ "site-header--scrolled": scrolled.value }, "site-header"])}" data-v-5cca1769><div class="container sh__bar" data-v-5cca1769>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/",
				class: "brand",
				"aria-label": "RIMIFY – Startseite",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`RIMIFY`);
					else return [(0, vue_exports.createTextVNode)("RIMIFY")];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(DemoBadge_default, { class: "until-lg sh__demo" }, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(MegaMenu_default, { class: "from-lg sh__nav" }, null, _parent));
			_push(`<div class="sh__tools" data-v-5cca1769>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SearchBox_default, { class: "from-lg" }, null, _parent));
			if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "chip sh__vchip from-lg" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
										name: "car",
										size: 20
									}, null, _parent, _scopeId));
									_push(`<span class="sh__vname" data-v-5cca1769${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)}</span>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
										name: "chevron-down",
										size: 16
									}, null, _parent, _scopeId));
								} else return [
									(0, vue_exports.createVNode)(Icon_default, {
										name: "car",
										size: 20
									}),
									(0, vue_exports.createVNode)("span", { class: "sh__vname" }, (0, vue_exports.toDisplayString)(vehicle.value.short), 1),
									(0, vue_exports.createVNode)(Icon_default, {
										name: "chevron-down",
										size: 16
									})
								];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "popover sh__vmenu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`<p class="menu__label num" data-v-5cca1769${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</p>`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
														href: "/felgen",
														class: "menu__item",
														prefetch: ""
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
																	name: "wheel",
																	size: 20
																}, null, _parent, _scopeId));
																_push(`Passende Felgen anzeigen`);
															} else return [(0, vue_exports.createVNode)(Icon_default, {
																name: "wheel",
																size: 20
															}), (0, vue_exports.createTextVNode)("Passende Felgen anzeigen")];
														}),
														_: 1
													}, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: "/felgen",
														class: "menu__item",
														prefetch: ""
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
															name: "wheel",
															size: 20
														}), (0, vue_exports.createTextVNode)("Passende Felgen anzeigen")]),
														_: 1
													})];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
														href: "/felgen-suchen",
														class: "menu__item"
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
																	name: "car",
																	size: 20
																}, null, _parent, _scopeId));
																_push(`Fahrzeug ändern`);
															} else return [(0, vue_exports.createVNode)(Icon_default, {
																name: "car",
																size: 20
															}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")];
														}),
														_: 1
													}, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
														href: "/felgen-suchen",
														class: "menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
															name: "car",
															size: 20
														}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
														_: 1
													})];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "menu__separator" }, null, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "menu__item",
												onSelect: removeVehicle
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
															name: "close",
															size: 20
														}, null, _parent, _scopeId));
														_push(`Fahrzeug entfernen `);
													} else return [(0, vue_exports.createVNode)(Icon_default, {
														name: "close",
														size: 20
													}), (0, vue_exports.createTextVNode)("Fahrzeug entfernen ")];
												}),
												_: 1
											}, _parent, _scopeId));
										} else return [
											(0, vue_exports.createVNode)("p", { class: "menu__label num" }, (0, vue_exports.toDisplayString)(vehicle.value.label) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.keyNumbers), 1),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: "/felgen",
													class: "menu__item",
													prefetch: ""
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
														name: "wheel",
														size: 20
													}), (0, vue_exports.createTextVNode)("Passende Felgen anzeigen")]),
													_: 1
												})]),
												_: 1
											}),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
													href: "/felgen-suchen",
													class: "menu__item"
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
														name: "car",
														size: 20
													}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
													_: 1
												})]),
												_: 1
											}),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "menu__separator" }),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "menu__item",
												onSelect: removeVehicle
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
													name: "close",
													size: 20
												}), (0, vue_exports.createTextVNode)("Fahrzeug entfernen ")]),
												_: 1
											})
										];
									}),
									_: 1
								}, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "popover sh__vmenu",
									align: "end",
									"side-offset": 8
								}, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)("p", { class: "menu__label num" }, (0, vue_exports.toDisplayString)(vehicle.value.label) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.keyNumbers), 1),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: "/felgen",
												class: "menu__item",
												prefetch: ""
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
													name: "wheel",
													size: 20
												}), (0, vue_exports.createTextVNode)("Passende Felgen anzeigen")]),
												_: 1
											})]),
											_: 1
										}),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: "/felgen-suchen",
												class: "menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
													name: "car",
													size: 20
												}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
												_: 1
											})]),
											_: 1
										}),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "menu__separator" }),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "menu__item",
											onSelect: removeVehicle
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
												name: "close",
												size: 20
											}), (0, vue_exports.createTextVNode)("Fahrzeug entfernen ")]),
											_: 1
										})
									]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "chip sh__vchip from-lg" }, {
						default: (0, vue_exports.withCtx)(() => [
							(0, vue_exports.createVNode)(Icon_default, {
								name: "car",
								size: 20
							}),
							(0, vue_exports.createVNode)("span", { class: "sh__vname" }, (0, vue_exports.toDisplayString)(vehicle.value.short), 1),
							(0, vue_exports.createVNode)(Icon_default, {
								name: "chevron-down",
								size: 16
							})
						]),
						_: 1
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
							class: "popover sh__vmenu",
							align: "end",
							"side-offset": 8
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("p", { class: "menu__label num" }, (0, vue_exports.toDisplayString)(vehicle.value.label) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.keyNumbers), 1),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: "/felgen",
										class: "menu__item",
										prefetch: ""
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
											name: "wheel",
											size: 20
										}), (0, vue_exports.createTextVNode)("Passende Felgen anzeigen")]),
										_: 1
									})]),
									_: 1
								}),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: "/felgen-suchen",
										class: "menu__item"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
											name: "car",
											size: 20
										}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
										_: 1
									})]),
									_: 1
								}),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "menu__separator" }),
								(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
									class: "menu__item",
									onSelect: removeVehicle
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
										name: "close",
										size: 20
									}), (0, vue_exports.createTextVNode)("Fahrzeug entfernen ")]),
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
			else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen-suchen",
				class: "chip sh__vchip from-lg"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "car",
							size: 20
						}, null, _parent, _scopeId));
						_push(` Fahrzeug wählen `);
					} else return [(0, vue_exports.createVNode)(Icon_default, {
						name: "car",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Fahrzeug wählen ")];
				}),
				_: 1
			}, _parent));
			_push(`<button class="icon-btn until-lg" type="button" aria-label="Suche" data-v-5cca1769>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 24
			}, null, _parent));
			_push(`</button>`);
			if (vehicle.value) {
				_push(`<button class="icon-btn until-lg sh__vicon" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Dein Fahrzeug: ${vehicle.value.label}`)} data-v-5cca1769>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "car",
					size: 24
				}, null, _parent));
				_push(`<span class="sh__dot" aria-hidden="true" data-v-5cca1769></span></button>`);
			} else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen-suchen",
				class: "icon-btn until-lg",
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
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/warenkorb",
				class: "sh__cart from-lg",
				"aria-label": (0, vue_exports.unref)(shared).cartCount > 0 ? `Warenkorb, ${(0, vue_exports.unref)(shared).cartCount} Artikel` : "Warenkorb",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<span class="sh__cart-icon" data-v-5cca1769${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "cart",
							size: 24
						}, null, _parent, _scopeId));
						if ((0, vue_exports.unref)(shared).cartCount > 0) _push(`<span class="badge badge--count sh__badge" aria-hidden="true" data-v-5cca1769${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).cartCount)}</span>`);
						else _push(`<!---->`);
						_push(`</span><span data-v-5cca1769${_scopeId}>Warenkorb</span>`);
					} else return [(0, vue_exports.createVNode)("span", { class: "sh__cart-icon" }, [(0, vue_exports.createVNode)(Icon_default, {
						name: "cart",
						size: 24
					}), (0, vue_exports.unref)(shared).cartCount > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
						key: 0,
						class: "badge badge--count sh__badge",
						"aria-hidden": "true"
					}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(shared).cartCount), 1)) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("span", null, "Warenkorb")];
				}),
				_: 1
			}, _parent));
			_push(`</div></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehicleBar_default, null, null, _parent));
			_push(`</header><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/SiteHeader.vue
var _sfc_setup$1 = SiteHeader_vue_vue_type_script_setup_true_lang_default.setup;
SiteHeader_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SiteHeader.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var SiteHeader_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SiteHeader_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5cca1769"]]);
//#endregion
//#region resources/js/Layouts/AppLayout.vue?vue&type=script&setup=true&lang.ts
var AppLayout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AppLayout",
	__ssrInlineRender: true,
	props: { title: { default: void 0 } },
	setup(__props) {
		/**
		* The storefront frame: header, page, footer, the phone's bottom bar, and the overlays the shell
		* owns — the palette, the shortcut list, the vehicle sheet, the cookie choice, the toast.
		*
		* Everything the shell shares between its parts is provided here, so the footer's
		* "Cookie-Einstellungen" and the header's search icon open the very same dialogs. Every
		* navigation closes whatever is open, and so does the back button.
		*/
		const shared = useShared();
		const shell = provideShell();
		provideConsent(shared.value.consent ?? null);
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const vehicleSheet = (0, vue_exports.computed)({
			get: () => shell.vehicleOpen.value && vehicle.value !== null,
			set: (open) => {
				shell.vehicleOpen.value = open;
			}
		});
		useShortcuts({
			onSearch: () => shell.focusSearch(),
			onPalette: () => {
				shell.paletteOpen.value = !shell.paletteOpen.value;
			},
			onHelp: () => {
				shell.helpOpen.value = true;
			}
		});
		function closeAll() {
			shell.paletteOpen.value = false;
			shell.helpOpen.value = false;
			shell.vehicleOpen.value = false;
		}
		let stopNavigate;
		(0, vue_exports.onMounted)(() => {
			stopNavigate = router.on("navigate", closeAll);
		});
		(0, vue_exports.onBeforeUnmount)(() => stopNavigate?.());
		function removeVehicle() {
			router.delete("/fahrzeug", { preserveScroll: true });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["shell", { "shell--vbar": vehicle.value !== null && ((0, vue_exports.unref)(shared).headerMode === "WHITE_BOX" || (0, vue_exports.unref)(shared).headerMode === "BLUE_BAR") }] }, _attrs))} data-v-ba29cda4><a class="skip-link" href="#inhalt" data-v-ba29cda4>Zum Inhalt springen</a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteHeader_default, null, null, _parent));
			_push(`<main id="inhalt" class="shell__main" data-v-ba29cda4>`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</main>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CompareTray_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteFooter_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(BottomNav_default, null, null, _parent));
			if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: vehicleSheet.value,
				"onUpdate:open": ($event) => vehicleSheet.value = $event,
				variant: "sheet",
				title: "Dein Fahrzeug"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="h4" data-v-ba29cda4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="small muted num" data-v-ba29cda4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</p><div class="shell__vehicle-actions" data-v-ba29cda4${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/felgen",
							class: "btn btn--primary btn--block",
							prefetch: ""
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Passende Felgen anzeigen`);
								else return [(0, vue_exports.createTextVNode)("Passende Felgen anzeigen")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/felgen-suchen",
							class: "btn btn--secondary btn--block"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Fahrzeug ändern`);
								else return [(0, vue_exports.createTextVNode)("Fahrzeug ändern")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`<button class="btn btn--ghost btn--block" type="button" data-v-ba29cda4${_scopeId}>Fahrzeug entfernen</button></div>`);
					} else return [
						(0, vue_exports.createVNode)("p", { class: "h4" }, (0, vue_exports.toDisplayString)(vehicle.value.label), 1),
						(0, vue_exports.createVNode)("p", { class: "small muted num" }, (0, vue_exports.toDisplayString)(vehicle.value.buildWindow) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.keyNumbers), 1),
						(0, vue_exports.createVNode)("div", { class: "shell__vehicle-actions" }, [
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								href: "/felgen",
								class: "btn btn--primary btn--block",
								prefetch: ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Passende Felgen anzeigen")]),
								_: 1
							}),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								href: "/felgen-suchen",
								class: "btn btn--secondary btn--block"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
								_: 1
							}),
							(0, vue_exports.createVNode)("button", {
								class: "btn btn--ghost btn--block",
								type: "button",
								onClick: removeVehicle
							}, "Fahrzeug entfernen")
						])
					];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CommandPalette_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(ShortcutsDialog_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(CookieConsent_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Toast_default, null, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Layouts/AppLayout.vue
var _sfc_setup = AppLayout_vue_vue_type_script_setup_true_lang_default.setup;
AppLayout_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/AppLayout.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AppLayout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AppLayout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ba29cda4"]]);
//#endregion
export { PopperRoot_default as a, useForwardPropsEmits as c, PopperAnchor_default as i, useForwardProps as l, Kbd_default as n, VisuallyHidden_default as o, PopperContent_default as r, useTypeahead as s, AppLayout_default as t, useFocusGuards as u };
