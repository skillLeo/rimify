import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { a as Icon_default } from "./useShared-B1ZdimaV.js";
import { t as AppLayout_default } from "./AppLayout-BVlt5D4s.js";
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
		* One guide article (H10 → /ratgeber/{slug}). Editorial and quiet: the title, the reading time,
		* the lead, then the sections as running text at a readable measure. The other two guides are
		* offered at the end — an article page that ends in nothing sends the reader back to the browser.
		*/
		const props = __props;
		const description = (0, vue_exports.computed)(() => props.guide.metaDescription || props.guide.teaser);
		/** Paragraphs are separated by a blank line in the seeded text. */
		function paragraphs(text) {
			return (text ?? "").split(/\n{2,}/).map((p) => p.trim()).filter((p) => p !== "");
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), null, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<title data-v-1c0f4f40${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.guide.title)} – Ratgeber</title><meta name="description"${(0, server_renderer_exports.ssrRenderAttr)("content", description.value)} data-v-1c0f4f40${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("title", null, (0, vue_exports.toDisplayString)(__props.guide.title) + " – Ratgeber", 1), (0, vue_exports.createVNode)("meta", {
						name: "description",
						content: description.value
					}, null, 8, ["content"])];
				}),
				_: 1
			}, _parent));
			_push(`<article class="container guide" aria-labelledby="guide-title" data-v-1c0f4f40><header class="guide__head" data-v-1c0f4f40><p class="label" data-v-1c0f4f40>Ratgeber</p><h1 id="guide-title" class="h1 guide__title" data-v-1c0f4f40>${(0, server_renderer_exports.ssrInterpolate)(__props.guide.title)}</h1><p class="small muted num guide__meta" data-v-1c0f4f40>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "clock",
				size: 16
			}, null, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.guide.minutes)} Min. Lesezeit </p>`);
			if (__props.guide.teaser) _push(`<p class="body-l guide__lead" data-v-1c0f4f40>${(0, server_renderer_exports.ssrInterpolate)(__props.guide.teaser)}</p>`);
			else _push(`<!---->`);
			_push(`</header><div class="prose guide__body" data-v-1c0f4f40><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.guide.blocks, (block, index) => {
				_push(`<!--[-->`);
				if (block.data.heading) _push(`<h2 class="h3" data-v-1c0f4f40>${(0, server_renderer_exports.ssrInterpolate)(block.data.heading)}</h2>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(paragraphs(block.data.text), (paragraph, p) => {
					_push(`<p data-v-1c0f4f40>${(0, server_renderer_exports.ssrInterpolate)(paragraph)}</p>`);
				});
				_push(`<!--]--><!--]-->`);
			});
			_push(`<!--]--></div><footer class="guide__foot" data-v-1c0f4f40><p class="micro quiet guide__note" data-v-1c0f4f40> Dieser Ratgeber erklärt Begriffe und Abläufe allgemein. Was für deine Felge gilt, steht in ihrem Gutachten. </p>`);
			if (__props.others.length > 0) {
				_push(`<nav class="guide__more" aria-labelledby="guide-more" data-v-1c0f4f40><p id="guide-more" class="label" data-v-1c0f4f40>Weitere Ratgeber</p><ul class="guide__list" data-v-1c0f4f40><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.others, (other) => {
					_push(`<li data-v-1c0f4f40>`);
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
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-1c0f4f40"]]);
//#endregion
export { Desktop_default as default };
