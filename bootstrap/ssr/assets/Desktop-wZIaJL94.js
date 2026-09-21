import { c as __exportAll, n as link_default, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Wheel_default } from "./Wheel-ZekNUHN8.js";
//#region resources/js/Pages/Fehler/Desktop.vue?vue&type=script&setup=true&lang.ts
var Desktop_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Desktop",
	__ssrInlineRender: true,
	props: { status: { default: 404 } },
	setup(__props) {
		/**
		* The error pages, 404 and 500, as one component keyed by status.
		*
		* A 404 that only apologises wastes the visit. This one names three ways forward, because someone
		* who followed a dead link to a wheel still wants a wheel.
		*/
		const props = __props;
		const copy = (0, vue_exports.computed)(() => {
			if (props.status === 503) return {
				title: "Wir sind gleich zurück.",
				body: "RIMIFY wird gerade aktualisiert. Das dauert nur wenige Minuten."
			};
			if (props.status >= 500) return {
				title: "Da ist etwas schiefgelaufen.",
				body: "Der Fehler ist bei uns gelandet und wird angesehen. Versuche es in einem Moment noch einmal."
			};
			if (props.status === 403) return {
				title: "Dafür fehlt die Berechtigung.",
				body: "Diese Seite ist nicht für dein Konto freigegeben."
			};
			return {
				title: "Diese Seite gibt es nicht.",
				body: "Vielleicht wurde sie verschoben. Such dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind."
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: String(__props.status) }, null, _parent));
			_push(`<section class="section err" data-v-0181750a><div class="wrap err__inner" data-v-0181750a><div class="err__art" data-v-0181750a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Wheel_default, {
				spokes: 10,
				finish: "graphite",
				size: 280
			}, null, _parent));
			_push(`</div><p class="data err__code" data-v-0181750a>${(0, server_renderer_exports.ssrInterpolate)(__props.status)}</p><h1 class="t-h1" data-v-0181750a>${(0, server_renderer_exports.ssrInterpolate)(copy.value.title)}</h1><p class="t-body err__body" data-v-0181750a>${(0, server_renderer_exports.ssrInterpolate)(copy.value.body)}</p><div class="cluster err__actions" data-v-0181750a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen-suchen",
				class: "btn btn--primary"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Fahrzeug wählen`);
					else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen",
				class: "btn btn--secondary"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Alle Felgen ansehen`);
					else return [(0, vue_exports.createTextVNode)("Alle Felgen ansehen")];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/kontakt",
				class: "btn btn--quiet"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Kontakt`);
					else return [(0, vue_exports.createTextVNode)("Kontakt")];
				}),
				_: 1
			}, _parent));
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Fehler/Desktop.vue
var Desktop_exports = /* @__PURE__ */ __exportAll({ default: () => Desktop_default });
var _sfc_setup = Desktop_vue_vue_type_script_setup_true_lang_default.setup;
Desktop_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Fehler/Desktop.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Desktop_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Desktop_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0181750a"]]);
//#endregion
export { Desktop_exports as n, Desktop_default as t };
