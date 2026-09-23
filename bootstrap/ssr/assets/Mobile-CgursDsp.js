import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-B1ZdimaV.js";
import { a as ClearanceDrawing_default, c as ValueText_default, i as FitmentCalculator_default, n as RechnerShare_default, o as DISCLAIMER, r as FitmentResults_default, t as useRechner } from "./useRechner-89WZYcLM.js";
import { t as MobileLayout_default } from "./MobileLayout-DeT0mDd1.js";
//#region resources/js/Pages/Felgenrechner/Mobile.vue?vue&type=script&setup=true&lang.ts
var LEAD = "Rechne aus, wie sich eine andere Felgen- und Reifengröße rechnerisch auf Abrollumfang, Tacho und die Lage der Felgenkanten auswirkt.";
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: (_, page) => (0, vue_exports.h)(MobileLayout_default, {
		title: "Felgenrechner",
		large: true,
		back: "/"
	}, () => page),
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		prefill: {},
		state: {}
	},
	setup(__props) {
		/**
		* /felgenrechner as an app screen (home-overhaul §3.3, 390). The bar carries the large title —
		* it is the page's h1 — and the back arrow to the homepage. Then one column: Aktuell · Neu as
		* tabs with the five fields two abreast, the three results — each answer in a plain sentence, the
		* rear-view drawing under the position sentence — the full figures, the share block with a
		* full-width button, the disclaimer. No sticky bar.
		*
		* Same props as the desktop document; the split is presentation only.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const { state, shown, shareParam, prefillLine, fromVehicle, specs, update, setValid } = useRechner({
			prefill: () => props.prefill,
			vehicle: () => vehicle.value,
			state: props.state,
			writeUrl: true
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgenrechner" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", LEAD)} head-key="description" data-v-1f81a83a${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						name: "description",
						content: LEAD,
						"head-key": "description"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<div class="container rechner" data-v-1f81a83a><p class="body muted rechner__lead" data-v-1f81a83a>${(0, server_renderer_exports.ssrInterpolate)(LEAD)}</p><div class="rechner__form" data-v-1f81a83a>`);
			if ((0, vue_exports.unref)(prefillLine)) _push(`<p class="small quiet rechner__prefill" data-v-1f81a83a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(prefillLine))}</p>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentCalculator_default, {
				"model-value": (0, vue_exports.unref)(state),
				layout: "tabs",
				prefilled: (0, vue_exports.unref)(fromVehicle),
				"onUpdate:modelValue": (0, vue_exports.unref)(update),
				"onUpdate:valid": (0, vue_exports.unref)(setValid)
			}, null, _parent));
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FitmentResults_default, { result: (0, vue_exports.unref)(shown) }, {
				drawing: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(ClearanceDrawing_default, {
						class: "calc-drawing",
						current: (0, vue_exports.unref)(state).current,
						next: (0, vue_exports.unref)(state).next
					}, null, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)(ClearanceDrawing_default, {
						class: "calc-drawing",
						current: (0, vue_exports.unref)(state).current,
						next: (0, vue_exports.unref)(state).next
					}, null, 8, ["current", "next"])];
				}),
				_: 1
			}, _parent));
			if ((0, vue_exports.unref)(specs).length > 0) {
				_push(`<dl class="specs small" aria-label="Alle Werte" data-v-1f81a83a><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(specs), (row) => {
					_push(`<!--[--><dt data-v-1f81a83a>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</dt><dd class="num" data-v-1f81a83a>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: row.value }, null, _parent));
					_push(`</dd><!--]-->`);
				});
				_push(`<!--]--></dl>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RechnerShare_default, {
				param: (0, vue_exports.unref)(shareParam),
				block: ""
			}, null, _parent));
			_push(`<p class="small muted rechner__disclaimer" data-v-1f81a83a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(DISCLAIMER) }, null, _parent));
			_push(`</p></div><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Felgenrechner/Mobile.vue
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Felgenrechner/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1f81a83a"]]);
//#endregion
export { Mobile_default as default };
