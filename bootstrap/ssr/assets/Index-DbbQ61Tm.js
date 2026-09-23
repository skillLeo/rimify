import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as AppLayout_default } from "./AppLayout-BVlt5D4s.js";
//#region resources/js/Pages/Fehler/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: { status: { default: 404 } },
	setup(__props) {
		/**
		* The error pages — 404, 403, 500 and 503 — as one component keyed by status.
		*
		* Rendered by the exception handler in bootstrap/app.php, inside the storefront frame, so the
		* header, the basket and the chosen vehicle all survive a dead link. A 404 that only apologises
		* wastes the visit: this one names the way back to the one task the shop exists for.
		*
		* The status code is a status word, so it is the one place above an H1 where the micro-label is
		* legitimate — it states a fact, it does not decorate the heading.
		*
		* One page for every width.
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
				title: "Diese Seite gibt es nicht mehr.",
				body: "Vielleicht wurde sie verschoben. Such dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind."
			};
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: String(__props.status) }, null, _parent));
			_push(`<section class="section err" data-v-f48448fd><div class="wrap" data-v-f48448fd><p class="micro" data-v-f48448fd>Fehler <span class="tabular" data-v-f48448fd>${(0, server_renderer_exports.ssrInterpolate)(__props.status)}</span></p><h1 class="t-h1 err__title" data-v-f48448fd>${(0, server_renderer_exports.ssrInterpolate)(copy.value.title)}</h1><p class="t-body err__body" data-v-f48448fd>${(0, server_renderer_exports.ssrInterpolate)(copy.value.body)}</p><div class="err__actions" data-v-f48448fd>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgen-suchen",
				class: "btn btn--primary"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zurück zur Felgensuche`);
					else return [(0, vue_exports.createTextVNode)("Zurück zur Felgensuche")];
				}),
				_: 1
			}, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/",
				class: "btn btn--secondary"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Zur Startseite`);
					else return [(0, vue_exports.createTextVNode)("Zur Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`</div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Fehler/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Fehler/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f48448fd"]]);
//#endregion
export { Index_default as default };
