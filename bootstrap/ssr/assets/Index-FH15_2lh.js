import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
//#region resources/js/Pages/Faq/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		groups: {},
		contact: {}
	},
	setup(__props) {
		/**
		* The FAQ. Groups and answers come from `faq_entries`, so an editor adds an answer without a
		* deployment — and the answers are the legally reviewed copy, rendered as stored.
		*
		* A search field above the groups filters questions and answers as the customer types. When
		* nothing matches, the empty state names the term that was searched and offers to clear it,
		* rather than showing an empty page.
		*
		* The help card sits beside the list from 1200px and after it below that.
		*/
		const props = __props;
		const open = (0, vue_exports.ref)(null);
		const query = (0, vue_exports.ref)("");
		const visibleGroups = (0, vue_exports.computed)(() => {
			const needle = query.value.trim().toLowerCase();
			if (needle === "") return props.groups;
			return props.groups.map((group) => ({
				...group,
				entries: group.entries.filter((entry) => entry.question.toLowerCase().includes(needle) || entry.answer.toLowerCase().includes(needle))
			})).filter((group) => group.entries.length > 0);
		});
		const phone = (0, vue_exports.computed)(() => props.contact.phoneIntl ?? props.contact.phone);
		const telHref = (0, vue_exports.computed)(() => `tel:${(phone.value ?? "").replace(/\s/g, "")}`);
		const waHref = (0, vue_exports.computed)(() => `https://wa.me/${(props.contact.whatsapp ?? "").replace(/[^0-9]/g, "")}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Meistgestellte Fragen" }, null, _parent));
			_push(`<section class="section-dense" data-v-b7e186d4><div class="wrap faq" data-v-b7e186d4><div class="faq__main" data-v-b7e186d4><h1 class="t-h1" data-v-b7e186d4>Meistgestellte Fragen</h1><form class="faq__search" role="search" data-v-b7e186d4><label class="visually-hidden" for="faq-q" data-v-b7e186d4>Fragen durchsuchen</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`<input id="faq-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="field faq__input" type="search" placeholder="Suchen" autocomplete="off" data-v-b7e186d4></form><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(visibleGroups.value, (group) => {
				_push(`<div class="faq__group" data-v-b7e186d4><h2 class="micro faq__group-title" data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(group.key)}</h2><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(group.entries, (entry) => {
					_push(`<div class="acc" data-v-b7e186d4><button class="acc__head" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", open.value === entry.id)}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `faq-a-${entry.id}`)} data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(entry.question)} <span class="${(0, server_renderer_exports.ssrRenderClass)([{ "faq__chev--open": open.value === entry.id }, "faq__chev"])}" data-v-b7e186d4>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "chevron-down",
						size: 20
					}, null, _parent));
					_push(`</span></button><div${(0, server_renderer_exports.ssrRenderAttr)("id", `faq-a-${entry.id}`)} class="acc__body t-body" style="${(0, server_renderer_exports.ssrRenderStyle)(open.value === entry.id ? null : { display: "none" })}" data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(entry.answer)}</div></div>`);
				});
				_push(`<!--]--></div>`);
			});
			_push(`<!--]-->`);
			if (visibleGroups.value.length === 0) {
				_push(`<div class="state faq__empty" data-v-b7e186d4>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "search",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-b7e186d4>Keine Antwort zu „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“ gefunden.</p><p class="t-body" data-v-b7e186d4>Versuche einen anderen Begriff, etwa „Eintragung“ oder „HSN“.</p><button class="btn btn--primary" type="button" data-v-b7e186d4>Suche löschen</button></div>`);
			} else _push(`<!---->`);
			_push(`</div><aside class="card faq__help" aria-labelledby="faq-help-title" data-v-b7e186d4><h2 id="faq-help-title" class="t-h3" data-v-b7e186d4>Nicht gefunden, was du suchst?</h2><p class="t-body faq__help-sub" data-v-b7e186d4>Schreib uns eine E-Mail – wir helfen dir gern weiter.</p><ul class="faq__ways" data-v-b7e186d4>`);
			if (phone.value) {
				_push(`<li data-v-b7e186d4><a class="faq__way"${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} data-v-b7e186d4>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`<span data-v-b7e186d4><span class="faq__way-value tabular" data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(phone.value)}</span><span class="faq__way-note" data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</span></span></a></li>`);
			} else _push(`<!---->`);
			if (__props.contact.whatsapp) {
				_push(`<li data-v-b7e186d4><a class="faq__way"${(0, server_renderer_exports.ssrRenderAttr)("href", waHref.value)} rel="noopener" data-v-b7e186d4>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`<span data-v-b7e186d4><span class="faq__way-value tabular" data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.whatsapp)}</span><span class="faq__way-note" data-v-b7e186d4>WhatsApp</span></span></a></li>`);
			} else _push(`<!---->`);
			_push(`<li data-v-b7e186d4><a class="faq__way"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${__props.contact.email}`)} data-v-b7e186d4>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20
			}, null, _parent));
			_push(`<span data-v-b7e186d4><span class="faq__way-value" data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</span><span class="faq__way-note" data-v-b7e186d4>${(0, server_renderer_exports.ssrInterpolate)(phone.value ? "E-Mail" : `E-Mail · ${__props.contact.hours}`)}</span></span></a></li></ul><hr class="hr faq__rule" data-v-b7e186d4><p class="faq__promo" data-v-b7e186d4>Kompatibilität sofort prüfen</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/rimify-check",
				class: "btn btn--secondary btn--block"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`RIMIFY-CHECK öffnen`);
					else return [(0, vue_exports.createTextVNode)("RIMIFY-CHECK öffnen")];
				}),
				_: 1
			}, _parent));
			_push(`</aside></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Faq/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Faq/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b7e186d4"]]);
//#endregion
export { Index_default as default };
