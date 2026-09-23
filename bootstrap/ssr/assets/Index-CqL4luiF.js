import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as AdminLayout_default } from "./AdminLayout-BezLetQd.js";
//#region resources/js/Pages/Admin/Benachrichtigungen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		subscriptions: {},
		demand: {}
	},
	setup(__props) {
		/**
		* Benachrichtigungen.
		*
		* Two lists from the same rows. The demand list comes first because it answers the question this
		* feature exists for: which Gutachten is worth buying next, ranked by how many confirmed
		* addresses are waiting for it. The full list underneath is for support.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Benachrichtigungen" }, null, _parent));
			_push(`<h1 class="t-h1 ben__title" data-v-a16344e6>Benachrichtigungen</h1><section class="ben__section" aria-labelledby="ben-demand" data-v-a16344e6><h2 id="ben-demand" class="t-h3" data-v-a16344e6>Gefragte Fahrzeuge</h2><p class="t-small ben__lead" data-v-a16344e6>Bestätigte Adressen, die auf ein Gutachten warten – nach Fahrzeug.</p>`);
			if (__props.demand.length === 0) _push(`<p class="quiet" data-v-a16344e6>Noch wartet niemand.</p>`);
			else {
				_push(`<table class="table" data-v-a16344e6><thead data-v-a16344e6><tr data-v-a16344e6><th scope="col" data-v-a16344e6>Fahrzeug</th><th scope="col" data-v-a16344e6>HSN/TSN</th><th scope="col" class="ben__num" data-v-a16344e6>Wartende</th></tr></thead><tbody data-v-a16344e6><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.demand, (row) => {
					_push(`<tr data-v-a16344e6><td data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.vehicle)}</td><td class="tabular" data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.keyNumbers)}</td><td class="tabular ben__num" data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.waiting)}</td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
			}
			_push(`</section><section class="ben__section" aria-labelledby="ben-all" data-v-a16344e6><h2 id="ben-all" class="t-h3" data-v-a16344e6>Alle Eintragungen</h2>`);
			if (__props.subscriptions.length === 0) _push(`<p class="quiet" data-v-a16344e6>Noch keine Eintragungen.</p>`);
			else {
				_push(`<table class="table" data-v-a16344e6><thead data-v-a16344e6><tr data-v-a16344e6><th scope="col" data-v-a16344e6>E-Mail</th><th scope="col" data-v-a16344e6>Fahrzeug</th><th scope="col" data-v-a16344e6>Status</th><th scope="col" data-v-a16344e6>Eingetragen</th><th scope="col" data-v-a16344e6>Benachrichtigt</th></tr></thead><tbody data-v-a16344e6><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.subscriptions, (row) => {
					_push(`<tr data-v-a16344e6><td data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.email)}</td><td data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.vehicle)} <span class="quiet tabular" data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.keyNumbers)}</span></td><td data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.status)}</td><td class="tabular" data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.requestedAt)}</td><td class="tabular" data-v-a16344e6>${(0, server_renderer_exports.ssrInterpolate)(row.notifiedAt ?? "–")}</td></tr>`);
				});
				_push(`<!--]--></tbody></table>`);
			}
			_push(`</section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Benachrichtigungen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Benachrichtigungen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a16344e6"]]);
//#endregion
export { Index_default as default };
