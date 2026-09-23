import { c as vue_exports, n as head_default } from "../ssr.js";
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
		const busy = (0, vue_exports.ref)(false);
		const remember = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Anmelden" }, null, _parent));
			_push(`<main id="inhalt" class="login" data-v-5ac684bf><div class="login__brand" data-v-5ac684bf><span class="wordmark wordmark--light" data-v-5ac684bf>RIMIFY</span><p class="t-h2 login__line" data-v-5ac684bf>Freigaben verwalten. Bestellungen abwickeln.</p></div><div class="login__pane" data-v-5ac684bf><div class="login__form" data-v-5ac684bf><span class="wordmark login__mark" data-v-5ac684bf>RIMIFY</span>`);
			if (__props.stage === "totp") _push(`<!--[--><h1 class="t-h1" data-v-5ac684bf>Bestätigung in zwei Schritten</h1><p class="t-body login__sub" data-v-5ac684bf>Gib den 6-stelligen Code aus deiner Authenticator-App ein.</p><form class="login__fields" data-v-5ac684bf><div data-v-5ac684bf><label class="field-label" for="lg-totp" data-v-5ac684bf>Bestätigungscode</label><input id="lg-totp" class="field field--key" inputmode="numeric" maxlength="6" autocomplete="one-time-code" data-v-5ac684bf></div><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-5ac684bf>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird geprüft …" : "Code bestätigen")}</button></form><!--]-->`);
			else _push(`<!--[--><h1 class="t-h1" data-v-5ac684bf>Anmelden</h1><p class="t-body login__sub" data-v-5ac684bf>Melde dich mit deinem RIMIFY-Konto an.</p><form class="login__fields" data-v-5ac684bf><div data-v-5ac684bf><label class="field-label" for="lg-mail" data-v-5ac684bf>E-Mail</label><input id="lg-mail" class="field" type="email" inputmode="email" autocomplete="username" data-v-5ac684bf></div><div data-v-5ac684bf><label class="field-label" for="lg-pass" data-v-5ac684bf>Passwort</label><input id="lg-pass" class="field" type="password" autocomplete="current-password" data-v-5ac684bf></div><label class="login__check" data-v-5ac684bf><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(remember.value) ? (0, server_renderer_exports.ssrLooseContain)(remember.value, null) : remember.value) ? " checked" : ""} type="checkbox" data-v-5ac684bf><span data-v-5ac684bf>Angemeldet bleiben</span></label><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-5ac684bf>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird geprüft …" : "Anmelden")}</button></form><!--]-->`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5ac684bf"]]);
//#endregion
export { Index_default as default };
