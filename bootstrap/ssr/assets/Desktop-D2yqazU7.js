import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { n as Photo_default, t as PHOTOS } from "./photos-BD5qS4Lv.js";
import { t as Scene_default } from "./Scene-DzDIGfag.js";
//#region resources/js/Pages/Kontakt/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: { contact: {} },
	setup(__props) {
		/**
		* Kontakt.
		*
		* The stock photograph of a smiling team in a bright office is on the banned list — including the
		* one in the client's own Figma — so the slot is filled by the drawn `werkstatt` scene instead.
		* Every contact detail renders from configuration, never from a literal in this file (D-023).
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kontakt" }, null, _parent));
			_push(`<section class="section" data-v-66ea8f67><div class="wrap kon" data-v-66ea8f67><div data-v-66ea8f67><h1 class="t-h1" data-v-66ea8f67>Kontakt</h1><p class="t-body" data-v-66ea8f67> Fragen zur Freigabe, zur Größe oder zur Lieferung? Schreib uns – oder ruf einfach an. </p><form class="card kon__form" data-v-66ea8f67><div class="kon__grid" data-v-66ea8f67><div data-v-66ea8f67><label class="field-label" for="kon-name" data-v-66ea8f67> Name <span class="field-label__req" data-v-66ea8f67>*</span></label><input id="kon-name" class="field" autocomplete="name" data-v-66ea8f67></div><div data-v-66ea8f67><label class="field-label" for="kon-mail" data-v-66ea8f67> E-Mail <span class="field-label__req" data-v-66ea8f67>*</span></label><input id="kon-mail" class="field" type="email" autocomplete="email" data-v-66ea8f67></div><div class="kon__wide" data-v-66ea8f67><label class="field-label" for="kon-vehicle" data-v-66ea8f67>Fahrzeug</label><input id="kon-vehicle" class="field" placeholder="z. B. Audi RS 4 Avant" data-v-66ea8f67></div><div class="kon__wide" data-v-66ea8f67><label class="field-label" for="kon-msg" data-v-66ea8f67> Nachricht <span class="field-label__req" data-v-66ea8f67>*</span></label><textarea id="kon-msg" class="field" data-v-66ea8f67></textarea></div></div><button class="btn btn--primary kon__send" type="submit" data-v-66ea8f67>Nachricht senden</button></form></div><aside class="stack-4" data-v-66ea8f67><div class="card kon__card" data-v-66ea8f67><div class="kon__art" data-v-66ea8f67>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Photo_default, { photo: (0, vue_exports.unref)(PHOTOS).kontakt }, {
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
			_push(`</div><div class="kon__cardbody" data-v-66ea8f67><span class="micro" data-v-66ea8f67>Telefon</span><p class="kon__value" data-v-66ea8f67>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phoneIntl)}</p><p class="quiet" data-v-66ea8f67>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</p><hr class="hr kon__rule" data-v-66ea8f67><span class="micro" data-v-66ea8f67>WhatsApp</span><p class="kon__value" data-v-66ea8f67>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.whatsapp)}</p><hr class="hr kon__rule" data-v-66ea8f67><span class="micro" data-v-66ea8f67>E-Mail</span><p class="kon__value" data-v-66ea8f67>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</p></div></div><div class="panel--wash kon__note" data-v-66ea8f67>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "phone",
				size: 24
			}, null, _parent));
			_push(`<p class="t-body" data-v-66ea8f67> Fragen beantworten wir am Telefon, nicht per Formularbrief. </p></div></aside></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kontakt/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kontakt/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-66ea8f67"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
