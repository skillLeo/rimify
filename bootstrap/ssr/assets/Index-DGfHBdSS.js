import { c as vue_exports, i as useForm, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
//#region resources/js/Pages/Admin/Anmelden/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: { stage: {} },
	setup(__props) {
		/**
		* Anmelden — the one admin screen outside the panel frame, so it carries its own landmark.
		*
		* A split screen from 900px: a plain ink panel with the wordmark and one line saying what this
		* system is for, and the form. No artwork: the people who open this every morning need the fields,
		* not a backdrop. On a phone the panel goes and the wordmark sits above the form.
		*
		* The form starts empty — no pre-filled demo credentials — and there is no SSO button because no
		* SSO is configured. A button that leads nowhere is worse than no button.
		*
		* The second factor is part of this screen's design, not an interstitial added later: the Super
		* Admin's TOTP is mandatory, so the `totp` stage renders its own heading and field here.
		*
		* One page for every width.
		*/
		const form = useForm({
			email: "",
			password: "",
			remember: false
		});
		const failure = (0, vue_exports.computed)(() => form.errors.email ?? form.errors.password ?? "");
		const busy = (0, vue_exports.computed)(() => form.processing);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Anmelden" }, null, _parent));
			_push(`<main id="inhalt" class="login" data-v-25c2202e><div class="login__brand" data-v-25c2202e><span class="wordmark wordmark--light" data-v-25c2202e>RIMIFY</span><p class="t-h2 login__line" data-v-25c2202e>Freigaben verwalten. Bestellungen abwickeln.</p></div><div class="login__pane" data-v-25c2202e><div class="login__form" data-v-25c2202e><span class="wordmark login__mark" data-v-25c2202e>RIMIFY</span>`);
			if (__props.stage === "totp") _push(`<!--[--><h1 class="t-h1" data-v-25c2202e>Bestätigung in zwei Schritten</h1><p class="t-body login__sub" data-v-25c2202e>Gib den 6-stelligen Code aus deiner Authenticator-App ein.</p><form class="login__fields" data-v-25c2202e><div data-v-25c2202e><label class="field-label" for="lg-totp" data-v-25c2202e>Bestätigungscode</label><input id="lg-totp" class="field field--key" inputmode="numeric" maxlength="6" autocomplete="one-time-code" data-v-25c2202e></div><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-25c2202e>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird geprüft …" : "Code bestätigen")}</button></form><!--]-->`);
			else {
				_push(`<!--[--><h1 class="t-h1" data-v-25c2202e>Anmelden</h1><p class="t-body login__sub" data-v-25c2202e>Melde dich mit deinem RIMIFY-Konto an.</p><form class="login__fields" data-v-25c2202e>`);
				if (failure.value) _push(`<p class="login__error" role="alert" data-v-25c2202e>${(0, server_renderer_exports.ssrInterpolate)(failure.value)}</p>`);
				else _push(`<!---->`);
				_push(`<div data-v-25c2202e><label class="field-label" for="lg-mail" data-v-25c2202e>E-Mail</label><input id="lg-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": failure.value }, "field"])}" type="email" inputmode="email" autocomplete="username" required${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", failure.value ? "true" : void 0)} data-v-25c2202e></div><div data-v-25c2202e><label class="field-label" for="lg-pass" data-v-25c2202e>Passwort</label><input id="lg-pass"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": failure.value }, "field"])}" type="password" autocomplete="current-password" required${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", failure.value ? "true" : void 0)} data-v-25c2202e></div><label class="login__check" data-v-25c2202e><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).remember) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).remember, null) : (0, vue_exports.unref)(form).remember) ? " checked" : ""} type="checkbox" data-v-25c2202e><span data-v-25c2202e>Angemeldet bleiben</span></label><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-25c2202e>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird geprüft …" : "Anmelden")}</button></form><!--]-->`);
			}
			_push(`</div></div></main><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Anmelden/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Anmelden/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-25c2202e"]]);
//#endregion
export { Index_default as default };
