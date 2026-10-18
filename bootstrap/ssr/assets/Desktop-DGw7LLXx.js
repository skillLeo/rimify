import { t as AppLayout_default } from "./AppLayout-jJytylAs.js";
import { i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as CompareTable_default } from "./CompareTable-BlzKnAXg.js";
//#region resources/js/Pages/Vergleich/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		items: {},
		missing: {},
		cap: {},
		demo: { type: Boolean }
	},
	setup(__props) {
		/**
		* `/vergleich`, the desktop document: the comparison table on the page grid, in the storefront
		* frame. A comparison is not a landing page, so it is `noindex`.
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
			_push((0, server_renderer_exports.ssrRenderComponent)(CompareTable_default, props, null, _parent));
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Vergleich/Desktop.vue
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Vergleich/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = Desktop_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Desktop_default as default };
