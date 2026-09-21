import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { c as Svg_default, r as adminBackdropSVG } from "./art-DxGr5VAf.js";
//#region resources/js/Pages/Admin/Anmelden/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: { stage: {} },
	setup(__props) {
		/**
		* Anmelden. A split screen: the form on the left, an engineering drawing on the right.
		*
		* The backdrop is a wheel in orthographic projection with bolt-circle construction lines and the
		* ET dimension — an engineering drawing, not decoration. It is the one piece of artwork on the
		* site whose subject is the measurement rather than the product, which is exactly right for the
		* door the compliance team walks through every morning.
		*/
		const backdrop = adminBackdropSVG(1e3);
		const busy = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Anmelden" }, null, _parent));
			_push(`<main id="inhalt" class="login" data-v-2a8c3bda><div class="login__form" data-v-2a8c3bda><span class="wordmark wordmark--ink login__mark" data-v-2a8c3bda>RIMIFY</span><h1 class="t-h1" data-v-2a8c3bda>Anmelden</h1><p class="t-body" data-v-2a8c3bda>Zugang zum Verwaltungsbereich.</p><form class="stack-4 login__fields" data-v-2a8c3bda><div data-v-2a8c3bda><label class="field-label" for="lg-mail" data-v-2a8c3bda>E-Mail</label><input id="lg-mail" class="field" type="email" autocomplete="username" data-v-2a8c3bda></div><div data-v-2a8c3bda><label class="field-label" for="lg-pass" data-v-2a8c3bda>Passwort</label><input id="lg-pass" class="field" type="password" autocomplete="current-password" data-v-2a8c3bda></div>`);
			if (__props.stage === "totp") _push(`<div data-v-2a8c3bda><label class="field-label" for="lg-totp" data-v-2a8c3bda>Bestätigungscode</label><input id="lg-totp" class="field field--key" inputmode="numeric" maxlength="6" autocomplete="one-time-code" data-v-2a8c3bda></div>`);
			else _push(`<!---->`);
			_push(`<button class="btn btn--primary btn--block btn--lg" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-2a8c3bda>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird geprüft …" : "Anmelden")}</button></form></div><div class="login__art" aria-hidden="true" data-v-2a8c3bda>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, { markup: (0, vue_exports.unref)(backdrop) }, null, _parent));
			_push(`</div></main><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Anmelden/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Anmelden/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2a8c3bda"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
