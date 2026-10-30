import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AppLayout_default } from "./AppLayout-DHPpviGF.js";
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
			_push(`<section class="section--tight" data-v-9bede556><div class="container" data-v-9bede556><div class="konto" data-v-9bede556><h1 class="h1" data-v-9bede556>Mein Konto</h1><p class="konto__lead" data-v-9bede556>Ein Konto legst du nach deiner ersten Bestellung an. Bestellen kannst du auch ohne.</p><form class="konto__form" novalidate data-v-9bede556><div class="form-field" data-v-9bede556><label class="form-field__label" for="konto-mail" data-v-9bede556>E-Mail</label><input id="konto-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="input" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.email ? "true" : void 0)} data-v-9bede556><p id="konto-mail-err" class="form-field__error" data-v-9bede556>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.email ?? "")}</p></div><div class="form-field" data-v-9bede556><label class="form-field__label" for="konto-pass" data-v-9bede556>Passwort</label><input id="konto-pass"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="input" type="password" autocomplete="current-password" aria-describedby="konto-pass-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.password ? "true" : void 0)} data-v-9bede556><p id="konto-pass-err" class="form-field__error" data-v-9bede556>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.password ?? "")}</p></div><div data-v-9bede556><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-9bede556>Anmelden</button></div></form><p class="konto__alt" data-v-9bede556>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				class: "link",
				href: "/konto/passwort-vergessen"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Passwort vergessen?`);
					else return [(0, vue_exports.createTextVNode)("Passwort vergessen?")];
				}),
				_: 1
			}, _parent));
			_push(`</p></div></div></section><!--]-->`);
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
var Anmelden_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Anmelden_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9bede556"]]);
//#endregion
export { Anmelden_default as default };
