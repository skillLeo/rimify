import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { n as Photo_default, t as PHOTOS } from "./photos-BD5qS4Lv.js";
import { t as Scene_default } from "./Scene-DzDIGfag.js";
//#region resources/js/Pages/Faq/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: {
		groups: {},
		contact: {}
	},
	setup(__props) {
		/**
		* The FAQ. Groups from the database, so marketing adds an answer without a deployment.
		*
		* This is one of the pages that shows the blue bar rather than the white box: a visitor with a car
		* chosen is not inside the buying process here, and restating their vehicle in the black header
		* would imply this page is about it.
		*/
		const open = (0, vue_exports.ref)(null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Meistgestellte Fragen" }, null, _parent));
			_push(`<section class="section" data-v-ed4c91e5><div class="wrap faq" data-v-ed4c91e5><div data-v-ed4c91e5><h1 class="t-h1" data-v-ed4c91e5>Meistgestellte Fragen</h1><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.groups, (group) => {
				_push(`<div class="faq__group" data-v-ed4c91e5><p class="micro" data-v-ed4c91e5>${(0, server_renderer_exports.ssrInterpolate)(group.key)}</p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(group.entries, (entry) => {
					_push(`<div class="acc" data-v-ed4c91e5><button class="acc__head" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", open.value === entry.id)} data-v-ed4c91e5>${(0, server_renderer_exports.ssrInterpolate)(entry.question)} `);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: open.value === entry.id ? "minus" : "plus",
						size: 20
					}, null, _parent));
					_push(`</button>`);
					if (open.value === entry.id) _push(`<div class="acc__body t-body" data-v-ed4c91e5>${(0, server_renderer_exports.ssrInterpolate)(entry.answer)}</div>`);
					else _push(`<!---->`);
					_push(`</div>`);
				});
				_push(`<!--]--></div>`);
			});
			_push(`<!--]--></div><aside class="card faq__help" data-v-ed4c91e5><div class="faq__art" data-v-ed4c91e5>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Photo_default, { photo: (0, vue_exports.unref)(PHOTOS).werkstatt }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(Scene_default, {
						name: "werkstatt",
						width: 480
					}, null, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)(Scene_default, {
						name: "werkstatt",
						width: 480
					})];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="faq__helpbody" data-v-ed4c91e5><h2 class="t-h3" data-v-ed4c91e5>Weitere Fragen oder Unterstützung benötigt?</h2><p class="faq__phone" data-v-ed4c91e5>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phone)}</p><p class="quiet" data-v-ed4c91e5>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</p><p class="t-body" data-v-ed4c91e5>Wir freuen uns von dir zu hören.</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/kontakt",
				class: "btn btn--secondary btn--block"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zum Kontaktformular`);
					else return [(0, vue_exports.createTextVNode)("Zum Kontaktformular")];
				}),
				_: 1
			}, _parent));
			_push(`</div></aside></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Faq/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Faq/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ed4c91e5"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
