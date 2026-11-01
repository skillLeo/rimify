import { D as getActiveElement, c as useHideOthers, d as useBodyScrollLock, g as useVModel, i as Primitive, l as useForwardExpose, n as FocusScope_default, o as Presence_default, r as DismissableLayer_default, s as useId, t as Teleport_default, u as useEmitAsProps } from "./Teleport-DdShbR7N.js";
import { n as createContext, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogRoot.js
var [injectDialogRootContext, provideDialogRootContext] = /*#__PURE__*/ createContext("DialogRoot");
var DialogRoot_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "DialogRoot",
	props: {
		open: {
			type: Boolean,
			required: false,
			default: void 0
		},
		defaultOpen: {
			type: Boolean,
			required: false,
			default: false
		},
		modal: {
			type: Boolean,
			required: false,
			default: true
		},
		unmountOnHide: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	emits: ["update:open"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const open = useVModel(props, "open", __emit, {
			defaultValue: props.defaultOpen,
			passive: props.open === void 0
		});
		const triggerElement = (0, vue_exports.ref)();
		const contentElement = (0, vue_exports.ref)();
		const { modal, unmountOnHide } = (0, vue_exports.toRefs)(props);
		provideDialogRootContext({
			open,
			modal,
			unmountOnHide,
			openModal: () => {
				open.value = true;
			},
			onOpenChange: (value) => {
				open.value = value;
			},
			onOpenToggle: () => {
				open.value = !open.value;
			},
			contentId: "",
			titleId: "",
			descriptionId: "",
			triggerElement,
			contentElement
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.renderSlot)(_ctx.$slots, "default", {
				open: (0, vue_exports.unref)(open),
				close: () => open.value = false
			});
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogClose.js
var DialogClose_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogClose",
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
		const rootContext = injectDialogRootContext();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(props, {
				type: _ctx.as === "button" ? "button" : void 0,
				onClick: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(rootContext).onOpenChange(false))
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["type"]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Menu/utils.js
var ITEM_SELECT = "menu.itemSelect";
var SELECTION_KEYS = ["Enter", " "];
var FIRST_KEYS = [
	"ArrowDown",
	"PageUp",
	"Home"
];
var LAST_KEYS = [
	"ArrowUp",
	"PageDown",
	"End"
];
var FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
[...SELECTION_KEYS], [...SELECTION_KEYS];
function getOpenState(open) {
	return open ? "open" : "closed";
}
function isIndeterminate(checked) {
	return checked === "indeterminate";
}
function getCheckedState(checked) {
	return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
function focusFirst(candidates) {
	const PREVIOUSLY_FOCUSED_ELEMENT = getActiveElement();
	for (const candidate of candidates) {
		if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
		candidate.focus();
		if (getActiveElement() !== PREVIOUSLY_FOCUSED_ELEMENT) return;
	}
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
function isPointerInGraceArea(event, area) {
	if (!area) return false;
	return isPointInPolygon({
		x: event.clientX,
		y: event.clientY
	}, area);
}
function isMouseEvent(event) {
	return event.pointerType === "mouse";
}
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/utils.js
var DEFAULT_TITLE_NAME = "DialogTitle";
var DEFAULT_CONTENT_NAME = "DialogContent";
function useWarning({ titleName = DEFAULT_TITLE_NAME, contentName = DEFAULT_CONTENT_NAME, componentLink = "dialog.html#title", titleId, descriptionId, contentElement }) {
	const TITLE_MESSAGE = `Warning: \`${contentName}\` requires a \`${titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://www.reka-ui.com/docs/components/${componentLink}`;
	const DESCRIPTION_MESSAGE = `Warning: Missing \`Description\` or \`aria-describedby="undefined"\` for ${contentName}.`;
	(0, vue_exports.onMounted)(() => {
		if (!document.getElementById(titleId)) console.warn(TITLE_MESSAGE);
		const describedById = contentElement.value?.getAttribute("aria-describedby");
		if (descriptionId && describedById) {
			if (!document.getElementById(descriptionId)) console.warn(DESCRIPTION_MESSAGE);
		}
	});
}
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogContentImpl.js
var DialogContentImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogContentImpl",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		trapFocus: {
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
		},
		present: {
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
		const rootContext = injectDialogRootContext();
		const { forwardRef, currentElement: contentElement } = useForwardExpose();
		rootContext.titleId ||= useId(void 0, "reka-dialog-title");
		rootContext.descriptionId ||= useId(void 0, "reka-dialog-description");
		(0, vue_exports.onMounted)(() => {
			rootContext.contentElement = contentElement;
			if (getActiveElement() !== document.body) rootContext.triggerElement.value = getActiveElement();
		});
		if (process.env.NODE_ENV !== "production") useWarning({
			titleName: "DialogTitle",
			contentName: "DialogContent",
			componentLink: "dialog.html#title",
			titleId: rootContext.titleId,
			descriptionId: rootContext.descriptionId,
			contentElement
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(FocusScope_default), {
				"as-child": "",
				loop: "",
				trapped: props.trapFocus,
				present: props.present,
				onMountAutoFocus: _cache[5] || (_cache[5] = ($event) => emits("openAutoFocus", $event)),
				onUnmountAutoFocus: _cache[6] || (_cache[6] = ($event) => emits("closeAutoFocus", $event))
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DismissableLayer_default), (0, vue_exports.mergeProps)({
					id: (0, vue_exports.unref)(rootContext).contentId,
					ref: (0, vue_exports.unref)(forwardRef),
					as: _ctx.as,
					"as-child": _ctx.asChild,
					present: props.present,
					"disable-outside-pointer-events": _ctx.disableOutsidePointerEvents,
					role: "dialog",
					"aria-describedby": (0, vue_exports.unref)(rootContext).descriptionId,
					"aria-labelledby": (0, vue_exports.unref)(rootContext).titleId,
					"data-state": (0, vue_exports.unref)(getOpenState)((0, vue_exports.unref)(rootContext).open.value)
				}, _ctx.$attrs, {
					onDismiss: _cache[0] || (_cache[0] = ($event) => (0, vue_exports.unref)(rootContext).onOpenChange(false)),
					onEscapeKeyDown: _cache[1] || (_cache[1] = ($event) => emits("escapeKeyDown", $event)),
					onFocusOutside: _cache[2] || (_cache[2] = ($event) => emits("focusOutside", $event)),
					onInteractOutside: _cache[3] || (_cache[3] = ($event) => emits("interactOutside", $event)),
					onPointerDownOutside: _cache[4] || (_cache[4] = ($event) => emits("pointerDownOutside", $event))
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 3
				}, 16, [
					"id",
					"as",
					"as-child",
					"present",
					"disable-outside-pointer-events",
					"aria-describedby",
					"aria-labelledby",
					"data-state"
				])]),
				_: 3
			}, 8, ["trapped", "present"]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogContentModal.js
var DialogContentModal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogContentModal",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		trapFocus: {
			type: Boolean,
			required: false
		},
		disableOutsidePointerEvents: {
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
		present: {
			type: Boolean,
			required: true
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
		const rootContext = injectDialogRootContext();
		const emitsAsProps = useEmitAsProps(emits);
		const { forwardRef, currentElement } = useForwardExpose();
		const ariaHiddenTarget = (0, vue_exports.computed)(() => props.present ? currentElement.value : void 0);
		useHideOthers(ariaHiddenTarget);
		const forwardedProps = (0, vue_exports.computed)(() => {
			const { present: _, ...rest } = props;
			return rest;
		});
		(0, vue_exports.watch)(() => props.present, (isPresent, wasPresent) => {
			if (!isPresent && wasPresent) rootContext.triggerElement.value?.focus();
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DialogContentImpl_default, (0, vue_exports.mergeProps)({
				...forwardedProps.value,
				...(0, vue_exports.unref)(emitsAsProps)
			}, {
				ref: (0, vue_exports.unref)(forwardRef),
				present: _ctx.present,
				"trap-focus": (0, vue_exports.unref)(rootContext).open.value,
				"disable-outside-pointer-events": props.disableOutsidePointerEvents,
				onCloseAutoFocus: _cache[0] || (_cache[0] = (event) => {
					if (!event.defaultPrevented) {
						event.preventDefault();
						(0, vue_exports.unref)(rootContext).triggerElement.value?.focus();
					}
				}),
				onPointerDownOutside: _cache[1] || (_cache[1] = (event) => {
					const originalEvent = event.detail.originalEvent;
					const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
					if (originalEvent.button === 2 || ctrlLeftClick) event.preventDefault();
				}),
				onFocusOutside: _cache[2] || (_cache[2] = (event) => {
					event.preventDefault();
				})
			}), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, [
				"present",
				"trap-focus",
				"disable-outside-pointer-events"
			]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogContentNonModal.js
var DialogContentNonModal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogContentNonModal",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		trapFocus: {
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
		},
		present: {
			type: Boolean,
			required: true
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
		const emitsAsProps = useEmitAsProps(__emit);
		useForwardExpose();
		const rootContext = injectDialogRootContext();
		const hasInteractedOutsideRef = (0, vue_exports.ref)(false);
		const hasPointerDownOutsideRef = (0, vue_exports.ref)(false);
		const forwardedProps = (0, vue_exports.computed)(() => {
			const { present: _, ...rest } = props;
			return rest;
		});
		(0, vue_exports.watch)(() => props.present, (isPresent, wasPresent) => {
			if (!isPresent && wasPresent) {
				if (!hasInteractedOutsideRef.value) rootContext.triggerElement.value?.focus();
				hasInteractedOutsideRef.value = false;
				hasPointerDownOutsideRef.value = false;
			}
		});
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DialogContentImpl_default, (0, vue_exports.mergeProps)({
				...forwardedProps.value,
				...(0, vue_exports.unref)(emitsAsProps)
			}, {
				present: _ctx.present,
				"trap-focus": false,
				"disable-outside-pointer-events": false,
				onCloseAutoFocus: _cache[0] || (_cache[0] = (event) => {
					if (!event.defaultPrevented) {
						if (!hasInteractedOutsideRef.value) (0, vue_exports.unref)(rootContext).triggerElement.value?.focus();
						event.preventDefault();
					}
					hasInteractedOutsideRef.value = false;
					hasPointerDownOutsideRef.value = false;
				}),
				onInteractOutside: _cache[1] || (_cache[1] = (event) => {
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
			}, 16, ["present"]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogContent.js
var DialogContent_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogContent",
	props: {
		forceMount: {
			type: Boolean,
			required: false
		},
		disableOutsidePointerEvents: {
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
		const rootContext = injectDialogRootContext();
		const emitsAsProps = useEmitAsProps(emits);
		const { forwardRef } = useForwardExpose();
		const staysMounted = (0, vue_exports.computed)(() => props.forceMount || !rootContext.unmountOnHide.value);
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), {
				present: (0, vue_exports.unref)(rootContext).open.value,
				"force-mount": staysMounted.value
			}, {
				default: (0, vue_exports.withCtx)(({ present }) => [(0, vue_exports.unref)(rootContext).modal.value ? (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DialogContentModal_default, (0, vue_exports.mergeProps)({
					key: 0,
					ref: (0, vue_exports.unref)(forwardRef),
					present: staysMounted.value ? present : true
				}, {
					...props,
					...(0, vue_exports.unref)(emitsAsProps),
					..._ctx.$attrs
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 2
				}, 1040, ["present"])), [[vue_exports.vShow, _ctx.forceMount || (0, vue_exports.unref)(rootContext).unmountOnHide.value || present]]) : (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(DialogContentNonModal_default, (0, vue_exports.mergeProps)({
					key: 1,
					ref: (0, vue_exports.unref)(forwardRef),
					present: staysMounted.value ? present : true
				}, {
					...props,
					...(0, vue_exports.unref)(emitsAsProps),
					..._ctx.$attrs
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 2
				}, 1040, ["present"])), [[vue_exports.vShow, _ctx.forceMount || (0, vue_exports.unref)(rootContext).unmountOnHide.value || present]])]),
				_: 3
			}, 8, ["present", "force-mount"]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogDescription.js
var DialogDescription_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogDescription",
	props: {
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "p"
		}
	},
	setup(__props) {
		const props = __props;
		useForwardExpose();
		const rootContext = injectDialogRootContext();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(props, { id: (0, vue_exports.unref)(rootContext).descriptionId }), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["id"]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogOverlayImpl.js
var DialogOverlayImpl_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogOverlayImpl",
	props: {
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false
		},
		present: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	setup(__props) {
		const props = __props;
		const rootContext = injectDialogRootContext();
		const scrollLocked = useBodyScrollLock(props.present);
		(0, vue_exports.watch)(() => props.present, (val) => scrollLocked.value = val);
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), {
				as: _ctx.as,
				"as-child": _ctx.asChild,
				"data-state": (0, vue_exports.unref)(rootContext).open.value ? "open" : "closed",
				style: { "pointer-events": "auto" },
				onPointerdown: _cache[0] || (_cache[0] = (0, vue_exports.withModifiers)(() => {}, [
					"left",
					"self",
					"prevent"
				]))
			}, {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"as",
				"as-child",
				"data-state"
			]);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogOverlay.js
var DialogOverlay_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogOverlay",
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
		const rootContext = injectDialogRootContext();
		const { forwardRef } = useForwardExpose();
		const staysMounted = (0, vue_exports.computed)(() => props.forceMount || !rootContext.unmountOnHide.value);
		return (_ctx, _cache) => {
			return (0, vue_exports.unref)(rootContext)?.modal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Presence_default), {
				key: 0,
				present: (0, vue_exports.unref)(rootContext).open.value,
				"force-mount": staysMounted.value
			}, {
				default: (0, vue_exports.withCtx)(({ present }) => [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)(DialogOverlayImpl_default, (0, vue_exports.mergeProps)(_ctx.$attrs, {
					ref: (0, vue_exports.unref)(forwardRef),
					as: _ctx.as,
					"as-child": _ctx.asChild,
					present: staysMounted.value ? present : true
				}), {
					default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
					_: 2
				}, 1040, [
					"as",
					"as-child",
					"present"
				]), [[vue_exports.vShow, _ctx.forceMount || (0, vue_exports.unref)(rootContext).unmountOnHide.value || present]])]),
				_: 3
			}, 8, ["present", "force-mount"])) : (0, vue_exports.createCommentVNode)("v-if", true);
		};
	}
});
//#endregion
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogPortal.js
var DialogPortal_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogPortal",
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
//#region ../../xampp/htdocs/rimify/node_modules/reka-ui/dist/Dialog/DialogTitle.js
var DialogTitle_default = /* @__PURE__ */ (0, vue_exports.defineComponent)({
	__name: "DialogTitle",
	props: {
		asChild: {
			type: Boolean,
			required: false
		},
		as: {
			type: null,
			required: false,
			default: "h2"
		}
	},
	setup(__props) {
		const props = __props;
		const rootContext = injectDialogRootContext();
		useForwardExpose();
		return (_ctx, _cache) => {
			return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(Primitive), (0, vue_exports.mergeProps)(props, { id: (0, vue_exports.unref)(rootContext).titleId }), {
				default: (0, vue_exports.withCtx)(() => [(0, vue_exports.renderSlot)(_ctx.$slots, "default")]),
				_: 3
			}, 16, ["id"]);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Dialog.vue?vue&type=script&setup=true&lang.ts
var Dialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Dialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		title: {},
		description: { default: void 0 },
		variant: { default: "dialog" },
		wide: {
			type: Boolean,
			default: false
		},
		hideTitle: {
			type: Boolean,
			default: false
		},
		contentClass: { default: void 0 },
		initialFocus: { default: void 0 }
	}, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["closeAutoFocus"], ["update:open"]),
	setup(__props, { emit: __emit }) {
		/**
		* A modal surface in one of three shapes: a centred dialog, a drawer from the right edge, or a
		* sheet from the bottom edge. Focus is trapped inside, the page behind does not scroll, Esc and
		* the scrim close it, and focus returns to the control that opened it — all of that comes from
		* the primitive, so no page implements it twice.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const emit = __emit;
		let opener = null;
		const opened = (0, vue_exports.ref)(open.value);
		(0, vue_exports.watch)(open, (value) => {
			if (value) opened.value = true;
			if (!value || typeof document === "undefined") return;
			const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			const menu = active?.closest("[role=\"menu\"]");
			opener = (menu?.id ? document.querySelector(`[aria-controls="${menu.id}"]`) : null) ?? active;
		});
		function onOpenAutoFocus(event) {
			const target = props.initialFocus ? document.querySelector(props.initialFocus) : null;
			if (target) {
				event.preventDefault();
				target.focus();
			}
		}
		function onCloseAutoFocus(event) {
			emit("closeAutoFocus", event);
			if (!event.defaultPrevented && opener?.isConnected) {
				event.preventDefault();
				opener.focus();
			}
			opener = null;
		}
		return (_ctx, _push, _parent, _attrs) => {
			if (opened.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogRoot_default), (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }, null, _parent, _scopeId));
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogContent_default), {
									class: [
										__props.variant === "dialog" ? "dialog" : __props.variant,
										{ "dialog--wide": __props.wide },
										__props.contentClass
									],
									"aria-describedby": __props.description ? void 0 : "",
									onOpenAutoFocus,
									onCloseAutoFocus
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											if (__props.variant === "sheet") _push(`<div class="sheet__grab" aria-hidden="true" data-v-c347d1c6${_scopeId}></div>`);
											else _push(`<!---->`);
											_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "visually-hidden": __props.hideTitle }, "dialog__head"])}" data-v-c347d1c6${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogTitle_default), { class: "h3" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.title)}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogClose_default), {
												class: "icon-btn dialog__close",
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
											_push(`</div>`);
											if (__props.description) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DialogDescription_default), { class: "muted dialog__description" }, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.description)}`);
													else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)];
												}),
												_: 1
											}, _parent, _scopeId));
											else _push(`<!---->`);
											(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent, _scopeId);
											if (_ctx.$slots.actions) {
												_push(`<div class="dialog__actions" data-v-c347d1c6${_scopeId}>`);
												(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "actions", {}, null, _push, _parent, _scopeId);
												_push(`</div>`);
											} else _push(`<!---->`);
										} else return [
											__props.variant === "sheet" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
												key: 0,
												class: "sheet__grab",
												"aria-hidden": "true"
											})) : (0, vue_exports.createCommentVNode)("", true),
											(0, vue_exports.createVNode)("div", { class: ["dialog__head", { "visually-hidden": __props.hideTitle }] }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "h3" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)]),
												_: 1
											}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
												class: "icon-btn dialog__close",
												"aria-label": "Schließen"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
													name: "close",
													size: 24
												})]),
												_: 1
											})], 2),
											__props.description ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DialogDescription_default), {
												key: 1,
												class: "muted dialog__description"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)]),
												_: 1
											})) : (0, vue_exports.createCommentVNode)("", true),
											(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, void 0, true),
											_ctx.$slots.actions ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
												key: 2,
												class: "dialog__actions"
											}, [(0, vue_exports.renderSlot)(_ctx.$slots, "actions", {}, void 0, true)])) : (0, vue_exports.createCommentVNode)("", true)
										];
									}),
									_: 3
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
								class: [
									__props.variant === "dialog" ? "dialog" : __props.variant,
									{ "dialog--wide": __props.wide },
									__props.contentClass
								],
								"aria-describedby": __props.description ? void 0 : "",
								onOpenAutoFocus,
								onCloseAutoFocus
							}, {
								default: (0, vue_exports.withCtx)(() => [
									__props.variant === "sheet" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "sheet__grab",
										"aria-hidden": "true"
									})) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("div", { class: ["dialog__head", { "visually-hidden": __props.hideTitle }] }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "h3" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)]),
										_: 1
									}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
										class: "icon-btn dialog__close",
										"aria-label": "Schließen"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
											name: "close",
											size: 24
										})]),
										_: 1
									})], 2),
									__props.description ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DialogDescription_default), {
										key: 1,
										class: "muted dialog__description"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)]),
										_: 1
									})) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, void 0, true),
									_ctx.$slots.actions ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 2,
										class: "dialog__actions"
									}, [(0, vue_exports.renderSlot)(_ctx.$slots, "actions", {}, void 0, true)])) : (0, vue_exports.createCommentVNode)("", true)
								]),
								_: 3
							}, 8, ["class", "aria-describedby"])];
						}),
						_: 3
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogPortal_default), null, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogOverlay_default), { class: "overlay" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogContent_default), {
							class: [
								__props.variant === "dialog" ? "dialog" : __props.variant,
								{ "dialog--wide": __props.wide },
								__props.contentClass
							],
							"aria-describedby": __props.description ? void 0 : "",
							onOpenAutoFocus,
							onCloseAutoFocus
						}, {
							default: (0, vue_exports.withCtx)(() => [
								__props.variant === "sheet" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "sheet__grab",
									"aria-hidden": "true"
								})) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: ["dialog__head", { "visually-hidden": __props.hideTitle }] }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DialogTitle_default), { class: "h3" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.title), 1)]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DialogClose_default), {
									class: "icon-btn dialog__close",
									"aria-label": "Schließen"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
										name: "close",
										size: 24
									})]),
									_: 1
								})], 2),
								__props.description ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DialogDescription_default), {
									key: 1,
									class: "muted dialog__description"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.description), 1)]),
									_: 1
								})) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.renderSlot)(_ctx.$slots, "default", {}, void 0, true),
								_ctx.$slots.actions ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 2,
									class: "dialog__actions"
								}, [(0, vue_exports.renderSlot)(_ctx.$slots, "actions", {}, void 0, true)])) : (0, vue_exports.createCommentVNode)("", true)
							]),
							_: 3
						}, 8, ["class", "aria-describedby"])]),
						_: 3
					})];
				}),
				_: 3
			}, _parent));
			else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Dialog.vue
var _sfc_setup = Dialog_vue_vue_type_script_setup_true_lang_default.setup;
Dialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Dialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Dialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Dialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c347d1c6"]]);
//#endregion
export { DialogClose_default as _, DialogDescription_default as a, ITEM_SELECT as c, focusFirst as d, getCheckedState as f, isPointerInGraceArea as g, isMouseEvent as h, DialogOverlay_default as i, LAST_KEYS as l, isIndeterminate as m, DialogTitle_default as n, DialogContent_default as o, getOpenState as p, DialogPortal_default as r, FIRST_LAST_KEYS as s, Dialog_default as t, SELECTION_KEYS as u, DialogRoot_default as v };
