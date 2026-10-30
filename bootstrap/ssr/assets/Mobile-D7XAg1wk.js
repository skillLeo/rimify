import { T as useShared } from "./useShopFeedback-b6nnji5_.js";
import { i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ValueText_default } from "./ValueText-BQCTeKZ_.js";
import { a as EtCalculator_default, i as OffsetDrawing_default, n as useEtRechner, r as RechnerShare_default, t as DISCLAIMER } from "./rechner-CcN4taOU.js";
import { t as MobileLayout_default } from "./MobileLayout-t69GzyUo.js";
//#region resources/js/Pages/Felgenrechner/Mobile.vue?vue&type=script&setup=true&lang.ts
var LEAD = "Vergleiche deine Felge mit einer neuen: wie weit sich Innen- und Außenkante verschieben – gerechnet aus Breite, Einpresstiefe und Distanzscheibe.";
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
		* /felgenrechner as an app screen, rebuilt close to the client's example on a phone (his #11; the operator's brief of
		* 29.10.2026, Batch 2): the large title in the bar — the page's h1 — then, as there, the drawing first with the two
		* answers under it, then the two blocks one under the other, the share block, the steps and the line about the papers.
		*
		* Same props and the same state as the desktop document (useEtRechner); the split is presentation only.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const { state, update, sentences, shareParam, prefillLine } = useEtRechner({
			prefill: () => props.prefill,
			vehicle: () => vehicle.value,
			state: props.state,
			writeUrl: true
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgenrechner" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", LEAD)} head-key="description" data-v-50ae137b${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						name: "description",
						content: LEAD,
						"head-key": "description"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<div class="container rechner" data-v-50ae137b><p class="body muted rechner__lead" data-v-50ae137b>${(0, server_renderer_exports.ssrInterpolate)(LEAD)}</p><div class="rechner__picture" data-v-50ae137b><div class="rechner__answers" aria-live="polite" aria-atomic="true" data-v-50ae137b><p class="h4 num rechner__answer" data-v-50ae137b>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(sentences).inner }, null, _parent));
			_push(`</p><p class="h4 num rechner__answer" data-v-50ae137b>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(sentences).outer }, null, _parent));
			_push(`</p></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(OffsetDrawing_default, { state: (0, vue_exports.unref)(state) }, null, _parent));
			_push(`</div><div class="rechner__form" data-v-50ae137b>`);
			if ((0, vue_exports.unref)(prefillLine)) _push(`<p class="small quiet rechner__prefill" data-v-50ae137b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(prefillLine))}</p>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(EtCalculator_default, {
				"model-value": (0, vue_exports.unref)(state),
				"onUpdate:modelValue": (0, vue_exports.unref)(update)
			}, null, _parent));
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RechnerShare_default, {
				param: (0, vue_exports.unref)(shareParam),
				block: ""
			}, null, _parent));
			_push(`<div class="rechner__about" data-v-50ae137b><h2 class="h4" data-v-50ae137b>So rechnest du</h2><ol class="rechner__steps" data-v-50ae137b><li data-v-50ae137b>Gib Breite und Einpresstiefe deiner aktuellen Felge ein – und die Stärke der Distanzscheibe je Rad, wenn du eine fährst.</li><li data-v-50ae137b>Gib dann die Werte der neuen Felge ein.</li><li data-v-50ae137b>Die zwei Zeilen über der Zeichnung und die Zeichnung selbst zeigen, wie weit sich die Innen- und die Außenkante der neuen Felge gegenüber deiner aktuellen verschieben.</li></ol><p class="small muted rechner__disclaimer" data-v-50ae137b>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: (0, vue_exports.unref)(DISCLAIMER) }, null, _parent));
			_push(`</p></div></div><!--]-->`);
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
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-50ae137b"]]);
//#endregion
export { Mobile_default as default };
