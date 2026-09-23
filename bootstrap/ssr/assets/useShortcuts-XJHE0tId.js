import { c as vue_exports, l as __exportAll, o as router, r as link_default, t as defineStore, u as __reExport } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, c as isIconName, n as useMenus, r as useShared } from "./useShared-CY71KcPZ.js";
import { A as useEventListener, C as useId, D as useBodyScrollLock, E as useEmitAsProps, F as isClient, H as createContext, L as refAutoReset, M as useVModel, O as injectConfigProviderContext, P as createSharedComposable, S as Presence_default, T as useForwardExpose, V as getActiveElement, _ as DismissableLayer_default, a as DialogOverlay_default, b as Primitive, c as FIRST_LAST_KEYS, d as SELECTION_KEYS, f as focusFirst$1, g as FocusScope_default, h as isPointerInGraceArea, i as Teleport_default, k as unrefElement, l as ITEM_SELECT, m as isMouseEvent, n as DialogTitle_default, o as DialogDescription_default, p as getOpenState, r as DialogPortal_default, s as DialogContent_default, t as Dialog_default, u as LAST_KEYS, v as DialogClose_default, w as useHideOthers, x as Slot, y as DialogRoot_default } from "./Dialog-D0E0ckTw.js";
//#region node_modules/reka-ui/dist/shared/useArrowNavigation.js
var ignoredElement = ["INPUT", "TEXTAREA"];
/**
* Allow arrow navigation for every html element with data-reka-collection-item tag
*
* @param e               Keyboard event
* @param currentElement  Event initiator element or any element that wants to handle the navigation
* @param parentElement   Parent element where contains all the collection items, this will collect every item to be used when nav
* @param options         further options
* @returns               the navigated html element or null if none
*/
function useArrowNavigation(e, currentElement, parentElement, options = {}) {
	if (!currentElement || options.enableIgnoredElement && ignoredElement.includes(currentElement.nodeName)) return null;
	const { arrowKeyOptions = "both", attributeName = "[data-reka-collection-item]", itemsArray = [], loop = true, dir = "ltr", preventScroll = true, focus = false } = options;
	const [right, left, up, down, home, end] = [
		e.key === "ArrowRight",
		e.key === "ArrowLeft",
		e.key === "ArrowUp",
		e.key === "ArrowDown",
		e.key === "Home",
		e.key === "End"
	];
	const goingVertical = up || down;
	const goingHorizontal = right || left;
	if (!home && !end && (!goingVertical && !goingHorizontal || arrowKeyOptions === "vertical" && goingHorizontal || arrowKeyOptions === "horizontal" && goingVertical)) return null;
	const allCollectionItems = parentElement ? Array.from(parentElement.querySelectorAll(attributeName)) : itemsArray;
	if (!allCollectionItems.length) return null;
	if (preventScroll) e.preventDefault();
	let item = null;
	if (goingHorizontal || goingVertical) item = findNextFocusableElement(allCollectionItems, currentElement, {
		goForward: goingVertical ? down : dir === "ltr" ? right : left,
		loop
	});
	else if (home) item = allCollectionItems.at(0) || null;
	else if (end) item = allCollectionItems.at(-1) || null;
	if (focus) item?.focus();
	return item;
}
/**
* Recursive function to find the next focusable element to avoid disabled elements
*
* @param elements Elements to navigate
* @param currentElement Current active element
* @param options
* @returns next focusable element
*/
function findNextFocusableElement(elements, currentElement, options, iterations = !elements.includes(currentElement) ? elements.length + 1 : elements.length) {
	if (--iterations === 0) return null;
	const index = elements.indexOf(currentElement);
	let newIndex;
	if (index === -1) newIndex = options.goForward ? 0 : elements.length - 1;
	else newIndex = options.goForward ? index + 1 : index - 1;
	if (!options.loop && (newIndex < 0 || newIndex >= elements.length)) return null;
	const candidate = elements[(newIndex + elements.length) % elements.length];
	if (!candidate) return null;
	if (candidate.hasAttribute("disabled") && candidate.getAttribute("disabled") !== "false") return findNextFocusableElement(elements, candidate, options, iterations);
	return candidate;
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useDirection.js
/**
* The `useDirection` function provides a way to access the current direction in your application.
* @param {Ref<Direction | undefined>} [dir] - An optional ref containing the direction (ltr or rtl).
* @returns  computed value that combines with the resolved direction.
*/
function useDirection(dir) {
	const context = injectConfigProviderContext({ dir: (0, vue_exports.ref)("ltr") });
	return (0, vue_exports.computed)(() => dir?.value || context.dir?.value || "ltr");
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useFocusGuards.js
/** Number of components which have requested interest to have focus guards */
var count = 0;
/**
* Injects a pair of focus guards at the edges of the whole DOM tree
* to ensure `focusin` & `focusout` events can be caught consistently.
*/
function useFocusGuards() {
	(0, vue_exports.watchEffect)((cleanupFn) => {
		if (!isClient) return;
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
		const el = unrefElement(element);
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
function wrapArray$1(array, startIndex) {
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
	let wrappedValues = wrapArray$1(values, Math.max(currentMatchIndex, 0));
	if (normalizedSearch.length === 1) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
	const nextMatch = wrappedValues.find((value) => value.toLowerCase().startsWith(normalizedSearch.toLowerCase()));
	return nextMatch !== currentMatch ? nextMatch : void 0;
}
//#endregion
//#region node_modules/reka-ui/dist/Primitive/usePrimitiveElement.js
function usePrimitiveElement() {
	const primitiveElement = (0, vue_exports.ref)();
	return {
		primitiveElement,
		currentElement: (0, vue_exports.computed)(() => ["#text", "#comment"].includes(primitiveElement.value?.$el.nodeName) ? primitiveElement.value?.$el.nextElementSibling : unrefElement(primitiveElement))
	};
}
//#endregion
//#region node_modules/reka-ui/dist/Collection/Collection.js
var ITEM_DATA_ATTR = "data-reka-collection-item";
function useCollection(options = {}) {
	const { key = "", isProvider = false } = options;
	const injectionKey = `${key}CollectionProvider`;
	let context;
	if (isProvider) {
		const itemMap = (0, vue_exports.ref)(/* @__PURE__ */ new Map());
		context = {
			collectionRef: (0, vue_exports.ref)(),
			itemMap
		};
		(0, vue_exports.provide)(injectionKey, context);
	} else context = (0, vue_exports.inject)(injectionKey);
	const getItem = (element, includeDisabledItem = false) => {
		if (!context.collectionRef.value) return void 0;
		const item = context.itemMap.value.get(element);
		return item && (includeDisabledItem || item.ref.dataset.disabled !== "") ? item : void 0;
	};
	const getItems = (includeDisabledItem = false) => {
		const collectionNode = context.collectionRef.value;
		if (!collectionNode) return [];
		const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
		const orderMap = new Map(orderedNodes.map((node, index) => [node, index]));
		const orderedItems = Array.from(context.itemMap.value.values()).sort((a, b) => (orderMap.get(a.ref) ?? -1) - (orderMap.get(b.ref) ?? -1));
		if (includeDisabledItem) return orderedItems;
		else return orderedItems.filter((i) => i.ref.dataset.disabled !== "");
	};
	const CollectionSlot = /*#__PURE__*/ (0, vue_exports.defineComponent)({
		name: "CollectionSlot",
		inheritAttrs: false,
		setup(_, { slots, attrs }) {
			const { primitiveElement, currentElement } = usePrimitiveElement();
			(0, vue_exports.watch)(currentElement, () => {
				context.collectionRef.value = currentElement.value;
			});
			return () => (0, vue_exports.h)(Slot, {
				ref: primitiveElement,
				...attrs
			}, slots);
		}
	});
	const CollectionItem = /*#__PURE__*/ (0, vue_exports.defineComponent)({
		name: "CollectionItem",
		inheritAttrs: false,
		props: { value: { validator: () => true } },
		setup(props, { slots, attrs }) {
			const { primitiveElement, currentElement } = usePrimitiveElement();
			(0, vue_exports.watchEffect)((cleanupFn) => {
				if (currentElement.value) {
					const key$1 = (0, vue_exports.markRaw)(currentElement.value);
					context.itemMap.value.set(key$1, {
						ref: currentElement.value,
						value: props.value
					});
					cleanupFn(() => context.itemMap.value.delete(key$1));
				}
			});
			return () => (0, vue_exports.h)(Slot, {
				...attrs,
				[ITEM_DATA_ATTR]: "",
				ref: primitiveElement
			}, slots);
		}
	});
	return {
		getItems,
		getItem,
		reactiveItems: (0, vue_exports.computed)(() => Array.from(context.itemMap.value.values())),
		itemMapSize: (0, vue_exports.computed)(() => context.itemMap.value.size),
		CollectionSlot,
		CollectionItem
	};
}
//#endregion
//#region node_modules/reka-ui/dist/RovingFocus/utils.js
var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
var EVENT_OPTIONS = {
	bubbles: false,
	cancelable: true
};
var MAP_KEY_TO_FOCUS_INTENT = {
	ArrowLeft: "prev",
	ArrowUp: "prev",
	ArrowRight: "next",
	ArrowDown: "next",
	PageUp: "first",
	Home: "first",
	PageDown: "last",
	End: "last"
};
function getDirectionAwareKey(key, dir) {
	if (dir !== "rtl") return key;
	return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function getFocusIntent(event, orientation, dir) {
	const key = getDirectionAwareKey(event.key, dir);
	if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
	if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
	return MAP_KEY_TO_FOCUS_INTENT[key];
}
function focusFirst(candidates, preventScroll = false) {
	const PREVIOUSLY_FOCUSED_ELEMENT = getActiveElement();
	for (const candidate of candidates) {
		if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
		candidate.focus({ preventScroll });
		if (getActiveElement() !== PREVIOUSLY_FOCUSED_ELEMENT) return;
	}
}
/**
* Wraps an array around itself at a given start index
* Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
*/
function wrapArray(array, startIndex) {
	return array.map((_, index) => array[(startIndex + index) % array.length]);
}
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
	install: () => install$1,
	isVue2: () => false,
	isVue3: () => true,
	set: () => set
});
__reExport(lib_exports, vue_exports);
function install$1() {}
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
function toValue(source) {
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
			const element = unwrapElement(toValue(options.element));
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
		return (_toValue = toValue(options.open)) != null ? _toValue : true;
	});
	const middlewareOption = (0, lib_exports.computed)(() => toValue(options.middleware));
	const placementOption = (0, lib_exports.computed)(() => {
		var _toValue2;
		return (_toValue2 = toValue(options.placement)) != null ? _toValue2 : "bottom";
	});
	const strategyOption = (0, lib_exports.computed)(() => {
		var _toValue3;
		return (_toValue3 = toValue(options.strategy)) != null ? _toValue3 : "absolute";
	});
	const transformOption = (0, lib_exports.computed)(() => {
		var _toValue4;
		return (_toValue4 = toValue(options.transform)) != null ? _toValue4 : true;
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
var _hoisted_1 = ["dir"];
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
			]))], 12, _hoisted_1);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/RovingFocus/RovingFocusGroup.js
