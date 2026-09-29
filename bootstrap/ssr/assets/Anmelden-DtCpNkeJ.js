import { t as AppLayout_default } from "./AppLayout-rw2CxFIJ.js";
import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Konto/Anmelden.vue?vue&type=script&setup=true&lang.ts
var Anmelden_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Anmelden",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Mein Konto › Anmelden (Block G §2). An account exists only for customers who opened one after an order; everyone
		* else orders as a guest, as before, and this page says so rather than invite a registration that does not exist.
		*/
		const form = useForm({
			email: "",
			password: ""
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Anmelden" }, null, _parent));
			_push(`<section class="section-dense" data-v-db76845b><div class="wrap konto" data-v-db76845b><h1 class="t-h1" data-v-db76845b>Mein Konto</h1><p class="t-body konto__lead" data-v-db76845b> Ein Konto legst du nach deiner ersten Bestellung mit einem Klick an. Bestellen kannst du auch ohne. </p><form class="konto__form" novalidate data-v-db76845b><div data-v-db76845b><label class="field-label" for="konto-mail" data-v-db76845b>E-Mail</label><input id="konto-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="field" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.email ? "true" : void 0)} data-v-db76845b><span id="konto-mail-err" class="field-error" data-v-db76845b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.email ?? "")}</span></div><div data-v-db76845b><label class="field-label" for="konto-pass" data-v-db76845b>Passwort</label><input id="konto-pass"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="field" type="password" autocomplete="current-password" aria-describedby="konto-pass-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.password ? "true" : void 0)} data-v-db76845b><span id="konto-pass-err" class="field-error" data-v-db76845b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.password ?? "")}</span></div><button class="btn btn--primary btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-db76845b>Anmelden</button></form><p class="t-small konto__alt" data-v-db76845b>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/konto/passwort-vergessen" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Passwort vergessen?`);
					else return [(0, vue_exports.createTextVNode)("Passwort vergessen?")];
				}),
				_: 1
			}, _parent));
			_push(`</p></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Konto/Anmelden.vue
var _sfc_setup = Anmelden_vue_vue_type_script_setup_true_lang_default.setup;
Anmelden_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Konto/Anmelden.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Anmelden_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Anmelden_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-db76845b"]]);
//#endregion
export { Anmelden_default as default };
