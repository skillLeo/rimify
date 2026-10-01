import { t as AppLayout_default } from "./AppLayout-BhIIy6Mj.js";
import { i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { _ as useShared } from "./useShortcuts-ClS45_r5.js";
import { t as Icon_default } from "./Icon-BQovY8K8.js";
import { t as mailtoHref } from "./mailto-LEYUvS8P.js";
//#region resources/js/Pages/Kontakt/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: { contact: {} },
	setup(__props) {
		/**
		* Kontakt.
		*
		* E-mail is the shop's one confirmed channel (docs/phase0/ACCURACY.md D5), so the page is an
		* e-mail block: the address, the service hours, and a button that opens the customer's mail
		* program. There is no form. A form needs an endpoint behind it — a Form Request, a Policy, a mail
		* and a feature test (CLAUDE.md §8) — and one without swallows the message without a word. It
		* comes back together with that endpoint, not before.
		*
		* Every contact detail renders from `config('rimify.contact')` via the controller, never from a
		* literal here (D-023). A chosen vehicle is written into the prepared e-mail, because the first
		* thing we would ask is which car the question is about. No reply-time promise: the client gave
		* service hours, not a response time.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle ?? null);
		const mailHref = (0, vue_exports.computed)(() => mailtoHref(props.contact.email, {
			subject: "Anfrage",
			body: vehicle.value === null ? "" : `Fahrzeug: ${vehicle.value.label} (${vehicle.value.keyNumbers})\n\n`
		}));
		const telHref = (0, vue_exports.computed)(() => `tel:${(props.contact.phoneIntl ?? props.contact.phone ?? "").replace(/\s/g, "")}`);
		const waHref = (0, vue_exports.computed)(() => `https://wa.me/${(props.contact.whatsapp ?? "").replace(/[^0-9]/g, "")}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kontakt" }, null, _parent));
			_push(`<section class="section-dense" data-v-4acc21ef><div class="wrap" data-v-4acc21ef><h1 class="t-h1" data-v-4acc21ef>Kontakt</h1><p class="t-lead kon__lead" data-v-4acc21ef> Fragen zur Passgenauigkeit, zu einer Bestellung oder zu einem Gutachten? Schreib uns. </p><section class="card kon__mail" aria-labelledby="kon-mail-title" data-v-4acc21ef><h2 id="kon-mail-title" class="t-h3" data-v-4acc21ef>Schreib uns eine E-Mail</h2><p class="t-body kon__text" data-v-4acc21ef> An <a class="kon__address"${(0, server_renderer_exports.ssrRenderAttr)("href", mailHref.value)} data-v-4acc21ef>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</a> – wir sind ${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)} für dich da. </p><p class="t-small kon__hint" data-v-4acc21ef>`);
			if (vehicle.value) _push(`<!--[--> Dein Fahrzeug steht schon in der E-Mail: ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)} (${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? vehicle.value.keyNumbers)}). <!--]-->`);
			else _push(`<!--[-->Wenn es um die Passform geht, gern mit HSN, TSN und Modell.<!--]-->`);
			_push(`</p><a class="btn btn--primary kon__send"${(0, server_renderer_exports.ssrRenderAttr)("href", mailHref.value)} data-v-4acc21ef>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20
			}, null, _parent));
			_push(` E-Mail schreiben </a>`);
			if (__props.contact.phone || __props.contact.whatsapp) {
				_push(`<ul class="kon__ways" data-v-4acc21ef>`);
				if (__props.contact.phone) {
					_push(`<li data-v-4acc21ef><a class="kon__way"${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} data-v-4acc21ef>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "phone",
						size: 20
					}, null, _parent));
					_push(`<span data-v-4acc21ef><span class="kon__way-value tabular" data-v-4acc21ef>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phone)}</span><span class="kon__way-note" data-v-4acc21ef>Telefon</span></span></a></li>`);
				} else _push(`<!---->`);
				if (__props.contact.whatsapp) {
					_push(`<li data-v-4acc21ef><a class="kon__way"${(0, server_renderer_exports.ssrRenderAttr)("href", waHref.value)} rel="noopener" data-v-4acc21ef>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "phone",
						size: 20
					}, null, _parent));
					_push(`<span data-v-4acc21ef><span class="kon__way-value tabular" data-v-4acc21ef>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.whatsapp)}</span><span class="kon__way-note" data-v-4acc21ef>WhatsApp</span></span></a></li>`);
				} else _push(`<!---->`);
				_push(`</ul>`);
			} else _push(`<!---->`);
			_push(`</section></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kontakt/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kontakt/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4acc21ef"]]);
//#endregion
export { Index_default as default };
