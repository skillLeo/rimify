import { t as AppLayout_default } from "./AppLayout-rw2CxFIJ.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Konto/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		email: {},
		orders: {}
	},
	setup(__props) {
		/**
		* Mein Konto: every order placed under the account's address, newest first, each opening its confirmation page with
		* the frozen verdicts and the invoice. Abmelden, and Konto löschen — the orders stay, as the law asks.
		*/
		const confirmDelete = (0, vue_exports.ref)(false);
		/** A request on its way: the buttons wait, and a second press does nothing. */
		const busy = (0, vue_exports.ref)(false);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Mein Konto" }, null, _parent));
			_push(`<section class="section--tight" data-v-427607f4><div class="container" data-v-427607f4><div class="konto" data-v-427607f4><h1 class="h1" data-v-427607f4>Mein Konto</h1><p class="konto__lead" data-v-427607f4>Angemeldet als ${(0, server_renderer_exports.ssrInterpolate)(__props.email)}</p><h2 class="h3 konto__title" data-v-427607f4>Deine Bestellungen</h2>`);
			if (__props.orders.length) {
				_push(`<ul class="konto__orders" data-v-427607f4><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.orders, (order) => {
					_push(`<li data-v-427607f4>`);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: `/bestellung/${order.number}`,
						class: "konto__order"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<span class="konto__number num" data-v-427607f4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.number)}</span><span class="konto__meta" data-v-427607f4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.placedAt)} · ${(0, server_renderer_exports.ssrInterpolate)(order.status)}`);
								if (order.vehicle) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(order.vehicle)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</span><span class="konto__total num" data-v-427607f4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.total)}</span>`);
							} else return [
								(0, vue_exports.createVNode)("span", { class: "konto__number num" }, (0, vue_exports.toDisplayString)(order.number), 1),
								(0, vue_exports.createVNode)("span", { class: "konto__meta" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(order.placedAt) + " · " + (0, vue_exports.toDisplayString)(order.status), 1), order.vehicle ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(order.vehicle), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
								(0, vue_exports.createVNode)("span", { class: "konto__total num" }, (0, vue_exports.toDisplayString)(order.total), 1)
							];
						}),
						_: 2
					}, _parent));
					_push(`</li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<p class="konto__lead" data-v-427607f4>Unter dieser Adresse gibt es noch keine Bestellung.</p>`);
			_push(`<div class="konto__actions" data-v-427607f4><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-427607f4>Abmelden</button>`);
			if (!confirmDelete.value) _push(`<button class="btn btn--quiet" type="button" data-v-427607f4>Konto löschen …</button>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (confirmDelete.value) _push(`<div class="konto__delete" role="alert" data-v-427607f4><p data-v-427607f4> Wenn du dein Konto löschst, bewahren wir Bestellungen und Rechnungen auf, solange wir gesetzlich dazu verpflichtet sind. Deine Rechnungen findest du im Anhang deiner Bestellbestätigungen. </p><div class="konto__actions" data-v-427607f4><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-427607f4>Konto endgültig löschen</button><button class="btn btn--secondary" type="button" data-v-427607f4>Behalten</button></div></div>`);
			else _push(`<!---->`);
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Konto/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Konto/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-427607f4"]]);
//#endregion
export { Index_default as default };
