import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
//#region resources/js/Pages/Rechtliches/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		tabs: {},
		active: {},
		blocks: {}
	},
	setup(__props) {
		/** The legal rail as a horizontal scroller above the text. */
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Rechtliches" }, null, _parent));
			_push(`<section class="section" data-v-14c12e28><div class="wrap" data-v-14c12e28><nav class="mrec__rail" aria-label="Rechtliches" data-v-14c12e28><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.tabs, (tab) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: tab.slug,
					href: `/rechtliches/${tab.slug}`,
					class: ["pill", { "pill--on": tab.slug === __props.active }],
					"aria-current": tab.slug === __props.active ? "page" : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(tab.title)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(tab.title), 1)];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--></nav><article class="card mrec__body" data-v-14c12e28><h1 class="t-h1" data-v-14c12e28>${(0, server_renderer_exports.ssrInterpolate)(__props.tabs.find((t) => t.slug === __props.active)?.title ?? "Rechtliches")}</h1><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.blocks, (block) => {
				_push(`<div class="mrec__block" data-v-14c12e28>`);
				if (block.data.heading) _push(`<h2 class="t-h3" data-v-14c12e28>${(0, server_renderer_exports.ssrInterpolate)(block.data.heading)}</h2>`);
				else _push(`<!---->`);
				_push(`<p class="t-body" data-v-14c12e28>${(0, server_renderer_exports.ssrInterpolate)(block.data.body)}</p></div>`);
			});
			_push(`<!--]-->`);
			if (__props.blocks.length === 0) _push(`<p class="t-body quiet" data-v-14c12e28> Für diesen Abschnitt liegt noch kein Text vor. </p>`);
			else _push(`<!---->`);
			_push(`</article></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Rechtliches/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Rechtliches/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-14c12e28"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
