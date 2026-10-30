import { D as useForwardExpose, G as getActiveElement, L as isClient$1, M as useEventListener$1, N as useResizeObserver, P as useVModel, R as reactiveOmit, S as Primitive, T as useId$1, V as useDebounceFn, j as unrefElement$1, t as Dialog_default, w as Presence_default, y as DismissableLayer_default, z as refAutoReset } from "./Dialog-CAlgTJaP.js";
import { S as useArrowNavigation, a as DropdownMenuRoot_default, h as useCollection, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default, v as useForwardPropsEmits, x as useDirection } from "./DropdownMenuTrigger-DxgIMivC.js";
import { c as VisuallyHidden_default, i as hasMobileShell, n as ListRow_default, r as BottomSheet_default } from "./Toast-BH3wkw4w.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-Bu32GjnF.js";
import { a as link_default, c as router, i as head_default, n as createContext, r as defineStore, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { i as isIconName, t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { i as firstLoad, r as addedFrom } from "./toast-Ckkabove.js";
import { t as Picture_default } from "./Picture-LERI3lyx.js";
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/utils.js
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuRoot.js
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
			baseId: useId$1(void 0, "reka-navigation-menu"),
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuItem.js
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
		const value = useId$1(props.value);
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuContentImpl.js
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuContent.js
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuLink.js
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuList.js
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuTrigger.js
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/NavigationMenu/NavigationMenuViewport.js
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
//#region resources/js/composables/useShared.ts
/**
* Typed access to the props every page receives.
*
* `usePage().props` is `any` by default, which is how a renamed controller key becomes a blank
* header nobody notices until a client review. This narrows it once, here.
*/
function useShared() {
	const page = usePage();
	return (0, vue_exports.computed)(() => page.props);
}
function useMenus() {
	const shared = useShared();
	return (0, vue_exports.computed)(() => shared.value.menus ?? {
		header: [],
		footer_pages: [],
		footer_legal: [],
		mobile_bottom: []
	});
}
/**
* `Felgen suchen` goes to the selector with no vehicle and to the listing with one. The rule lives
* in the nav row's `behaviour`, so marketing can move the item without a developer — and so the
* destination is not a branch buried in a component.
*/
function resolveHref(href, behaviour, hasVehicle, listingHref) {
	return behaviour === "vehicle_aware" && hasVehicle ? listingHref : href;
}
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
var KEY$1 = Symbol("shell");
function provideShell() {
	let focus = null;
	const store = {
		paletteOpen: (0, vue_exports.ref)(false),
		helpOpen: (0, vue_exports.ref)(false),
		vehicleOpen: (0, vue_exports.ref)(false),
		stickyBar: (0, vue_exports.ref)(false),
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
	(0, vue_exports.provide)(KEY$1, store);
	return store;
}
function useShell() {
	const store = (0, vue_exports.inject)(KEY$1);
	if (store === void 0) throw new Error("useShell() needs provideShell() in the layout");
	return store;
}
/**
* A page's sticky bar claims the bottom edge while `shown` is true, and gives it back when the page goes. Without a
* layout (a component test) there is no edge to claim.
*/
function claimBottomEdge(shown) {
	const store = (0, vue_exports.inject)(KEY$1, null);
	if (store === null) return;
	(0, vue_exports.watch)(shown, (on) => {
		store.stickyBar.value = on;
	}, { immediate: true });
	(0, vue_exports.onBeforeUnmount)(() => {
		store.stickyBar.value = false;
	});
}
//#endregion
//#region resources/js/lib/vehicleChange.ts
/** The shell's „Fahrzeug ändern“ for the page on screen. */
function useVehicleChangeHref() {
	const shared = useShared();
	const page = usePage();
	return (0, vue_exports.computed)(() => vehicleChangeHref(shared.value.routeName, page.url));
}
/**
* Where „Fahrzeug ändern“ leads from the shell — the header, the vehicle bar, the palette, the vehicle sheets.
*
* Everywhere the selector page, except on the RIMIFY-Check: there the question stays on screen and its own selector opens
* (`aendern=1`, the wheel kept), so the car chosen answers the question instead of opening the listing (CHECK-16).
*/
function vehicleChangeHref(routeName, url) {
	if (routeName !== "check.index") return "/felgen-suchen";
	const [path = "/rimify-check", query = ""] = (url ?? "/rimify-check").split("?");
	const params = new URLSearchParams(query);
	for (const drop of [
		"fahrzeug",
		"marke",
		"modell"
	]) params.delete(drop);
	params.set("aendern", "1");
	return `${path}?${params.toString()}`;
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
var KEY = Symbol("consent");
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
	(0, vue_exports.provide)(KEY, store);
	return store;
}
function useConsent() {
	const store = (0, vue_exports.inject)(KEY);
	if (store === void 0) throw new Error("useConsent() needs provideConsent() in the layout");
	return store;
}
//#endregion
//#region resources/js/legal/cookies.ts
var BROWSER = "Du kannst die Cookies dieser Seite auch in deinem Browser löschen.";
var COOKIES = [
	{
		name: "rmf_vehicle",
		category: "Notwendig",
		stores: "Welches Fahrzeug du gewählt hast – nur seine Nummer in unserer Liste.",
		lifetime: "90 Tage",
		clear: `Es wird ersetzt, sobald du ein anderes Fahrzeug wählst. ${BROWSER}`
	},
	{
		name: "rmf_garage",
		category: "Notwendig",
		stores: "Die letzten fünf Fahrzeuge, die du gewählt hast, damit du schnell zurückwechseln kannst.",
		lifetime: "90 Tage",
		clear: BROWSER
	},
	{
		name: "rmf_consent",
		category: "Notwendig",
		stores: "Dass du diesen Hinweis gelesen hast, und wann.",
		lifetime: "12 Monate",
		clear: BROWSER
	},
	{
		name: "Sitzung und XSRF-TOKEN",
		category: "Notwendig",
		stores: "Deinen Warenkorb und den Schutz deiner Eingaben vor fremden Seiten.",
		lifetime: "120 Minuten",
		clear: `Sie verfallen von selbst. ${BROWSER}`
	},
	{
		name: "rmf_view",
		category: "Notwendig",
		stores: "Welche Ansicht ein Link für dich festgelegt hat – Telefon oder Desktop. Es wird nur gesetzt, wenn du einen Link mit „?view=mobile“ oder „?view=desktop“ öffnest; einen Schalter dafür gibt es im Shop nicht.",
		lifetime: "7 Tage",
		clear: `Ein Link mit „?view=auto“ löscht es. ${BROWSER}`
	},
	{
		name: "__stripe_mid, __stripe_sid",
		category: "Notwendig",
		stores: "Daten für den Betrugsschutz von Stripe, unserem Zahlungsdienst. Stripe setzt sie selbst, sobald du an der Kasse den Schritt „Zahlung“ öffnest – auch wenn du danach nicht bezahlst.",
		lifetime: "1 Jahr, 30 Minuten",
		clear: BROWSER
	},
	{
		name: "rmf_papiere",
		category: "Funktional",
		stores: "Die Werte, die du aus deiner Zulassungsbescheinigung einträgst – Achslasten (8.1, 8.2), Höchstgeschwindigkeit (T) und, wenn du sie angibst, Leistung (P.2) sowie Tragfähigkeits- und Geschwindigkeitsindex der Reifen (15.1, 15.2) –, für bis zu fünf Fahrzeuge; getrennt davon Karosserieform und Antriebsart, wenn wir danach fragen, ebenfalls für bis zu fünf. Ohne Namen, Kennzeichen oder Fahrgestellnummer.",
		lifetime: "1 Jahr",
		clear: `Beim Fahrzeug auf „Werte löschen“ tippen; Karosserieform und Antriebsart löscht „Meine Angaben zu Karosserieform und Antriebsart löschen“. ${BROWSER}`
	},
	{
		name: "rmf_geraet",
		category: "Funktional",
		stores: "Eine zufällige Kennung für diesen Browser und sonst nichts. Unser Schutz vor zu vielen Anfragen zählt nach ihr statt nach deiner IP-Adresse – so wirst du nicht mit anderen im selben Mobilfunknetz verwechselt.",
		lifetime: "1 Jahr",
		clear: `Lösch die Cookies für diese Seite in deinem Browser; beim nächsten Besuch entsteht eine neue, ebenso zufällige Kennung.`
	}
];
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
		/** The functional cookies by name, each with what it stores and how to clear it (Block G). */
		const FUNCTIONAL = COOKIES.filter((cookie) => cookie.category === "Funktional");
		const sheetVisible = (0, vue_exports.computed)(() => consent.decided.value === null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			if (sheetVisible.value) _push(`<section class="consent" aria-labelledby="consent-title" data-v-0ef19f9a><h2 id="consent-title" class="h4" data-v-0ef19f9a>Cookies bei RIMIFY</h2><p class="consent__text" data-v-0ef19f9a> Wir verwenden Cookies, die für den Shop nötig sind – für den Warenkorb und dein gewähltes Fahrzeug. <a href="/rechtliches/datenschutz" data-v-0ef19f9a>Mehr in der Datenschutzerklärung</a></p><div class="consent__actions" data-v-0ef19f9a><button class="btn btn--secondary" type="button" data-v-0ef19f9a>Verstanden</button></div></section>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: (0, vue_exports.unref)(consent).settingsOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(consent).settingsOpen.value = $event,
				title: "Cookie-Einstellungen",
				description: "Wir verwenden nur Cookies, die der Shop braucht oder die du selbst anlegst."
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-0ef19f9a${_scopeId}>Verstanden</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => (0, vue_exports.unref)(consent).acknowledge()
					}, "Verstanden", 8, ["onClick"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<ul class="consent__list" data-v-0ef19f9a${_scopeId}><li class="consent__row" data-v-0ef19f9a${_scopeId}><p class="consent__name" data-v-0ef19f9a${_scopeId}>Notwendig</p><span class="small quiet consent__state" data-v-0ef19f9a${_scopeId}>Immer aktiv</span><p class="small muted consent__what" data-v-0ef19f9a${_scopeId}>Warenkorb, gewähltes Fahrzeug, Sitzung und deine Cookie-Auswahl.</p></li><li class="consent__row" data-v-0ef19f9a${_scopeId}><p class="consent__name" data-v-0ef19f9a${_scopeId}>Funktional</p><span class="small quiet consent__state" data-v-0ef19f9a${_scopeId}>Einzeln erklärt</span><dl class="consent__cookies" data-v-0ef19f9a${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(FUNCTIONAL), (cookie) => {
							_push(`<div class="consent__cookie" data-v-0ef19f9a${_scopeId}><dt class="small consent__cookie-name" data-v-0ef19f9a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cookie.name)} <span class="quiet" data-v-0ef19f9a${_scopeId}>· ${(0, server_renderer_exports.ssrInterpolate)(cookie.lifetime)}</span></dt><dd class="small muted" data-v-0ef19f9a${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cookie.stores)}</dd><dd class="small muted" data-v-0ef19f9a${_scopeId}><span class="consent__clear" data-v-0ef19f9a${_scopeId}>Löschen:</span> ${(0, server_renderer_exports.ssrInterpolate)(cookie.clear)}</dd></div>`);
						});
						_push(`<!--]--></dl></li></ul><p class="small muted" data-v-0ef19f9a${_scopeId}> Alle Cookies mit Laufzeit stehen in der <a href="/rechtliches/datenschutz#cookies" data-v-0ef19f9a${_scopeId}>Datenschutzerklärung</a>. </p>`);
					} else return [(0, vue_exports.createVNode)("ul", { class: "consent__list" }, [(0, vue_exports.createVNode)("li", { class: "consent__row" }, [
						(0, vue_exports.createVNode)("p", { class: "consent__name" }, "Notwendig"),
						(0, vue_exports.createVNode)("span", { class: "small quiet consent__state" }, "Immer aktiv"),
						(0, vue_exports.createVNode)("p", { class: "small muted consent__what" }, "Warenkorb, gewähltes Fahrzeug, Sitzung und deine Cookie-Auswahl.")
					]), (0, vue_exports.createVNode)("li", { class: "consent__row" }, [
						(0, vue_exports.createVNode)("p", { class: "consent__name" }, "Funktional"),
						(0, vue_exports.createVNode)("span", { class: "small quiet consent__state" }, "Einzeln erklärt"),
						(0, vue_exports.createVNode)("dl", { class: "consent__cookies" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(FUNCTIONAL), (cookie) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: cookie.name,
								class: "consent__cookie"
							}, [
								(0, vue_exports.createVNode)("dt", { class: "small consent__cookie-name" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(cookie.name) + " ", 1), (0, vue_exports.createVNode)("span", { class: "quiet" }, "· " + (0, vue_exports.toDisplayString)(cookie.lifetime), 1)]),
								(0, vue_exports.createVNode)("dd", { class: "small muted" }, (0, vue_exports.toDisplayString)(cookie.stores), 1),
								(0, vue_exports.createVNode)("dd", { class: "small muted" }, [(0, vue_exports.createVNode)("span", { class: "consent__clear" }, "Löschen:"), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(cookie.clear), 1)])
							]);
						}), 128))])
					])]), (0, vue_exports.createVNode)("p", { class: "small muted" }, [
						(0, vue_exports.createTextVNode)(" Alle Cookies mit Laufzeit stehen in der "),
						(0, vue_exports.createVNode)("a", { href: "/rechtliches/datenschutz#cookies" }, "Datenschutzerklärung"),
						(0, vue_exports.createTextVNode)(". ")
					])];
				}),
				_: 1
			}, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/CookieConsent.vue
var _sfc_setup$13 = CookieConsent_vue_vue_type_script_setup_true_lang_default.setup;
CookieConsent_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CookieConsent.vue");
	return _sfc_setup$13 ? _sfc_setup$13(props, ctx) : void 0;
};
var CookieConsent_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CookieConsent_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0ef19f9a"]]);
//#endregion
//#region resources/js/composables/usePriceTerms.ts
/**
* How every price on the site is qualified, in one place — so the seller's Kleinunternehmer flag (§ 19 UStG, shared
* as `smallBusiness`) changes them all together, with the invoice and the order summaries (App\Support\Seller).
*
* Standard: the prices contain 19 % VAT, and the summaries name the VAT in them. A Kleinunternehmer charges none:
* the prices are final, no summary has a VAT line, and the notes say why.
*
* A component mounted without an Inertia page (a unit test, a story) reads the standard terms.
*/
var STANDARD_TERMS = {
	smallBusiness: false,
	note: "inkl. MwSt., zzgl. Versandkosten",
	footer: "Alle Preise inkl. MwSt., zzgl. Versandkosten."
};
var SMALL_BUSINESS_TERMS = {
	smallBusiness: true,
	note: "zzgl. Versandkosten, keine MwSt. nach §\xA019 UStG",
	footer: "Alle Preise zzgl. Versandkosten. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
};
function priceTerms(smallBusiness) {
	return smallBusiness ? SMALL_BUSINESS_TERMS : STANDARD_TERMS;
}
/**
* The line under a total: the VAT it contains and the shipping — or, for a Kleinunternehmer, no VAT at all.
* `shippingOpen` while the client has not named the shipping price.
*/
function totalNote(smallBusiness, tax, shippingOpen) {
	if (smallBusiness) return shippingOpen ? "Versandkosten werden noch festgelegt · keine MwSt. nach §\xA019 UStG" : "inkl. Versand, keine MwSt. nach §\xA019 UStG";
	return shippingOpen ? `inkl. ${tax} MwSt. · Versandkosten werden noch festgelegt` : `inkl. ${tax} MwSt. und Versand`;
}
function usePriceTerms() {
	let page = null;
	try {
		page = usePage();
	} catch {
		page = null;
	}
	return (0, vue_exports.computed)(() => priceTerms(page?.props?.smallBusiness === true));
}
//#endregion
//#region resources/js/Components/Chrome/AddedPanel.vue?vue&type=script&setup=true&lang.ts
var ADDED_MS = 1e4;
var AddedPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AddedPanel",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The panel after an add (the client's #16): what was just put in the basket — the line at the amount added and that
		* amount's price, for a mixed set its two axles — the basket's count and subtotal as they now stand, „Weiter
		* einkaufen“ and „Zum Warenkorb“. Every figure is the server's (WarenkorbController → Basket::added, R-10).
		*
		* A dialog the size of a card, never the screen's (the operator's brief „THE 34“, #16, superseding D-129's „no focus
		* trap“): it takes the focus when it opens, so a keyboard user is where the next step is rather than deep in the page
		* below it; Tab and Shift+Tab stay among its three controls; Escape, × and „Weiter einkaufen“ close it and give the focus
		* back to the button the add came from. Nothing blocks: there is no overlay, a click anywhere else closes it, and it
		* never closes by itself while the focus is in it — on a pointer's leave it goes after ten seconds. Its name is its
		* heading and its description the subtotal, read once when the focus arrives. The toast stays quiet for an add that
		* brought this panel, so there is one confirmation, not two.
		*
		* Like the toast it listens for server responses, so the second add in a row shows again and a page restored by the
		* back button does not replay an old one.
		*/
		const terms = usePriceTerms();
		/** Long enough to read the line and the total twice; the clock stops while the panel is being used. */
		const page = usePage();
		const added = (0, vue_exports.ref)(null);
		const panel = (0, vue_exports.useTemplateRef)("panel");
		const id = (0, vue_exports.useId)();
		let shownPath = null;
		let timer;
		let stopSuccess;
		let stopNavigate;
		function pathOf(url) {
			return url.split("?")[0]?.split("#")[0] ?? url;
		}
		function pause() {
			if (timer !== void 0) {
				clearTimeout(timer);
				timer = void 0;
			}
		}
		function arm() {
			pause();
			timer = setTimeout(close, ADDED_MS);
		}
		function open(next, url) {
			if (next === null) return;
			if (added.value === null) returnFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
			added.value = next;
			shownPath = pathOf(url);
			arm();
			(0, vue_exports.nextTick)(() => panel.value?.focus({ preventScroll: true }));
		}
		let returnFocus = null;
		function close() {
			const inside = panel.value?.contains(document.activeElement) ?? false;
			added.value = null;
			shownPath = null;
			pause();
			if (inside && returnFocus?.isConnected) returnFocus.focus();
		}
		function onPointerDown(event) {
			if (added.value !== null && event.target instanceof Node && !(panel.value?.contains(event.target) ?? false)) {
				returnFocus = null;
				close();
			}
		}
		function onKeydown(event) {
			const other = [...document.querySelectorAll("[role=\"dialog\"][aria-modal=\"true\"]")].some((d) => d !== panel.value);
			if (event.key === "Escape" && added.value !== null && !other) close();
		}
		(0, vue_exports.onMounted)(() => {
			const entry = performance.getEntriesByType?.("navigation")[0];
			if (firstLoad("added") && entry?.type !== "back_forward") open(addedFrom(page.props), page.url);
			stopSuccess = router.on("success", (event) => open(addedFrom(event.detail.page.props), event.detail.page.url));
			stopNavigate = router.on("navigate", (event) => {
				if (shownPath !== null && pathOf(event.detail.page.url) !== shownPath) close();
			});
			document.addEventListener("keydown", onKeydown);
			document.addEventListener("pointerdown", onPointerDown, true);
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			stopSuccess?.();
			stopNavigate?.();
			document.removeEventListener("keydown", onKeydown);
			document.removeEventListener("pointerdown", onPointerDown, true);
			pause();
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "addp-viewport" }, _attrs))} data-v-ae359fb8>`);
			if (added.value) {
				_push(`<section class="addp" role="dialog" aria-modal="true" tabindex="-1"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${(0, vue_exports.unref)(id)}-title`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(id)}-sum`)} data-v-ae359fb8><div class="addp__head" data-v-ae359fb8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check-circle",
					size: 20,
					class: "addp__mark"
				}, null, _parent));
				_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-title`)} class="addp__title" data-v-ae359fb8>${(0, server_renderer_exports.ssrInterpolate)(added.value.heading)}</p><button class="icon-btn addp__close" type="button" aria-label="Schließen" data-v-ae359fb8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "close",
					size: 20
				}, null, _parent));
				_push(`</button></div><ul class="addp__lines" data-v-ae359fb8><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(added.value.lines, (line, i) => {
					_push(`<li class="addp__line" data-v-ae359fb8><span class="addp__name" data-v-ae359fb8><span class="num" data-v-ae359fb8>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} ×</span> <span translate="no" data-v-ae359fb8>${(0, server_renderer_exports.ssrInterpolate)(line.title)}</span></span><span class="addp__price num" translate="no" data-v-ae359fb8>${(0, server_renderer_exports.ssrInterpolate)(line.price)}</span><span class="addp__detail" data-v-ae359fb8>${(0, server_renderer_exports.ssrInterpolate)(line.detail)}</span></li>`);
				});
				_push(`<!--]--></ul><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-sum`)} class="addp__sum" data-v-ae359fb8><span data-v-ae359fb8>Zwischensumme im Warenkorb <span class="num addp__count" data-v-ae359fb8>(${(0, server_renderer_exports.ssrInterpolate)(added.value.count)} Stück)</span></span><span class="num addp__sum-value" translate="no" data-v-ae359fb8>${(0, server_renderer_exports.ssrInterpolate)(added.value.subtotal)}</span></p><p class="price-legal" data-v-ae359fb8>Alle Preise ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(terms).note)}.</p><div class="addp__go" data-v-ae359fb8><button class="btn btn--secondary addp__btn" type="button" data-v-ae359fb8>Weiter einkaufen</button>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "btn btn--primary addp__btn",
					href: "/warenkorb"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zum Warenkorb`);
						else return [(0, vue_exports.createTextVNode)("Zum Warenkorb")];
					}),
					_: 1
				}, _parent));
				_push(`</div></section>`);
			} else _push(`<!---->`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/AddedPanel.vue
var _sfc_setup$12 = AddedPanel_vue_vue_type_script_setup_true_lang_default.setup;
AddedPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/AddedPanel.vue");
	return _sfc_setup$12 ? _sfc_setup$12(props, ctx) : void 0;
};
var AddedPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AddedPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ae359fb8"]]);
//#endregion
//#region resources/js/Components/Chrome/CanonicalLink.vue?vue&type=script&setup=true&lang.ts
var CanonicalLink_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CanonicalLink",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The page's one address (the client's #8): the server writes it — the shop's own host, the car as its key numbers,
		* the filters as the page has them (HandleInertiaRequests::address) — and this puts it in the head, in the server's
		* first frame as on every later visit.
		*/
		const shared = useShared();
		const href = (0, vue_exports.computed)(() => typeof shared.value.canonical === "string" && shared.value.canonical !== "" ? shared.value.canonical : null);
		return (_ctx, _push, _parent, _attrs) => {
			if (href.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), _attrs, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<link rel="canonical"${(0, server_renderer_exports.ssrRenderAttr)("href", href.value)} head-key="canonical"${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("link", {
						rel: "canonical",
						href: href.value,
						"head-key": "canonical"
					}, null, 8, ["href"])];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/CanonicalLink.vue
var _sfc_setup$11 = CanonicalLink_vue_vue_type_script_setup_true_lang_default.setup;
CanonicalLink_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CanonicalLink.vue");
	return _sfc_setup$11 ? _sfc_setup$11(props, ctx) : void 0;
};
var CanonicalLink_default = CanonicalLink_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Chrome/PreviewRibbon.vue?vue&type=script&setup=true&lang.ts
var PreviewRibbon_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PreviewRibbon",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The test environment's one line: above the header, on the staging copy only, saying what the page is — slim and in
		* the flow, so it covers nothing and the design under it is the one being judged. „Ausblenden" puts it away at once and
		* remembers that in the browser (`rmf_vorschau`); the server reads it, so the next page's first frame has no ribbon
		* either (App\Support\PreviewRibbon, R-08). The live shop never shows it.
		*/
		const shared = useShared();
		const away = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			if ((0, vue_exports.unref)(shared).previewRibbon && !away.value) _push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "preview-ribbon",
				role: "note",
				"aria-label": "Hinweis zur Vorschau"
			}, _attrs))} data-v-de532814><p class="preview-ribbon__text" data-v-de532814><strong data-v-de532814>Vorschau</strong> — Testumgebung. Es werden keine echten Bestellungen ausgeführt.</p><button class="preview-ribbon__away" type="button" data-v-de532814>Ausblenden</button></div>`);
			else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/PreviewRibbon.vue
var _sfc_setup$10 = PreviewRibbon_vue_vue_type_script_setup_true_lang_default.setup;
PreviewRibbon_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/PreviewRibbon.vue");
	return _sfc_setup$10 ? _sfc_setup$10(props, ctx) : void 0;
};
var PreviewRibbon_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PreviewRibbon_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-de532814"]]);
//#endregion
//#region resources/js/lib/contact.ts
function contactHref(fields = {}) {
	const params = new URLSearchParams();
	if (fields.subject) params.set("betreff", fields.subject.slice(0, 150));
	if (fields.from && fields.from.startsWith("/") && !fields.from.startsWith("//") && !/^\/kontakt(?:[/?#]|$)/.test(fields.from)) params.set("von", fields.from);
	const query = params.toString();
	return query === "" ? "/kontakt" : `/kontakt?${query}`;
}
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
		const terms = usePriceTerms();
		const menus = useMenus();
		useConsent();
		useShell();
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const page = usePage();
		const writeHref = (0, vue_exports.computed)(() => contactHref({ from: page.url }));
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? "").replace(/\s/g, "")}`);
		const waHref = (0, vue_exports.computed)(() => `https://wa.me/${(contact.value.whatsapp ?? "").replace(/[^\d]/g, "")}`);
		const year = (/* @__PURE__ */ new Date()).getFullYear();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<footer${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "footer dark" }, _attrs))} data-v-3c5041d2><div class="container" data-v-3c5041d2><div class="footer__grid" data-v-3c5041d2><div class="footer__brand" data-v-3c5041d2><span class="brand" data-v-3c5041d2>RIMIFY</span><p class="footer__claim" data-v-3c5041d2>Felgen, deren Gutachten dein Fahrzeug nennt.</p><ul class="footer__contact" data-v-3c5041d2>`);
			if (contact.value.phone) {
				_push(`<li data-v-3c5041d2><a${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} class="footer__contact-link num" data-v-3c5041d2>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a></li>`);
			} else _push(`<!---->`);
			if (contact.value.whatsapp) _push(`<li data-v-3c5041d2><a${(0, server_renderer_exports.ssrRenderAttr)("href", waHref.value)} class="footer__contact-link num" rel="noopener" target="_blank" data-v-3c5041d2><span class="footer__icon-slot" aria-hidden="true" data-v-3c5041d2></span>WhatsApp ${(0, server_renderer_exports.ssrInterpolate)(contact.value.whatsapp)}</a></li>`);
			else _push(`<!---->`);
			_push(`<li data-v-3c5041d2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: writeHref.value,
				class: "footer__contact-link"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "mail",
							size: 20
						}, null, _parent, _scopeId));
						_push(`${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}`);
					} else return [(0, vue_exports.createVNode)(Icon_default, {
						name: "mail",
						size: 20
					}), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(contact.value.email), 1)];
				}),
				_: 1
			}, _parent));
			_push(`</li><li class="footer__hours" data-v-3c5041d2>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "clock",
				size: 20
			}, null, _parent));
			_push(`${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</li></ul></div><nav class="footer__col" aria-labelledby="ftr-shop" data-v-3c5041d2><p id="ftr-shop" class="footer__title" data-v-3c5041d2>Shop</p><ul data-v-3c5041d2><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_shop, (item) => {
				_push(`<li data-v-3c5041d2>`);
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
			_push(`<!--]--></ul></nav><nav class="footer__col" aria-labelledby="ftr-service" data-v-3c5041d2><p id="ftr-service" class="footer__title" data-v-3c5041d2>Service</p><ul data-v-3c5041d2><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_service, (item) => {
				_push(`<li data-v-3c5041d2>`);
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
			_push(`<!--]--><li class="footer__keys" data-v-3c5041d2><button class="footer__link footer__button" type="button" data-v-3c5041d2>Tastenkürzel</button></li></ul></nav><nav class="footer__col" aria-labelledby="ftr-legal" data-v-3c5041d2><p id="ftr-legal" class="footer__title" data-v-3c5041d2>Rechtliches</p><ul data-v-3c5041d2><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_legal, (item) => {
				_push(`<li data-v-3c5041d2>`);
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
			_push(`<!--]--><li data-v-3c5041d2><button class="footer__link footer__button" type="button" data-v-3c5041d2>Cookie-Einstellungen</button></li></ul></nav></div><div class="footer__base" data-v-3c5041d2><span data-v-3c5041d2>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(terms).footer)}</span><span class="num" data-v-3c5041d2>© RIMIFY ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(year))}</span>`);
			if ((0, vue_exports.unref)(shared).release) _push(`<span class="num footer__release" data-release data-v-3c5041d2>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).release)}</span>`);
			else _push(`<!---->`);
			_push(`</div></div><span id="seitenende" hidden data-v-3c5041d2></span></footer>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/SiteFooter.vue
var _sfc_setup$9 = SiteFooter_vue_vue_type_script_setup_true_lang_default.setup;
SiteFooter_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SiteFooter.vue");
	return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var SiteFooter_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SiteFooter_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3c5041d2"]]);
//#endregion
//#region resources/js/Components/Chrome/CartButton.vue?vue&type=script&setup=true&lang.ts
var CartButton_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CartButton",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The basket in a phone header, left of the menu (the client's #13, D-122): the cart icon with the number of items in
		* it, the same count the desktop header shows. Its name says the number, so it is heard as well as seen; the badge
		* itself is hidden from assistive technology.
		*/
		const shared = useShared();
		const count = (0, vue_exports.computed)(() => shared.value.cartCount ?? 0);
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), (0, vue_exports.mergeProps)({
				href: "/warenkorb",
				class: "icon-btn cart-btn",
				"aria-label": count.value > 0 ? `Warenkorb, ${count.value} Artikel` : "Warenkorb",
				prefetch: ""
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "cart",
							size: 24
						}, null, _parent, _scopeId));
						if (count.value > 0) _push(`<span class="badge badge--count cart-btn__n" aria-hidden="true" data-v-99850be3${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(count.value)}</span>`);
						else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)(Icon_default, {
						name: "cart",
						size: 24
					}), count.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
						key: 0,
						class: "badge badge--count cart-btn__n",
						"aria-hidden": "true"
					}, (0, vue_exports.toDisplayString)(count.value), 1)) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/CartButton.vue
var _sfc_setup$8 = CartButton_vue_vue_type_script_setup_true_lang_default.setup;
CartButton_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CartButton.vue");
	return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var CartButton_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CartButton_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-99850be3"]]);
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
var _sfc_setup$7 = DemoBadge_vue_vue_type_script_setup_true_lang_default.setup;
DemoBadge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/DemoBadge.vue");
	return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
var DemoBadge_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DemoBadge_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f0da4095"]]);
//#endregion
//#region resources/js/Components/Chrome/MainMenu.vue?vue&type=script&setup=true&lang.ts
var MainMenu_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "MainMenu",
	__ssrInlineRender: true,
	props: { countOnButton: {
		type: Boolean,
		default: true
	} },
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
		const props = __props;
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
							"aria-label": props.countOnButton && cartCount.value > 0 ? `Menü, ${cartCount.value} Artikel im Warenkorb` : "Menü"
						}), {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
										name: "menu",
										size: 24
									}, null, _parent, _scopeId));
									if (props.countOnButton && cartCount.value > 0) _push(`<span class="badge badge--count mainmenu__badge" aria-hidden="true" data-v-834fe2b4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cartCount.value)}</span>`);
									else _push(`<!---->`);
								} else return [(0, vue_exports.createVNode)(Icon_default, {
									name: "menu",
									size: 24
								}), props.countOnButton && cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
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
																	_push(`<span class="mainmenu__label" data-v-834fe2b4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</span>`);
																	if (item.isCart && cartCount.value > 0) _push(`<span class="badge badge--count mainmenu__count" data-v-834fe2b4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(cartCount.value)}</span>`);
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
						"aria-label": props.countOnButton && cartCount.value > 0 ? `Menü, ${cartCount.value} Artikel im Warenkorb` : "Menü"
					}), {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
							name: "menu",
							size: 24
						}), props.countOnButton && cartCount.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
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
var _sfc_setup$6 = MainMenu_vue_vue_type_script_setup_true_lang_default.setup;
MainMenu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/MainMenu.vue");
	return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var MainMenu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(MainMenu_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-834fe2b4"]]);
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
																						if (_push) _push(`<span class="num"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</span><span class="small quiet num"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatNumber)(size.count ?? 0))} ${(0, server_renderer_exports.ssrInterpolate)(size.count === 1 ? "Modell" : "Modelle")}</span>`);
																						else return [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(size.count ?? 0)) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)];
																					}),
																					_: 2
																				}, _parent, _scopeId));
																				else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																					href: size.href,
																					class: "mega__link",
																					prefetch: ""
																				}, {
																					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(size.count ?? 0)) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
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
																	_push(`<!--]--></ul></div><div class="mega__col"${_scopeId}><p class="label"${_scopeId}>Günstigste Modelle</p><ul${_scopeId}><!--[-->`);
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
																				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(size.count ?? 0)) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
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
																		(0, vue_exports.createVNode)("p", { class: "label" }, "Günstigste Modelle"),
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
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(size.count ?? 0)) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
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
															(0, vue_exports.createVNode)("p", { class: "label" }, "Günstigste Modelle"),
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
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(size.count ?? 0)) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
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
													(0, vue_exports.createVNode)("p", { class: "label" }, "Günstigste Modelle"),
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
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "num" }, (0, vue_exports.toDisplayString)(size.label), 1), (0, vue_exports.createVNode)("span", { class: "small quiet num" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatNumber)(size.count ?? 0)) + " " + (0, vue_exports.toDisplayString)(size.count === 1 ? "Modell" : "Modelle"), 1)]),
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
											(0, vue_exports.createVNode)("p", { class: "label" }, "Günstigste Modelle"),
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
var _sfc_setup$5 = MegaMenu_vue_vue_type_script_setup_true_lang_default.setup;
MegaMenu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/MegaMenu.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var MegaMenu_default = MegaMenu_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/@vueuse/shared/dist/index.js
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
//#region ../../xampp/htdocs/rimify/node_modules/@vueuse/core/dist/index.js
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
				if (input.value === null || input.value.getClientRects().length === 0) {
					shell.paletteOpen.value = true;
					return;
				}
				input.value.focus();
				input.value.select();
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
			}, _attrs))} data-v-267c1af1><div class="input-group" data-v-267c1af1><span class="input-group__icon" data-v-267c1af1>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`</span><input${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input sbox__input" type="search" role="combobox" aria-label="Suche" aria-autocomplete="list" aria-controls="sbox-list"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", listVisible.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-activedescendant", activeId.value)} placeholder="Felge, Marke oder Größe" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" data-v-267c1af1>`);
			if (query.value === "") _push(`<kbd class="kbd sbox__hint" aria-hidden="true" data-v-267c1af1>/</kbd>`);
			else _push(`<!---->`);
			_push(`</div><div id="sbox-list" class="popover sbox__list" role="listbox" aria-label="Vorschläge" style="${(0, server_renderer_exports.ssrRenderStyle)(listVisible.value ? null : { display: "none" })}" data-v-267c1af1><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(grouped.value, (group) => {
				_push(`<!--[--><p class="menu__label" role="presentation" data-v-267c1af1>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p><!--[-->`);
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
								_push(`<span class="sbox__label" data-v-267c1af1${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(parts(row.label), (part, i) => {
									_push(`<!--[-->`);
									if (part.hit) _push(`<mark class="sbox__hit" data-v-267c1af1${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(part.text)}</mark>`);
									else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(part.text)}<!--]-->`);
									_push(`<!--]-->`);
								});
								_push(`<!--]--></span>`);
								if (row.sub) _push(`<span class="small quiet" data-v-267c1af1${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.sub)}</span>`);
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
				_push(`<!--[--><p class="menu__label" role="presentation" data-v-267c1af1>Zuletzt gesucht</p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(recent.value, (term) => {
					_push(`<button class="menu__item" type="button" tabindex="-1" data-v-267c1af1>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "clock",
						size: 20
					}, null, _parent));
					_push(` ${(0, server_renderer_exports.ssrInterpolate)(term)}</button>`);
				});
				_push(`<!--]--><!--]-->`);
			} else _push(`<!---->`);
			if (empty.value) {
				_push(`<p class="sbox__empty" data-v-267c1af1> Nichts gefunden für „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“. `);
				if ((0, vue_exports.unref)(search).result.value?.suggestion) _push(`<button class="link" type="button" data-v-267c1af1> Meintest du „${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(search).result.value?.suggestion)}“? </button>`);
				else _push(`<!--[-->Versuch es mit einer Marke oder einer Größe, zum Beispiel „19 Zoll“ oder „8,5J“.<!--]-->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			if ((0, vue_exports.unref)(search).failed.value) _push(`<p class="sbox__empty" data-v-267c1af1>Die Suche ist gerade nicht erreichbar.</p>`);
			else _push(`<!---->`);
			_push(`</div></form>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/SearchBox.vue
var _sfc_setup$4 = SearchBox_vue_vue_type_script_setup_true_lang_default.setup;
SearchBox_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SearchBox.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var SearchBox_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SearchBox_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-267c1af1"]]);
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
		const changeHref = useVehicleChangeHref();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const mode = (0, vue_exports.computed)(() => shared.value.headerMode);
		const shown = (0, vue_exports.computed)(() => vehicle.value !== null && (mode.value === "WHITE_BOX" || mode.value === "BLUE_BAR"));
		return (_ctx, _push, _parent, _attrs) => {
			if (shown.value && vehicle.value) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "vbar" }, _attrs))} data-v-851043e6><div class="container vbar__row" data-v-851043e6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "car",
					size: 20
				}, null, _parent));
				_push(`<p class="vbar__text" data-v-851043e6><span class="vbar__lead" data-v-851043e6>Dein Fahrzeug:</span><span class="vbar__name" data-v-851043e6>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</span><span class="vbar__meta num" data-v-851043e6>· ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? `${vehicle.value.buildWindow} · ${vehicle.value.keyNumbers}`)}</span></p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: (0, vue_exports.unref)(changeHref),
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
var _sfc_setup$3 = VehicleBar_vue_vue_type_script_setup_true_lang_default.setup;
VehicleBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/VehicleBar.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var VehicleBar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehicleBar_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-851043e6"]]);
//#endregion
//#region resources/js/Components/Chrome/SiteHeader.vue?vue&type=script&setup=true&lang.ts
var SiteHeader_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SiteHeader",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The header. Nothing above it (the client's #3, D-107); 80px on a desktop (the client's #2, D-106),
		* sticky, and never changes height — once the page has scrolled under it, it gains a hairline and
		* nothing else. On a phone it is 56px: the wordmark, then the search, the vehicle and the menu,
		* which carries the destinations a desktop shows in the navigation, and the basket with its count.
		*
		* Two rules it never breaks: the navigation is never removed, and the chosen vehicle is one
		* element in one place on every route (the vehicle bar beneath, decided by the server — R-08).
		*
		* While the shop shows demonstration rows, the *Demodaten* badge (ACCURACY D4) follows the wordmark
		* at every width. It sits in the flow of the row, so it cannot cover content at any width.
		*/
		const shared = useShared();
		useShell();
		const changeHref = useVehicleChangeHref();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const page = usePage();
		const onBasket = (0, vue_exports.computed)(() => /^\/warenkorb(\/|\?|$)/.test(page.url));
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
			_push(`<!--[--><div class="sh-sentinel" aria-hidden="true" data-v-d9f00b63></div><header class="${(0, server_renderer_exports.ssrRenderClass)([{ "site-header--scrolled": scrolled.value }, "site-header"])}" data-v-d9f00b63><div class="container sh__bar" data-v-d9f00b63><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "sh__mark--demo": (0, vue_exports.unref)(shared).demoBadge === true }, "sh__mark"])}" data-v-d9f00b63>`);
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
			_push((0, server_renderer_exports.ssrRenderComponent)(DemoBadge_default, { class: "sh__demo" }, null, _parent));
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(MegaMenu_default, { class: "from-lg sh__nav" }, null, _parent));
			_push(`<div class="sh__tools" data-v-d9f00b63>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SearchBox_default, { class: "from-lg sh__search" }, null, _parent));
			_push(`<button class="icon-btn sh__search-icon" type="button" aria-label="Suche" data-v-d9f00b63>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 24
			}, null, _parent));
			_push(`</button>`);
			if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "chip chip--on sh__vchip from-lg" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
										name: "car",
										size: 20
									}, null, _parent, _scopeId));
									_push(`<span class="sh__vname" data-v-d9f00b63${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)}</span>`);
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
											_push(`<p class="menu__label num" data-v-d9f00b63${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)} · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? vehicle.value.keyNumbers)}</p>`);
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
														href: (0, vue_exports.unref)(changeHref),
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
														href: (0, vue_exports.unref)(changeHref),
														class: "menu__item"
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
															name: "car",
															size: 20
														}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
														_: 1
													}, 8, ["href"])];
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
											(0, vue_exports.createVNode)("p", { class: "menu__label num" }, (0, vue_exports.toDisplayString)(vehicle.value.label) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.approval ?? vehicle.value.keyNumbers), 1),
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
													href: (0, vue_exports.unref)(changeHref),
													class: "menu__item"
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
														name: "car",
														size: 20
													}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
													_: 1
												}, 8, ["href"])]),
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
										(0, vue_exports.createVNode)("p", { class: "menu__label num" }, (0, vue_exports.toDisplayString)(vehicle.value.label) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.approval ?? vehicle.value.keyNumbers), 1),
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
												href: (0, vue_exports.unref)(changeHref),
												class: "menu__item"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
													name: "car",
													size: 20
												}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
												_: 1
											}, 8, ["href"])]),
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
					} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "chip chip--on sh__vchip from-lg" }, {
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
								(0, vue_exports.createVNode)("p", { class: "menu__label num" }, (0, vue_exports.toDisplayString)(vehicle.value.label) + " · " + (0, vue_exports.toDisplayString)(vehicle.value.approval ?? vehicle.value.keyNumbers), 1),
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
										href: (0, vue_exports.unref)(changeHref),
										class: "menu__item"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
											name: "car",
											size: 20
										}), (0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
										_: 1
									}, 8, ["href"])]),
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
			_push(`<button class="icon-btn until-lg" type="button" aria-label="Suche" data-v-d9f00b63>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 24
			}, null, _parent));
			_push(`</button>`);
			if (vehicle.value) {
				_push(`<button class="icon-btn until-lg sh__vicon" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Dein Fahrzeug: ${vehicle.value.label}`)} data-v-d9f00b63>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "car",
					size: 24
				}, null, _parent));
				_push(`<span class="sh__dot" aria-hidden="true" data-v-d9f00b63></span></button>`);
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
			_push((0, server_renderer_exports.ssrRenderComponent)(CartButton_default, {
				class: "until-lg",
				"aria-current": onBasket.value ? "page" : void 0
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(MainMenu_default, {
				class: "until-lg",
				"count-on-button": false
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/warenkorb",
				class: "sh__cart from-lg",
				"aria-label": (0, vue_exports.unref)(shared).cartCount > 0 ? `Warenkorb, ${(0, vue_exports.unref)(shared).cartCount} Artikel` : "Warenkorb",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<span class="sh__cart-icon" data-v-d9f00b63${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "cart",
							size: 24
						}, null, _parent, _scopeId));
						if ((0, vue_exports.unref)(shared).cartCount > 0) _push(`<span class="badge badge--count sh__badge" aria-hidden="true" data-v-d9f00b63${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).cartCount)}</span>`);
						else _push(`<!---->`);
						_push(`</span><span class="sh__cart-label" data-v-d9f00b63${_scopeId}>Warenkorb</span>`);
					} else return [(0, vue_exports.createVNode)("span", { class: "sh__cart-icon" }, [(0, vue_exports.createVNode)(Icon_default, {
						name: "cart",
						size: 24
					}), (0, vue_exports.unref)(shared).cartCount > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
						key: 0,
						class: "badge badge--count sh__badge",
						"aria-hidden": "true"
					}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(shared).cartCount), 1)) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("span", { class: "sh__cart-label" }, "Warenkorb")];
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
var _sfc_setup$2 = SiteHeader_vue_vue_type_script_setup_true_lang_default.setup;
SiteHeader_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SiteHeader.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var SiteHeader_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SiteHeader_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d9f00b63"]]);
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
//#region resources/js/composables/useShopFeedback.ts
/**
* The review's feedback button on the shop's pages (D-142), for a signed-in admin while the review is on. The server
* decides whether there is one (`reviewer`); the page loads it once it is awake, and never draws it on the server.
*
* Drawn on the server and loaded on demand, it had to be hydrated when its code arrived — and on a slow host a page the
* visitor had already left tried to hydrate a button whose code the browser had stopped fetching: „Hydration completed
* but contains mismatches“ in Safari (#23's iPhone pass on the preview, 16.10.2026; D-255). Mounted after hydration there
* is nothing to match, and a load the page's own departure cut off is said nowhere: the button belonged to the page
* that is gone. Its code still never reaches a visitor.
*/
function useShopFeedback(reviewer) {
	const component = (0, vue_exports.shallowRef)(null);
	function load() {
		if (component.value !== null) return;
		import("./ShopFeedback-CZPwxchm.js").then((module) => {
			component.value = module.default;
		}).catch(() => void 0);
	}
	(0, vue_exports.onMounted)(() => {
		(0, vue_exports.watch)(reviewer, (yes) => {
			if (yes) load();
		}, { immediate: true });
	});
	return component;
}
//#endregion
export { remember as C, readRecent as S, useShared as T, provideConsent as _, WheelOutline_default as a, provideShell as b, contactHref as c, AddedPanel_default as d, priceTerms as f, COOKIES as g, CookieConsent_default as h, useCompare as i, PreviewRibbon_default as l, usePriceTerms as m, useShortcuts as n, SiteHeader_default as o, totalNote as p, CompareTray_default as r, SiteFooter_default as s, useShopFeedback as t, CanonicalLink_default as u, useVehicleChangeHref as v, useSearch as w, useShell as x, claimBottomEdge as y };
