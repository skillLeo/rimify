import { c as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default } from "./useShared-CY71KcPZ.js";
import { A as useEventListener, C as useId, H as createContext, M as useVModel, S as Presence_default, T as useForwardExpose, b as Primitive, z as isNullish } from "./Dialog-D0E0ckTw.js";
import { H as useDirection, U as useArrowNavigation } from "./useShortcuts-XJHE0tId.js";
import { t as Skeleton_default } from "./Skeleton-CJiktMEO.js";
//#region node_modules/ohash/dist/_chunks/is-equal.mjs
function serialize(input) {
	if (typeof input === "string") return `'${input}'`;
	return new Serializer().serialize(input);
}
var asciiOrder = " _-,;:!?.'\"()[]{}@*/\\&#%`^+<=>|~$0123456789abcdefghijklmnopqrstuvwxyz";
var asciiWeights = /*@__PURE__*/ (function() {
	const weights = /* @__PURE__ */ new Uint8Array(128);
	for (let i = 0; i < 69; i++) weights[asciiOrder.charCodeAt(i)] = i + 1;
	for (let code = 65; code <= 90; code++) weights[code] = weights[code + 32];
	return weights;
})();
function compareStrings(a, b) {
	if (a === b) return 0;
	const length = Math.min(a.length, b.length);
	let tieBreaker = 0;
	for (let i = 0; i < length; i++) {
		const codeA = a.charCodeAt(i);
		const codeB = b.charCodeAt(i);
		if (codeA === codeB) continue;
		const weightA = codeA < 128 && asciiWeights[codeA] ? asciiWeights[codeA] : codeA + 128;
		const weightB = codeB < 128 && asciiWeights[codeB] ? asciiWeights[codeB] : codeB + 128;
		if (weightA !== weightB) return weightA < weightB ? -1 : 1;
		if (tieBreaker === 0) tieBreaker = codeA > codeB ? -1 : 1;
	}
	if (a.length !== b.length) return a.length < b.length ? -1 : 1;
	return tieBreaker;
}
var Serializer = /*@__PURE__*/ (function() {
	class Serializer {
		#context = /* @__PURE__ */ new Map();
		compare(a, b) {
			const typeA = typeof a;
			const typeB = typeof b;
			if (typeA === "string" && typeB === "string") return compareStrings(a, b);
			if (typeA === "number" && typeB === "number") return a - b;
			return compareStrings(this.serialize(a, true), this.serialize(b, true));
		}
		serialize(value, noQuotes) {
			if (value === null) return "null";
			switch (typeof value) {
				case "string": return noQuotes ? value : `'${value}'`;
				case "bigint": return `${value}n`;
				case "object": return this.$object(value);
				case "function": return this.$function(value);
			}
			return String(value);
		}
		serializeObject(object) {
			const objString = Object.prototype.toString.call(object);
			if (objString !== "[object Object]") return this.serializeBuiltInType(objString.length < 10 ? `unknown:${objString}` : objString.slice(8, -1), object);
			const constructor = object.constructor;
			const objName = constructor === Object || constructor === void 0 ? "" : constructor.name;
			if (objName !== "" && globalThis[objName] === constructor) return this.serializeBuiltInType(objName, object);
			if ("toJSON" in object && typeof object.toJSON === "function") {
				const json = object.toJSON();
				return objName + (json !== null && typeof json === "object" ? this.$object(json) : `(${this.serialize(json)})`);
			}
			const keys = Object.keys(object).sort(compareStrings);
			let content = `${objName}{`;
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				content += `${key}:${this.serialize(object[key])}`;
				if (i < keys.length - 1) content += ",";
			}
			return content + "}";
		}
		serializeBuiltInType(type, object) {
			const handler = this["$" + type];
			if (handler) return handler.call(this, object);
			if (typeof object.entries === "function") return this.serializeObjectEntries(type, object.entries());
			throw new Error(`Cannot serialize ${type}`);
		}
		serializeObjectEntries(type, entries) {
			const sortedEntries = Array.from(entries).sort((a, b) => this.compare(a[0], b[0]));
			let content = `${type}{`;
			for (let i = 0; i < sortedEntries.length; i++) {
				const [key, value] = sortedEntries[i];
				content += `${this.serialize(key, true)}:${this.serialize(value)}`;
				if (i < sortedEntries.length - 1) content += ",";
			}
			return content + "}";
		}
		$object(object) {
			let content = this.#context.get(object);
			if (content === void 0) {
				this.#context.set(object, `#${this.#context.size}`);
				content = this.serializeObject(object);
				this.#context.set(object, content);
			}
			return content;
		}
		$function(fn) {
			const fnStr = Function.prototype.toString.call(fn);
			if (fnStr.slice(-15) === "[native code] }") return `${fn.name || ""}()[native]`;
			return `${fn.name}(${fn.length})${fnStr.replace(/\s*\n\s*/g, "")}`;
		}
		$Array(arr) {
			let content = "[";
			for (let i = 0; i < arr.length; i++) {
				content += this.serialize(arr[i]);
				if (i < arr.length - 1) content += ",";
			}
			return content + "]";
		}
		$Date(date) {
			try {
				return `Date(${date.toISOString()})`;
			} catch {
				return `Date(null)`;
			}
		}
		$ArrayBuffer(arr) {
			return `ArrayBuffer[${new Uint8Array(arr).join(",")}]`;
		}
		$Set(set) {
			return `Set${this.$Array(Array.from(set).sort((a, b) => this.compare(a, b)))}`;
		}
		$Map(map) {
			return this.serializeObjectEntries("Map", map.entries());
		}
	}
	for (const type of [
		"Error",
		"RegExp",
		"URL"
	]) Serializer.prototype["$" + type] = function(val) {
		return `${type}(${val})`;
	};
	for (const type of [
		"Int8Array",
		"Uint8Array",
		"Uint8ClampedArray",
		"Int16Array",
		"Uint16Array",
		"Int32Array",
		"Uint32Array",
		"Float32Array",
		"Float64Array"
	]) Serializer.prototype["$" + type] = function(arr) {
		return `${type}[${arr.join(",")}]`;
	};
	for (const type of ["BigInt64Array", "BigUint64Array"]) Serializer.prototype["$" + type] = function(arr) {
		return `${type}[${arr.join("n,")}${arr.length > 0 ? "n" : ""}]`;
	};
	return Serializer;
})();
function isEqual(object1, object2) {
	if (object1 === object2) return true;
	if (serialize(object1) === serialize(object2)) return true;
	return false;
}
//#endregion
//#region node_modules/reka-ui/dist/shared/isValueEqualOrExist.js
/**
* The function `isValueEqualOrExist` checks if a value is equal to or exists in another value or
* array.
* @param {T | T[] | undefined} base - It represents the base value that you want to compare with the `current` value.
* @param {T | T[] | undefined} current - The `current` parameter represents the current value that you want to compare with the `base` value or values.
* @returns The `isValueEqualOrExist` function returns a boolean value. It checks if the `base` value
* is equal to the `current` value or if the `current` value exists within the `base` value. The
* function handles cases where `base` can be a single value, an array of values, or undefined.
*/
function isValueEqualOrExist(base, current) {
	if (isNullish(base)) return false;
	if (Array.isArray(base)) return base.some((val) => isEqual(val, current));
	else return isEqual(base, current);
}
//#endregion
//#region node_modules/reka-ui/dist/Collapsible/CollapsibleRoot.js
var [injectCollapsibleRootContext, provideCollapsibleRootContext] = /*#__PURE__*/ createContext("CollapsibleRoot");
var CollapsibleRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "CollapsibleRoot",
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
		disabled: {
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
			required: false
		}
	},
	emits: ["update:open"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const open = useVModel(props, "open", __emit, {
			defaultValue: props.defaultOpen,
			passive: props.open === void 0
		});
		const { disabled, unmountOnHide } = (0, vue_exports.toRefs)(props);
		provideCollapsibleRootContext({
			contentId: "",
			disabled,
			open,
			unmountOnHide,
			onOpenToggle: () => {
				if (disabled.value) return;
				open.value = !open.value;
			}
		});
		__expose({ open });
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				as: _ctx.as,
				"as-child": props.asChild,
				"data-state": (0, vue_exports.unref)(open) ? "open" : "closed",
				"data-disabled": (0, vue_exports.unref)(disabled) ? "" : void 0
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { open: (0, vue_exports.unref)(open) })]),
				_: 3
			}, 8, [
				"as",
				"as-child",
				"data-state",
				"data-disabled"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Collapsible/CollapsibleContent.js
var CollapsibleContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "CollapsibleContent",
	props: {
		forceMount: {
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
	emits: ["contentFound"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const rootContext = injectCollapsibleRootContext();
		rootContext.contentId ||= useId(void 0, "reka-collapsible-content");
		const presentRef = (0, vue_exports.ref)();
		const { forwardRef, currentElement } = useForwardExpose();
		const width = (0, vue_exports.ref)(0);
		const height = (0, vue_exports.ref)(0);
		const isOpen = (0, vue_exports.computed)(() => rootContext.open.value);
		const isMountAnimationPrevented = (0, vue_exports.ref)(isOpen.value);
		const currentStyle = (0, vue_exports.ref)();
		(0, vue_exports.watch)(() => [isOpen.value, presentRef.value?.present], async () => {
			await (0, vue_exports.nextTick)();
			const node = currentElement.value;
			if (!node) return;
			currentStyle.value = currentStyle.value || {
				transitionDuration: node.style.transitionDuration,
				animationName: node.style.animationName
			};
			node.style.transitionDuration = "0s";
			node.style.animationName = "none";
			const rect = node.getBoundingClientRect();
			height.value = rect.height;
			width.value = rect.width;
			if (!isMountAnimationPrevented.value) {
				node.style.transitionDuration = currentStyle.value.transitionDuration;
				node.style.animationName = currentStyle.value.animationName;
			}
		}, { immediate: true });
		const skipAnimation = (0, vue_exports.computed)(() => isMountAnimationPrevented.value && rootContext.open.value);
		(0, vue_exports.onMounted)(() => {
			requestAnimationFrame(() => {
				isMountAnimationPrevented.value = false;
			});
		});
		useEventListener(currentElement, "beforematch", (ev) => {
			requestAnimationFrame(() => {
				rootContext.onOpenToggle();
				emits("contentFound");
			});
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), {
				ref_key: "presentRef",
				ref: presentRef,
				present: _ctx.forceMount || (0, vue_exports.unref)(rootContext).open.value,
				"force-mount": true
			}, {
				default: (0, vue_exports.withCtx)(({ present }) => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(_ctx.$attrs, {
					id: (0, vue_exports.unref)(rootContext).contentId,
					ref: (0, vue_exports.unref)(forwardRef),
					"as-child": props.asChild,
					as: _ctx.as,
					hidden: !present ? (0, vue_exports.unref)(rootContext).unmountOnHide.value ? "" : "until-found" : void 0,
					"data-state": skipAnimation.value ? void 0 : (0, vue_exports.unref)(rootContext).open.value ? "open" : "closed",
					"data-disabled": (0, vue_exports.unref)(rootContext).disabled?.value ? "" : void 0,
					style: {
						[`--reka-collapsible-content-height`]: `${height.value}px`,
						[`--reka-collapsible-content-width`]: `${width.value}px`
					}
				}), {
					default: (0, vue_exports.withCtx)(() => [((0, vue_exports.unref)(rootContext).unmountOnHide.value ? present : true) ? (0, vue_exports.renderSlot)(_ctx.$slots, "default", { key: 0 }) : (0, vue_exports.createCommentVNode)("v-if", true)]),
					_: 2
				}, 1040, [
					"id",
					"as-child",
					"as",
					"hidden",
					"data-state",
					"data-disabled",
					"style"
				])]),
				_: 3
			}, 8, ["present"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Collapsible/CollapsibleTrigger.js
var CollapsibleTrigger_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "CollapsibleTrigger",
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
		useForwardExpose();
		const rootContext = injectCollapsibleRootContext();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				type: _ctx.as === "button" ? "button" : void 0,
				as: _ctx.as,
				"as-child": props.asChild,
				"aria-controls": (0, vue_exports.unref)(rootContext).contentId,
				"aria-expanded": (0, vue_exports.unref)(rootContext).open.value,
				"data-state": (0, vue_exports.unref)(rootContext).open.value ? "open" : "closed",
				"data-disabled": (0, vue_exports.unref)(rootContext).disabled?.value ? "" : void 0,
				disabled: (0, vue_exports.unref)(rootContext).disabled?.value,
				onClick: (0, vue_exports.unref)(rootContext).onOpenToggle
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"type",
				"as",
				"as-child",
				"aria-controls",
				"aria-expanded",
				"data-state",
				"data-disabled",
				"disabled",
				"onClick"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/shared/useSingleOrMultipleValue.js
/**
* Validates the props and it makes sure that the types are coherent with each other
*
* 1. If type, defaultValue, and modelValue are all undefined, throw an error.
* 2. If modelValue and defaultValue are defined and not of the same type, throw an error.
* 3. If type is defined:
*    a. If type is 'single' and either modelValue or defaultValue is an array, log an error and return 'multiple'.
*    b. If type is 'multiple' and neither modelValue nor defaultValue is an array, log an error and return 'single'.
* 4. Return 'multiple' if modelValue is an array, else return 'single'.
*/
function validateProps({ type, defaultValue, modelValue }) {
	const value = modelValue || defaultValue;
	if (modelValue !== void 0 || defaultValue !== void 0) return Array.isArray(value) ? "multiple" : "single";
	else return type ?? "single";
}
function getDefaultType({ type, defaultValue, modelValue }) {
	if (type) return type;
	return validateProps({
		type,
		defaultValue,
		modelValue
	});
}
function getDefaultValue({ type, defaultValue }) {
	if (defaultValue !== void 0) return defaultValue;
	return type === "single" ? void 0 : [];
}
function useSingleOrMultipleValue(props, emits) {
	const type = (0, vue_exports.computed)(() => getDefaultType(props));
	const modelValue = useVModel(props, "modelValue", emits, {
		defaultValue: getDefaultValue(props),
		passive: props.modelValue === void 0,
		deep: true
	});
	function changeModelValue(value) {
		if (type.value === "single") modelValue.value = isEqual(value, modelValue.value) ? void 0 : value;
		else {
			const modelValueArray = Array.isArray(modelValue.value) ? [...modelValue.value || []] : [modelValue.value].filter(Boolean);
			if (isValueEqualOrExist(modelValueArray, value)) {
				const index = modelValueArray.findIndex((i) => isEqual(i, value));
				modelValueArray.splice(index, 1);
			} else modelValueArray.push(value);
			modelValue.value = modelValueArray;
		}
	}
	return {
		modelValue,
		changeModelValue,
		isSingle: (0, vue_exports.computed)(() => type.value === "single")
	};
}
//#endregion
//#region node_modules/reka-ui/dist/Accordion/AccordionRoot.js
var [injectAccordionRootContext, provideAccordionRootContext] = /*#__PURE__*/ createContext("AccordionRoot");
var AccordionRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "AccordionRoot",
	props: {
		collapsible: {
			type: Boolean,
			required: false,
			default: false
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		dir: {
			type: String,
			required: false
		},
		orientation: {
			type: String,
			required: false,
			default: "vertical"
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
			required: false
		},
		type: {
			type: String,
			required: false
		},
		modelValue: {
			type: null,
			required: false
		},
		defaultValue: {
			type: null,
			required: false
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { dir, disabled, unmountOnHide } = (0, vue_exports.toRefs)(props);
		const direction = useDirection(dir);
		const { modelValue, changeModelValue, isSingle } = useSingleOrMultipleValue(props, emits);
		const { forwardRef, currentElement: parentElement } = useForwardExpose();
		provideAccordionRootContext({
			disabled,
			direction,
			orientation: props.orientation,
			parentElement,
			isSingle,
			collapsible: props.collapsible,
			modelValue,
			changeModelValue,
			unmountOnHide
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				ref: (0, vue_exports.unref)(forwardRef),
				"as-child": _ctx.asChild,
				as: _ctx.as
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { modelValue: (0, vue_exports.unref)(modelValue) })]),
				_: 3
			}, 8, ["as-child", "as"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Accordion/AccordionItem.js
var AccordionItemState = /* @__PURE__ */ function(AccordionItemState$1) {
	AccordionItemState$1["Open"] = "open";
	AccordionItemState$1["Closed"] = "closed";
	return AccordionItemState$1;
}(AccordionItemState || {});
var [injectAccordionItemContext, provideAccordionItemContext] = /*#__PURE__*/ createContext("AccordionItem");
var AccordionItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "AccordionItem",
	props: {
		disabled: {
			type: Boolean,
			required: false
		},
		value: {
			type: String,
			required: true
		},
		unmountOnHide: {
			type: Boolean,
			required: false,
			default: void 0
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
	setup(__props, { expose: __expose }) {
		const props = __props;
		const rootContext = injectAccordionRootContext();
		const open = (0, vue_exports.computed)(() => rootContext.isSingle.value ? props.value === rootContext.modelValue.value : Array.isArray(rootContext.modelValue.value) && rootContext.modelValue.value.includes(props.value));
		const disabled = (0, vue_exports.computed)(() => {
			return rootContext.disabled.value || props.disabled;
		});
		const dataDisabled = (0, vue_exports.computed)(() => disabled.value ? "" : void 0);
		const dataState = (0, vue_exports.computed)(() => open.value ? AccordionItemState.Open : AccordionItemState.Closed);
		__expose({
			open,
			dataDisabled
		});
		const { currentRef, currentElement } = useForwardExpose();
		provideAccordionItemContext({
			open,
			dataState,
			disabled,
			dataDisabled,
			triggerId: "",
			currentRef,
			currentElement,
			value: (0, vue_exports.computed)(() => props.value)
		});
		function handleArrowKey(e) {
			const target = e.target;
			if (Array.from(rootContext.parentElement.value?.querySelectorAll("[data-reka-collection-item]") ?? []).findIndex((item) => item === target) === -1) return null;
			useArrowNavigation(e, target, rootContext.parentElement.value, {
				arrowKeyOptions: rootContext.orientation,
				dir: rootContext.direction.value,
				focus: true
			});
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollapsibleRoot_default), {
				"data-orientation": (0, vue_exports.unref)(rootContext).orientation,
				"data-disabled": dataDisabled.value,
				"data-state": dataState.value,
				disabled: disabled.value,
				open: open.value,
				as: props.as,
				"as-child": props.asChild,
				"unmount-on-hide": props.unmountOnHide ?? (0, vue_exports.unref)(rootContext).unmountOnHide.value,
				onKeydown: (0, vue_exports.withKeys)(handleArrowKey, [
					"up",
					"down",
					"left",
					"right",
					"home",
					"end"
				])
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { open: open.value })]),
				_: 3
			}, 8, [
				"data-orientation",
				"data-disabled",
				"data-state",
				"disabled",
				"open",
				"as",
				"as-child",
				"unmount-on-hide"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Accordion/AccordionContent.js
var AccordionContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "AccordionContent",
	props: {
		forceMount: {
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
	setup(__props) {
		const props = __props;
		const rootContext = injectAccordionRootContext();
		const itemContext = injectAccordionItemContext();
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollapsibleContent_default), {
				role: "region",
				"as-child": props.asChild,
				as: _ctx.as,
				"force-mount": props.forceMount,
				"aria-labelledby": (0, vue_exports.unref)(itemContext).triggerId,
				"data-state": (0, vue_exports.unref)(itemContext).dataState.value,
				"data-disabled": (0, vue_exports.unref)(itemContext).dataDisabled.value,
				"data-orientation": (0, vue_exports.unref)(rootContext).orientation,
				style: {
					"--reka-accordion-content-width": "var(--reka-collapsible-content-width)",
					"--reka-accordion-content-height": "var(--reka-collapsible-content-height)"
				},
				onContentFound: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(rootContext).changeModelValue((0, vue_exports.unref)(itemContext).value.value))
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"as-child",
				"as",
				"force-mount",
				"aria-labelledby",
				"data-state",
				"data-disabled",
				"data-orientation"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Accordion/AccordionHeader.js
var AccordionHeader_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "AccordionHeader",
	props: {
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "h3"
		}
	},
	setup(__props) {
		const props = __props;
		const rootContext = injectAccordionRootContext();
		const itemContext = injectAccordionItemContext();
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				as: props.as,
				"as-child": props.asChild,
				"data-orientation": (0, vue_exports.unref)(rootContext).orientation,
				"data-state": (0, vue_exports.unref)(itemContext).dataState.value,
				"data-disabled": (0, vue_exports.unref)(itemContext).dataDisabled.value
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"as",
				"as-child",
				"data-orientation",
				"data-state",
				"data-disabled"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Accordion/AccordionTrigger.js
var AccordionTrigger_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "AccordionTrigger",
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
		const rootContext = injectAccordionRootContext();
		const itemContext = injectAccordionItemContext();
		itemContext.triggerId ||= useId(void 0, "reka-accordion-trigger");
		function changeItem() {
			const triggerDisabled = rootContext.isSingle.value && itemContext.open.value && !rootContext.collapsible;
			if (itemContext.disabled.value || triggerDisabled) return;
			rootContext.changeModelValue(itemContext.value.value);
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollapsibleTrigger_default), {
				id: (0, vue_exports.unref)(itemContext).triggerId,
				ref: (0, vue_exports.unref)(itemContext).currentRef,
				"data-reka-collection-item": "",
				as: props.as,
				"as-child": props.asChild,
				"aria-disabled": (0, vue_exports.unref)(itemContext).disabled.value || void 0,
				"aria-expanded": (0, vue_exports.unref)(itemContext).open.value || false,
				"data-disabled": (0, vue_exports.unref)(itemContext).dataDisabled.value,
				"data-orientation": (0, vue_exports.unref)(rootContext).orientation,
				"data-state": (0, vue_exports.unref)(itemContext).dataState.value,
				disabled: (0, vue_exports.unref)(itemContext).disabled.value,
				onClick: changeItem
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"id",
				"as",
				"as-child",
				"aria-disabled",
				"aria-expanded",
				"data-disabled",
				"data-orientation",
				"data-state",
				"disabled"
			]);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Accordion.vue?vue&type=script&setup=true&lang.ts
var Accordion_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Accordion",
	__ssrInlineRender: true,
	props: {
		items: {},
		level: { default: 3 }
	},
	setup(__props) {
		/**
		* A list of questions, one open at a time. Each row is a real button with the answer's id, so a
		* screen reader hears "collapsed" and "expanded" and the chevron only confirms what the button
		* already says.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(AccordionRoot_default), (0, vue_exports.mergeProps)({
				type: "single",
				collapsible: "",
				class: "accordion"
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(AccordionItem_default), {
								key: item.id,
								value: String(item.id),
								class: "accordion__item"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(AccordionHeader_default), {
											as: `h${__props.level}`,
											class: "accordion__header"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(AccordionTrigger_default), { class: "accordion__trigger" }, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) {
															_push(`<span data-v-5177a664${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.title)}</span>`);
															_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
																name: "chevron-down",
																size: 20
															}, null, _parent, _scopeId));
														} else return [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(item.title), 1), (0, vue_exports.createVNode)(Icon_default, {
															name: "chevron-down",
															size: 20
														})];
													}),
													_: 2
												}, _parent, _scopeId));
												else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(AccordionTrigger_default), { class: "accordion__trigger" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(item.title), 1), (0, vue_exports.createVNode)(Icon_default, {
														name: "chevron-down",
														size: 20
													})]),
													_: 2
												}, 1024)];
											}),
											_: 2
										}, _parent, _scopeId));
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(AccordionContent_default), { class: "accordion__content" }, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push(`<div class="accordion__body" data-v-5177a664${_scopeId}>`);
													(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "body", { item }, () => {
														_push(`${(0, server_renderer_exports.ssrInterpolate)(item.body)}`);
													}, _push, _parent, _scopeId);
													_push(`</div>`);
												} else return [(0, vue_exports.createVNode)("div", { class: "accordion__body" }, [(0, vue_exports.renderSlot)(_ctx.$slots, "body", { item }, () => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.body), 1)], true)])];
											}),
											_: 2
										}, _parent, _scopeId));
									} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(AccordionHeader_default), {
										as: `h${__props.level}`,
										class: "accordion__header"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(AccordionTrigger_default), { class: "accordion__trigger" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(item.title), 1), (0, vue_exports.createVNode)(Icon_default, {
												name: "chevron-down",
												size: 20
											})]),
											_: 2
										}, 1024)]),
										_: 2
									}, 1032, ["as"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(AccordionContent_default), { class: "accordion__content" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "accordion__body" }, [(0, vue_exports.renderSlot)(_ctx.$slots, "body", { item }, () => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.body), 1)], true)])]),
										_: 2
									}, 1024)];
								}),
								_: 2
							}, _parent, _scopeId));
						});
						_push(`<!--]-->`);
					} else return [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.items, (item) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(AccordionItem_default), {
							key: item.id,
							value: String(item.id),
							class: "accordion__item"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(AccordionHeader_default), {
								as: `h${__props.level}`,
								class: "accordion__header"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(AccordionTrigger_default), { class: "accordion__trigger" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(item.title), 1), (0, vue_exports.createVNode)(Icon_default, {
										name: "chevron-down",
										size: 20
									})]),
									_: 2
								}, 1024)]),
								_: 2
							}, 1032, ["as"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(AccordionContent_default), { class: "accordion__content" }, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "accordion__body" }, [(0, vue_exports.renderSlot)(_ctx.$slots, "body", { item }, () => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.body), 1)], true)])]),
								_: 2
							}, 1024)]),
							_: 2
						}, 1032, ["value"]);
					}), 128))];
				}),
				_: 3
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Accordion.vue
var _sfc_setup$2 = Accordion_vue_vue_type_script_setup_true_lang_default.setup;
Accordion_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Accordion.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var Accordion_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Accordion_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5177a664"]]);
//#endregion
//#region resources/js/Components/Ui/ProductTileSkeleton.vue?vue&type=script&setup=true&lang.ts
var ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ProductTileSkeleton",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The tile while its data loads: the same lines, at the same heights, in the same grid, and the
		* CTA's block where the CTA will be — so the row does not move when the cards arrive.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "tile tile--skeleton",
				"aria-hidden": "true"
			}, _attrs))} data-v-837136ff>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				tile: "",
				height: "auto",
				class: "tile__media"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "38%",
				height: "var(--lh-small)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "72%",
				height: "var(--lh-body)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "48%",
				height: "var(--lh-small)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "56%",
				height: "var(--lh-small)"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "60%",
				height: "var(--lh-body)",
				class: "tile__skeleton-price"
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Skeleton_default, {
				width: "66%",
				height: "var(--lh-micro)"
			}, null, _parent));
			_push(`<div class="tile__actions" data-v-837136ff><span class="skeleton tile__skeleton-cta" data-v-837136ff></span></div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/ProductTileSkeleton.vue
var _sfc_setup$1 = ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default.setup;
ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/ProductTileSkeleton.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var ProductTileSkeleton_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ProductTileSkeleton_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-837136ff"]]);
//#endregion
//#region resources/js/Components/Ui/SpecCallout.vue?vue&type=script&setup=true&lang.ts
var SpecCallout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SpecCallout",
	__ssrInlineRender: true,
	props: {
		label: {},
		value: {},
		note: { default: void 0 },
		x: {},
		y: {},
		tx: {},
		ty: {},
		side: { default: void 0 },
		elbow: { default: void 0 },
		ratio: { default: 1 },
		weight: { default: .35 },
		ring: { default: void 0 }
	},
	setup(__props) {
		/**
		* A measured value pointed at the real thing in a photograph: the label and the value (and, where
		* it needs saying, a note) in a small white box, and a thin leader from the box to the feature.
		*
		* Everything is in the server-rendered HTML and nothing is measured: positions are percentages of
		* the frame, and the leader is drawn in the frame's own units (`ratio` × 100 wide, 100 tall), so a
		* frame of that ratio scales the drawing evenly and a ring stays round. With `side`, the box hugs
		* that edge of the frame, `x` % in and vertically centred on `y`, and the leader starts at that
		* edge, under the box: the opaque box covers the start, so the visible line leaves it wherever its
		* inner edge falls, however wide the text makes it. `elbow` bends the line to run level into the
		* box. Without `side`, the box's top-left corner is at (`x`, `y`) and the line starts there.
		*
		* The final drawing is the default: without JavaScript and under reduced motion the leader, its
		* dot and the ring are simply there. Otherwise the box fades in and the leader draws in once, after
		* `--callout-delay` (the host sets it — the hero waits for its wheel to stop), and the dot and ring
		* appear after it.
		*/
		const props = __props;
		const width = (0, vue_exports.computed)(() => props.ratio * 100);
		/** A percentage of the frame's width in the drawing's units. */
		function ux(percent) {
			return Math.round(percent / 100 * width.value * 100) / 100;
		}
		const start = (0, vue_exports.computed)(() => ({
			x: props.side === "right" ? ux(100 - props.x) : ux(props.x),
			y: props.y
		}));
		const end = (0, vue_exports.computed)(() => ({
			x: ux(props.tx),
			y: props.ty
		}));
		const d = (0, vue_exports.computed)(() => {
			const bend = props.elbow === void 0 ? "" : ` L ${ux(props.elbow)} ${start.value.y}`;
			return `M ${start.value.x} ${start.value.y}${bend} L ${end.value.x} ${end.value.y}`;
		});
		const dot = (0, vue_exports.computed)(() => Math.round(props.weight * 2.2 * 100) / 100);
		const boxStyle = (0, vue_exports.computed)(() => {
			if (props.side === "right") return {
				right: `${props.x}%`,
				top: `${props.y}%`
			};
			return {
				left: `${props.x}%`,
				top: `${props.y}%`
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "callout-anchor",
				"aria-hidden": "true"
			}, _attrs))} data-v-2d0fdaa5><svg class="callout__line"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${width.value} 100`)} preserveAspectRatio="none" focusable="false" style="${(0, server_renderer_exports.ssrRenderStyle)({ "--callout-weight": __props.weight })}" data-v-2d0fdaa5>`);
			if (__props.ring) _push(`<circle class="callout__ring"${(0, server_renderer_exports.ssrRenderAttr)("cx", ux(__props.ring.cx))}${(0, server_renderer_exports.ssrRenderAttr)("cy", __props.ring.cy)}${(0, server_renderer_exports.ssrRenderAttr)("r", __props.ring.r)} pathLength="60" data-v-2d0fdaa5></circle>`);
			else _push(`<!---->`);
			_push(`<path class="callout__leader"${(0, server_renderer_exports.ssrRenderAttr)("d", d.value)} pathLength="1" data-v-2d0fdaa5></path><circle class="callout__dot"${(0, server_renderer_exports.ssrRenderAttr)("cx", end.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("cy", end.value.y)}${(0, server_renderer_exports.ssrRenderAttr)("r", dot.value)} data-v-2d0fdaa5></circle></svg><div class="${(0, server_renderer_exports.ssrRenderClass)([__props.side ? `callout--${__props.side}` : void 0, "callout"])}" style="${(0, server_renderer_exports.ssrRenderStyle)(boxStyle.value)}" data-v-2d0fdaa5><span class="callout__label" data-v-2d0fdaa5>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span><span class="callout__value" translate="no" data-v-2d0fdaa5>${(0, server_renderer_exports.ssrInterpolate)(__props.value)}</span>`);
			if (__props.note) _push(`<span class="callout__note" data-v-2d0fdaa5>${(0, server_renderer_exports.ssrInterpolate)(__props.note)}</span>`);
			else _push(`<!---->`);
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/SpecCallout.vue
var _sfc_setup = SpecCallout_vue_vue_type_script_setup_true_lang_default.setup;
SpecCallout_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/SpecCallout.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var SpecCallout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SpecCallout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2d0fdaa5"]]);
//#endregion
export { isEqual as i, ProductTileSkeleton_default as n, Accordion_default as r, SpecCallout_default as t };