var [injectRovingFocusGroupContext, provideRovingFocusGroupContext] = /*#__PURE__*/ createContext("RovingFocusGroup");
var RovingFocusGroup_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "RovingFocusGroup",
	props: {
		orientation: {
			type: String,
			required: false,
			default: void 0
		},
		dir: {
			type: String,
			required: false
		},
		loop: {
			type: Boolean,
			required: false,
			default: false
		},
		currentTabStopId: {
			type: [String, null],
			required: false
		},
		defaultCurrentTabStopId: {
			type: String,
			required: false
		},
		preventScrollOnEntryFocus: {
			type: Boolean,
			required: false,
			default: false
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
	emits: ["entryFocus", "update:currentTabStopId"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { loop, orientation, dir: propDir } = (0, vue_exports.toRefs)(props);
		const dir = useDirection(propDir);
		const currentTabStopId = useVModel(props, "currentTabStopId", emits, {
			defaultValue: props.defaultCurrentTabStopId,
			passive: props.currentTabStopId === void 0
		});
		const isTabbingBackOut = (0, vue_exports.ref)(false);
		const isClickFocus = (0, vue_exports.ref)(false);
		const focusableItemsCount = (0, vue_exports.ref)(0);
		const { getItems, CollectionSlot } = useCollection({ isProvider: true });
		function handleFocus(event) {
			const isKeyboardFocus = !isClickFocus.value;
			if (event.currentTarget && event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut.value) {
				const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
				event.currentTarget.dispatchEvent(entryFocusEvent);
				emits("entryFocus", entryFocusEvent);
				if (!entryFocusEvent.defaultPrevented) {
					const items = getItems().map((i) => i.ref).filter((i) => i.dataset.disabled !== "");
					focusFirst([
						items.find((item) => item.getAttribute("data-active") === ""),
						items.find((item) => item.getAttribute("data-highlighted") === ""),
						items.find((item) => item.id === currentTabStopId.value),
						...items
					].filter(Boolean), props.preventScrollOnEntryFocus);
				}
			}
			isClickFocus.value = false;
		}
		function handleMouseUp() {
			setTimeout(() => {
				isClickFocus.value = false;
			}, 1);
		}
		__expose({ getItems });
		provideRovingFocusGroupContext({
			loop,
			dir,
			orientation,
			currentTabStopId,
			onItemFocus: (tabStopId) => {
				currentTabStopId.value = tabStopId;
			},
			onItemShiftTab: () => {
				isTabbingBackOut.value = true;
			},
			onFocusableItemAdd: () => {
				focusableItemsCount.value++;
			},
			onFocusableItemRemove: () => {
				focusableItemsCount.value--;
			}
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollectionSlot), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					tabindex: isTabbingBackOut.value || focusableItemsCount.value === 0 ? -1 : 0,
					"data-orientation": (0, vue_exports.unref)(orientation),
					as: _ctx.as,
					"as-child": _ctx.asChild,
					dir: (0, vue_exports.unref)(dir),
					style: { "outline": "none" },
					onMousedown: _cache[0] || (_cache[0] = ($event) => isClickFocus.value = true),
					onMouseup: handleMouseUp,
					onFocus: handleFocus,
					onBlur: _cache[1] || (_cache[1] = ($event) => isTabbingBackOut.value = false)
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"tabindex",
					"data-orientation",
					"as",
					"as-child",
					"dir"
				])]),
				_: 3
			});
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
		useEventListener("keydown", () => {
			isUsingKeyboard.value = true;
		}, {
			capture: true,
			passive: true
		});
		useEventListener(["pointerdown", "pointermove"], () => {
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
							"data-state": (0, vue_exports.unref)(getOpenState)((0, vue_exports.unref)(menuContext).open.value),
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
			if (sheetVisible.value) _push(`<section class="consent" aria-labelledby="consent-title" data-v-50395d69><h2 id="consent-title" class="h4" data-v-50395d69>Cookies bei RIMIFY</h2><p class="consent__text" data-v-50395d69> Wir verwenden Cookies, die für den Shop nötig sind – für den Warenkorb und dein gewähltes Fahrzeug. <a href="/rechtliches/datenschutz" data-v-50395d69>Mehr in der Datenschutzerklärung</a></p><div class="consent__actions" data-v-50395d69><button class="btn btn--secondary" type="button" data-v-50395d69>Verstanden</button></div></section>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: (0, vue_exports.unref)(consent).settingsOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(consent).settingsOpen.value = $event,
				title: "Cookie-Einstellungen",
				description: "Wir verwenden nur Cookies, die für den Shop nötig sind."
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-50395d69${_scopeId}>Verstanden</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => (0, vue_exports.unref)(consent).acknowledge()
					}, "Verstanden", 8, ["onClick"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<ul class="consent__list" data-v-50395d69${_scopeId}><li class="consent__row" data-v-50395d69${_scopeId}><div data-v-50395d69${_scopeId}><p class="consent__name" data-v-50395d69${_scopeId}>Notwendig</p><p class="small muted" data-v-50395d69${_scopeId}>Warenkorb, gewähltes Fahrzeug, Sitzung, deine Cookie-Auswahl.</p></div><span class="small quiet consent__state" data-v-50395d69${_scopeId}>Immer aktiv</span></li></ul>`);
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
var _sfc_setup$7 = CookieConsent_vue_vue_type_script_setup_true_lang_default.setup;
CookieConsent_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CookieConsent.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var CookieConsent_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CookieConsent_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-50395d69"]]);
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
var _sfc_setup$6 = DemoBadge_vue_vue_type_script_setup_true_lang_default.setup;
DemoBadge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/DemoBadge.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
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
var _sfc_setup$5 = MainMenu_vue_vue_type_script_setup_true_lang_default.setup;
MainMenu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/MainMenu.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var MainMenu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(MainMenu_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-42822520"]]);
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
export { PopperContent_default as A, useForwardProps as B, DropdownMenuTrigger_default as C, DropdownMenuRoot_default as D, DropdownMenuContent_default as E, wrapArray as F, useDirection as H, useCollection as I, usePrimitiveElement as L, PopperRoot_default as M, focusFirst as N, RovingFocusGroup_default as O, getFocusIntent as P, useTypeahead as R, useSearch as S, DropdownMenuItem_default as T, useArrowNavigation as U, useFocusGuards as V, useConsent as _, Picture_default as a, readRecent as b, stripSheetState as c, provideMobileShell as d, useMobileShell as f, provideConsent as g, CookieConsent_default as h, WheelOutline_default as i, PopperAnchor_default as j, injectRovingFocusGroupContext as k, useSheetHistory as l, DemoBadge_default as m, CompareTray_default as n, ListRow_default as o, MainMenu_default as p, useCompare as r, BottomSheet_default as s, useShortcuts as t, isNavigationVisit as u, provideShell as v, DropdownMenuPortal_default as w, remember as x, useShell as y, useForwardPropsEmits as z };
