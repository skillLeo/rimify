import { c as __exportAll, s as vue_exports, t as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as RevenueChart_default } from "./RevenueChart-YccFpOwz.js";
//#region resources/js/Pages/Admin/Dashboard/Mobile.vue?vue&type=script&setup=true&lang.ts
var Mobile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Mobile",
	__ssrInlineRender: true,
	props: {
		tiles: {},
		revenue: {},
		conflicts: {}
	},
	setup(__props) {
		const points = __props.revenue.map((r) => ({
			label: r.label,
			value: r.value
		}));
		const KIND_LABEL = {
			ENTRY_REQUIREMENT: "Eintragungspflicht",
			TYRE_SIZES: "Reifengrößen",
			WIDTH_ET_RANGE: "Breite / ET",
			CONDITIONS: "Auflagen"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Dashboard" }, null, _parent));
			_push(`<div class="tiles" data-v-ba6c456b><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.tiles, (tile) => {
				_push(`<article class="tile" data-v-ba6c456b><span class="micro" data-v-ba6c456b>${(0, server_renderer_exports.ssrInterpolate)(tile.label)}</span><p class="tile__value" data-v-ba6c456b>${(0, server_renderer_exports.ssrInterpolate)(tile.value)}</p></article>`);
			});
			_push(`<!--]--></div><section class="card mdash__chart" data-v-ba6c456b><span class="micro" data-v-ba6c456b>Umsatz, 12 Monate</span>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RevenueChart_default, {
				points: (0, vue_exports.unref)(points),
				width: 360,
				height: 180
			}, null, _parent));
			_push(`</section><section class="stack mdash__conflicts" data-v-ba6c456b><span class="micro" data-v-ba6c456b>Offene Konflikte</span><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.conflicts, (conflict) => {
				_push(`<article class="card mdash__conflict" data-v-ba6c456b><p class="mdash__vehicle" data-v-ba6c456b>${(0, server_renderer_exports.ssrInterpolate)(conflict.vehicle)}</p><span class="data" data-v-ba6c456b>${(0, server_renderer_exports.ssrInterpolate)(conflict.keyNumbers)}</span><span class="${(0, server_renderer_exports.ssrRenderClass)([conflict.blocking ? "tag--danger" : "tag--warn", "tag mdash__tag"])}" data-v-ba6c456b>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[conflict.kind] ?? conflict.kind)}</span></article>`);
			});
			_push(`<!--]-->`);
			if (__props.conflicts.length === 0) _push(`<p class="quiet" data-v-ba6c456b>Keine offenen Konflikte.</p>`);
			else _push(`<!---->`);
			_push(`</section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Dashboard/Mobile.vue
var Mobile_exports = /* @__PURE__ */ __exportAll({ default: () => Mobile_default });
var _sfc_setup = Mobile_vue_vue_type_script_setup_true_lang_default.setup;
Mobile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Dashboard/Mobile.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Mobile_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Mobile_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ba6c456b"]]);
//#endregion
export { Mobile_exports as n, Mobile_default as t };
