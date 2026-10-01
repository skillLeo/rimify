import { t as AppLayout_default } from "./AppLayout-BZT7PipA.js";
import { i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Kasse/Testzahlung.vue?vue&type=script&setup=true&lang.ts
var Testzahlung_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Testzahlung",
	__ssrInlineRender: true,
	props: { order: {} },
	setup(__props) {
		/**
		* The sandbox's payment page (App\Payments\SandboxGateway): a test order, and the three ways its
		* payment can end, chosen by whoever tests. It says plainly that it is a test and that no money moves;
		* it exists only where the review is on.
		*/
		const busy = (0, vue_exports.ref)(null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Testzahlung" }, null, _parent));
			_push(`<section class="section-dense" data-v-3b05115c><div class="wrap tz" data-v-3b05115c><p class="tag tag--unknown tz__tag" data-v-3b05115c>Testzahlung – es wird kein Geld bewegt</p><h1 class="t-h1" data-v-3b05115c>Bestellung ${(0, server_renderer_exports.ssrInterpolate)(__props.order.number)} bezahlen</h1><p class="t-lead tz__lead" data-v-3b05115c>Diese Seite ersetzt in der Vorschau den Zahlungsanbieter. Wähl, wie die Zahlung ausgehen soll.</p><ul class="tz__lines" data-v-3b05115c><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.order.lines, (line) => {
				_push(`<li class="tz__line" data-v-3b05115c><span data-v-3b05115c>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(line.label)}</span><span class="tz__money" data-v-3b05115c>${(0, server_renderer_exports.ssrInterpolate)(line.total)}</span></li>`);
			});
			_push(`<!--]--><li class="tz__line tz__line--total" data-v-3b05115c><span data-v-3b05115c>Summe</span><span class="tz__money" data-v-3b05115c>${(0, server_renderer_exports.ssrInterpolate)(__props.order.total)}</span></li></ul>`);
			if (__props.order.note) _push(`<p class="t-small tz__note" data-v-3b05115c>${(0, server_renderer_exports.ssrInterpolate)(__props.order.note)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="tz__actions" data-v-3b05115c><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value !== null) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value === "bezahlt" ? "true" : void 0)} data-v-3b05115c>Zahlung erfolgreich</button><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value !== null) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value === "abgelehnt" ? "true" : void 0)} data-v-3b05115c>Zahlung abgelehnt</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value !== null) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value === "abgebrochen" ? "true" : void 0)} data-v-3b05115c>Zahlung abbrechen</button></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kasse/Testzahlung.vue
var _sfc_setup = Testzahlung_vue_vue_type_script_setup_true_lang_default.setup;
Testzahlung_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kasse/Testzahlung.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Testzahlung_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Testzahlung_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3b05115c"]]);
//#endregion
export { Testzahlung_default as default };
