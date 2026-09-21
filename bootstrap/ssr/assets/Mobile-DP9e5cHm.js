import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { n as Photo_default, t as PHOTOS } from "./photos-BD5qS4Lv.js";
import { t as Scene_default } from "./Scene-DzDIGfag.js";
//#region resources/js/Pages/Kontakt/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: { contact: {} },
	setup(__props) {
		/**
		* Kontakt on a phone: the phone number first as a tap-to-call row, the form beneath it. Someone
		* reaching this page from a bottom-nav tap usually wants to call, not to type.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kontakt" }, null, _parent));
			_push(`<section class="section" data-v-620b225d><div class="wrap" data-v-620b225d><h1 class="t-h1" data-v-620b225d>Kontakt</h1><div class="mkon__art" data-v-620b225d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Photo_default, { photo: (0, vue_exports.unref)(PHOTOS).kontakt }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(Scene_default, {
						name: "werkstatt",
						width: 420
					}, null, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)(Scene_default, {
						name: "werkstatt",
						width: 420
					})];
				}),
				_: 1
			}, _parent));
			_push(`</div><div class="stack mkon__direct" data-v-620b225d><a class="row-item mkon__row"${(0, server_renderer_exports.ssrRenderAttr)("href", `tel:${__props.contact.phoneIntl.replace(/\s/g, "")}`)} data-v-620b225d><span data-v-620b225d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "phone",
				size: 20
			}, null, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phoneIntl)}</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "chevron-right",
				size: 20
			}, null, _parent));
			_push(`</a><a class="row-item mkon__row"${(0, server_renderer_exports.ssrRenderAttr)("href", `https://wa.me/${__props.contact.whatsapp.replace(/[^0-9]/g, "")}`)} data-v-620b225d><span data-v-620b225d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "whatsapp",
				size: 20
			}, null, _parent));
			_push(` WhatsApp</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "chevron-right",
				size: 20
			}, null, _parent));
			_push(`</a><a class="row-item mkon__row"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${__props.contact.email}`)} data-v-620b225d><span data-v-620b225d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20
			}, null, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "chevron-right",
				size: 20
			}, null, _parent));
			_push(`</a></div><p class="quiet mkon__hours" data-v-620b225d>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</p><form class="card mkon__form" data-v-620b225d><div class="stack-4" data-v-620b225d><div data-v-620b225d><label class="field-label" for="mkon-name" data-v-620b225d> Name <span class="field-label__req" data-v-620b225d>*</span></label><input id="mkon-name" class="field" autocomplete="name" data-v-620b225d></div><div data-v-620b225d><label class="field-label" for="mkon-mail" data-v-620b225d> E-Mail <span class="field-label__req" data-v-620b225d>*</span></label><input id="mkon-mail" class="field" type="email" autocomplete="email" data-v-620b225d></div><div data-v-620b225d><label class="field-label" for="mkon-vehicle" data-v-620b225d>Fahrzeug</label><input id="mkon-vehicle" class="field" placeholder="z. B. Audi RS 4 Avant" data-v-620b225d></div><div data-v-620b225d><label class="field-label" for="mkon-msg" data-v-620b225d> Nachricht <span class="field-label__req" data-v-620b225d>*</span></label><textarea id="mkon-msg" class="field" data-v-620b225d></textarea></div><button class="btn btn--primary btn--block" type="submit" data-v-620b225d>Nachricht senden</button></div></form></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kontakt/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kontakt/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-620b225d"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
