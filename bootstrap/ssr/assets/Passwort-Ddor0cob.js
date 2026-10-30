import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AppLayout_default } from "./AppLayout-CtsdJAj8.js";
//#region resources/js/Pages/Konto/Passwort.vue?vue&type=script&setup=true&lang.ts
var Passwort_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Passwort",
	__ssrInlineRender: true,
	props: {
		email: {},
		refusal: {},
		action: {}
	},
	setup(__props) {
		/**
		* Mein Konto › Passwort festlegen, by the mailed link: the first password after „Konto anlegen“, or a new one. A used
		* or expired link says so and points to „Passwort vergessen“.
		*/
		const props = __props;
		const form = useForm({
			password: "",
			password_confirmation: ""
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Passwort festlegen" }, null, _parent));
			_push(`<section class="section--tight" data-v-0417accd><div class="container" data-v-0417accd><div class="konto" data-v-0417accd><h1 class="h1" data-v-0417accd>Passwort festlegen</h1>`);
			if (props.refusal) {
				_push(`<!--[--><p class="konto__lead" role="alert" data-v-0417accd>${(0, server_renderer_exports.ssrInterpolate)(props.refusal)}</p><p class="konto__alt" data-v-0417accd>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "link",
					href: "/konto/passwort-vergessen"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Neuen Link anfordern`);
						else return [(0, vue_exports.createTextVNode)("Neuen Link anfordern")];
					}),
					_: 1
				}, _parent));
				_push(`</p><!--]-->`);
			} else _push(`<!--[--><p class="konto__lead" data-v-0417accd>Für dein Konto <strong data-v-0417accd>${(0, server_renderer_exports.ssrInterpolate)(props.email)}</strong>. Mindestens 10 Zeichen.</p><form class="konto__form" novalidate data-v-0417accd><input class="visually-hidden" type="email" autocomplete="username"${(0, server_renderer_exports.ssrRenderAttr)("value", props.email)} tabindex="-1" aria-hidden="true" readonly data-v-0417accd><div class="form-field" data-v-0417accd><label class="form-field__label" for="konto-pass" data-v-0417accd>Neues Passwort</label><input id="konto-pass"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="input" type="password" autocomplete="new-password" aria-describedby="konto-pass-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.password ? "true" : void 0)} data-v-0417accd><p id="konto-pass-err" class="form-field__error" data-v-0417accd>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.password ?? "")}</p></div><div class="form-field" data-v-0417accd><label class="form-field__label" for="konto-pass2" data-v-0417accd>Passwort wiederholen</label><input id="konto-pass2"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password_confirmation)} class="input" type="password" autocomplete="new-password" data-v-0417accd></div><div data-v-0417accd><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-0417accd>Passwort speichern</button></div></form><!--]-->`);
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Konto/Passwort.vue
var _sfc_setup = Passwort_vue_vue_type_script_setup_true_lang_default.setup;
Passwort_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Konto/Passwort.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Passwort_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Passwort_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0417accd"]]);
//#endregion
export { Passwort_default as default };
