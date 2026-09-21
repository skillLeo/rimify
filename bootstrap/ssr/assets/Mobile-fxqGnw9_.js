import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Wheel_default } from "./Wheel-ZekNUHN8.js";
//#region resources/js/Pages/Fehler/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: { status: { default: 404 } },
	setup(__props) {
		/** The error page on a phone: the same three ways forward, stacked full width. */
		const props = __props;
		const copy = (0, vue_exports.computed)(() => {
			if (props.status === 503) return {
				title: "Wir sind gleich zurück.",
				body: "RIMIFY wird gerade aktualisiert. Das dauert nur wenige Minuten."
			};
			if (props.status >= 500) return {
				title: "Da ist etwas schiefgelaufen.",
				body: "Der Fehler ist bei uns gelandet und wird angesehen."
			};
			if (props.status === 403) return {
				title: "Dafür fehlt die Berechtigung.",
				body: "Diese Seite ist nicht für dein Konto freigegeben."
			};
			return {
				title: "Diese Seite gibt es nicht.",
				body: "Such dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind."
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: String(__props.status) }, null, _parent));
			_push(`<section class="section" data-v-f4e107ce><div class="wrap merr" data-v-f4e107ce><div class="merr__art" data-v-f4e107ce>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Wheel_default, {
				spokes: 10,
				finish: "graphite",
				size: 200
			}, null, _parent));
			_push(`</div><p class="data merr__code" data-v-f4e107ce>${(0, server_renderer_exports.ssrInterpolate)(__props.status)}</p><h1 class="t-h1" data-v-f4e107ce>${(0, server_renderer_exports.ssrInterpolate)(copy.value.title)}</h1><p class="t-body" data-v-f4e107ce>${(0, server_renderer_exports.ssrInterpolate)(copy.value.body)}</p><div class="stack merr__actions" data-v-f4e107ce>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen-suchen",
				class: "btn btn--primary btn--block"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Fahrzeug wählen`);
					else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen",
				class: "btn btn--secondary btn--block"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Alle Felgen ansehen`);
					else return [(0, vue_exports.createTextVNode)("Alle Felgen ansehen")];
				}),
				_: 1
			}, _parent));
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Fehler/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Fehler/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f4e107ce"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
