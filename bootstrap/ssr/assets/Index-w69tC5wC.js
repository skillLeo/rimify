import { t as AppLayout_default } from "./AppLayout-BUrEMFuK.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { r as paragraphs } from "./format-BSciVE2Q.js";
import { t as Icon_default } from "./Icon-BQovY8K8.js";
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
			_push(`<section class="section-dense" data-v-629d638f><div class="wrap faq" data-v-629d638f><div class="faq__main" data-v-629d638f><h1 class="t-h1" data-v-629d638f>Meistgestellte Fragen</h1><form class="faq__search" role="search" data-v-629d638f><label class="visually-hidden" for="faq-q" data-v-629d638f>Fragen durchsuchen</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "search",
				size: 20
			}, null, _parent));
			_push(`<input id="faq-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="field faq__input" type="search" placeholder="Suchen" autocomplete="off" data-v-629d638f></form><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(visibleGroups.value, (group) => {
				_push(`<div class="faq__group" data-v-629d638f><h2 class="micro faq__group-title" data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(group.key)}</h2><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(group.entries, (entry) => {
					_push(`<div class="acc" data-v-629d638f><button class="acc__head" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", open.value === entry.id)}${(0, server_renderer_exports.ssrRenderAttr)("aria-controls", `faq-a-${entry.id}`)} data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(entry.question)} <span class="${(0, server_renderer_exports.ssrRenderClass)([{ "faq__chev--open": open.value === entry.id }, "faq__chev"])}" data-v-629d638f>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "chevron-down",
						size: 20
					}, null, _parent));
					_push(`</span></button><div${(0, server_renderer_exports.ssrRenderAttr)("id", `faq-a-${entry.id}`)} class="acc__body t-body" style="${(0, server_renderer_exports.ssrRenderStyle)(open.value === entry.id ? null : { display: "none" })}" data-v-629d638f><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(paragraphs)(entry.answer), (paragraph, p) => {
						_push(`<p class="faq__para" data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(paragraph)}</p>`);
					});
					_push(`<!--]--></div></div>`);
				});
				_push(`<!--]--></div>`);
			});
			_push(`<!--]-->`);
			if (visibleGroups.value.length === 0) {
				_push(`<div class="state faq__empty" data-v-629d638f>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "search",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-629d638f>Keine Antwort zu „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“ gefunden.</p><p class="t-body" data-v-629d638f>Versuche einen anderen Begriff, etwa „Eintragung“ oder „HSN“.</p><button class="btn btn--primary" type="button" data-v-629d638f>Suche löschen</button></div>`);
			} else _push(`<!---->`);
			_push(`</div><aside class="card faq__help" aria-labelledby="faq-help-title" data-v-629d638f><h2 id="faq-help-title" class="t-h3" data-v-629d638f>Nicht gefunden, was du suchst?</h2><p class="t-body faq__help-sub" data-v-629d638f>Schreib uns eine E-Mail – wir helfen dir gern weiter.</p><ul class="faq__ways" data-v-629d638f>`);
			if (phone.value) {
				_push(`<li data-v-629d638f><a class="faq__way"${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} data-v-629d638f>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`<span data-v-629d638f><span class="faq__way-value tabular" data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(phone.value)}</span><span class="faq__way-note" data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</span></span></a></li>`);
			} else _push(`<!---->`);
			if (__props.contact.whatsapp) {
				_push(`<li data-v-629d638f><a class="faq__way"${(0, server_renderer_exports.ssrRenderAttr)("href", waHref.value)} rel="noopener" data-v-629d638f>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(`<span data-v-629d638f><span class="faq__way-value tabular" data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.whatsapp)}</span><span class="faq__way-note" data-v-629d638f>WhatsApp</span></span></a></li>`);
			} else _push(`<!---->`);
			_push(`<li data-v-629d638f><a class="faq__way"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${__props.contact.email}`)} data-v-629d638f>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20
			}, null, _parent));
			_push(`<span data-v-629d638f><span class="faq__way-value" data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</span><span class="faq__way-note" data-v-629d638f>${(0, server_renderer_exports.ssrInterpolate)(phone.value ? "E-Mail" : `E-Mail · ${__props.contact.hours}`)}</span></span></a></li></ul><hr class="hr faq__rule" data-v-629d638f><p class="faq__promo" data-v-629d638f>Kompatibilität sofort prüfen</p>`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-629d638f"]]);
//#endregion
export { Index_default as default };
