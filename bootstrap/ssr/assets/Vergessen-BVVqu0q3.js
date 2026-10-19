import { t as AppLayout_default } from "./AppLayout-Cpv58bz_.js";
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
		* way, so it never tells anyone which addresses are customers. Once sent, the sentence stands in the form's place.
		*/
		const form = useForm({ email: "" });
		const sent = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Passwort vergessen" }, null, _parent));
			_push(`<section class="section--tight" data-v-31172ca3><div class="container" data-v-31172ca3><div class="konto" data-v-31172ca3><h1 class="h1" data-v-31172ca3>Passwort vergessen</h1>`);
			if (sent.value) _push(`<p class="konto__lead" role="status" data-v-31172ca3> Wenn es zu ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).email)} ein Konto gibt, ist ein Link zum neuen Passwort unterwegs. Er gilt einen Tag. </p>`);
			else _push(`<!--[--><p class="konto__lead" data-v-31172ca3>Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p><form class="konto__form" novalidate data-v-31172ca3><div class="form-field" data-v-31172ca3><label class="form-field__label" for="konto-mail" data-v-31172ca3>E-Mail</label><input id="konto-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="input" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.email ? "true" : void 0)} data-v-31172ca3><p id="konto-mail-err" class="form-field__error" data-v-31172ca3>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.email ?? "")}</p></div><div data-v-31172ca3><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-31172ca3>Link schicken</button></div></form><!--]-->`);
			_push(`<p class="konto__alt" data-v-31172ca3>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				class: "link",
				href: "/konto/anmelden"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zurück zur Anmeldung`);
					else return [(0, vue_exports.createTextVNode)("Zurück zur Anmeldung")];
				}),
				_: 1
			}, _parent));
			_push(`</p></div></div></section><!--]-->`);
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
var Vergessen_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Vergessen_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-31172ca3"]]);
//#endregion
export { Vergessen_default as default };
