import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
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
		*
		* Our own, no longer reka-ui's (29.10.2026): reka measured the opened panel on every tap — the transition switched off,
		* a forced layout of the whole page for a height no animation here uses — and on the phone's home page that tap took
		* 210–320 ms at four times slower CPU (tests/e2e/mobile/startseite.spec.ts, budget 200). A tap now only flips one
		* value; the browser lays out the panel when it paints it. The markup, the classes, `data-state`, the ARIA and the
		* keys between the questions (↑ ↓ Home End, as the WAI-ARIA accordion describes them) stay as they were.
		*/
		const base = (0, vue_exports.useId)();
		const open = (0, vue_exports.ref)(null);
		const root = (0, vue_exports.ref)(null);
		const key = (item) => String(item.id);
		const state = (item) => open.value === key(item) ? "open" : "closed";
		function toggle(item) {
			open.value = open.value === key(item) ? null : key(item);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "root",
				ref: root,
				class: "accordion"
			}, _attrs))} data-v-324139e9><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
				_push(`<div class="accordion__item"${(0, server_renderer_exports.ssrRenderAttr)("data-state", state(item))} data-v-324139e9>`);
				(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(`h${__props.level}`), {
					class: "accordion__header",
					"data-state": state(item)
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<button${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(base)}-q-${item.id}`)} type="button" class="accordion__trigger"${(0, server_renderer_exports.ssrRenderAttr)("data-state", state(item))}${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", state(item) === "open" ? "true" : "false")}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `${(0, vue_exports.unref)(base)}-a-${item.id}`)} data-v-324139e9${_scopeId}><span data-v-324139e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.title)}</span>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "chevron-down",
								size: 20
							}, null, _parent, _scopeId));
							_push(`</button>`);
						} else return [(0, vue_exports.createVNode)("button", {
							id: `${(0, vue_exports.unref)(base)}-q-${item.id}`,
							type: "button",
							class: "accordion__trigger",
							"data-state": state(item),
							"aria-expanded": state(item) === "open" ? "true" : "false",
							"aria-controls": `${(0, vue_exports.unref)(base)}-a-${item.id}`,
							onClick: ($event) => toggle(item)
						}, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(item.title), 1), (0, vue_exports.createVNode)(Icon_default, {
							name: "chevron-down",
							size: 20
						})], 8, [
							"id",
							"data-state",
							"aria-expanded",
							"aria-controls",
							"onClick"
						])];
					}),
					_: 2
				}), _parent);
				_push(`<div${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(base)}-a-${item.id}`)} role="region"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${(0, vue_exports.unref)(base)}-q-${item.id}`)} class="accordion__content"${(0, server_renderer_exports.ssrRenderAttr)("data-state", state(item))}${(0, server_renderer_exports.ssrRenderDynamicAttr)("hidden", state(item) === "closed")} data-v-324139e9><div class="accordion__body" data-v-324139e9>`);
				(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "body", { item }, () => {
					_push(`${(0, server_renderer_exports.ssrInterpolate)(item.body)}`);
				}, _push, _parent);
				_push(`</div></div></div>`);
			});
			_push(`<!--]--></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Ui/Accordion.vue
var _sfc_setup$1 = Accordion_vue_vue_type_script_setup_true_lang_default.setup;
Accordion_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Accordion.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var Accordion_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Accordion_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-324139e9"]]);
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
		const start = (0, vue_exports.computed)(() => {
			if (props.side === "right") return {
				x: ux(100 - props.x) - 1,
				y: props.y
			};
			return {
				x: props.side === "left" ? ux(props.x) + 1 : ux(props.x),
				y: props.y
			};
		});
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
			}, _attrs))} data-v-e262bfbe><svg class="callout__line"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${width.value} 100`)} preserveAspectRatio="none" focusable="false" style="${(0, server_renderer_exports.ssrRenderStyle)({ "--callout-weight": __props.weight })}" data-v-e262bfbe>`);
			if (__props.ring) _push(`<circle class="callout__casing callout__casing--ring"${(0, server_renderer_exports.ssrRenderAttr)("cx", ux(__props.ring.cx))}${(0, server_renderer_exports.ssrRenderAttr)("cy", __props.ring.cy)}${(0, server_renderer_exports.ssrRenderAttr)("r", __props.ring.r)} pathLength="60" data-v-e262bfbe></circle>`);
			else _push(`<!---->`);
			_push(`<path class="callout__casing callout__casing--leader"${(0, server_renderer_exports.ssrRenderAttr)("d", d.value)} pathLength="1" data-v-e262bfbe></path><circle class="callout__casing callout__casing--dot"${(0, server_renderer_exports.ssrRenderAttr)("cx", end.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("cy", end.value.y)}${(0, server_renderer_exports.ssrRenderAttr)("r", dot.value)} data-v-e262bfbe></circle>`);
			if (__props.ring) _push(`<circle class="callout__ring"${(0, server_renderer_exports.ssrRenderAttr)("cx", ux(__props.ring.cx))}${(0, server_renderer_exports.ssrRenderAttr)("cy", __props.ring.cy)}${(0, server_renderer_exports.ssrRenderAttr)("r", __props.ring.r)} pathLength="60" data-v-e262bfbe></circle>`);
			else _push(`<!---->`);
			_push(`<path class="callout__leader"${(0, server_renderer_exports.ssrRenderAttr)("d", d.value)} pathLength="1" data-v-e262bfbe></path><circle class="callout__dot"${(0, server_renderer_exports.ssrRenderAttr)("cx", end.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("cy", end.value.y)}${(0, server_renderer_exports.ssrRenderAttr)("r", dot.value)} data-v-e262bfbe></circle></svg><div class="${(0, server_renderer_exports.ssrRenderClass)([__props.side ? `callout--${__props.side}` : void 0, "callout"])}" style="${(0, server_renderer_exports.ssrRenderStyle)(boxStyle.value)}" data-v-e262bfbe><span class="callout__label" data-v-e262bfbe>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span><span class="callout__value" translate="no" data-v-e262bfbe>${(0, server_renderer_exports.ssrInterpolate)(__props.value)}</span>`);
			if (__props.note) _push(`<span class="callout__note" data-v-e262bfbe>${(0, server_renderer_exports.ssrInterpolate)(__props.note)}</span>`);
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
var SpecCallout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SpecCallout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e262bfbe"]]);
//#endregion
export { Accordion_default as n, SpecCallout_default as t };
