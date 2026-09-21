import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
//#region resources/js/Pages/Rechtliches/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		tabs: {},
		active: {},
		blocks: {}
	},
	setup(__props) {
		/**
		* The legal pages, as a rail of five over one route.
		*
		* The bodies are placeholders until the client's Kanzlei supplies the text (D-024). We do not
		* draft German legal copy: an Impressum written by a developer is a liability the client carries,
		* and a page that states plainly what is outstanding is the honest interim.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Rechtliches" }, null, _parent));
			_push(`<section class="section" data-v-1b08394b><div class="wrap rec" data-v-1b08394b><nav class="rec__rail" aria-label="Rechtliches" data-v-1b08394b><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.tabs, (tab) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: tab.slug,
					href: `/rechtliches/${tab.slug}`,
					class: ["rec__tab", { "rec__tab--on": tab.slug === __props.active }],
					"aria-current": tab.slug === __props.active ? "page" : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(tab.title)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(tab.title), 1)];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--></nav><article class="card rec__body" data-v-1b08394b><h1 class="t-h1" data-v-1b08394b>${(0, server_renderer_exports.ssrInterpolate)(__props.tabs.find((t) => t.slug === __props.active)?.title ?? "Rechtliches")}</h1><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.blocks, (block) => {
				_push(`<div class="rec__block" data-v-1b08394b>`);
				if (block.data.heading) _push(`<h2 class="t-h3" data-v-1b08394b>${(0, server_renderer_exports.ssrInterpolate)(block.data.heading)}</h2>`);
				else _push(`<!---->`);
				_push(`<p class="t-body" data-v-1b08394b>${(0, server_renderer_exports.ssrInterpolate)(block.data.body)}</p></div>`);
			});
			_push(`<!--]-->`);
			if (__props.blocks.length === 0) _push(`<p class="t-body quiet" data-v-1b08394b> Für diesen Abschnitt liegt noch kein Text vor. </p>`);
			else _push(`<!---->`);
			_push(`</article></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Rechtliches/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Rechtliches/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1b08394b"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
