import { a as link_default, i as head_default, o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/Einladung/Index.vue?vue&type=script&setup=true&lang.ts
var ASK = "Bitte die Person, die dich eingeladen hat, um einen neuen Link.";
/** One heading and one sentence per dead link, each ending in what to do. */
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		state: {},
		invitation: {}
	},
	setup(__props) {
		/**
		* The invitation link — outside the panel frame, like Anmelden, and drawn the same way: a plain ink
		* panel with the wordmark from 900px, and the form. On a phone the panel goes and the wordmark sits
		* above the form.
		*
		* An open link asks for two things: the name the team will see (prefilled from the invitation) and
		* a password, typed twice. Every other state is one sentence and what to do next — nothing about
		* whose invitation it was, and never an empty form that could not be sent.
		*/
		const props = __props;
		usePage();
		const DEAD = {
			expired: {
				title: "Dieser Link ist abgelaufen.",
				text: `Einladungen gelten nur eine Woche. ${ASK}`
			},
			revoked: {
				title: "Diese Einladung wurde zurückgezogen.",
				text: `Der Link funktioniert nicht mehr. Wenn du trotzdem Zugang brauchst: ${ASK}`
			},
			used: {
				title: "Dieser Link wurde schon benutzt.",
				text: `Zu dieser Einladung gibt es schon ein Konto – melde dich damit an. Warst du das nicht? ${ASK}`
			},
			unknown: {
				title: "Diesen Link kennen wir nicht.",
				text: `Vielleicht ist er unvollständig, oder er wurde durch einen neueren ersetzt. ${ASK}`
			}
		};
		const dead = (0, vue_exports.computed)(() => props.state === "open" ? null : DEAD[props.state]);
		const form = useForm({
			name: props.invitation?.name ?? "",
			password: "",
			password_confirmation: ""
		});
		const busy = (0, vue_exports.computed)(() => form.processing);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: __props.state === "open" ? "Einladung annehmen" : "Einladung" }, null, _parent));
			_push(`<main id="inhalt" class="invite" data-v-c3ab443a><div class="invite__brand" data-v-c3ab443a><span class="wordmark wordmark--light" data-v-c3ab443a>RIMIFY</span><p class="t-h2 invite__line" data-v-c3ab443a>Freigaben verwalten. Bestellungen abwickeln.</p></div><div class="invite__pane" data-v-c3ab443a><div class="invite__form" data-v-c3ab443a><span class="wordmark invite__mark" data-v-c3ab443a>RIMIFY</span>`);
			if (dead.value) {
				_push(`<!--[--><h1 class="t-h1" data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)(dead.value.title)}</h1><p class="t-body invite__sub" data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)(dead.value.text)}</p>`);
				if (__props.state === "used") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/admin/anmelden",
					class: "btn btn--primary btn--block btn--lg invite__go"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Zur Anmeldung `);
						else return [(0, vue_exports.createTextVNode)(" Zur Anmeldung ")];
					}),
					_: 1
				}, _parent));
				else _push(`<!---->`);
				_push(`<!--]-->`);
			} else if (__props.invitation) {
				_push(`<!--[--><h1 class="t-h1" data-v-c3ab443a>Willkommen im RIMIFY-Admin</h1><p class="t-body invite__sub" data-v-c3ab443a>`);
				if (__props.invitation.invitedBy) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.invitation.invitedBy)} hat dich eingeladen.<!--]-->`);
				else _push(`<!---->`);
				_push(` Leg dein Passwort fest, dann bist du angemeldet. </p><dl class="invite__facts" data-v-c3ab443a><div class="invite__fact" data-v-c3ab443a><dt data-v-c3ab443a>E-Mail</dt><dd data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)(__props.invitation.email)}</dd></div>`);
				if (__props.invitation.role) _push(`<div class="invite__fact" data-v-c3ab443a><dt data-v-c3ab443a>Rolle</dt><dd data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)(__props.invitation.role)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="invite__fact" data-v-c3ab443a><dt data-v-c3ab443a>Link gültig bis</dt><dd data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)(__props.invitation.expiresAt)}</dd></div></dl><form class="invite__fields" novalidate data-v-c3ab443a><input class="visually-hidden" type="email" name="username" autocomplete="username"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.invitation.email)} readonly tabindex="-1" aria-hidden="true" data-v-c3ab443a><div data-v-c3ab443a><label class="field-label" for="inv-name" data-v-c3ab443a>Dein Name</label><input id="inv-name"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).name)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": (0, vue_exports.unref)(form).errors.name }, "field"])}" type="text" autocomplete="name" maxlength="255" required aria-describedby="inv-name-help inv-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.name ? "true" : void 0)} data-v-c3ab443a><p id="inv-name-help" class="invite__help" data-v-c3ab443a>So sieht dich das Team im Admin.</p>`);
				if ((0, vue_exports.unref)(form).errors.name) _push(`<p id="inv-name-err" class="invite__error" role="alert" data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.name)}</p>`);
				else _push(`<!---->`);
				_push(`</div><div data-v-c3ab443a><label class="field-label" for="inv-pass" data-v-c3ab443a>Passwort</label><input id="inv-pass"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": (0, vue_exports.unref)(form).errors.password }, "field"])}" type="password" autocomplete="new-password" required aria-describedby="inv-pass-help inv-pass-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.password ? "true" : void 0)} data-v-c3ab443a><p id="inv-pass-help" class="invite__help" data-v-c3ab443a>Mindestens 12 Zeichen.</p>`);
				if ((0, vue_exports.unref)(form).errors.password) _push(`<p id="inv-pass-err" class="invite__error" role="alert" data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.password)}</p>`);
				else _push(`<!---->`);
				_push(`</div><div data-v-c3ab443a><label class="field-label" for="inv-repeat" data-v-c3ab443a>Passwort wiederholen</label><input id="inv-repeat"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password_confirmation)} class="field" type="password" autocomplete="new-password" required data-v-c3ab443a></div><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-c3ab443a>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird eingerichtet …" : "Konto einrichten")}</button></form><!--]-->`);
			} else _push(`<!---->`);
			_push(`</div></div></main><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Einladung/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Einladung/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c3ab443a"]]);
//#endregion
export { Index_default as default };
