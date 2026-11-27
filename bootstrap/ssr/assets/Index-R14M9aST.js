import { a as link_default, d as vue_exports, i as head_default, o as useForm } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/ZweiFaktor/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		stage: {},
		email: {},
		required: { type: Boolean },
		replacing: { type: Boolean },
		unreadable: { type: Boolean },
		qr: {},
		manualKey: {},
		codes: {},
		next: {}
	},
	setup(__props) {
		/**
		* Bestätigung in zwei Schritten — setting it up, and the recovery codes shown once (D-514).
		*
		* Outside the panel frame, like Anmelden: a Super-Admin without a second factor reaches nothing but
		* this page and the way out (EnsureTwoFactorSetUp), so it cannot lean on the rail or the bell.
		*
		* Setup is two steps on one screen: scan (or type) the key, then type the code the app shows — only
		* that code stores the key, so a setup left halfway never locks anyone out. The QR code is drawn on
		* the server as SVG from the key this session holds.
		*
		* One page for every width.
		*/
		const props = __props;
		const form = useForm({ code: "" });
		useForm({});
		const heading = (0, vue_exports.computed)(() => {
			if (props.stage === "codes") return "Deine Wiederherstellungscodes";
			return props.replacing ? "Auf ein neues Telefon übertragen" : "Bestätigung in zwei Schritten einrichten";
		});
		const intro = (0, vue_exports.computed)(() => {
			if (props.stage === "codes") return "Hast du dein Telefon nicht zur Hand, meldest du dich mit einem dieser Codes an. Jeder gilt einmal. Bewahr sie getrennt von deinem Telefon auf – du siehst sie nur jetzt.";
			if (props.replacing) return "Dein bisheriges Telefon gilt, bis du hier den ersten Code des neuen eingibst.";
			const after = "Nach dem Passwort fragt die Anmeldung dann nach einem Code aus einer App auf deinem Telefon.";
			if (props.unreadable) return `Richte sie bitte neu ein: Der gespeicherte Schlüssel lässt sich nicht mehr lesen. ${after}`;
			return props.required ? `Für Super-Admins ist sie Pflicht. ${after}` : after;
		});
		const copied = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: heading.value }, null, _parent));
			_push(`<main id="inhalt" class="tfa" data-v-01f9de32><div class="tfa__column" data-v-01f9de32><span class="wordmark tfa__mark" data-v-01f9de32>RIMIFY</span><h1 class="t-h1" data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)(heading.value)}</h1><p class="t-body tfa__intro" data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)(intro.value)}</p>`);
			if (__props.stage === "setup") {
				_push(`<!--[--><ol class="tfa__steps" data-v-01f9de32><li class="tfa__step" data-v-01f9de32><h2 class="t-h3" data-v-01f9de32>Code scannen</h2><p class="tfa__hint" data-v-01f9de32> Öffne eine Authenticator-App – etwa Google Authenticator, Microsoft Authenticator oder 1Password – und scanne diesen Code. </p><div class="tfa__qr" role="img"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `QR-Code für das RIMIFY-Konto ${__props.email}`)} data-v-01f9de32>${__props.qr ?? ""}</div><p class="tfa__hint" data-v-01f9de32>Kein Scanner? Gib diesen Schlüssel von Hand ein:</p><div class="tfa__key" data-v-01f9de32><code class="tfa__key-text" data-tfa-key data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)(__props.manualKey)}</code><button class="btn btn--secondary btn--sm" type="button" data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)(copied.value ? "Kopiert" : "Kopieren")}</button></div></li><li class="tfa__step" data-v-01f9de32><h2 class="t-h3" data-v-01f9de32>Code eingeben</h2><form class="tfa__form" novalidate data-v-01f9de32><div data-v-01f9de32><label class="field-label" for="tfa-code" data-v-01f9de32>Code aus der App</label><input id="tfa-code"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).code)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": (0, vue_exports.unref)(form).errors.code }, "field field--key"])}" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.code ? "true" : void 0)} aria-describedby="tfa-code-error" data-v-01f9de32><p id="tfa-code-error" class="tfa__error" role="alert" data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.code)}</p></div><button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).processing ? "Wird geprüft …" : __props.replacing ? "Übertragen" : "Einrichten")}</button></form></li></ol><div class="tfa__ways" data-v-01f9de32>`);
				if (__props.required && !__props.replacing) _push(`<form data-v-01f9de32><button class="tfa__link" type="submit" data-v-01f9de32>Abmelden</button></form>`);
				else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "tfa__link",
					href: "/admin/profil#zwei-faktor"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Abbrechen`);
						else return [(0, vue_exports.createTextVNode)("Abbrechen")];
					}),
					_: 1
				}, _parent));
				_push(`</div><!--]-->`);
			} else {
				_push(`<!--[--><ul class="tfa__codes" data-tfa-codes data-v-01f9de32><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.codes, (item) => {
					_push(`<li data-v-01f9de32><code data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)(item)}</code></li>`);
				});
				_push(`<!--]--></ul><div class="tfa__actions" data-v-01f9de32><button class="btn btn--secondary" type="button" data-v-01f9de32>${(0, server_renderer_exports.ssrInterpolate)(copied.value ? "Kopiert" : "Codes kopieren")}</button>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "btn btn--primary",
					href: __props.next
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Ich habe sie aufbewahrt`);
						else return [(0, vue_exports.createTextVNode)("Ich habe sie aufbewahrt")];
					}),
					_: 1
				}, _parent));
				_push(`</div><!--]-->`);
			}
			_push(`</div><span id="seitenende" hidden data-v-01f9de32></span></main><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/ZweiFaktor/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/ZweiFaktor/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-01f9de32"]]);
//#endregion
export { Index_default as default };
