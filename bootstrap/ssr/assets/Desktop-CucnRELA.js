import { a as usePage, c as vue_exports, i as useForm, n as head_default, o as router, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, c as isIconName, r as useShared } from "./useShared-CY71KcPZ.js";
import { a as isHsn, i as cleanTsn, o as isTsn, r as cleanHsn, t as DocumentScan_default } from "./DocumentScan-DFExdDbw.js";
import { i as isEqual, n as ProductTileSkeleton_default, r as Accordion_default, t as SpecCallout_default } from "./SpecCallout-CTexFu-U.js";
import { B as handleAndDispatchCustomEvent, C as useId$2, D as useBodyScrollLock, F as isClient, H as createContext, I as reactiveOmit, L as refAutoReset, M as useVModel, N as createEventHook, O as injectConfigProviderContext, S as Presence_default, T as useForwardExpose, V as getActiveElement, _ as DismissableLayer_default, b as Primitive, g as FocusScope_default, i as Teleport_default, k as unrefElement, w as useHideOthers } from "./Dialog-D0E0ckTw.js";
import { A as PopperContent_default, B as useForwardProps, H as useDirection, I as useCollection, L as usePrimitiveElement, M as PopperRoot_default, P as getFocusIntent, R as useTypeahead, V as useFocusGuards, a as Picture_default, i as WheelOutline_default, j as PopperAnchor_default, z as useForwardPropsEmits } from "./useShortcuts-XJHE0tId.js";
import { r as VisuallyHidden_default, t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
import { i as TabsRoot_default, n as TabsList_default, r as TabsContent_default, t as TabsTrigger_default } from "./TabsTrigger-BwP2oefZ.js";
import { t as DocFacsimile_default } from "./DocFacsimile-D9bZK4Sy.js";
import { C as felgen, S as euro, t as ValueText_default, w as withUnit, x as decimal } from "./ValueText-CkuszrcW.js";
import { n as VerdictBadge_default } from "./rimify-CVWv3bVl.js";
import { t as ProductTile_default } from "./ProductTile-CM5ArmPB.js";
import { t as Skeleton_default } from "./Skeleton-CJiktMEO.js";
import { t as TyreLabel_default } from "./TyreLabel-BXu8SZ4k.js";
import { a as komplettrad_illustration_default, d as heroScene, f as rollStyle, i as rimFactsOf, n as TITLE, o as DESKTOP_LAYOUT, p as BrandWall_default, r as RimCode_default, s as HERO_SIZES_DESKTOP, t as DESCRIPTION, u as frameStyle } from "./meta-BOHDUgfV.js";
//#region node_modules/reka-ui/dist/shared/arrays.js
/**
* The function `findValuesBetween` takes an array and two values, then returns a subarray containing
* elements between the first occurrence of the start value and the first occurrence of the end value
* in the array.
* @param {T[]} array - The `array` parameter is an array of values of type `T`.
* @param {T} start - The `start` parameter is the value that marks the beginning of the range you want
* to find in the array.
* @param {T} end - The `end` parameter in the `findValuesBetween` function represents the end value
* that you want to find in the array. This function will return a subarray of values that are between
* the `start` and `end` values in the original array.
* @returns The `findValuesBetween` function returns an array of values from the input array that are
* between the `start` and `end` values (inclusive). If either the `start` or `end` values are not
* found in the input array, an empty array is returned.
*/
function findValuesBetween(array, start, end) {
	const startIndex = array.findIndex((i) => isEqual(i, start));
	const endIndex = array.findIndex((i) => isEqual(i, end));
	if (startIndex === -1 || endIndex === -1) return [];
	const [minIndex, maxIndex] = [startIndex, endIndex].sort((a, b) => a - b);
	return array.slice(minIndex, maxIndex + 1);
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useComposing.js
var imeScriptRE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}]/u;
var androidRE = /android/i;
function isAndroid() {
	return typeof navigator !== "undefined" && androidRE.test(navigator.userAgent);
}
function useComposing(onEnd) {
	const isComposing = (0, vue_exports.ref)(false);
	const isImeComposition = (0, vue_exports.ref)(true);
	const sawImeScript = (0, vue_exports.ref)(false);
	const shouldDeferInput = (0, vue_exports.computed)(() => isComposing.value && isImeComposition.value);
	function handleCompositionStart() {
		isComposing.value = true;
		isImeComposition.value = true;
		sawImeScript.value = false;
	}
	function handleCompositionUpdate(event) {
		if (!event.data) return;
		if (imeScriptRE.test(event.data)) {
			isImeComposition.value = true;
			sawImeScript.value = true;
		} else if (isAndroid() && !sawImeScript.value) isImeComposition.value = false;
	}
	function handleCompositionEnd(event) {
		(0, vue_exports.nextTick)(() => {
			isComposing.value = false;
			onEnd?.(event);
		});
	}
	return {
		isComposing,
		shouldDeferInput,
		handleCompositionStart,
		handleCompositionUpdate,
		handleCompositionEnd
	};
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useFilter.js
/**
* Provides locale-aware string filtering functions.
* Uses `Intl.Collator` for comparison to ensure proper Unicode handling.
*
* @param options - Optional collator options to customize comparison behavior.
*   See [Intl.CollatorOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#options) for details.
* @returns An object with methods to check if a string starts with, ends with, or contains a substring.
*
* @example
* const { startsWith, endsWith, contains } = useFilter();
*
* startsWith('hello', 'he'); // true
* endsWith('hello', 'lo'); // true
* contains('hello', 'ell'); // true
*/
function useFilter(options) {
	const computedOptions = (0, vue_exports.computed)(() => (0, vue_exports.unref)(options));
	const collator = (0, vue_exports.computed)(() => new Intl.Collator("en", {
		usage: "search",
		...computedOptions.value
	}));
	const startsWith = (string, substring) => {
		if (substring.length === 0) return true;
		string = string.normalize("NFC");
		substring = substring.normalize("NFC");
		return collator.value.compare(string.slice(0, substring.length), substring) === 0;
	};
	const endsWith = (string, substring) => {
		if (substring.length === 0) return true;
		string = string.normalize("NFC");
		substring = substring.normalize("NFC");
		return collator.value.compare(string.slice(-substring.length), substring) === 0;
	};
	const contains = (string, substring) => {
		if (substring.length === 0) return true;
		string = string.normalize("NFC");
		substring = substring.normalize("NFC");
		if (substring.length > string.length) return false;
		const compare = collator.value.compare;
		if (string.includes(substring)) return true;
		const sliceLen = substring.length;
		for (let scan = 0; scan + sliceLen <= string.length; scan++) if (compare(substring, string.slice(scan, scan + sliceLen)) === 0) return true;
		return false;
	};
	return {
		startsWith,
		endsWith,
		contains
	};
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useFormControl.js
function useFormControl(el) {
	return (0, vue_exports.computed)(() => (0, vue_exports.toValue)(el) ? Boolean(unrefElement(el)?.closest("form")) : true);
}
//#endregion
//#region node_modules/reka-ui/dist/shared/useKbd.js
function useKbd() {
	return {
		ALT: "Alt",
		ARROW_DOWN: "ArrowDown",
		ARROW_LEFT: "ArrowLeft",
		ARROW_RIGHT: "ArrowRight",
		ARROW_UP: "ArrowUp",
		BACKSPACE: "Backspace",
		CAPS_LOCK: "CapsLock",
		CONTROL: "Control",
		DELETE: "Delete",
		END: "End",
		ENTER: "Enter",
		ESCAPE: "Escape",
		F1: "F1",
		F10: "F10",
		F11: "F11",
		F12: "F12",
		F2: "F2",
		F3: "F3",
		F4: "F4",
		F5: "F5",
		F6: "F6",
		F7: "F7",
		F8: "F8",
		F9: "F9",
		HOME: "Home",
		META: "Meta",
		PAGE_DOWN: "PageDown",
		PAGE_UP: "PageUp",
		SHIFT: "Shift",
		SPACE: " ",
		TAB: "Tab",
		CTRL: "Control",
		ASTERISK: "*",
		SPACE_CODE: "Space"
	};
}
//#endregion
//#region node_modules/reka-ui/dist/VisuallyHidden/VisuallyHiddenInputBubble.js
var VisuallyHiddenInputBubble_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "VisuallyHiddenInputBubble",
	props: {
		name: {
			type: String,
			required: true
		},
		value: {
			type: null,
			required: true
		},
		checked: {
			type: Boolean,
			required: false,
			default: void 0
		},
		required: {
			type: Boolean,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		feature: {
			type: String,
			required: false,
			default: "fully-hidden"
		}
	},
	setup(__props) {
		const props = __props;
		const { primitiveElement, currentElement } = usePrimitiveElement();
		const valueState = (0, vue_exports.computed)(() => props.checked ?? props.value);
		(0, vue_exports.watch)(valueState, (cur, prev) => {
			if (!currentElement.value) return;
			const input = currentElement.value;
			const inputProto = window.HTMLInputElement.prototype;
			const setValue = Object.getOwnPropertyDescriptor(inputProto, "value").set;
			if (setValue && cur !== prev) {
				const inputEvent = new Event("input", { bubbles: true });
				const changeEvent = new Event("change", { bubbles: true });
				setValue.call(input, cur);
				input.dispatchEvent(inputEvent);
				input.dispatchEvent(changeEvent);
			}
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(VisuallyHidden_default, (0, vue_exports.mergeProps)({
				ref_key: "primitiveElement",
				ref: primitiveElement
			}, {
				...props,
				..._ctx.$attrs
			}, { as: "input" }), null, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/VisuallyHidden/VisuallyHiddenInput.js
var VisuallyHiddenInput_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "VisuallyHiddenInput",
	props: {
		name: {
			type: String,
			required: true
		},
		value: {
			type: null,
			required: true
		},
		checked: {
			type: Boolean,
			required: false,
			default: void 0
		},
		required: {
			type: Boolean,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		feature: {
			type: String,
			required: false,
			default: "fully-hidden"
		}
	},
	setup(__props) {
		const props = __props;
		const isFormArrayEmptyAndRequired = (0, vue_exports.computed)(() => typeof props.value === "object" && Array.isArray(props.value) && props.value.length === 0 && props.required);
		const parsedValue = (0, vue_exports.computed)(() => {
			if (typeof props.value === "string" || typeof props.value === "number" || typeof props.value === "boolean" || props.value === null || props.value === void 0) return [{
				name: props.name,
				value: props.value
			}];
			else if (typeof props.value === "object" && Array.isArray(props.value)) return props.value.flatMap((obj, index) => {
				if (typeof obj === "object") return Object.entries(obj).map(([key, value]) => ({
					name: `${props.name}[${index}][${key}]`,
					value
				}));
				else return {
					name: `${props.name}[${index}]`,
					value: obj
				};
			});
			else if (props.value !== null && typeof props.value === "object" && !Array.isArray(props.value)) return Object.entries(props.value).map(([key, value]) => ({
				name: `${props.name}[${key}]`,
				value
			}));
			return [];
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)(vue_exports.Fragment, null, [(0, vue_exports.createCommentVNode)(" We render single input if it's required "), isFormArrayEmptyAndRequired.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(VisuallyHiddenInputBubble_default, (0, vue_exports.mergeProps)({ key: _ctx.name }, {
				...props,
				..._ctx.$attrs
			}, {
				name: _ctx.name,
				value: _ctx.value
			}), null, 16, ["name", "value"])) : ((0, vue_exports.openBlock)(true), (0, vue_exports.createElementBlock)(vue_exports.Fragment, { key: 1 }, (0, vue_exports.renderList)(parsedValue.value, (parsed) => {
				return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(VisuallyHiddenInputBubble_default, (0, vue_exports.mergeProps)({ key: parsed.name }, { ref_for: true }, {
					...props,
					..._ctx.$attrs
				}, {
					name: parsed.name,
					value: parsed.value
				}), null, 16, ["name", "value"]);
			}), 128))], 2112);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Listbox/utils.js
function valueComparator(value, currentValue, comparator) {
	if (value === void 0) return false;
	else if (Array.isArray(value)) return value.some((val) => compare(val, currentValue, comparator));
	else return compare(value, currentValue, comparator);
}
function compare(value, currentValue, comparator) {
	if (value === void 0 || currentValue === void 0) return false;
	if (typeof value === "string") return value === currentValue;
	if (typeof comparator === "function") return comparator(value, currentValue);
	if (typeof comparator === "string") return value?.[comparator] === currentValue?.[comparator];
	return isEqual(value, currentValue);
}
//#endregion
//#region node_modules/reka-ui/dist/Listbox/ListboxRoot.js
var [injectListboxRootContext, provideListboxRootContext] = /*#__PURE__*/ createContext("ListboxRoot");
var [injectListboxHighlightScrollContext, provideListboxHighlightScrollContext] = /*#__PURE__*/ createContext("ListboxHighlightScroll");
var ListboxRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ListboxRoot",
	props: {
		modelValue: {
			type: null,
			required: false
		},
		defaultValue: {
			type: null,
			required: false
		},
		multiple: {
			type: Boolean,
			required: false
		},
		orientation: {
			type: String,
			required: false,
			default: "vertical"
		},
		dir: {
			type: String,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		selectionBehavior: {
			type: String,
			required: false,
			default: "toggle"
		},
		highlightOnHover: {
			type: Boolean,
			required: false
		},
		by: {
			type: [String, Function],
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
		name: {
			type: String,
			required: false
		},
		required: {
			type: Boolean,
			required: false
		}
	},
	emits: [
		"update:modelValue",
		"highlight",
		"entryFocus",
		"leave"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { multiple, highlightOnHover, orientation, disabled, selectionBehavior, dir: propDir } = (0, vue_exports.toRefs)(props);
		const { getItems, getItem } = useCollection({ isProvider: true });
		const { handleTypeaheadSearch } = useTypeahead();
		const { primitiveElement, currentElement } = usePrimitiveElement();
		const kbd = useKbd();
		const dir = useDirection(propDir);
		const highlightScrollContext = injectListboxHighlightScrollContext(null);
		provideListboxHighlightScrollContext({
			suppressHighlightScroll: (0, vue_exports.ref)(false),
			onHighlightScrollRequest: () => {}
		});
		const isFormControl = useFormControl(currentElement);
		const firstValue = (0, vue_exports.ref)();
		const isUserAction = (0, vue_exports.ref)(false);
		const focusable = (0, vue_exports.ref)(true);
		const modelValue = useVModel(props, "modelValue", emits, {
			defaultValue: props.defaultValue ?? (multiple.value ? [] : void 0),
			passive: props.modelValue === void 0,
			deep: true
		});
		function onValueChange(val) {
			isUserAction.value = true;
			if (props.multiple) {
				const modelArray = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
				const index = modelArray.findIndex((i) => compare(i, val, props.by));
				if (props.selectionBehavior === "toggle") {
					index === -1 ? modelArray.push(val) : modelArray.splice(index, 1);
					modelValue.value = modelArray;
				} else {
					modelValue.value = [val];
					firstValue.value = val;
				}
			} else if (props.selectionBehavior === "toggle") if (compare(modelValue.value, val, props.by)) modelValue.value = void 0;
			else modelValue.value = val;
			else modelValue.value = val;
			setTimeout(() => {
				isUserAction.value = false;
			}, 1);
		}
		const highlightedElement = (0, vue_exports.ref)(null);
		const previousElement = (0, vue_exports.ref)(null);
		const isVirtual = (0, vue_exports.ref)(false);
		const isComposing = (0, vue_exports.ref)(false);
		const virtualFocusHook = createEventHook();
		const virtualKeydownHook = createEventHook();
		const virtualHighlightHook = createEventHook();
		function getCollectionItem() {
			return getItems().map((i) => i.ref).filter((i) => i.dataset.disabled !== "");
		}
		function changeHighlight(el, scrollIntoView = true, focus) {
			if (!el) return;
			highlightedElement.value = el;
			const suppressHighlightScroll = highlightScrollContext?.suppressHighlightScroll.value ?? false;
			if (focus ?? focusable.value) if (suppressHighlightScroll) highlightedElement.value.focus({ preventScroll: true });
			else highlightedElement.value.focus();
			if (suppressHighlightScroll) highlightScrollContext?.onHighlightScrollRequest(scrollIntoView ? () => {
				const element = highlightedElement.value;
				if (element?.isConnected) element.scrollIntoView({ block: "nearest" });
			} : void 0);
			else if (scrollIntoView) highlightedElement.value.scrollIntoView({ block: "nearest" });
			const highlightedItem = getItem(el);
			emits("highlight", highlightedItem);
		}
		function highlightItem(value) {
			if (isVirtual.value) virtualHighlightHook.trigger(value);
			else {
				const item = getItems().find((i) => compare(i.value, value, props.by));
				if (item) {
					highlightedElement.value = item.ref;
					changeHighlight(item.ref);
				}
			}
		}
		function onKeydownEnter(event) {
			if (highlightedElement.value && highlightedElement.value.isConnected) {
				if (event.ctrlKey || event.metaKey || event.altKey) return;
				event.preventDefault();
				event.stopPropagation();
				if (!isComposing.value) highlightedElement.value.click();
			}
		}
		function onKeydownTypeAhead(event) {
			if (!focusable.value) return;
			isUserAction.value = true;
			if (isVirtual.value) virtualKeydownHook.trigger(event);
			else {
				const isMetaKey = event.altKey || event.ctrlKey || event.metaKey;
				if (isMetaKey && event.key === "a" && multiple.value) {
					const collection = getItems();
					const values = collection.map((i) => i.value);
					modelValue.value = [...values];
					event.preventDefault();
					const lastItem = collection.at(-1);
					if (lastItem) changeHighlight(lastItem.ref);
				} else if (!isMetaKey) {
					const el = handleTypeaheadSearch(event.key, getItems());
					if (el) changeHighlight(el);
				}
			}
			setTimeout(() => {
				isUserAction.value = false;
			}, 1);
		}
		function onCompositionStart() {
			isComposing.value = true;
		}
		function onCompositionEnd() {
			(0, vue_exports.nextTick)(() => {
				isComposing.value = false;
			});
		}
		function highlightFirstItem() {
			(0, vue_exports.nextTick)(() => {
				onKeydownNavigation(new KeyboardEvent("keydown", { key: "PageUp" }));
			});
		}
		function onLeave(event) {
			const el = highlightedElement.value;
			if (el?.isConnected) previousElement.value = el;
			highlightedElement.value = null;
			emits("leave", event);
		}
		function onEnter(event) {
			const entryFocusEvent = new CustomEvent("listbox.entryFocus", {
				bubbles: false,
				cancelable: true
			});
			event.currentTarget?.dispatchEvent(entryFocusEvent);
			emits("entryFocus", entryFocusEvent);
			if (entryFocusEvent.defaultPrevented) return;
			if (previousElement.value) changeHighlight(previousElement.value);
			else {
				const el = getCollectionItem()?.[0];
				changeHighlight(el);
			}
		}
		function onKeydownNavigation(event) {
			const intent = getFocusIntent(event, orientation.value, dir.value);
			if (!intent) return;
			let collection = getCollectionItem();
			if (highlightedElement.value) {
				if (intent === "last") collection.reverse();
				else if (intent === "prev" || intent === "next") {
					if (intent === "prev") collection.reverse();
					const currentIndex = collection.indexOf(highlightedElement.value);
					collection = collection.slice(currentIndex + 1);
				}
				handleMultipleReplace(event, collection[0]);
			}
			if (collection.length) {
				const index = !highlightedElement.value && intent === "prev" ? collection.length - 1 : 0;
				changeHighlight(collection[index]);
			}
			if (isVirtual.value) return virtualKeydownHook.trigger(event);
		}
		function handleMultipleReplace(event, targetEl) {
			if (isVirtual.value || props.selectionBehavior !== "replace" || !multiple.value || !Array.isArray(modelValue.value)) return;
			if ((event.altKey || event.ctrlKey || event.metaKey) && !event.shiftKey) return;
			if (event.shiftKey) {
				const collection = getItems().filter((i) => i.ref.dataset.disabled !== "");
				let lastValue = collection.find((i) => i.ref === targetEl)?.value;
				if (event.key === kbd.END) lastValue = collection.at(-1)?.value;
				else if (event.key === kbd.HOME) lastValue = collection[0]?.value;
				if (!lastValue || !firstValue.value) return;
				const values = findValuesBetween(collection.map((i) => i.value), firstValue.value, lastValue);
				modelValue.value = values;
			}
		}
		async function highlightSelected(event, scroll = true) {
			if (!isClient) return;
			await (0, vue_exports.nextTick)();
			if (isVirtual.value) virtualFocusHook.trigger({
				event,
				scroll
			});
			else {
				const collection = getCollectionItem();
				const item = collection.find((i) => i.dataset.state === "checked");
				const focus = scroll ? void 0 : false;
				if (item) changeHighlight(item, scroll, focus);
				else if (collection.length) changeHighlight(collection[0], scroll, focus);
			}
		}
		let hasHighlightedOnMount = false;
		(0, vue_exports.watch)(modelValue, () => {
			if (!isUserAction.value) {
				const scroll = hasHighlightedOnMount;
				hasHighlightedOnMount = true;
				(0, vue_exports.nextTick)(() => {
					highlightSelected(void 0, scroll);
				});
			}
		}, {
			immediate: true,
			deep: true
		});
		__expose({
			highlightedElement,
			highlightItem,
			highlightFirstItem,
			highlightSelected,
			getItems
		});
		provideListboxRootContext({
			modelValue,
			onValueChange,
			multiple,
			orientation,
			dir,
			disabled,
			highlightOnHover,
			highlightedElement,
			isVirtual,
			virtualFocusHook,
			virtualKeydownHook,
			virtualHighlightHook,
			by: props.by,
			firstValue,
			selectionBehavior,
			focusable,
			onLeave,
			onEnter,
			changeHighlight,
			onKeydownEnter,
			onKeydownNavigation,
			onKeydownTypeAhead,
			onCompositionStart,
			onCompositionEnd,
			highlightFirstItem
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				ref_key: "primitiveElement",
				ref: primitiveElement,
				as: _ctx.as,
				"as-child": _ctx.asChild,
				dir: (0, vue_exports.unref)(dir),
				"data-disabled": (0, vue_exports.unref)(disabled) ? "" : void 0,
				onPointerleave: onLeave,
				onFocusout: _cache[0] || (_cache[0] = async (event) => {
					const target = event.relatedTarget || event.target;
					await (0, vue_exports.nextTick)();
					if (highlightedElement.value && (0, vue_exports.unref)(currentElement) && !(0, vue_exports.unref)(currentElement).contains(target)) onLeave(event);
				})
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { modelValue: (0, vue_exports.unref)(modelValue) }), (0, vue_exports.unref)(isFormControl) && _ctx.name ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(VisuallyHiddenInput_default), {
					key: 0,
					name: _ctx.name,
					value: (0, vue_exports.unref)(modelValue),
					disabled: (0, vue_exports.unref)(disabled),
					required: _ctx.required
				}, null, 8, [
					"name",
					"value",
					"disabled",
					"required"
				])) : (0, vue_exports.createCommentVNode)("v-if", true)]),
				_: 3
			}, 8, [
				"as",
				"as-child",
				"dir",
				"data-disabled"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Listbox/ListboxContent.js
var ListboxContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ListboxContent",
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
		const { CollectionSlot } = useCollection();
		const rootContext = injectListboxRootContext();
		const isClickFocus = refAutoReset(false, 10);
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollectionSlot), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					role: "listbox",
					as: _ctx.as,
					"as-child": _ctx.asChild,
					tabindex: (0, vue_exports.unref)(rootContext).focusable.value ? (0, vue_exports.unref)(rootContext).highlightedElement.value ? "-1" : "0" : "-1",
					"aria-orientation": (0, vue_exports.unref)(rootContext).orientation.value,
					"aria-multiselectable": !!(0, vue_exports.unref)(rootContext).multiple.value,
					"data-orientation": (0, vue_exports.unref)(rootContext).orientation.value,
					onMousedown: _cache[0] || (_cache[0] = (0, vue_exports.withModifiers)(($event) => isClickFocus.value = true, ["left"])),
					onFocus: _cache[1] || (_cache[1] = (ev) => {
						if ((0, vue_exports.unref)(isClickFocus)) return;
						(0, vue_exports.unref)(rootContext).onEnter(ev);
					}),
					onKeydown: [
						_cache[2] || (_cache[2] = (0, vue_exports.withKeys)((event) => {
							if ((0, vue_exports.unref)(rootContext).orientation.value === "vertical" && (event.key === "ArrowLeft" || event.key === "ArrowRight") || (0, vue_exports.unref)(rootContext).orientation.value === "horizontal" && (event.key === "ArrowUp" || event.key === "ArrowDown")) return;
							event.preventDefault();
							(0, vue_exports.unref)(rootContext).focusable.value && (0, vue_exports.unref)(rootContext).onKeydownNavigation(event);
						}, [
							"down",
							"up",
							"left",
							"right",
							"home",
							"end"
						])),
						(0, vue_exports.withKeys)((0, vue_exports.unref)(rootContext).onKeydownEnter, ["enter"]),
						(0, vue_exports.unref)(rootContext).onKeydownTypeAhead
					]
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"as",
					"as-child",
					"tabindex",
					"aria-orientation",
					"aria-multiselectable",
					"data-orientation",
					"onKeydown"
				])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Listbox/ListboxFilter.js
var ListboxFilter_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ListboxFilter",
	props: {
		modelValue: {
			type: String,
			required: false
		},
		autoFocus: {
			type: Boolean,
			required: false
		},
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
			default: "input"
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const modelValue = useVModel(props, "modelValue", __emit, {
			defaultValue: "",
			passive: props.modelValue === void 0
		});
		const rootContext = injectListboxRootContext();
		const { primitiveElement, currentElement } = usePrimitiveElement();
		const disabled = (0, vue_exports.computed)(() => props.disabled || rootContext.disabled.value || false);
		const activedescendant = (0, vue_exports.ref)();
		(0, vue_exports.watchSyncEffect)(() => activedescendant.value = rootContext.highlightedElement.value?.id);
		(0, vue_exports.onMounted)(() => {
			rootContext.focusable.value = false;
			setTimeout(() => {
				if (props.autoFocus) currentElement.value?.focus();
			}, 1);
		});
		(0, vue_exports.onUnmounted)(() => {
			rootContext.focusable.value = true;
		});
		const { isComposing, shouldDeferInput, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useComposing((event) => {
			modelValue.value = event.target.value;
			rootContext.onCompositionEnd();
			rootContext.highlightFirstItem();
		});
		function onCompositionStart() {
			rootContext.onCompositionStart();
			handleCompositionStart();
		}
		function handleInput(event) {
			if (shouldDeferInput.value) return;
			modelValue.value = event.target.value;
			rootContext.highlightFirstItem();
		}
		function handleKeydownNavigation(event) {
			if (isComposing.value) return;
			event.preventDefault();
			rootContext.onKeydownNavigation(event);
		}
		function handleKeydownEnter(event) {
			if (isComposing.value) return;
			rootContext.onKeydownEnter(event);
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				ref_key: "primitiveElement",
				ref: primitiveElement,
				as: _ctx.as,
				"as-child": _ctx.asChild,
				value: (0, vue_exports.unref)(modelValue),
				disabled: disabled.value ? "" : void 0,
				"data-disabled": disabled.value ? "" : void 0,
				"aria-disabled": disabled.value ?? void 0,
				"aria-activedescendant": activedescendant.value,
				type: "text",
				onKeydown: [(0, vue_exports.withKeys)(handleKeydownNavigation, [
					"down",
					"up",
					"home",
					"end"
				]), (0, vue_exports.withKeys)(handleKeydownEnter, ["enter"])],
				onInput: handleInput,
				onCompositionstart: onCompositionStart,
				onCompositionupdate: (0, vue_exports.unref)(handleCompositionUpdate),
				onCompositionend: (0, vue_exports.unref)(handleCompositionEnd)
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { modelValue: (0, vue_exports.unref)(modelValue) })]),
				_: 3
			}, 8, [
				"as",
				"as-child",
				"value",
				"disabled",
				"data-disabled",
				"aria-disabled",
				"aria-activedescendant",
				"onCompositionupdate",
				"onCompositionend"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Listbox/ListboxItem.js
var LISTBOX_SELECT = "listbox.select";
var [injectListboxItemContext, provideListboxItemContext] = /*#__PURE__*/ createContext("ListboxItem");
var ListboxItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ListboxItem",
	props: {
		value: {
			type: null,
			required: true
		},
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
			default: "div"
		}
	},
	emits: ["select"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const id = useId$2(void 0, "reka-listbox-item");
		const { CollectionItem } = useCollection();
		const { forwardRef, currentElement } = useForwardExpose();
		const rootContext = injectListboxRootContext();
		const isHighlighted = (0, vue_exports.computed)(() => currentElement.value != null && currentElement.value === rootContext.highlightedElement.value);
		const isSelected = (0, vue_exports.computed)(() => valueComparator(rootContext.modelValue.value, props.value, rootContext.by));
		const disabled = (0, vue_exports.computed)(() => rootContext.disabled.value || props.disabled);
		async function handleSelect(ev) {
			emits("select", ev);
			if (ev?.defaultPrevented) return;
			if (!disabled.value && ev) {
				rootContext.onValueChange(props.value);
				rootContext.changeHighlight(currentElement.value);
			}
		}
		function handleSelectCustomEvent(ev) {
			const eventDetail = {
				originalEvent: ev,
				value: props.value
			};
			handleAndDispatchCustomEvent(LISTBOX_SELECT, handleSelect, eventDetail);
		}
		provideListboxItemContext({ isSelected });
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollectionItem), { value: _ctx.value }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.withMemo)([
					isHighlighted.value,
					isSelected.value,
					disabled.value,
					(0, vue_exports.unref)(rootContext).focusable.value,
					...Object.entries(_ctx.$attrs).flat()
				], () => (0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({ id: (0, vue_exports.unref)(id) }, _ctx.$attrs, {
					ref: (0, vue_exports.unref)(forwardRef),
					role: "option",
					tabindex: (0, vue_exports.unref)(rootContext).focusable.value ? isHighlighted.value ? "0" : "-1" : -1,
					"aria-selected": isSelected.value,
					as: _ctx.as,
					"as-child": _ctx.asChild,
					disabled: disabled.value ? "" : void 0,
					"data-disabled": disabled.value ? "" : void 0,
					"data-highlighted": isHighlighted.value ? "" : void 0,
					"data-state": isSelected.value ? "checked" : "unchecked",
					onClick: handleSelectCustomEvent,
					onKeydown: (0, vue_exports.withKeys)((0, vue_exports.withModifiers)(handleSelectCustomEvent, ["prevent"]), ["space"]),
					onPointermove: _cache[0] || (_cache[0] = () => {
						if ((0, vue_exports.unref)(rootContext).highlightedElement.value === (0, vue_exports.unref)(currentElement)) return;
						if ((0, vue_exports.unref)(rootContext).highlightOnHover.value) (0, vue_exports.unref)(rootContext).changeHighlight((0, vue_exports.unref)(currentElement), false, false);
					})
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16, [
					"id",
					"tabindex",
					"aria-selected",
					"as",
					"as-child",
					"disabled",
					"data-disabled",
					"data-highlighted",
					"data-state",
					"onKeydown"
				]), _cache, 1)]),
				_: 3
			}, 8, ["value"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Combobox/useComboboxContentPositioning.js
function useComboboxContentPositioning(open) {
	const contentPosition = (0, vue_exports.ref)("inline");
	const contentPlaced = (0, vue_exports.ref)(false);
	const currentContent = (0, vue_exports.ref)();
	const suppressHighlightScroll = (0, vue_exports.computed)(() => contentPosition.value === "popper" && !contentPlaced.value);
	let pendingHighlightScroll;
	provideListboxHighlightScrollContext({
		suppressHighlightScroll,
		onHighlightScrollRequest(scroll) {
			pendingHighlightScroll = scroll;
		}
	});
	function onContentPositionChange(content, position) {
		if (currentContent.value !== content || contentPosition.value !== position) {
			contentPlaced.value = false;
			pendingHighlightScroll = void 0;
		}
		currentContent.value = content;
		contentPosition.value = position;
	}
	function onContentPlaced(content) {
		if (currentContent.value !== content || contentPosition.value !== "popper" || contentPlaced.value) return;
		contentPlaced.value = true;
		const scroll = pendingHighlightScroll;
		pendingHighlightScroll = void 0;
		if (open.value) scroll?.();
	}
	function onContentUnmount(content) {
		if (currentContent.value !== content) return;
		currentContent.value = void 0;
		contentPosition.value = "inline";
		contentPlaced.value = false;
		pendingHighlightScroll = void 0;
	}
	return {
		onContentPositionChange,
		onContentPlaced,
		onContentUnmount
	};
}
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxRoot.js
var [injectComboboxRootContext, provideComboboxRootContext] = /*#__PURE__*/ createContext("ComboboxRoot");
var ComboboxRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxRoot",
	props: {
		open: {
			type: Boolean,
			required: false,
			default: void 0
		},
		defaultOpen: {
			type: Boolean,
			required: false
		},
		resetSearchTermOnBlur: {
			type: Boolean,
			required: false,
			default: true
		},
		resetSearchTermOnSelect: {
			type: Boolean,
			required: false,
			default: true
		},
		openOnFocus: {
			type: Boolean,
			required: false,
			default: false
		},
		openOnClick: {
			type: Boolean,
			required: false,
			default: false
		},
		ignoreFilter: {
			type: Boolean,
			required: false
		},
		resetModelValueOnClear: {
			type: Boolean,
			required: false,
			default: false
		},
		modelValue: {
			type: null,
			required: false
		},
		defaultValue: {
			type: null,
			required: false
		},
		multiple: {
			type: Boolean,
			required: false
		},
		dir: {
			type: String,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		highlightOnHover: {
			type: Boolean,
			required: false,
			default: true
		},
		by: {
			type: [String, Function],
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
		name: {
			type: String,
			required: false
		},
		required: {
			type: Boolean,
			required: false
		}
	},
	emits: [
		"update:modelValue",
		"highlight",
		"update:open"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { primitiveElement, currentElement: parentElement } = usePrimitiveElement();
		const { multiple, disabled, ignoreFilter, resetSearchTermOnSelect, openOnFocus, openOnClick, dir: propDir, resetModelValueOnClear, highlightOnHover } = (0, vue_exports.toRefs)(props);
		const dir = useDirection(propDir);
		const modelValue = useVModel(props, "modelValue", emits, {
			defaultValue: props.defaultValue ?? (multiple.value ? [] : void 0),
			passive: props.modelValue === void 0,
			deep: true
		});
		const open = useVModel(props, "open", emits, {
			defaultValue: props.defaultOpen,
			passive: props.open === void 0
		});
		async function onOpenChange(val) {
			open.value = val;
			filterSearch.value = "";
			if (val) {
				await (0, vue_exports.nextTick)();
				primitiveElement.value?.highlightSelected();
				isUserInputted.value = true;
				inputElement.value?.focus();
			} else {
				isUserInputted.value = false;
				setTimeout(() => {
					if (!val && props.resetSearchTermOnBlur) resetSearchTerm.trigger();
				}, 1);
			}
		}
		const resetSearchTerm = createEventHook();
		const isUserInputted = (0, vue_exports.ref)(false);
		const isVirtual = (0, vue_exports.ref)(false);
		const inputElement = (0, vue_exports.ref)();
		const triggerElement = (0, vue_exports.ref)();
		const highlightedElement = (0, vue_exports.computed)(() => primitiveElement.value?.highlightedElement ?? void 0);
		const contentPositioning = useComboboxContentPositioning(open);
		const allItems = (0, vue_exports.ref)(/* @__PURE__ */ new Map());
		const allGroups = (0, vue_exports.ref)(/* @__PURE__ */ new Map());
		const { contains } = useFilter({ sensitivity: "base" });
		const filterSearch = (0, vue_exports.ref)("");
		const filterState = (0, vue_exports.computed)((oldValue) => {
			if (!filterSearch.value || props.ignoreFilter || isVirtual.value) return {
				count: allItems.value.size,
				items: oldValue?.items ?? /* @__PURE__ */ new Map(),
				groups: oldValue?.groups ?? new Set(allGroups.value.keys())
			};
			let itemCount = 0;
			const filteredItems = /* @__PURE__ */ new Map();
			const filteredGroups = /* @__PURE__ */ new Set();
			for (const [id, value] of allItems.value) {
				const score = contains(value, filterSearch.value);
				filteredItems.set(id, score ? 1 : 0);
				if (score) itemCount++;
			}
			for (const [groupId, group] of allGroups.value) for (const itemId of group) if (filteredItems.get(itemId) > 0) {
				filteredGroups.add(groupId);
				break;
			}
			return {
				count: itemCount,
				items: filteredItems,
				groups: filteredGroups
			};
		});
		const inst = (0, vue_exports.getCurrentInstance)();
		(0, vue_exports.onMounted)(() => {
			if (inst?.exposed) {
				inst.exposed.highlightItem = primitiveElement.value?.highlightItem;
				inst.exposed.highlightFirstItem = primitiveElement.value?.highlightFirstItem;
				inst.exposed.highlightSelected = primitiveElement.value?.highlightSelected;
			}
		});
		__expose({
			filtered: filterState,
			highlightedElement,
			highlightItem: primitiveElement.value?.highlightItem,
			highlightFirstItem: primitiveElement.value?.highlightFirstItem,
			highlightSelected: primitiveElement.value?.highlightSelected
		});
		provideComboboxRootContext({
			modelValue,
			multiple,
			disabled,
			open,
			onOpenChange,
			...contentPositioning,
			contentId: "",
			isUserInputted,
			isVirtual,
			inputElement,
			highlightedElement,
			onInputElementChange: (val) => inputElement.value = val,
			triggerElement,
			onTriggerElementChange: (val) => triggerElement.value = val,
			parentElement,
			resetSearchTermOnSelect,
			onResetSearchTerm: resetSearchTerm.on,
			allItems,
			allGroups,
			filterSearch,
			filterState,
			ignoreFilter,
			openOnFocus,
			openOnClick,
			resetModelValueOnClear
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopperRoot_default), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ListboxRoot_default), (0, vue_exports.mergeProps)({
					ref_key: "primitiveElement",
					ref: primitiveElement
				}, _ctx.$attrs, {
					modelValue: (0, vue_exports.unref)(modelValue),
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => (0, vue_exports.isRef)(modelValue) ? modelValue.value = $event : null),
					style: { pointerEvents: (0, vue_exports.unref)(open) ? "auto" : void 0 },
					as: _ctx.as,
					"as-child": _ctx.asChild,
					dir: (0, vue_exports.unref)(dir),
					multiple: (0, vue_exports.unref)(multiple),
					name: _ctx.name,
					required: _ctx.required,
					disabled: (0, vue_exports.unref)(disabled),
					"highlight-on-hover": (0, vue_exports.unref)(highlightOnHover),
					by: props.by,
					onHighlight: _cache[1] || (_cache[1] = ($event) => emits("highlight", $event))
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {
						open: (0, vue_exports.unref)(open),
						modelValue: (0, vue_exports.unref)(modelValue)
					})]),
					_: 3
				}, 16, [
					"modelValue",
					"style",
					"as",
					"as-child",
					"dir",
					"multiple",
					"name",
					"required",
					"disabled",
					"highlight-on-hover",
					"by"
				])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxAnchor.js
var ComboboxAnchor_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxAnchor",
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
		const { forwardRef } = useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopperAnchor_default), {
				"as-child": "",
				reference: _ctx.reference
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
					ref: (0, vue_exports.unref)(forwardRef),
					"as-child": _ctx.asChild,
					as: _ctx.as
				}, _ctx.$attrs), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16, ["as-child", "as"])]),
				_: 3
			}, 8, ["reference"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxContentImpl.js
var [injectComboboxContentContext, provideComboboxContentContext] = /*#__PURE__*/ createContext("ComboboxContent");
var ComboboxContentImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxContentImpl",
	props: {
		position: {
			type: String,
			required: false,
			default: "inline"
		},
		bodyLock: {
			type: Boolean,
			required: false
		},
		hideWhenEmpty: {
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
		},
		disableOutsidePointerEvents: {
			type: Boolean,
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
		const { position } = (0, vue_exports.toRefs)(props);
		const rootContext = injectComboboxRootContext();
		const contentId = Symbol("ComboboxContent");
		(0, vue_exports.watch)(position, (value) => rootContext.onContentPositionChange(contentId, value), { immediate: true });
		const isEmpty = (0, vue_exports.computed)(() => rootContext.ignoreFilter.value ? rootContext.allItems.value.size === 0 : rootContext.filterState.value.count === 0);
		const { forwardRef, currentElement } = useForwardExpose();
		useBodyScrollLock(props.bodyLock);
		useFocusGuards();
		useHideOthers(rootContext.parentElement);
		const pickedProps = (0, vue_exports.computed)(() => {
			if (props.position === "popper") return props;
			else return {};
		});
		const forwardedProps = useForwardProps(pickedProps.value);
		const popperStyle = {
			"boxSizing": "border-box",
			"--reka-combobox-content-transform-origin": "var(--reka-popper-transform-origin)",
			"--reka-combobox-content-available-width": "var(--reka-popper-available-width)",
			"--reka-combobox-content-available-height": "var(--reka-popper-available-height)",
			"--reka-combobox-trigger-width": "var(--reka-popper-anchor-width)",
			"--reka-combobox-trigger-height": "var(--reka-popper-anchor-height)"
		};
		provideComboboxContentContext({ position });
		const isInputWithinContent = (0, vue_exports.ref)(false);
		(0, vue_exports.onMounted)(() => {
			if (rootContext.inputElement.value) {
				isInputWithinContent.value = currentElement.value.contains(rootContext.inputElement.value);
				if (isInputWithinContent.value) rootContext.inputElement.value.focus();
			}
		});
		(0, vue_exports.onUnmounted)(() => {
			rootContext.onContentUnmount(contentId);
			const activeElement = getActiveElement();
			if (isInputWithinContent.value && (!activeElement || activeElement === document.body)) rootContext.triggerElement.value?.focus();
		});
		function isEventTargetWithinCombobox(target) {
			if (rootContext.parentElement.value?.contains(target)) return true;
			const control = (target instanceof Element ? target.closest("label") : null)?.control;
			return !!control && !!rootContext.parentElement.value?.contains(control);
		}
		const popperContentEvents = { placed: () => rootContext.onContentPlaced(contentId) };
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ListboxContent_default), { "as-child": "" }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(FocusScope_default), {
					"as-child": "",
					onMountAutoFocus: _cache[5] || (_cache[5] = (0, vue_exports.withModifiers)(() => {}, ["prevent"])),
					onUnmountAutoFocus: _cache[6] || (_cache[6] = (0, vue_exports.withModifiers)(() => {}, ["prevent"]))
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DismissableLayer_default), {
						"as-child": "",
						"disable-outside-pointer-events": _ctx.disableOutsidePointerEvents,
						onDismiss: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(rootContext).onOpenChange(false)),
						onFocusOutside: _cache[1] || (_cache[1] = (ev) => {
							if (isEventTargetWithinCombobox(ev.target)) ev.preventDefault();
							emits("focusOutside", ev);
						}),
						onInteractOutside: _cache[2] || (_cache[2] = ($event) => emits("interactOutside", $event)),
						onEscapeKeyDown: _cache[3] || (_cache[3] = ($event) => emits("escapeKeyDown", $event)),
						onPointerDownOutside: _cache[4] || (_cache[4] = (ev) => {
							if (isEventTargetWithinCombobox(ev.target)) ev.preventDefault();
							emits("pointerDownOutside", ev);
						})
					}, {
						default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(position) === "popper" ? (0, vue_exports.unref)(PopperContent_default) : (0, vue_exports.unref)(Primitive)), (0, vue_exports.mergeProps)({
							..._ctx.$attrs,
							...(0, vue_exports.unref)(forwardedProps)
						}, {
							id: (0, vue_exports.unref)(rootContext).contentId,
							ref: (0, vue_exports.unref)(forwardRef),
							"memo-dependencies": (0, vue_exports.unref)(position) === "popper" ? [(0, vue_exports.unref)(rootContext).filterSearch.value, (0, vue_exports.unref)(rootContext).filterState.value] : void 0,
							"data-state": (0, vue_exports.unref)(rootContext).open.value ? "open" : "closed",
							"data-empty": isEmpty.value ? "" : void 0,
							style: {
								display: props.hideWhenEmpty && isEmpty.value ? "none" : "flex",
								flexDirection: "column",
								outline: "none",
								...(0, vue_exports.unref)(position) === "popper" ? popperStyle : {}
							}
						}, (0, vue_exports.toHandlers)((0, vue_exports.unref)(position) === "popper" ? popperContentEvents : {})), {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
							_: 3
						}, 16, [
							"id",
							"memo-dependencies",
							"data-state",
							"data-empty",
							"style"
						]))]),
						_: 3
					}, 8, ["disable-outside-pointer-events"])]),
					_: 3
				})]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxContent.js
var ComboboxContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxContent",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		position: {
			type: String,
			required: false
		},
		bodyLock: {
			type: Boolean,
			required: false
		},
		hideWhenEmpty: {
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
		},
		disableOutsidePointerEvents: {
			type: Boolean,
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
		const forwarded = useForwardPropsEmits(__props, __emit);
		const { forwardRef } = useForwardExpose();
		const rootContext = injectComboboxRootContext();
		rootContext.contentId ||= useId$2(void 0, "reka-combobox-content");
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), { present: _ctx.forceMount || (0, vue_exports.unref)(rootContext).open.value }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(ComboboxContentImpl_default, (0, vue_exports.mergeProps)({
					...(0, vue_exports.unref)(forwarded),
					..._ctx.$attrs
				}, { ref: (0, vue_exports.unref)(forwardRef) }), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16)]),
				_: 3
			}, 8, ["present"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxEmpty.js
var ComboboxEmpty_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxEmpty",
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
		const rootContext = injectComboboxRootContext();
		const isRender = (0, vue_exports.computed)(() => rootContext.ignoreFilter.value ? rootContext.allItems.value.size === 0 : rootContext.filterState.value.count === 0);
		return (_ctx, _cache) => {
			return isRender.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.normalizeProps)((0, vue_exports.mergeProps)({ key: 0 }, props)), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, () => [_cache[0] || (_cache[0] = (0, vue_exports.createTextVNode)("No options"))])]),
				_: 3
			}, 16)) : (0, vue_exports.createCommentVNode)("v-if", true);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxGroup.js
