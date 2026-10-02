import { S as Primitive } from "./Dialog-C-07FMpe.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
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
var _sfc_setup = Kbd_vue_vue_type_script_setup_true_lang_default.setup;
Kbd_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Ui/Kbd.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Kbd_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Kbd_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8ddf4b70"]]);
//#endregion
export { VisuallyHidden_default as n, Kbd_default as t };
