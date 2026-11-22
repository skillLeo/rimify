import { a as link_default, d as vue_exports, i as head_default, o as useForm } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DBu8iEu8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-DjkACiAr.js";
// resources/js/Pages/Admin/Anmelden/Index.vue?vue&type=script&setup=true&lang.ts
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
		* The second factor is part of this screen's design, not an interstitial added later (D-514): after the
		* password, an account that has one sees the `totp` stage — six digits from the app, or one of the
		* recovery codes for a lost phone. Five minutes, then the password is asked again.
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
		const code = useForm({ code: "" });
		const recovery = (0, vue_exports.ref)(false);
		const codeError = (0, vue_exports.computed)(() => code.errors.code ?? "");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Anmelden" }, null, _parent));
			_push(`<main id="inhalt" class="login" data-v-b6d7df6a><div class="login__brand" data-v-b6d7df6a><span class="wordmark wordmark--light" data-v-b6d7df6a>RIMIFY</span><p class="t-h2 login__line" data-v-b6d7df6a>Freigaben verwalten. Bestellungen abwickeln.</p></div><div class="login__pane" data-v-b6d7df6a><div class="login__form" data-v-b6d7df6a><span class="wordmark login__mark" data-v-b6d7df6a>RIMIFY</span>`);
			if (__props.stage === "totp") {
				_push(`<!--[--><h1 class="t-h1" data-v-b6d7df6a>Bestätigung in zwei Schritten</h1><p class="t-body login__sub" data-v-b6d7df6a>${(0, server_renderer_exports.ssrInterpolate)(recovery.value ? "Gib einen deiner Wiederherstellungscodes ein. Jeder gilt nur einmal." : "Gib den 6-stelligen Code aus deiner Authenticator-App ein.")}</p><form class="login__fields" data-v-b6d7df6a>`);
				if (codeError.value) _push(`<p class="login__error" role="alert" data-v-b6d7df6a>${(0, server_renderer_exports.ssrInterpolate)(codeError.value)}</p>`);
				else _push(`<!---->`);
				_push(`<div data-v-b6d7df6a><label class="field-label" for="lg-totp" data-v-b6d7df6a>${(0, server_renderer_exports.ssrInterpolate)(recovery.value ? "Wiederherstellungscode" : "Bestätigungscode")}</label><input id="lg-totp"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(code).code)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": codeError.value }, "field field--key"])}"${(0, server_renderer_exports.ssrRenderAttr)("inputmode", recovery.value ? "text" : "numeric")}${(0, server_renderer_exports.ssrRenderAttr)("maxlength", recovery.value ? 16 : 6)}${(0, server_renderer_exports.ssrRenderAttr)("autocomplete", recovery.value ? "off" : "one-time-code")}${(0, server_renderer_exports.ssrRenderAttr)("spellcheck", false)} autocapitalize="off" autofocus required${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", codeError.value ? "true" : void 0)} data-v-b6d7df6a></div><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(code).processing) ? " disabled" : ""} data-v-b6d7df6a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(code).processing ? "Wird geprüft …" : "Code bestätigen")}</button></form><div class="login__ways" data-v-b6d7df6a><button class="login__link" type="button" data-v-b6d7df6a>${(0, server_renderer_exports.ssrInterpolate)(recovery.value ? "Code aus der App verwenden" : "Telefon nicht zur Hand? Wiederherstellungscode verwenden")}</button>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "login__link",
					href: "/admin/anmelden?neu=1"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Mit einem anderen Konto anmelden`);
						else return [(0, vue_exports.createTextVNode)("Mit einem anderen Konto anmelden")];
					}),
					_: 1
				}, _parent));
				_push(`</div><!--]-->`);
			} else {
				_push(`<!--[--><h1 class="t-h1" data-v-b6d7df6a>Anmelden</h1><p class="t-body login__sub" data-v-b6d7df6a>Melde dich mit deinem RIMIFY-Konto an.</p><form class="login__fields" data-v-b6d7df6a>`);
				if (failure.value) _push(`<p class="login__error" role="alert" data-v-b6d7df6a>${(0, server_renderer_exports.ssrInterpolate)(failure.value)}</p>`);
				else _push(`<!---->`);
				_push(`<div data-v-b6d7df6a><label class="field-label" for="lg-mail" data-v-b6d7df6a>E-Mail</label><input id="lg-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": failure.value }, "field"])}" type="email" inputmode="email" autocomplete="username" required${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", failure.value ? "true" : void 0)} data-v-b6d7df6a></div><div data-v-b6d7df6a><label class="field-label" for="lg-pass" data-v-b6d7df6a>Passwort</label><input id="lg-pass"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": failure.value }, "field"])}" type="password" autocomplete="current-password" required${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", failure.value ? "true" : void 0)} data-v-b6d7df6a></div><label class="login__check" data-v-b6d7df6a><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).remember) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).remember, null) : (0, vue_exports.unref)(form).remember) ? " checked" : ""} type="checkbox" data-v-b6d7df6a><span data-v-b6d7df6a>Angemeldet bleiben</span></label><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-b6d7df6a>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird geprüft …" : "Anmelden")}</button></form><!--]-->`);
			}
			_push(`</div></div><span id="seitenende" hidden data-v-b6d7df6a></span></main><!--]-->`);
		};
	}
});
// resources/js/Pages/Admin/Anmelden/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Anmelden/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b6d7df6a"]]);
export { Index_default as default };
