import { t as AppLayout_default } from "./AppLayout-rw2CxFIJ.js";
import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
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
			_push(`<section class="section-dense" data-v-d1fc61b6><div class="wrap konto" data-v-d1fc61b6><h1 class="t-h1" data-v-d1fc61b6>Passwort festlegen</h1>`);
			if (props.refusal) {
				_push(`<!--[--><p class="t-body konto__lead" role="alert" data-v-d1fc61b6>${(0, server_renderer_exports.ssrInterpolate)(props.refusal)}</p><p class="t-small konto__alt" data-v-d1fc61b6>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/konto/passwort-vergessen" }, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Neuen Link anfordern`);
						else return [(0, vue_exports.createTextVNode)("Neuen Link anfordern")];
					}),
					_: 1
				}, _parent));
				_push(`</p><!--]-->`);
			} else _push(`<!--[--><p class="t-body konto__lead" data-v-d1fc61b6>Für dein Konto <strong data-v-d1fc61b6>${(0, server_renderer_exports.ssrInterpolate)(props.email)}</strong>. Mindestens 10 Zeichen.</p><form class="konto__form" novalidate data-v-d1fc61b6><input class="visually-hidden" type="email" autocomplete="username"${(0, server_renderer_exports.ssrRenderAttr)("value", props.email)} tabindex="-1" aria-hidden="true" readonly data-v-d1fc61b6><div data-v-d1fc61b6><label class="field-label" for="konto-pass" data-v-d1fc61b6>Neues Passwort</label><input id="konto-pass"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="field" type="password" autocomplete="new-password" aria-describedby="konto-pass-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.password ? "true" : void 0)} data-v-d1fc61b6><span id="konto-pass-err" class="field-error" data-v-d1fc61b6>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.password ?? "")}</span></div><div data-v-d1fc61b6><label class="field-label" for="konto-pass2" data-v-d1fc61b6>Passwort wiederholen</label><input id="konto-pass2"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password_confirmation)} class="field" type="password" autocomplete="new-password" data-v-d1fc61b6></div><button class="btn btn--primary btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-d1fc61b6>Passwort speichern</button></form><!--]-->`);
			_push(`</div></section><!--]-->`);
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
var Passwort_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Passwort_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d1fc61b6"]]);
//#endregion
export { Passwort_default as default };
