import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
//#region resources/js/Pages/CheckErgebnis/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		token: {},
		result: {}
	},
	setup(__props) {
		/**
		* The check result on a phone. Same content, full-width actions — this is a page people open from
		* a link someone sent them, so it has to stand alone with no prior context.
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
					class: "btn btn--primary btn--block"
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
//#region resources/js/Pages/CheckErgebnis/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/CheckErgebnis/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = Mobile_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Mobile_exports as n, Mobile_default as t };