var [injectComboboxGroupContext, provideComboboxGroupContext] = /*#__PURE__*/ createContext("ComboboxGroup");
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxInput.js
var ComboboxInput_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxInput",
	props: {
		displayValue: {
			type: Function,
			required: false
		},
		modelValue: {
			type: String,
			required: false
		},
		autoFocus: {
			type: Boolean,
			required: false
		},
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
			default: "input"
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectComboboxRootContext();
		const listboxContext = injectListboxRootContext();
		const { primitiveElement, currentElement } = usePrimitiveElement();
		const modelValue = useVModel(props, "modelValue", emits, { passive: props.modelValue === void 0 });
		(0, vue_exports.onMounted)(() => {
			if (currentElement.value) rootContext.onInputElementChange(currentElement.value);
		});
		const { isComposing, shouldDeferInput, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useComposing((event) => {
			const el = event.target;
			if (el) processInputValue(el.value);
		});
		function handleKeyDown(ev) {
			if (isComposing.value) return;
			ev.preventDefault();
			if (!rootContext.open.value) rootContext.onOpenChange(true);
		}
		function processInputValue(value) {
			if (!rootContext.open.value) {
				rootContext.onOpenChange(true);
				(0, vue_exports.nextTick)(() => {
					if (value) {
						rootContext.filterSearch.value = value;
						listboxContext.highlightFirstItem();
					}
				});
			} else rootContext.filterSearch.value = value;
		}
		function handleInput(event) {
			if (shouldDeferInput.value) return;
			processInputValue(event.target.value);
		}
		function handleFocus() {
			if (rootContext.openOnFocus.value && !rootContext.open.value) rootContext.onOpenChange(true);
		}
		function handleBlur(ev) {
			if (!rootContext.open.value) return;
			const nextFocus = ev.relatedTarget;
			if (!nextFocus) return;
			const isInsideRoot = rootContext.parentElement.value?.contains(nextFocus);
			const isInsideContent = document.getElementById(rootContext.contentId)?.contains(nextFocus);
			if (!isInsideRoot && !isInsideContent) requestAnimationFrame(() => {
				if (!rootContext.open.value) return;
				const active = document.activeElement;
				if (!rootContext.parentElement.value?.contains(active) && !document.getElementById(rootContext.contentId)?.contains(active)) rootContext.onOpenChange(false);
			});
		}
		function handleClick() {
			if (rootContext.openOnClick.value && !rootContext.open.value) rootContext.onOpenChange(true);
		}
		function resetSearchTerm() {
			const rootModelValue = rootContext.modelValue.value;
			if (props.displayValue) modelValue.value = props.displayValue(rootModelValue);
			else if (!rootContext.multiple.value && rootModelValue && !Array.isArray(rootModelValue)) if (typeof rootModelValue !== "object") modelValue.value = rootModelValue.toString();
			else modelValue.value = "";
			else modelValue.value = "";
			(0, vue_exports.nextTick)(() => {
				modelValue.value = modelValue.value;
			});
		}
		rootContext.onResetSearchTerm(() => {
			resetSearchTerm();
		});
		(0, vue_exports.watch)(rootContext.modelValue, async () => {
			if (!rootContext.isUserInputted.value && rootContext.resetSearchTermOnSelect.value) resetSearchTerm();
		}, {
			immediate: true,
			deep: true
		});
		(0, vue_exports.watch)(rootContext.filterState, (_newValue, oldValue) => {
			if (!rootContext.isVirtual.value && oldValue.count === 0) listboxContext.highlightFirstItem();
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ListboxFilter_default), {
				ref_key: "primitiveElement",
				ref: primitiveElement,
				modelValue: (0, vue_exports.unref)(modelValue),
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => (0, vue_exports.isRef)(modelValue) ? modelValue.value = $event : null),
				as: _ctx.as,
				"as-child": _ctx.asChild,
				"auto-focus": _ctx.autoFocus,
				disabled: _ctx.disabled,
				"aria-expanded": (0, vue_exports.unref)(rootContext).open.value,
				"aria-controls": (0, vue_exports.unref)(rootContext).contentId,
				"aria-autocomplete": "list",
				role: "combobox",
				autocomplete: "off",
				onClick: handleClick,
				onInput: handleInput,
				onKeydown: (0, vue_exports.withKeys)(handleKeyDown, ["down", "up"]),
				onFocus: handleFocus,
				onBlur: handleBlur,
				onCompositionstart: (0, vue_exports.unref)(handleCompositionStart),
				onCompositionupdate: (0, vue_exports.unref)(handleCompositionUpdate),
				onCompositionend: (0, vue_exports.unref)(handleCompositionEnd)
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"modelValue",
				"as",
				"as-child",
				"auto-focus",
				"disabled",
				"aria-expanded",
				"aria-controls",
				"onCompositionstart",
				"onCompositionupdate",
				"onCompositionend"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxItem.js
var ComboboxItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxItem",
	props: {
		textValue: {
			type: String,
			required: false
		},
		value: {
			type: null,
			required: true
		},
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
			required: false
		}
	},
	emits: ["select"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const id = useId$2(void 0, "reka-combobox-item");
		const rootContext = injectComboboxRootContext();
		const groupContext = injectComboboxGroupContext(null);
		const { primitiveElement, currentElement } = usePrimitiveElement();
		if (props.value === "") throw new Error("A <ComboboxItem /> must have a value prop that is not an empty string. This is because the Combobox value can be set to an empty string to clear the selection and show the placeholder.");
		const isRender = (0, vue_exports.computed)(() => {
			if (rootContext.isVirtual.value || rootContext.ignoreFilter.value || !rootContext.filterSearch.value) return true;
			else {
				const filteredCurrentItem = rootContext.filterState.value.items.get(id);
				if (filteredCurrentItem === void 0) return true;
				return filteredCurrentItem > 0;
			}
		});
		(0, vue_exports.onMounted)(() => {
			rootContext.allItems.value.set(id, props.textValue || currentElement.value.textContent || currentElement.value.innerText);
			const groupId = groupContext?.id;
			if (groupId) if (!rootContext.allGroups.value.has(groupId)) rootContext.allGroups.value.set(groupId, /* @__PURE__ */ new Set([id]));
			else rootContext.allGroups.value.get(groupId)?.add(id);
		});
		(0, vue_exports.onUnmounted)(() => {
			rootContext.allItems.value.delete(id);
		});
		return (_ctx, _cache) => {
			return isRender.value ? (0, vue_exports.withMemo)([
				isRender.value,
				(0, vue_exports.unref)(rootContext).filterSearch.value,
				(0, vue_exports.unref)(rootContext).disabled.value,
				_ctx.disabled,
				props.value,
				props.as,
				props.asChild,
				...Object.values(_ctx.$attrs)
			], () => ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ListboxItem_default), (0, vue_exports.mergeProps)({ key: 0 }, props, {
				id: (0, vue_exports.unref)(id),
				ref_key: "primitiveElement",
				ref: primitiveElement,
				disabled: (0, vue_exports.unref)(rootContext).disabled.value || _ctx.disabled,
				onSelect: _cache[0] || (_cache[0] = (event) => {
					emits("select", event);
					if (event.defaultPrevented) return;
					if (!(0, vue_exports.unref)(rootContext).multiple.value && !_ctx.disabled && !(0, vue_exports.unref)(rootContext).disabled.value) {
						event.preventDefault();
						(0, vue_exports.unref)(rootContext).onOpenChange(false);
						(0, vue_exports.unref)(rootContext).modelValue.value = props.value;
					} else if ((0, vue_exports.unref)(rootContext).multiple.value) (0, vue_exports.unref)(rootContext).inputElement.value?.focus();
				})
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, () => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(_ctx.value), 1)])]),
				_: 3
			}, 16, ["id", "disabled"])), _cache, 1) : (0, vue_exports.createCommentVNode)("v-if", true);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/shared/useNonce.js
