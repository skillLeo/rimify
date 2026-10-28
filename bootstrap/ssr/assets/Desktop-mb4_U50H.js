import { t as AppLayout_default } from "./AppLayout-Bz2_RlPi.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-eiBrxJ_i.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { k as useShared } from "./useShopFeedback-w9f5CH_k.js";
import { a as paragraphs } from "./format-6R0uUMt3.js";
//#region resources/js/Pages/Ratgeber/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		guide: {},
		others: {}
	},
	setup(__props) {
		/**
		* One Blog article (H10 → /ratgeber/{slug}; the client's #10, D-230). Editorial and quiet: the way back to the Blog,
		* the title, the reading time, the lead, then the sections as running text at a readable measure — with a figure (its
		* alt text required) or a table (a caption, header cells) where the article has one. Every word is printed as text,
		* never as HTML (ArticleBlocks). The other articles are offered at the end — an article page that ends in nothing
		* sends the reader back to the browser.
		*/
		const props = __props;
		const shared = useShared();
		const description = (0, vue_exports.computed)(() => props.guide.metaDescription || props.guide.teaser);
		const canonical = (0, vue_exports.computed)(() => typeof shared.value.canonical === "string" ? shared.value.canonical : "");
		const image = (0, vue_exports.computed)(() => props.guide.blocks.find((b) => b.type === "figure")?.data ?? null);
		const shareImage = (0, vue_exports.computed)(() => {
			const src = image.value?.src ?? "";
			if (/^https?:\/\//i.test(src)) return src;
			try {
				return src !== "" && canonical.value !== "" ? new URL(src, canonical.value).href : null;
			} catch {
				return null;
			}
		});
		const failed = (0, vue_exports.ref)(/* @__PURE__ */ new Set());
		function broken(index) {
			failed.value = new Set(failed.value).add(index);
		}
		(0, vue_exports.onMounted)(() => {
			for (const img of document.querySelectorAll(".guide__figure img[data-block]")) if (img.complete && img.naturalWidth === 0) broken(Number(img.dataset.block));
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<title data-v-c5ba5295${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.guide.title)} – Blog</title><meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", description.value)} data-v-c5ba5295${_scopeId}><meta property="og:type" content="article" head-key="og:type" data-v-c5ba5295${_scopeId}><meta property="og:site_name" content="RIMIFY" head-key="og:site_name" data-v-c5ba5295${_scopeId}><meta property="og:locale" content="de_DE" head-key="og:locale" data-v-c5ba5295${_scopeId}><meta property="og:title"${(0, server_renderer_exports.ssrRenderAttr)("content", __props.guide.title)} head-key="og:title" data-v-c5ba5295${_scopeId}><meta property="og:description"${(0, server_renderer_exports.ssrRenderAttr)("content", description.value)} head-key="og:description" data-v-c5ba5295${_scopeId}>`);
						if (canonical.value) _push(`<meta property="og:url"${(0, server_renderer_exports.ssrRenderAttr)("content", canonical.value)} head-key="og:url" data-v-c5ba5295${_scopeId}>`);
						else _push(`<!---->`);
						if (image.value && shareImage.value) _push(`<meta property="og:image"${(0, server_renderer_exports.ssrRenderAttr)("content", shareImage.value)} head-key="og:image" data-v-c5ba5295${_scopeId}>`);
						else _push(`<!---->`);
						if (image.value && shareImage.value) _push(`<meta property="og:image:alt"${(0, server_renderer_exports.ssrRenderAttr)("content", image.value.alt)} head-key="og:image:alt" data-v-c5ba5295${_scopeId}>`);
						else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)("title", null, (0, vue_exports.toDisplayString)(__props.guide.title) + " – Blog", 1),
						(0, vue_exports.createVNode)("meta", {
							name: "description",
							content: description.value
						}, null, 8, ["content"]),
						(0, vue_exports.createVNode)("meta", {
							property: "og:type",
							content: "article",
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
							content: __props.guide.title,
							"head-key": "og:title"
						}, null, 8, ["content"]),
						(0, vue_exports.createVNode)("meta", {
							property: "og:description",
							content: description.value,
							"head-key": "og:description"
						}, null, 8, ["content"]),
						canonical.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("meta", {
							key: 0,
							property: "og:url",
							content: canonical.value,
							"head-key": "og:url"
						}, null, 8, ["content"])) : (0, vue_exports.createCommentVNode)("", true),
						image.value && shareImage.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("meta", {
							key: 1,
							property: "og:image",
							content: shareImage.value,
							"head-key": "og:image"
						}, null, 8, ["content"])) : (0, vue_exports.createCommentVNode)("", true),
						image.value && shareImage.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("meta", {
							key: 2,
							property: "og:image:alt",
							content: image.value.alt,
							"head-key": "og:image:alt"
						}, null, 8, ["content"])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 1
			}, _parent));
			_push(`<article class="container guide" aria-labelledby="guide-title" data-v-c5ba5295><header class="guide__head" data-v-c5ba5295>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/blog",
				class: "label guide__back"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Blog`);
					else return [(0, vue_exports.createTextVNode)("Blog")];
				}),
				_: 1
			}, _parent));
			_push(`<h1 id="guide-title" class="h1 guide__title" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(__props.guide.title)}</h1><p class="small muted num guide__meta" data-v-c5ba5295>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "clock",
				size: 16
			}, null, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.guide.minutes)} Min. Lesezeit </p>`);
			if (__props.guide.teaser) _push(`<p class="body-l guide__lead" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(__props.guide.teaser)}</p>`);
			else _push(`<!---->`);
			_push(`</header><div class="prose guide__body" data-v-c5ba5295><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.guide.blocks, (block, index) => {
				_push(`<!--[-->`);
				if (block.type === "prose") {
					_push(`<!--[-->`);
					if (block.data.heading) _push(`<h2 class="h3" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(block.data.heading)}</h2>`);
					else _push(`<!---->`);
					_push(`<!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(paragraphs)(block.data.text), (paragraph, p) => {
						_push(`<p class="guide__para" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(paragraph)}</p>`);
					});
					_push(`<!--]--><!--]-->`);
				} else if (block.type === "figure" && !failed.value.has(index)) {
					_push(`<figure class="guide__figure" data-v-c5ba5295><img${(0, server_renderer_exports.ssrRenderAttr)("src", block.data.src)}${(0, server_renderer_exports.ssrRenderAttr)("alt", block.data.alt)}${(0, server_renderer_exports.ssrRenderAttr)("width", block.data.width ?? void 0)}${(0, server_renderer_exports.ssrRenderAttr)("height", block.data.height ?? void 0)}${(0, server_renderer_exports.ssrRenderAttr)("data-block", index)} loading="lazy" decoding="async" data-v-c5ba5295>`);
					if (block.data.caption) _push(`<figcaption class="small muted" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(block.data.caption)}</figcaption>`);
					else _push(`<!---->`);
					_push(`</figure>`);
				} else if (block.type === "table") {
					_push(`<div class="guide__table" role="region"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", block.data.caption)} tabindex="0" data-v-c5ba5295><table data-v-c5ba5295><caption data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(block.data.caption)}</caption><thead data-v-c5ba5295><tr data-v-c5ba5295><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(block.data.head, (cell, c) => {
						_push(`<th scope="col" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(cell)}</th>`);
					});
					_push(`<!--]--></tr></thead><tbody data-v-c5ba5295><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(block.data.rows, (row, r) => {
						_push(`<tr data-v-c5ba5295><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(row, (cell, c) => {
							_push(`<td data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(cell)}</td>`);
						});
						_push(`<!--]--></tr>`);
					});
					_push(`<!--]--></tbody></table></div>`);
				} else if (block.type === "quote") {
					_push(`<figure class="guide__quote" data-v-c5ba5295><blockquote data-v-c5ba5295><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(paragraphs)(block.data.text), (paragraph, p) => {
						_push(`<p class="body-l guide__para" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(paragraph)}</p>`);
					});
					_push(`<!--]--></blockquote>`);
					if (block.data.source) _push(`<figcaption class="small muted" data-v-c5ba5295>${(0, server_renderer_exports.ssrInterpolate)(block.data.source)}</figcaption>`);
					else _push(`<!---->`);
					_push(`</figure>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			});
			_push(`<!--]--></div><footer class="guide__foot" data-v-c5ba5295><p class="micro quiet guide__note" data-v-c5ba5295> Dieser Artikel erklärt Begriffe und Abläufe allgemein. Was für deine Felge gilt, steht in ihrem Gutachten. </p>`);
			if (__props.others.length > 0) {
				_push(`<nav class="guide__more" aria-labelledby="guide-more" data-v-c5ba5295><p id="guide-more" class="label" data-v-c5ba5295>Weitere Artikel</p><ul class="guide__list" data-v-c5ba5295><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.others, (other) => {
					_push(`<li data-v-c5ba5295>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: other.href,
						class: "link"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(other.title)}`);
							else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(other.title), 1)];
						}),
						_: 2
					}, _parent));
					_push(`</li>`);
				});
				_push(`<!--]--></ul></nav>`);
			} else _push(`<!---->`);
			_push(`</footer></article><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Ratgeber/Desktop.vue
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Ratgeber/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c5ba5295"]]);
//#endregion
export { Desktop_default as default };
