import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
//#region resources/js/Pages/CheckErgebnis/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		token: {},
		result: {}
	},
	setup(__props) {
		/**
		* The shareable check result.
		*
		* Addressed by a token rather than a query string, because the whole point of this page is that it
		* can be sent to a workshop, printed, and still say the same thing next week. The four verdict
		* states are all rendered here — including `UNKNOWN`, which is a neutral answer and never dressed
		* as a refusal (R-07).
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Ergebnis" }, null, _parent));
			_push(`<section class="section"><div class="wrap">`);
			if (__props.result === null) {
				_push(`<div class="state">`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title">Dieses Ergebnis ist nicht mehr verfügbar.</p><p class="t-body"> Ergebnis-Links verfallen, wenn sich die zugrunde liegende Freigabe geändert hat. Führe die Prüfung erneut durch, damit du den aktuellen Stand erhältst. </p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/rimify-check",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Neue Prüfung starten`);
						else return [(0, vue_exports.createTextVNode)("Neue Prüfung starten")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/CheckErgebnis/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/CheckErgebnis/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = Desktop_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Desktop_exports as n, Desktop_default as t };
