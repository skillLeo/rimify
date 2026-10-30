import { g as COOKIES } from "./useShopFeedback-CzxxZ4Cu.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { a as paragraphs } from "./format-6R0uUMt3.js";
import { t as AppLayout_default } from "./AppLayout-CtsdJAj8.js";
//#region resources/js/Pages/Rechtliches/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		tabs: {},
		active: {},
		blocks: {},
		provider: {},
		placeholder: { type: Boolean },
		notice: {}
	},
	setup(__props) {
		/**
		* The legal pages: five sections over one route, and the text of the selected one.
		*
		* The bodies are placeholders until the client's Kanzlei supplies the text (D-024): while a page's
		* flag is on, the server sends no words, and the page shows one notice that cannot be read as the
		* text (D-319). We do not draft German legal copy: an Impressum written by a developer is a
		* liability the client carries. This page renders exactly what the `page_blocks` rows hold.
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
				text
			};
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: title.value }, null, _parent));
			_push(`<section class="section-dense" data-v-3bd7bd10><div class="wrap rec" data-v-3bd7bd10><nav class="rec__nav" aria-label="Rechtliches" data-v-3bd7bd10><!--[-->`);
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
			_push(`<!--]--></nav><article class="rec__body" data-v-3bd7bd10><h1 class="t-h1" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(title.value)}</h1>`);
			if (__props.provider) {
				_push(`<section class="rec__block rec__provider" aria-labelledby="rec-provider" data-v-3bd7bd10><h2 id="rec-provider" class="t-h3" data-v-3bd7bd10>Angaben gemäß § 5 DDG</h2>`);
				if (__props.provider.notice) _push(`<p class="t-body rec__placeholder" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(__props.provider.notice)}</p>`);
				else if (__props.provider.placeholder) _push(`<p class="t-body rec__placeholder" data-v-3bd7bd10> Platzhalter: Die folgenden Angaben sind Beispielwerte, nicht die des Betreibers. Sie werden vor dem Start ersetzt. </p>`);
				else if (!__props.provider.complete) _push(`<p class="t-body rec__placeholder" data-v-3bd7bd10> Vorläufig: Die Angaben zum Betreiber liegen noch nicht vollständig vor und werden vor dem Start ergänzt. </p>`);
				else _push(`<!---->`);
				_push(`<dl class="rec__facts" data-v-3bd7bd10><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.provider.rows, (row) => {
					_push(`<div class="rec__fact" data-v-3bd7bd10><dt data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</dt>`);
					if (row.missing) _push(`<dd class="rec__para rec__marker" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(row.value)}</dd>`);
					else if (row.value) _push(`<dd class="rec__para" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(row.value)}</dd>`);
					else _push(`<dd class="rec__missing" data-v-3bd7bd10>noch nicht angegeben</dd>`);
					_push(`</div>`);
				});
				_push(`<!--]--></dl></section>`);
			} else _push(`<!---->`);
			if (__props.placeholder) _push(`<p class="t-body rec__placeholder" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(__props.notice)}</p>`);
			else {
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(blocks.value, (block) => {
					_push(`<div class="rec__block" data-v-3bd7bd10>`);
					if (block.heading) _push(`<h2 class="t-h3" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(block.heading)}</h2>`);
					else _push(`<!---->`);
					_push(`<!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(paragraphs)(block.text), (paragraph, p) => {
						_push(`<p class="t-body rec__para" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(paragraph)}</p>`);
					});
					_push(`<!--]--></div>`);
				});
				_push(`<!--]-->`);
			}
			if (__props.active === "datenschutz") {
				_push(`<section id="cookies" class="rec__block rec__cookies" aria-labelledby="rec-cookies" data-v-3bd7bd10><h2 id="rec-cookies" class="t-h3" data-v-3bd7bd10>Cookies bei RIMIFY</h2><div class="rec__table" data-v-3bd7bd10><table data-v-3bd7bd10><thead data-v-3bd7bd10><tr data-v-3bd7bd10><th scope="col" data-v-3bd7bd10>Cookie</th><th scope="col" data-v-3bd7bd10>Art</th><th scope="col" data-v-3bd7bd10>Was es speichert</th><th scope="col" data-v-3bd7bd10>Laufzeit</th><th scope="col" data-v-3bd7bd10>So löschst du es</th></tr></thead><tbody data-v-3bd7bd10><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(COOKIES), (cookie) => {
					_push(`<tr data-v-3bd7bd10><th scope="row" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(cookie.name)}</th><td data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(cookie.category)}</td><td data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(cookie.stores)}</td><td class="rec__nowrap" data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(cookie.lifetime)}</td><td data-v-3bd7bd10>${(0, server_renderer_exports.ssrInterpolate)(cookie.clear)}</td></tr>`);
				});
				_push(`<!--]--></tbody></table></div></section>`);
			} else _push(`<!---->`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3bd7bd10"]]);
//#endregion
export { Index_default as default };
