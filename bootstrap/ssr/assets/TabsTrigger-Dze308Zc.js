import { c as vue_exports } from "../ssr.js";
import { C as useId, H as createContext, M as useVModel, S as Presence_default, T as useForwardExpose, b as Primitive } from "./Dialog-DGnwH3Iu.js";
import { t as useDirection } from "./useDirection-CU7rFtRo.js";
import { a as wrapArray, i as getFocusIntent, n as injectRovingFocusGroupContext, o as useCollection, r as focusFirst, t as RovingFocusGroup_default } from "./RovingFocusGroup-HJTJn8ZA.js";
//#region node_modules/reka-ui/dist/RovingFocus/RovingFocusItem.js
var RovingFocusItem_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "RovingFocusItem",
	props: {
		tabStopId: {
			type: String,
			required: false
		},
		focusable: {
			type: Boolean,
			required: false,
			default: true
		},
		active: {
			type: Boolean,
			required: false
		},
		allowShiftKey: {
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
			default: "span"
		}
	},
	setup(__props) {
		const props = __props;
		const context = injectRovingFocusGroupContext();
		const randomId = useId();
		const id = (0, vue_exports.computed)(() => props.tabStopId || randomId);
		const isCurrentTabStop = (0, vue_exports.computed)(() => context.currentTabStopId.value === id.value);
		const { getItems, CollectionItem } = useCollection();
		(0, vue_exports.onMounted)(() => {
			if (props.focusable) context.onFocusableItemAdd();
		});
		(0, vue_exports.onUnmounted)(() => {
			if (props.focusable) context.onFocusableItemRemove();
		});
		(0, vue_exports.watch)(() => props.focusable, (newVal, oldVal) => {
			if (newVal === oldVal) return;
			if (newVal) context.onFocusableItemAdd();
			else context.onFocusableItemRemove();
		});
		function handleKeydown(event) {
			if (event.key === "Tab" && event.shiftKey) {
				context.onItemShiftTab();
				return;
			}
			if (event.target !== event.currentTarget) return;
			const focusIntent = getFocusIntent(event, context.orientation.value, context.dir.value);
			if (focusIntent !== void 0) {
				if (event.metaKey || event.ctrlKey || event.altKey || (props.allowShiftKey ? false : event.shiftKey)) return;
				event.preventDefault();
				let candidateNodes = [...getItems().map((i) => i.ref).filter((i) => i.dataset.disabled !== "")];
				if (focusIntent === "last") candidateNodes.reverse();
				else if (focusIntent === "prev" || focusIntent === "next") {
					if (focusIntent === "prev") candidateNodes.reverse();
					const currentIndex = candidateNodes.indexOf(event.currentTarget);
					candidateNodes = context.loop.value ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
				}
				(0, vue_exports.nextTick)(() => focusFirst(candidateNodes));
			}
		}
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(CollectionItem), null, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					tabindex: isCurrentTabStop.value ? 0 : -1,
					"data-orientation": (0, vue_exports.unref)(context).orientation.value,
					"data-active": _ctx.active ? "" : void 0,
					"data-disabled": !_ctx.focusable ? "" : void 0,
					as: _ctx.as,
					"as-child": _ctx.asChild,
					onMousedown: _cache[0] || (_cache[0] = (event) => {
						if (!_ctx.focusable) event.preventDefault();
						else (0, vue_exports.unref)(context).onItemFocus(id.value);
					}),
					onFocus: _cache[1] || (_cache[1] = ($event) => (0, vue_exports.unref)(context).onItemFocus(id.value)),
					onKeydown: handleKeydown
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"tabindex",
					"data-orientation",
					"data-active",
					"data-disabled",
					"as",
					"as-child"
				])]),
				_: 3
			});
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tabs/TabsRoot.js
var [injectTabsRootContext, provideTabsRootContext] = /*#__PURE__*/ createContext("TabsRoot");
var TabsRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TabsRoot",
	props: {
		defaultValue: {
			type: null,
			required: false
		},
		orientation: {
			type: String,
			required: false,
			default: "horizontal"
		},
		dir: {
			type: String,
			required: false
		},
		activationMode: {
			type: String,
			required: false,
			default: "automatic"
		},
		modelValue: {
			type: null,
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
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emits = __emit;
		const { orientation, unmountOnHide, dir: propDir } = (0, vue_exports.toRefs)(props);
		const dir = useDirection(propDir);
		useForwardExpose();
		const modelValue = useVModel(props, "modelValue", emits, {
			defaultValue: props.defaultValue,
			passive: props.modelValue === void 0
		});
		const tabsList = (0, vue_exports.ref)();
		const contentIds = (0, vue_exports.shallowRef)(/* @__PURE__ */ new Set());
		provideTabsRootContext({
			modelValue,
			changeModelValue: (value) => {
				modelValue.value = value;
			},
			orientation,
			dir,
			unmountOnHide,
			activationMode: props.activationMode,
			baseId: useId(void 0, "reka-tabs"),
			tabsList,
			contentIds,
			registerContent: (value) => {
				contentIds.value = /* @__PURE__ */ new Set([...contentIds.value, value]);
			},
			unregisterContent: (value) => {
				const newSet = new Set(contentIds.value);
				newSet.delete(value);
				contentIds.value = newSet;
			}
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				dir: (0, vue_exports.unref)(dir),
				"data-orientation": (0, vue_exports.unref)(orientation),
				"as-child": _ctx.asChild,
				as: _ctx.as
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default", { modelValue: (0, vue_exports.unref)(modelValue) })]),
				_: 3
			}, 8, [
				"dir",
				"data-orientation",
				"as-child",
				"as"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tabs/utils.js
function makeTriggerId(baseId, value) {
	return `${baseId}-trigger-${value}`;
}
function makeContentId(baseId, value) {
	return `${baseId}-content-${value}`;
}
//#endregion
//#region node_modules/reka-ui/dist/Tabs/TabsContent.js
var TabsContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TabsContent",
	props: {
		value: {
			type: [String, Number],
			required: true
		},
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
		const { forwardRef } = useForwardExpose();
		const rootContext = injectTabsRootContext();
		const triggerId = (0, vue_exports.computed)(() => makeTriggerId(rootContext.baseId, props.value));
		const contentId = (0, vue_exports.computed)(() => makeContentId(rootContext.baseId, props.value));
		const isSelected = (0, vue_exports.computed)(() => props.value === rootContext.modelValue.value);
		const isMountAnimationPreventedRef = (0, vue_exports.ref)(isSelected.value);
		(0, vue_exports.onMounted)(() => {
			rootContext.registerContent(props.value);
			requestAnimationFrame(() => {
				isMountAnimationPreventedRef.value = false;
			});
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			rootContext.unregisterContent(props.value);
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), {
				present: _ctx.forceMount || isSelected.value,
				"force-mount": ""
			}, {
				default: (0, vue_exports.withCtx)(({ present }) => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					id: contentId.value,
					ref: (0, vue_exports.unref)(forwardRef),
					"as-child": _ctx.asChild,
					as: _ctx.as,
					role: "tabpanel",
					"data-state": isSelected.value ? "active" : "inactive",
					"data-orientation": (0, vue_exports.unref)(rootContext).orientation.value,
					"aria-labelledby": triggerId.value,
					hidden: !present,
					tabindex: "0",
					style: (0, vue_exports.normalizeStyle)({ animationDuration: isMountAnimationPreventedRef.value ? "0s" : void 0 })
				}, {
					default: (0, vue_exports.withCtx)(() => [((0, vue_exports.unref)(rootContext).unmountOnHide.value ? present : true) ? (0, vue_exports.renderSlot)(_ctx.$slots, "default", { key: 0 }) : (0, vue_exports.createCommentVNode)("v-if", true)]),
					_: 2
				}, 1032, [
					"id",
					"as-child",
					"as",
					"data-state",
					"data-orientation",
					"aria-labelledby",
					"hidden",
					"style"
				])]),
				_: 3
			}, 8, ["present"]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tabs/TabsList.js
var TabsList_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TabsList",
	props: {
		loop: {
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
	setup(__props) {
		const { loop } = (0, vue_exports.toRefs)(__props);
		const { forwardRef, currentElement } = useForwardExpose();
		const context = injectTabsRootContext();
		context.tabsList = currentElement;
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(RovingFocusGroup_default), {
				"as-child": "",
				orientation: (0, vue_exports.unref)(context).orientation.value,
				dir: (0, vue_exports.unref)(context).dir.value,
				loop: (0, vue_exports.unref)(loop)
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					ref: (0, vue_exports.unref)(forwardRef),
					role: "tablist",
					"as-child": _ctx.asChild,
					as: _ctx.as,
					"aria-orientation": (0, vue_exports.unref)(context).orientation.value
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"as-child",
					"as",
					"aria-orientation"
				])]),
				_: 3
			}, 8, [
				"orientation",
				"dir",
				"loop"
			]);
		};
	}
});
//#endregion
//#region node_modules/reka-ui/dist/Tabs/TabsTrigger.js
var TabsTrigger_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "TabsTrigger",
	props: {
		value: {
			type: [String, Number],
			required: true
		},
		disabled: {
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
			required: false,
			default: "button"
		}
	},
	setup(__props) {
		const props = __props;
		const { forwardRef } = useForwardExpose();
		const rootContext = injectTabsRootContext();
		const triggerId = (0, vue_exports.computed)(() => makeTriggerId(rootContext.baseId, props.value));
		const contentId = (0, vue_exports.computed)(() => rootContext.contentIds.value.has(props.value) ? makeContentId(rootContext.baseId, props.value) : void 0);
		const isSelected = (0, vue_exports.computed)(() => props.value === rootContext.modelValue.value);
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(RovingFocusItem_default), {
				"as-child": "",
				focusable: !_ctx.disabled,
				active: isSelected.value
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(Primitive), {
					id: triggerId.value,
					ref: (0, vue_exports.unref)(forwardRef),
					role: "tab",
					type: _ctx.as === "button" ? "button" : void 0,
					as: _ctx.as,
					"as-child": _ctx.asChild,
					"aria-selected": isSelected.value ? "true" : "false",
					"aria-controls": contentId.value,
					"data-state": isSelected.value ? "active" : "inactive",
					disabled: _ctx.disabled,
					"data-disabled": _ctx.disabled ? "" : void 0,
					"data-orientation": (0, vue_exports.unref)(rootContext).orientation.value,
					onMousedown: _cache[0] || (_cache[0] = (0, vue_exports.withModifiers)((event) => {
						if (!_ctx.disabled && event.ctrlKey === false) (0, vue_exports.unref)(rootContext).changeModelValue(_ctx.value);
						else event.preventDefault();
					}, ["left"])),
					onKeydown: _cache[1] || (_cache[1] = (0, vue_exports.withKeys)(($event) => (0, vue_exports.unref)(rootContext).changeModelValue(_ctx.value), ["enter", "space"])),
					onFocus: _cache[2] || (_cache[2] = () => {
						const isAutomaticActivation = (0, vue_exports.unref)(rootContext).activationMode !== "manual";
						if (!isSelected.value && !_ctx.disabled && isAutomaticActivation) (0, vue_exports.unref)(rootContext).changeModelValue(_ctx.value);
					})
				}, {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 8, [
					"id",
					"type",
					"as",
					"as-child",
					"aria-selected",
					"aria-controls",
					"data-state",
					"disabled",
					"data-disabled",
					"data-orientation"
				])]),
				_: 3
			}, 8, ["focusable", "active"]);
		};
	}
});
//#endregion
export { TabsRoot_default as i, TabsList_default as n, TabsContent_default as r, TabsTrigger_default as t };
