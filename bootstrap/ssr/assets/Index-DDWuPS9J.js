import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BA7BbMo6.js";
import { a as link_default, d as vue_exports, l as router } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as useDirtyForm } from "./useDirtyForm-CUSvyfaU.js";
import { t as AdminSaveBar_default } from "./AdminSaveBar-BD5_vH_r.js";
//#region resources/js/Pages/Admin/Profil/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		profile: {},
		twoFactor: {}
	},
	setup(__props) {
		/**
		* Profil — your own account: who the panel thinks you are, and your password.
		*
		* Name and address are shown, not edited here: they are how the team recognises an account in the
		* Protokoll, so they are changed by whoever manages users, and the page says so instead of offering
		* a field that would be refused. Bestätigung in zwei Schritten (D-514) has its own section: its state,
		* and what can be done with it — each change behind the password asked again (EnsureSudo).
		*
		* The password is the page's one form. After a save its fields are emptied — a password is never
		* left on screen — and the toast is the confirmation.
		*/
		const props = __props;
		const context = [props.profile.role ?? props.profile.email, props.profile.lastLogin ? `zuletzt angemeldet am ${props.profile.lastLogin}` : null].filter(Boolean).join(" · ");
		const editor = useDirtyForm({
			current_password: "",
			password: "",
			password_confirmation: ""
		}, {
			method: "put",
			url: "/admin/profil/passwort",
			resetOnSuccess: true
		});
		const form = editor.form;
		const twoFactor = props.twoFactor;
		const recoveryLine = twoFactor.recoveryLeft === 1 ? "Dir bleibt noch 1 Wiederherstellungscode." : `Dir bleiben noch ${twoFactor.recoveryLeft} Wiederherstellungscodes.`;
		function renewCodes() {
			router.post("/admin/zwei-faktor/wiederherstellungscodes");
		}
		function switchOff() {
			router.delete("/admin/zwei-faktor", { preserveScroll: true });
		}
		(0, vue_exports.onMounted)(() => {
			if (window.location.hash === "#passwort") document.getElementById("pw-current")?.focus();
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Profil",
				context: (0, vue_exports.unref)(context)
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form class="adm-form" novalidate data-v-37c859e4${_scopeId}><section class="adm-form__group" aria-labelledby="profil-konto" data-v-37c859e4${_scopeId}><h2 id="profil-konto" class="adm-form__heading" data-v-37c859e4${_scopeId}>Konto</h2><dl class="adm-facts" data-v-37c859e4${_scopeId}><div class="adm-facts__row" data-v-37c859e4${_scopeId}><dt data-v-37c859e4${_scopeId}>Name</dt><dd data-v-37c859e4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.profile.name)}</dd></div><div class="adm-facts__row" data-v-37c859e4${_scopeId}><dt data-v-37c859e4${_scopeId}>E-Mail</dt><dd data-v-37c859e4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.profile.email)}</dd></div>`);
						if (__props.profile.role) _push(`<div class="adm-facts__row" data-v-37c859e4${_scopeId}><dt data-v-37c859e4${_scopeId}>Rolle</dt><dd data-v-37c859e4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.profile.role)}</dd></div>`);
						else _push(`<!---->`);
						_push(`</dl><p class="adm-form__note" data-v-37c859e4${_scopeId}>Das ändert, wer im Admin die Benutzer verwaltet.</p></section><section id="passwort" class="adm-form__group" aria-labelledby="profil-passwort" data-v-37c859e4${_scopeId}><h2 id="profil-passwort" class="adm-form__heading" data-v-37c859e4${_scopeId}>Passwort</h2><div class="form-field" data-v-37c859e4${_scopeId}><label class="form-field__label" for="pw-current" data-v-37c859e4${_scopeId}>Aktuelles Passwort</label><input id="pw-current"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).current_password)} class="input" type="password" autocomplete="current-password"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.current_password ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", (0, vue_exports.unref)(form).errors.current_password ? "pw-current-error" : void 0)} data-v-37c859e4${_scopeId}><p id="pw-current-error" class="form-field__error" data-v-37c859e4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.current_password)}</p></div><div class="form-field" data-v-37c859e4${_scopeId}><label class="form-field__label" for="pw-new" data-v-37c859e4${_scopeId}>Neues Passwort</label><input id="pw-new"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="input" type="password" autocomplete="new-password"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.password ? "true" : void 0)} aria-describedby="pw-new-help pw-new-error" data-v-37c859e4${_scopeId}><p id="pw-new-help" class="form-field__help" data-v-37c859e4${_scopeId}>Mindestens 12 Zeichen.</p><p id="pw-new-error" class="form-field__error" data-v-37c859e4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.password)}</p></div><div class="form-field" data-v-37c859e4${_scopeId}><label class="form-field__label" for="pw-repeat" data-v-37c859e4${_scopeId}>Neues Passwort wiederholen</label><input id="pw-repeat"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password_confirmation)} class="input" type="password" autocomplete="new-password" data-v-37c859e4${_scopeId}></div></section></form><section id="zwei-faktor" class="adm-form adm-form__group" aria-labelledby="profil-zwei-faktor" data-v-37c859e4${_scopeId}><h2 id="profil-zwei-faktor" class="adm-form__heading" data-v-37c859e4${_scopeId}>Bestätigung in zwei Schritten</h2>`);
						if ((0, vue_exports.unref)(twoFactor).active) {
							_push(`<!--[--><p class="adm-form__note" data-tfa-state="an" data-v-37c859e4${_scopeId}> Eingeschaltet. Nach dem Passwort fragt die Anmeldung nach einem Code aus deiner App. ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(recoveryLine))}</p><div class="profil__actions" data-v-37c859e4${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								class: "btn btn--secondary",
								href: "/admin/zwei-faktor/neu"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`Auf ein neues Telefon übertragen`);
									else return [(0, vue_exports.createTextVNode)("Auf ein neues Telefon übertragen")];
								}),
								_: 1
							}, _parent, _scopeId));
							_push(`<button class="btn btn--secondary" type="button" data-v-37c859e4${_scopeId}>Neue Wiederherstellungscodes erzeugen</button>`);
							if (!(0, vue_exports.unref)(twoFactor).required) _push(`<button class="btn btn--secondary" type="button" data-v-37c859e4${_scopeId}>Ausschalten</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
							if ((0, vue_exports.unref)(twoFactor).required) _push(`<p class="adm-form__note" data-v-37c859e4${_scopeId}>Für Super-Admins ist sie Pflicht und lässt sich nicht ausschalten.</p>`);
							else _push(`<!---->`);
							_push(`<!--]-->`);
						} else {
							_push(`<!--[--><p class="adm-form__note" data-tfa-state="aus" data-v-37c859e4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(twoFactor).unreadable ? "Richte sie bitte neu ein: Der gespeicherte Schlüssel lässt sich nicht mehr lesen." : "Ausgeschaltet. Mit einem Code aus einer App auf deinem Telefon kommt niemand mit deinem Passwort allein in dein Konto.")}</p><div class="profil__actions" data-v-37c859e4${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								class: "btn btn--primary",
								href: "/admin/zwei-faktor/einrichten"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`Einrichten`);
									else return [(0, vue_exports.createTextVNode)("Einrichten")];
								}),
								_: 1
							}, _parent, _scopeId));
							_push(`</div><!--]-->`);
						}
						_push(`</section>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)("form", {
							class: "adm-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"]),
							onKeydown: (0, vue_exports.withKeys)((0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"]), ["enter"])
						}, [(0, vue_exports.createVNode)("section", {
							class: "adm-form__group",
							"aria-labelledby": "profil-konto"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "profil-konto",
								class: "adm-form__heading"
							}, "Konto"),
							(0, vue_exports.createVNode)("dl", { class: "adm-facts" }, [
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Name"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.profile.name), 1)]),
								(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "E-Mail"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.profile.email), 1)]),
								__props.profile.role ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "Rolle"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.profile.role), 1)])) : (0, vue_exports.createCommentVNode)("", true)
							]),
							(0, vue_exports.createVNode)("p", { class: "adm-form__note" }, "Das ändert, wer im Admin die Benutzer verwaltet.")
						]), (0, vue_exports.createVNode)("section", {
							id: "passwort",
							class: "adm-form__group",
							"aria-labelledby": "profil-passwort"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "profil-passwort",
								class: "adm-form__heading"
							}, "Passwort"),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "pw-current"
								}, "Aktuelles Passwort"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "pw-current",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).current_password = $event,
									class: "input",
									type: "password",
									autocomplete: "current-password",
									"aria-invalid": (0, vue_exports.unref)(form).errors.current_password ? "true" : void 0,
									"aria-describedby": (0, vue_exports.unref)(form).errors.current_password ? "pw-current-error" : void 0
								}, null, 8, [
									"onUpdate:modelValue",
									"aria-invalid",
									"aria-describedby"
								]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).current_password]]),
								(0, vue_exports.createVNode)("p", {
									id: "pw-current-error",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.current_password), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "pw-new"
								}, "Neues Passwort"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "pw-new",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).password = $event,
									class: "input",
									type: "password",
									autocomplete: "new-password",
									"aria-invalid": (0, vue_exports.unref)(form).errors.password ? "true" : void 0,
									"aria-describedby": "pw-new-help pw-new-error"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).password]]),
								(0, vue_exports.createVNode)("p", {
									id: "pw-new-help",
									class: "form-field__help"
								}, "Mindestens 12 Zeichen."),
								(0, vue_exports.createVNode)("p", {
									id: "pw-new-error",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.password), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "pw-repeat"
							}, "Neues Passwort wiederholen"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "pw-repeat",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).password_confirmation = $event,
								class: "input",
								type: "password",
								autocomplete: "new-password"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).password_confirmation]])])
						])], 40, ["onSubmit", "onKeydown"]),
						(0, vue_exports.createVNode)("section", {
							id: "zwei-faktor",
							class: "adm-form adm-form__group",
							"aria-labelledby": "profil-zwei-faktor"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "profil-zwei-faktor",
							class: "adm-form__heading"
						}, "Bestätigung in zwei Schritten"), (0, vue_exports.unref)(twoFactor).active ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
							(0, vue_exports.createVNode)("p", {
								class: "adm-form__note",
								"data-tfa-state": "an"
							}, " Eingeschaltet. Nach dem Passwort fragt die Anmeldung nach einem Code aus deiner App. " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(recoveryLine)), 1),
							(0, vue_exports.createVNode)("div", { class: "profil__actions" }, [
								(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
									class: "btn btn--secondary",
									href: "/admin/zwei-faktor/neu"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Auf ein neues Telefon übertragen")]),
									_: 1
								}),
								(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: renewCodes
								}, "Neue Wiederherstellungscodes erzeugen"),
								!(0, vue_exports.unref)(twoFactor).required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--secondary",
									type: "button",
									onClick: switchOff
								}, "Ausschalten")) : (0, vue_exports.createCommentVNode)("", true)
							]),
							(0, vue_exports.unref)(twoFactor).required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-form__note"
							}, "Für Super-Admins ist sie Pflicht und lässt sich nicht ausschalten.")) : (0, vue_exports.createCommentVNode)("", true)
						], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("p", {
							class: "adm-form__note",
							"data-tfa-state": "aus"
						}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(twoFactor).unreadable ? "Richte sie bitte neu ein: Der gespeicherte Schlüssel lässt sich nicht mehr lesen." : "Ausgeschaltet. Mit einem Code aus einer App auf deinem Telefon kommt niemand mit deinem Passwort allein in dein Konto."), 1), (0, vue_exports.createVNode)("div", { class: "profil__actions" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							class: "btn btn--primary",
							href: "/admin/zwei-faktor/einrichten"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Einrichten")]),
							_: 1
						})])], 64))]),
						(0, vue_exports.createVNode)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, 8, ["editor"])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Profil/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Profil/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-37c859e4"]]);
//#endregion
export { Index_default as default };
