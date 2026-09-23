import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as AppLayout_default } from "./AppLayout-BVlt5D4s.js";
//#region resources/js/Pages/Rechtliches/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		tabs: {},
		active: {},
		blocks: {}
	},
	setup(__props) {
		/**
		* The legal pages: five sections over one route, and the text of the selected one.
		*
		* The bodies are placeholders until the client's Kanzlei supplies the text (D-024), and each one
		* says so visibly with the marker it was seeded with. We do not draft German legal copy: an
		* Impressum written by a developer is a liability the client carries. This page renders exactly
		* what the `page_blocks` rows hold — nothing is filled in here.
		*
		* The section list is a sticky rail beside the text from 900px and a wrapped row of links above
		* it on a phone — the same links either way, one DOM.
		*/
		const props = __props;
		const title = (0, vue_exports.computed)(() => props.tabs.find((t) => t.slug === props.active)?.title ?? "Rechtliches");
		const blocks = (0, vue_exports.computed)(() => props.blocks.map((block) => {
			const heading = typeof block.data.heading === "string" ? block.data.heading : null;
			const text = typeof block.data.text === "string" ? block.data.text : typeof block.data.body === "string" ? block.data.body : "";
			return {
				id: block.id,
				heading: heading !== null && heading.trim() !== title.value ? heading : null,
				text,
				placeholder: block.data.placeholder === true
			};
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: title.value }, null, _parent));
			_push(`<section class="section-dense" data-v-d045a701><div class="wrap rec" data-v-d045a701><nav class="rec__nav" aria-label="Rechtliches" data-v-d045a701><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.tabs, (tab) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: tab.slug,
					href: `/rechtliches/${tab.slug}`,
					class: ["rec__link", { "rec__link--on": tab.slug === __props.active }],
					"aria-current": tab.slug === __props.active ? "page" : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(tab.title)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(tab.title), 1)];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--></nav><article class="rec__body" data-v-d045a701><h1 class="t-h1" data-v-d045a701>${(0, server_renderer_exports.ssrInterpolate)(title.value)}</h1><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(blocks.value, (block) => {
				_push(`<div class="rec__block" data-v-d045a701>`);
				if (block.heading) _push(`<h2 class="t-h3" data-v-d045a701>${(0, server_renderer_exports.ssrInterpolate)(block.heading)}</h2>`);
				else _push(`<!---->`);
				_push(`<p class="${(0, server_renderer_exports.ssrRenderClass)([{ "rec__placeholder": block.placeholder }, "t-body"])}" data-v-d045a701>${(0, server_renderer_exports.ssrInterpolate)(block.text)}</p></div>`);
			});
			_push(`<!--]-->`);
			if (blocks.value.length === 0) _push(`<p class="t-body rec__placeholder" data-v-d045a701> Für diesen Abschnitt liegt noch kein Text vor. </p>`);
			else _push(`<!---->`);
			_push(`</article></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Rechtliches/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Rechtliches/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d045a701"]]);
//#endregion
export { Index_default as default };
