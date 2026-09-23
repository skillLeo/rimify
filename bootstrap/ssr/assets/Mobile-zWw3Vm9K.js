import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as MobileLayout_default } from "./MobileLayout-B3JQsM8N.js";
import { t as CompareTable_default } from "./CompareTable-CsJtKgv1.js";
//#region resources/js/Pages/Vergleich/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: [MobileLayout_default, {
		title: "Vergleich",
		back: "/felgen"
	}],
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		items: {},
		missing: {},
		cap: {},
		demo: { type: Boolean }
	},
	setup(__props) {
		/**
		* `/vergleich`, the phone document: the same table two columns wide with the rest by scrolling,
		* under the app bar titled *Vergleich* with the way back to the listing. No sticky action bar —
		* four sticky buys make no sense; each column carries its own.
		*/
		const props = __props;
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgen vergleichen" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta head-key="robots" name="robots" content="noindex"${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						"head-key": "robots",
						name: "robots",
						content: "noindex"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<section class="section--tight"><div class="container">`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CompareTable_default, (0, vue_exports.mergeProps)(props, { phone: "" }), null, _parent));
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Vergleich/Mobile.vue
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Vergleich/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = Mobile_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Mobile_default as default };
