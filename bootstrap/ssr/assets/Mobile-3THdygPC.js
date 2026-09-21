import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
//#region resources/js/Pages/Admin/Anmelden/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: { stage: {} },
	setup(__props) {
		/** Anmelden on a phone: one column, full-width action, no backdrop. */
		const busy = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Anmelden" }, null, _parent));
			_push(`<main id="inhalt" class="mlogin" data-v-cd561b02><span class="wordmark wordmark--ink mlogin__mark" data-v-cd561b02>RIMIFY</span><h1 class="t-h1" data-v-cd561b02>Anmelden</h1><p class="t-body" data-v-cd561b02>Zugang zum Verwaltungsbereich.</p><form class="stack-4 mlogin__fields" data-v-cd561b02><div data-v-cd561b02><label class="field-label" for="mlg-mail" data-v-cd561b02>E-Mail</label><input id="mlg-mail" class="field" type="email" autocomplete="username" data-v-cd561b02></div><div data-v-cd561b02><label class="field-label" for="mlg-pass" data-v-cd561b02>Passwort</label><input id="mlg-pass" class="field" type="password" autocomplete="current-password" data-v-cd561b02></div>`);
			if (__props.stage === "totp") _push(`<div data-v-cd561b02><label class="field-label" for="mlg-totp" data-v-cd561b02>Bestätigungscode</label><input id="mlg-totp" class="field field--key" inputmode="numeric" maxlength="6" autocomplete="one-time-code" data-v-cd561b02></div>`);
			else _push(`<!---->`);
			_push(`<button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-cd561b02>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird geprüft …" : "Anmelden")}</button></form></main><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Anmelden/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Anmelden/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-cd561b02"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
