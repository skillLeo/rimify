import { t as AppLayout_default } from "./AppLayout-jJytylAs.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Rechtliches/Widerrufsformular.vue?vue&type=script&setup=true&lang.ts
var Widerrufsformular_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Widerrufsformular",
	__ssrInlineRender: true,
	props: {
		title: {},
		intro: {},
		addressee: {},
		fields: {},
		footnote: {}
	},
	setup(__props) {
		/**
		* The Muster-Widerrufsformular (Art. 246a § 1 Abs. 2 EGBGB), as the statute prints it — in its „Sie“, because the
		* model form is the law's text and not the shop's (WithdrawalForm on the server holds it; the order mail carries the
		* same words). The addressee is the seller's own data where given, else the e-mail address alone.
		*
		* Laid out like a form on paper: each line with room to write, the footnote under it — printable as it stands.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: __props.title }, null, _parent));
			_push(`<section class="section-dense" data-v-bf3a7878><div class="wrap wf" data-v-bf3a7878><p class="t-small wf__back" data-v-bf3a7878>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/widerrufsbelehrung" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zur Widerrufsbelehrung`);
					else return [(0, vue_exports.createTextVNode)("Zur Widerrufsbelehrung")];
				}),
				_: 1
			}, _parent));
			_push(`</p><h1 class="t-h1" data-v-bf3a7878>${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</h1><p class="t-body wf__intro" data-v-bf3a7878>${(0, server_renderer_exports.ssrInterpolate)(__props.intro)}</p><ul class="wf__lines" data-v-bf3a7878><li class="wf__line wf__line--to" data-v-bf3a7878>${(0, server_renderer_exports.ssrInterpolate)(__props.addressee)}</li><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.fields, (field) => {
				_push(`<li class="wf__line" data-v-bf3a7878><span data-v-bf3a7878>${(0, server_renderer_exports.ssrInterpolate)(field)}</span><span class="wf__space" aria-hidden="true" data-v-bf3a7878></span></li>`);
			});
			_push(`<!--]--></ul><p class="t-small wf__note" data-v-bf3a7878>${(0, server_renderer_exports.ssrInterpolate)(__props.footnote)}</p></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Rechtliches/Widerrufsformular.vue
var _sfc_setup = Widerrufsformular_vue_vue_type_script_setup_true_lang_default.setup;
Widerrufsformular_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Rechtliches/Widerrufsformular.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Widerrufsformular_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Widerrufsformular_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-bf3a7878"]]);
//#endregion
export { Widerrufsformular_default as default };
