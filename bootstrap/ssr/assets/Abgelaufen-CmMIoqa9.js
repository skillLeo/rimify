import { t as AppLayout_default } from "./AppLayout-Bz2_RlPi.js";
import { i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Bestellung/Abgelaufen.vue?vue&type=script&setup=true&lang.ts
var Abgelaufen_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Abgelaufen",
	__ssrInlineRender: true,
	props: { number: {} },
	setup(__props) {
		const form = useForm({
			order_number: __props.number,
			email: ""
		});
		const sent = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Link abgelaufen" }, null, _parent));
			_push(`<section class="section--tight" data-v-989c1c57><div class="container" data-v-989c1c57><div class="ablauf" data-v-989c1c57><h1 class="h1" data-v-989c1c57>Dieser Link ist abgelaufen</h1><p class="ablauf__lead" data-v-989c1c57>Ein Link zu deiner Bestellung gilt zwölf Monate – den neuen schicken wir dir an die Adresse, an die die Bestätigung ging.</p>`);
			if (sent.value) _push(`<p class="ablauf__lead" role="status" data-v-989c1c57> Wenn Bestellnummer und Adresse zusammengehören, ist ein neuer Link an ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).email)} unterwegs. Er gilt zwölf Monate. </p>`);
			else _push(`<form class="ablauf__form" novalidate data-v-989c1c57><div class="form-field" data-v-989c1c57><label class="form-field__label" for="ablauf-nummer" data-v-989c1c57>Bestellnummer</label><input id="ablauf-nummer"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).order_number)} class="input" type="text" autocomplete="off" aria-describedby="ablauf-nummer-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.order_number ? "true" : void 0)} data-v-989c1c57><p id="ablauf-nummer-err" class="form-field__error" data-v-989c1c57>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.order_number ?? "")}</p></div><div class="form-field" data-v-989c1c57><label class="form-field__label" for="ablauf-mail" data-v-989c1c57>E-Mail-Adresse der Bestellung</label><input id="ablauf-mail"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="input" type="email" inputmode="email" autocomplete="email" aria-describedby="ablauf-mail-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.email ? "true" : void 0)} data-v-989c1c57><p id="ablauf-mail-err" class="form-field__error" data-v-989c1c57>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.email ?? "")}</p></div><div data-v-989c1c57><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-989c1c57>Neuen Link schicken</button></div></form>`);
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Bestellung/Abgelaufen.vue
var _sfc_setup = Abgelaufen_vue_vue_type_script_setup_true_lang_default.setup;
Abgelaufen_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Bestellung/Abgelaufen.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Abgelaufen_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Abgelaufen_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-989c1c57"]]);
//#endregion
export { Abgelaufen_default as default };