function useNonce(nonce) {
	const context = injectConfigProviderContext({ nonce: (0, vue_exports.ref)() });
	return (0, vue_exports.computed)(() => nonce?.value || context.nonce?.value);
}
//#endregion
//#region node_modules/reka-ui/dist/Combobox/ComboboxViewport.js
var ComboboxViewport_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "ComboboxViewport",
	props: {
		nonce: {
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
		const { forwardRef } = useForwardExpose();
		const { nonce: propNonce } = (0, vue_exports.toRefs)(props);
		const nonce = useNonce(propNonce);
		const rootContext = injectComboboxRootContext();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createElementBlock)(vue_exports.Fragment, null, [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)({
				..._ctx.$attrs,
				...props
			}, {
				ref: (0, vue_exports.unref)(forwardRef),
				"data-reka-combobox-viewport": "",
				role: "presentation",
				style: {
					position: "relative",
					flex: (0, vue_exports.unref)(rootContext).isVirtual.value ? void 0 : 1,
					overflow: "auto"
				}
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["style"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
				as: "style",
				nonce: (0, vue_exports.unref)(nonce)
			}, {
				default: (0, vue_exports.withCtx)(() => _cache[0] || (_cache[0] = [(0, vue_exports.createTextVNode)(" /* Hide scrollbars cross-browser and enable momentum scroll for touch devices */ [data-reka-combobox-viewport] { scrollbar-width:none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; } [data-reka-combobox-viewport]::-webkit-scrollbar { display: none; } ")])),
				_: 1,
				__: [0]
			}, 8, ["nonce"])], 64);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popover/PopoverRoot.js
var [injectPopoverRootContext, providePopoverRootContext] = /*#__PURE__*/ createContext("PopoverRoot");
var PopoverRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopoverRoot",
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
		modal: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	emits: ["update:open"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { modal } = (0, vue_exports.toRefs)(props);
		const open = useVModel(props, "open", emit, {
			defaultValue: props.defaultOpen,
			passive: props.open === void 0
		});
		providePopoverRootContext({
			contentId: "",
			triggerId: "",
			modal,
			open,
			onOpenChange: (value) => {
				open.value = value;
			},
			onOpenToggle: () => {
				open.value = !open.value;
			},
			triggerElement: (0, vue_exports.ref)(),
			hasCustomAnchor: (0, vue_exports.ref)(false)
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(PopperRoot_default), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", {
					open: (0, vue_exports.unref)(open),
					close: () => open.value = false
				})]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popover/PopoverContentImpl.js
var PopoverContentImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopoverContentImpl",
	props: {
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
		},
		disableOutsidePointerEvents: {
			type: Boolean,
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"openAutoFocus",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const forwarded = useForwardProps(reactiveOmit(props, "trapFocus", "disableOutsidePointerEvents"));
		const { forwardRef } = useForwardExpose();
		const rootContext = injectPopoverRootContext();
		useFocusGuards();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(FocusScope_default), {
				"as-child": "",
				loop: "",
				trapped: _ctx.trapFocus,
				onMountAutoFocus: _cache[5] || (_cache[5] = ($event) => emits("openAutoFocus", $event)),
				onUnmountAutoFocus: _cache[6] || (_cache[6] = ($event) => emits("closeAutoFocus", $event))
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DismissableLayer_default), {
					"as-child": "",
					"disable-outside-pointer-events": _ctx.disableOutsidePointerEvents,
					onPointerDownOutside: _cache[0] || (_cache[0] = ($event) => emits("pointerDownOutside", $event)),
					onInteractOutside: _cache[1] || (_cache[1] = ($event) => emits("interactOutside", $event)),
					onEscapeKeyDown: _cache[2] || (_cache[2] = ($event) => emits("escapeKeyDown", $event)),
					onFocusOutside: _cache[3] || (_cache[3] = ($event) => emits("focusOutside", $event)),
					onDismiss: _cache[4] || (_cache[4] = ($event) => (0, vue_exports.unref)(rootContext).onOpenChange(false))
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopperContent_default), (0, vue_exports.mergeProps)((0, vue_exports.unref)(forwarded), {
						id: (0, vue_exports.unref)(rootContext).contentId,
						ref: (0, vue_exports.unref)(forwardRef),
						"data-state": (0, vue_exports.unref)(rootContext).open.value ? "open" : "closed",
						"aria-labelledby": (0, vue_exports.unref)(rootContext).triggerId,
						style: {
							"--reka-popover-content-transform-origin": "var(--reka-popper-transform-origin)",
							"--reka-popover-content-available-width": "var(--reka-popper-available-width)",
							"--reka-popover-content-available-height": "var(--reka-popper-available-height)",
							"--reka-popover-trigger-width": "var(--reka-popper-anchor-width)",
							"--reka-popover-trigger-height": "var(--reka-popper-anchor-height)"
						},
						role: "dialog"
					}), {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
						_: 3
					}, 16, [
						"id",
						"data-state",
						"aria-labelledby"
					])]),
					_: 3
				}, 8, ["disable-outside-pointer-events"])]),
				_: 3
			}, 8, ["trapped"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popover/PopoverContentModal.js
var PopoverContentModal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopoverContentModal",
	props: {
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
		},
		disableOutsidePointerEvents: {
			type: Boolean,
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"openAutoFocus",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectPopoverRootContext();
		const isRightClickOutsideRef = (0, vue_exports.ref)(false);
		useBodyScrollLock(true);
		const forwarded = useForwardPropsEmits(props, emits);
		const { forwardRef, currentElement } = useForwardExpose();
		useHideOthers(currentElement);
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(PopoverContentImpl_default, (0, vue_exports.mergeProps)((0, vue_exports.unref)(forwarded), {
				ref: (0, vue_exports.unref)(forwardRef),
				"trap-focus": (0, vue_exports.unref)(rootContext).open.value,
				"disable-outside-pointer-events": "",
				onCloseAutoFocus: _cache[0] || (_cache[0] = (0, vue_exports.withModifiers)((event) => {
					emits("closeAutoFocus", event);
					if (!isRightClickOutsideRef.value) (0, vue_exports.unref)(rootContext).triggerElement.value?.focus();
				}, ["prevent"])),
				onPointerDownOutside: _cache[1] || (_cache[1] = (event) => {
					emits("pointerDownOutside", event);
					const originalEvent = event.detail.originalEvent;
					const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
					const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
					isRightClickOutsideRef.value = isRightClick;
				}),
				onFocusOutside: _cache[2] || (_cache[2] = (0, vue_exports.withModifiers)(() => {}, ["prevent"]))
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["trap-focus"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popover/PopoverContentNonModal.js
var PopoverContentNonModal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopoverContentNonModal",
	props: {
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
		},
		disableOutsidePointerEvents: {
			type: Boolean,
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"openAutoFocus",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectPopoverRootContext();
		const hasInteractedOutsideRef = (0, vue_exports.ref)(false);
		const hasPointerDownOutsideRef = (0, vue_exports.ref)(false);
		const forwarded = useForwardPropsEmits(props, emits);
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(PopoverContentImpl_default, (0, vue_exports.mergeProps)((0, vue_exports.unref)(forwarded), {
				"trap-focus": false,
				"disable-outside-pointer-events": false,
				onCloseAutoFocus: _cache[0] || (_cache[0] = (event) => {
					emits("closeAutoFocus", event);
					if (!event.defaultPrevented) {
						if (!hasInteractedOutsideRef.value) (0, vue_exports.unref)(rootContext).triggerElement.value?.focus();
						event.preventDefault();
					}
					hasInteractedOutsideRef.value = false;
					hasPointerDownOutsideRef.value = false;
				}),
				onInteractOutside: _cache[1] || (_cache[1] = async (event) => {
					emits("interactOutside", event);
					if (!event.defaultPrevented) {
						hasInteractedOutsideRef.value = true;
						if (event.detail.originalEvent.type === "pointerdown") hasPointerDownOutsideRef.value = true;
					}
					const target = event.target;
					if ((0, vue_exports.unref)(rootContext).triggerElement.value?.contains(target)) event.preventDefault();
					if (event.detail.originalEvent.type === "focusin" && hasPointerDownOutsideRef.value) event.preventDefault();
				})
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popover/PopoverContent.js
var PopoverContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopoverContent",
	props: {
		forceMount: {
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
		},
		disableOutsidePointerEvents: {
			type: Boolean,
			required: false
		}
	},
	emits: [
		"escapeKeyDown",
		"pointerDownOutside",
		"focusOutside",
		"interactOutside",
		"openAutoFocus",
		"closeAutoFocus"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectPopoverRootContext();
		const forwarded = useForwardPropsEmits(props, emits);
		const { forwardRef } = useForwardExpose();
		rootContext.contentId ||= useId$2(void 0, "reka-popover-content");
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), { present: _ctx.forceMount || (0, vue_exports.unref)(rootContext).open.value }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.unref)(rootContext).modal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(PopoverContentModal_default, (0, vue_exports.mergeProps)({ key: 0 }, (0, vue_exports.unref)(forwarded), { ref: (0, vue_exports.unref)(forwardRef) }), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(PopoverContentNonModal_default, (0, vue_exports.mergeProps)({ key: 1 }, (0, vue_exports.unref)(forwarded), { ref: (0, vue_exports.unref)(forwardRef) }), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16))]),
				_: 3
			}, 8, ["present"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Popover/PopoverPortal.js
var PopoverPortal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopoverPortal",
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
//#region node_modules/reka-ui/dist/Popover/PopoverTrigger.js
var PopoverTrigger_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "PopoverTrigger",
	props: {
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
		const rootContext = injectPopoverRootContext();
		const { forwardRef, currentElement: triggerElement } = useForwardExpose();
		rootContext.triggerId ||= useId$2(void 0, "reka-popover-trigger");
		rootContext.contentId ||= useId$2(void 0, "reka-popover-content");
		(0, vue_exports.onMounted)(() => {
			rootContext.triggerElement.value = triggerElement.value;
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(rootContext).hasCustomAnchor.value ? (0, vue_exports.unref)(Primitive) : (0, vue_exports.unref)(PopperAnchor_default)), { "as-child": "" }, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					id: (0, vue_exports.unref)(rootContext).triggerId,
					ref: (0, vue_exports.unref)(forwardRef),
					type: _ctx.as === "button" ? "button" : void 0,
					"aria-haspopup": "dialog",
					"aria-expanded": (0, vue_exports.unref)(rootContext).open.value,
					"aria-controls": (0, vue_exports.unref)(rootContext).open.value ? (0, vue_exports.unref)(rootContext).contentId : void 0,
					"data-state": (0, vue_exports.unref)(rootContext).open.value ? "open" : "closed",
					as: _ctx.as,
					"as-child": props.asChild,
					onClick: (0, vue_exports.unref)(rootContext).onOpenToggle
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"id",
					"type",
					"aria-expanded",
					"aria-controls",
					"data-state",
					"as",
					"as-child",
					"onClick"
				])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region resources/js/Components/Home/FindFast.vue?vue&type=script&setup=true&lang.ts
var FindFast_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FindFast",
	__ssrInlineRender: true,
	props: {
		sizes: {},
		brands: {},
		vehicle: {}
	},
	setup(__props) {
		/**
		* H6 · Schnell finden — Nach Zollgröße · Nach Marke.
		*
		* Two shortcuts into the catalogue for people who already know what they want. The size tiles are
		* typography, not icons: the number is the tile. A diameter with nothing in stock is not a tile at
		* all; with a vehicle chosen, a diameter that no document permits on that car is greyed with its
		* count and is not a link — shown, never hidden, never struck (home-overhaul.md §0.6), so the
		* range reads as a range. The brands are the shared brand wall (BrandWall, home-brands.md): a
		* hairline grid that always closes on its own link cell, never on an empty one.
		*/
		const props = __props;
		/** `1 passende Felge` · `9 passende Felgen` — `felgen()` with the adjective between the number and the noun. */
		function passende(count) {
			return felgen(count).replace(" ", ` passende `);
		}
		const tiles = (0, vue_exports.computed)(() => props.sizes.filter((size) => size.count > 0).map((size) => {
			const fitting = props.vehicle === null ? null : size.fitting;
			return {
				...size,
				none: fitting === 0,
				line: fitting === null ? felgen(size.count) : passende(fitting)
			};
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h6",
				class: "find",
				"data-section": "H6",
				"aria-labelledby": "h6-heading"
			}, _attrs))} data-v-e4fa893e><div class="container" data-v-e4fa893e>`);
			if (tiles.value.length > 0) {
				_push(`<div class="find__row" data-v-e4fa893e><h2 id="h6-heading" class="h2" data-v-e4fa893e>Nach Zollgröße</h2><ul class="sizes" aria-label="Felgen nach Zollgröße" data-v-e4fa893e><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(tiles.value, (size) => {
					_push(`<li class="sizes__item" data-v-e4fa893e>`);
					if (size.none) _push(`<span class="size-tile size-tile--none" aria-disabled="true" data-v-e4fa893e><span class="display num size-tile__number" data-v-e4fa893e>${(0, server_renderer_exports.ssrInterpolate)(size.inch)}</span><span class="small quiet" data-v-e4fa893e>Zoll</span><span class="small num quiet" data-v-e4fa893e>${(0, server_renderer_exports.ssrInterpolate)(size.line)}</span></span>`);
					else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: size.href,
						class: "size-tile",
						prefetch: ""
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`<span class="display num size-tile__number" data-v-e4fa893e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.inch)}</span><span class="small muted" data-v-e4fa893e${_scopeId}>Zoll</span><span class="small num muted" data-v-e4fa893e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.line)}</span>`);
							else return [
								(0, vue_exports.createVNode)("span", { class: "display num size-tile__number" }, (0, vue_exports.toDisplayString)(size.inch), 1),
								(0, vue_exports.createVNode)("span", { class: "small muted" }, "Zoll"),
								(0, vue_exports.createVNode)("span", { class: "small num muted" }, (0, vue_exports.toDisplayString)(size.line), 1)
							];
						}),
						_: 2
					}, _parent));
					_push(`</li>`);
				});
				_push(`<!--]--></ul></div>`);
			} else _push(`<!---->`);
			if (__props.brands.length > 0) {
				_push(`<div class="find__row" data-v-e4fa893e><h2${(0, server_renderer_exports.ssrRenderAttr)("id", tiles.value.length > 0 ? "h6-brands" : "h6-heading")} class="h2" data-v-e4fa893e>Nach Marke</h2>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(BrandWall_default, {
					brands: __props.brands,
					vehicle: __props.vehicle
				}, null, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/FindFast.vue
var _sfc_setup$11 = FindFast_vue_vue_type_script_setup_true_lang_default.setup;
FindFast_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/FindFast.vue");
	return _sfc_setup$11 ? _sfc_setup$11(props, ctx) : void 0;
};
var FindFast_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FindFast_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e4fa893e"]]);
//#endregion
//#region resources/js/Components/Home/GuidesSection.vue?vue&type=script&setup=true&lang.ts
var GuidesSection_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "GuidesSection",
	__ssrInlineRender: true,
	props: { guides: {} },
	setup(__props) {
		/**
		* H10 · Ratgeber — "Wissen, bevor du kaufst".
		*
		* Up to three real articles that answer the questions the selector raises: one large, the others
		* small, each a single link stretched over its block and each with its own teaser. Without a
		* cover photograph the title steps into its place — no placeholder, no drawn illustration.
		* Reading time is what the article record says.
		*
		* With exactly two articles (the third guide is a draft until its legal wording is signed off)
		* the two share the row as equals, so the section does not read as a lead with a hole beside it.
		*/
		const props = __props;
		const lead = (0, vue_exports.computed)(() => props.guides[0] ?? null);
		const rest = (0, vue_exports.computed)(() => props.guides.slice(1, 3));
		const pair = (0, vue_exports.computed)(() => props.guides.length === 2);
		function readingTime(minutes) {
			return `${minutes} Min. Lesezeit`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h10",
				class: "guides",
				"data-section": "H10",
				"aria-labelledby": "h10-heading"
			}, _attrs))} data-v-f7016995><div class="container" data-v-f7016995><h2 id="h10-heading" class="h2" data-v-f7016995>Wissen, bevor du kaufst</h2><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "guides__grid--pair": pair.value }, "grid guides__grid"])}" data-v-f7016995>`);
			if (lead.value) {
				_push(`<article class="guide guide--lead" data-v-f7016995><h3 class="h3" data-v-f7016995>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: `/ratgeber/${lead.value.slug}`,
					class: "guide__link",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(lead.value.title)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(lead.value.title), 1)];
					}),
					_: 1
				}, _parent));
				_push(`</h3>`);
				if (lead.value.teaser) _push(`<p class="body muted guide__teaser" data-v-f7016995>${(0, server_renderer_exports.ssrInterpolate)(lead.value.teaser)}</p>`);
				else _push(`<!---->`);
				_push(`<p class="small quiet num guide__meta" data-v-f7016995>${(0, server_renderer_exports.ssrInterpolate)(readingTime(lead.value.minutes))}</p></article>`);
			} else _push(`<!---->`);
			if (rest.value.length > 0) {
				_push(`<div class="guides__aside" data-v-f7016995><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(rest.value, (guide) => {
					_push(`<article class="guide" data-v-f7016995><h3 class="${(0, server_renderer_exports.ssrRenderClass)(pair.value ? "h3" : "h4")}" data-v-f7016995>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: `/ratgeber/${guide.slug}`,
						class: "guide__link",
						prefetch: ""
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(guide.title)}`);
							else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(guide.title), 1)];
						}),
						_: 2
					}, _parent));
					_push(`</h3>`);
					if (guide.teaser) _push(`<p class="${(0, server_renderer_exports.ssrRenderClass)(pair.value ? "body muted guide__teaser" : "small muted guide__teaser")}" data-v-f7016995>${(0, server_renderer_exports.ssrInterpolate)(guide.teaser)}</p>`);
					else _push(`<!---->`);
					_push(`<p class="small quiet num guide__meta" data-v-f7016995>${(0, server_renderer_exports.ssrInterpolate)(readingTime(guide.minutes))}</p></article>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			_push(`</div></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/GuidesSection.vue
var _sfc_setup$10 = GuidesSection_vue_vue_type_script_setup_true_lang_default.setup;
GuidesSection_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/GuidesSection.vue");
	return _sfc_setup$10 ? _sfc_setup$10(props, ctx) : void 0;
};
var GuidesSection_default = /*#__PURE__*/ _plugin_vue_export_helper_default(GuidesSection_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f7016995"]]);
//#endregion
//#region resources/js/Components/Home/GutachtenStory.vue?vue&type=script&setup=true&lang.ts
/** Column widths in percent: Hersteller · Handelsbezeichnung · Typ · Genehmigungsnr. · Reifengrößen · Auflagen. */
var TARGET = 3;
/**
* The SVG is stretched over the table (`preserveAspectRatio="none"`): x runs 0–1000 across the
* table's width, y is one unit per CSS pixel of the table's designed height — a 24 px head row
* and nine 28 px rows. `vector-effect: non-scaling-stroke` keeps the marker 22 px wide whatever
* the table's width.
*/
var VB_W$1 = 1e3;
var HEAD_H = 24;
var ROW_H = 28;
var CENTRE_BAND = "-40% 0px -40% 0px";
var UPPER_BAND = "0px 0px -75% 0px";
var GutachtenStory_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "GutachtenStory",
	__ssrInlineRender: true,
	props: { stats: {} },
	setup(__props) {
		/**
		* H4 · The Gutachten story — signature moment 2, "Textmarker".
		*
		* A paper document on the left: the "Verwendungsbereich" table of a fictional Teilegutachten, set
		* small and narrow the way a type-approval document is set. On the right, three steps. As the
		* steps scroll into view, highlighter strokes mark the row of the example vehicle and, at the end,
		* the verdict stamp lands. The marker colour and its gradient exist for this one illustration
		* (docs/phase0/ADDENDUM.md §C, docs/design/sections/home.md §0.6).
		*
		* The document is an example and stays one: the marked row is always the fictional BMW row, with
		* a vehicle chosen or not. A "Beispiel" document that asserted a verdict for the customer's real
		* car — which no document here knows anything about — would be the one thing CLAUDE.md §2 forbids.
		* The row changes only when the engine hands the page a real document row for that vehicle.
		*
		* Motion is one scroll-driven timeline over the steps column where the browser has
		* `animation-timeline: view()`, so the four moments — find, mark, read the sizes, answer — play in
		* that order at every viewport height. Elsewhere two IntersectionObservers advance a `data-step`
		* attribute in the same order and CSS transitions do the rest, never flickering back. Below 1024,
		* under reduced motion, without JavaScript, and in print, the document simply rests in its end
		* state: every stroke drawn, the stamp down.
		*
		* The document is the one place on the site where an Auflage may appear as a code — it is a
		* facsimile. Everything the reader is meant to understand stands beside it, as sentences (R-15).
		*/
		const props = __props;
		const COLUMNS = [
			12,
			20,
			10,
			22,
			22,
			14
		];
		const HEADINGS = [
			"Hersteller",
			"Handelsbezeichnung",
			"Typ",
			"Genehmigungsnr.",
			"Reifengrößen",
			"Auflagen"
		];
		const EXAMPLE_ROWS = [
			{
				maker: "Audi",
				trade: "A4 Avant",
				type: "B8",
				approval: "e1*2001/116*0430*",
				tyres: "235/40 R18, 245/40 R18",
				conditions: "A02"
			},
			{
				maker: "VW",
				trade: "Golf VII",
				type: "5G",
				approval: "e1*2007/46*0300*",
				tyres: "225/40 R18, 225/45 R17",
				conditions: "–"
			},
			{
				maker: "Mercedes-Benz",
				trade: "C-Klasse",
				type: "W205",
				approval: "e1*2007/46*0402*",
				tyres: "225/45 R17, 245/40 R18",
				conditions: "A11"
			},
			{
				maker: "BMW",
				trade: "3er Coupé",
				type: "346C",
				approval: "e1*2001/116*0136*",
				tyres: "225/40 R18, 225/45 R17",
				conditions: "–"
			},
			{
				maker: "Škoda",
				trade: "Octavia",
				type: "5E",
				approval: "e11*2007/46*0122*",
				tyres: "225/45 R17, 225/40 R18",
				conditions: "K1a"
			},
			{
				maker: "Ford",
				trade: "Focus",
				type: "DEH",
				approval: "e13*2007/46*0350*",
				tyres: "215/45 R17, 235/35 R19",
				conditions: "A02"
			},
			{
				maker: "Opel",
				trade: "Astra",
				type: "K",
				approval: "e1*2007/46*0519*",
				tyres: "225/45 R17, 225/40 R18",
				conditions: "–"
			},
			{
				maker: "Seat",
				trade: "Leon",
				type: "5F",
				approval: "e9*2007/46*0141*",
				tyres: "225/40 R18, 225/45 R17",
				conditions: "A11"
			},
			{
				maker: "VW",
				trade: "Passat",
				type: "3G",
				approval: "e1*2007/46*0396*",
				tyres: "235/45 R17, 235/40 R18",
				conditions: "K1a"
			}
		];
		const VB_H = HEAD_H + EXAMPLE_ROWS.length * ROW_H;
		const edges = COLUMNS.reduce((acc, w) => [...acc, (acc[acc.length - 1] ?? 0) + w], [0]);
		/** A slightly wavy stroke from one column edge to another, starting a little before, ending a little after. */
		function stroke(fromCol, toCol) {
			const x0 = (edges[fromCol] ?? 0) * 10 - 8;
			const x1 = (edges[toCol] ?? 100) * 10 + 10;
			const third = (x1 - x0) / 3;
			return `M ${x0} 120.5 C ${(x0 + third).toFixed(1)} 123.5, ${(x0 + 2 * third).toFixed(1)} 120.5, ${x1} 123.2`;
		}
		const STROKES = [
			stroke(2, 4),
			stroke(0, 6),
			stroke(4, 6)
		];
		const facts = (0, vue_exports.computed)(() => {
			const { gutachten, variants, wheels } = props.stats;
			if (gutachten <= 0 || variants <= 0 || wheels <= 0) return null;
			return `${decimal(gutachten, 0)} Gutachten · ${decimal(variants, 0)} Fahrzeugvarianten · ${decimal(wheels, 0)} Felgen mit Gutachten`;
		});
		const STEPS = [
			{
				title: "Fahrzeug eindeutig erkennen",
				text: "Aus Marke, Modell und Variante – oder aus HSN und TSN – bestimmen wir die Typgenehmigung deines Fahrzeugs. Stehen zwei Fahrzeuge hinter einem Schlüssel, fragen wir nach, statt zu raten."
			},
			{
				title: "Gutachten abgleichen",
				text: "Wir suchen die Zeile, in der genau dein Fahrzeug steht – mit der Felgengröße, der Einpresstiefe und den Reifengrößen, die dort freigegeben sind."
			},
			{
				title: "Klare Antwort",
				text: "Du bekommst eine von vier Antworten: freigegeben, mit Auflagen, nicht freigegeben oder unbekannt. Nennt das Gutachten Auflagen, schreiben wir sie aus:"
			}
		];
		const EXAMPLE_CONDITIONS = ["Die Verwendung ist nur mit Reifen der Größe 225/40 R18 zulässig.", "Die Änderung ist in die Fahrzeugpapiere einzutragen."];
		/**
		* The same order as the timeline: step 1 → stroke 1, step 2 → stroke 2, step 3 → stroke 3, and the
		* stamp once step 3 has moved on up to the top quarter of the viewport. The centre band catches
		* each step as it is read; the upper band is where step 3 is when the reader is done with it.
		*/
		const STATES = [
			"1",
			"2",
			"3",
			"stamped"
		];
		const root = (0, vue_exports.ref)(null);
		const fallback = (0, vue_exports.ref)(false);
		const reached = (0, vue_exports.ref)(0);
		const observers = [];
		const step = (0, vue_exports.computed)(() => fallback.value && reached.value > 0 ? STATES[reached.value - 1] : void 0);
		function advance(to) {
			if (to > reached.value) reached.value = to;
		}
		function observe(rootMargin, targets, state) {
			const observer = new IntersectionObserver((entries) => {
				for (const entry of entries) if (entry.isIntersecting) advance(state(entry.target));
			}, { rootMargin });
			for (const el of targets) observer.observe(el);
			observers.push(observer);
		}
		(0, vue_exports.onMounted)(() => {
			if (typeof IntersectionObserver === "undefined") return;
			const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			const desktop = window.matchMedia("(min-width: 1024px)").matches;
			const native = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: view()");
			if (reduced || !desktop || native || root.value === null) return;
			const steps = [...root.value.querySelectorAll("[data-step-index]")];
			const last = steps[steps.length - 1];
			fallback.value = true;
			observe(CENTRE_BAND, steps, (el) => Number(el.dataset.stepIndex));
			if (last !== void 0) observe(UPPER_BAND, [last], () => STATES.length);
		});
		(0, vue_exports.onBeforeUnmount)(() => observers.forEach((o) => o.disconnect()));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h4",
				ref_key: "root",
				ref: root,
				class: ["story", { "is-io": fallback.value }],
				"data-section": "H4",
				"data-step": step.value,
				"aria-labelledby": "h4-heading"
			}, _attrs))} data-v-450baf15><div class="container" data-v-450baf15><div class="grid" data-v-450baf15><div class="story__head" data-v-450baf15><h2 id="h4-heading" class="h2 story__title" data-v-450baf15>Wir lesen das Gutachten. Du bekommst die Antwort.</h2>`);
			if (facts.value) _push(`<p class="body num muted story__facts" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(facts.value)}</p>`);
			else _push(`<!---->`);
			_push(`</div></div><div class="grid story__grid" data-v-450baf15><div class="story__doc" data-v-450baf15><div class="doc" role="img" aria-label="Beispiel eines Gutachten-Auszugs; die Zeile des gewählten Fahrzeugs ist markiert" data-v-450baf15><div class="doc__head" data-v-450baf15><span class="doc__title" data-v-450baf15>Teilegutachten Nr. 12-3456 (Beispiel)</span><span class="num" data-v-450baf15>Seite 4 von 12</span></div><p class="doc__sub" data-v-450baf15>Technischer Dienst Musterstadt · Auszug aus Abschnitt 4: Verwendungsbereich</p><div class="doc__body" data-v-450baf15><div class="doc__table" data-v-450baf15><div class="doc__row doc__row--head" data-v-450baf15><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(HEADINGS, (heading) => {
				_push(`<span class="doc__cell doc__cell--head" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(heading)}</span>`);
			});
			_push(`<!--]--></div><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(EXAMPLE_ROWS, (row, i) => {
				_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "doc__row--target": i === TARGET }, "doc__row"])}" data-v-450baf15><span class="doc__cell" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(row.maker)}</span><span class="doc__cell" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(row.trade)}</span><span class="doc__cell" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(row.type)}</span><span class="doc__cell" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(row.approval)}</span><span class="doc__cell" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(row.tyres)}</span><span class="doc__cell" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(row.conditions)}</span></div>`);
			});
			_push(`<!--]--></div><svg class="marker"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${VB_W$1} ${VB_H}`)} preserveAspectRatio="none" aria-hidden="true" focusable="false" data-v-450baf15><defs data-v-450baf15><linearGradient id="marker-ink" gradientUnits="userSpaceOnUse" x1="0" y1="0"${(0, server_renderer_exports.ssrRenderAttr)("x2", VB_W$1)} y2="0" data-v-450baf15><stop offset="0%" stop-opacity="0.78" data-v-450baf15></stop><stop offset="45%" stop-opacity="0.96" data-v-450baf15></stop><stop offset="100%" stop-opacity="0.82" data-v-450baf15></stop></linearGradient></defs><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STROKES, (d, i) => {
				_push(`<!--[--><path class="${(0, server_renderer_exports.ssrRenderClass)([`marker__stroke--${i + 1}`, "marker__stroke marker__stroke--echo"])}"${(0, server_renderer_exports.ssrRenderAttr)("d", d)} transform="translate(0 1)" pathLength="1" stroke="url(#marker-ink)" data-v-450baf15></path><path class="${(0, server_renderer_exports.ssrRenderClass)([`marker__stroke--${i + 1}`, "marker__stroke"])}"${(0, server_renderer_exports.ssrRenderAttr)("d", d)} pathLength="1" stroke="url(#marker-ink)" data-v-450baf15></path><!--]-->`);
			});
			_push(`<!--]--></svg></div><p class="micro quiet doc__caption" data-v-450baf15>Gutachten-Auszug (Beispiel)</p><span class="doc__stamp" data-v-450baf15>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
				status: "PERMITTED",
				size: "lg"
			}, null, _parent));
			_push(`</span></div></div><ol class="story__steps" data-v-450baf15><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(STEPS, (item, i) => {
				_push(`<li class="story__step"${(0, server_renderer_exports.ssrRenderAttr)("data-step-index", i + 1)} data-v-450baf15><span class="h2 num story__num" aria-hidden="true" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(i + 1)}</span><h3 class="h3 story__step-title" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(item.title)}</h3><p class="body muted story__text" data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(item.text)}</p>`);
				if (i === STEPS.length - 1) {
					_push(`<div class="story__example" data-v-450baf15>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: "CONDITIONAL" }, null, _parent));
					_push(`<ul class="small story__conditions" data-v-450baf15><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(EXAMPLE_CONDITIONS, (sentence) => {
						_push(`<li data-v-450baf15>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]--></ol></div></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/GutachtenStory.vue
var _sfc_setup$9 = GutachtenStory_vue_vue_type_script_setup_true_lang_default.setup;
GutachtenStory_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/GutachtenStory.vue");
	return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var GutachtenStory_default = /*#__PURE__*/ _plugin_vue_export_helper_default(GutachtenStory_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-450baf15"]]);
function toParams(query) {
	const params = new URLSearchParams();
	if ("fahrzeug" in query) params.set("fahrzeug", String(query.fahrzeug));
	else {
		params.set("hsn", query.hsn);
		params.set("tsn", query.tsn);
	}
	return params;
}
function useFitmentCount() {
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
		sequence++;
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
			const response = await fetch(`/api/v1/fitment/count?${toParams(query).toString()}`, {
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
		if (timer !== void 0) clearTimeout(timer);
		loading.value = true;
		failed.value = false;
		result.value = null;
		timer = setTimeout(() => {
			timer = void 0;
			fetchNow(query);
		}, 250);
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
//#endregion
//#region resources/js/Components/Home/HeroSelector.vue?vue&type=script&setup=true&lang.ts
var HSN_ERROR = "Die HSN hat vier Ziffern.";
var TSN_ERROR = "Die TSN hat drei Zeichen.";
var SCAN_FAILED = "Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein.";
var KW_PER_PS = .73549875;
var HeroSelector_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "HeroSelector",
	__ssrInlineRender: true,
	props: { selector: {} },
	setup(__props) {
		/**
		* H2 — the vehicle selector in the hero panel (desktop document, ≥ 768).
		*
		* Three ways in, as three tabs: Marke → Modell → Fahrzeug through type-to-filter comboboxes, the
		* two key numbers off the Zulassungsbescheinigung, and a photo of that document read on the
		* customer's own device. Whichever way, the panel shows — before anything is submitted — how many
		* wheels carry a Gutachten for the car (F1), and the primary button repeats that number.
		*
		* Three outcomes of the key-number route, none a dead end (R-09): one match writes the vehicle;
		* several matches come back from the server as a chooser (R-01: never guessed, no flag turns that
		* off); no match keeps what was typed and offers three routes forward.
		*
		* With a vehicle already chosen, the panel names it and leads to the listing.
		*/
		const props = __props;
		const page = usePage();
		const vehicle = (0, vue_exports.computed)(() => page.props.vehicle);
		const contact = (0, vue_exports.computed)(() => page.props.contact);
		const garage = (0, vue_exports.computed)(() => (page.props.garage ?? []).filter((g) => g.id !== vehicle.value?.id));
		const reach = (0, vue_exports.computed)(() => {
			const phone = contact.value?.phone ?? null;
			const email = contact.value?.email ?? "";
			return phone ? {
				href: `tel:${(contact.value?.phoneIntl ?? phone).replace(/\s/g, "")}`,
				label: `Anrufen: ${phone}`,
				sentence: `ruf uns an: ${phone}`
			} : {
				href: `mailto:${email}`,
				label: `Schreib uns: ${email}`,
				sentence: `schreib uns: ${email}`
			};
		});
		const id = (0, vue_exports.useId)();
		const tab = (0, vue_exports.ref)("marke");
		const make = (0, vue_exports.ref)(void 0);
		const model = (0, vue_exports.ref)(void 0);
		const variantId = (0, vue_exports.ref)(void 0);
		const models = (0, vue_exports.ref)([]);
		const variants = (0, vue_exports.ref)([]);
		const modelsLoading = (0, vue_exports.ref)(false);
		const variantsLoading = (0, vue_exports.ref)(false);
		const treeFailed = (0, vue_exports.ref)(false);
		const modelOpen = (0, vue_exports.ref)(false);
		let treeController;
		let treeSequence = 0;
		async function fetchTree(path, params, read) {
			treeController?.abort();
			treeController = new AbortController();
			const mine = ++treeSequence;
			treeFailed.value = false;
			try {
				const response = await fetch(`${path}?${new URLSearchParams(params).toString()}`, {
					headers: { Accept: "application/json" },
					credentials: "same-origin",
					signal: treeController.signal
				});
				if (mine !== treeSequence) return null;
				if (!response.ok) {
					treeFailed.value = true;
					return null;
				}
				return read(await response.json());
			} catch (error) {
				if (error.name !== "AbortError" && mine === treeSequence) treeFailed.value = true;
				return null;
			}
		}
		(0, vue_exports.watch)(make, async (value) => {
			model.value = void 0;
			variantId.value = void 0;
			models.value = [];
			variants.value = [];
			if (value === void 0) return;
			modelsLoading.value = true;
			const list = await fetchTree("/api/v1/vehicles/models", { marke: value }, (json) => json.models);
			modelsLoading.value = false;
			if (list !== null) {
				models.value = list;
				await (0, vue_exports.nextTick)();
				modelOpen.value = true;
			}
		});
		(0, vue_exports.watch)(model, async (value) => {
			variantId.value = void 0;
			variants.value = [];
			if (value === void 0 || make.value === void 0) return;
			variantsLoading.value = true;
			const list = await fetchTree("/api/v1/vehicles/variants", {
				marke: make.value,
				modell: value
			}, (json) => json.variants);
			variantsLoading.value = false;
			if (list !== null) variants.value = list;
		});
		/** `320i · 125 kW · 09/2001–02/2005`; an incomplete row says so (R-03). */
		function variantLabel(v) {
			const parts = [v.variant];
			if (v.powerPs !== null) parts.push(withUnit(Math.round(v.powerPs * KW_PER_PS), "kW"));
			if (v.buildWindow !== "") parts.push(v.buildWindow);
			return parts.join(" · ") + (v.needsReview ? " (unvollständige Daten)" : "");
		}
		function variantDisplay(value) {
			const found = variants.value.find((v) => v.id === value);
			return found === void 0 ? "" : variantLabel(found);
		}
		function stringDisplay(value) {
			return typeof value === "string" ? value : "";
		}
		const hsn = (0, vue_exports.ref)("");
		const tsn = (0, vue_exports.ref)("");
		const hsnError = (0, vue_exports.ref)(null);
		const tsnError = (0, vue_exports.ref)(null);
		const scanFailed = (0, vue_exports.ref)(false);
		const hsnField = (0, vue_exports.ref)(null);
		const tsnField = (0, vue_exports.ref)(null);
		const helpOpen = (0, vue_exports.ref)(false);
		const doc = (0, vue_exports.ref)("neu");
		function onHsn(event) {
			hsn.value = cleanHsn(event.target.value);
			hsnError.value = null;
			scanFailed.value = false;
			if (hsn.value.length === 4) tsnField.value?.focus();
		}
		function onTsn(event) {
			tsn.value = cleanTsn(event.target.value);
			tsnError.value = null;
			scanFailed.value = false;
		}
		/** A pasted `0005 582` fills both fields; spaces never reach a field. */
		function onHsnPaste(event) {
			const all = (event.clipboardData?.getData("text") ?? "").replace(/\s+/g, "");
			hsn.value = cleanHsn(all);
			hsnError.value = null;
			scanFailed.value = false;
			if (all.length > 4) {
				tsn.value = cleanTsn(all.slice(4));
				tsnError.value = null;
				tsnField.value?.focus();
			}
		}
		function onTsnPaste(event) {
			tsn.value = cleanTsn(event.clipboardData?.getData("text") ?? "");
			tsnError.value = null;
			scanFailed.value = false;
		}
		function validateHsn() {
			hsnError.value = hsn.value === "" || isHsn(hsn.value) ? null : HSN_ERROR;
			return hsnError.value === null;
		}
		function validateTsn() {
			tsnError.value = tsn.value === "" || isTsn(tsn.value) ? null : TSN_ERROR;
			return tsnError.value === null;
		}
		const keysValid = (0, vue_exports.computed)(() => isHsn(hsn.value) && isTsn(tsn.value));
		async function onScan(value) {
			hsn.value = value.hsn;
			tsn.value = value.tsn;
			hsnError.value = null;
			tsnError.value = null;
			scanFailed.value = false;
			tab.value = "hsn";
			await (0, vue_exports.nextTick)();
			hsnField.value?.focus();
		}
		async function onScanFailed() {
			scanFailed.value = true;
			tab.value = "hsn";
			await (0, vue_exports.nextTick)();
			hsnField.value?.focus();
		}
		const count = useFitmentCount();
		const selection = (0, vue_exports.computed)(() => {
			if (vehicle.value !== null) return { fahrzeug: vehicle.value.id };
			if (tab.value === "marke") return variantId.value === void 0 ? null : { fahrzeug: variantId.value };
			if (tab.value === "hsn") return keysValid.value ? {
				hsn: hsn.value,
				tsn: tsn.value
			} : null;
			return null;
		});
		(0, vue_exports.watch)(() => JSON.stringify(selection.value), () => {
			if (selection.value === null) count.clear();
			else count.run(selection.value);
		});
		(0, vue_exports.onMounted)(() => {
			if (selection.value !== null) count.run(selection.value);
		});
		const counted = (0, vue_exports.computed)(() => {
			const result = count.result.value;
			return result !== null && result.vehicle !== null ? result : null;
		});
		/** F2: the car is known and no published document names it. */
		const zero = (0, vue_exports.computed)(() => counted.value !== null && counted.value.count === 0);
		const buttonLabel = (0, vue_exports.computed)(() => {
			if (selection.value === null) return "Fahrzeug wählen";
			if (zero.value) return "Keine Felgen für dieses Fahrzeug";
			if (counted.value !== null && counted.value.count > 0) return `${counted.value.count} passende Felgen anzeigen`;
			return "Passende Felgen anzeigen";
		});
		const choice = useForm({ fahrzeug: 0 });
		const keys = useForm({
			hsn: "",
			tsn: ""
		});
		const pending = (0, vue_exports.computed)(() => choice.processing || keys.processing);
		function choose(vehicleId) {
			choice.fahrzeug = vehicleId;
			choice.post("/fahrzeug", { preserveScroll: true });
		}
		const lookupDismissed = (0, vue_exports.ref)(false);
		const lookup = (0, vue_exports.computed)(() => lookupDismissed.value ? null : page.props.lookup ?? null);
		const candidate = (0, vue_exports.ref)(null);
		(0, vue_exports.watch)(lookup, (value) => {
			if (value === null) return;
			hsn.value = value.hsn;
			tsn.value = value.tsn;
			hsnError.value = null;
			tsnError.value = null;
			candidate.value = null;
			tab.value = "hsn";
		}, { immediate: true });
		const chooser = (0, vue_exports.computed)(() => lookup.value?.status === "ambiguous" && lookup.value.distinction !== void 0 ? lookup.value.distinction : null);
		const answered = (0, vue_exports.computed)(() => page.props.lookup ?? null);
		const notFound = (0, vue_exports.computed)(() => answered.value?.status === "not_found" && hsn.value === answered.value.hsn && tsn.value === answered.value.tsn);
		/** `Höchstgeschwindigkeit 280 km/h · Achslast vorn 1.160 kg · VSN 123`: what differs, and only that. */
		function candidateFacts(row) {
			if (chooser.value === null) return "";
			const facts = chooser.value.attributes.map((a) => `${chooser.value?.labels[a] ?? a} ${row.values[a] ?? ""}`.trim());
			if (row.vsn !== null && row.vsn !== "") facts.push(`VSN ${row.vsn}`);
			return facts.join(" · ");
		}
		function chooseCandidate() {
			if (candidate.value !== null) choose(candidate.value);
		}
		async function otherNumbers() {
			lookupDismissed.value = true;
			await (0, vue_exports.nextTick)();
			hsnField.value?.focus();
		}
		async function checkAgain() {
			lookupDismissed.value = true;
			await (0, vue_exports.nextTick)();
			hsnField.value?.focus();
			hsnField.value?.select();
		}
		async function viaMake() {
			lookupDismissed.value = true;
			tab.value = "marke";
		}
		const notify = (0, vue_exports.reactive)({
			email: "",
			state: "idle",
			error: null
		});
		(0, vue_exports.onBeforeUnmount)(() => treeController?.abort());
		return (_ctx, _push, _parent, _attrs) => {
			if (vehicle.value) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "sel sel--vehicle" }, _attrs))} data-v-a0816086><p class="label" data-v-a0816086>Dein Fahrzeug</p><p class="h3 sel__vehicle" data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="small num muted" data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)}</p><p class="small num muted sel__count" aria-live="polite" data-v-a0816086>`);
				if ((0, vue_exports.unref)(count).loading.value) _push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
					width: "60%",
					height: "var(--lh-small)"
				}, null, _parent));
				else if ((0, vue_exports.unref)(count).failed.value) _push(`<!--[-->Die Anzahl lässt sich gerade nicht laden.<!--]-->`);
				else if (counted.value && counted.value.count > 0) _push(`<!--[--><strong class="sel__n" data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(counted.value.count)}</strong> Felgen mit Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}<!--]-->`);
				else _push(`<!---->`);
				_push(`</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--primary btn--lg btn--block sel__go",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(counted.value && counted.value.count > 0 ? `${counted.value.count} passende Felgen anzeigen` : "Passende Felgen anzeigen")}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(counted.value && counted.value.count > 0 ? `${counted.value.count} passende Felgen anzeigen` : "Passende Felgen anzeigen"), 1)];
					}),
					_: 1
				}, _parent));
				_push(`<div class="sel__vehicle-links" data-v-a0816086>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "link"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug ändern`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug ändern")];
					}),
					_: 1
				}, _parent));
				_push(`<button class="link" type="button" data-v-a0816086>Fahrzeug entfernen</button></div>`);
				if (garage.value.length) {
					_push(`<div class="sel__garage" data-v-a0816086><p class="label" data-v-a0816086>Zuletzt gewählt:</p><div class="chip-row" data-v-a0816086><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(garage.value, (g) => {
						_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(pending.value) ? " disabled" : ""} data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(g.short)}</button>`);
					});
					_push(`<!--]--></div></div>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			} else {
				_push(`<form${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "sel",
					novalidate: ""
				}, _attrs))} data-v-a0816086><fieldset class="sel__fields"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(pending.value) ? " disabled" : ""} data-v-a0816086>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsRoot_default), {
					modelValue: tab.value,
					"onUpdate:modelValue": ($event) => tab.value = $event,
					class: "tabs"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsList_default), {
								class: "tabs__list",
								"aria-label": "Fahrzeug angeben"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
											value: "marke",
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`Marke &amp; Modell`);
												else return [(0, vue_exports.createTextVNode)("Marke & Modell")];
											}),
											_: 1
										}, _parent, _scopeId));
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
											value: "hsn",
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`HSN/TSN`);
												else return [(0, vue_exports.createTextVNode)("HSN/TSN")];
											}),
											_: 1
										}, _parent, _scopeId));
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
											value: "scan",
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`Fahrzeugschein scannen`);
												else return [(0, vue_exports.createTextVNode)("Fahrzeugschein scannen")];
											}),
											_: 1
										}, _parent, _scopeId));
									} else return [
										(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
											value: "marke",
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Marke & Modell")]),
											_: 1
										}),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
											value: "hsn",
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("HSN/TSN")]),
											_: 1
										}),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
											value: "scan",
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Fahrzeugschein scannen")]),
											_: 1
										})
									];
								}),
								_: 1
							}, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
								value: "marke",
								class: "tabs__content"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<div class="sel__row sel__row--pair" data-v-a0816086${_scopeId}><div class="form-field" data-v-a0816086${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-marke`)} data-v-a0816086${_scopeId}>Marke</label>`);
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxRoot_default), {
											modelValue: make.value,
											"onUpdate:modelValue": ($event) => make.value = $event,
											class: "sel__combo",
											"open-on-click": ""
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxInput_default), {
																id: `${(0, vue_exports.unref)(id)}-marke`,
																class: "input",
																placeholder: "z. B. BMW",
																autocapitalize: "off",
																spellcheck: "false",
																"display-value": stringDisplay
															}, null, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
																id: `${(0, vue_exports.unref)(id)}-marke`,
																class: "input",
																placeholder: "z. B. BMW",
																autocapitalize: "off",
																spellcheck: "false",
																"display-value": stringDisplay
															}, null, 8, ["id"])];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxContent_default), {
														class: "popover sel__list",
														"aria-label": "Marken"
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) _push(`Keine Marke gefunden.`);
																				else return [(0, vue_exports.createTextVNode)("Keine Marke gefunden.")];
																			}),
																			_: 1
																		}, _parent, _scopeId));
																		_push(`<!--[-->`);
																		(0, server_renderer_exports.ssrRenderList)(props.selector.makes, (m) => {
																			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxItem_default), {
																				key: m.make,
																				value: m.make,
																				"text-value": m.make,
																				class: "menu__item sel__item"
																			}, {
																				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																					if (_push) _push(`<span data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(m.make)}</span> <span class="small quiet num" data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(m.models)} Modelle</span>`);
																					else return [
																						(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.make), 1),
																						(0, vue_exports.createTextVNode)(),
																						(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.models) + " Modelle", 1)
																					];
																				}),
																				_: 2
																			}, _parent, _scopeId));
																		});
																		_push(`<!--]-->`);
																	} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Keine Marke gefunden.")]),
																		_: 1
																	}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(props.selector.makes, (m) => {
																		return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																			key: m.make,
																			value: m.make,
																			"text-value": m.make,
																			class: "menu__item sel__item"
																		}, {
																			default: (0, vue_exports.withCtx)(() => [
																				(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.make), 1),
																				(0, vue_exports.createTextVNode)(),
																				(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.models) + " Modelle", 1)
																			]),
																			_: 2
																		}, 1032, ["value", "text-value"]);
																	}), 128))];
																}),
																_: 1
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Keine Marke gefunden.")]),
																	_: 1
																}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(props.selector.makes, (m) => {
																	return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																		key: m.make,
																		value: m.make,
																		"text-value": m.make,
																		class: "menu__item sel__item"
																	}, {
																		default: (0, vue_exports.withCtx)(() => [
																			(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.make), 1),
																			(0, vue_exports.createTextVNode)(),
																			(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.models) + " Modelle", 1)
																		]),
																		_: 2
																	}, 1032, ["value", "text-value"]);
																}), 128))]),
																_: 1
															})];
														}),
														_: 1
													}, _parent, _scopeId));
												} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
														id: `${(0, vue_exports.unref)(id)}-marke`,
														class: "input",
														placeholder: "z. B. BMW",
														autocapitalize: "off",
														spellcheck: "false",
														"display-value": stringDisplay
													}, null, 8, ["id"])]),
													_: 1
												}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
													class: "popover sel__list",
													"aria-label": "Marken"
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Keine Marke gefunden.")]),
															_: 1
														}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(props.selector.makes, (m) => {
															return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																key: m.make,
																value: m.make,
																"text-value": m.make,
																class: "menu__item sel__item"
															}, {
																default: (0, vue_exports.withCtx)(() => [
																	(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.make), 1),
																	(0, vue_exports.createTextVNode)(),
																	(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.models) + " Modelle", 1)
																]),
																_: 2
															}, 1032, ["value", "text-value"]);
														}), 128))]),
														_: 1
													})]),
													_: 1
												})];
											}),
											_: 1
										}, _parent, _scopeId));
										_push(`</div><div class="form-field" data-v-a0816086${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-modell`)} data-v-a0816086${_scopeId}>Modell</label>`);
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxRoot_default), {
											modelValue: model.value,
											"onUpdate:modelValue": ($event) => model.value = $event,
											open: modelOpen.value,
											"onUpdate:open": ($event) => modelOpen.value = $event,
											class: "sel__combo",
											disabled: make.value === void 0 || modelsLoading.value,
											"open-on-click": ""
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxInput_default), {
																id: `${(0, vue_exports.unref)(id)}-modell`,
																class: "input",
																placeholder: "z. B. 3er Coupé",
																autocapitalize: "off",
																spellcheck: "false",
																disabled: make.value === void 0 || modelsLoading.value,
																"display-value": stringDisplay
															}, null, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
																id: `${(0, vue_exports.unref)(id)}-modell`,
																class: "input",
																placeholder: "z. B. 3er Coupé",
																autocapitalize: "off",
																spellcheck: "false",
																disabled: make.value === void 0 || modelsLoading.value,
																"display-value": stringDisplay
															}, null, 8, ["id", "disabled"])];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxContent_default), {
														class: "popover sel__list",
														"aria-label": "Modelle"
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) _push(`Kein Modell gefunden.`);
																				else return [(0, vue_exports.createTextVNode)("Kein Modell gefunden.")];
																			}),
																			_: 1
																		}, _parent, _scopeId));
																		_push(`<!--[-->`);
																		(0, server_renderer_exports.ssrRenderList)(models.value, (m) => {
																			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxItem_default), {
																				key: m.model,
																				value: m.model,
																				"text-value": m.model,
																				class: "menu__item sel__item"
																			}, {
																				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																					if (_push) _push(`<span data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(m.model)}</span> <span class="small quiet num" data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(m.variants)} Varianten</span>`);
																					else return [
																						(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.model), 1),
																						(0, vue_exports.createTextVNode)(),
																						(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.variants) + " Varianten", 1)
																					];
																				}),
																				_: 2
																			}, _parent, _scopeId));
																		});
																		_push(`<!--]-->`);
																	} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Modell gefunden.")]),
																		_: 1
																	}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(models.value, (m) => {
																		return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																			key: m.model,
																			value: m.model,
																			"text-value": m.model,
																			class: "menu__item sel__item"
																		}, {
																			default: (0, vue_exports.withCtx)(() => [
																				(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.model), 1),
																				(0, vue_exports.createTextVNode)(),
																				(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.variants) + " Varianten", 1)
																			]),
																			_: 2
																		}, 1032, ["value", "text-value"]);
																	}), 128))];
																}),
																_: 1
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Modell gefunden.")]),
																	_: 1
																}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(models.value, (m) => {
																	return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																		key: m.model,
																		value: m.model,
																		"text-value": m.model,
																		class: "menu__item sel__item"
																	}, {
																		default: (0, vue_exports.withCtx)(() => [
																			(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.model), 1),
																			(0, vue_exports.createTextVNode)(),
																			(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.variants) + " Varianten", 1)
																		]),
																		_: 2
																	}, 1032, ["value", "text-value"]);
																}), 128))]),
																_: 1
															})];
														}),
														_: 1
													}, _parent, _scopeId));
												} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
														id: `${(0, vue_exports.unref)(id)}-modell`,
														class: "input",
														placeholder: "z. B. 3er Coupé",
														autocapitalize: "off",
														spellcheck: "false",
														disabled: make.value === void 0 || modelsLoading.value,
														"display-value": stringDisplay
													}, null, 8, ["id", "disabled"])]),
													_: 1
												}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
													class: "popover sel__list",
													"aria-label": "Modelle"
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Modell gefunden.")]),
															_: 1
														}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(models.value, (m) => {
															return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																key: m.model,
																value: m.model,
																"text-value": m.model,
																class: "menu__item sel__item"
															}, {
																default: (0, vue_exports.withCtx)(() => [
																	(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.model), 1),
																	(0, vue_exports.createTextVNode)(),
																	(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.variants) + " Varianten", 1)
																]),
																_: 2
															}, 1032, ["value", "text-value"]);
														}), 128))]),
														_: 1
													})]),
													_: 1
												})];
											}),
											_: 1
										}, _parent, _scopeId));
										_push(`</div></div><div class="sel__row" data-v-a0816086${_scopeId}><div class="form-field" data-v-a0816086${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-fahrzeug`)} data-v-a0816086${_scopeId}>Fahrzeug</label>`);
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxRoot_default), {
											modelValue: variantId.value,
											"onUpdate:modelValue": ($event) => variantId.value = $event,
											class: "sel__combo",
											disabled: model.value === void 0 || variantsLoading.value,
											"open-on-click": ""
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxInput_default), {
																id: `${(0, vue_exports.unref)(id)}-fahrzeug`,
																class: "input",
																placeholder: "Variante, Baujahr, kW",
																autocapitalize: "off",
																spellcheck: "false",
																disabled: model.value === void 0 || variantsLoading.value,
																"display-value": variantDisplay
															}, null, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
																id: `${(0, vue_exports.unref)(id)}-fahrzeug`,
																class: "input",
																placeholder: "Variante, Baujahr, kW",
																autocapitalize: "off",
																spellcheck: "false",
																disabled: model.value === void 0 || variantsLoading.value,
																"display-value": variantDisplay
															}, null, 8, ["id", "disabled"])];
														}),
														_: 1
													}, _parent, _scopeId));
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxContent_default), {
														class: "popover sel__list",
														"aria-label": "Fahrzeuge"
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) _push(`Kein Fahrzeug gefunden.`);
																				else return [(0, vue_exports.createTextVNode)("Kein Fahrzeug gefunden.")];
																			}),
																			_: 1
																		}, _parent, _scopeId));
																		_push(`<!--[-->`);
																		(0, server_renderer_exports.ssrRenderList)(variants.value, (v) => {
																			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(ComboboxItem_default), {
																				key: v.id,
																				value: v.id,
																				"text-value": variantLabel(v),
																				disabled: v.needsReview,
																				"aria-disabled": v.needsReview ? "true" : void 0,
																				class: "menu__item sel__item num"
																			}, {
																				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(variantLabel(v))}`);
																					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(variantLabel(v)), 1)];
																				}),
																				_: 2
																			}, _parent, _scopeId));
																		});
																		_push(`<!--]-->`);
																	} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Fahrzeug gefunden.")]),
																		_: 1
																	}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(variants.value, (v) => {
																		return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																			key: v.id,
																			value: v.id,
																			"text-value": variantLabel(v),
																			disabled: v.needsReview,
																			"aria-disabled": v.needsReview ? "true" : void 0,
																			class: "menu__item sel__item num"
																		}, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(variantLabel(v)), 1)]),
																			_: 2
																		}, 1032, [
																			"value",
																			"text-value",
																			"disabled",
																			"aria-disabled"
																		]);
																	}), 128))];
																}),
																_: 1
															}, _parent, _scopeId));
															else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Fahrzeug gefunden.")]),
																	_: 1
																}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(variants.value, (v) => {
																	return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																		key: v.id,
																		value: v.id,
																		"text-value": variantLabel(v),
																		disabled: v.needsReview,
																		"aria-disabled": v.needsReview ? "true" : void 0,
																		class: "menu__item sel__item num"
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(variantLabel(v)), 1)]),
																		_: 2
																	}, 1032, [
																		"value",
																		"text-value",
																		"disabled",
																		"aria-disabled"
																	]);
																}), 128))]),
																_: 1
															})];
														}),
														_: 1
													}, _parent, _scopeId));
												} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
														id: `${(0, vue_exports.unref)(id)}-fahrzeug`,
														class: "input",
														placeholder: "Variante, Baujahr, kW",
														autocapitalize: "off",
														spellcheck: "false",
														disabled: model.value === void 0 || variantsLoading.value,
														"display-value": variantDisplay
													}, null, 8, ["id", "disabled"])]),
													_: 1
												}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
													class: "popover sel__list",
													"aria-label": "Fahrzeuge"
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Fahrzeug gefunden.")]),
															_: 1
														}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(variants.value, (v) => {
															return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
																key: v.id,
																value: v.id,
																"text-value": variantLabel(v),
																disabled: v.needsReview,
																"aria-disabled": v.needsReview ? "true" : void 0,
																class: "menu__item sel__item num"
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(variantLabel(v)), 1)]),
																_: 2
															}, 1032, [
																"value",
																"text-value",
																"disabled",
																"aria-disabled"
															]);
														}), 128))]),
														_: 1
													})]),
													_: 1
												})];
											}),
											_: 1
										}, _parent, _scopeId));
										_push(`</div></div>`);
										if (treeFailed.value) _push(`<p class="small muted sel__tree-failed" role="status" data-v-a0816086${_scopeId}> Die Liste lässt sich gerade nicht laden. Versuch es bitte noch einmal oder nutze die HSN/TSN. </p>`);
										else _push(`<!---->`);
									} else return [
										(0, vue_exports.createVNode)("div", { class: "sel__row sel__row--pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `${(0, vue_exports.unref)(id)}-marke`
										}, "Marke", 8, ["for"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxRoot_default), {
											modelValue: make.value,
											"onUpdate:modelValue": ($event) => make.value = $event,
											class: "sel__combo",
											"open-on-click": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
													id: `${(0, vue_exports.unref)(id)}-marke`,
													class: "input",
													placeholder: "z. B. BMW",
													autocapitalize: "off",
													spellcheck: "false",
													"display-value": stringDisplay
												}, null, 8, ["id"])]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
												class: "popover sel__list",
												"aria-label": "Marken"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Keine Marke gefunden.")]),
														_: 1
													}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(props.selector.makes, (m) => {
														return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
															key: m.make,
															value: m.make,
															"text-value": m.make,
															class: "menu__item sel__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [
																(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.make), 1),
																(0, vue_exports.createTextVNode)(),
																(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.models) + " Modelle", 1)
															]),
															_: 2
														}, 1032, ["value", "text-value"]);
													}), 128))]),
													_: 1
												})]),
												_: 1
											})]),
											_: 1
										}, 8, ["modelValue", "onUpdate:modelValue"])]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `${(0, vue_exports.unref)(id)}-modell`
										}, "Modell", 8, ["for"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxRoot_default), {
											modelValue: model.value,
											"onUpdate:modelValue": ($event) => model.value = $event,
											open: modelOpen.value,
											"onUpdate:open": ($event) => modelOpen.value = $event,
											class: "sel__combo",
											disabled: make.value === void 0 || modelsLoading.value,
											"open-on-click": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
													id: `${(0, vue_exports.unref)(id)}-modell`,
													class: "input",
													placeholder: "z. B. 3er Coupé",
													autocapitalize: "off",
													spellcheck: "false",
													disabled: make.value === void 0 || modelsLoading.value,
													"display-value": stringDisplay
												}, null, 8, ["id", "disabled"])]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
												class: "popover sel__list",
												"aria-label": "Modelle"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Modell gefunden.")]),
														_: 1
													}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(models.value, (m) => {
														return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
															key: m.model,
															value: m.model,
															"text-value": m.model,
															class: "menu__item sel__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [
																(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.model), 1),
																(0, vue_exports.createTextVNode)(),
																(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.variants) + " Varianten", 1)
															]),
															_: 2
														}, 1032, ["value", "text-value"]);
													}), 128))]),
													_: 1
												})]),
												_: 1
											})]),
											_: 1
										}, 8, [
											"modelValue",
											"onUpdate:modelValue",
											"open",
											"onUpdate:open",
											"disabled"
										])])]),
										(0, vue_exports.createVNode)("div", { class: "sel__row" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `${(0, vue_exports.unref)(id)}-fahrzeug`
										}, "Fahrzeug", 8, ["for"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxRoot_default), {
											modelValue: variantId.value,
											"onUpdate:modelValue": ($event) => variantId.value = $event,
											class: "sel__combo",
											disabled: model.value === void 0 || variantsLoading.value,
											"open-on-click": ""
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
													id: `${(0, vue_exports.unref)(id)}-fahrzeug`,
													class: "input",
													placeholder: "Variante, Baujahr, kW",
													autocapitalize: "off",
													spellcheck: "false",
													disabled: model.value === void 0 || variantsLoading.value,
													"display-value": variantDisplay
												}, null, 8, ["id", "disabled"])]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
												class: "popover sel__list",
												"aria-label": "Fahrzeuge"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Fahrzeug gefunden.")]),
														_: 1
													}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(variants.value, (v) => {
														return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
															key: v.id,
															value: v.id,
															"text-value": variantLabel(v),
															disabled: v.needsReview,
															"aria-disabled": v.needsReview ? "true" : void 0,
															class: "menu__item sel__item num"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(variantLabel(v)), 1)]),
															_: 2
														}, 1032, [
															"value",
															"text-value",
															"disabled",
															"aria-disabled"
														]);
													}), 128))]),
													_: 1
												})]),
												_: 1
											})]),
											_: 1
										}, 8, [
											"modelValue",
											"onUpdate:modelValue",
											"disabled"
										])])]),
										treeFailed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 0,
											class: "small muted sel__tree-failed",
											role: "status"
										}, " Die Liste lässt sich gerade nicht laden. Versuch es bitte noch einmal oder nutze die HSN/TSN. ")) : (0, vue_exports.createCommentVNode)("", true)
									];
								}),
								_: 1
							}, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
								value: "hsn",
								class: "tabs__content"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										if (chooser.value && lookup.value) {
											_push(`<div class="sel__chooser" data-v-a0816086${_scopeId}><p class="h4" data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(chooser.value.rows.length)} Fahrzeuge passen zu ${(0, server_renderer_exports.ssrInterpolate)(lookup.value.hsn)}/${(0, server_renderer_exports.ssrInterpolate)(lookup.value.tsn)} – welches ist deins?</p>`);
											if (chooser.value.indistinguishable) _push(`<p class="small muted" data-v-a0816086${_scopeId}> Die Fahrzeuge unterscheiden sich in keinem Feld, das wir anzeigen können. Die VSN aus deiner Zulassungsbescheinigung hilft weiter. </p>`);
											else _push(`<!---->`);
											_push(`<div class="sel__candidates" role="radiogroup"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Fahrzeuge zu ${lookup.value.hsn}/${lookup.value.tsn}`)} data-v-a0816086${_scopeId}><!--[-->`);
											(0, server_renderer_exports.ssrRenderList)(chooser.value.rows, (row) => {
												_push(`<label class="check sel__candidate" data-v-a0816086${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(candidate.value, row.id)) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `${(0, vue_exports.unref)(id)}-kandidat`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.id)} data-v-a0816086${_scopeId}><span class="sel__candidate-text" data-v-a0816086${_scopeId}><span data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</span><span class="small num muted" data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(candidateFacts(row))}</span></span></label>`);
											});
											_push(`<!--]--></div><div class="sel__chooser-actions" data-v-a0816086${_scopeId}><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(candidate.value === null || pending.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", pending.value ? "true" : void 0)} data-v-a0816086${_scopeId}> Dieses Fahrzeug wählen </button><button class="link" type="button" data-v-a0816086${_scopeId}>Andere Nummern eingeben</button></div></div>`);
										} else {
											_push(`<!--[-->`);
											if (scanFailed.value) _push(`<p class="notice sel__notice" role="alert" data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(SCAN_FAILED)}</p>`);
											else _push(`<!---->`);
											_push(`<div class="sel__keys" data-v-a0816086${_scopeId}><div class="form-field" data-v-a0816086${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-hsn`)} data-v-a0816086${_scopeId}>HSN (Feld 2.1)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-hsn`)} class="input input--code"${(0, server_renderer_exports.ssrRenderAttr)("value", hsn.value)} inputmode="numeric" maxlength="4" autocomplete="off" enterkeyhint="next"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", hsnError.value || (0, vue_exports.unref)(keys).errors.hsn ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(id)}-hsn-error`)} data-v-a0816086${_scopeId}><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-hsn-error`)} class="form-field__error" data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(hsnError.value ?? (0, vue_exports.unref)(keys).errors.hsn ?? "")}</p></div><div class="form-field" data-v-a0816086${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-tsn`)} data-v-a0816086${_scopeId}>TSN (Feld 2.2)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-tsn`)} class="input input--code"${(0, server_renderer_exports.ssrRenderAttr)("value", tsn.value)} maxlength="3" autocapitalize="characters" autocomplete="off" enterkeyhint="go"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", tsnError.value || (0, vue_exports.unref)(keys).errors.tsn ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(id)}-tsn-error`)} data-v-a0816086${_scopeId}><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-tsn-error`)} class="form-field__error" data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tsnError.value ?? (0, vue_exports.unref)(keys).errors.tsn ?? "")}</p></div></div>`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverRoot_default), {
												open: helpOpen.value,
												"onUpdate:open": ($event) => helpOpen.value = $event
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverTrigger_default), {
															class: "link small sel__help",
															type: "button"
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) _push(`Wo finde ich HSN und TSN?`);
																else return [(0, vue_exports.createTextVNode)("Wo finde ich HSN und TSN?")];
															}),
															_: 1
														}, _parent, _scopeId));
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverPortal_default), null, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(PopoverContent_default), {
																	class: "popover popover--padded sel__doc",
																	side: "bottom",
																	align: "start",
																	"side-offset": 8,
																	"collision-padding": 16,
																	"aria-label": "Wo finde ich HSN und TSN?"
																}, {
																	default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																		if (_push) {
																			_push(`<div class="chip-row" role="group" aria-label="Dokument" data-v-a0816086${_scopeId}><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "neu")} data-v-a0816086${_scopeId}> Neue Zulassungsbescheinigung </button><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", doc.value === "alt")} data-v-a0816086${_scopeId}> Alter Fahrzeugschein </button></div>`);
																			_push((0, server_renderer_exports.ssrRenderComponent)(DocFacsimile_default, {
																				variant: doc.value,
																				width: 480,
																				title: doc.value === "neu" ? "Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2" : "Alter Fahrzeugschein mit den Feldern 2 und 3"
																			}, null, _parent, _scopeId));
																			_push(`<p class="small muted sel__doc-text" data-v-a0816086${_scopeId}> Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I. </p>`);
																		} else return [
																			(0, vue_exports.createVNode)("div", {
																				class: "chip-row",
																				role: "group",
																				"aria-label": "Dokument"
																			}, [(0, vue_exports.createVNode)("button", {
																				class: "chip",
																				type: "button",
																				"aria-pressed": doc.value === "neu",
																				onClick: ($event) => doc.value = "neu"
																			}, " Neue Zulassungsbescheinigung ", 8, ["aria-pressed", "onClick"]), (0, vue_exports.createVNode)("button", {
																				class: "chip",
																				type: "button",
																				"aria-pressed": doc.value === "alt",
																				onClick: ($event) => doc.value = "alt"
																			}, " Alter Fahrzeugschein ", 8, ["aria-pressed", "onClick"])]),
																			(0, vue_exports.createVNode)(DocFacsimile_default, {
																				variant: doc.value,
																				width: 480,
																				title: doc.value === "neu" ? "Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2" : "Alter Fahrzeugschein mit den Feldern 2 und 3"
																			}, null, 8, ["variant", "title"]),
																			(0, vue_exports.createVNode)("p", { class: "small muted sel__doc-text" }, " Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I. ")
																		];
																	}),
																	_: 1
																}, _parent, _scopeId));
																else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
																	class: "popover popover--padded sel__doc",
																	side: "bottom",
																	align: "start",
																	"side-offset": 8,
																	"collision-padding": 16,
																	"aria-label": "Wo finde ich HSN und TSN?"
																}, {
																	default: (0, vue_exports.withCtx)(() => [
																		(0, vue_exports.createVNode)("div", {
																			class: "chip-row",
																			role: "group",
																			"aria-label": "Dokument"
																		}, [(0, vue_exports.createVNode)("button", {
																			class: "chip",
																			type: "button",
																			"aria-pressed": doc.value === "neu",
																			onClick: ($event) => doc.value = "neu"
																		}, " Neue Zulassungsbescheinigung ", 8, ["aria-pressed", "onClick"]), (0, vue_exports.createVNode)("button", {
																			class: "chip",
																			type: "button",
																			"aria-pressed": doc.value === "alt",
																			onClick: ($event) => doc.value = "alt"
																		}, " Alter Fahrzeugschein ", 8, ["aria-pressed", "onClick"])]),
																		(0, vue_exports.createVNode)(DocFacsimile_default, {
																			variant: doc.value,
																			width: 480,
																			title: doc.value === "neu" ? "Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2" : "Alter Fahrzeugschein mit den Feldern 2 und 3"
																		}, null, 8, ["variant", "title"]),
																		(0, vue_exports.createVNode)("p", { class: "small muted sel__doc-text" }, " Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I. ")
																	]),
																	_: 1
																})];
															}),
															_: 1
														}, _parent, _scopeId));
													} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverTrigger_default), {
														class: "link small sel__help",
														type: "button"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Wo finde ich HSN und TSN?")]),
														_: 1
													}), (0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverPortal_default), null, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
															class: "popover popover--padded sel__doc",
															side: "bottom",
															align: "start",
															"side-offset": 8,
															"collision-padding": 16,
															"aria-label": "Wo finde ich HSN und TSN?"
														}, {
															default: (0, vue_exports.withCtx)(() => [
																(0, vue_exports.createVNode)("div", {
																	class: "chip-row",
																	role: "group",
																	"aria-label": "Dokument"
																}, [(0, vue_exports.createVNode)("button", {
																	class: "chip",
																	type: "button",
																	"aria-pressed": doc.value === "neu",
																	onClick: ($event) => doc.value = "neu"
																}, " Neue Zulassungsbescheinigung ", 8, ["aria-pressed", "onClick"]), (0, vue_exports.createVNode)("button", {
																	class: "chip",
																	type: "button",
																	"aria-pressed": doc.value === "alt",
																	onClick: ($event) => doc.value = "alt"
																}, " Alter Fahrzeugschein ", 8, ["aria-pressed", "onClick"])]),
																(0, vue_exports.createVNode)(DocFacsimile_default, {
																	variant: doc.value,
																	width: 480,
																	title: doc.value === "neu" ? "Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2" : "Alter Fahrzeugschein mit den Feldern 2 und 3"
																}, null, 8, ["variant", "title"]),
																(0, vue_exports.createVNode)("p", { class: "small muted sel__doc-text" }, " Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I. ")
															]),
															_: 1
														})]),
														_: 1
													})];
												}),
												_: 1
											}, _parent, _scopeId));
											if (notFound.value && lookup.value) _push(`<div class="notice sel__notice sel__notfound" role="status" data-v-a0816086${_scopeId}><div data-v-a0816086${_scopeId}><p data-v-a0816086${_scopeId}>Zu ${(0, server_renderer_exports.ssrInterpolate)(lookup.value.hsn)}/${(0, server_renderer_exports.ssrInterpolate)(lookup.value.tsn)} haben wir kein Fahrzeug gefunden.</p><ul class="sel__routes" data-v-a0816086${_scopeId}><li data-v-a0816086${_scopeId}><button class="link" type="button" data-v-a0816086${_scopeId}>Nochmal prüfen</button></li><li data-v-a0816086${_scopeId}><button class="link" type="button" data-v-a0816086${_scopeId}>Über Marke &amp; Modell wählen</button></li><li data-v-a0816086${_scopeId}><a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", reach.value.href)} data-v-a0816086${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(reach.value.label)}</a></li></ul></div></div>`);
											else _push(`<!---->`);
											_push(`<!--]-->`);
										}
									} else return [chooser.value && lookup.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "sel__chooser"
									}, [
										(0, vue_exports.createVNode)("p", { class: "h4" }, (0, vue_exports.toDisplayString)(chooser.value.rows.length) + " Fahrzeuge passen zu " + (0, vue_exports.toDisplayString)(lookup.value.hsn) + "/" + (0, vue_exports.toDisplayString)(lookup.value.tsn) + " – welches ist deins?", 1),
										chooser.value.indistinguishable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 0,
											class: "small muted"
										}, " Die Fahrzeuge unterscheiden sich in keinem Feld, das wir anzeigen können. Die VSN aus deiner Zulassungsbescheinigung hilft weiter. ")) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)("div", {
											class: "sel__candidates",
											role: "radiogroup",
											"aria-label": `Fahrzeuge zu ${lookup.value.hsn}/${lookup.value.tsn}`
										}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(chooser.value.rows, (row) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
												key: row.id,
												class: "check sel__candidate"
											}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
												"onUpdate:modelValue": ($event) => candidate.value = $event,
												type: "radio",
												name: `${(0, vue_exports.unref)(id)}-kandidat`,
												value: row.id
											}, null, 8, [
												"onUpdate:modelValue",
												"name",
												"value"
											]), [[vue_exports.vModelRadio, candidate.value]]), (0, vue_exports.createVNode)("span", { class: "sel__candidate-text" }, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(row.label), 1), (0, vue_exports.createVNode)("span", { class: "small num muted" }, (0, vue_exports.toDisplayString)(candidateFacts(row)), 1)])]);
										}), 128))], 8, ["aria-label"]),
										(0, vue_exports.createVNode)("div", { class: "sel__chooser-actions" }, [(0, vue_exports.createVNode)("button", {
											class: "btn btn--secondary",
											type: "button",
											disabled: candidate.value === null || pending.value,
											"aria-busy": pending.value ? "true" : void 0,
											onClick: chooseCandidate
										}, " Dieses Fahrzeug wählen ", 8, ["disabled", "aria-busy"]), (0, vue_exports.createVNode)("button", {
											class: "link",
											type: "button",
											onClick: otherNumbers
										}, "Andere Nummern eingeben")])
									])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
										scanFailed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 0,
											class: "notice sel__notice",
											role: "alert"
										}, (0, vue_exports.toDisplayString)(SCAN_FAILED))) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)("div", { class: "sel__keys" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
											(0, vue_exports.createVNode)("label", {
												class: "form-field__label",
												for: `${(0, vue_exports.unref)(id)}-hsn`
											}, "HSN (Feld 2.1)", 8, ["for"]),
											(0, vue_exports.createVNode)("input", {
												id: `${(0, vue_exports.unref)(id)}-hsn`,
												ref_key: "hsnField",
												ref: hsnField,
												class: "input input--code",
												value: hsn.value,
												inputmode: "numeric",
												maxlength: "4",
												autocomplete: "off",
												enterkeyhint: "next",
												"aria-invalid": hsnError.value || (0, vue_exports.unref)(keys).errors.hsn ? "true" : void 0,
												"aria-describedby": `${(0, vue_exports.unref)(id)}-hsn-error`,
												onInput: onHsn,
												onPaste: (0, vue_exports.withModifiers)(onHsnPaste, ["prevent"]),
												onBlur: validateHsn
											}, null, 40, [
												"id",
												"value",
												"aria-invalid",
												"aria-describedby"
											]),
											(0, vue_exports.createVNode)("p", {
												id: `${(0, vue_exports.unref)(id)}-hsn-error`,
												class: "form-field__error"
											}, (0, vue_exports.toDisplayString)(hsnError.value ?? (0, vue_exports.unref)(keys).errors.hsn ?? ""), 9, ["id"])
										]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
											(0, vue_exports.createVNode)("label", {
												class: "form-field__label",
												for: `${(0, vue_exports.unref)(id)}-tsn`
											}, "TSN (Feld 2.2)", 8, ["for"]),
											(0, vue_exports.createVNode)("input", {
												id: `${(0, vue_exports.unref)(id)}-tsn`,
												ref_key: "tsnField",
												ref: tsnField,
												class: "input input--code",
												value: tsn.value,
												maxlength: "3",
												autocapitalize: "characters",
												autocomplete: "off",
												enterkeyhint: "go",
												"aria-invalid": tsnError.value || (0, vue_exports.unref)(keys).errors.tsn ? "true" : void 0,
												"aria-describedby": `${(0, vue_exports.unref)(id)}-tsn-error`,
												onInput: onTsn,
												onPaste: (0, vue_exports.withModifiers)(onTsnPaste, ["prevent"]),
												onBlur: validateTsn
											}, null, 40, [
												"id",
												"value",
												"aria-invalid",
												"aria-describedby"
											]),
											(0, vue_exports.createVNode)("p", {
												id: `${(0, vue_exports.unref)(id)}-tsn-error`,
												class: "form-field__error"
											}, (0, vue_exports.toDisplayString)(tsnError.value ?? (0, vue_exports.unref)(keys).errors.tsn ?? ""), 9, ["id"])
										])]),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverRoot_default), {
											open: helpOpen.value,
											"onUpdate:open": ($event) => helpOpen.value = $event
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverTrigger_default), {
												class: "link small sel__help",
												type: "button"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Wo finde ich HSN und TSN?")]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverPortal_default), null, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
													class: "popover popover--padded sel__doc",
													side: "bottom",
													align: "start",
													"side-offset": 8,
													"collision-padding": 16,
													"aria-label": "Wo finde ich HSN und TSN?"
												}, {
													default: (0, vue_exports.withCtx)(() => [
														(0, vue_exports.createVNode)("div", {
															class: "chip-row",
															role: "group",
															"aria-label": "Dokument"
														}, [(0, vue_exports.createVNode)("button", {
															class: "chip",
															type: "button",
															"aria-pressed": doc.value === "neu",
															onClick: ($event) => doc.value = "neu"
														}, " Neue Zulassungsbescheinigung ", 8, ["aria-pressed", "onClick"]), (0, vue_exports.createVNode)("button", {
															class: "chip",
															type: "button",
															"aria-pressed": doc.value === "alt",
															onClick: ($event) => doc.value = "alt"
														}, " Alter Fahrzeugschein ", 8, ["aria-pressed", "onClick"])]),
														(0, vue_exports.createVNode)(DocFacsimile_default, {
															variant: doc.value,
															width: 480,
															title: doc.value === "neu" ? "Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2" : "Alter Fahrzeugschein mit den Feldern 2 und 3"
														}, null, 8, ["variant", "title"]),
														(0, vue_exports.createVNode)("p", { class: "small muted sel__doc-text" }, " Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I. ")
													]),
													_: 1
												})]),
												_: 1
											})]),
											_: 1
										}, 8, ["open", "onUpdate:open"]),
										notFound.value && lookup.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											key: 1,
											class: "notice sel__notice sel__notfound",
											role: "status"
										}, [(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("p", null, "Zu " + (0, vue_exports.toDisplayString)(lookup.value.hsn) + "/" + (0, vue_exports.toDisplayString)(lookup.value.tsn) + " haben wir kein Fahrzeug gefunden.", 1), (0, vue_exports.createVNode)("ul", { class: "sel__routes" }, [
											(0, vue_exports.createVNode)("li", null, [(0, vue_exports.createVNode)("button", {
												class: "link",
												type: "button",
												onClick: checkAgain
											}, "Nochmal prüfen")]),
											(0, vue_exports.createVNode)("li", null, [(0, vue_exports.createVNode)("button", {
												class: "link",
												type: "button",
												onClick: viaMake
											}, "Über Marke & Modell wählen")]),
											(0, vue_exports.createVNode)("li", null, [(0, vue_exports.createVNode)("a", {
												class: "link",
												href: reach.value.href
											}, (0, vue_exports.toDisplayString)(reach.value.label), 9, ["href"])])
										])])])) : (0, vue_exports.createCommentVNode)("", true)
									], 64))];
								}),
								_: 1
							}, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
								value: "scan",
								class: "tabs__content"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(DocumentScan_default, {
										onConfirm: onScan,
										onFailed: onScanFailed
									}, null, _parent, _scopeId));
									else return [(0, vue_exports.createVNode)(DocumentScan_default, {
										onConfirm: onScan,
										onFailed: onScanFailed
									})];
								}),
								_: 1
							}, _parent, _scopeId));
						} else return [
							(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsList_default), {
								class: "tabs__list",
								"aria-label": "Fahrzeug angeben"
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "marke",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Marke & Modell")]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "hsn",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("HSN/TSN")]),
										_: 1
									}),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsTrigger_default), {
										value: "scan",
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Fahrzeugschein scannen")]),
										_: 1
									})
								]),
								_: 1
							}),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsContent_default), {
								value: "marke",
								class: "tabs__content"
							}, {
								default: (0, vue_exports.withCtx)(() => [
									(0, vue_exports.createVNode)("div", { class: "sel__row sel__row--pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `${(0, vue_exports.unref)(id)}-marke`
									}, "Marke", 8, ["for"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxRoot_default), {
										modelValue: make.value,
										"onUpdate:modelValue": ($event) => make.value = $event,
										class: "sel__combo",
										"open-on-click": ""
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
												id: `${(0, vue_exports.unref)(id)}-marke`,
												class: "input",
												placeholder: "z. B. BMW",
												autocapitalize: "off",
												spellcheck: "false",
												"display-value": stringDisplay
											}, null, 8, ["id"])]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
											class: "popover sel__list",
											"aria-label": "Marken"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Keine Marke gefunden.")]),
													_: 1
												}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(props.selector.makes, (m) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
														key: m.make,
														value: m.make,
														"text-value": m.make,
														class: "menu__item sel__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [
															(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.make), 1),
															(0, vue_exports.createTextVNode)(),
															(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.models) + " Modelle", 1)
														]),
														_: 2
													}, 1032, ["value", "text-value"]);
												}), 128))]),
												_: 1
											})]),
											_: 1
										})]),
										_: 1
									}, 8, ["modelValue", "onUpdate:modelValue"])]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `${(0, vue_exports.unref)(id)}-modell`
									}, "Modell", 8, ["for"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxRoot_default), {
										modelValue: model.value,
										"onUpdate:modelValue": ($event) => model.value = $event,
										open: modelOpen.value,
										"onUpdate:open": ($event) => modelOpen.value = $event,
										class: "sel__combo",
										disabled: make.value === void 0 || modelsLoading.value,
										"open-on-click": ""
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
												id: `${(0, vue_exports.unref)(id)}-modell`,
												class: "input",
												placeholder: "z. B. 3er Coupé",
												autocapitalize: "off",
												spellcheck: "false",
												disabled: make.value === void 0 || modelsLoading.value,
												"display-value": stringDisplay
											}, null, 8, ["id", "disabled"])]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
											class: "popover sel__list",
											"aria-label": "Modelle"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Modell gefunden.")]),
													_: 1
												}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(models.value, (m) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
														key: m.model,
														value: m.model,
														"text-value": m.model,
														class: "menu__item sel__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [
															(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(m.model), 1),
															(0, vue_exports.createTextVNode)(),
															(0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)(m.variants) + " Varianten", 1)
														]),
														_: 2
													}, 1032, ["value", "text-value"]);
												}), 128))]),
												_: 1
											})]),
											_: 1
										})]),
										_: 1
									}, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"open",
										"onUpdate:open",
										"disabled"
									])])]),
									(0, vue_exports.createVNode)("div", { class: "sel__row" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `${(0, vue_exports.unref)(id)}-fahrzeug`
									}, "Fahrzeug", 8, ["for"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxRoot_default), {
										modelValue: variantId.value,
										"onUpdate:modelValue": ($event) => variantId.value = $event,
										class: "sel__combo",
										disabled: model.value === void 0 || variantsLoading.value,
										"open-on-click": ""
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxAnchor_default), { class: "sel__anchor" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxInput_default), {
												id: `${(0, vue_exports.unref)(id)}-fahrzeug`,
												class: "input",
												placeholder: "Variante, Baujahr, kW",
												autocapitalize: "off",
												spellcheck: "false",
												disabled: model.value === void 0 || variantsLoading.value,
												"display-value": variantDisplay
											}, null, 8, ["id", "disabled"])]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxContent_default), {
											class: "popover sel__list",
											"aria-label": "Fahrzeuge"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxViewport_default), { class: "sel__viewport" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(ComboboxEmpty_default), { class: "sel__empty small muted" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Kein Fahrzeug gefunden.")]),
													_: 1
												}), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(variants.value, (v) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(ComboboxItem_default), {
														key: v.id,
														value: v.id,
														"text-value": variantLabel(v),
														disabled: v.needsReview,
														"aria-disabled": v.needsReview ? "true" : void 0,
														class: "menu__item sel__item num"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(variantLabel(v)), 1)]),
														_: 2
													}, 1032, [
														"value",
														"text-value",
														"disabled",
														"aria-disabled"
													]);
												}), 128))]),
												_: 1
											})]),
											_: 1
										})]),
										_: 1
									}, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"disabled"
									])])]),
									treeFailed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 0,
										class: "small muted sel__tree-failed",
										role: "status"
									}, " Die Liste lässt sich gerade nicht laden. Versuch es bitte noch einmal oder nutze die HSN/TSN. ")) : (0, vue_exports.createCommentVNode)("", true)
								]),
								_: 1
							}),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsContent_default), {
								value: "hsn",
								class: "tabs__content"
							}, {
								default: (0, vue_exports.withCtx)(() => [chooser.value && lookup.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "sel__chooser"
								}, [
									(0, vue_exports.createVNode)("p", { class: "h4" }, (0, vue_exports.toDisplayString)(chooser.value.rows.length) + " Fahrzeuge passen zu " + (0, vue_exports.toDisplayString)(lookup.value.hsn) + "/" + (0, vue_exports.toDisplayString)(lookup.value.tsn) + " – welches ist deins?", 1),
									chooser.value.indistinguishable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 0,
										class: "small muted"
									}, " Die Fahrzeuge unterscheiden sich in keinem Feld, das wir anzeigen können. Die VSN aus deiner Zulassungsbescheinigung hilft weiter. ")) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("div", {
										class: "sel__candidates",
										role: "radiogroup",
										"aria-label": `Fahrzeuge zu ${lookup.value.hsn}/${lookup.value.tsn}`
									}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(chooser.value.rows, (row) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
											key: row.id,
											class: "check sel__candidate"
										}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => candidate.value = $event,
											type: "radio",
											name: `${(0, vue_exports.unref)(id)}-kandidat`,
											value: row.id
										}, null, 8, [
											"onUpdate:modelValue",
											"name",
											"value"
										]), [[vue_exports.vModelRadio, candidate.value]]), (0, vue_exports.createVNode)("span", { class: "sel__candidate-text" }, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(row.label), 1), (0, vue_exports.createVNode)("span", { class: "small num muted" }, (0, vue_exports.toDisplayString)(candidateFacts(row)), 1)])]);
									}), 128))], 8, ["aria-label"]),
									(0, vue_exports.createVNode)("div", { class: "sel__chooser-actions" }, [(0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary",
										type: "button",
										disabled: candidate.value === null || pending.value,
										"aria-busy": pending.value ? "true" : void 0,
										onClick: chooseCandidate
									}, " Dieses Fahrzeug wählen ", 8, ["disabled", "aria-busy"]), (0, vue_exports.createVNode)("button", {
										class: "link",
										type: "button",
										onClick: otherNumbers
									}, "Andere Nummern eingeben")])
								])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
									scanFailed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 0,
										class: "notice sel__notice",
										role: "alert"
									}, (0, vue_exports.toDisplayString)(SCAN_FAILED))) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("div", { class: "sel__keys" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `${(0, vue_exports.unref)(id)}-hsn`
										}, "HSN (Feld 2.1)", 8, ["for"]),
										(0, vue_exports.createVNode)("input", {
											id: `${(0, vue_exports.unref)(id)}-hsn`,
											ref_key: "hsnField",
											ref: hsnField,
											class: "input input--code",
											value: hsn.value,
											inputmode: "numeric",
											maxlength: "4",
											autocomplete: "off",
											enterkeyhint: "next",
											"aria-invalid": hsnError.value || (0, vue_exports.unref)(keys).errors.hsn ? "true" : void 0,
											"aria-describedby": `${(0, vue_exports.unref)(id)}-hsn-error`,
											onInput: onHsn,
											onPaste: (0, vue_exports.withModifiers)(onHsnPaste, ["prevent"]),
											onBlur: validateHsn
										}, null, 40, [
											"id",
											"value",
											"aria-invalid",
											"aria-describedby"
										]),
										(0, vue_exports.createVNode)("p", {
											id: `${(0, vue_exports.unref)(id)}-hsn-error`,
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(hsnError.value ?? (0, vue_exports.unref)(keys).errors.hsn ?? ""), 9, ["id"])
									]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `${(0, vue_exports.unref)(id)}-tsn`
										}, "TSN (Feld 2.2)", 8, ["for"]),
										(0, vue_exports.createVNode)("input", {
											id: `${(0, vue_exports.unref)(id)}-tsn`,
											ref_key: "tsnField",
											ref: tsnField,
											class: "input input--code",
											value: tsn.value,
											maxlength: "3",
											autocapitalize: "characters",
											autocomplete: "off",
											enterkeyhint: "go",
											"aria-invalid": tsnError.value || (0, vue_exports.unref)(keys).errors.tsn ? "true" : void 0,
											"aria-describedby": `${(0, vue_exports.unref)(id)}-tsn-error`,
											onInput: onTsn,
											onPaste: (0, vue_exports.withModifiers)(onTsnPaste, ["prevent"]),
											onBlur: validateTsn
										}, null, 40, [
											"id",
											"value",
											"aria-invalid",
											"aria-describedby"
										]),
										(0, vue_exports.createVNode)("p", {
											id: `${(0, vue_exports.unref)(id)}-tsn-error`,
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(tsnError.value ?? (0, vue_exports.unref)(keys).errors.tsn ?? ""), 9, ["id"])
									])]),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverRoot_default), {
										open: helpOpen.value,
										"onUpdate:open": ($event) => helpOpen.value = $event
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverTrigger_default), {
											class: "link small sel__help",
											type: "button"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Wo finde ich HSN und TSN?")]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverPortal_default), null, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(PopoverContent_default), {
												class: "popover popover--padded sel__doc",
												side: "bottom",
												align: "start",
												"side-offset": 8,
												"collision-padding": 16,
												"aria-label": "Wo finde ich HSN und TSN?"
											}, {
												default: (0, vue_exports.withCtx)(() => [
													(0, vue_exports.createVNode)("div", {
														class: "chip-row",
														role: "group",
														"aria-label": "Dokument"
													}, [(0, vue_exports.createVNode)("button", {
														class: "chip",
														type: "button",
														"aria-pressed": doc.value === "neu",
														onClick: ($event) => doc.value = "neu"
													}, " Neue Zulassungsbescheinigung ", 8, ["aria-pressed", "onClick"]), (0, vue_exports.createVNode)("button", {
														class: "chip",
														type: "button",
														"aria-pressed": doc.value === "alt",
														onClick: ($event) => doc.value = "alt"
													}, " Alter Fahrzeugschein ", 8, ["aria-pressed", "onClick"])]),
													(0, vue_exports.createVNode)(DocFacsimile_default, {
														variant: doc.value,
														width: 480,
														title: doc.value === "neu" ? "Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2" : "Alter Fahrzeugschein mit den Feldern 2 und 3"
													}, null, 8, ["variant", "title"]),
													(0, vue_exports.createVNode)("p", { class: "small muted sel__doc-text" }, " Die HSN steht in Feld 2.1, die TSN sind die ersten drei Zeichen von Feld 2.2 deiner Zulassungsbescheinigung Teil I. ")
												]),
												_: 1
											})]),
											_: 1
										})]),
										_: 1
									}, 8, ["open", "onUpdate:open"]),
									notFound.value && lookup.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 1,
										class: "notice sel__notice sel__notfound",
										role: "status"
									}, [(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("p", null, "Zu " + (0, vue_exports.toDisplayString)(lookup.value.hsn) + "/" + (0, vue_exports.toDisplayString)(lookup.value.tsn) + " haben wir kein Fahrzeug gefunden.", 1), (0, vue_exports.createVNode)("ul", { class: "sel__routes" }, [
										(0, vue_exports.createVNode)("li", null, [(0, vue_exports.createVNode)("button", {
											class: "link",
											type: "button",
											onClick: checkAgain
										}, "Nochmal prüfen")]),
										(0, vue_exports.createVNode)("li", null, [(0, vue_exports.createVNode)("button", {
											class: "link",
											type: "button",
											onClick: viaMake
										}, "Über Marke & Modell wählen")]),
										(0, vue_exports.createVNode)("li", null, [(0, vue_exports.createVNode)("a", {
											class: "link",
											href: reach.value.href
										}, (0, vue_exports.toDisplayString)(reach.value.label), 9, ["href"])])
									])])])) : (0, vue_exports.createCommentVNode)("", true)
								], 64))]),
								_: 1
							}),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsContent_default), {
								value: "scan",
								class: "tabs__content"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(DocumentScan_default, {
									onConfirm: onScan,
									onFailed: onScanFailed
								})]),
								_: 1
							})
						];
					}),
					_: 1
				}, _parent));
				if (chooser.value) _push(`<div class="sel__count" aria-hidden="true" data-v-a0816086></div>`);
				else if (zero.value && counted.value) {
					_push(`<div class="notice sel__zero" data-v-a0816086><div class="sel__zero-body" data-v-a0816086><p data-v-a0816086>Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.</p>`);
					if ((0, vue_exports.unref)(page).props.notifyByMail !== true) _push(`<p data-v-a0816086> Schreib uns gern eine E-Mail an <a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value?.email}`)} data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(contact.value?.email)}</a>. </p>`);
					else if (notify.state !== "sent") _push(`<!--[--><p data-v-a0816086>Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten dein Fahrzeug nennt.</p><div class="form-field" data-v-a0816086><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-email`)} data-v-a0816086>E-Mail-Adresse</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-email`)}${(0, server_renderer_exports.ssrRenderAttr)("value", notify.email)} class="input" type="email" autocomplete="email"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", notify.state === "error" ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(id)}-email-error`)} data-v-a0816086><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-email-error`)} class="form-field__error" data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(notify.error ?? "")}</p></div><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", notify.state === "sending" ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(notify.state === "sending") ? " disabled" : ""} data-v-a0816086> Bescheid geben </button><p class="micro quiet" data-v-a0816086>Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p><!--]-->`);
					else _push(`<p role="status" data-v-a0816086>Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.</p>`);
					_push(`</div></div>`);
				} else {
					_push(`<p class="small num muted sel__count" aria-live="polite" data-v-a0816086>`);
					if ((0, vue_exports.unref)(count).loading.value) _push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
						width: "60%",
						height: "var(--lh-small)"
					}, null, _parent));
					else if ((0, vue_exports.unref)(count).failed.value) _push(`<!--[-->Die Anzahl lässt sich gerade nicht laden.<!--]-->`);
					else if (counted.value && counted.value.count > 0) _push(`<!--[--><strong class="sel__n" data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(counted.value.count)}</strong> Felgen mit Gutachten für ${(0, server_renderer_exports.ssrInterpolate)(counted.value.vehicle?.label)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</p>`);
				}
				if (!chooser.value) _push(`<button class="btn btn--primary btn--lg btn--block sel__go" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(selection.value === null || zero.value || pending.value || notFound.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", pending.value ? "true" : void 0)} data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(buttonLabel.value)}</button>`);
				else _push(`<!---->`);
				_push(`</fieldset>`);
				if (garage.value.length) {
					_push(`<div class="sel__garage" data-v-a0816086><p class="label" data-v-a0816086>Zuletzt gewählt:</p><div class="chip-row" data-v-a0816086><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(garage.value, (g) => {
						_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(pending.value) ? " disabled" : ""} data-v-a0816086>${(0, server_renderer_exports.ssrInterpolate)(g.short)}</button>`);
					});
					_push(`<!--]--></div></div>`);
				} else _push(`<!---->`);
				_push(`</form>`);
			}
		};
	}
});
//#endregion
//#region resources/js/Components/Home/HeroSelector.vue
var _sfc_setup$8 = HeroSelector_vue_vue_type_script_setup_true_lang_default.setup;
HeroSelector_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/HeroSelector.vue");
	return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var HeroSelector_default = /*#__PURE__*/ _plugin_vue_export_helper_default(HeroSelector_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a0816086"]]);
//#endregion
//#region resources/js/Components/Home/HomeHero.vue?vue&type=script&setup=true&lang.ts
var SUBLINE = "Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen. Du gibst dein Auto an, wir prüfen den Rest.";
var CAPTION = "Abbildung zeigt das Design; Werte der gezeigten Ausführung.";
var SYMBOLIC = "Symbolbild – Werte einer Beispielkonfiguration";
var DEMO = "Demodaten – Beispielsortiment; Preise und Bestände sind Beispielwerte.";
var HomeHero_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "HomeHero",
	__ssrInlineRender: true,
	props: {
		hero: {},
		selector: {}
	},
	setup(__props) {
		/**
		* H2 — the hero of the desktop homepage: the question, the selector, and one real wheel.
		*
		* Left, the `h1`, the subline and the selector panel. Right, the stage: the product's own
		* photograph — the shadowless `bare` frame, standing on one CSS contact shadow in a pool of studio
		* light — with leaders only to what a front view shows (docs/phase0/ACCURACY.md D10, §4): the
		* Lochkreis, as a dashed circle drawn through the bolt-hole centres; the Mittenlochbohrung, which
		* sits behind the cap and says so; and the KBA number, at the stamp — only when the photographed
		* stamp is this configuration's number. Width, diameter and ET are in the spec line under the
		* picture, with the line saying the picture shows the design and the values are the configuration
		* shown. Every value is formatted on the server (`facts`); every position comes from the
		* photograph's measured anchors (`calloutSlots.ts`); nothing is typed here, nothing is measured.
		*
		* With no photograph of the product the stage draws the outline, prints the spec line, names no
		* product and points at nothing. The bundled stand-in photograph is retired.
		*
		* Motion (DIRECTION.md §5): once, on load, the wheel rolls in — 1,6 picture widths, from past the
		* right edge, turning counter-clockwise by exactly the distance over its radius, about its own
		* axle — and then the callouts and their leaders appear. The final frame is the default: without JavaScript, and under reduced
		* motion, the wheel stands, the leaders are drawn and the text is there from the first paint. No
		* cursor roll, and nothing turns while a leader shows.
		*
		* The stage never grows past the copy column: it is a size container whose height is the row's,
		* and the frame takes what the caption and the notes leave (the #h3 overlap at ≥ 1966 px is gone).
		*/
		const props = __props;
		const page = usePage();
		const vehicle = (0, vue_exports.computed)(() => page.props.vehicle);
		const product = (0, vue_exports.computed)(() => props.hero.product);
		const scene = (0, vue_exports.computed)(() => heroScene(product.value, DESKTOP_LAYOUT));
		const failed = (0, vue_exports.ref)(false);
		const photo = (0, vue_exports.computed)(() => failed.value ? null : scene.value.picture);
		const callouts = (0, vue_exports.computed)(() => photo.value === null ? [] : scene.value.callouts);
		const kba = (0, vue_exports.computed)(() => callouts.value.find((c) => c.key === "kba") ?? null);
		const linked = (0, vue_exports.computed)(() => product.value !== null && !product.value.symbolic && photo.value !== null);
		const title = (0, vue_exports.computed)(() => vehicle.value === null ? props.hero.title : `Felgen, die an deinen ${vehicle.value.short} dürfen.`);
		const subline = (0, vue_exports.computed)(() => props.hero.subline.trim() === "" ? SUBLINE : props.hero.subline);
		const alt = (0, vue_exports.computed)(() => product.value === null ? "" : `${product.value.brand} ${product.value.name} in ${product.value.finish}, Ansicht von vorn`);
		const perWheel = (0, vue_exports.computed)(() => product.value === null ? "" : euro(Math.round(product.value.fromPriceCents / 4)));
		const stageStyle = (0, vue_exports.computed)(() => ({
			...frameStyle(DESKTOP_LAYOUT),
			"--callout-delay": scene.value.roll === null ? "0ms" : "var(--d-roll)"
		}));
		const pictureStyle = (0, vue_exports.computed)(() => rollStyle(scene.value));
		const frame = (0, vue_exports.ref)(null);
		(0, vue_exports.onMounted)(() => {
			const img = frame.value?.querySelector("img") ?? null;
			if (img !== null && img.complete && img.getAttribute("src") !== null && img.naturalWidth === 0) failed.value = true;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h2",
				class: "hero band",
				"data-section": "H2",
				"aria-labelledby": "h2-title"
			}, _attrs))} data-v-cca2baef><div class="container hero__grid" data-v-cca2baef><div class="hero__copy" data-v-cca2baef><h1 id="h2-title" class="h1 hero__title" data-v-cca2baef>${(0, server_renderer_exports.ssrInterpolate)(title.value)}</h1><p class="body-l hero__subline" data-v-cca2baef>${(0, server_renderer_exports.ssrInterpolate)(subline.value)}</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(HeroSelector_default, {
				selector: __props.selector,
				class: "hero__panel"
			}, null, _parent));
			_push(`</div><div class="hero__stage" style="${(0, server_renderer_exports.ssrRenderStyle)(stageStyle.value)}" data-v-cca2baef>`);
			(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(linked.value ? "a" : "div"), {
				class: "hero__link",
				href: linked.value && product.value ? `/felgen/${product.value.slug}` : void 0
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="hero__frame-box" data-v-cca2baef${_scopeId}><div class="frame hero__frame" data-v-cca2baef${_scopeId}><div class="hero-studio" aria-hidden="true" data-v-cca2baef${_scopeId}></div>`);
						if (photo.value) {
							_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "hero__roll--rolling": scene.value.roll !== null }, "hero__roll"])}" style="${(0, server_renderer_exports.ssrRenderStyle)(pictureStyle.value)}" data-v-cca2baef${_scopeId}>`);
							if (scene.value.shadow) _push(`<span class="hero-contact" aria-hidden="true" data-v-cca2baef${_scopeId}></span>`);
							else _push(`<!---->`);
							_push(`<span class="hero__spin" data-v-cca2baef${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
								image: photo.value,
								alt: alt.value,
								sizes: (0, vue_exports.unref)(HERO_SIZES_DESKTOP),
								eager: ""
							}, null, _parent, _scopeId));
							_push(`</span></span>`);
						} else {
							_push(`<span class="hero__outline" aria-hidden="true" data-v-cca2baef${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, {
								bolts: product.value?.config.boltHoles ?? 5,
								size: "82%"
							}, null, _parent, _scopeId));
							_push(`</span>`);
						}
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(callouts.value, (c) => {
							_push((0, server_renderer_exports.ssrRenderComponent)(SpecCallout_default, {
								key: c.key,
								"data-callout": c.key,
								label: c.label,
								value: c.value,
								note: c.note,
								side: c.side,
								x: c.x,
								y: c.y,
								tx: c.tx,
								ty: c.ty,
								elbow: c.elbow,
								ring: c.ring,
								ratio: (0, vue_exports.unref)(DESKTOP_LAYOUT).ratio,
								weight: (0, vue_exports.unref)(DESKTOP_LAYOUT).weight
							}, null, _parent, _scopeId));
						});
						_push(`<!--]--></div></div>`);
						if (linked.value && product.value) {
							_push(`<span class="hero__caption" data-v-cca2baef${_scopeId}><span class="small hero__caption-name" translate="no" data-v-cca2baef${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(product.value.brand)} ${(0, server_renderer_exports.ssrInterpolate)(product.value.name)} · ${(0, server_renderer_exports.ssrInterpolate)(product.value.finish)}</span><span class="small num muted" data-v-cca2baef${_scopeId}>ab `);
							_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, {
								text: perWheel.value,
								whole: ""
							}, null, _parent, _scopeId));
							_push(` · pro Felge</span></span>`);
						} else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)("div", { class: "hero__frame-box" }, [(0, vue_exports.createVNode)("div", {
						ref_key: "frame",
						ref: frame,
						class: "frame hero__frame"
					}, [
						(0, vue_exports.createVNode)("div", {
							class: "hero-studio",
							"aria-hidden": "true"
						}),
						photo.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: ["hero__roll", { "hero__roll--rolling": scene.value.roll !== null }],
							style: pictureStyle.value,
							onErrorCapture: ($event) => failed.value = true
						}, [scene.value.shadow ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "hero-contact",
							"aria-hidden": "true"
						})) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("span", { class: "hero__spin" }, [(0, vue_exports.createVNode)(Picture_default, {
							image: photo.value,
							alt: alt.value,
							sizes: (0, vue_exports.unref)(HERO_SIZES_DESKTOP),
							eager: ""
						}, null, 8, [
							"image",
							"alt",
							"sizes"
						])])], 46, ["onErrorCapture"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 1,
							class: "hero__outline",
							"aria-hidden": "true"
						}, [(0, vue_exports.createVNode)(WheelOutline_default, {
							bolts: product.value?.config.boltHoles ?? 5,
							size: "82%"
						}, null, 8, ["bolts"])])),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(callouts.value, (c) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(SpecCallout_default, {
								key: c.key,
								"data-callout": c.key,
								label: c.label,
								value: c.value,
								note: c.note,
								side: c.side,
								x: c.x,
								y: c.y,
								tx: c.tx,
								ty: c.ty,
								elbow: c.elbow,
								ring: c.ring,
								ratio: (0, vue_exports.unref)(DESKTOP_LAYOUT).ratio,
								weight: (0, vue_exports.unref)(DESKTOP_LAYOUT).weight
							}, null, 8, [
								"data-callout",
								"label",
								"value",
								"note",
								"side",
								"x",
								"y",
								"tx",
								"ty",
								"elbow",
								"ring",
								"ratio",
								"weight"
							]);
						}), 128))
					], 512)]), linked.value && product.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
						key: 0,
						class: "hero__caption"
					}, [(0, vue_exports.createVNode)("span", {
						class: "small hero__caption-name",
						translate: "no"
					}, (0, vue_exports.toDisplayString)(product.value.brand) + " " + (0, vue_exports.toDisplayString)(product.value.name) + " · " + (0, vue_exports.toDisplayString)(product.value.finish), 1), (0, vue_exports.createVNode)("span", { class: "small num muted" }, [
						(0, vue_exports.createTextVNode)("ab "),
						(0, vue_exports.createVNode)(ValueText_default, {
							text: perWheel.value,
							whole: ""
						}, null, 8, ["text"]),
						(0, vue_exports.createTextVNode)(" · pro Felge")
					])])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}), _parent);
			if (product.value) {
				_push(`<div class="hero__notes" data-v-cca2baef><p class="small num hero__spec" translate="no" data-v-cca2baef>${(0, server_renderer_exports.ssrInterpolate)(product.value.facts.specLine)}`);
				if (kba.value) _push(`<span class="visually-hidden" data-v-cca2baef> · ${(0, server_renderer_exports.ssrInterpolate)(kba.value.label)} ${(0, server_renderer_exports.ssrInterpolate)(kba.value.value)}</span>`);
				else _push(`<!---->`);
				_push(`</p>`);
				if (photo.value) _push(`<span class="micro quiet hero__shown" data-v-cca2baef>${(0, server_renderer_exports.ssrInterpolate)(CAPTION)}</span>`);
				else _push(`<span class="micro quiet hero__symbolic" data-v-cca2baef>${(0, server_renderer_exports.ssrInterpolate)(SYMBOLIC)}</span>`);
				if ((0, vue_exports.unref)(page).props.demo) _push(`<span class="micro quiet demo-note" data-v-cca2baef>${(0, server_renderer_exports.ssrInterpolate)(DEMO)}</span>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/HomeHero.vue
var _sfc_setup$7 = HomeHero_vue_vue_type_script_setup_true_lang_default.setup;
HomeHero_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/HomeHero.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var HomeHero_default = /*#__PURE__*/ _plugin_vue_export_helper_default(HomeHero_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-cca2baef"]]);
//#endregion
//#region resources/js/Components/Home/KomplettradBand.vue?vue&type=script&setup=true&lang.ts
var WHEEL_SIZES = "(min-width: 1280px) 416px, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, 240px";
var WHEEL_ALT = "Illustration eines Komplettrads aus Felge und Reifen, Ansicht von vorn";
var KomplettradBand_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "KomplettradBand",
	__ssrInlineRender: true,
	props: {
		tyre: {},
		vehicle: {}
	},
	setup(__props) {
		/**
		* H7 · Kompletträder — the one dark band on the page, signature moment 3.
		*
		* What a Komplettrad is, in one sentence; the one regulated fact about a tyre, its EU label, from
		* the featured tyre's own record (only with a verified EPREL entry); and a complete wheel that
		* turns with the scroll.
		*
		* The wheel is an illustration, and the page says so: the parametric rim with a parametric tyre,
		* rendered offline by scripts/3d/render-komplettrad.mjs — generated, no brand, no car, no brake,
		* no lettering (docs/phase0/ACCURACY.md §3.1). It is never a photograph of somebody's wheel on a
		* car, and it claims no size: the label beside it is the featured tyre's, not the picture's. No 3D
		* mounts here (nothing ever did: the viewer's `replacePoster` was never switched on); the picture
		* turns 0 → −720° (two full turns) by a CSS `view()` timeline where the browser has one and stands still where it
		* has none — no scroll listener. Under reduced motion nothing turns. No lifestyle photograph beside
		* it (spec H7 "Never"), and no scrim: a scrim would be a second gradient.
		*/
		const props = __props;
		const TYRE_CLASSES = [
			"A",
			"B",
			"C",
			"D",
			"E"
		];
		function isTyreClass(value) {
			return TYRE_CLASSES.includes(value);
		}
		const label = (0, vue_exports.computed)(() => {
			const tyre = props.tyre;
			if (tyre === null || !isTyreClass(tyre.fuel) || !isTyreClass(tyre.wet)) return null;
			return {
				title: tyre.title,
				fuel: tyre.fuel,
				wet: tyre.wet,
				noiseDb: tyre.noiseDb,
				noiseClass: tyre.noiseClass,
				eprelId: tyre.eprelId
			};
		});
		const href = (0, vue_exports.computed)(() => props.vehicle === null ? "/felgen-suchen?ziel=komplettraeder" : "/felgen");
		const wheelFailed = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h7",
				class: "komplett dark",
				"data-section": "H7",
				"aria-labelledby": "h7-heading"
			}, _attrs))} data-v-995c1791><div class="container grid komplett__grid" data-v-995c1791><div class="komplett__text" data-v-995c1791><h2 id="h7-heading" class="h2" data-v-995c1791>Kompletträder – montiert und gewuchtet.</h2><p class="body-l komplett__lead" data-v-995c1791>Felge und Reifen kommen fertig montiert und gewuchtet bei dir an.</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: href.value,
				class: "btn btn--light komplett__button"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Kompletträder für mein Fahrzeug`);
					else return [(0, vue_exports.createTextVNode)("Kompletträder für mein Fahrzeug")];
				}),
				_: 1
			}, _parent));
			_push(`</div><figure class="komplett__stage" data-v-995c1791>`);
			if (!wheelFailed.value) {
				_push(`<div class="komplett__wheel" data-v-995c1791><span class="komplett__turn" data-v-995c1791>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
					image: (0, vue_exports.unref)(komplettrad_illustration_default),
					alt: WHEEL_ALT,
					sizes: WHEEL_SIZES
				}, null, _parent));
				_push(`</span></div>`);
			} else {
				_push(`<div class="komplett__fallback" aria-hidden="true" data-v-995c1791>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, { size: "60%" }, null, _parent));
				_push(`</div>`);
			}
			_push(`<figcaption class="micro quiet komplett__caption" data-v-995c1791>Illustration</figcaption></figure><div class="komplett__label" data-v-995c1791>`);
			if (label.value) _push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, label.value, null, _parent));
			else _push(`<!---->`);
			_push(`</div></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/KomplettradBand.vue
var _sfc_setup$6 = KomplettradBand_vue_vue_type_script_setup_true_lang_default.setup;
KomplettradBand_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/KomplettradBand.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var KomplettradBand_default = /*#__PURE__*/ _plugin_vue_export_helper_default(KomplettradBand_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-995c1791"]]);
//#endregion
//#region resources/js/Components/Home/PartnersSection.vue?vue&type=script&setup=true&lang.ts
var LON_MIN = 5.5;
var LAT_MAX = 55.3;
var VB_W = 600;
var VB_H = 800;
var PartnersSection_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PartnersSection",
	__ssrInlineRender: true,
	props: { demo: { type: Boolean } },
	setup(__props) {
		/**
		* H9 · Montage in deiner Nähe (F10, behind the `partners` flag).
		*
		* A postcode field and a schematic map of Germany, drawn as one hairline — no tile server, no
		* third-party map, no request leaves the page. The partner search itself has no backend yet: the
		* field checks the postcode's shape, and a well-formed postcode meets the honest empty state
		* rather than an invented list. When the seeded data is demo data, the badge says so.
		*
		* Projection for the map: a fixed linear mapping of longitude 5.5–15.5° E to x 0–600 and latitude
		* 55.3–47.0° N to y 0–800, which is close enough to a plate carrée for a schematic outline.
		*/
		const shared = useShared();
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? "").replace(/\s/g, "")}`);
		const uid = (0, vue_exports.useId)();
		const plz = (0, vue_exports.ref)("");
		const error = (0, vue_exports.ref)(null);
		const searched = (0, vue_exports.ref)(null);
		const empty = (0, vue_exports.computed)(() => plz.value.trim() === "");
		const BORDER = [
			[9.43, 54.79],
			[10, 54.5],
			[10.7, 54],
			[11.1, 54.1],
			[11.5, 53.95],
			[12.3, 54.3],
			[13.1, 54.55],
			[13.4, 54.65],
			[13.8, 54.2],
			[14.2, 53.9],
			[14.35, 53.3],
			[14.15, 52.85],
			[14.6, 52.6],
			[14.7, 52.1],
			[14.75, 51.6],
			[15, 51.15],
			[14.8, 50.87],
			[14.3, 51.05],
			[13.8, 50.7],
			[13, 50.45],
			[12.35, 50.2],
			[12.5, 49.9],
			[12.7, 49.55],
			[13.4, 49],
			[13.75, 48.55],
			[13.3, 48.3],
			[12.9, 47.95],
			[13, 47.6],
			[12.5, 47.65],
			[12, 47.6],
			[11.4, 47.5],
			[10.9, 47.4],
			[10.4, 47.3],
			[10.1, 47.45],
			[9.75, 47.55],
			[9.3, 47.65],
			[8.8, 47.7],
			[8.4, 47.6],
			[7.9, 47.55],
			[7.6, 47.6],
			[7.6, 48],
			[7.8, 48.6],
			[8.2, 48.95],
			[7.9, 49.05],
			[7.2, 49.1],
			[6.8, 49.2],
			[6.4, 49.45],
			[6.35, 49.85],
			[6.15, 50.2],
			[6, 50.5],
			[5.95, 50.8],
			[6, 51],
			[6.2, 51.4],
			[6.1, 51.75],
			[5.95, 51.85],
			[6.4, 52],
			[6.7, 52.1],
			[7.05, 52.35],
			[6.7, 52.55],
			[7.05, 52.8],
			[7.2, 53.25],
			[7, 53.5],
			[7.3, 53.7],
			[7.9, 53.75],
			[8.5, 53.55],
			[8.9, 53.85],
			[8.85, 54.3],
			[8.6, 54.55],
			[8.3, 54.9],
			[8.65, 55.05],
			[9, 54.85]
		];
		function project([lon, lat]) {
			const x = (lon - LON_MIN) / 10 * VB_W;
			const y = (LAT_MAX - lat) / 8.299999999999997 * VB_H;
			return `${x.toFixed(1)} ${y.toFixed(1)}`;
		}
		const border = `M ${BORDER.map(project).join(" L ")} Z`;
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h9",
				class: "partners",
				"data-section": "H9",
				"aria-labelledby": "h9-heading"
			}, _attrs))} data-v-edf4562c><div class="container grid partners__grid" data-v-edf4562c><div class="partners__main" data-v-edf4562c><div class="partners__title" data-v-edf4562c><h2 id="h9-heading" class="h2" data-v-edf4562c>Montage in deiner Nähe</h2>`);
			if (__props.demo) _push(`<span class="badge" data-v-edf4562c>Beispieldaten</span>`);
			else _push(`<!---->`);
			_push(`</div><form class="partners__form" novalidate data-v-edf4562c><div class="partners__row" data-v-edf4562c><div class="form-field partners__field" data-v-edf4562c><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(uid)}-plz`)} data-v-edf4562c>Postleitzahl</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-plz`)}${(0, server_renderer_exports.ssrRenderAttr)("value", plz.value)} class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", error.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(uid)}-plz-error`)} data-v-edf4562c></div><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", empty.value ? "true" : void 0)} data-v-edf4562c>${(0, server_renderer_exports.ssrInterpolate)(empty.value ? "Postleitzahl eingeben" : "Partner finden")}</button></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(uid)}-plz-error`)} class="form-field__error" data-v-edf4562c>${(0, server_renderer_exports.ssrInterpolate)(error.value ?? "")}</p></form><div class="partners__result" data-v-edf4562c>`);
			if (searched.value === null) _push(`<p class="body muted" data-v-edf4562c>Gib deine Postleitzahl ein – wir zeigen dir die drei nächsten Montagepartner.</p>`);
			else {
				_push(`<div class="empty partners__empty" role="status" data-v-edf4562c><p class="empty__title" data-v-edf4562c>Noch keine Partner in deiner Nähe.</p>`);
				if (contact.value.phone) _push(`<p class="empty__text" data-v-edf4562c> Ruf uns an, wir finden einen Weg: <a${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} class="num" data-v-edf4562c>${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a></p>`);
				else _push(`<p class="empty__text" data-v-edf4562c> Schreib uns, wir finden einen Weg: <a${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value.email}`)} data-v-edf4562c>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a></p>`);
				_push(`</div>`);
			}
			_push(`</div></div><div class="partners__map" data-v-edf4562c><svg class="de-map"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${VB_W} ${VB_H}`)} role="img" aria-label="Schematische Karte von Deutschland" focusable="false" data-v-edf4562c><path class="de-map__border"${(0, server_renderer_exports.ssrRenderAttr)("d", border)} data-v-edf4562c></path></svg></div></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/PartnersSection.vue
var _sfc_setup$5 = PartnersSection_vue_vue_type_script_setup_true_lang_default.setup;
PartnersSection_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/PartnersSection.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var PartnersSection_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PartnersSection_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-edf4562c"]]);
//#endregion
//#region resources/js/Components/Home/PopularWheels.vue?vue&type=script&setup=true&lang.ts
var SKELETONS = 8;
var PopularWheels_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PopularWheels",
	__ssrInlineRender: true,
	props: {
		popular: {},
		recentlyViewed: {},
		vehicle: {}
	},
	setup(__props) {
		/**
		* H5 · Felgen mit den meisten Freigaben, and H5b · Zuletzt angesehen.
		*
		* Eight real wheels from the catalogue in one of three real orders; with a vehicle chosen the
		* heading names the car, every tile carries its verdict, and the button carries the count. The
		* tabs are the server's: they render whenever it sends them, with a vehicle or without (*Meiste
		* Freigaben · Neu · Bis 200 €* in both states); an empty list renders the row alone. Nothing says
		* "beliebt": there is no sales or view data behind such a claim (ACCURACY.md D7).
		* Changing a tab is a partial reload of `popular` only: the page keeps its scroll position and its
		* state, the grid shows skeletons while the request runs, and a failed request says so above the
		* last tiles that loaded rather than in place of them.
		*
		* Never a rating, never a "Details" button, never a price without its legal line — the tile
		* itself guarantees that (docs/phase0/ADDENDUM.md §D2).
		*/
		const props = __props;
		const active = (0, vue_exports.ref)(props.popular.active);
		const loading = (0, vue_exports.ref)(false);
		const failed = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(() => props.popular.active, (value) => {
			active.value = value;
		});
		const title = (0, vue_exports.computed)(() => {
			if (props.popular.title !== null) return props.popular.title;
			return props.vehicle === null ? "Felgen mit den meisten Freigaben" : `Passend für deinen ${props.vehicle.short}`;
		});
		const buttonLabel = (0, vue_exports.computed)(() => {
			if (props.vehicle === null) return "Alle Felgen ansehen";
			const total = props.popular.total;
			if (total === null) return "Passende Felgen anzeigen";
			return total === 1 ? "1 passende Felge anzeigen" : `${decimal(total, 0)} passende Felgen anzeigen`;
		});
		function load(key) {
			let succeeded = false;
			let cancelled = false;
			router.get("/", { beliebt: key }, {
				only: ["popular"],
				preserveScroll: true,
				preserveState: true,
				onStart: () => {
					loading.value = true;
					failed.value = false;
				},
				onSuccess: () => {
					succeeded = true;
				},
				onCancel: () => {
					cancelled = true;
				},
				onFinish: () => {
					loading.value = false;
					if (!cancelled) failed.value = !succeeded;
				}
			});
		}
		function select(value) {
			const key = String(value);
			active.value = key;
			load(key);
		}
		function keyOf(card) {
			return `${card.modelId}-${card.finishId}`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h5",
				class: "popular",
				"data-section": "H5",
				"aria-labelledby": "h5-heading"
			}, _attrs))} data-v-c42f08b7><div class="container" data-v-c42f08b7><h2 id="h5-heading" class="h2 popular__title" data-v-c42f08b7>${(0, server_renderer_exports.ssrInterpolate)(title.value)}</h2>`);
			if (__props.popular.tabs.length > 0) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsRoot_default), {
				"model-value": active.value,
				class: "popular__tabs",
				"onUpdate:modelValue": select
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsList_default), {
							class: "tabs__list",
							"aria-label": "Auswahl der Felgen"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.popular.tabs, (tab) => {
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsTrigger_default), {
											key: tab.key,
											value: tab.key,
											class: "tabs__trigger"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(tab.label)}`);
												else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(tab.label), 1)];
											}),
											_: 2
										}, _parent, _scopeId));
									});
									_push(`<!--]-->`);
								} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.popular.tabs, (tab) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(TabsTrigger_default), {
										key: tab.key,
										value: tab.key,
										class: "tabs__trigger"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(tab.label), 1)]),
										_: 2
									}, 1032, ["value"]);
								}), 128))];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(TabsContent_default), {
							value: active.value,
							class: "tabs__content"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									if (failed.value) _push(`<div class="notice notice--bad popular__notice" role="alert" data-v-c42f08b7${_scopeId}><p class="popular__notice-text" data-v-c42f08b7${_scopeId}>Die Felgen lassen sich gerade nicht laden.</p><button class="btn btn--secondary btn--sm" type="button" data-v-c42f08b7${_scopeId}>Erneut versuchen</button></div>`);
									else _push(`<!---->`);
									if (loading.value) {
										_push(`<div class="tile-grid popular__grid" aria-busy="true" data-v-c42f08b7${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(SKELETONS, (n) => {
											_push((0, server_renderer_exports.ssrRenderComponent)(ProductTileSkeleton_default, { key: n }, null, _parent, _scopeId));
										});
										_push(`<!--]--></div>`);
									} else if (__props.popular.cards.length > 0) {
										_push(`<div class="tile-grid popular__grid" data-v-c42f08b7${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(__props.popular.cards, (card, i) => {
											_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
												key: keyOf(card),
												card,
												vehicle: __props.vehicle,
												eager: i < 4,
												compare: ""
											}, null, _parent, _scopeId));
										});
										_push(`<!--]--></div>`);
									} else _push(`<div class="empty" data-v-c42f08b7${_scopeId}><p class="empty__title" data-v-c42f08b7${_scopeId}>In dieser Auswahl ist gerade nichts.</p><p class="empty__text" data-v-c42f08b7${_scopeId}>Schau unter „Meiste Freigaben“ oder „Neu“ – oder sieh dir alle Felgen an.</p></div>`);
								} else return [failed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "notice notice--bad popular__notice",
									role: "alert"
								}, [(0, vue_exports.createVNode)("p", { class: "popular__notice-text" }, "Die Felgen lassen sich gerade nicht laden."), (0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary btn--sm",
									type: "button",
									onClick: ($event) => load(active.value)
								}, "Erneut versuchen", 8, ["onClick"])])) : (0, vue_exports.createCommentVNode)("", true), loading.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "tile-grid popular__grid",
									"aria-busy": "true"
								}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(SKELETONS, (n) => {
									return (0, vue_exports.createVNode)(ProductTileSkeleton_default, { key: n });
								}), 64))])) : __props.popular.cards.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 2,
									class: "tile-grid popular__grid"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.popular.cards, (card, i) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ProductTile_default, {
										key: keyOf(card),
										card,
										vehicle: __props.vehicle,
										eager: i < 4,
										compare: ""
									}, null, 8, [
										"card",
										"vehicle",
										"eager"
									]);
								}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 3,
									class: "empty"
								}, [(0, vue_exports.createVNode)("p", { class: "empty__title" }, "In dieser Auswahl ist gerade nichts."), (0, vue_exports.createVNode)("p", { class: "empty__text" }, "Schau unter „Meiste Freigaben“ oder „Neu“ – oder sieh dir alle Felgen an.")]))];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(TabsList_default), {
						class: "tabs__list",
						"aria-label": "Auswahl der Felgen"
					}, {
						default: (0, vue_exports.withCtx)(() => [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.popular.tabs, (tab) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(TabsTrigger_default), {
								key: tab.key,
								value: tab.key,
								class: "tabs__trigger"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(tab.label), 1)]),
								_: 2
							}, 1032, ["value"]);
						}), 128))]),
						_: 1
					}), (0, vue_exports.createVNode)((0, vue_exports.unref)(TabsContent_default), {
						value: active.value,
						class: "tabs__content"
					}, {
						default: (0, vue_exports.withCtx)(() => [failed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "notice notice--bad popular__notice",
							role: "alert"
						}, [(0, vue_exports.createVNode)("p", { class: "popular__notice-text" }, "Die Felgen lassen sich gerade nicht laden."), (0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary btn--sm",
							type: "button",
							onClick: ($event) => load(active.value)
						}, "Erneut versuchen", 8, ["onClick"])])) : (0, vue_exports.createCommentVNode)("", true), loading.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "tile-grid popular__grid",
							"aria-busy": "true"
						}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(SKELETONS, (n) => {
							return (0, vue_exports.createVNode)(ProductTileSkeleton_default, { key: n });
						}), 64))])) : __props.popular.cards.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 2,
							class: "tile-grid popular__grid"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.popular.cards, (card, i) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ProductTile_default, {
								key: keyOf(card),
								card,
								vehicle: __props.vehicle,
								eager: i < 4,
								compare: ""
							}, null, 8, [
								"card",
								"vehicle",
								"eager"
							]);
						}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 3,
							class: "empty"
						}, [(0, vue_exports.createVNode)("p", { class: "empty__title" }, "In dieser Auswahl ist gerade nichts."), (0, vue_exports.createVNode)("p", { class: "empty__text" }, "Schau unter „Meiste Freigaben“ oder „Neu“ – oder sieh dir alle Felgen an.")]))]),
						_: 1
					}, 8, ["value"])];
				}),
				_: 1
			}, _parent));
			else {
				_push(`<!--[-->`);
				if (__props.popular.cards.length > 0) {
					_push(`<div class="tile-grid popular__grid popular__grid--vehicle" data-v-c42f08b7><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.popular.cards, (card, i) => {
						_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
							key: keyOf(card),
							card,
							vehicle: __props.vehicle,
							eager: i < 4,
							compare: ""
						}, null, _parent));
					});
					_push(`<!--]--></div>`);
				} else _push(`<div class="empty" data-v-c42f08b7><p class="empty__title" data-v-c42f08b7>In dieser Auswahl ist gerade nichts.</p><p class="empty__text" data-v-c42f08b7>Schau unter „Meiste Freigaben“ oder „Neu“ – oder sieh dir alle Felgen an.</p></div>`);
				_push(`<!--]-->`);
			}
			_push(`<div class="popular__more" data-v-c42f08b7>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen",
				class: "btn btn--secondary",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(buttonLabel.value)}`);
					else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(buttonLabel.value), 1)];
				}),
				_: 1
			}, _parent));
			_push(`</div>`);
			if (__props.recentlyViewed.length > 0) {
				_push(`<section id="h5b" class="recent" data-section="H5b" aria-labelledby="h5b-heading" data-v-c42f08b7><h2 id="h5b-heading" class="h2" data-v-c42f08b7>Zuletzt angesehen</h2><div class="tile-grid recent__grid" data-v-c42f08b7><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.recentlyViewed, (card) => {
					_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
						key: keyOf(card),
						card,
						vehicle: __props.vehicle
					}, null, _parent));
				});
				_push(`<!--]--></div></section>`);
			} else _push(`<!---->`);
			_push(`</div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/PopularWheels.vue
var _sfc_setup$4 = PopularWheels_vue_vue_type_script_setup_true_lang_default.setup;
PopularWheels_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/PopularWheels.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var PopularWheels_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PopularWheels_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c42f08b7"]]);
//#endregion
//#region resources/js/Components/Home/PromiseRow.vue?vue&type=script&setup=true&lang.ts
var PromiseRow_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PromiseRow",
	__ssrInlineRender: true,
	props: { promises: {} },
	setup(__props) {
		/**
		* H3 · The promise row: four facts the shop stands behind, read in one glance. One hairline above,
		* no boxes, no cards, no numbers — the wording comes from the page's content block, so the client
		* confirms each line without a deployment (docs/design/sections/home.md §H3).
		*/
		function iconOf(name) {
			return isIconName(name) ? name : "check";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h3",
				class: "promises",
				"data-section": "H3",
				"aria-labelledby": "h3-heading"
			}, _attrs))} data-v-77549f62><h2 id="h3-heading" class="visually-hidden" data-v-77549f62>Was wir zusagen</h2><div class="container" data-v-77549f62><ul class="grid promises__list" data-v-77549f62><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.promises, (promise) => {
				_push(`<li class="promise" data-v-77549f62><span class="promise__icon" data-v-77549f62>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: iconOf(promise.icon),
					size: 20
				}, null, _parent));
				_push(`</span><div class="promise__text" data-v-77549f62><p class="body promise__title" data-v-77549f62>${(0, server_renderer_exports.ssrInterpolate)(promise.title)}</p><p class="small muted" data-v-77549f62>${(0, server_renderer_exports.ssrInterpolate)(promise.text)}</p></div></li>`);
			});
			_push(`<!--]--></ul></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/PromiseRow.vue
var _sfc_setup$3 = PromiseRow_vue_vue_type_script_setup_true_lang_default.setup;
PromiseRow_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/PromiseRow.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var PromiseRow_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PromiseRow_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-77549f62"]]);
//#endregion
//#region resources/js/Components/Home/RimCodeSection.vue?vue&type=script&setup=true&lang.ts
var RimCodeSection_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RimCodeSection",
	__ssrInlineRender: true,
	props: { product: {} },
	setup(__props) {
		/**
		* H8 · *Was die Zahlen auf einer Felge bedeuten* — the desktop document's section (ACCURACY.md
		* §5, D9). It takes the calculator's place on the homepage: the heading and the lead here, the
		* values, the photograph, the cross-section, the sentence and the teaser to `/felgenrechner` in
		* `RimCode`. The page renders it only when the hero product has facts (`rimFactsOf`), and its
		* rhythm class arrives by attribute fallthrough like every other section's.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h8",
				class: "rim-code",
				"data-section": "H8",
				"aria-labelledby": "h8-heading"
			}, _attrs))} data-v-c3f60a99><div class="container" data-v-c3f60a99><div class="grid" data-v-c3f60a99><div class="rim-code__head" data-v-c3f60a99><h2 id="h8-heading" class="h2" data-v-c3f60a99>Was die Zahlen auf einer Felge bedeuten</h2><p class="body muted rim-code__lead" data-v-c3f60a99> Wähle einen Wert – das Foto oder die Schnittzeichnung zeigt, wo er an der Felge liegt, und ein Satz erklärt ihn. </p></div></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RimCode_default, {
				class: "rim-code__body",
				product: __props.product,
				layout: "desktop"
			}, null, _parent));
			_push(`</div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/RimCodeSection.vue
var _sfc_setup$2 = RimCodeSection_vue_vue_type_script_setup_true_lang_default.setup;
RimCodeSection_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/RimCodeSection.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var RimCodeSection_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RimCodeSection_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c3f60a99"]]);
//#endregion
//#region resources/js/Components/Home/ServiceFaq.vue?vue&type=script&setup=true&lang.ts
var REFRESH_MS = 6e4;
var ServiceFaq_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ServiceFaq",
	__ssrInlineRender: true,
	props: { faq: {} },
	setup(__props) {
		/**
		* H11 · Service und FAQ.
		*
		* A person to ask, with an honest "now" or "when": the status line is computed on the server in
		* Europe/Berlin and re-fetched once a minute after mount, so the text swaps and nothing else does.
		* The contact values come from the shared `contact` prop only — never typed here. The five
		* questions are the same rows the FAQ page shows, answered in place.
		*/
		const props = __props;
		const shared = useShared();
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const status = (0, vue_exports.computed)(() => shared.value.serviceStatus);
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? "").replace(/\s/g, "")}`);
		const waHref = (0, vue_exports.computed)(() => `https://wa.me/${(contact.value.whatsapp ?? "").replace(/[^\d]/g, "")}`);
		const mailHref = (0, vue_exports.computed)(() => `mailto:${contact.value.email}`);
		const items = (0, vue_exports.computed)(() => props.faq.map((entry) => ({
			id: entry.id,
			title: entry.question,
			body: entry.answer
		})));
		let timer;
		(0, vue_exports.onMounted)(() => {
			timer = window.setInterval(() => {
				router.reload({
					only: ["serviceStatus"],
					showProgress: false,
					async: true
				});
			}, REFRESH_MS);
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			if (timer !== void 0) window.clearInterval(timer);
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				id: "h11",
				class: "service",
				"data-section": "H11",
				"aria-labelledby": "h11-heading"
			}, _attrs))} data-v-f800e849><div class="container grid service__grid" data-v-f800e849><div class="service__contact" data-v-f800e849><h2 id="h11-heading" class="h2 service__title" data-v-f800e849>Fragen zur Passform? Wir schauen mit dir drauf.</h2><p class="${(0, server_renderer_exports.ssrRenderClass)([status.value.open ? "status--open" : "status--closed", "small status"])}" data-v-f800e849>${(0, server_renderer_exports.ssrInterpolate)(status.value.label)}</p><ul class="contacts" data-v-f800e849>`);
			if (contact.value.phone) {
				_push(`<li class="contacts__row" data-v-f800e849>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} class="num contacts__link" data-v-f800e849>${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a></li>`);
			} else _push(`<!---->`);
			if (contact.value.whatsapp) _push(`<li class="contacts__row" data-v-f800e849><span class="contacts__slot" aria-hidden="true" data-v-f800e849></span><a${(0, server_renderer_exports.ssrRenderAttr)("href", waHref.value)} class="num contacts__link" rel="noopener" target="_blank" data-v-f800e849>WhatsApp: ${(0, server_renderer_exports.ssrInterpolate)(contact.value.whatsapp)}</a></li>`);
			else _push(`<!---->`);
			_push(`<li class="contacts__row" data-v-f800e849>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20
			}, null, _parent));
			_push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", mailHref.value)} class="contacts__link" data-v-f800e849>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a></li><li class="contacts__row" data-v-f800e849>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "clock",
				size: 20
			}, null, _parent));
			_push(`<span class="num" data-v-f800e849>${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</span></li></ul></div><div class="service__faq" data-v-f800e849>`);
			if (items.value.length > 0) _push((0, server_renderer_exports.ssrRenderComponent)(Accordion_default, {
				items: items.value,
				level: 3
			}, null, _parent));
			else _push(`<p class="body muted" data-v-f800e849>Die häufigsten Fragen beantworten wir gerade neu.</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/faq",
				class: "link service__all",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Alle Fragen ansehen`);
					else return [(0, vue_exports.createTextVNode)("Alle Fragen ansehen")];
				}),
				_: 1
			}, _parent));
			_push(`</div></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/ServiceFaq.vue
var _sfc_setup$1 = ServiceFaq_vue_vue_type_script_setup_true_lang_default.setup;
ServiceFaq_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/ServiceFaq.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var ServiceFaq_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ServiceFaq_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f800e849"]]);
//#endregion
//#region resources/js/Pages/Startseite/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		hero: {},
		selector: {},
		fitmentCount: {},
		promises: {},
		popular: {},
		recentlyViewed: {},
		sizes: {},
		brands: {},
		komplettrad: {},
		calculator: {},
		partners: {},
		guides: {},
		faq: {},
		demo: { type: Boolean }
	},
	setup(__props) {
		/**
		* The homepage, desktop document (docs/design/sections/home.md).
		*
		* Every section either moves the visitor to a vehicle, shows evidence that the answer is real, or
		* gets out of the way. The hero (H2) and the promise row (H3) are fixed; from H4 on, the background
		* and the section padding are assigned by position over the sections actually rendered — band and
		* surface alternate over the light sections, `.section` and `.section--tight` over all of them —
		* so two neighbours never share a tone or a padding, whichever sections the data switches off.
		*
		* Everything on the page is data from the props; nothing is typed into a template.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const showPromises = (0, vue_exports.computed)(() => props.promises.length > 0);
		const showFindFast = (0, vue_exports.computed)(() => props.sizes.length > 0 || props.brands.length > 0);
		const showRimCode = (0, vue_exports.computed)(() => rimFactsOf(props.hero.product) !== null);
		const showPartners = (0, vue_exports.computed)(() => props.partners.enabled);
		const showGuides = (0, vue_exports.computed)(() => props.guides.length > 0);
		const rhythm = (0, vue_exports.computed)(() => {
			const order = ["h4", "h5"];
			if (showFindFast.value) order.push("h6");
			order.push("h7");
			if (showRimCode.value) order.push("h8");
			if (showPartners.value) order.push("h9");
			if (showGuides.value) order.push("h10");
			order.push("h11");
			const out = {};
			let light = 0;
			order.forEach((key, i) => {
				const density = i % 2 === 0 ? "section" : "section--tight";
				if (key === "h7") {
					out[key] = density;
					return;
				}
				out[key] = light % 2 === 0 ? `band ${density}` : density;
				light++;
			});
			return out;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: (0, vue_exports.unref)(TITLE) }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", (0, vue_exports.unref)(DESCRIPTION))} head-key="description"${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						name: "description",
						content: (0, vue_exports.unref)(DESCRIPTION),
						"head-key": "description"
					}, null, 8, ["content"])];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(HomeHero_default, {
				hero: __props.hero,
				selector: __props.selector
			}, null, _parent));
			if (showPromises.value) _push((0, server_renderer_exports.ssrRenderComponent)(PromiseRow_default, { promises: __props.promises }, null, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(GutachtenStory_default, {
				class: rhythm.value.h4,
				stats: __props.hero.stats
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(PopularWheels_default, {
				class: rhythm.value.h5,
				popular: __props.popular,
				"recently-viewed": __props.recentlyViewed,
				vehicle: vehicle.value
			}, null, _parent));
			if (showFindFast.value) _push((0, server_renderer_exports.ssrRenderComponent)(FindFast_default, {
				class: rhythm.value.h6,
				sizes: __props.sizes,
				brands: __props.brands,
				vehicle: vehicle.value
			}, null, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(KomplettradBand_default, {
				class: rhythm.value.h7,
				tyre: __props.komplettrad.tyre,
				vehicle: vehicle.value
			}, null, _parent));
			if (showRimCode.value) _push((0, server_renderer_exports.ssrRenderComponent)(RimCodeSection_default, {
				class: rhythm.value.h8,
				product: __props.hero.product
			}, null, _parent));
			else _push(`<!---->`);
			if (showPartners.value) _push((0, server_renderer_exports.ssrRenderComponent)(PartnersSection_default, {
				class: rhythm.value.h9,
				demo: __props.partners.demo
			}, null, _parent));
			else _push(`<!---->`);
			if (showGuides.value) _push((0, server_renderer_exports.ssrRenderComponent)(GuidesSection_default, {
				class: rhythm.value.h10,
				guides: __props.guides
			}, null, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ServiceFaq_default, {
				class: rhythm.value.h11,
				faq: __props.faq
			}, null, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Startseite/Desktop.vue
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Startseite/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = Desktop_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Desktop_default as default };
