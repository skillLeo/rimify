import { S as Primitive, T as useId } from "./Dialog-DrPiANpu.js";
import { c as injectRovingFocusGroupContext, f as focusFirst, h as useCollection, m as wrapArray, p as getFocusIntent } from "./DropdownMenuTrigger-wx1sJlIQ.js";
import { u as vue_exports } from "../ssr.js";
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
export { RovingFocusItem_default as t };
