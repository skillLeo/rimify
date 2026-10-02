import { D as useForwardExpose, E as useHideOthers, P as useVModel, R as reactiveOmit, S as Primitive, T as useId, i as Teleport_default, j as unrefElement, k as useBodyScrollLock, v as FocusScope_default, w as Presence_default, y as DismissableLayer_default } from "./Dialog-C-07FMpe.js";
import { b as useFocusGuards, d as PopperRoot_default, g as usePrimitiveElement, l as PopperContent_default, u as PopperAnchor_default, v as useForwardPropsEmits, y as useForwardProps } from "./DropdownMenuTrigger-DR2ieCu7.js";
import { n as VisuallyHidden_default } from "./Kbd-CRPmDYqU.js";
import { n as createContext, u as vue_exports } from "../ssr.js";
//#region node_modules/reka-ui/dist/shared/useFormControl.js
function useFormControl(el) {
	return (0, vue_exports.computed)(() => (0, vue_exports.toValue)(el) ? Boolean(unrefElement(el)?.closest("form")) : true);
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
		rootContext.contentId ||= useId(void 0, "reka-popover-content");
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
		rootContext.triggerId ||= useId(void 0, "reka-popover-trigger");
		rootContext.contentId ||= useId(void 0, "reka-popover-content");
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
export { VisuallyHiddenInput_default as a, PopoverRoot_default as i, PopoverPortal_default as n, useFormControl as o, PopoverContent_default as r, PopoverTrigger_default as t };
