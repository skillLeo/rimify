import { c as vue_exports, o as router, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default, i as Toast_default, n as useMenus, r as useShared, t as resolveHref } from "./useShared-CY71KcPZ.js";
import { A as useEventListener$1, C as useId, F as isClient$1, H as createContext, I as reactiveOmit, L as refAutoReset, M as useVModel, R as useDebounceFn, S as Presence_default, T as useForwardExpose, V as getActiveElement, _ as DismissableLayer_default, b as Primitive, j as useResizeObserver, k as unrefElement$1, t as Dialog_default } from "./Dialog-D0E0ckTw.js";
import { C as DropdownMenuTrigger_default, D as DropdownMenuRoot_default, E as DropdownMenuContent_default, H as useDirection, I as useCollection, S as useSearch, T as DropdownMenuItem_default, U as useArrowNavigation, _ as useConsent, b as readRecent, g as provideConsent, h as CookieConsent_default, m as DemoBadge_default, n as CompareTray_default, p as MainMenu_default, t as useShortcuts, v as provideShell, w as DropdownMenuPortal_default, x as remember, y as useShell, z as useForwardPropsEmits } from "./useShortcuts-XJHE0tId.js";
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
		* nothing else. On a phone it is 56px: the wordmark, then the search, the vehicle and the menu,
		* which carries the destinations a desktop shows in the navigation, and the basket with its count.
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
			_push(`<!--[--><div class="utility from-lg" data-v-ffebb23d><div class="container utility__row" data-v-ffebb23d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DemoBadge_default, null, null, _parent));
			_push(`<span data-v-ffebb23d>Versand aus Deutschland</span><span data-v-ffebb23d>Gutachten zu jeder Felge</span><span class="utility__help" data-v-ffebb23d> Hilfe: `);
			if (contact.value.phone) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} class="utility__contact num" data-v-ffebb23d>${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a>`);
			else _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value.email}`)} class="utility__contact" data-v-ffebb23d>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a>`);
			_push(`<span class="quiet" data-v-ffebb23d> · ${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</span></span></div></div><div class="sh-sentinel" aria-hidden="true" data-v-ffebb23d></div><header class="${(0, server_renderer_exports.ssrRenderClass)([{ "site-header--scrolled": scrolled.value }, "site-header"])}" data-v-ffebb23d><div class="container sh__bar" data-v-ffebb23d>`);
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
			_push(`<div class="sh__tools" data-v-ffebb23d>`);
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
									_push(`<span class="sh__vname" data-v-ffebb23d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)}</span>`);
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
											_push(`<p class="menu__label num" data-v-ffebb23d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</p>`);
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
			_push(`<button class="icon-btn until-lg" type="button" aria-label="Suche" data-v-ffebb23d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 24
			}, null, _parent));
			_push(`</button>`);
			if (vehicle.value) {
				_push(`<button class="icon-btn until-lg sh__vicon" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Dein Fahrzeug: ${vehicle.value.label}`)} data-v-ffebb23d>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "car",
					size: 24
				}, null, _parent));
				_push(`<span class="sh__dot" aria-hidden="true" data-v-ffebb23d></span></button>`);
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
			_push((0, server_renderer_exports.ssrRenderComponent)(MainMenu_default, { class: "until-lg" }, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/warenkorb",
				class: "sh__cart from-lg",
				"aria-label": (0, vue_exports.unref)(shared).cartCount > 0 ? `Warenkorb, ${(0, vue_exports.unref)(shared).cartCount} Artikel` : "Warenkorb",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<span class="sh__cart-icon" data-v-ffebb23d${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "cart",
							size: 24
						}, null, _parent, _scopeId));
						if ((0, vue_exports.unref)(shared).cartCount > 0) _push(`<span class="badge badge--count sh__badge" aria-hidden="true" data-v-ffebb23d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).cartCount)}</span>`);
						else _push(`<!---->`);
						_push(`</span><span data-v-ffebb23d${_scopeId}>Warenkorb</span>`);
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
var SiteHeader_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SiteHeader_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ffebb23d"]]);
//#endregion
//#region resources/js/Layouts/AppLayout.vue?vue&type=script&setup=true&lang.ts
var AppLayout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AppLayout",
	__ssrInlineRender: true,
	props: { title: { default: void 0 } },
	setup(__props) {
		/**
		* The storefront frame: header, page, footer, and the overlays the shell
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["shell", { "shell--vbar": vehicle.value !== null && ((0, vue_exports.unref)(shared).headerMode === "WHITE_BOX" || (0, vue_exports.unref)(shared).headerMode === "BLUE_BAR") }] }, _attrs))} data-v-73b718d5><a class="skip-link" href="#inhalt" data-v-73b718d5>Zum Inhalt springen</a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteHeader_default, null, null, _parent));
			_push(`<main id="inhalt" class="shell__main" data-v-73b718d5>`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</main>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CompareTray_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteFooter_default, null, null, _parent));
			if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: vehicleSheet.value,
				"onUpdate:open": ($event) => vehicleSheet.value = $event,
				variant: "sheet",
				title: "Dein Fahrzeug"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="h4" data-v-73b718d5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="small muted num" data-v-73b718d5${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.buildWindow)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</p><div class="shell__vehicle-actions" data-v-73b718d5${_scopeId}>`);
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
						_push(`<button class="btn btn--ghost btn--block" type="button" data-v-73b718d5${_scopeId}>Fahrzeug entfernen</button></div>`);
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
var AppLayout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AppLayout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-73b718d5"]]);
//#endregion
export { Kbd_default as n, VisuallyHidden_default as r, AppLayout_default as t };
