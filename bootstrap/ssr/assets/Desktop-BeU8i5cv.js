import { T as useShared } from "./useShopFeedback-CzxxZ4Cu.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AppLayout_default } from "./AppLayout-CtsdJAj8.js";
//#region resources/js/Pages/Blog/Desktop.vue?vue&type=script&setup=true&lang.ts
var DESCRIPTION = "Artikel rund um Felge, Reifen und Gutachten, verständlich erklärt – etwa wo HSN und TSN stehen und was die Einpresstiefe bedeutet.";
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Desktop",
	__ssrInlineRender: true,
	props: { articles: {} },
	setup(__props) {
		/**
		* The Blog (the client's #10, D-230): every published article, newest first, at /blog — where the footer's „Blog“
		* leads. Quiet like the articles themselves: the title, one line on what is here, then each article with its lead and
		* its reading time. The words are the articles' own (Inhalte › Seiten); nothing here is HTML.
		*/
		const shared = useShared();
		const canonical = (0, vue_exports.computed)(() => typeof shared.value.canonical === "string" ? shared.value.canonical : "");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<title data-v-316ac113${_scopeId}>Blog</title><meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", DESCRIPTION)} data-v-316ac113${_scopeId}><meta property="og:type" content="website" head-key="og:type" data-v-316ac113${_scopeId}><meta property="og:site_name" content="RIMIFY" head-key="og:site_name" data-v-316ac113${_scopeId}><meta property="og:locale" content="de_DE" head-key="og:locale" data-v-316ac113${_scopeId}><meta property="og:title" content="Blog – RIMIFY" head-key="og:title" data-v-316ac113${_scopeId}><meta property="og:description"${(0, server_renderer_exports.ssrRenderAttr)("content", DESCRIPTION)} head-key="og:description" data-v-316ac113${_scopeId}>`);
						if (canonical.value) _push(`<meta property="og:url"${(0, server_renderer_exports.ssrRenderAttr)("content", canonical.value)} head-key="og:url" data-v-316ac113${_scopeId}>`);
						else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)("title", null, "Blog"),
						(0, vue_exports.createVNode)("meta", {
							name: "description",
							content: DESCRIPTION
						}),
						(0, vue_exports.createVNode)("meta", {
							property: "og:type",
							content: "website",
							"head-key": "og:type"
						}),
						(0, vue_exports.createVNode)("meta", {
							property: "og:site_name",
							content: "RIMIFY",
							"head-key": "og:site_name"
						}),
						(0, vue_exports.createVNode)("meta", {
							property: "og:locale",
							content: "de_DE",
							"head-key": "og:locale"
						}),
						(0, vue_exports.createVNode)("meta", {
							property: "og:title",
							content: "Blog – RIMIFY",
							"head-key": "og:title"
						}),
						(0, vue_exports.createVNode)("meta", {
							property: "og:description",
							content: DESCRIPTION,
							"head-key": "og:description"
						}),
						canonical.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("meta", {
							key: 0,
							property: "og:url",
							content: canonical.value,
							"head-key": "og:url"
						}, null, 8, ["content"])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 1
			}, _parent));
			_push(`<section class="container blog" aria-labelledby="blog-title" data-v-316ac113><header class="blog__head" data-v-316ac113><h1 id="blog-title" class="h1 blog__title" data-v-316ac113>Blog</h1><p class="body-l blog__lead" data-v-316ac113>Artikel rund um Felge, Reifen und Gutachten.</p></header>`);
			if (__props.articles.length > 0) {
				_push(`<ol class="blog__list" data-v-316ac113><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.articles, (article) => {
					_push(`<li class="blog__item" data-v-316ac113><h2 class="h3 blog__name" data-v-316ac113>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: article.href,
						class: "blog__link",
						prefetch: ""
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(article.title)}`);
							else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(article.title), 1)];
						}),
						_: 2
					}, _parent));
					_push(`</h2>`);
					if (article.teaser) _push(`<p class="blog__teaser" data-v-316ac113>${(0, server_renderer_exports.ssrInterpolate)(article.teaser)}</p>`);
					else _push(`<!---->`);
					_push(`<p class="small muted num blog__meta" data-v-316ac113>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "clock",
						size: 16
					}, null, _parent));
					_push(` ${(0, server_renderer_exports.ssrInterpolate)(article.minutes)} Min. Lesezeit`);
					if (article.date) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(article.date)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</p></li>`);
				});
				_push(`<!--]--></ol>`);
			} else _push(`<p class="muted" data-v-316ac113>Noch ist kein Artikel veröffentlicht.</p>`);
			_push(`</section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Blog/Desktop.vue
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Blog/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-316ac113"]]);
//#endregion
export { Desktop_default as default };
