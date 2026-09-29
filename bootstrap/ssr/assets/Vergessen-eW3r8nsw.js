import { t as AppLayout_default } from "./AppLayout-rw2CxFIJ.js";
import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Konto/Vergessen.vue?vue&type=script&setup=true&lang.ts
var Vergessen_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Vergessen",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Mein Konto › Passwort vergessen: a new link to the address, if it has an account — the page says the same either
		* way, so it never tells anyone which addresses are customers.
		*/
		const form = useForm({ email: "" });
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Passwort vergessen" }, null, _parent));
			_push(`<section class="section-dense" data-v-47e8b587><div class="wrap konto" data-v-47e8b587><h1 class="t-h1" data-v-47e8b587>Passwort vergessen</h1><p class="t-body konto__lead" data-v-47e8b587>Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p><form class="konto__form" novalidate data-v-47e8b587><div data-v-47e8b587><label class="field-label" for="konto-mail" data-v-47e8b587>E-Mail</label><input id="konto-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="field" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.email ? "true" : void 0)} data-v-47e8b587><span id="konto-mail-err" class="field-error" data-v-47e8b587>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.email ?? "")}</span></div><button class="btn btn--primary btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-47e8b587>Link schicken</button></form><p class="t-small konto__alt" data-v-47e8b587>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/konto/anmelden" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zurück zur Anmeldung`);
					else return [(0, vue_exports.createTextVNode)("Zurück zur Anmeldung")];
				}),
				_: 1
			}, _parent));
			_push(`</p></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Konto/Vergessen.vue
var _sfc_setup = Vergessen_vue_vue_type_script_setup_true_lang_default.setup;
Vergessen_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Konto/Vergessen.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Vergessen_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Vergessen_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-47e8b587"]]);
//#endregion
export { Vergessen_default as default };
