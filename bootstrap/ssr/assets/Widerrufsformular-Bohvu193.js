import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AppLayout_default } from "./AppLayout-CxU6OGNy.js";
//#region resources/js/Pages/Rechtliches/Widerrufsformular.vue?vue&type=script&setup=true&lang.ts
var Widerrufsformular_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Widerrufsformular",
	__ssrInlineRender: true,
	props: {
		title: {},
		placeholder: { type: Boolean },
		notice: {},
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
		*
		* While its placeholder flag is on (D-319) the page holds the one notice and nothing that reads like the form; the
		* server sends no form text at all.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: __props.title }, null, _parent));
			_push(`<section class="section-dense" data-v-36cc419c><div class="wrap wf" data-v-36cc419c><p class="t-small wf__back" data-v-36cc419c>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/widerrufsbelehrung" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zur Widerrufsbelehrung`);
					else return [(0, vue_exports.createTextVNode)("Zur Widerrufsbelehrung")];
				}),
				_: 1
			}, _parent));
			_push(`</p><h1 class="t-h1" data-v-36cc419c>${(0, server_renderer_exports.ssrInterpolate)(__props.title)}</h1>`);
			if (__props.placeholder) _push(`<p class="t-body wf__placeholder" data-v-36cc419c>${(0, server_renderer_exports.ssrInterpolate)(__props.notice)}</p>`);
			else {
				_push(`<!--[--><p class="t-body wf__intro" data-v-36cc419c>${(0, server_renderer_exports.ssrInterpolate)(__props.intro)}</p><ul class="wf__lines" data-v-36cc419c><li class="wf__line wf__line--to" data-v-36cc419c>${(0, server_renderer_exports.ssrInterpolate)(__props.addressee)}</li><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.fields, (field) => {
					_push(`<li class="wf__line" data-v-36cc419c><span data-v-36cc419c>${(0, server_renderer_exports.ssrInterpolate)(field)}</span><span class="wf__space" aria-hidden="true" data-v-36cc419c></span></li>`);
				});
				_push(`<!--]--></ul><p class="t-small wf__note" data-v-36cc419c>${(0, server_renderer_exports.ssrInterpolate)(__props.footnote)}</p><!--]-->`);
			}
			_push(`</div></section><!--]-->`);
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
var Widerrufsformular_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Widerrufsformular_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-36cc419c"]]);
//#endregion
export { Widerrufsformular_default as default };
